<?php

declare(strict_types=1);

namespace Kryptogame\Repository;

use Kryptogame\Database;

/**
 * Registrierungsanfragen von Lehrkräften, die das Master-Konto freischalten muss.
 */
final class RegistrationRepository
{
    public function __construct(private Database $db)
    {
    }

    /**
     * @param array{username: string, password_hash: string, full_name: string, school: string, city: string, email: string} $data
     * @return array{id: int, token: string}
     */
    public function create(array $data): array
    {
        $token = bin2hex(random_bytes(16));
        $this->db->execute(
            'INSERT INTO teacher_requests (username, password_hash, full_name, school, city, email, status, token, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                $data['username'],
                $data['password_hash'],
                $data['full_name'],
                $data['school'],
                $data['city'],
                $data['email'],
                'pending',
                $token,
                Database::now(),
            ],
        );
        return ['id' => $this->db->lastInsertId(), 'token' => $token];
    }

    /** @return array<string, mixed>|null */
    public function find(int $id): ?array
    {
        return $this->normalize($this->db->fetchOne('SELECT * FROM teacher_requests WHERE id = ?', [$id]));
    }

    /** @return array<string, mixed>|null */
    public function findByToken(string $token): ?array
    {
        return $this->normalize($this->db->fetchOne('SELECT * FROM teacher_requests WHERE token = ?', [$token]));
    }

    public function pendingUsernameExists(string $username): bool
    {
        return $this->db->fetchOne(
            "SELECT id FROM teacher_requests WHERE username = ? AND status = 'pending'",
            [$username],
        ) !== null;
    }

    /** @return list<array<string, mixed>> */
    public function all(?string $status = null): array
    {
        $rows = $status === null
            ? $this->db->fetchAll('SELECT * FROM teacher_requests ORDER BY created_at DESC')
            : $this->db->fetchAll('SELECT * FROM teacher_requests WHERE status = ? ORDER BY created_at DESC', [$status]);
        return array_map(fn (array $row): array => $this->normalize($row), $rows);
    }

    public function decide(int $id, string $status, ?int $actorId): void
    {
        $this->db->execute(
            'UPDATE teacher_requests SET status = ?, decided_at = ?, decided_by = ? WHERE id = ?',
            [$status, Database::now(), $actorId, $id],
        );
    }

    /**
     * @param array<string, mixed>|null $row
     * @return array<string, mixed>|null
     */
    private function normalize(?array $row): ?array
    {
        if ($row === null) {
            return null;
        }
        $row['id'] = (int) $row['id'];
        $row['decided_by'] = $row['decided_by'] === null ? null : (int) $row['decided_by'];
        return $row;
    }
}
