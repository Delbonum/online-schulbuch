<?php

declare(strict_types=1);

namespace Kryptogame\Http;

use RuntimeException;

/**
 * Fehler, der als JSON-Antwort mit passendem Statuscode an den Client geht.
 */
final class HttpException extends RuntimeException
{
    public function __construct(private int $status, string $message)
    {
        parent::__construct($message);
    }

    public function status(): int
    {
        return $this->status;
    }

    public static function badRequest(string $message): self
    {
        return new self(400, $message);
    }

    public static function unauthorized(string $message = 'Bitte melde dich an.'): self
    {
        return new self(401, $message);
    }

    public static function forbidden(string $message = 'Keine Berechtigung.'): self
    {
        return new self(403, $message);
    }

    public static function notFound(string $message = 'Nicht gefunden.'): self
    {
        return new self(404, $message);
    }

    public static function conflict(string $message): self
    {
        return new self(409, $message);
    }
}
