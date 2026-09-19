<?php

declare(strict_types=1);

namespace Kryptogame\Controller;

use Kryptogame\Database;
use Kryptogame\Http\HttpException;
use Kryptogame\Http\Request;
use Kryptogame\Http\Response;
use Kryptogame\Repository\ClassRepository;
use Kryptogame\Repository\ProgressRepository;
use Kryptogame\Repository\UserRepository;
use Kryptogame\Service\Auth;
use Kryptogame\Service\QuizCatalog;
use Kryptogame\Service\Validator;

/**
 * Schülerverwaltung für Lehrkräfte. Jede Lehrkraft sieht nur ihre eigenen Schüler/-innen.
 */
final class StudentController
{
    public function __construct(
        private Auth $auth,
        private Database $db,
        private UserRepository $users,
        private ProgressRepository $progress,
        private QuizCatalog $catalog,
        private ClassRepository $classes,
    ) {
    }

    public function index(): Response
    {
        $teacher = $this->auth->requireTeacher();
        $students = $this->users->studentsOf($teacher['id']);
        $passed = $this->progress->passedLevelsForUsers(array_column($students, 'id'));

        return Response::json([
            'levels' => $this->catalog->levels(),
            'classes' => $this->classes->forTeacher($teacher['id']),
            'students' => array_map(static fn (array $s): array => [
                'id' => $s['id'],
                'username' => $s['username'],
                'classId' => $s['class_id'],
                'passedLevels' => $passed[$s['id']],
            ], $students),
        ]);
    }

    public function create(Request $request): Response
    {
        $teacher = $this->auth->requireTeacher();
        $body = $request->json();
        $username = Validator::username($body['username'] ?? null);
        $password = Validator::password($body['password'] ?? null);

        if ($this->users->usernameExists($username)) {
            throw HttpException::conflict('Dieser Benutzername ist bereits vergeben.');
        }
        $classId = $this->classIdFrom($body, $teacher['id']);
        $id = $this->users->create($username, password_hash($password, PASSWORD_DEFAULT), 'student', $teacher['id'], $classId);

        return Response::json(['student' => $this->studentPayload($id)], 201);
    }

    /** @param array<string, string> $params */
    public function update(Request $request, array $params): Response
    {
        $teacher = $this->auth->requireTeacher();
        $student = $this->ownStudent($teacher, $params['id']);
        $body = $request->json();

        $this->db->transaction(function () use ($body, $student, $teacher): void {
            if (array_key_exists('username', $body)) {
                $username = Validator::username($body['username']);
                if ($this->users->usernameExists($username, $student['id'])) {
                    throw HttpException::conflict('Dieser Benutzername ist bereits vergeben.');
                }
                $this->users->rename($student['id'], $username);
            }

            if (array_key_exists('password', $body) && $body['password'] !== '' && $body['password'] !== null) {
                $password = Validator::password($body['password']);
                $this->users->updatePasswordHash($student['id'], password_hash($password, PASSWORD_DEFAULT));
            }

            if (array_key_exists('classId', $body)) {
                $this->users->setClass($student['id'], $this->classIdFrom($body, $teacher['id']));
            }

            if (array_key_exists('passedLevels', $body)) {
                $this->setPassedLevels($student['id'], $body['passedLevels'], $teacher['id']);
            }
        });

        return Response::json(['student' => $this->studentPayload($student['id'])]);
    }

    /** @param array<string, string> $params */
    public function delete(Request $request, array $params): Response
    {
        $teacher = $this->auth->requireTeacher();
        $student = $this->ownStudent($teacher, $params['id']);
        $this->users->delete($student['id']);
        return Response::noContent();
    }

    /** @param array<string, string> $params */
    public function reset(Request $request, array $params): Response
    {
        $teacher = $this->auth->requireTeacher();
        $student = $this->ownStudent($teacher, $params['id']);
        $this->progress->reset($student['id']);
        return Response::json(['student' => $this->studentPayload($student['id'])]);
    }

    /** @param array<string, string> $params */
    public function history(Request $request, array $params): Response
    {
        $teacher = $this->auth->requireTeacher();
        $student = $this->ownStudent($teacher, $params['id']);
        return Response::json(['history' => (object) $this->progress->history($student['id'])]);
    }

    /**
     * Prüft, dass eine angegebene Klasse zur Lehrkraft gehört.
     *
     * @param array<string, mixed> $body
     */
    private function classIdFrom(array $body, int $teacherId): ?int
    {
        $value = $body['classId'] ?? null;
        if ($value === null || $value === '') {
            return null;
        }
        $classId = Validator::positiveInt($value, 'Klasse');
        $class = $this->classes->find($classId);
        if ($class === null || $class['teacher_id'] !== $teacherId) {
            throw HttpException::badRequest('Diese Klasse gibt es nicht.');
        }
        return $classId;
    }

    private function setPassedLevels(int $studentId, mixed $levels, int $teacherId): void
    {
        if (!is_array($levels) || array_filter($levels, 'is_int') !== $levels) {
            throw HttpException::badRequest('"passedLevels" muss eine Liste von Levelnummern sein.');
        }
        foreach ($levels as $level) {
            if (!$this->catalog->has($level)) {
                throw HttpException::badRequest("Level {$level} existiert nicht.");
            }
        }

        foreach ($this->catalog->levels() as $level) {
            $shouldPass = in_array($level, $levels, true);
            $changed = $shouldPass
                ? $this->progress->markPassed($studentId, $level)
                : $this->progress->unmarkPassed($studentId, $level);
            if ($changed) {
                $this->progress->logManualChange($studentId, $level, $shouldPass, $teacherId);
            }
        }
    }

    /**
     * @param array<string, mixed> $teacher
     * @return array<string, mixed>
     */
    private function ownStudent(array $teacher, string $id): array
    {
        $student = $this->users->findById(Validator::positiveInt($id, 'ID'));
        if ($student === null || $student['role'] !== 'student' || $student['teacher_id'] !== $teacher['id']) {
            throw HttpException::notFound('Schüler/-in nicht gefunden.');
        }
        return $student;
    }

    /** @return array<string, mixed> */
    private function studentPayload(int $id): array
    {
        $student = $this->users->findById($id);
        return [
            'id' => $id,
            'username' => $student['username'] ?? '',
            'classId' => $student['class_id'] ?? null,
            'passedLevels' => $this->progress->passedLevels($id),
        ];
    }
}
