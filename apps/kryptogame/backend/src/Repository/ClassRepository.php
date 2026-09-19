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

    /** @return list<array{id: int, name: string, studentCount: int, optionalLevels: list<int>}> */
    public function forTeacher(int $teacherId): array
    {
        $rows = $this->db->fetchAll(
            'SELECT c.id, c.name, (SELECT COUNT(*) FROM users u WHERE u.class_id = c.id) AS student_count
             FROM classes c WHERE c.teacher_id = ? ORDER BY c.name',
            [$teacherId],
        );
        return array_map(fn (array $row): array => [
            'id' => (int) $row['id'],
            'name' => (string) $row['name'],
            'studentCount' => (int) $row['student_count'],
            'optionalLevels' => $this->optionalLevels((int) $row['id']),
        ], $rows);
    }

    /**
     * Level, die für diese Klasse freiwillig sind: Ihre Zwischenprüfung muss nicht
     * bestanden werden, um das nächste Level zu öffnen.
     *
     * @return list<int>
     */
    public function optionalLevels(int $classId): array
    {
        $rows = $this->db->fetchAll(
            'SELECT level FROM class_optional_levels WHERE class_id = ? ORDER BY level',
            [$classId],
        );
        return array_map(static fn (array $row): int => (int) $row['level'], $rows);
    }

    /** Optionale Level einer Klasse setzen (ersetzt die bisherigen). @param list<int> $levels */
    public function setOptionalLevels(int $classId, array $levels): void
    {
        $this->db->transaction(function () use ($classId, $levels): void {
            $this->db->execute('DELETE FROM class_optional_levels WHERE class_id = ?', [$classId]);
            foreach (array_unique($levels) as $level) {
                $this->db->execute(
                    'INSERT INTO class_optional_levels (class_id, level) VALUES (?, ?)',
                    [$classId, $level],
                );
            }
        });
    }

    /** Optionale Level der Klasse, in der diese Person ist (leer, wenn ohne Klasse). @return list<int> */
    public function optionalLevelsForUser(int $userId): array
    {
        $rows = $this->db->fetchAll(
            'SELECT o.level FROM class_optional_levels o
             JOIN users u ON u.class_id = o.class_id
             WHERE u.id = ? ORDER BY o.level',
            [$userId],
        );
        return array_map(static fn (array $row): int => (int) $row['level'], $rows);
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
            $this->db->execute('DELETE FROM class_optional_levels WHERE class_id = ?', [$id]);
            $this->db->execute('UPDATE users SET class_id = NULL WHERE class_id = ?', [$id]);
            $this->db->execute('DELETE FROM classes WHERE id = ?', [$id]);
        });
    }
}
