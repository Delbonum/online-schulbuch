<?php

declare(strict_types=1);

namespace Kryptogame;

use RuntimeException;

final class Config
{
    /**
     * @return array{
     *     db: array{dsn: string, user?: ?string, password?: ?string},
     *     base_path: string,
     *     secure_cookies: bool,
     *     session_lifetime: int,
     *     debug: bool
     * }
     */
    public static function load(string $file): array
    {
        if (!is_file($file)) {
            throw new RuntimeException('config.php fehlt. Bitte config.example.php kopieren und anpassen.');
        }
        $config = require $file;
        if (!is_array($config) || !is_string($config['db']['dsn'] ?? null)) {
            throw new RuntimeException('config.php ist unvollständig: db.dsn fehlt.');
        }

        // Relative SQLite-Pfade beziehen sich auf den Backend-Ordner
        if (preg_match('#^sqlite:(?!/|[A-Za-z]:|:memory:)(.+)$#', $config['db']['dsn'], $m)) {
            $config['db']['dsn'] = 'sqlite:' . dirname($file) . '/' . $m[1];
        }

        return [
            'db' => $config['db'],
            'base_path' => (string) ($config['base_path'] ?? '/informatik/kryptogame/api'),
            'secure_cookies' => (bool) ($config['secure_cookies'] ?? true),
            'session_lifetime' => (int) ($config['session_lifetime'] ?? 8 * 3600),
            'debug' => (bool) ($config['debug'] ?? false),
        ];
    }
}
