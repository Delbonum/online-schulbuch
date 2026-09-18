<?php

declare(strict_types=1);

namespace Kryptogame\Http;

final class Response
{
    /**
     * @param mixed $data wird als JSON ausgeliefert
     */
    private string $contentType = 'application/json; charset=utf-8';

    public function __construct(
        private mixed $data = null,
        private int $status = 200,
    ) {
    }

    public static function json(mixed $data, int $status = 200): self
    {
        return new self($data, $status);
    }

    /** Antwort als HTML-Seite (für Links, die im Browser geöffnet werden). */
    public static function html(string $html, int $status = 200): self
    {
        $response = new self($html, $status);
        $response->contentType = 'text/html; charset=utf-8';
        return $response;
    }

    public static function noContent(): self
    {
        return new self(null, 204);
    }

    public static function error(int $status, string $message): self
    {
        return new self(['error' => $message], $status);
    }

    public function status(): int
    {
        return $this->status;
    }

    public function data(): mixed
    {
        return $this->data;
    }

    public function send(): void
    {
        http_response_code($this->status);
        header('Cache-Control: no-store');
        header('X-Content-Type-Options: nosniff');
        if ($this->status === 204) {
            return;
        }
        header('Content-Type: ' . $this->contentType);
        if (str_starts_with($this->contentType, 'text/html')) {
            echo (string) $this->data;
            return;
        }
        echo json_encode($this->data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    }
}
