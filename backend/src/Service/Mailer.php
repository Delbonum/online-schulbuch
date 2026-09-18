<?php

declare(strict_types=1);

namespace Kryptogame\Service;

interface Mailer
{
    /** @return bool true, wenn die Mail zum Versand angenommen wurde */
    public function send(string $to, string $subject, string $body): bool;
}
