<?php

declare(strict_types=1);

namespace Kryptogame\Http;

final class Request
{
    /** @var array<string, string> Header-Namen in Kleinbuchstaben */
    private array $headers;

    /** @var array<string, mixed>|null */
    private ?array $json = null;

    /**
     * @param array<string, string> $headers
     */
    public function __construct(
        private string $method,
        private string $path,
        array $headers = [],
        private string $body = '',
        private string $ip = '',
    ) {
        $this->method = strtoupper($method);
        $this->path = '/' . trim($path, '/');
        $this->headers = array_change_key_case($headers, CASE_LOWER);
    }

    public static function fromGlobals(string $basePath): self
    {
        $uriPath = (string) parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
        $basePath = rtrim($basePath, '/');
        if ($basePath !== '' && strncmp($uriPath, $basePath, strlen($basePath)) === 0) {
            $uriPath = substr($uriPath, strlen($basePath));
        }
        // Aufrufe wie /api/index.php/auth/me ebenfalls unterstützen
        if (strncmp($uriPath, '/index.php', 10) === 0) {
            $uriPath = substr($uriPath, 10);
        }

        $headers = [];
        foreach ($_SERVER as $key => $value) {
            if (strncmp($key, 'HTTP_', 5) === 0) {
                $headers[str_replace('_', '-', strtolower(substr($key, 5)))] = (string) $value;
            }
        }
        if (isset($_SERVER['CONTENT_TYPE'])) {
            $headers['content-type'] = (string) $_SERVER['CONTENT_TYPE'];
        }

        return new self(
            (string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'),
            $uriPath,
            $headers,
            (string) file_get_contents('php://input'),
            (string) ($_SERVER['REMOTE_ADDR'] ?? ''),
        );
    }

    public function method(): string
    {
        return $this->method;
    }

    public function path(): string
    {
        return $this->path;
    }

    public function header(string $name): ?string
    {
        return $this->headers[strtolower($name)] ?? null;
    }

    public function ip(): string
    {
        return $this->ip;
    }

    /**
     * @return array<string, mixed>
     */
    public function json(): array
    {
        if ($this->json !== null) {
            return $this->json;
        }
        if (trim($this->body) === '') {
            return $this->json = [];
        }
        $data = json_decode($this->body, true);
        if (!is_array($data)) {
            throw HttpException::badRequest('Ungültiges JSON im Request.');
        }
        return $this->json = $data;
    }
}
