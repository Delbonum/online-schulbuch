<?php

declare(strict_types=1);

namespace Kryptogame\Service;

/**
 * Versand über die PHP-Funktion mail(). Auf üblichem Webhosting reicht das aus.
 * Ist keine Absenderadresse konfiguriert, wird nichts verschickt.
 */
final class PhpMailer implements Mailer
{
    public function __construct(private string $from)
    {
    }

    public function send(string $to, string $subject, string $body): bool
    {
        if ($this->from === '' || !filter_var($to, FILTER_VALIDATE_EMAIL)) {
            return false;
        }

        $headers = [
            'From: KryptoGAME <' . $this->from . '>',
            'Content-Type: text/plain; charset=UTF-8',
            'Content-Transfer-Encoding: 8bit',
            'MIME-Version: 1.0',
        ];

        // Betreff nach RFC 2047 kodieren, damit Umlaute ankommen
        $encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';

        $sent = @mail($to, $encodedSubject, $body, implode("\r\n", $headers));
        if (!$sent) {
            error_log('[KryptoGAME] E-Mail an ' . $to . ' konnte nicht versendet werden.');
        }
        return $sent;
    }
}
