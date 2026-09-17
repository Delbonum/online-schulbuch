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
        return $row;
    }
}
