<?php

declare(strict_types=1);

namespace Kryptogame\Controller;

use Kryptogame\Http\HttpException;
use Kryptogame\Http\Request;
use Kryptogame\Http\Response;
use Kryptogame\Repository\ClassRepository;
use Kryptogame\Repository\ProgressRepository;
use Kryptogame\Service\Auth;
use Kryptogame\Service\LevelAccess;
use Kryptogame\Service\QuizCatalog;
use Kryptogame\Service\QuizGrader;
use Kryptogame\Service\Validator;

final class QuizController
{
    public function __construct(
        private Auth $auth,
        private QuizCatalog $catalog,
        private QuizGrader $grader,
        private ProgressRepository $progress,
        private ClassRepository $classes,
    ) {
    }

    /** @param array<string, string> $params */
    public function show(Request $request, array $params): Response
    {
        $level = Validator::positiveInt($params['level'], 'Level');
        return Response::json(['quiz' => $this->catalog->publicQuiz($level)]);
    }

    /**
     * Bewertet eine Prüfung. Für Schüler/-innen wird der Versuch gespeichert und
     * bei voller Punktzahl das Level als bestanden markiert. Gäste und Lehrkräfte
     * erhalten nur die Bewertung.
     *
     * @param array<string, string> $params
     */
    public function submit(Request $request, array $params): Response
    {
        $level = Validator::positiveInt($params['level'], 'Level');
        $quiz = $this->catalog->get($level);
        $answers = $request->json()['answers'] ?? null;
        if (!is_array($answers)) {
            throw HttpException::badRequest('Es wurden keine Antworten übermittelt.');
        }

        $user = $this->auth->user();
        $isStudent = $user !== null && $user['role'] === 'student';
        if ($isStudent && !$this->isUnlocked($user['id'], $level)) {
            throw HttpException::forbidden('Dieses Level ist noch nicht freigeschaltet.');
        }

        $result = $this->grader->grade($quiz, $answers);

        $response = [
            'score' => $result['score'],
            'passed' => $result['passed'],
            'results' => array_map(
                static fn (array $r): array => ['task' => $r['task'], 'correct' => $r['correct']],
                $result['results'],
            ),
        ];

        if ($isStudent) {
            $this->progress->recordAttempt($user['id'], $level, $result['score'], $result['results']);
            if ($result['passed']) {
                $this->progress->markPassed($user['id'], $level);
            }
            $response['passedLevels'] = $this->progress->passedLevels($user['id']);
        }

        return Response::json($response);
    }

    private function isUnlocked(int $userId, int $level): bool
    {
        $required = LevelAccess::requiredLevel(
            $this->catalog->levels(),
            $this->classes->optionalLevelsForUser($userId),
            $level,
        );
        return $required === null || $this->progress->hasPassed($userId, $required);
    }
}
