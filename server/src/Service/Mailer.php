<?php

declare(strict_types=1);

namespace Schulbuch\Service;

interface Mailer
{
    /** @return bool true, wenn die Mail zum Versand angenommen wurde */
    public function send(string $to, string $subject, string $body): bool;
}
