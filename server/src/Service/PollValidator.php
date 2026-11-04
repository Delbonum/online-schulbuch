<?php

declare(strict_types=1);

namespace Schulbuch\Service;

use Schulbuch\Http\HttpException;

/**
 * Prüft Einträge der Live-Werkzeuge (Titel, Modus, Einstellungen, Fragen) und Antworten.
 *
 * Werkzeuge (kind) und ihre Fragetypen:
 *   poll        Umfrage    scale {min, max, step, left, right} · choice {options, correct}
 *   wordcloud   Wortwolke  words {maxWords, maxLength}
 *   quiz        Quiz       quiz {options, correct: [Indizes], time}
 *   evaluation  Evaluation scale · choice · text {maxLength}; dazu section, dimension, reverse
 */
final class PollValidator
{
    public const KINDS = ['poll', 'wordcloud', 'quiz', 'evaluation'];
    public const MODES = ['single', 'all'];
    public const MAX_QUESTIONS = 60;
    public const MAX_OPTIONS = 12;
    public const MAX_COUNTDOWN = 3600;
    private const TYPES = [
        'poll' => ['scale', 'choice'],
        'wordcloud' => ['words'],
        'quiz' => ['quiz'],
        'evaluation' => ['scale', 'choice', 'text'],
    ];

    public static function kind(mixed $value): string
    {
        $kind = $value ?? 'poll';
        if (!in_array($kind, self::KINDS, true)) {
            throw HttpException::badRequest('Unbekanntes Werkzeug.');
        }
        return $kind;
    }

    /**
     * @param array<string, mixed> $body
     * @return array{title: string, mode: string, countdown: int, questions: list<array<string, mixed>>, settings: array<string, mixed>}
     */
    public static function poll(array $body, string $kind = 'poll'): array
    {
        $title = is_string($body['title'] ?? null) ? trim($body['title']) : '';
        if ($title === '' || mb_strlen($title) > 200) {
            throw HttpException::badRequest('Bitte einen Titel angeben (höchstens 200 Zeichen).');
        }
        $mode = match ($kind) {
            'poll' => $body['mode'] ?? 'single',
            'evaluation' => 'all',
            default => 'single',
        };
        if (!in_array($mode, self::MODES, true)) {
            throw HttpException::badRequest('Unbekannter Modus.');
        }
        return [
            'title' => $title,
            'mode' => $mode,
            'countdown' => $kind === 'poll' ? self::countdown($body['countdown'] ?? 0) : 0,
            'questions' => self::questions($body['questions'] ?? null, $kind),
            'settings' => self::settings($body['settings'] ?? [], $kind),
        ];
    }

    public static function countdown(mixed $value): int
    {
        if (!is_int($value) || $value < 0 || $value > self::MAX_COUNTDOWN) {
            throw HttpException::badRequest('Der Countdown muss zwischen 0 und ' . self::MAX_COUNTDOWN . ' Sekunden liegen.');
        }
        return $value;
    }

    /** @return array<string, mixed> */
    public static function settings(mixed $raw, string $kind): array
    {
        if ($kind !== 'evaluation') {
            return [];
        }
        $raw = is_array($raw) ? $raw : [];
        $min = $raw['minResponses'] ?? 5;
        $dimensions = [];
        foreach (is_array($raw['dimensions'] ?? null) ? $raw['dimensions'] : [] as $d) {
            if (!is_array($d) || !is_string($d['name'] ?? null) || trim($d['name']) === '' || count($dimensions) >= 40) {
                continue;
            }
            $dimensions[] = [
                'name' => mb_substr(trim($d['name']), 0, 100),
                'group' => mb_substr(trim((string) ($d['group'] ?? '')), 0, 100),
                'hint' => mb_substr(trim((string) ($d['hint'] ?? '')), 0, 300),
            ];
        }
        return [
            'intro' => mb_substr(trim((string) ($raw['intro'] ?? '')), 0, 2000),
            'outro' => mb_substr(trim((string) ($raw['outro'] ?? '')), 0, 2000),
            'minResponses' => is_int($min) ? max(3, min(50, $min)) : 5,
            'dimensions' => $dimensions,
        ];
    }

    /** @return list<array<string, mixed>> */
    public static function questions(mixed $value, string $kind = 'poll'): array
    {
        if (!is_array($value) || !array_is_list($value) || $value === []) {
            throw HttpException::badRequest('Es braucht mindestens eine Frage.');
        }
        if (count($value) > self::MAX_QUESTIONS) {
            throw HttpException::badRequest('Höchstens ' . self::MAX_QUESTIONS . ' Fragen sind möglich.');
        }
        $questions = [];
        $ids = [];
        foreach ($value as $i => $raw) {
            $question = self::question($raw, $i + 1, $kind);
            if (isset($ids[$question['id']])) {
                $question['id'] = self::newId();
            }
            $ids[$question['id']] = true;
            $questions[] = $question;
        }
        return $questions;
    }

    /** @return array<string, mixed> */
    private static function question(mixed $raw, int $number, string $kind): array
    {
        if (!is_array($raw)) {
            throw HttpException::badRequest("Frage {$number} ist ungültig.");
        }
        $id = is_string($raw['id'] ?? null) && preg_match('/^[a-z0-9]{1,16}$/', $raw['id']) ? $raw['id'] : self::newId();
        $text = is_string($raw['text'] ?? null) ? trim($raw['text']) : '';
        if ($text === '' || mb_strlen($text) > 500) {
            throw HttpException::badRequest("Frage {$number}: Bitte einen Fragetext angeben (höchstens 500 Zeichen).");
        }
        $type = $raw['type'] ?? null;
        if (!in_array($type, self::TYPES[$kind], true)) {
            throw HttpException::badRequest("Frage {$number}: Diese Art von Frage gibt es hier nicht.");
        }
        $question = ['id' => $id, 'text' => $text, 'type' => $type] + match ($type) {
            'scale' => self::scale($raw, $number),
            'choice' => self::choice($raw, $number),
            'words' => [
                'maxWords' => self::intIn($raw['maxWords'] ?? 3, 1, 10, 3),
                'maxLength' => self::intIn($raw['maxLength'] ?? 30, 5, 80, 30),
            ],
            'quiz' => self::quiz($raw, $number),
            'text' => ['maxLength' => self::intIn($raw['maxLength'] ?? 1000, 50, 3000, 1000)],
        };
        if ($kind === 'evaluation') {
            foreach (['section' => 200, 'dimension' => 100] as $key => $max) {
                $value = is_string($raw[$key] ?? null) ? trim($raw[$key]) : '';
                if ($value !== '') {
                    $question[$key] = mb_substr($value, 0, $max);
                }
            }
            if (($raw['reverse'] ?? false) === true) {
                $question['reverse'] = true;
            }
        }
        return $question;
    }

    /** @return array<string, mixed> */
    private static function scale(array $raw, int $number): array
    {
        $min = $raw['min'] ?? 0;
        $max = $raw['max'] ?? 10;
        $step = $raw['step'] ?? 1;
        if (!is_int($min) || !is_int($max) || $min < -1000 || $max > 1000 || $min >= $max) {
            throw HttpException::badRequest("Frage {$number}: Die Skala braucht ganze Zahlen mit Minimum < Maximum (zwischen -1000 und 1000).");
        }
        if ((!is_int($step) && !is_float($step)) || $step <= 0 || ($max - $min) / $step > 1000) {
            throw HttpException::badRequest("Frage {$number}: Ungültige Schrittweite.");
        }
        return ['min' => $min, 'max' => $max, 'step' => $step, 'left' => self::label($raw['left'] ?? '', $number), 'right' => self::label($raw['right'] ?? '', $number)];
    }

    /** @return array<string, mixed> */
    private static function choice(array $raw, int $number): array
    {
        $options = self::options($raw['options'] ?? null, $number);
        $correct = $raw['correct'] ?? null;
        if ($correct !== null && (!is_int($correct) || $correct < 0 || $correct >= count($options))) {
            $correct = null;
        }
        return ['options' => $options, 'correct' => $correct];
    }

    /** @return array<string, mixed> */
    private static function quiz(array $raw, int $number): array
    {
        $options = self::options($raw['options'] ?? null, $number, 6);
        $correct = $raw['correct'] ?? null;
        $correct = is_int($correct) ? [$correct] : $correct;
        if (!is_array($correct)) {
            $correct = [];
        }
        $correct = array_values(array_unique(array_filter($correct, static fn ($c): bool => is_int($c) && $c >= 0 && $c < count($options))));
        sort($correct);
        if ($correct === []) {
            throw HttpException::badRequest("Frage {$number}: Bitte mindestens eine richtige Antwort markieren.");
        }
        return ['options' => $options, 'correct' => $correct, 'time' => self::intIn($raw['time'] ?? 20, 5, 240, 20)];
    }

    /** @return list<string> */
    private static function options(mixed $options, int $number, int $max = self::MAX_OPTIONS): array
    {
        if (!is_array($options) || !array_is_list($options) || count($options) < 2 || count($options) > $max) {
            throw HttpException::badRequest("Frage {$number}: Bitte 2 bis {$max} Antwortvorgaben angeben.");
        }
        $clean = [];
        foreach ($options as $option) {
            $option = is_string($option) ? trim($option) : '';
            if ($option === '' || mb_strlen($option) > 200) {
                throw HttpException::badRequest("Frage {$number}: Antwortvorgaben dürfen nicht leer sein (höchstens 200 Zeichen).");
            }
            $clean[] = $option;
        }
        return $clean;
    }

    private static function label(mixed $value, int $number): string
    {
        $label = is_string($value) ? trim($value) : '';
        if (mb_strlen($label) > 100) {
            throw HttpException::badRequest("Frage {$number}: Die Beschriftung der Skala ist zu lang (höchstens 100 Zeichen).");
        }
        return $label;
    }

    private static function intIn(mixed $value, int $min, int $max, int $default): int
    {
        return is_int($value) ? max($min, min($max, $value)) : $default;
    }

    /** Prüft eine Zahlen-Antwort (Skala, Auswahl, Quiz) und gibt den zu speichernden Wert zurück. */
    public static function answer(array $question, mixed $value): float
    {
        if (!is_int($value) && !is_float($value)) {
            throw HttpException::badRequest('Ungültige Antwort.');
        }
        if ($question['type'] === 'choice' || $question['type'] === 'quiz') {
            if (!is_int($value) || $value < 0 || $value >= count($question['options'])) {
                throw HttpException::badRequest('Ungültige Antwort.');
            }
            return (float) $value;
        }
        if ($question['type'] !== 'scale') {
            throw HttpException::badRequest('Ungültige Antwort.');
        }
        if ($value < $question['min'] || $value > $question['max']) {
            throw HttpException::badRequest('Die Antwort liegt außerhalb der Skala.');
        }
        // auf die Schrittweite runden
        $steps = round(($value - $question['min']) / $question['step']);
        return round($question['min'] + $steps * $question['step'], 6);
    }

    /** Prüft eine Text-Antwort (Freitext der Evaluation). */
    public static function text(array $question, mixed $value): string
    {
        $text = is_string($value) ? trim(str_replace("\r", '', $value)) : '';
        if ($text === '' || mb_strlen($text) > $question['maxLength']) {
            throw HttpException::badRequest("Die Antwort darf höchstens {$question['maxLength']} Zeichen lang sein.");
        }
        return $text;
    }

    /**
     * Prüft Begriffe für eine Wortwolke (ohne Zeilenumbrüche, Leerraum zusammengefasst).
     * @return list<string>
     */
    public static function words(array $question, mixed $value): array
    {
        $words = is_array($value) ? $value : [$value];
        $clean = [];
        foreach ($words as $word) {
            $word = is_string($word) ? trim((string) preg_replace('/\s+/u', ' ', $word)) : '';
            if ($word === '') {
                continue;
            }
            if (mb_strlen($word) > $question['maxLength']) {
                throw HttpException::badRequest("Ein Begriff darf höchstens {$question['maxLength']} Zeichen lang sein.");
            }
            $clean[] = $word;
        }
        if ($clean === []) {
            throw HttpException::badRequest('Bitte einen Begriff eingeben.');
        }
        return $clean;
    }

    public static function newId(): string
    {
        return substr(bin2hex(random_bytes(6)), 0, 8);
    }
}
