<?php

declare(strict_types=1);

namespace Schulbuch\Repository;

use DateTimeImmutable;
use DateTimeZone;
use Schulbuch\Database;

/**
 * Umfragen, ihre Durchführungen und die (anonymen) Antworten.
 */
final class PollRepository
{
    /** Umfragen, die so lange weder bearbeitet noch durchgeführt wurden, werden gelöscht. */
    public const KEEP_DAYS = 500;
    /** Durchführungen, die so lange laufen, werden automatisch beendet (Code wird frei). */
    public const RUN_HOURS = 12;

    public function __construct(private Database $db)
    {
    }

    // ------------------------------------------------------------ Umfragen

    /** @return list<array<string, mixed>> */
    public function forTeacher(int $teacherId): array
    {
        $polls = array_map([$this, 'decode'], $this->db->fetchAll(
            'SELECT * FROM poll_polls WHERE teacher_id = ? ORDER BY active_at DESC, id DESC',
            [$teacherId],
        ));
        if ($polls === []) {
            return [];
        }
        $runs = $this->db->fetchAll(
            'SELECT r.id, r.poll_id, r.code, r.mode, r.started_at, r.ended_at,
                    (SELECT COUNT(DISTINCT a.participant) FROM poll_answers a WHERE a.run_id = r.id) AS participants
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

    /** @return array<string, mixed>|null eine Umfrage mit Übersicht ihrer Durchführungen */
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

    /** @param array{title: string, mode: string, countdown: int, questions: list<array<string, mixed>>} $poll */
    public function create(int $teacherId, array $poll, ?string $source = null, ?string $at = null): int
    {
        $now = Database::now();
        $this->db->execute(
            'INSERT INTO poll_polls (teacher_id, title, mode, countdown, questions, source, created_at, updated_at, active_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [$teacherId, $poll['title'], $poll['mode'], $poll['countdown'], self::json($poll['questions']), $source, $at ?? $now, $now, $now],
        );
        return $this->db->lastInsertId();
    }

    /** @param array{title: string, mode: string, countdown: int, questions: list<array<string, mixed>>} $poll */
    public function update(int $id, array $poll): void
    {
        $now = Database::now();
        $this->db->execute(
            'UPDATE poll_polls SET title = ?, mode = ?, countdown = ?, questions = ?, updated_at = ?, active_at = ? WHERE id = ?',
            [$poll['title'], $poll['mode'], $poll['countdown'], self::json($poll['questions']), $now, $now, $id],
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

    /** Löscht Umfragen, die seit KEEP_DAYS Tagen weder bearbeitet noch durchgeführt wurden. */
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
        $this->db->execute(
            'INSERT INTO poll_runs (poll_id, code, mode, countdown, questions, current_question, question_since, started_at)
             VALUES (?, ?, ?, ?, ?, 0, ?, ?)',
            [$poll['id'], $code, $mode, $countdown, self::json($poll['questions']), $now, $now],
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
                'INSERT INTO poll_runs (poll_id, code, mode, countdown, questions, current_question, question_since, started_at, ended_at)
                 VALUES (?, NULL, ?, ?, ?, 0, ?, ?, ?)',
                [$pollId, $run['mode'], $run['countdown'], self::json($run['questions']), $run['startedAt'], $run['startedAt'], $run['endedAt']],
            );
            $runId = $this->db->lastInsertId();
            foreach ($run['answers'] as $answer) {
                $this->db->execute(
                    'INSERT INTO poll_answers (run_id, participant, question, answer_value, created_at) VALUES (?, ?, ?, ?, ?)',
                    [$runId, $answer['participant'], $answer['question'], $answer['value'], $answer['at']],
                );
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

    /** @return list<array<string, mixed>> alle Durchführungen einer Umfrage mit Antworten (für den Export) */
    public function runsWithAnswers(int $pollId): array
    {
        $runs = array_map([$this, 'decodeRun'], $this->db->fetchAll('SELECT * FROM poll_runs WHERE poll_id = ? ORDER BY started_at', [$pollId]));
        foreach ($runs as &$run) {
            $run['answers'] = $this->db->fetchAll(
                'SELECT participant, question, answer_value, created_at FROM poll_answers WHERE run_id = ? ORDER BY created_at',
                [$run['id']],
            );
        }
        return $runs;
    }

    public function setQuestion(int $runId, int $index): void
    {
        $this->db->execute(
            'UPDATE poll_runs SET current_question = ?, question_since = ? WHERE id = ?',
            [$index, Database::now(), $runId],
        );
    }

    public function setCountdown(int $runId, int $seconds): void
    {
        $this->db->execute(
            'UPDATE poll_runs SET countdown = ?, question_since = ? WHERE id = ?',
            [$seconds, Database::now(), $runId],
        );
    }

    /**
     * Countdown: Ist die Zeit für die aktuelle Frage abgelaufen, rückt die Durchführung weiter.
     * Wird bei jedem Abruf aufgerufen – so läuft der Countdown auch ohne offenes Lehrkraft-Fenster.
     *
     * @param array<string, mixed> $run
     * @return array<string, mixed> aktualisierte Durchführung
     */
    public function advanceIfDue(array $run): array
    {
        if ($run['mode'] !== 'single' || $run['countdown'] <= 0 || $run['endedAt'] !== null) {
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

    /** @return array<string, list<float>> Antworten je Frage-ID */
    public function answers(int $runId): array
    {
        $result = [];
        foreach ($this->db->fetchAll('SELECT question, answer_value FROM poll_answers WHERE run_id = ?', [$runId]) as $row) {
            $result[$row['question']][] = (float) $row['answer_value'];
        }
        return $result;
    }

    public function participantCount(int $runId): int
    {
        return (int) $this->db->fetchOne('SELECT COUNT(DISTINCT participant) AS n FROM poll_answers WHERE run_id = ?', [$runId])['n'];
    }

    public function hasParticipant(int $runId, string $participant): bool
    {
        return $this->db->fetchOne('SELECT 1 AS x FROM poll_answers WHERE run_id = ? AND participant = ? LIMIT 1', [$runId, $participant]) !== null;
    }

    /** @return array<string, float> bisherige Antworten einer Person */
    public function answersOf(int $runId, string $participant): array
    {
        $result = [];
        foreach ($this->db->fetchAll('SELECT question, answer_value FROM poll_answers WHERE run_id = ? AND participant = ?', [$runId, $participant]) as $row) {
            $result[$row['question']] = (float) $row['answer_value'];
        }
        return $result;
    }

    /** @param array<string, float> $answers */
    public function saveAnswers(int $runId, string $participant, array $answers): void
    {
        $this->db->transaction(function () use ($runId, $participant, $answers): void {
            $now = Database::now();
            foreach ($answers as $question => $value) {
                $this->db->execute('DELETE FROM poll_answers WHERE run_id = ? AND participant = ? AND question = ?', [$runId, $participant, $question]);
                $this->db->execute(
                    'INSERT INTO poll_answers (run_id, participant, question, answer_value, created_at) VALUES (?, ?, ?, ?, ?)',
                    [$runId, $participant, $question, $value, $now],
                );
            }
        });
    }

    // ------------------------------------------------------------ Hilfen

    /** @param array<string, mixed> $row */
    private function decode(array $row): array
    {
        return [
            'id' => (int) $row['id'],
            'teacherId' => (int) $row['teacher_id'],
            'title' => (string) $row['title'],
            'mode' => (string) $row['mode'],
            'countdown' => (int) $row['countdown'],
            'questions' => json_decode((string) $row['questions'], true) ?: [],
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
            'mode' => (string) $row['mode'],
            'countdown' => (int) $row['countdown'],
            'questions' => json_decode((string) $row['questions'], true) ?: [],
            'current' => (int) $row['current_question'],
            'questionSince' => (string) $row['question_since'],
            'startedAt' => (string) $row['started_at'],
            'endedAt' => $row['ended_at'] === null ? null : (string) $row['ended_at'],
        ];
    }

    private static function json(mixed $value): string
    {
        return json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    }

    private static function ago(string $modifier): string
    {
        return (new DateTimeImmutable($modifier, new DateTimeZone('UTC')))->format('Y-m-d H:i:s.v');
    }
}
