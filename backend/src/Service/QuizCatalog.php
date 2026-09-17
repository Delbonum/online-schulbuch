<?php

declare(strict_types=1);

namespace Kryptogame\Service;

use Kryptogame\Http\HttpException;
use RuntimeException;

/**
 * Lädt die Zwischenprüfungen aus quizzes/levelN.json.
 *
 * Die Dateien enthalten die Lösungen und werden deshalb nie direkt ausgeliefert;
 * der Client erhält nur die Fassung aus publicQuiz().
 */
final class QuizCatalog
{
    public const TYPES = ['text', 'single', 'multiple', 'order'];

    /** @var array<int, array<string, mixed>>|null */
    private ?array $quizzes = null;

    public function __construct(private string $directory)
    {
    }

    /** @return list<int> alle Level mit Prüfung, aufsteigend */
    public function levels(): array
    {
        $levels = array_keys($this->all());
        sort($levels);
        return $levels;
    }

    public function has(int $level): bool
    {
        return isset($this->all()[$level]);
    }

    /** @return array<string, mixed> vollständige Prüfung inklusive Lösungen */
    public function get(int $level): array
    {
        return $this->all()[$level] ?? throw HttpException::notFound("Für Level {$level} gibt es keine Prüfung.");
    }

    /** @return array<string, mixed> Prüfung ohne Lösungen, Reihenfolge-Aufgaben gemischt */
    public function publicQuiz(int $level): array
    {
        $quiz = $this->get($level);
        $quiz['questions'] = array_map(static function (array $question): array {
            if ($question['type'] === 'order') {
                $question['items'] = self::shuffled($question['items']);
            }
            unset($question['answer']);
            return $question;
        }, $quiz['questions']);
        return $quiz;
    }

    /** @return array<int, array<string, mixed>> */
    private function all(): array
    {
        if ($this->quizzes !== null) {
            return $this->quizzes;
        }
        $this->quizzes = [];
        foreach (glob($this->directory . '/level*.json') ?: [] as $file) {
            $quiz = json_decode((string) file_get_contents($file), true);
            if (!is_array($quiz)) {
                throw new RuntimeException('Ungültiges JSON in ' . basename($file));
            }
            self::assertValid($quiz, basename($file));
            $this->quizzes[(int) $quiz['level']] = $quiz;
        }
        return $this->quizzes;
    }

    /**
     * Prüft den Aufbau einer Prüfungsdatei, damit Tippfehler beim Bearbeiten sofort auffallen.
     *
     * @param array<string, mixed> $quiz
     */
    public static function assertValid(array $quiz, string $source): void
    {
        $fail = static function (string $message) use ($source): never {
            throw new RuntimeException("{$source}: {$message}");
        };

        if (!is_int($quiz['level'] ?? null) || $quiz['level'] < 1) {
            $fail('"level" muss eine positive ganze Zahl sein.');
        }
        if (!is_array($quiz['questions'] ?? null) || $quiz['questions'] === []) {
            $fail('"questions" darf nicht leer sein.');
        }

        $ids = [];
        foreach ($quiz['questions'] as $i => $q) {
            $label = 'Frage ' . ($i + 1);
            if (!is_int($q['id'] ?? null) || isset($ids[$q['id']])) {
                $fail("{$label}: \"id\" fehlt oder ist doppelt.");
            }
            $ids[$q['id']] = true;
            if (!is_string($q['prompt'] ?? null) || trim($q['prompt']) === '') {
                $fail("{$label}: \"prompt\" fehlt.");
            }
            $type = $q['type'] ?? null;
            if (!in_array($type, self::TYPES, true)) {
                $fail("{$label}: unbekannter Typ.");
            }

            if ($type === 'text') {
                $answers = (array) ($q['answer'] ?? []);
                if ($answers === [] || array_filter($answers, static fn ($a) => !is_string($a) || trim($a) === '') !== []) {
                    $fail("{$label}: \"answer\" muss ein Text oder eine Liste von Texten sein.");
                }
                continue;
            }
            if ($type === 'order') {
                if (!is_array($q['items'] ?? null) || count($q['items']) < 2 || count(array_unique($q['items'])) !== count($q['items'])) {
                    $fail("{$label}: \"items\" braucht mindestens zwei verschiedene Einträge in der richtigen Reihenfolge.");
                }
                continue;
            }

            $optionCount = is_array($q['options'] ?? null) ? count($q['options']) : 0;
            if ($optionCount < 2) {
                $fail("{$label}: \"options\" braucht mindestens zwei Einträge.");
            }
            $answers = $type === 'single' ? [$q['answer'] ?? null] : ($q['answer'] ?? null);
            if (!is_array($answers) || $answers === [] || ($type === 'multiple' && count(array_unique($answers)) !== count($answers))) {
                $fail("{$label}: \"answer\" ist ungültig.");
            }
            foreach ($answers as $answer) {
                if (!is_int($answer) || $answer < 0 || $answer >= $optionCount) {
                    $fail("{$label}: \"answer\" verweist auf eine nicht vorhandene Option.");
                }
            }
        }
    }

    /**
     * @param list<string> $items
     * @return list<string> gemischt, aber nie in der richtigen Reihenfolge
     */
    private static function shuffled(array $items): array
    {
        do {
            $copy = $items;
            shuffle($copy);
        } while ($copy === $items);
        return $copy;
    }
}
