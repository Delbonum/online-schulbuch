<?php

declare(strict_types=1);

namespace Kryptogame;

use DateTimeImmutable;
use DateTimeZone;
use Kryptogame\Repository\UserRepository;
use RuntimeException;

/**
 * Übernimmt Benutzer aus dem alten JSON-Format (JSONBin / users.json) in die Datenbank.
 * Passwörter werden dabei gehasht. Bereits vorhandene Benutzernamen werden übersprungen.
 */
final class LegacyImporter
{
    public function __construct(private Database $db)
    {
    }

    /**
     * @param list<array<string, mixed>> $legacyUsers
     * @return array{imported: list<string>, skipped: list<string>}
     */
    public function import(array $legacyUsers): array
    {
        $users = new UserRepository($this->db);
        $imported = [];
        $skipped = [];

        return $this->db->transaction(function () use ($legacyUsers, $users, &$imported, &$skipped): array {
            $teacherIds = [];

            // Erst Lehrkräfte, dann Schüler/-innen (die auf ihre Lehrkraft verweisen)
            foreach (['teacher', 'student'] as $role) {
                foreach ($legacyUsers as $legacy) {
                    if (($legacy['role'] ?? null) !== $role) {
                        continue;
                    }
                    $username = trim((string) ($legacy['username'] ?? ''));
                    $password = (string) ($legacy['password'] ?? '');
                    if ($username === '' || $password === '') {
                        throw new RuntimeException('Eintrag ohne Benutzername oder Passwort gefunden.');
                    }

                    $existing = $users->findByUsername($username);
                    if ($existing !== null) {
                        $skipped[] = $username;
                        if ($role === 'teacher' && $existing['role'] === 'teacher') {
                            $teacherIds[$username] = $existing['id'];
                        }
                        continue;
                    }

                    $teacherId = null;
                    if ($role === 'student') {
                        $teacherName = (string) ($legacy['teacher'] ?? '');
                        $teacherId = $teacherIds[$teacherName]
                            ?? throw new RuntimeException("Lehrkraft \"{$teacherName}\" für \"{$username}\" nicht gefunden.");
                    }

                    $id = $users->create($username, password_hash($password, PASSWORD_DEFAULT), $role, $teacherId);
                    if ($role === 'teacher') {
                        $teacherIds[$username] = $id;
                    } else {
                        $this->importProgress($id, $legacy);
                    }
                    $imported[] = $username;
                }
            }

            return ['imported' => $imported, 'skipped' => $skipped];
        });
    }

    /**
     * @param array<string, mixed> $legacy
     */
    private function importProgress(int $userId, array $legacy): void
    {
        foreach ((array) ($legacy['progress'] ?? []) as $key => $passed) {
            $level = self::levelFromKey((string) $key);
            if ($level !== null && $passed === true) {
                $this->db->execute(
                    'INSERT INTO level_progress (user_id, level, passed_at) VALUES (?, ?, ?)',
                    [$userId, $level, Database::now()],
                );
            }
        }

        foreach ((array) ($legacy['history'] ?? []) as $key => $entries) {
            $level = self::levelFromKey((string) $key);
            if ($level === null || !is_array($entries)) {
                continue;
            }
            foreach ($entries as $entry) {
                $timestamp = self::timestamp((string) ($entry['timestamp'] ?? ''));
                if (isset($entry['manual'])) {
                    $this->db->execute(
                        'INSERT INTO progress_log (user_id, level, action, actor_id, created_at) VALUES (?, ?, ?, NULL, ?)',
                        [$userId, $level, $entry['manual'] === 'freigeschaltet' ? 'freigeschaltet' : 'gesperrt', $timestamp],
                    );
                } elseif (is_numeric($entry['score'] ?? null)) {
                    $this->db->execute(
                        'INSERT INTO quiz_attempts (user_id, level, score, details, created_at) VALUES (?, ?, ?, ?, ?)',
                        [
                            $userId,
                            $level,
                            (int) $entry['score'],
                            json_encode($entry['details'] ?? [], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
                            $timestamp,
                        ],
                    );
                }
            }
        }
    }

    /** "level2Passed" -> 2 */
    private static function levelFromKey(string $key): ?int
    {
        return preg_match('/^level(\d+)Passed$/', $key, $m) ? (int) $m[1] : null;
    }

    private static function timestamp(string $iso): string
    {
        try {
            return (new DateTimeImmutable($iso))->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d H:i:s.v');
        } catch (\Exception) {
            return Database::now();
        }
    }
}
