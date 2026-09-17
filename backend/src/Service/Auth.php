<?php

declare(strict_types=1);

namespace Kryptogame\Service;

use Kryptogame\Http\HttpException;
use Kryptogame\Http\Session;
use Kryptogame\Repository\LoginThrottle;
use Kryptogame\Repository\UserRepository;

final class Auth
{
    private const SESSION_KEY = 'user_id';

    /** @var array<string, mixed>|null|false false = noch nicht geladen */
    private array|null|false $current = false;

    public function __construct(
        private UserRepository $users,
        private LoginThrottle $throttle,
        private Session $session,
    ) {
    }

    /**
     * @return array<string, mixed> der angemeldete Benutzer
     */
    public function login(string $username, string $password, string $ip): array
    {
        if ($this->throttle->isBlocked($username, $ip)) {
            throw new HttpException(429, 'Zu viele fehlgeschlagene Anmeldeversuche. Bitte warte einige Minuten.');
        }

        $user = $this->users->findByUsername($username);
        // Auch bei unbekanntem Namen einen Hash prüfen, damit die Antwortzeit nichts verrät.
        $hash = $user['password_hash'] ?? '$2y$10$hhxXhqXCQN3dHyb02jQeM.0FxmnDuR5xpe2QHnYgDC5L6ESFd3mwS';
        if (!password_verify($password, $hash) || $user === null) {
            $this->throttle->recordFailure($username, $ip);
            throw HttpException::unauthorized('Benutzername oder Passwort sind nicht korrekt.');
        }

        if (password_needs_rehash($user['password_hash'], PASSWORD_DEFAULT)) {
            $this->users->updatePasswordHash($user['id'], password_hash($password, PASSWORD_DEFAULT));
        }

        $this->throttle->clear($username);
        $this->session->regenerate();
        $this->session->set(self::SESSION_KEY, $user['id']);
        $this->current = $user;
        return $user;
    }

    public function logout(): void
    {
        $this->session->destroy();
        $this->current = null;
    }

    /** @return array<string, mixed>|null */
    public function user(): ?array
    {
        if ($this->current === false) {
            $id = $this->session->get(self::SESSION_KEY);
            $this->current = is_int($id) ? $this->users->findById($id) : null;
        }
        return $this->current;
    }

    /** @return array<string, mixed> */
    public function requireUser(): array
    {
        return $this->user() ?? throw HttpException::unauthorized();
    }

    /** @return array<string, mixed> */
    public function requireTeacher(): array
    {
        $user = $this->requireUser();
        if ($user['role'] !== 'teacher') {
            throw HttpException::forbidden('Nur für Lehrkräfte.');
        }
        return $user;
    }
}
