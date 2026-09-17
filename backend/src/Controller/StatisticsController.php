<?php

declare(strict_types=1);

namespace Kryptogame\Controller;

use Kryptogame\Http\Response;
use Kryptogame\Repository\ProgressRepository;
use Kryptogame\Repository\UserRepository;
use Kryptogame\Service\Auth;
use Kryptogame\Service\QuizCatalog;

final class StatisticsController
{
    public function __construct(
        private Auth $auth,
        private UserRepository $users,
        private ProgressRepository $progress,
        private QuizCatalog $catalog,
    ) {
    }

    public function show(): Response
    {
        $teacher = $this->auth->requireTeacher();
        $levels = $this->catalog->levels();
        $students = $this->users->studentsOf($teacher['id']);
        $studentIds = array_column($students, 'id');
        $passedByStudent = $this->progress->passedLevelsForUsers($studentIds);

        $passedCounts = array_fill_keys($levels, 0);
        // Wie weit ist jede Person ohne Lücke gekommen? 0 = kein Level bestanden
        $reachedCounts = array_fill(0, count($levels) + 1, 0);
        foreach ($passedByStudent as $passed) {
            foreach ($passed as $level) {
                if (isset($passedCounts[$level])) {
                    $passedCounts[$level]++;
                }
            }
            $reached = 0;
            foreach ($levels as $level) {
                if (!in_array($level, $passed, true)) {
                    break;
                }
                $reached++;
            }
            $reachedCounts[$reached]++;
        }

        $scores = array_fill_keys($levels, []);
        $taskStats = array_fill_keys($levels, []);
        foreach ($this->progress->attemptsForUsers($studentIds) as $attempt) {
            $level = $attempt['level'];
            if (!isset($scores[$level])) {
                continue;
            }
            $scores[$level][] = $attempt['score'];
            foreach ($attempt['details'] as $detail) {
                $task = (string) ($detail['task'] ?? '?');
                $taskStats[$level][$task] ??= ['correct' => 0, 'wrong' => 0];
                $taskStats[$level][$task][empty($detail['correct']) ? 'wrong' : 'correct']++;
            }
        }

        $completion = [];
        foreach ($reachedCounts as $reached => $count) {
            $completion[] = ['label' => $this->completionLabel($reached, $levels), 'count' => $count];
        }

        return Response::json([
            'studentCount' => count($students),
            'levels' => $levels,
            'passedCounts' => (object) $passedCounts,
            'averageScores' => (object) array_map(
                static fn (array $s): ?int => $s === [] ? null : (int) round(array_sum($s) / count($s)),
                $scores,
            ),
            'taskStats' => (object) array_map(static fn (array $t): object => (object) $t, $taskStats),
            'completion' => $completion,
        ]);
    }

    /** @param list<int> $levels */
    private function completionLabel(int $reached, array $levels): string
    {
        if ($reached === 0) {
            return 'Noch kein Level bestanden';
        }
        if ($reached === count($levels)) {
            return 'Alle Level bestanden';
        }
        return $reached === 1
            ? 'Level ' . $levels[0] . ' bestanden'
            : 'Level ' . $levels[0] . '–' . $levels[$reached - 1] . ' bestanden';
    }
}
