<?php

declare(strict_types=1);

namespace Kryptogame\Repository;

use Kryptogame\Database;

/**
 * @phpstan-type User array{id: int, username: string, password_hash: string, role: string, teacher_id: ?int, created_at: string}
 */
final class UserRepository
{
    public function __construct(private Database $db)
    {
    }

    /** @return User|null */
    public function findById(int $id): ?array
    {
        return $this->normalize($this->db->fetchOne('SELECT * FROM users WHERE id = ?', [$id]));
    }

    /** @return User|null */
    public function findByUsername(string $username): ?array
    {
        return $this->normalize($this->db->fetchOne('SELECT * FROM users WHERE username = ?', [$username]));
    }

    public function usernameExists(string $username, ?int $exceptId = null): bool
    {
        $row = $this->db->fetchOne('SELECT id FROM users WHERE username = ?', [$username]);
        return $row !== null && (int) $row['id'] !== $exceptId;
    }

    /** @return list<User> */
    public function studentsOf(int $teacherId): array
    {
        $rows = $this->db->fetchAll(
            "SELECT * FROM users WHERE role = 'student' AND teacher_id = ? ORDER BY username",
            [$teacherId],
        );
        return array_map(fn (array $row): array => $this->normalize($row), $rows);
    }

    public function create(string $username, string $passwordHash, string $role, ?int $teacherId, ?int $classId = null): int
    {
        $this->db->execute(
            'INSERT INTO users (username, password_hash, role, teacher_id, class_id, created_at) VALUES (?, ?, ?, ?, ?, ?)',
            [$username, $passwordHash, $role, $teacherId, $classId, Database::now()],
        );
        return $this->db->lastInsertId();
    }

    /** @return list<array<string, mixed>> Lehrkräfte mit Anzahl ihrer Schüler/-innen */
    public function teachers(): array
    {
        $rows = $this->db->fetchAll(
            "SELECT u.*, (SELECT COUNT(*) FROM users s WHERE s.teacher_id = u.id) AS student_count
             FROM users u WHERE u.role = 'teacher' ORDER BY u.username",
        );
        return array_map(function (array $row): array {
            $user = $this->normalize($row);
            $user['student_count'] = (int) $row['student_count'];
            return $user;
        }, $rows);
    }

    public function countStudents(int $teacherId): int
    {
        $row = $this->db->fetchOne("SELECT COUNT(*) AS n FROM users WHERE role = 'student' AND teacher_id = ?", [$teacherId]);
        return (int) ($row['n'] ?? 0);
    }

    public function countMasters(): int
    {
        $row = $this->db->fetchOne("SELECT COUNT(*) AS n FROM users WHERE role = 'teacher' AND is_master = 1");
        return (int) ($row['n'] ?? 0);
    }

    public function setMaster(int $id, bool $isMaster): void
    {
        $this->db->execute('UPDATE users SET is_master = ? WHERE id = ?', [$isMaster ? 1 : 0, $id]);
    }

    public function setClass(int $id, ?int $classId): void
    {
        $this->db->execute('UPDATE users SET class_id = ? WHERE id = ?', [$classId, $id]);
    }

    public function rename(int $id, string $username): void
    {
        $this->db->execute('UPDATE users SET username = ? WHERE id = ?', [$username, $id]);
    }

    public function updatePasswordHash(int $id, string $passwordHash): void
    {
        $this->db->execute('UPDATE users SET password_hash = ? WHERE id = ?', [$passwordHash, $id]);
    }

    public function delete(int $id): void
    {
        $this->db->execute('DELETE FROM users WHERE id = ?', [$id]);
    }

    /**
     * @param array<string, mixed>|null $row
     * @return User|null
     */
    private function normalize(?array $row): ?array
    {
        if ($row === null) {
            return null;
        }
        $row['id'] = (int) $row['id'];
        $row['teacher_id'] = $row['teacher_id'] === null ? null : (int) $row['teacher_id'];
        $row['class_id'] = ($row['class_id'] ?? null) === null ? null : (int) $row['class_id'];
        $row['is_master'] = (bool) ($row['is_master'] ?? false);
        return $row;
    }
}
