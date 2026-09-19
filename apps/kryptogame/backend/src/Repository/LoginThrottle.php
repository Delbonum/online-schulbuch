<?php

declare(strict_types=1);

namespace Kryptogame\Repository;

use DateTimeImmutable;
use DateTimeZone;
use Kryptogame\Database;

/**
 * Bremst Passwort-Rateversuche: Nach zu vielen Fehlversuchen für einen
 * Benutzernamen oder von einer IP-Adresse wird der Login vorübergehend gesperrt.
 */
final class LoginThrottle
{
    public function __construct(
        private Database $db,
        private int $maxPerUsername = 10,
        private int $maxPerIp = 50,
        private int $windowMinutes = 15,
    ) {
    }

    public function isBlocked(string $username, string $ip): bool
    {
        $since = $this->windowStart();
        $byUser = $this->db->fetchOne(
            'SELECT COUNT(*) AS n FROM login_attempts WHERE username = ? AND created_at >= ?',
            [$username, $since],
        );
        if ((int) $byUser['n'] >= $this->maxPerUsername) {
            return true;
        }
        $byIp = $this->db->fetchOne(
            'SELECT COUNT(*) AS n FROM login_attempts WHERE ip = ? AND created_at >= ?',
            [$ip, $since],
        );
        return (int) $byIp['n'] >= $this->maxPerIp;
    }

    public function recordFailure(string $username, string $ip): void
    {
        $this->db->execute(
            'INSERT INTO login_attempts (username, ip, created_at) VALUES (?, ?, ?)',
            [mb_substr($username, 0, 64), mb_substr($ip, 0, 45), Database::now()],
        );
        // Alte Einträge gelegentlich aufräumen
        if (random_int(1, 20) === 1) {
            $this->db->execute('DELETE FROM login_attempts WHERE created_at < ?', [$this->windowStart()]);
        }
    }

    public function clear(string $username): void
    {
        $this->db->execute('DELETE FROM login_attempts WHERE username = ?', [$username]);
    }

    private function windowStart(): string
    {
        return (new DateTimeImmutable("-{$this->windowMinutes} minutes", new DateTimeZone('UTC')))->format('Y-m-d H:i:s.v');
    }
}
