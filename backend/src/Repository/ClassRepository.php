<?php

declare(strict_types=1);

namespace Kryptogame\Repository;

use Kryptogame\Database;

/**
 * Klassen (Lerngruppen) einer Lehrkraft.
 */
final class ClassRepository
{
    public function __construct(private Database $db)
    {
    }

    /** @return list<array{id: int, name: string, studentCount: int}> */
    public function forTeacher(int $teacherId): array
    {
        $rows = $this->db->fetchAll(
            'SELECT c.id, c.name, (SELECT COUNT(*) FROM users u WHERE u.class_id = c.id) AS student_count
             FROM classes c WHERE c.teacher_id = ? ORDER BY c.name',
            [$teacherId],
        );
        return array_map(static fn (array $row): array => [
            'id' => (int) $row['id'],
            'name' => (string) $row['name'],
            'studentCount' => (int) $row['student_count'],
        ], $rows);
    }

    /** @return array{id: int, teacher_id: int, name: string}|null */
    public function find(int $id): ?array
    {
        $row = $this->db->fetchOne('SELECT id, teacher_id, name FROM classes WHERE id = ?', [$id]);
        return $row === null
            ? null
            : ['id' => (int) $row['id'], 'teacher_id' => (int) $row['teacher_id'], 'name' => (string) $row['name']];
    }

    public function nameExists(int $teacherId, string $name, ?int $exceptId = null): bool
    {
        $row = $this->db->fetchOne('SELECT id FROM classes WHERE teacher_id = ? AND name = ?', [$teacherId, $name]);
        return $row !== null && (int) $row['id'] !== $exceptId;
    }

    public function create(int $teacherId, string $name): int
    {
        $this->db->execute(
            'INSERT INTO classes (teacher_id, name, created_at) VALUES (?, ?, ?)',
            [$teacherId, $name, Database::now()],
        );
        return $this->db->lastInsertId();
    }

    public function rename(int $id, string $name): void
    {
        $this->db->execute('UPDATE classes SET name = ? WHERE id = ?', [$name, $id]);
    }

    /** Löscht die Klasse; die Schüler/-innen bleiben erhalten und haben danach keine Klasse mehr. */
    public function delete(int $id): void
    {
        $this->db->transaction(function () use ($id): void {
            $this->db->execute('UPDATE users SET class_id = NULL WHERE class_id = ?', [$id]);
            $this->db->execute('DELETE FROM classes WHERE id = ?', [$id]);
        });
    }
}
