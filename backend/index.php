<?php

declare(strict_types=1);

use Kryptogame\App;
use Kryptogame\Config;
use Kryptogame\Database;
use Kryptogame\Http\NativeSession;
use Kryptogame\Http\Request;
use Kryptogame\Http\Response;
use Kryptogame\Service\PhpMailer;
use Kryptogame\Service\QuizCatalog;

require __DIR__ . '/src/bootstrap.php';

try {
    $config = Config::load(__DIR__ . '/config.php');
    $db = Database::connect($config['db']);
} catch (Throwable $e) {
    error_log('[KryptoGAME] ' . $e);
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
    $config['app_url'],
);
$app->handle(Request::fromGlobals($config['base_path']))->send();
