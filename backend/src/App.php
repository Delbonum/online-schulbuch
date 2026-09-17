<?php

declare(strict_types=1);

namespace Kryptogame;

use Kryptogame\Controller\AuthController;
use Kryptogame\Controller\ClassController;
use Kryptogame\Controller\QuizController;
use Kryptogame\Controller\StatisticsController;
use Kryptogame\Controller\StudentController;
use Kryptogame\Http\HttpException;
use Kryptogame\Http\Request;
use Kryptogame\Http\Response;
use Kryptogame\Http\Router;
use Kryptogame\Http\Session;
use Kryptogame\Repository\LoginThrottle;
use Kryptogame\Repository\ClassRepository;
use Kryptogame\Repository\ProgressRepository;
use Kryptogame\Repository\UserRepository;
use Kryptogame\Service\Auth;
use Kryptogame\Service\QuizCatalog;
use Kryptogame\Service\QuizGrader;
use Throwable;

final class App
{
    private Router $router;

    public function __construct(
        Database $db,
        Session $session,
        QuizCatalog $catalog,
        private bool $debug = false,
        /** @var list<string> zusätzlich erlaubte Origins, z. B. der React-Entwicklungsserver */
        private array $allowedOrigins = [],
    ) {
        $users = new UserRepository($db);
        $progress = new ProgressRepository($db);
        $classes = new ClassRepository($db);
        $auth = new Auth($users, new LoginThrottle($db), $session);

        $authController = new AuthController($auth, $users, $progress);
        $quizController = new QuizController($auth, $catalog, new QuizGrader(), $progress);
        $studentController = new StudentController($auth, $db, $users, $progress, $catalog, $classes);
        $statisticsController = new StatisticsController($auth, $users, $progress, $catalog, $classes);
        $classController = new ClassController($auth, $classes);

        $this->router = new Router();
        $r = $this->router;

        $r->add('POST', '/auth/login', [$authController, 'login']);
        $r->add('POST', '/auth/logout', [$authController, 'logout']);
        $r->add('GET', '/auth/me', [$authController, 'me']);
        $r->add('POST', '/auth/password', [$authController, 'changePassword']);

        $r->add('GET', '/quizzes/{level}', [$quizController, 'show']);
        $r->add('POST', '/quizzes/{level}/submit', [$quizController, 'submit']);

        $r->add('GET', '/students', [$studentController, 'index']);
        $r->add('POST', '/students', [$studentController, 'create']);
        $r->add('PATCH', '/students/{id}', [$studentController, 'update']);
        $r->add('DELETE', '/students/{id}', [$studentController, 'delete']);
        $r->add('POST', '/students/{id}/reset', [$studentController, 'reset']);
        $r->add('GET', '/students/{id}/history', [$studentController, 'history']);

        $r->add('GET', '/classes', [$classController, 'index']);
        $r->add('POST', '/classes', [$classController, 'create']);
        $r->add('PATCH', '/classes/{id}', [$classController, 'update']);
        $r->add('DELETE', '/classes/{id}', [$classController, 'delete']);

        $r->add('GET', '/statistics', [$statisticsController, 'show']);
    }

    public function handle(Request $request): Response
    {
        try {
            $this->assertSameOriginWrite($request);
            return $this->router->dispatch($request);
        } catch (HttpException $e) {
            return Response::error($e->status(), $e->getMessage());
        } catch (Throwable $e) {
            error_log('[KryptoGAME] ' . $e);
            return Response::error(500, $this->debug ? $e->getMessage() : 'Interner Serverfehler.');
        }
    }

    /**
     * Schutz vor Cross-Site Request Forgery: Schreibende Anfragen müssen als JSON
     * kommen (das kann ein fremdes HTML-Formular nicht) und dürfen, falls der Browser
     * einen Origin-Header mitschickt, nur von derselben Domain stammen.
     */
    private function assertSameOriginWrite(Request $request): void
    {
        if (in_array($request->method(), ['GET', 'HEAD', 'OPTIONS'], true)) {
            return;
        }
        $contentType = strtolower((string) $request->header('content-type'));
        if (strncmp($contentType, 'application/json', 16) !== 0) {
            throw new HttpException(415, 'Anfragen müssen als JSON gesendet werden.');
        }
        $origin = $request->header('origin');
        if ($origin === null || in_array(rtrim($origin, '/'), $this->allowedOrigins, true)) {
            return;
        }
        $host = $request->header('x-forwarded-host') ?? $request->header('host');
        if ($host === null || parse_url($origin, PHP_URL_HOST) !== parse_url('http://' . $host, PHP_URL_HOST)) {
            throw HttpException::forbidden('Anfrage von fremder Herkunft abgelehnt.' . ($this->debug ? " (Origin: {$origin}, Host: {$host})" : ''));
        }
    }
}
