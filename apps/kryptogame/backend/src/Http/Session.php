<?php

declare(strict_types=1);

namespace Kryptogame\Http;

interface Session
{
    public function get(string $key): mixed;

    public function set(string $key, mixed $value): void;

    /** Neue Session-ID vergeben (nach dem Login gegen Session Fixation). */
    public function regenerate(): void;

    public function destroy(): void;
}
