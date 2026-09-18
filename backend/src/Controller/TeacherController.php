<?php

declare(strict_types=1);

namespace Kryptogame\Controller;

use Kryptogame\Http\HttpException;
use Kryptogame\Http\Request;
use Kryptogame\Http\Response;
use Kryptogame\Repository\UserRepository;
use Kryptogame\Service\Auth;
use Kryptogame\Service\Validator;

/**
 * Verwaltung der Lehrkräfte – nur für das Master-Konto.
 */
final class TeacherController
{
    public function __construct(
        private Auth $auth,
        private UserRepository $users,
    ) {
    }

    public function index(): Response
    {
        $this->auth->requireMaster();
        return Response::json([
            'teachers' => array_map(static fn (array $teacher): array => [
                'id' => $teacher['id'],
                'username' => $teacher['username'],
                'isMaster' => (bool) $teacher['is_master'],
                'studentCount' => $teacher['student_count'],
            ], $this->users->teachers()),
        ]);
    }

    public function create(Request $request): Response
    {
        $this->auth->requireMaster();
        $body = $request->json();
        $username = Validator::username($body['username'] ?? null);
        $password = Validator::password($body['password'] ?? null);

        if ($this->users->usernameExists($username)) {
            throw HttpException::conflict('Dieser Benutzername ist bereits vergeben.');
        }

        $id = $this->users->create($username, password_hash($password, PASSWORD_DEFAULT), 'teacher', null);
        return Response::json([
            'teacher' => ['id' => $id, 'username' => $username, 'isMaster' => false, 'studentCount' => 0],
        ], 201);
    }

    /** @param array<string, string> $params */
    public function update(Request $request, array $params): Response
    {
        $master = $this->auth->requireMaster();
        $teacher = $this->teacher($params['id']);
        $body = $request->json();

        if (array_key_exists('username', $body)) {
            $username = Validator::username($body['username']);
            if ($this->users->usernameExists($username, $teacher['id'])) {
                throw HttpException::conflict('Dieser Benutzername ist bereits vergeben.');
            }
            $this->users->rename($teacher['id'], $username);
        }

        if (array_key_exists('password', $body) && $body['password'] !== '' && $body['password'] !== null) {
            $password = Validator::password($body['password']);
            $this->users->updatePasswordHash($teacher['id'], password_hash($password, PASSWORD_DEFAULT));
        }

        if (array_key_exists('isMaster', $body)) {
            if ($teacher['id'] === $master['id'] && $body['isMaster'] === false) {
                throw HttpException::badRequest('Du kannst dir die Master-Rechte nicht selbst entziehen.');
            }
            $this->users->setMaster($teacher['id'], (bool) $body['isMaster']);
        }

        $updated = $this->users->findById($teacher['id']);
        return Response::json([
            'teacher' => [
                'id' => $teacher['id'],
                'username' => $updated['username'],
                'isMaster' => (bool) $updated['is_master'],
                'studentCount' => $this->users->countStudents($teacher['id']),
            ],
        ]);
    }

    /** @param array<string, string> $params */
    public function delete(Request $request, array $params): Response
    {
        $master = $this->auth->requireMaster();
        $teacher = $this->teacher($params['id']);

        if ($teacher['id'] === $master['id']) {
            throw HttpException::badRequest('Du kannst dein eigenes Konto nicht löschen.');
        }

        $this->users->delete($teacher['id']);
        return Response::noContent();
    }

    /** @return array<string, mixed> */
    private function teacher(string $id): array
    {
        $teacher = $this->users->findById(Validator::positiveInt($id, 'ID'));
        if ($teacher === null || $teacher['role'] !== 'teacher') {
            throw HttpException::notFound('Lehrkraft nicht gefunden.');
        }
        return $teacher;
    }
}
