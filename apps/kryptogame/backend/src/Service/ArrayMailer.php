<?php

declare(strict_types=1);

namespace Kryptogame\Service;

/** Sammelt Mails im Arbeitsspeicher – für Tests. */
final class ArrayMailer implements Mailer
{
    /** @var list<array{to: string, subject: string, body: string}> */
    public array $sent = [];

    public function send(string $to, string $subject, string $body): bool
    {
        $this->sent[] = ['to' => $to, 'subject' => $subject, 'body' => $body];
        return true;
    }

    /** @return array{to: string, subject: string, body: string}|null */
    public function last(): ?array
    {
        return $this->sent === [] ? null : $this->sent[count($this->sent) - 1];
    }
}
