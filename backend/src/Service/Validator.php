<?php

declare(strict_types=1);

namespace Kryptogame\Service;

use Kryptogame\Http\HttpException;

final class Validator
{
    public const PASSWORD_MIN_LENGTH = 6;

    public static function username(mixed $value): string
    {
        $username = is_string($value) ? trim($value) : '';
        if (!preg_match('/^[\p{L}\p{N}._-]{3,32}$/u', $username)) {
            throw HttpException::badRequest(
                'Der Benutzername muss 3–32 Zeichen lang sein und darf nur Buchstaben, Ziffern sowie . _ - enthalten.'
            );
        }
        return $username;
    }

    public static function password(mixed $value): string
    {
        $password = is_string($value) ? $value : '';
        $length = mb_strlen($password);
        if ($length < self::PASSWORD_MIN_LENGTH || $length > 200) {
            throw HttpException::badRequest(
                'Das Passwort muss mindestens ' . self::PASSWORD_MIN_LENGTH . ' Zeichen lang sein.'
            );
        }
        return $password;
    }

    public static function className(mixed $value): string
    {
        $name = is_string($value) ? trim($value) : '';
        if (mb_strlen($name) < 1 || mb_strlen($name) > 64) {
            throw HttpException::badRequest('Der Klassenname muss 1–64 Zeichen lang sein.');
        }
        return $name;
    }

    public static function text(mixed $value, string $label, int $max = 128): string
    {
        $text = is_string($value) ? trim($value) : '';
        if ($text === '' || mb_strlen($text) > $max) {
            throw HttpException::badRequest("Bitte {$label} angeben (höchstens {$max} Zeichen).");
        }
        return $text;
    }

    public static function email(mixed $value): string
    {
        $email = is_string($value) ? trim($value) : '';
        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 190) {
            throw HttpException::badRequest('Bitte eine gültige E-Mail-Adresse angeben.');
        }
        return $email;
    }

    public static function positiveInt(mixed $value, string $label): int
    {
        if (is_int($value) && $value > 0) {
            return $value;
        }
        if (is_string($value) && ctype_digit($value) && (int) $value > 0) {
            return (int) $value;
        }
        throw HttpException::badRequest("Ungültige Angabe: {$label}.");
    }
}
