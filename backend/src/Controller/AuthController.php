<?php

declare(strict_types=1);

namespace Kryptogame\Controller;

use Kryptogame\Http\HttpException;
use Kryptogame\Http\Request;
use Kryptogame\Http\Response;
use Kryptogame\Repository\ClassRepository;
use Kryptogame\Repository\ProgressRepository;
use Kryptogame\Repository\UserRepository;
use Kryptogame\Service\Auth;
use Kryptogame\Service\Validator;

final class AuthController
{
    public function __construct(
        private Auth $auth,
        private UserRepository $users,
        private ProgressRepository $progress,
        private ClassRepository $classes,
    ) {
    }

    public function login(Request $request): Response
    {
        $body = $request->json();
        $username = is_string($body['username'] ?? null) ? trim($body['username']) : '';
        $password = is_string($body['password'] ?? null) ? $body['password'] : '';
        if ($username === '' || $password === '') {
            throw HttpException::badRequest('Bitte Benutzername und Passwort angeben.');
        }

        $user = $this->auth->login($username, $password, $request->ip());
        return Response::json(['user' => $this->payload($user)]);
    }

    public function logout(): Response
    {
        $this->auth->logout();
        return Response::noContent();
    }

    public function me(): Response
    {
        $user = $this->auth->user();
        return Response::json(['user' => $user === null ? null : $this->payload($user)]);
    }

    public function changePassword(Request $request): Response
    {
        $user = $this->auth->requireUser();
        $body = $request->json();
        $current = is_string($body['currentPassword'] ?? null) ? $body['currentPassword'] : '';
        if (!password_verify($current, $user['password_hash'])) {
            throw HttpException::forbidden('Das aktuelle Passwort ist nicht korrekt.');
        }
        $new = Validator::password($body['newPassword'] ?? null);
        $this->users->updatePasswordHash($user['id'], password_hash($new, PASSWORD_DEFAULT));
        return Response::noContent();
    }

    /**
     * @param array<string, mixed> $user
     * @return array<string, mixed>
     */
    private function payload(array $user): array
    {
        return [
            'id' => $user['id'],
            'username' => $user['username'],
            'role' => $user['role'],
            'passedLevels' => $user['role'] === 'student' ? $this->progress->passedLevels($user['id']) : [],
            'optionalLevels' => $user['role'] === 'student' ? $this->classes->optionalLevelsForUser($user['id']) : [],
        ];
    }
}
