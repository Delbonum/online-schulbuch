<?php

declare(strict_types=1);

namespace Kryptogame\Http;

/**
 * Session im Arbeitsspeicher – für Tests und Kommandozeile.
 */
final class ArraySession implements Session
{
    /** @var array<string, mixed> */
    private array $data = [];

    public function get(string $key): mixed
    {
        return $this->data[$key] ?? null;
    }

    public function set(string $key, mixed $value): void
    {
        $this->data[$key] = $value;
    }

    public function regenerate(): void
    {
    }

    public function destroy(): void
    {
        $this->data = [];
    }
}
