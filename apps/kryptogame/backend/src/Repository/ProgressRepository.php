<?php

declare(strict_types=1);

namespace Kryptogame\Repository;

use Kryptogame\Database;

/**
 * Bestandene Level, Prüfungsversuche und manuelle Freischaltungen.
 */
final class ProgressRepository
{
    public function __construct(private Database $db)
    {
    }

    /** @return list<int> aufsteigend sortiert */
    public function passedLevels(int $userId): array
    {
        $rows = $this->db->fetchAll('SELECT level FROM level_progress WHERE user_id = ? ORDER BY level', [$userId]);
        return array_map(static fn (array $row): int => (int) $row['level'], $rows);
    }

    /**
     * @param list<int> $userIds
     * @return array<int, list<int>> user_id => bestandene Level
     */
    public function passedLevelsForUsers(array $userIds): array
    {
        $result = array_fill_keys($userIds, []);
        if ($userIds === []) {
            return $result;
        }
        $rows = $this->db->fetchAll(
            'SELECT user_id, level FROM level_progress WHERE user_id IN (' . $this->placeholders($userIds) . ') ORDER BY level',
            $userIds,
        );
        foreach ($rows as $row) {
            $result[(int) $row['user_id']][] = (int) $row['level'];
        }
        return $result;
    }

    /** @return bool true, wenn das Level vorher noch nicht bestanden war */
    public function markPassed(int $userId, int $level): bool
    {
        if ($this->hasPassed($userId, $level)) {
            return false;
        }
        $this->db->execute(
            'INSERT INTO level_progress (user_id, level, passed_at) VALUES (?, ?, ?)',
            [$userId, $level, Database::now()],
        );
        return true;
    }

    /** @return bool true, wenn das Level vorher bestanden war */
    public function unmarkPassed(int $userId, int $level): bool
    {
        return $this->db->execute('DELETE FROM level_progress WHERE user_id = ? AND level = ?', [$userId, $level]) > 0;
    }

    public function hasPassed(int $userId, int $level): bool
    {
        return $this->db->fetchOne(
            'SELECT 1 FROM level_progress WHERE user_id = ? AND level = ?',
            [$userId, $level],
        ) !== null;
    }

    /**
     * @param list<array{task: int, correct: bool, answer: mixed}> $details
     */
    public function recordAttempt(int $userId, int $level, int $score, array $details): void
    {
        $this->db->execute(
            'INSERT INTO quiz_attempts (user_id, level, score, details, created_at) VALUES (?, ?, ?, ?, ?)',
            [$userId, $level, $score, json_encode($details, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR), Database::now()],
        );
    }

    /** Manuelle Änderung durch eine Lehrkraft protokollieren. */
    public function logManualChange(int $userId, int $level, bool $unlocked, ?int $actorId): void
    {
        $this->db->execute(
            'INSERT INTO progress_log (user_id, level, action, actor_id, created_at) VALUES (?, ?, ?, ?, ?)',
            [$userId, $level, $unlocked ? 'freigeschaltet' : 'gesperrt', $actorId, Database::now()],
        );
    }

    /**
     * @param list<int> $userIds
     * @return list<array{user_id: int, level: int, score: int, details: list<array{task: int, correct: bool, answer: mixed}>, created_at: string}>
     */
    public function attemptsForUsers(array $userIds): array
    {
        if ($userIds === []) {
            return [];
        }
        $rows = $this->db->fetchAll(
            'SELECT user_id, level, score, details, created_at FROM quiz_attempts WHERE user_id IN ('
                . $this->placeholders($userIds) . ') ORDER BY created_at, id',
            $userIds,
        );
        return array_map(static fn (array $row): array => [
            'user_id' => (int) $row['user_id'],
            'level' => (int) $row['level'],
            'score' => (int) $row['score'],
            'details' => json_decode((string) $row['details'], true) ?? [],
            'created_at' => (string) $row['created_at'],
        ], $rows);
    }

    /**
     * Chronologischer Verlauf aus Prüfungsversuchen und manuellen Änderungen.
     *
     * @return array<int, list<array<string, mixed>>> level => Einträge
     */
    public function history(int $userId): array
    {
        $entries = [];
        foreach ($this->attemptsForUsers([$userId]) as $attempt) {
            $entries[] = [
                'level' => $attempt['level'],
                'timestamp' => $attempt['created_at'],
                'score' => $attempt['score'],
                'details' => $attempt['details'],
            ];
        }
        $logs = $this->db->fetchAll(
            'SELECT level, action, created_at FROM progress_log WHERE user_id = ? ORDER BY created_at, id',
            [$userId],
        );
        foreach ($logs as $log) {
            $entries[] = [
                'level' => (int) $log['level'],
                'timestamp' => (string) $log['created_at'],
                'manual' => (string) $log['action'],
            ];
        }
        usort($entries, static fn (array $a, array $b): int => strcmp($a['timestamp'], $b['timestamp']));

        $history = [];
        foreach ($entries as $entry) {
            $level = $entry['level'];
            unset($entry['level']);
            $entry['timestamp'] = Database::toIso($entry['timestamp']);
            $history[$level][] = $entry;
        }
        ksort($history);
        return $history;
    }

    /** Fortschritt, Versuche und Protokoll einer Person löschen. */
    public function reset(int $userId): void
    {
        $this->db->transaction(function () use ($userId): void {
            $this->db->execute('DELETE FROM level_progress WHERE user_id = ?', [$userId]);
            $this->db->execute('DELETE FROM quiz_attempts WHERE user_id = ?', [$userId]);
            $this->db->execute('DELETE FROM progress_log WHERE user_id = ?', [$userId]);
        });
    }

    /** @param list<int> $values */
    private function placeholders(array $values): string
    {
        return implode(', ', array_fill(0, count($values), '?'));
    }
}
