<?php

declare(strict_types=1);

namespace Kryptogame\Http;

/**
 * PHP-Session, die erst gestartet wird, wenn sie gebraucht wird.
 */
final class NativeSession implements Session
{
    private bool $started = false;

    public function __construct(
        private string $cookiePath,
        private bool $secure,
        private int $lifetimeSeconds,
    ) {
    }

    public function get(string $key): mixed
    {
        // Ohne Session-Cookie gibt es nichts zu lesen, also auch keine Session anlegen.
        if (!$this->started && !isset($_COOKIE[$this->name()])) {
            return null;
        }
        $this->start();
        return $_SESSION[$key] ?? null;
    }

    public function set(string $key, mixed $value): void
    {
        $this->start();
        $_SESSION[$key] = $value;
    }

    public function regenerate(): void
    {
        $this->start();
        session_regenerate_id(true);
    }

    public function destroy(): void
    {
        if (!$this->started && !isset($_COOKIE[$this->name()])) {
            return;
        }
        $this->start();
        $_SESSION = [];
        setcookie($this->name(), '', [
            'expires' => time() - 3600,
            'path' => $this->cookiePath,
            'secure' => $this->secure,
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
        session_destroy();
        $this->started = false;
    }

    private function name(): string
    {
        return 'KRYPTOGAME_SESSION';
    }

    private function start(): void
    {
        if ($this->started) {
            return;
        }
        session_name($this->name());
        ini_set('session.use_strict_mode', '1');
        ini_set('session.gc_maxlifetime', (string) $this->lifetimeSeconds);
        session_set_cookie_params([
            'lifetime' => 0,
            'path' => $this->cookiePath,
            'secure' => $this->secure,
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
        session_start();
        $this->started = true;
    }
}
