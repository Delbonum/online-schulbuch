<?php

declare(strict_types=1);

namespace Schulbuch\Service;

use Schulbuch\Http\HttpException;

/**
 * Prüft Umfragen (Titel, Modus, Countdown, Fragen) und Antworten.
 *
 * Eine Frage ist entweder eine Skala (Schieberegler) oder eine Auswahl aus Antwortvorgaben:
 *   {id, text, type: "scale",  min, max, step, left, right}
 *   {id, text, type: "choice", options: [..], correct: null|Index}
 */
final class PollValidator
{
    public const MODES = ['single', 'all'];
    public const MAX_QUESTIONS = 60;
    public const MAX_OPTIONS = 12;
    public const MAX_COUNTDOWN = 3600;

    /**
     * @param array<string, mixed> $body
     * @return array{title: string, mode: string, countdown: int, questions: list<array<string, mixed>>}
     */
    public static function poll(array $body): array
    {
        $title = is_string($body['title'] ?? null) ? trim($body['title']) : '';
        if ($title === '' || mb_strlen($title) > 200) {
            throw HttpException::badRequest('Bitte einen Titel angeben (höchstens 200 Zeichen).');
        }
        $mode = $body['mode'] ?? 'single';
        if (!in_array($mode, self::MODES, true)) {
            throw HttpException::badRequest('Unbekannter Modus.');
        }
        return [
            'title' => $title,
            'mode' => $mode,
            'countdown' => self::countdown($body['countdown'] ?? 0),
            'questions' => self::questions($body['questions'] ?? null),
        ];
    }

    public static function countdown(mixed $value): int
    {
        if (!is_int($value) || $value < 0 || $value > self::MAX_COUNTDOWN) {
            throw HttpException::badRequest('Der Countdown muss zwischen 0 und ' . self::MAX_COUNTDOWN . ' Sekunden liegen.');
        }
        return $value;
    }

    /** @return list<array<string, mixed>> */
    public static function questions(mixed $value): array
    {
        if (!is_array($value) || !array_is_list($value) || $value === []) {
            throw HttpException::badRequest('Eine Umfrage braucht mindestens eine Frage.');
        }
        if (count($value) > self::MAX_QUESTIONS) {
            throw HttpException::badRequest('Eine Umfrage darf höchstens ' . self::MAX_QUESTIONS . ' Fragen haben.');
        }
        $questions = [];
        $ids = [];
        foreach ($value as $i => $raw) {
            $question = self::question($raw, $i + 1);
            if (isset($ids[$question['id']])) {
                $question['id'] = self::newId();
            }
            $ids[$question['id']] = true;
            $questions[] = $question;
        }
        return $questions;
    }

    /** @return array<string, mixed> */
    private static function question(mixed $raw, int $number): array
    {
        if (!is_array($raw)) {
            throw HttpException::badRequest("Frage {$number} ist ungültig.");
        }
        $id = is_string($raw['id'] ?? null) && preg_match('/^[a-z0-9]{1,16}$/', $raw['id']) ? $raw['id'] : self::newId();
        $text = is_string($raw['text'] ?? null) ? trim($raw['text']) : '';
        if ($text === '' || mb_strlen($text) > 500) {
            throw HttpException::badRequest("Frage {$number}: Bitte einen Fragetext angeben (höchstens 500 Zeichen).");
        }

        if (($raw['type'] ?? null) === 'scale') {
            $min = $raw['min'] ?? 0;
            $max = $raw['max'] ?? 10;
            $step = $raw['step'] ?? 1;
            if (!is_int($min) || !is_int($max) || $min < -1000 || $max > 1000 || $min >= $max) {
                throw HttpException::badRequest("Frage {$number}: Die Skala braucht ganze Zahlen mit Minimum < Maximum (zwischen -1000 und 1000).");
            }
            if (!is_int($step) && !is_float($step) || $step <= 0 || ($max - $min) / $step > 1000) {
                throw HttpException::badRequest("Frage {$number}: Ungültige Schrittweite.");
            }
            return [
                'id' => $id,
                'text' => $text,
                'type' => 'scale',
                'min' => $min,
                'max' => $max,
                'step' => $step,
                'left' => self::label($raw['left'] ?? '', $number),
                'right' => self::label($raw['right'] ?? '', $number),
            ];
        }

        if (($raw['type'] ?? null) === 'choice') {
            $options = $raw['options'] ?? null;
            if (!is_array($options) || !array_is_list($options) || count($options) < 2 || count($options) > self::MAX_OPTIONS) {
                throw HttpException::badRequest("Frage {$number}: Bitte 2 bis " . self::MAX_OPTIONS . ' Antwortvorgaben angeben.');
            }
            $clean = [];
            foreach ($options as $option) {
                $option = is_string($option) ? trim($option) : '';
                if ($option === '' || mb_strlen($option) > 200) {
                    throw HttpException::badRequest("Frage {$number}: Antwortvorgaben dürfen nicht leer sein (höchstens 200 Zeichen).");
                }
                $clean[] = $option;
            }
            $correct = $raw['correct'] ?? null;
            if ($correct !== null && (!is_int($correct) || $correct < 0 || $correct >= count($clean))) {
                $correct = null;
            }
            return ['id' => $id, 'text' => $text, 'type' => 'choice', 'options' => $clean, 'correct' => $correct];
        }

        throw HttpException::badRequest("Frage {$number}: Unbekannter Fragetyp.");
    }

    private static function label(mixed $value, int $number): string
    {
        $label = is_string($value) ? trim($value) : '';
        if (mb_strlen($label) > 100) {
            throw HttpException::badRequest("Frage {$number}: Die Beschriftung der Skala ist zu lang (höchstens 100 Zeichen).");
        }
        return $label;
    }

    /** Prüft eine Antwort auf eine Frage und gibt den zu speichernden Wert zurück. */
    public static function answer(array $question, mixed $value): float
    {
        if (!is_int($value) && !is_float($value)) {
            throw HttpException::badRequest('Ungültige Antwort.');
        }
        if ($question['type'] === 'choice') {
            if (!is_int($value) || $value < 0 || $value >= count($question['options'])) {
                throw HttpException::badRequest('Ungültige Antwort.');
            }
            return (float) $value;
        }
        if ($value < $question['min'] || $value > $question['max']) {
            throw HttpException::badRequest('Die Antwort liegt außerhalb der Skala.');
        }
        // auf die Schrittweite runden
        $steps = round(($value - $question['min']) / $question['step']);
        return round($question['min'] + $steps * $question['step'], 6);
    }

    public static function newId(): string
    {
        return substr(bin2hex(random_bytes(6)), 0, 8);
    }
}
