<?php

declare(strict_types=1);

namespace Schulbuch\Controller;

use DateTimeImmutable;
use DateTimeZone;
use Schulbuch\Database;
use Schulbuch\Http\HttpException;
use Schulbuch\Http\Request;
use Schulbuch\Http\Response;
use Schulbuch\Repository\PollRepository;
use Schulbuch\Service\Auth;
use Schulbuch\Service\PollValidator;
use Schulbuch\Service\Validator;
use Throwable;

/**
 * Werkzeug „Umfragen“. Lehrkräfte legen Umfragen an und führen sie durch; Schülerinnen und Schüler
 * nehmen ohne Konto mit einem Code teil (zufällige Teilnahme-Kennung aus dem Browser, keine Namen).
 */
final class PollController
{
    public const EXPORT_FORMAT = 'online-schulbuch-umfrage';
    /** Mehr Teilnehmende pro Durchführung werden abgewiesen (Schutz vor Missbrauch). */
    public const MAX_PARTICIPANTS = 300;

    public function __construct(
        private Auth $auth,
        private PollRepository $polls,
    ) {
    }

    // ------------------------------------------------------------ Lehrkräfte: Umfragen

    public function index(): Response
    {
        $teacher = $this->auth->requireTeacher();
        $this->polls->deleteInactive();
        return Response::json(['polls' => array_map([$this, 'pollPayload'], $this->polls->forTeacher($teacher['id']))]);
    }

    /** @param array<string, string> $params */
    public function show(Request $request, array $params): Response
    {
        $teacher = $this->auth->requireTeacher();
        return Response::json(['poll' => $this->pollPayload($this->polls->forTeacherOne($teacher['id'], $this->ownPoll($teacher, $params['id'])['id']))]);
    }

    public function create(Request $request): Response
    {
        $teacher = $this->auth->requireTeacher();
        $body = $request->json();
        $poll = PollValidator::poll($body);
        $source = is_string($body['source'] ?? null) ? mb_substr(trim($body['source']), 0, 255) : null;
        $id = $this->polls->create($teacher['id'], $poll, $source === '' ? null : $source);
        return Response::json(['poll' => $this->pollPayload($this->polls->forTeacherOne($teacher['id'], $id))], 201);
    }

    /** @param array<string, string> $params */
    public function update(Request $request, array $params): Response
    {
        $teacher = $this->auth->requireTeacher();
        $poll = $this->ownPoll($teacher, $params['id']);
        $this->polls->update($poll['id'], PollValidator::poll($request->json()));
        return Response::json(['poll' => $this->pollPayload($this->polls->forTeacherOne($teacher['id'], $poll['id']))]);
    }

    /** @param array<string, string> $params */
    public function delete(Request $request, array $params): Response
    {
        $teacher = $this->auth->requireTeacher();
        $this->polls->delete($this->ownPoll($teacher, $params['id'])['id']);
        return Response::noContent();
    }

    /** Vollständige Umfrage mit allen Durchführungen und Antworten – zum lokalen Speichern. */
    public function export(Request $request, array $params): Response
    {
        $teacher = $this->auth->requireTeacher();
        $poll = $this->ownPoll($teacher, $params['id']);
        $runs = [];
        foreach ($this->polls->runsWithAnswers($poll['id']) as $run) {
            // Teilnahme-Kennungen durch kurze, neutrale ersetzen
            $alias = [];
            $runs[] = [
                'mode' => $run['mode'],
                'countdown' => $run['countdown'],
                'questions' => $run['questions'],
                'startedAt' => Database::toIso($run['startedAt']),
                'endedAt' => Database::toIso($run['endedAt'] ?? $run['startedAt']),
                'answers' => array_map(static function (array $a) use (&$alias): array {
                    $alias[$a['participant']] ??= 't' . (count($alias) + 1);
                    return [
                        'participant' => $alias[$a['participant']],
                        'question' => (string) $a['question'],
                        'value' => (float) $a['answer_value'],
                        'at' => Database::toIso((string) $a['created_at']),
                    ];
                }, $run['answers']),
            ];
        }
        return Response::json([
            'format' => self::EXPORT_FORMAT,
            'version' => 1,
            'exportedAt' => Database::toIso(Database::now()),
            'poll' => [
                'title' => $poll['title'],
                'mode' => $poll['mode'],
                'countdown' => $poll['countdown'],
                'questions' => $poll['questions'],
                'source' => $poll['source'],
                'createdAt' => Database::toIso($poll['createdAt']),
            ],
            'runs' => $runs,
        ]);
    }

    /** Stellt eine exportierte Umfrage samt Ergebnissen wieder her (als neue Umfrage). */
    public function import(Request $request): Response
    {
        $teacher = $this->auth->requireTeacher();
        $data = $request->json();
        if (($data['format'] ?? null) !== self::EXPORT_FORMAT || !is_array($data['poll'] ?? null)) {
            throw HttpException::badRequest('Das ist keine exportierte Umfrage aus dem Online-Schulbuch.');
        }
        $poll = PollValidator::poll($data['poll']);
        $source = is_string($data['poll']['source'] ?? null) ? mb_substr($data['poll']['source'], 0, 255) : null;

        $runs = [];
        $rawRuns = $data['runs'] ?? [];
        if (!is_array($rawRuns) || count($rawRuns) > 500) {
            throw HttpException::badRequest('Die Datei enthält zu viele oder ungültige Durchführungen.');
        }
        foreach ($rawRuns as $raw) {
            if (!is_array($raw)) {
                throw HttpException::badRequest('Ungültige Durchführung in der Datei.');
            }
            $questions = PollValidator::questions($raw['questions'] ?? null);
            $byId = array_column($questions, null, 'id');
            $answers = [];
            $seen = [];
            $rawAnswers = $raw['answers'] ?? [];
            if (!is_array($rawAnswers) || count($rawAnswers) > 50000) {
                throw HttpException::badRequest('Die Datei enthält zu viele oder ungültige Antworten.');
            }
            foreach ($rawAnswers as $a) {
                $participant = is_array($a) && is_string($a['participant'] ?? null) ? substr($a['participant'], 0, 16) : '';
                $question = is_array($a) && is_string($a['question'] ?? null) ? $a['question'] : '';
                if ($participant === '' || !isset($byId[$question]) || isset($seen[$participant][$question])) {
                    continue;
                }
                $value = $a['value'] ?? null;
                if ($byId[$question]['type'] === 'choice' && is_float($value) && floor($value) === $value) {
                    $value = (int) $value;
                }
                try {
                    $value = PollValidator::answer($byId[$question], $value);
                } catch (HttpException) {
                    continue;
                }
                $seen[$participant][$question] = true;
                $answers[] = ['participant' => $participant, 'question' => $question, 'value' => $value, 'at' => self::fromIso($a['at'] ?? null)];
            }
            $started = self::fromIso($raw['startedAt'] ?? null);
            $runs[] = [
                'mode' => in_array($raw['mode'] ?? null, PollValidator::MODES, true) ? $raw['mode'] : 'single',
                'countdown' => is_int($raw['countdown'] ?? null) ? max(0, min(PollValidator::MAX_COUNTDOWN, $raw['countdown'])) : 0,
                'questions' => $questions,
                'startedAt' => $started,
                'endedAt' => isset($raw['endedAt']) ? self::fromIso($raw['endedAt']) : $started,
                'answers' => $answers,
            ];
        }

        $created = isset($data['poll']['createdAt']) ? self::fromIso($data['poll']['createdAt']) : null;
        $id = $this->polls->create($teacher['id'], $poll, $source, $created);
        foreach ($runs as $run) {
            $this->polls->importRun($id, $run);
        }
        return Response::json(['poll' => $this->pollPayload($this->polls->forTeacherOne($teacher['id'], $id))], 201);
    }

    // ------------------------------------------------------------ Lehrkräfte: Durchführung

    /** @param array<string, string> $params */
    public function startRun(Request $request, array $params): Response
    {
        $teacher = $this->auth->requireTeacher();
        $poll = $this->ownPoll($teacher, $params['id']);
        $body = $request->json();
        $mode = $body['mode'] ?? $poll['mode'];
        if (!in_array($mode, PollValidator::MODES, true)) {
            throw HttpException::badRequest('Unbekannter Modus.');
        }
        $countdown = array_key_exists('countdown', $body) ? PollValidator::countdown($body['countdown']) : $poll['countdown'];
        $runId = $this->polls->startRun($poll, $mode, $countdown);
        return Response::json(['run' => $this->runPayload($this->polls->findRun($runId))], 201);
    }

    /** Stand der Durchführung mit allen Antworten (die Lehrkraft fragt ihn alle paar Sekunden ab). */
    public function showRun(Request $request, array $params): Response
    {
        $teacher = $this->auth->requireTeacher();
        $run = $this->polls->advanceIfDue($this->ownRun($teacher, $params['id']));
        return Response::json(['run' => $this->runPayload($run)]);
    }

    /**
     * Steuerung: {"current": n} wechselt die Frage, {"countdown": s} stellt den Countdown neu ein,
     * {"end": true} beendet die Durchführung (der Code wird frei).
     */
    public function updateRun(Request $request, array $params): Response
    {
        $teacher = $this->auth->requireTeacher();
        $run = $this->ownRun($teacher, $params['id']);
        $body = $request->json();
        if ($run['endedAt'] !== null && $body !== []) {
            throw HttpException::conflict('Diese Durchführung ist bereits beendet.');
        }
        if (array_key_exists('current', $body)) {
            $current = $body['current'];
            if (!is_int($current) || $current < 0 || $current >= count($run['questions'])) {
                throw HttpException::badRequest('Ungültige Frage.');
            }
            $this->polls->setQuestion($run['id'], $current);
        }
        if (array_key_exists('countdown', $body)) {
            $this->polls->setCountdown($run['id'], PollValidator::countdown($body['countdown']));
        }
        if (($body['end'] ?? false) === true) {
            $this->polls->endRun($run['id']);
            $this->polls->touch($run['pollId']);
        }
        return Response::json(['run' => $this->runPayload($this->polls->findRun($run['id']))]);
    }

    /** @param array<string, string> $params */
    public function deleteRun(Request $request, array $params): Response
    {
        $teacher = $this->auth->requireTeacher();
        $this->polls->deleteRun($this->ownRun($teacher, $params['id'])['id']);
        return Response::noContent();
    }

    // ------------------------------------------------------------ Teilnahme (ohne Konto)

    /** @param array<string, string> $params */
    public function join(Request $request, array $params): Response
    {
        $run = $this->polls->advanceIfDue($this->runByCode($params['code']));
        $participant = self::participant($request->query('participant'), false);
        $poll = $this->polls->find($run['pollId']);
        $questions = array_map([self::class, 'publicQuestion'], $run['questions']);
        return Response::json([
            'code' => $run['code'],
            'title' => $poll['title'] ?? '',
            'mode' => $run['mode'],
            'total' => count($questions),
            'current' => $run['current'],
            'remaining' => $this->remaining($run),
            'questions' => $run['mode'] === 'single' ? [$questions[$run['current']]] : $questions,
            'answers' => $participant === null ? (object) [] : (object) $this->polls->answersOf($run['id'], $participant),
        ]);
    }

    /** @param array<string, string> $params */
    public function answer(Request $request, array $params): Response
    {
        $run = $this->polls->advanceIfDue($this->runByCode($params['code']));
        $body = $request->json();
        $participant = self::participant($body['participant'] ?? null, true);
        $raw = $body['answers'] ?? null;
        if (!is_array($raw) || $raw === [] || array_is_list($raw)) {
            throw HttpException::badRequest('Keine Antworten übermittelt.');
        }
        $byId = array_column($run['questions'], null, 'id');
        $allowed = $run['mode'] === 'single' ? [$run['questions'][$run['current']]['id'] => true] : $byId;
        $answers = [];
        foreach ($raw as $questionId => $value) {
            $questionId = (string) $questionId;
            if (!isset($byId[$questionId])) {
                throw HttpException::badRequest('Unbekannte Frage.');
            }
            if (!isset($allowed[$questionId])) {
                throw HttpException::conflict('Diese Frage ist gerade nicht freigegeben.');
            }
            $answers[$questionId] = PollValidator::answer($byId[$questionId], $value);
        }
        if (!$this->polls->hasParticipant($run['id'], $participant)
            && $this->polls->participantCount($run['id']) >= self::MAX_PARTICIPANTS) {
            throw HttpException::conflict('An dieser Umfrage nehmen schon zu viele Personen teil.');
        }
        $this->polls->saveAnswers($run['id'], $participant, $answers);
        return Response::json(['answers' => (object) $this->polls->answersOf($run['id'], $participant)]);
    }

    // ------------------------------------------------------------ Hilfen

    /**
     * @param array<string, mixed> $teacher
     * @return array<string, mixed>
     */
    private function ownPoll(array $teacher, string $id): array
    {
        $poll = $this->polls->find(Validator::positiveInt($id, 'ID'));
        if ($poll === null || $poll['teacherId'] !== $teacher['id']) {
            throw HttpException::notFound('Umfrage nicht gefunden.');
        }
        return $poll;
    }

    /**
     * @param array<string, mixed> $teacher
     * @return array<string, mixed>
     */
    private function ownRun(array $teacher, string $id): array
    {
        $run = $this->polls->findRun(Validator::positiveInt($id, 'ID'));
        if ($run === null) {
            throw HttpException::notFound('Durchführung nicht gefunden.');
        }
        $this->ownPoll($teacher, (string) $run['pollId']);
        return $run;
    }

    /** @return array<string, mixed> */
    private function runByCode(string $code): array
    {
        $run = preg_match('/^\d{6}$/', $code) ? $this->polls->findRunByCode($code) : null;
        if ($run === null) {
            throw HttpException::notFound('Zu diesem Code läuft gerade keine Umfrage.');
        }
        return $run;
    }

    private static function participant(mixed $value, bool $required): ?string
    {
        if (is_string($value) && preg_match('/^[a-z0-9]{16}$/', $value)) {
            return $value;
        }
        if ($required) {
            throw HttpException::badRequest('Ungültige Teilnahme-Kennung.');
        }
        return null;
    }

    /** Frage ohne Lösung (für Teilnehmende). */
    private static function publicQuestion(array $question): array
    {
        unset($question['correct']);
        return $question;
    }

    /** @param array<string, mixed> $run */
    private function remaining(array $run): ?int
    {
        if ($run['mode'] !== 'single' || $run['countdown'] <= 0 || $run['endedAt'] !== null) {
            return null;
        }
        $since = new DateTimeImmutable($run['questionSince'], new DateTimeZone('UTC'));
        $elapsed = time() - $since->getTimestamp();
        return max(0, $run['countdown'] - $elapsed);
    }

    /** @param array<string, mixed>|null $poll */
    private function pollPayload(?array $poll): array
    {
        if ($poll === null) {
            throw HttpException::notFound('Umfrage nicht gefunden.');
        }
        $deletesAt = (new DateTimeImmutable($poll['activeAt'], new DateTimeZone('UTC')))
            ->modify('+' . PollRepository::KEEP_DAYS . ' days')->format('Y-m-d H:i:s.v');
        return [
            'id' => $poll['id'],
            'title' => $poll['title'],
            'mode' => $poll['mode'],
            'countdown' => $poll['countdown'],
            'questions' => $poll['questions'],
            'source' => $poll['source'],
            'createdAt' => Database::toIso($poll['createdAt']),
            'updatedAt' => Database::toIso($poll['updatedAt']),
            'activeAt' => Database::toIso($poll['activeAt']),
            'deletesAt' => Database::toIso($deletesAt),
            'runs' => array_map(static fn (array $r): array => [
                'id' => (int) $r['id'],
                'code' => $r['code'] === null ? null : (string) $r['code'],
                'mode' => (string) $r['mode'],
                'startedAt' => Database::toIso((string) $r['started_at']),
                'endedAt' => $r['ended_at'] === null ? null : Database::toIso((string) $r['ended_at']),
                'participants' => (int) $r['participants'],
            ], $poll['runs'] ?? []),
        ];
    }

    /** @param array<string, mixed>|null $run */
    private function runPayload(?array $run): array
    {
        if ($run === null) {
            throw HttpException::notFound('Durchführung nicht gefunden.');
        }
        $poll = $this->polls->find($run['pollId']);
        return [
            'id' => $run['id'],
            'pollId' => $run['pollId'],
            'title' => $poll['title'] ?? '',
            'code' => $run['code'],
            'mode' => $run['mode'],
            'countdown' => $run['countdown'],
            'questions' => $run['questions'],
            'current' => $run['current'],
            'remaining' => $this->remaining($run),
            'startedAt' => Database::toIso($run['startedAt']),
            'endedAt' => $run['endedAt'] === null ? null : Database::toIso($run['endedAt']),
            'participants' => $this->polls->participantCount($run['id']),
            'answers' => (object) $this->polls->answers($run['id']),
        ];
    }

    /** ISO-Zeitpunkt aus einer Exportdatei ins Datenbankformat; Ungültiges wird zu „jetzt“. */
    private static function fromIso(mixed $value): string
    {
        try {
            if (is_string($value) && $value !== '') {
                return (new DateTimeImmutable($value))->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d H:i:s.v');
            }
        } catch (Throwable) {
            // unten: jetzt
        }
        return Database::now();
    }
}
