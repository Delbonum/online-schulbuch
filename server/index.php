<?php

declare(strict_types=1);

use Schulbuch\App;
use Schulbuch\Config;
use Schulbuch\Database;
use Schulbuch\Http\NativeSession;
use Schulbuch\Http\Request;
use Schulbuch\Http\Response;
use Schulbuch\Service\PhpMailer;
use Schulbuch\Service\QuizCatalog;

require __DIR__ . '/src/bootstrap.php';

try {
    $config = Config::load(__DIR__ . '/config.php');
    $db = Database::connect($config['db']);
} catch (Throwable $e) {
    error_log('[Schulbuch-API] ' . $e);
    Response::error(503, 'Der Server ist nicht richtig eingerichtet.')->send();
    exit;
}

$session = new NativeSession($config['base_path'], $config['secure_cookies'], $config['session_lifetime']);
$app = new App(
    $db,
    $session,
    new QuizCatalog($config['quizzes_dir']),
    $config['debug'],
    $config['allowed_origins'],
    new PhpMailer($config['mail_from']),
    $config['admin_email'],
    $config['site_url'],
    $config['site_url'] . $config['base_path'],
    $config['content_key'],
);
$app->handle(Request::fromGlobals($config['base_path']))->send();
