<?php

declare(strict_types=1);

namespace Kryptogame\Controller;

use Kryptogame\Http\HttpException;
use Kryptogame\Http\Request;
use Kryptogame\Http\Response;
use Kryptogame\Repository\ClassRepository;
use Kryptogame\Service\Auth;
use Kryptogame\Service\QuizCatalog;
use Kryptogame\Service\Validator;

/**
 * Klassenverwaltung. Jede Lehrkraft sieht nur ihre eigenen Klassen.
 */
final class ClassController
{
    public function __construct(
        private Auth $auth,
        private ClassRepository $classes,
        private QuizCatalog $catalog,
    ) {
    }

    public function index(): Response
    {
        $teacher = $this->auth->requireTeacher();
        return Response::json(['classes' => $this->classes->forTeacher($teacher['id'])]);
    }

    public function create(Request $request): Response
    {
        $teacher = $this->auth->requireTeacher();
        $name = Validator::className($request->json()['name'] ?? null);
        if ($this->classes->nameExists($teacher['id'], $name)) {
            throw HttpException::conflict('Eine Klasse mit diesem Namen existiert bereits.');
        }
        $id = $this->classes->create($teacher['id'], $name);
        return Response::json(['class' => ['id' => $id, 'name' => $name, 'studentCount' => 0, 'optionalLevels' => []]], 201);
    }

    /** @param array<string, string> $params */
    public function update(Request $request, array $params): Response
    {
        $teacher = $this->auth->requireTeacher();
        $class = $this->ownClass($teacher, $params['id']);
        $body = $request->json();

        if (array_key_exists('name', $body)) {
            $name = Validator::className($body['name']);
            if ($this->classes->nameExists($teacher['id'], $name, $class['id'])) {
                throw HttpException::conflict('Eine Klasse mit diesem Namen existiert bereits.');
            }
            $this->classes->rename($class['id'], $name);
        }

        if (array_key_exists('optionalLevels', $body)) {
            $levels = $body['optionalLevels'];
            if (!is_array($levels) || array_filter($levels, 'is_int') !== $levels) {
                throw HttpException::badRequest('"optionalLevels" muss eine Liste von Levelnummern sein.');
            }
            foreach ($levels as $level) {
                if (!$this->catalog->has($level)) {
                    throw HttpException::badRequest("Level {$level} existiert nicht.");
                }
            }
            $this->classes->setOptionalLevels($class['id'], $levels);
        }

        return Response::json(['class' => $this->current($teacher['id'], $class['id'])]);
    }

    /** @param array<string, string> $params */
    public function delete(Request $request, array $params): Response
    {
        $teacher = $this->auth->requireTeacher();
        $class = $this->ownClass($teacher, $params['id']);
        $this->classes->delete($class['id']);
        return Response::noContent();
    }

    /**
     * @param array<string, mixed> $teacher
     * @return array{id: int, teacher_id: int, name: string}
     */
    private function ownClass(array $teacher, string $id): array
    {
        $class = $this->classes->find(Validator::positiveInt($id, 'ID'));
        if ($class === null || $class['teacher_id'] !== $teacher['id']) {
            throw HttpException::notFound('Klasse nicht gefunden.');
        }
        return $class;
    }

    /** @return array{id: int, name: string, studentCount: int, optionalLevels: list<int>} */
    private function current(int $teacherId, int $classId): array
    {
        foreach ($this->classes->forTeacher($teacherId) as $class) {
            if ($class['id'] === $classId) {
                return $class;
            }
        }
        throw HttpException::notFound('Klasse nicht gefunden.');
    }
}
