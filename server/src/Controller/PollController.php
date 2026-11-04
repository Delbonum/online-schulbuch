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
 * Live-Werkzeuge: Umfragen (poll), Wortwolken (wordcloud), Quiz (quiz) und Evaluationen (evaluation).
 * Lehrkräfte legen Einträge an und führen sie durch; Schülerinnen und Schüler nehmen ohne Konto mit einem Code
 * teil (zufällige Teilnahme-Kennung aus dem Browser, beim Quiz zusätzlich ein frei gewählter Spielname).
 *
 * Evaluationen sind anonym: Antworten werden ohne Verbindung zur Teilnahme-Kennung gespeichert, und die
 * Lehrkraft sieht die Ergebnisse erst nach dem Ende – und nur, wenn genug Rückmeldungen da sind.
 */
final class PollController
{
    public const EXPORT_FORMAT = 'online-schulbuch-umfrage';
    /** Mehr Teilnehmende pro Durchführung werden abgewiesen (Schutz vor Missbrauch). */
    public const MAX_PARTICIPANTS = 300;
    /** Kulanz für Quiz-Antworten, die knapp nach Ablauf der Zeit eintreffen (Netzwerk) */
    private const QUIZ_GRACE_MS = 1500;

    public function __construct(
        private Auth $auth,
        private PollRepository $polls,
    ) {
    }

    // ------------------------------------------------------------ Lehrkräfte: Einträge

    public function index(Request $request): Response
    {
        $teacher = $this->auth->requireTeacher();
        $this->polls->deleteInactive();
        $kind = $request->query('kind');
        $kind = $kind === null ? null : PollValidator::kind($kind);
        return Response::json(['polls' => array_map([$this, 'pollPayload'], $this->polls->forTeacher($teacher['id'], $kind))]);
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
        $kind = PollValidator::kind($body['kind'] ?? 'poll');
        $poll = PollValidator::poll($body, $kind);
        $source = is_string($body['source'] ?? null) ? mb_substr(trim($body['source']), 0, 255) : null;
        $id = $this->polls->create($teacher['id'], $poll, $source === '' ? null : $source, null, $kind);
        return Response::json(['poll' => $this->pollPayload($this->polls->forTeacherOne($teacher['id'], $id))], 201);
    }

    /** @param array<string, string> $params */
    public function update(Request $request, array $params): Response
    {
        $teacher = $this->auth->requireTeacher();
        $poll = $this->ownPoll($teacher, $params['id']);
        $this->polls->update($poll['id'], PollValidator::poll($request->json(), $poll['kind']));
        return Response::json(['poll' => $this->pollPayload($this->polls->forTeacherOne($teacher['id'], $poll['id']))]);
    }

    /** @param array<string, string> $params */
    public function delete(Request $request, array $params): Response
    {
        $teacher = $this->auth->requireTeacher();
        $this->polls->delete($this->ownPoll($teacher, $params['id'])['id']);
        return Response::noContent();
    }

    /** Vollständiger Eintrag mit allen Durchführungen und Antworten – zum lokalen Speichern. */
    public function export(Request $request, array $params): Response
    {
        $teacher = $this->auth->requireTeacher();
        $poll = $this->ownPoll($teacher, $params['id']);
        $runs = [];
        foreach ($this->polls->runsWithAnswers($poll['id']) as $run) {
            $rows = $run['answerRows'];
            // Evaluation: Antworten nur aus beendeten Durchführungen mit genug Rückmeldungen (sonst wäre die Datei ein
            // Weg, die Anonymitätsgrenze zu umgehen) und ohne Zeitpunkte
            if ($run['kind'] === 'evaluation' && !$this->evaluationVisible($run)) {
                $rows = [];
            }
            $alias = [];
            $prefix = $run['kind'] === 'evaluation' ? 'r' : 't';
            $name = static function (string $p) use (&$alias, $prefix): string {
                return $alias[$p] ??= $prefix . (count($alias) + 1);
            };
            $players = array_map(static fn (array $p): array => ['participant' => $name($p['participant']), 'nickname' => $p['nickname']], $run['players']);
            $evaluation = $run['kind'] === 'evaluation';
            $runs[] = [
                'kind' => $run['kind'],
                'mode' => $run['mode'],
                'countdown' => $run['countdown'],
                'questions' => $run['questions'],
                'settings' => (object) $run['settings'],
                'startedAt' => Database::toIso($run['startedAt']),
                'endedAt' => Database::toIso($run['endedAt'] ?? $run['startedAt']),
                'players' => $players,
                'answers' => array_map(static fn (array $a): array => array_filter([
                    'participant' => $name($a['participant']),
                    'question' => $a['question'],
                    'value' => $a['value'],
                    'text' => $a['text'],
                    'ms' => $a['ms'],
                    'at' => $evaluation ? null : Database::toIso($a['at']),
                ], static fn ($v): bool => $v !== null), $rows),
            ];
        }
        return Response::json([
            'format' => self::EXPORT_FORMAT,
            'version' => 2,
            'exportedAt' => Database::toIso(Database::now()),
            'kind' => $poll['kind'],
            'poll' => [
                'kind' => $poll['kind'],
                'title' => $poll['title'],
                'mode' => $poll['mode'],
                'countdown' => $poll['countdown'],
                'questions' => $poll['questions'],
                'settings' => (object) $poll['settings'],
                'source' => $poll['source'],
                'createdAt' => Database::toIso($poll['createdAt']),
            ],
            'runs' => $runs,
        ]);
    }

    /** Stellt einen exportierten Eintrag samt Ergebnissen wieder her (als neuen Eintrag). */
    public function import(Request $request): Response
    {
        $teacher = $this->auth->requireTeacher();
        $data = $request->json();
        if (($data['format'] ?? null) !== self::EXPORT_FORMAT || !is_array($data['poll'] ?? null)) {
            throw HttpException::badRequest('Das ist keine exportierte Datei der Live-Werkzeuge des Online-Schulbuchs.');
        }
        $kind = PollValidator::kind($data['poll']['kind'] ?? $data['kind'] ?? 'poll');
        $poll = PollValidator::poll($data['poll'], $kind);
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
            $questions = PollValidator::questions($raw['questions'] ?? null, $kind);
            $byId = array_column($questions, null, 'id');
            $started = self::fromIso($raw['startedAt'] ?? null);
            $players = [];
            $namen = [];
            foreach (is_array($raw['players'] ?? null) ? $raw['players'] : [] as $p) {
                $participant = is_array($p) && is_string($p['participant'] ?? null) ? substr($p['participant'], 0, 16) : '';
                $nickname = is_array($p) && is_string($p['nickname'] ?? null) ? mb_substr(trim($p['nickname']), 0, 20) : '';
                if ($kind === 'quiz' && $participant !== '' && $nickname !== '' && !isset($namen[mb_strtolower($nickname)])) {
                    $namen[mb_strtolower($nickname)] = true;
                    $players[$participant] = ['participant' => $participant, 'nickname' => $nickname];
                }
            }
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
                if ($kind === 'quiz' && !isset($players[$participant])) {
                    continue;
                }
                $q = $byId[$question];
                try {
                    [$value, $text] = match ($q['type']) {
                        'words' => [0.0, implode("\n", PollValidator::words(['maxLength' => 80] + $q, explode("\n", (string) ($a['text'] ?? ''))))],
                        'text' => [0.0, PollValidator::text($q, $a['text'] ?? null)],
                        default => [PollValidator::answer($q, self::number($q, $a['value'] ?? null)), null],
                    };
                } catch (HttpException) {
                    continue;
                }
                if ($q['type'] === 'words') {
                    $value = (float) count(explode("\n", $text));
                }
                $seen[$participant][$question] = true;
                $ms = is_int($a['ms'] ?? null) ? max(0, $a['ms']) : null;
                $answers[] = ['participant' => $participant, 'question' => $question, 'value' => $value, 'text' => $text,
                    'ms' => $kind === 'quiz' ? ($ms ?? 0) : null, 'at' => $kind === 'evaluation' ? $started : self::fromIso($a['at'] ?? null)];
            }
            $settings = PollValidator::settings($raw['settings'] ?? [], $kind);
            if ($kind === 'wordcloud') {
                $hidden = is_array($raw['settings']['hidden'] ?? null) ? $raw['settings']['hidden'] : [];
                $settings['hidden'] = array_values(array_filter($hidden, static fn ($h): bool => is_array($h) && is_string($h['question'] ?? null) && is_string($h['word'] ?? null)));
            }
            $runs[] = [
                'kind' => $kind,
                'mode' => $kind === 'poll' && in_array($raw['mode'] ?? null, PollValidator::MODES, true) ? $raw['mode'] : $poll['mode'],
                'countdown' => is_int($raw['countdown'] ?? null) ? max(0, min(PollValidator::MAX_COUNTDOWN, $raw['countdown'])) : 0,
                'questions' => $questions,
                'settings' => $settings,
                'startedAt' => $started,
                'endedAt' => isset($raw['endedAt']) ? self::fromIso($raw['endedAt']) : $started,
                'players' => array_values($players),
                'answers' => $answers,
            ];
        }

        $created = isset($data['poll']['createdAt']) ? self::fromIso($data['poll']['createdAt']) : null;
        $id = $this->polls->create($teacher['id'], $poll, $source, $created, $kind);
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
        $mode = $poll['kind'] === 'poll' ? ($body['mode'] ?? $poll['mode']) : $poll['mode'];
        if (!in_array($mode, PollValidator::MODES, true)) {
            throw HttpException::badRequest('Unbekannter Modus.');
        }
        $countdown = $poll['kind'] !== 'poll' ? 0
            : (array_key_exists('countdown', $body) ? PollValidator::countdown($body['countdown']) : $poll['countdown']);
        $runId = $this->polls->startRun($poll, $mode, $countdown);
        return Response::json(['run' => $this->runPayload($this->polls->findRun($runId))], 201);
    }

    /** Stand der Durchführung (die Lehrkraft fragt ihn alle paar Sekunden ab). */
    public function showRun(Request $request, array $params): Response
    {
        $teacher = $this->auth->requireTeacher();
        return Response::json(['run' => $this->runPayload($this->advance($this->ownRun($teacher, $params['id'])))]);
    }

    /**
     * Steuerung der Durchführung, je nach Werkzeug:
     *   alle:       {"end": true} beendet die Durchführung (der Code wird frei)
     *   Umfrage:    {"current": n}, {"countdown": s}
     *   Wortwolke:  {"current": n}, {"hide": {"question", "word"}}, {"show": {"question", "word"}}
     *   Quiz:       {"start": n} (Frage n zeigen), {"phase": "reveal"|"leaderboard"|"end"}, {"kick": Kennung}
     */
    public function updateRun(Request $request, array $params): Response
    {
        $teacher = $this->auth->requireTeacher();
        $run = $this->ownRun($teacher, $params['id']);
        $body = $request->json();
        if ($run['endedAt'] !== null && $body !== []) {
            throw HttpException::conflict('Diese Durchführung ist bereits beendet.');
        }
        $anzahl = count($run['questions']);
        if (array_key_exists('current', $body) && in_array($run['kind'], ['poll', 'wordcloud'], true)) {
            $current = $body['current'];
            if (!is_int($current) || $current < 0 || $current >= $anzahl) {
                throw HttpException::badRequest('Ungültige Frage.');
            }
            $this->polls->setQuestion($run['id'], $current);
        }
        if (array_key_exists('countdown', $body) && $run['kind'] === 'poll') {
            $this->polls->setCountdown($run['id'], PollValidator::countdown($body['countdown']));
        }
        if ($run['kind'] === 'wordcloud') {
            foreach (['hide' => true, 'show' => false] as $key => $verbergen) {
                if (!is_array($body[$key] ?? null)) {
                    continue;
                }
                $word = mb_strtolower(trim((string) ($body[$key]['word'] ?? '')));
                $question = (string) ($body[$key]['question'] ?? '');
                $hidden = array_values(array_filter($run['settings']['hidden'] ?? [], static fn (array $h): bool => !($h['question'] === $question && $h['word'] === $word)));
                if ($verbergen && $word !== '') {
                    $hidden[] = ['question' => $question, 'word' => $word];
                }
                $run['settings']['hidden'] = $hidden;
                $this->polls->setRunSettings($run['id'], $run['settings']);
            }
        }
        if ($run['kind'] === 'quiz') {
            if (array_key_exists('start', $body)) {
                $n = $body['start'];
                if (!is_int($n) || $n < 0 || $n >= $anzahl) {
                    throw HttpException::badRequest('Ungültige Frage.');
                }
                $this->polls->setQuestion($run['id'], $n, 'question');
            }
            if (in_array($body['phase'] ?? null, ['reveal', 'leaderboard', 'end'], true)) {
                $this->polls->setPhase($run['id'], $body['phase']);
            }
            if (is_string($body['kick'] ?? null)) {
                $this->polls->removePlayer($run['id'], $body['kick']);
            }
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
        $run = $this->advance($this->runByCode($params['code']));
        $participant = self::participant($request->query('participant'), false);
        $poll = $this->polls->find($run['pollId']);
        $basis = [
            'code' => $run['code'],
            'kind' => $run['kind'],
            'title' => $poll['title'] ?? '',
            'mode' => $run['mode'],
            'phase' => $run['phase'],
            'total' => count($run['questions']),
            'current' => $run['current'],
        ];
        return Response::json($basis + match ($run['kind']) {
            'wordcloud' => $this->joinWordcloud($run, $participant),
            'quiz' => $this->joinQuiz($run, $participant),
            'evaluation' => $this->joinEvaluation($run, $participant),
            default => $this->joinPoll($run, $participant),
        });
    }

    /** Quiz: Spielname wählen oder ändern */
    public function nickname(Request $request, array $params): Response
    {
        $run = $this->runByCode($params['code']);
        if ($run['kind'] !== 'quiz') {
            throw HttpException::badRequest('Hier gibt es keine Spielnamen.');
        }
        $body = $request->json();
        $participant = self::participant($body['participant'] ?? null, true);
        $nickname = is_string($body['nickname'] ?? null) ? trim((string) preg_replace('/\s+/u', ' ', $body['nickname'])) : '';
        if (mb_strlen($nickname) < 1 || mb_strlen($nickname) > 20) {
            throw HttpException::badRequest('Der Spielname muss 1 bis 20 Zeichen lang sein.');
        }
        if ($this->polls->nicknameTaken($run['id'], $nickname, $participant)) {
            throw HttpException::conflict('Diesen Spielnamen hat schon jemand. Bitte wähle einen anderen.');
        }
        $bekannt = in_array($participant, array_column($this->polls->players($run['id']), 'participant'), true);
        if (!$bekannt && $this->polls->participantCount($run['id']) >= self::MAX_PARTICIPANTS) {
            throw HttpException::conflict('An diesem Quiz nehmen schon zu viele Personen teil.');
        }
        $this->polls->setPlayer($run['id'], $participant, $nickname);
        return Response::json(['nickname' => $nickname]);
    }

    /** @param array<string, string> $params */
    public function answer(Request $request, array $params): Response
    {
        $run = $this->advance($this->runByCode($params['code']));
        $body = $request->json();
        $participant = self::participant($body['participant'] ?? null, true);
        $raw = $body['answers'] ?? null;
        if (!is_array($raw) || $raw === [] || array_is_list($raw)) {
            throw HttpException::badRequest('Keine Antworten übermittelt.');
        }
        return Response::json(match ($run['kind']) {
            'wordcloud' => $this->answerWordcloud($run, $participant, $raw),
            'quiz' => $this->answerQuiz($run, $participant, $raw),
            'evaluation' => $this->answerEvaluation($run, $participant, $raw),
            default => $this->answerPoll($run, $participant, $raw),
        });
    }

    // ------------------------------------------------------------ Umfrage

    private function joinPoll(array $run, ?string $participant): array
    {
        $questions = array_map([self::class, 'publicQuestion'], $run['questions']);
        return [
            'remaining' => $this->remaining($run),
            'questions' => $run['mode'] === 'single' ? [$questions[$run['current']]] : $questions,
            'answers' => (object) $this->ownValues($run, $participant),
        ];
    }

    private function answerPoll(array $run, string $participant, array $raw): array
    {
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
        $this->checkCapacity($run, $participant);
        $this->polls->saveAnswers($run['id'], $participant, $answers);
        return ['answers' => (object) $this->ownValues($run, $participant)];
    }

    // ------------------------------------------------------------ Wortwolke

    private function joinWordcloud(array $run, ?string $participant): array
    {
        $question = $run['questions'][$run['current']];
        return [
            'questions' => [$question],
            'words' => $participant === null ? [] : $this->ownWords($run, $participant, $question['id']),
        ];
    }

    private function answerWordcloud(array $run, string $participant, array $raw): array
    {
        $question = $run['questions'][$run['current']];
        if (array_map('strval', array_keys($raw)) !== [$question['id']]) {
            throw HttpException::conflict('Diese Frage ist gerade nicht freigegeben.');
        }
        $words = array_merge($this->ownWords($run, $participant, $question['id']), PollValidator::words($question, $raw[$question['id']]));
        if (count($words) > $question['maxWords']) {
            throw HttpException::conflict($question['maxWords'] === 1 ? 'Du kannst nur einen Begriff abgeben.' : "Du kannst höchstens {$question['maxWords']} Begriffe abgeben.");
        }
        $this->checkCapacity($run, $participant);
        $this->polls->saveAnswers($run['id'], $participant, [$question['id'] => ['value' => count($words), 'text' => implode("\n", $words)]]);
        return ['words' => $words];
    }

    /** @return list<string> */
    private function ownWords(array $run, string $participant, string $questionId): array
    {
        $text = $this->polls->answersOf($run['id'], $participant)[$questionId]['text'] ?? '';
        return $text === '' ? [] : explode("\n", $text);
    }

    // ------------------------------------------------------------ Quiz

    private function joinQuiz(array $run, ?string $participant): array
    {
        $players = $this->polls->players($run['id']);
        $nickname = null;
        foreach ($players as $p) {
            if ($p['participant'] === $participant) {
                $nickname = $p['nickname'];
            }
        }
        $state = ['nickname' => $nickname, 'players' => count($players)];
        $question = $run['questions'][$run['current']];
        $own = $participant === null ? [] : $this->polls->answersOf($run['id'], $participant);
        if (in_array($run['phase'], ['question', 'reveal'], true)) {
            $state['question'] = ['id' => $question['id'], 'text' => $question['text'], 'options' => $question['options'], 'time' => $question['time']];
            $state['remainingMs'] = $run['phase'] === 'question' ? $this->quizRemainingMs($run) : 0;
            $state['answer'] = isset($own[$question['id']]) ? (int) $own[$question['id']]['value'] : null;
        }
        if ($run['phase'] === 'reveal') {
            $state['question']['correct'] = $question['correct'];
            $state['points'] = isset($own[$question['id']]) ? self::quizPoints($question, (int) $own[$question['id']]['value'], (int) $own[$question['id']]['ms']) : 0;
        }
        if ($nickname !== null && in_array($run['phase'], ['reveal', 'leaderboard', 'end'], true)) {
            foreach ($this->quizRanking($run) as $i => $r) {
                if ($r['participant'] === $participant) {
                    $state['score'] = $r['score'];
                    $state['rank'] = $i + 1;
                }
            }
        }
        return $state;
    }

    private function answerQuiz(array $run, string $participant, array $raw): array
    {
        if ($run['phase'] !== 'question') {
            throw HttpException::conflict('Gerade läuft keine Frage.');
        }
        if (!in_array($participant, array_column($this->polls->players($run['id']), 'participant'), true)) {
            throw HttpException::conflict('Bitte wähle zuerst einen Spielnamen.');
        }
        $question = $run['questions'][$run['current']];
        if (array_map('strval', array_keys($raw)) !== [$question['id']]) {
            throw HttpException::conflict('Diese Frage ist gerade nicht freigegeben.');
        }
        if (isset($this->polls->answersOf($run['id'], $participant)[$question['id']])) {
            throw HttpException::conflict('Du hast diese Frage schon beantwortet.');
        }
        $ms = $this->quizElapsedMs($run);
        if ($ms > $question['time'] * 1000 + self::QUIZ_GRACE_MS) {
            throw HttpException::conflict('Die Zeit ist abgelaufen.');
        }
        $value = PollValidator::answer($question, $raw[$question['id']]);
        $this->polls->saveAnswers($run['id'], $participant, [$question['id'] => ['value' => $value, 'ms' => min($ms, $question['time'] * 1000)]]);
        $this->advance($run);
        return ['answer' => (int) $value];
    }

    /** Punkte: richtig = 500 bis 1000, je schneller desto mehr; falsch = 0 */
    public static function quizPoints(array $question, int $value, int $ms): int
    {
        if (!in_array($value, $question['correct'], true)) {
            return 0;
        }
        $zeit = $question['time'] * 1000;
        return (int) round(1000 * (1 - min($ms, $zeit) / $zeit / 2));
    }

    /** @return list<array{participant: string, nickname: string, score: int, correct: int}> nach Punkten sortiert */
    private function quizRanking(array $run): array
    {
        $byId = array_column($run['questions'], null, 'id');
        $scores = [];
        foreach ($this->polls->players($run['id']) as $p) {
            $scores[$p['participant']] = ['participant' => $p['participant'], 'nickname' => $p['nickname'], 'score' => 0, 'correct' => 0];
        }
        $current = $run['questions'][$run['current']]['id'];
        foreach ($this->polls->answerRows($run['id']) as $a) {
            // Die laufende Frage zählt erst nach der Auflösung
            if (!isset($scores[$a['participant']], $byId[$a['question']]) || ($a['question'] === $current && $run['phase'] === 'question')) {
                continue;
            }
            $points = self::quizPoints($byId[$a['question']], (int) $a['value'], (int) $a['ms']);
            $scores[$a['participant']]['score'] += $points;
            $scores[$a['participant']]['correct'] += $points > 0 ? 1 : 0;
        }
        $list = array_values($scores);
        usort($list, static fn (array $a, array $b): int => [$b['score'], $a['nickname']] <=> [$a['score'], $b['nickname']]);
        return $list;
    }

    private function quizElapsedMs(array $run): int
    {
        $since = new DateTimeImmutable($run['questionSince'], new DateTimeZone('UTC'));
        $now = new DateTimeImmutable('now', new DateTimeZone('UTC'));
        return max(0, (int) round(((float) $now->format('U.u') - (float) $since->format('U.u')) * 1000));
    }

    private function quizRemainingMs(array $run): int
    {
        return max(0, $run['questions'][$run['current']]['time'] * 1000 - $this->quizElapsedMs($run));
    }

    // ------------------------------------------------------------ Evaluation

    private function joinEvaluation(array $run, ?string $participant): array
    {
        return [
            'intro' => $run['settings']['intro'] ?? '',
            'outro' => $run['settings']['outro'] ?? '',
            'questions' => array_map(static fn (array $q): array => array_diff_key($q, ['dimension' => 1, 'reverse' => 1, 'correct' => 1]), $run['questions']),
            'submitted' => $participant !== null && $this->polls->hasSubmitted($run['id'], $participant),
        ];
    }

    private function answerEvaluation(array $run, string $participant, array $raw): array
    {
        if ($this->polls->hasSubmitted($run['id'], $participant)) {
            throw HttpException::conflict('Du hast diese Evaluation schon abgegeben. Vielen Dank!');
        }
        $byId = array_column($run['questions'], null, 'id');
        $answers = [];
        foreach ($raw as $questionId => $value) {
            $questionId = (string) $questionId;
            if (!isset($byId[$questionId])) {
                throw HttpException::badRequest('Unbekannte Frage.');
            }
            $q = $byId[$questionId];
            if ($q['type'] === 'text') {
                if (!is_string($value) || trim($value) === '') {
                    continue;
                }
                $answers[$questionId] = ['value' => 0.0, 'text' => PollValidator::text($q, $value)];
            } else {
                $answers[$questionId] = ['value' => PollValidator::answer($q, $value)];
            }
        }
        if ($this->polls->submissionCount($run['id']) >= self::MAX_PARTICIPANTS) {
            throw HttpException::conflict('An dieser Evaluation nehmen schon zu viele Personen teil.');
        }
        $this->polls->submitAnonymously($run, $participant, $answers);
        return ['submitted' => true];
    }

    /** Ergebnisse einer Evaluation gibt es erst nach dem Ende und nur bei genug Rückmeldungen. */
    private function evaluationVisible(array $run): bool
    {
        return $run['endedAt'] !== null && $this->polls->submissionCount($run['id']) >= ($run['settings']['minResponses'] ?? 5);
    }

    // ------------------------------------------------------------ Hilfen

    /** Zeitgesteuerte Übergänge (Countdown der Umfrage, Ablauf einer Quizfrage) */
    private function advance(array $run): array
    {
        if ($run['kind'] === 'poll') {
            return $this->polls->advanceIfDue($run);
        }
        if ($run['kind'] === 'quiz' && $run['phase'] === 'question' && $run['endedAt'] === null) {
            $question = $run['questions'][$run['current']];
            $players = count($this->polls->players($run['id']));
            $answered = count($this->polls->answers($run['id'])[$question['id']] ?? []);
            if ($this->quizRemainingMs($run) === 0 || ($players > 0 && $answered >= $players)) {
                $this->polls->changePhase($run['id'], 'question', 'reveal');
                return $this->polls->findRun($run['id']) ?? $run;
            }
        }
        return $run;
    }

    private function checkCapacity(array $run, string $participant): void
    {
        if (!$this->polls->hasParticipant($run['id'], $participant)
            && $this->polls->participantCount($run['id']) >= self::MAX_PARTICIPANTS) {
            throw HttpException::conflict('Hier nehmen schon zu viele Personen teil.');
        }
    }

    /** @return array<string, float> */
    private function ownValues(array $run, ?string $participant): array
    {
        return $participant === null ? [] : array_map(static fn (array $a): float => $a['value'], $this->polls->answersOf($run['id'], $participant));
    }

    /**
     * @param array<string, mixed> $teacher
     * @return array<string, mixed>
     */
    private function ownPoll(array $teacher, string $id): array
    {
        $poll = $this->polls->find(Validator::positiveInt($id, 'ID'));
        if ($poll === null || $poll['teacherId'] !== $teacher['id']) {
            throw HttpException::notFound('Nicht gefunden.');
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
            throw HttpException::notFound('Zu diesem Code läuft gerade nichts.');
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

    /** Ganzzahlige Antworten aus einer JSON-Datei können als 2.0 ankommen */
    private static function number(array $question, mixed $value): mixed
    {
        return in_array($question['type'], ['choice', 'quiz'], true) && is_float($value) && floor($value) === $value ? (int) $value : $value;
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
        if ($run['kind'] !== 'poll' || $run['mode'] !== 'single' || $run['countdown'] <= 0 || $run['endedAt'] !== null) {
            return null;
        }
        $since = new DateTimeImmutable($run['questionSince'], new DateTimeZone('UTC'));
        return max(0, $run['countdown'] - (time() - $since->getTimestamp()));
    }

    /** @param array<string, mixed>|null $poll */
    private function pollPayload(?array $poll): array
    {
        if ($poll === null) {
            throw HttpException::notFound('Nicht gefunden.');
        }
        $deletesAt = (new DateTimeImmutable($poll['activeAt'], new DateTimeZone('UTC')))
            ->modify('+' . PollRepository::KEEP_DAYS . ' days')->format('Y-m-d H:i:s.v');
        return [
            'id' => $poll['id'],
            'kind' => $poll['kind'],
            'title' => $poll['title'],
            'mode' => $poll['mode'],
            'countdown' => $poll['countdown'],
            'questions' => $poll['questions'],
            'settings' => (object) $poll['settings'],
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
        $payload = [
            'id' => $run['id'],
            'pollId' => $run['pollId'],
            'kind' => $run['kind'],
            'title' => $poll['title'] ?? '',
            'code' => $run['code'],
            'mode' => $run['mode'],
            'phase' => $run['phase'],
            'countdown' => $run['countdown'],
            'questions' => $run['questions'],
            'settings' => (object) $run['settings'],
            'current' => $run['current'],
            'remaining' => $this->remaining($run),
            'startedAt' => Database::toIso($run['startedAt']),
            'endedAt' => $run['endedAt'] === null ? null : Database::toIso($run['endedAt']),
            'participants' => $this->polls->participantCount($run['id']),
        ];
        if ($run['kind'] === 'poll') {
            $payload['answers'] = (object) $this->polls->answers($run['id']);
        }
        if ($run['kind'] === 'wordcloud') {
            $words = [];
            foreach ($this->polls->answerRows($run['id']) as $a) {
                foreach (explode("\n", (string) $a['text']) as $w) {
                    if ($w !== '') {
                        $words[$a['question']][] = $w;
                    }
                }
            }
            $payload['words'] = (object) $words;
        }
        if ($run['kind'] === 'quiz') {
            $question = $run['questions'][$run['current']];
            $answered = [];
            foreach ($this->polls->answerRows($run['id']) as $a) {
                if ($a['question'] === $question['id']) {
                    $answered[$a['participant']] = (int) $a['value'];
                }
            }
            $payload['remainingMs'] = $run['phase'] === 'question' ? $this->quizRemainingMs($run) : null;
            $payload['ranking'] = array_map(static fn (array $r): array => $r + ['answered' => isset($answered[$r['participant']])], $this->quizRanking($run));
            // Welche Antworten gewählt wurden, erst nach der Auflösung (sonst stünde es schon vorher am Beamer)
            $payload['answers'] = $run['phase'] === 'question' ? null : array_values($answered);
            $payload['answeredCount'] = count($answered);
        }
        if ($run['kind'] === 'evaluation') {
            $payload['submissions'] = $this->polls->submissionCount($run['id']);
            $payload['minResponses'] = $run['settings']['minResponses'] ?? 5;
            $payload['responses'] = null;
            if ($this->evaluationVisible($run)) {
                $responses = [];
                foreach ($this->polls->answerRows($run['id']) as $a) {
                    $responses[$a['participant']][$a['question']] = $a['text'] ?? $a['value'];
                }
                $payload['responses'] = array_values($responses);
            }
        }
        return $payload;
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
