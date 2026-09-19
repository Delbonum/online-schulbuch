<?php

declare(strict_types=1);

namespace Kryptogame\Service;

final class QuizGrader
{
    /**
     * @param array<string, mixed> $quiz vollständige Prüfung aus dem QuizCatalog
     * @param array<int|string, mixed> $answers Frage-ID => Antwort
     * @return array{score: int, passed: bool, results: list<array{task: int, correct: bool, answer: mixed}>}
     */
    public function grade(array $quiz, array $answers): array
    {
        $results = [];
        foreach ($quiz['questions'] as $question) {
            $answer = self::sanitize($answers[$question['id']] ?? $answers[(string) $question['id']] ?? null);
            $results[] = [
                'task' => $question['id'],
                'correct' => $this->isCorrect($question, $answer),
                'answer' => $answer,
            ];
        }

        $correct = count(array_filter($results, static fn (array $r): bool => $r['correct']));
        $total = count($results);

        return [
            'score' => (int) round($correct / $total * 100),
            'passed' => $correct === $total,
            'results' => $results,
        ];
    }

    /**
     * @param array<string, mixed> $question
     */
    private function isCorrect(array $question, mixed $answer): bool
    {
        switch ($question['type']) {
            case 'text':
                if (!is_string($answer)) {
                    return false;
                }
                foreach ((array) $question['answer'] as $expected) {
                    if (self::normalizeText($answer) === self::normalizeText($expected)) {
                        return true;
                    }
                }
                return false;

            case 'single':
                return is_int($answer) && $answer === $question['answer'];

            case 'multiple':
                if (!is_array($answer) || array_filter($answer, 'is_int') !== $answer) {
                    return false;
                }
                $given = array_values(array_unique($answer));
                $expected = $question['answer'];
                sort($given);
                sort($expected);
                return $given === $expected;

            case 'order':
                return is_array($answer) && array_values($answer) === $question['items'];
        }
        return false;
    }

    /**
     * Groß-/Kleinschreibung, Leerzeichen und Satzzeichen spielen keine Rolle.
     */
    public static function normalizeText(string $text): string
    {
        return (string) preg_replace('/[^\p{L}\p{N}]/u', '', mb_strtoupper($text));
    }

    /** Antworten begrenzen, bevor sie gespeichert werden. */
    private static function sanitize(mixed $value): mixed
    {
        if (is_string($value)) {
            return mb_substr($value, 0, 500);
        }
        if (is_int($value) || $value === null) {
            return $value;
        }
        if (is_array($value)) {
            $items = array_slice(array_values($value), 0, 50);
            return array_map(
                static fn ($item) => is_string($item) ? mb_substr($item, 0, 500) : (is_int($item) ? $item : null),
                $items,
            );
        }
        return null;
    }
}
