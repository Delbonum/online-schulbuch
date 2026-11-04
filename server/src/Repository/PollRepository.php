<?php

declare(strict_types=1);

namespace Schulbuch\Repository;

use DateTimeImmutable;
use DateTimeZone;
use Schulbuch\Database;

/**
 * Einträge der Live-Werkzeuge (Umfragen, Wortwolken, Quiz, Evaluationen), ihre Durchführungen und Antworten.
 * Die Tabellen heißen aus historischen Gründen poll_*; die Spalte kind unterscheidet die Werkzeuge.
 */
final class PollRepository
{
    /** Einträge, die so lange weder bearbeitet noch durchgeführt wurden, werden gelöscht. */
    public const KEEP_DAYS = 500;
    /** Durchführungen, die so lange laufen, werden automatisch beendet (Code wird frei). */
    public const RUN_HOURS = 12;

    /** Anzahl der Teilnehmenden einer Durchführung – je nach Werkzeug anders gezählt */
    private const PARTICIPANTS = "CASE r.kind
        WHEN 'quiz' THEN (SELECT COUNT(*) FROM poll_players p WHERE p.run_id = r.id)
        WHEN 'evaluation' THEN (SELECT COUNT(*) FROM poll_submissions s WHERE s.run_id = r.id)
        ELSE (SELECT COUNT(DISTINCT a.participant) FROM poll_answers a WHERE a.run_id = r.id) END";

    public function __construct(private Database $db)
    {
    }

    // ------------------------------------------------------------ Einträge

    /** @return list<array<string, mixed>> */
    public function forTeacher(int $teacherId, ?string $kind = null): array
    {
        $polls = array_map([$this, 'decode'], $this->db->fetchAll(
            'SELECT * FROM poll_polls WHERE teacher_id = ?' . ($kind === null ? '' : ' AND kind = ?') . ' ORDER BY active_at DESC, id DESC',
            $kind === null ? [$teacherId] : [$teacherId, $kind],
        ));
        if ($polls === []) {
            return [];
        }
        $runs = $this->db->fetchAll(
            'SELECT r.id, r.poll_id, r.code, r.mode, r.phase, r.started_at, r.ended_at, ' . self::PARTICIPANTS . ' AS participants
             FROM poll_runs r JOIN poll_polls p ON p.id = r.poll_id
             WHERE p.teacher_id = ? ORDER BY r.started_at DESC',
            [$teacherId],
        );
        $byPoll = [];
        foreach ($runs as $run) {
            $byPoll[(int) $run['poll_id']][] = $run;
        }
        foreach ($polls as &$poll) {
            $poll['runs'] = $byPoll[$poll['id']] ?? [];
        }
        return $polls;
    }

    /** @return array<string, mixed>|null ein Eintrag mit Übersicht seiner Durchführungen */
    public function forTeacherOne(int $teacherId, int $id): ?array
    {
        foreach ($this->forTeacher($teacherId) as $poll) {
            if ($poll['id'] === $id) {
                return $poll;
            }
        }
        return null;
    }

    /** @return array<string, mixed>|null */
    public function find(int $id): ?array
    {
        $row = $this->db->fetchOne('SELECT * FROM poll_polls WHERE id = ?', [$id]);
        return $row === null ? null : $this->decode($row);
    }

    /** @param array{title: string, mode: string, countdown: int, questions: list<array<string, mixed>>, settings?: array<string, mixed>} $poll */
    public function create(int $teacherId, array $poll, ?string $source = null, ?string $at = null, string $kind = 'poll'): int
    {
        $now = Database::now();
        $this->db->execute(
            'INSERT INTO poll_polls (teacher_id, kind, title, mode, countdown, questions, settings, source, created_at, updated_at, active_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [$teacherId, $kind, $poll['title'], $poll['mode'], $poll['countdown'], self::json($poll['questions']),
                self::json($poll['settings'] ?? []), $source, $at ?? $now, $now, $now],
        );
        return $this->db->lastInsertId();
    }

    /** @param array{title: string, mode: string, countdown: int, questions: list<array<string, mixed>>, settings?: array<string, mixed>} $poll */
    public function update(int $id, array $poll): void
    {
        $now = Database::now();
        $this->db->execute(
            'UPDATE poll_polls SET title = ?, mode = ?, countdown = ?, questions = ?, settings = ?, updated_at = ?, active_at = ? WHERE id = ?',
            [$poll['title'], $poll['mode'], $poll['countdown'], self::json($poll['questions']), self::json($poll['settings'] ?? []), $now, $now, $id],
        );
    }

    public function touch(int $id): void
    {
        $this->db->execute('UPDATE poll_polls SET active_at = ? WHERE id = ?', [Database::now(), $id]);
    }

    public function delete(int $id): void
    {
        $this->db->execute('DELETE FROM poll_polls WHERE id = ?', [$id]);
    }

    /** Löscht Einträge, die seit KEEP_DAYS Tagen weder bearbeitet noch durchgeführt wurden. */
    public function deleteInactive(): int
    {
        return $this->db->execute('DELETE FROM poll_polls WHERE active_at < ?', [self::ago('-' . self::KEEP_DAYS . ' days')]);
    }

    // ------------------------------------------------------------ Durchführungen

    /** Startet eine Durchführung mit einem freien sechsstelligen Code. */
    public function startRun(array $poll, string $mode, int $countdown): int
    {
        $this->endStaleRuns();
        $now = Database::now();
        for ($try = 0; ; $try++) {
            $code = (string) random_int(100000, 999999);
            if ($this->db->fetchOne('SELECT id FROM poll_runs WHERE code = ?', [$code]) === null || $try > 50) {
                break;
            }
        }
        $settings = $poll['settings'] + ($poll['kind'] === 'wordcloud' ? ['hidden' => []] : []);
        $this->db->execute(
            'INSERT INTO poll_runs (poll_id, code, kind, phase, mode, countdown, questions, settings, current_question, question_since, started_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)',
            [$poll['id'], $code, $poll['kind'], $poll['kind'] === 'quiz' ? 'lobby' : 'open', $mode, $countdown,
                self::json($poll['questions']), self::json($settings), $now, $now],
        );
        $id = $this->db->lastInsertId();
        $this->touch($poll['id']);
        return $id;
    }

    /** Übernimmt eine abgeschlossene Durchführung aus einem Export. */
    public function importRun(int $pollId, array $run): void
    {
        $this->db->transaction(function () use ($pollId, $run): void {
            $this->db->execute(
                'INSERT INTO poll_runs (poll_id, code, kind, phase, mode, countdown, questions, settings, current_question, question_since, started_at, ended_at)
                 VALUES (?, NULL, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)',
                [$pollId, $run['kind'], $run['kind'] === 'quiz' ? 'end' : 'open', $run['mode'], $run['countdown'], self::json($run['questions']),
                    self::json($run['settings']), $run['startedAt'], $run['startedAt'], $run['endedAt']],
            );
            $runId = $this->db->lastInsertId();
            foreach ($run['players'] as $player) {
                $this->db->execute(
                    'INSERT INTO poll_players (run_id, participant, nickname, joined_at) VALUES (?, ?, ?, ?)',
                    [$runId, $player['participant'], $player['nickname'], $run['startedAt']],
                );
            }
            foreach ($run['answers'] as $answer) {
                $this->db->execute(
                    'INSERT INTO poll_answers (run_id, participant, question, answer_value, text_value, answer_ms, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [$runId, $answer['participant'], $answer['question'], $answer['value'], $answer['text'], $answer['ms'], $answer['at']],
                );
            }
            if ($run['kind'] === 'evaluation') {
                foreach (array_unique(array_column($run['answers'], 'participant')) as $participant) {
                    $this->db->execute('INSERT INTO poll_submissions (run_id, participant) VALUES (?, ?)', [$runId, $participant]);
                }
            }
        });
    }

    /** @return array<string, mixed>|null */
    public function findRun(int $id): ?array
    {
        $row = $this->db->fetchOne('SELECT * FROM poll_runs WHERE id = ?', [$id]);
        return $row === null ? null : $this->decodeRun($row);
    }

    /** @return array<string, mixed>|null laufende Durchführung zu einem Code */
    public function findRunByCode(string $code): ?array
    {
        $row = $this->db->fetchOne('SELECT * FROM poll_runs WHERE code = ? AND ended_at IS NULL', [$code]);
        return $row === null ? null : $this->decodeRun($row);
    }

    /** @return list<array<string, mixed>> alle Durchführungen eines Eintrags mit Antworten (für den Export) */
    public function runsWithAnswers(int $pollId): array
    {
        $runs = array_map([$this, 'decodeRun'], $this->db->fetchAll('SELECT * FROM poll_runs WHERE poll_id = ? ORDER BY started_at', [$pollId]));
        foreach ($runs as &$run) {
            $run['answerRows'] = $this->answerRows($run['id']);
            $run['players'] = $this->players($run['id']);
            $run['submissions'] = $this->submissionCount($run['id']);
        }
        return $runs;
    }

    public function setQuestion(int $runId, int $index, ?string $phase = null): void
    {
        $this->db->execute(
            'UPDATE poll_runs SET current_question = ?, question_since = ?' . ($phase === null ? '' : ', phase = ?') . ' WHERE id = ?',
            $phase === null ? [$index, Database::now(), $runId] : [$index, Database::now(), $phase, $runId],
        );
    }

    public function setPhase(int $runId, string $phase): void
    {
        $this->db->execute('UPDATE poll_runs SET phase = ? WHERE id = ?', [$phase, $runId]);
    }

    /** Wechselt die Phase nur, wenn sie noch die erwartete ist (mehrere gleichzeitige Abrufe) */
    public function changePhase(int $runId, string $from, string $to): void
    {
        $this->db->execute('UPDATE poll_runs SET phase = ? WHERE id = ? AND phase = ?', [$to, $runId, $from]);
    }

    public function setCountdown(int $runId, int $seconds): void
    {
        $this->db->execute('UPDATE poll_runs SET countdown = ?, question_since = ? WHERE id = ?', [$seconds, Database::now(), $runId]);
    }

    /** @param array<string, mixed> $settings */
    public function setRunSettings(int $runId, array $settings): void
    {
        $this->db->execute('UPDATE poll_runs SET settings = ? WHERE id = ?', [self::json($settings), $runId]);
    }

    /**
     * Countdown der Umfragen: Ist die Zeit für die aktuelle Frage abgelaufen, rückt die Durchführung weiter.
     *
     * @param array<string, mixed> $run
     * @return array<string, mixed> aktualisierte Durchführung
     */
    public function advanceIfDue(array $run): array
    {
        if ($run['kind'] !== 'poll' || $run['mode'] !== 'single' || $run['countdown'] <= 0 || $run['endedAt'] !== null) {
            return $run;
        }
        $last = count($run['questions']) - 1;
        if ($run['current'] >= $last) {
            return $run;
        }
        $since = new DateTimeImmutable($run['questionSince'], new DateTimeZone('UTC'));
        $elapsed = (new DateTimeImmutable('now', new DateTimeZone('UTC')))->getTimestamp() - $since->getTimestamp();
        $steps = intdiv(max(0, $elapsed), $run['countdown']);
        if ($steps === 0) {
            return $run;
        }
        $steps = min($steps, $last - $run['current']);
        $newSince = $since->modify('+' . ($steps * $run['countdown']) . ' seconds')->format('Y-m-d H:i:s.v');
        // Nur weiterrücken, wenn niemand anderes es inzwischen getan hat
        $this->db->execute(
            'UPDATE poll_runs SET current_question = ?, question_since = ? WHERE id = ? AND current_question = ?',
            [$run['current'] + $steps, $newSince, $run['id'], $run['current']],
        );
        return $this->findRun($run['id']) ?? $run;
    }

    public function endRun(int $runId): void
    {
        $this->db->execute('UPDATE poll_runs SET code = NULL, ended_at = ? WHERE id = ? AND ended_at IS NULL', [Database::now(), $runId]);
    }

    public function deleteRun(int $runId): void
    {
        $this->db->execute('DELETE FROM poll_runs WHERE id = ?', [$runId]);
    }

    private function endStaleRuns(): void
    {
        $this->db->execute(
            'UPDATE poll_runs SET code = NULL, ended_at = ? WHERE ended_at IS NULL AND started_at < ?',
            [Database::now(), self::ago('-' . self::RUN_HOURS . ' hours')],
        );
    }

    // ------------------------------------------------------------ Antworten

    /** @return array<string, list<float>> Zahlen-Antworten je Frage-ID */
    public function answers(int $runId): array
    {
        $result = [];
        foreach ($this->db->fetchAll('SELECT question, answer_value FROM poll_answers WHERE run_id = ?', [$runId]) as $row) {
            $result[$row['question']][] = (float) $row['answer_value'];
        }
        return $result;
    }

    /** @return list<array{participant: string, question: string, value: float, text: ?string, ms: ?int, at: string}> */
    public function answerRows(int $runId): array
    {
        return array_map(static fn (array $r): array => [
            'participant' => (string) $r['participant'],
            'question' => (string) $r['question'],
            'value' => (float) $r['answer_value'],
            'text' => $r['text_value'] === null ? null : (string) $r['text_value'],
            'ms' => $r['answer_ms'] === null ? null : (int) $r['answer_ms'],
            'at' => (string) $r['created_at'],
        ], $this->db->fetchAll('SELECT * FROM poll_answers WHERE run_id = ? ORDER BY participant, question', [$runId]));
    }

    public function participantCount(int $runId): int
    {
        return (int) $this->db->fetchOne('SELECT ' . self::PARTICIPANTS . ' AS n FROM poll_runs r WHERE r.id = ?', [$runId])['n'];
    }

    public function hasParticipant(int $runId, string $participant): bool
    {
        return $this->db->fetchOne('SELECT 1 AS x FROM poll_answers WHERE run_id = ? AND participant = ? LIMIT 1', [$runId, $participant]) !== null;
    }

    /** @return array<string, array{value: float, text: ?string, ms: ?int}> bisherige Antworten einer Person */
    public function answersOf(int $runId, string $participant): array
    {
        $result = [];
        foreach ($this->db->fetchAll('SELECT question, answer_value, text_value, answer_ms FROM poll_answers WHERE run_id = ? AND participant = ?', [$runId, $participant]) as $row) {
            $result[$row['question']] = [
                'value' => (float) $row['answer_value'],
                'text' => $row['text_value'] === null ? null : (string) $row['text_value'],
                'ms' => $row['answer_ms'] === null ? null : (int) $row['answer_ms'],
            ];
        }
        return $result;
    }

    /**
     * Speichert Antworten (ersetzt frühere Antworten derselben Person auf dieselbe Frage).
     * @param array<string, float|array{value: float, text?: ?string, ms?: ?int}> $answers
     */
    public function saveAnswers(int $runId, string $participant, array $answers, ?string $at = null): void
    {
        $this->db->transaction(function () use ($runId, $participant, $answers, $at): void {
            $now = $at ?? Database::now();
            foreach ($answers as $question => $answer) {
                $answer = is_array($answer) ? $answer : ['value' => $answer];
                $this->db->execute('DELETE FROM poll_answers WHERE run_id = ? AND participant = ? AND question = ?', [$runId, $participant, $question]);
                $this->db->execute(
                    'INSERT INTO poll_answers (run_id, participant, question, answer_value, text_value, answer_ms, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [$runId, $participant, $question, $answer['value'], $answer['text'] ?? null, $answer['ms'] ?? null, $now],
                );
            }
        });
    }

    // ------------------------------------------------------------ Quiz: Spielnamen

    /** @return list<array{participant: string, nickname: string}> */
    public function players(int $runId): array
    {
        return array_map(static fn (array $r): array => ['participant' => (string) $r['participant'], 'nickname' => (string) $r['nickname']],
            $this->db->fetchAll('SELECT participant, nickname FROM poll_players WHERE run_id = ? ORDER BY joined_at', [$runId]));
    }

    public function nicknameTaken(int $runId, string $nickname, string $except): bool
    {
        return $this->db->fetchOne(
            'SELECT 1 AS x FROM poll_players WHERE run_id = ? AND LOWER(nickname) = LOWER(?) AND participant <> ?',
            [$runId, $nickname, $except],
        ) !== null;
    }

    public function setPlayer(int $runId, string $participant, string $nickname): void
    {
        $this->db->transaction(function () use ($runId, $participant, $nickname): void {
            $this->db->execute('DELETE FROM poll_players WHERE run_id = ? AND participant = ?', [$runId, $participant]);
            $this->db->execute(
                'INSERT INTO poll_players (run_id, participant, nickname, joined_at) VALUES (?, ?, ?, ?)',
                [$runId, $participant, $nickname, Database::now()],
            );
        });
    }

    public function removePlayer(int $runId, string $participant): void
    {
        $this->db->execute('DELETE FROM poll_players WHERE run_id = ? AND participant = ?', [$runId, $participant]);
        $this->db->execute('DELETE FROM poll_answers WHERE run_id = ? AND participant = ?', [$runId, $participant]);
    }

    // ------------------------------------------------------------ Evaluation: Abgaben

    public function hasSubmitted(int $runId, string $participant): bool
    {
        return $this->db->fetchOne('SELECT 1 AS x FROM poll_submissions WHERE run_id = ? AND participant = ?', [$runId, $participant]) !== null;
    }

    public function submissionCount(int $runId): int
    {
        return (int) $this->db->fetchOne('SELECT COUNT(*) AS n FROM poll_submissions WHERE run_id = ?', [$runId])['n'];
    }

    /**
     * Speichert eine anonyme Abgabe: Wer abgegeben hat, steht getrennt von den Antworten; die Antworten tragen eine
     * neue Zufallskennung und als Zeitpunkt nur den Beginn der Durchführung.
     * @param array<string, array{value: float, text?: ?string}> $answers
     */
    public function submitAnonymously(array $run, string $participant, array $answers): void
    {
        $this->db->transaction(function () use ($run, $participant, $answers): void {
            $this->db->execute('INSERT INTO poll_submissions (run_id, participant) VALUES (?, ?)', [$run['id'], $participant]);
            $this->saveAnswers($run['id'], substr(bin2hex(random_bytes(8)), 0, 16), $answers, $run['startedAt']);
        });
    }

    // ------------------------------------------------------------ Hilfen

    /** @param array<string, mixed> $row */
    private function decode(array $row): array
    {
        return [
            'id' => (int) $row['id'],
            'teacherId' => (int) $row['teacher_id'],
            'kind' => (string) ($row['kind'] ?? 'poll'),
            'title' => (string) $row['title'],
            'mode' => (string) $row['mode'],
            'countdown' => (int) $row['countdown'],
            'questions' => json_decode((string) $row['questions'], true) ?: [],
            'settings' => json_decode((string) ($row['settings'] ?? ''), true) ?: [],
            'source' => $row['source'] === null ? null : (string) $row['source'],
            'createdAt' => (string) $row['created_at'],
            'updatedAt' => (string) $row['updated_at'],
            'activeAt' => (string) $row['active_at'],
        ];
    }

    /** @param array<string, mixed> $row */
    private function decodeRun(array $row): array
    {
        return [
            'id' => (int) $row['id'],
            'pollId' => (int) $row['poll_id'],
            'code' => $row['code'] === null ? null : (string) $row['code'],
            'kind' => (string) ($row['kind'] ?? 'poll'),
            'phase' => (string) ($row['phase'] ?? 'open'),
            'mode' => (string) $row['mode'],
            'countdown' => (int) $row['countdown'],
            'questions' => json_decode((string) $row['questions'], true) ?: [],
            'settings' => json_decode((string) ($row['settings'] ?? ''), true) ?: [],
            'current' => (int) $row['current_question'],
            'questionSince' => (string) $row['question_since'],
            'startedAt' => (string) $row['started_at'],
            'endedAt' => $row['ended_at'] === null ? null : (string) $row['ended_at'],
        ];
    }

    private static function json(mixed $value): string
    {
        return json_encode($value === [] ? new \stdClass() : $value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    }

    private static function ago(string $modifier): string
    {
        return (new DateTimeImmutable($modifier, new DateTimeZone('UTC')))->format('Y-m-d H:i:s.v');
    }
}
