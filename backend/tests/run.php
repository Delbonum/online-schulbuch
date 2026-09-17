<?php

declare(strict_types=1);

// Automatisierte Tests für das Backend – ohne zusätzliche Abhängigkeiten.
// Aufruf: php tests/run.php

use Kryptogame\App;
use Kryptogame\Database;
use Kryptogame\Http\ArraySession;
use Kryptogame\Http\Request;
use Kryptogame\Http\Response;
use Kryptogame\LegacyImporter;
use Kryptogame\Repository\UserRepository;
use Kryptogame\Service\QuizCatalog;
use Kryptogame\Service\QuizGrader;

require __DIR__ . '/../src/bootstrap.php';

$failures = 0;
$passes = 0;

function check(bool $condition, string $message): void
{
    global $failures, $passes;
    if ($condition) {
        $passes++;
        return;
    }
    $failures++;
    $trace = debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS, 1)[0];
    fwrite(STDERR, "  ✗ {$message} (Zeile {$trace['line']})\n");
}

function test(string $name, callable $fn): void
{
    global $failures;
    $before = $failures;
    try {
        $fn();
    } catch (Throwable $e) {
        $failures++;
        fwrite(STDERR, "  ✗ Ausnahme: {$e->getMessage()} in {$e->getFile()}:{$e->getLine()}\n");
    }
    fwrite(STDOUT, ($failures === $before ? '✓ ' : '✗ ') . $name . "\n");
}

/** Ein Browser mit eigener Session gegen eine gemeinsame Datenbank. */
final class Client
{
    private App $app;

    public function __construct(Database $db, QuizCatalog $catalog, array $allowedOrigins = [])
    {
        $this->app = new App($db, new ArraySession(), $catalog, true, $allowedOrigins);
    }

    /** @param array<string, mixed>|null $body */
    public function call(string $method, string $path, ?array $body = null, array $headers = []): Response
    {
        $headers += ['Content-Type' => 'application/json', 'Host' => 'example.org'];
        return $this->app->handle(new Request(
            $method,
            $path,
            $headers,
            $body === null ? '' : json_encode($body),
            '127.0.0.1',
        ));
    }

    /** @param array<string, string> $query */
    public function callWithQuery(string $method, string $path, array $query): Response
    {
        return $this->app->handle(
            (new Request($method, $path, ['Content-Type' => 'application/json', 'Host' => 'example.org'], '', '127.0.0.1'))
                ->withQuery($query),
        );
    }

    public function login(string $username, string $password): Response
    {
        return $this->call('POST', '/auth/login', ['username' => $username, 'password' => $password]);
    }
}

/** Antwort so auswerten, wie der Browser sie als JSON erhält. */
function asArray(Response $response): array
{
    return json_decode(json_encode($response->data()), true);
}

function freshDatabase(): Database
{
    $db = Database::connect(['dsn' => getenv('KRYPTOGAME_TEST_DSN') ?: 'sqlite::memory:',
        'user' => getenv('KRYPTOGAME_TEST_USER') ?: null,
        'password' => getenv('KRYPTOGAME_TEST_PASSWORD') ?: null]);
    if ($db->driver() === 'mysql') {
        $db->pdo()->exec('SET FOREIGN_KEY_CHECKS = 0');
        foreach (['login_attempts', 'progress_log', 'quiz_attempts', 'level_progress', 'users'] as $table) {
            $db->pdo()->exec("DROP TABLE IF EXISTS {$table}");
        }
        $db->pdo()->exec('SET FOREIGN_KEY_CHECKS = 1');
    }
    $db->migrate();
    return $db;
}

/** Richtige Antworten für ein Level aus der vollständigen Prüfung ableiten. */
function correctAnswers(QuizCatalog $catalog, int $level): array
{
    $answers = [];
    foreach ($catalog->get($level)['questions'] as $q) {
        $answers[$q['id']] = match ($q['type']) {
            'text' => strtolower(((array) $q['answer'])[0]),
            'order' => $q['items'],
            default => $q['answer'],
        };
    }
    return $answers;
}

$catalog = new QuizCatalog(__DIR__ . '/../quizzes');
fwrite(STDOUT, 'Datenbank: ' . (getenv('KRYPTOGAME_TEST_DSN') ?: 'sqlite::memory:') . "\n\n");

test('Prüfungsdateien sind gültig', function () use ($catalog): void {
    check($catalog->levels() !== [], 'mindestens eine Prüfung vorhanden');
    foreach ($catalog->levels() as $level) {
        check(count($catalog->get($level)['questions']) > 0, "Level {$level} hat Fragen");
    }
});

test('Öffentliche Prüfung enthält keine Lösungen', function () use ($catalog): void {
    foreach ($catalog->levels() as $level) {
        $public = json_encode($catalog->publicQuiz($level));
        check(!str_contains($public, '"answer"'), "Level {$level}: kein answer-Feld");
        foreach ($catalog->get($level)['questions'] as $q) {
            if ($q['type'] === 'order') {
                $shown = array_values(array_filter($catalog->publicQuiz($level)['questions'], fn ($p) => $p['id'] === $q['id']))[0];
                check($shown['items'] !== $q['items'], "Level {$level}: Reihenfolge gemischt");
                check(count($shown['items']) === count($q['items']), "Level {$level}: alle Elemente vorhanden");
            }
        }
    }
});

test('Bewertung: Normalisierung und Fragetypen', function () use ($catalog): void {
    $grader = new QuizGrader();
    check(QuizGrader::normalizeText(' vfkodfkw  yhuoruhq! ') === 'VFKODFKWYHUORUHQ', 'Text wird normalisiert');

    foreach ($catalog->levels() as $level) {
        $result = $grader->grade($catalog->get($level), correctAnswers($catalog, $level));
        check($result['passed'] && $result['score'] === 100, "Level {$level}: richtige Antworten bestehen");
        $empty = $grader->grade($catalog->get($level), []);
        check(!$empty['passed'] && $empty['score'] === 0, "Level {$level}: leere Abgabe 0 %");
    }

    $quiz = ['questions' => [
        ['id' => 1, 'type' => 'multiple', 'prompt' => 'x', 'options' => ['a', 'b', 'c'], 'answer' => [0, 2]],
        ['id' => 2, 'type' => 'single', 'prompt' => 'x', 'options' => ['a', 'b'], 'answer' => 1],
    ]];
    check($grader->grade($quiz, ['1' => [2, 0], '2' => 1])['passed'], 'Mehrfachauswahl unabhängig von der Reihenfolge');
    check(!$grader->grade($quiz, ['1' => [0], '2' => 1])['passed'], 'unvollständige Mehrfachauswahl ist falsch');
    check(!$grader->grade($quiz, ['1' => [0, 1, 2], '2' => 1])['passed'], 'zu viele Kreuze sind falsch');
    check(!$grader->grade($quiz, ['1' => [0, 2], '2' => '1'])['passed'], 'String statt Zahl ist falsch');
    check($grader->grade($quiz, ['1' => [0, 2]])['score'] === 50, 'Punktzahl in Prozent');
});

test('Login, Session und Logout', function () use ($catalog): void {
    $db = freshDatabase();
    (new UserRepository($db))->create('lehrerin', password_hash('geheim123', PASSWORD_DEFAULT), 'teacher', null);
    $client = new Client($db, $catalog);

    check($client->call('GET', '/auth/me')->data() === ['user' => null], 'ohne Login kein Benutzer');
    check($client->login('lehrerin', 'falsch')->status() === 401, 'falsches Passwort → 401');
    check($client->login('niemand', 'geheim123')->status() === 401, 'unbekannter Benutzer → 401');

    $response = $client->login('lehrerin', 'geheim123');
    check($response->status() === 200, 'Login erfolgreich');
    check($response->data()['user']['role'] === 'teacher', 'Rolle wird geliefert');
    check(!isset($response->data()['user']['password_hash']), 'kein Passwort-Hash in der Antwort');
    check($client->call('GET', '/auth/me')->data()['user']['username'] === 'lehrerin', 'Session bleibt erhalten');

    check($client->call('POST', '/auth/logout')->status() === 204, 'Logout');
    check($client->call('GET', '/auth/me')->data() === ['user' => null], 'nach Logout abgemeldet');
});

test('Login-Sperre nach zu vielen Fehlversuchen', function () use ($catalog): void {
    $db = freshDatabase();
    (new UserRepository($db))->create('opfer', password_hash('richtig123', PASSWORD_DEFAULT), 'teacher', null);
    $client = new Client($db, $catalog);
    for ($i = 0; $i < 10; $i++) {
        $client->login('opfer', 'falsch' . $i);
    }
    check($client->login('opfer', 'richtig123')->status() === 429, 'auch richtiges Passwort wird vorübergehend blockiert');
});

test('Passwort ändern', function () use ($catalog): void {
    $db = freshDatabase();
    (new UserRepository($db))->create('lehrer', password_hash('altes-pw', PASSWORD_DEFAULT), 'teacher', null);
    $client = new Client($db, $catalog);
    $client->login('lehrer', 'altes-pw');
    check($client->call('POST', '/auth/password', ['currentPassword' => 'falsch', 'newPassword' => 'neues-pw'])->status() === 403, 'falsches aktuelles Passwort');
    check($client->call('POST', '/auth/password', ['currentPassword' => 'altes-pw', 'newPassword' => 'kurz'])->status() === 400, 'zu kurzes Passwort');
    check($client->call('POST', '/auth/password', ['currentPassword' => 'altes-pw', 'newPassword' => 'neues-pw'])->status() === 204, 'Passwort geändert');
    check((new Client($db, $catalog))->login('lehrer', 'neues-pw')->status() === 200, 'Login mit neuem Passwort');
});

test('CSRF-Schutz für schreibende Anfragen', function () use ($catalog): void {
    $db = freshDatabase();
    $client = new Client($db, $catalog);
    $form = $client->call('POST', '/auth/login', null, ['Content-Type' => 'application/x-www-form-urlencoded']);
    check($form->status() === 415, 'Formular-Content-Type wird abgelehnt');
    $foreign = $client->call('POST', '/auth/logout', null, ['Origin' => 'https://boese.example']);
    check($foreign->status() === 403, 'fremde Origin wird abgelehnt');
    $same = $client->call('POST', '/auth/logout', null, ['Origin' => 'https://example.org']);
    check($same->status() === 204, 'gleiche Origin ist erlaubt');

    $proxied = new Client($db, $catalog, ['http://127.0.0.1:8000']);
    $viaProxy = $proxied->call('POST', '/auth/logout', null, ['Origin' => 'http://127.0.0.1:8000', 'Host' => 'localhost:3000']);
    check($viaProxy->status() === 204, 'konfigurierte Origin (Entwicklungs-Proxy) ist erlaubt');
    $other = $proxied->call('POST', '/auth/logout', null, ['Origin' => 'http://127.0.0.1:8001', 'Host' => 'localhost:3000']);
    check($other->status() === 403, 'andere Ports bleiben gesperrt');
});

test('Prüfung als Gast und als Schüler/-in', function () use ($catalog): void {
    $db = freshDatabase();
    $users = new UserRepository($db);
    $teacherId = $users->create('lehrer', password_hash('lehrer-pw', PASSWORD_DEFAULT), 'teacher', null);
    $users->create('max', password_hash('max-pw', PASSWORD_DEFAULT), 'student', $teacherId);

    $guest = new Client($db, $catalog);
    check($guest->call('GET', '/quizzes/1')->status() === 200, 'Gast lädt Prüfung');
    check($guest->call('GET', '/quizzes/99')->status() === 404, 'unbekanntes Level → 404');
    $graded = $guest->call('POST', '/quizzes/2/submit', ['answers' => correctAnswers($catalog, 2)]);
    check($graded->data()['passed'] === true, 'Gast wird bewertet');
    check(!isset($graded->data()['passedLevels']), 'für Gäste wird nichts gespeichert');

    $student = new Client($db, $catalog);
    $student->login('max', 'max-pw');
    check($student->call('POST', '/quizzes/2/submit', ['answers' => correctAnswers($catalog, 2)])->status() === 403, 'Level 2 ist ohne Level 1 gesperrt');

    $wrong = $student->call('POST', '/quizzes/1/submit', ['answers' => [1 => 'falsch']]);
    check($wrong->data()['passed'] === false && $wrong->data()['passedLevels'] === [], 'falsche Abgabe besteht nicht');
    check(count($wrong->data()['results']) === count($catalog->get(1)['questions']), 'Ergebnis je Aufgabe');
    check(!array_key_exists('answer', $wrong->data()['results'][0]), 'Ergebnis verrät keine Lösung');

    $right = $student->call('POST', '/quizzes/1/submit', ['answers' => correctAnswers($catalog, 1)]);
    check($right->data()['passed'] === true && $right->data()['score'] === 100, 'richtige Abgabe besteht');
    check($right->data()['passedLevels'] === [1], 'Level 1 als bestanden gespeichert');
    check($student->call('GET', '/auth/me')->data()['user']['passedLevels'] === [1], '/auth/me liefert Fortschritt');
    check($student->call('POST', '/quizzes/2/submit', ['answers' => []])->status() === 200, 'Level 2 jetzt offen');
    check($student->call('GET', '/students')->status() === 403, 'Schüler/-in hat keinen Zugriff auf die Verwaltung');
    check($student->call('POST', '/quizzes/1/submit', ['answers' => 'kaputt'])->status() === 400, 'ungültige Antworten → 400');
});

test('Schülerverwaltung durch Lehrkräfte', function () use ($catalog): void {
    $db = freshDatabase();
    $users = new UserRepository($db);
    $users->create('lehrerA', password_hash('lehrer-pw', PASSWORD_DEFAULT), 'teacher', null);
    $users->create('lehrerB', password_hash('lehrer-pw', PASSWORD_DEFAULT), 'teacher', null);

    $teacherA = new Client($db, $catalog);
    $teacherA->login('lehrerA', 'lehrer-pw');
    $teacherB = new Client($db, $catalog);
    $teacherB->login('lehrerB', 'lehrer-pw');

    check((new Client($db, $catalog))->call('GET', '/students')->status() === 401, 'ohne Login → 401');

    check($teacherA->call('POST', '/students', ['username' => 'a', 'password' => 'passwort'])->status() === 400, 'zu kurzer Name');
    check($teacherA->call('POST', '/students', ['username' => 'anna', 'password' => '123'])->status() === 400, 'zu kurzes Passwort');
    $created = $teacherA->call('POST', '/students', ['username' => 'anna', 'password' => 'anna-pw']);
    check($created->status() === 201, 'Schülerin angelegt');
    $annaId = $created->data()['student']['id'];
    check($teacherA->call('POST', '/students', ['username' => 'ANNA', 'password' => 'anna-pw'])->status() === 409, 'Name bereits vergeben (ohne Groß-/Kleinschreibung)');
    check($teacherA->call('POST', '/students', ['username' => 'lehrerB', 'password' => 'anna-pw'])->status() === 409, 'Name einer Lehrkraft ist vergeben');

    $list = $teacherA->call('GET', '/students')->data();
    check(count($list['students']) === 1 && $list['levels'] === $catalog->levels(), 'Liste mit Levels');
    check($teacherB->call('GET', '/students')->data()['students'] === [], 'Lehrkraft B sieht keine fremden Schüler/-innen');
    check($teacherB->call('PATCH', "/students/{$annaId}", ['username' => 'gehackt'])->status() === 404, 'B kann A-Schülerin nicht ändern');
    check($teacherB->call('DELETE', "/students/{$annaId}")->status() === 404, 'B kann A-Schülerin nicht löschen');
    check($teacherB->call('GET', "/students/{$annaId}/history")->status() === 404, 'B sieht keinen fremden Verlauf');

    $updated = $teacherA->call('PATCH', "/students/{$annaId}", ['username' => 'anna2', 'password' => 'neu-pw', 'passedLevels' => [1, 2]]);
    check($updated->status() === 200, 'Schülerin bearbeitet');
    check(
        $updated->data()['student'] === ['id' => $annaId, 'username' => 'anna2', 'classId' => null, 'passedLevels' => [1, 2]],
        'Änderungen übernommen',
    );
    check((new Client($db, $catalog))->login('anna2', 'neu-pw')->status() === 200, 'Login mit neuen Daten');
    check($teacherA->call('PATCH', "/students/{$annaId}", ['passedLevels' => [99]])->status() === 400, 'unbekanntes Level');
    check($teacherA->call('PATCH', "/students/{$annaId}", ['role' => 'teacher'])->data()['student']['username'] === 'anna2', 'unbekannte Felder werden ignoriert');
    check($users->findById($annaId)['role'] === 'student', 'Rolle bleibt unverändert');

    $teacherA->call('PATCH', "/students/{$annaId}", ['passedLevels' => [1]]);
    $history = asArray($teacherA->call('GET', "/students/{$annaId}/history"))['history'];
    check(array_column($history[2], 'manual') === ['freigeschaltet', 'gesperrt'], 'manuelle Änderungen protokolliert');
    check(str_ends_with($history[1][0]['timestamp'], 'Z'), 'Zeitstempel im ISO-Format');

    $anna = new Client($db, $catalog);
    $anna->login('anna2', 'neu-pw');
    $anna->call('POST', '/quizzes/2/submit', ['answers' => [1 => 'x']]);
    $history = asArray($teacherA->call('GET', "/students/{$annaId}/history"))['history'];
    $attempts = array_values(array_filter($history[2], fn ($e) => isset($e['score'])));
    check(count($attempts) === 1 && $attempts[0]['score'] === 0 && isset($attempts[0]['details']), 'Prüfungsversuch im Verlauf');

    $reset = $teacherA->call('POST', "/students/{$annaId}/reset");
    check($reset->data()['student']['passedLevels'] === [], 'Fortschritt zurückgesetzt');
    check((array) $teacherA->call('GET', "/students/{$annaId}/history")->data()['history'] === [], 'Verlauf gelöscht');

    check($teacherA->call('DELETE', "/students/{$annaId}")->status() === 204, 'Schülerin gelöscht');
    check($teacherA->call('GET', '/students')->data()['students'] === [], 'Liste wieder leer');
    check($teacherA->call('DELETE', '/students/abc')->status() === 400, 'ungültige ID');
});

test('Klassenverwaltung', function () use ($catalog): void {
    $db = freshDatabase();
    $users = new UserRepository($db);
    $users->create('lehrerA', password_hash('lehrer-pw', PASSWORD_DEFAULT), 'teacher', null);
    $users->create('lehrerB', password_hash('lehrer-pw', PASSWORD_DEFAULT), 'teacher', null);

    $teacherA = new Client($db, $catalog);
    $teacherA->login('lehrerA', 'lehrer-pw');
    $teacherB = new Client($db, $catalog);
    $teacherB->login('lehrerB', 'lehrer-pw');

    check($teacherA->call('GET', '/classes')->data()['classes'] === [], 'anfangs keine Klassen');
    check($teacherA->call('POST', '/classes', ['name' => ''])->status() === 400, 'leerer Name');

    $created = $teacherA->call('POST', '/classes', ['name' => '9b']);
    check($created->status() === 201 && $created->data()['class']['name'] === '9b', 'Klasse angelegt');
    $classId = $created->data()['class']['id'];
    check($teacherA->call('POST', '/classes', ['name' => '9b'])->status() === 409, 'Name doppelt');
    check($teacherB->call('POST', '/classes', ['name' => '9b'])->status() === 201, 'andere Lehrkraft darf denselben Namen nutzen');
    check($teacherB->call('PATCH', "/classes/{$classId}", ['name' => 'geklaut'])->status() === 404, 'fremde Klasse nicht änderbar');
    check($teacherB->call('DELETE', "/classes/{$classId}")->status() === 404, 'fremde Klasse nicht löschbar');

    $student = $teacherA->call('POST', '/students', ['username' => 'anna', 'password' => 'anna-pw', 'classId' => $classId]);
    check($student->data()['student']['classId'] === $classId, 'Schülerin mit Klasse angelegt');
    $annaId = $student->data()['student']['id'];
    check(
        $teacherA->call('POST', '/students', ['username' => 'ben', 'password' => 'ben-pw'])->data()['student']['classId'] === null,
        'Anlegen ohne Klasse möglich',
    );
    $otherClassId = $teacherB->call('GET', '/classes')->data()['classes'][0]['id'];
    check(
        $teacherA->call('PATCH', "/students/{$annaId}", ['classId' => $otherClassId])->status() === 400,
        'fremde Klasse nicht zuweisbar',
    );

    $list = $teacherA->call('GET', '/students')->data();
    check(count($list['classes']) === 1 && $list['classes'][0]['studentCount'] === 1, 'Klassenliste mit Anzahl');
    check($list['students'][0]['classId'] === $classId, 'Klasse in der Schülerliste');

    $renamed = $teacherA->call('PATCH', "/classes/{$classId}", ['name' => '9c']);
    check($renamed->data()['class'] === ['id' => $classId, 'name' => '9c', 'studentCount' => 1], 'Klasse umbenannt');

    check($teacherA->call('PATCH', "/students/{$annaId}", ['classId' => null])->data()['student']['classId'] === null, 'Klasse entfernt');
    $teacherA->call('PATCH', "/students/{$annaId}", ['classId' => $classId]);

    check($teacherA->call('DELETE', "/classes/{$classId}")->status() === 204, 'Klasse gelöscht');
    $after = $teacherA->call('GET', '/students')->data();
    check(count($after['students']) === 2, 'Schüler/-innen bleiben erhalten');
    check($after['students'][0]['classId'] === null, 'Klassenzuordnung aufgehoben');
});

test('Statistik nach Klassen', function () use ($catalog): void {
    $db = freshDatabase();
    $users = new UserRepository($db);
    $users->create('lehrer', password_hash('lehrer-pw', PASSWORD_DEFAULT), 'teacher', null);
    $teacher = new Client($db, $catalog);
    $teacher->login('lehrer', 'lehrer-pw');
    $classId = $teacher->call('POST', '/classes', ['name' => '10a'])->data()['class']['id'];
    $teacher->call('POST', '/students', ['username' => 'mit', 'password' => 'passwort', 'classId' => $classId]);
    $teacher->call('POST', '/students', ['username' => 'ohne', 'password' => 'passwort']);

    $mit = new Client($db, $catalog);
    $mit->login('mit', 'passwort');
    $mit->call('POST', '/quizzes/1/submit', ['answers' => correctAnswers($catalog, 1)]);

    $all = asArray($teacher->call('GET', '/statistics'));
    check($all['studentCount'] === 2 && $all['passedCounts']['1'] === 1, 'Statistik über alle');

    $withClass = asArray($teacher->callWithQuery('GET', '/statistics', ['classId' => (string) $classId]));
    check($withClass['studentCount'] === 1 && $withClass['passedCounts']['1'] === 1, 'Statistik der Klasse');

    $withoutClass = asArray($teacher->callWithQuery('GET', '/statistics', ['classId' => 'none']));
    check($withoutClass['studentCount'] === 1 && $withoutClass['passedCounts']['1'] === 0, 'Statistik ohne Klasse');

    check($teacher->callWithQuery('GET', '/statistics', ['classId' => '9999'])->status() === 404, 'unbekannte Klasse');
});

test('Statistik', function () use ($catalog): void {
    $db = freshDatabase();
    $users = new UserRepository($db);
    $teacherId = $users->create('lehrer', password_hash('lehrer-pw', PASSWORD_DEFAULT), 'teacher', null);
    foreach (['s1', 's2', 's3'] as $name) {
        $users->create($name, password_hash('schueler', PASSWORD_DEFAULT), 'student', $teacherId);
    }
    $s1 = new Client($db, $catalog);
    $s1->login('s1', 'schueler');
    $s1->call('POST', '/quizzes/1/submit', ['answers' => []]);
    $s1->call('POST', '/quizzes/1/submit', ['answers' => correctAnswers($catalog, 1)]);
    $s2 = new Client($db, $catalog);
    $s2->login('s2', 'schueler');
    $s2->call('POST', '/quizzes/1/submit', ['answers' => correctAnswers($catalog, 1)]);
    $s2->call('POST', '/quizzes/2/submit', ['answers' => correctAnswers($catalog, 2)]);

    $teacher = new Client($db, $catalog);
    $teacher->login('lehrer', 'lehrer-pw');
    $stats = json_decode(json_encode($teacher->call('GET', '/statistics')->data()), true);

    check($stats['studentCount'] === 3, 'Anzahl Schüler/-innen');
    check($stats['passedCounts']['1'] === 2 && $stats['passedCounts']['2'] === 1 && $stats['passedCounts']['3'] === 0, 'bestandene Level je Level');
    check($stats['averageScores']['1'] === 67 && $stats['averageScores']['3'] === null, 'Durchschnittsscore (0, 100, 100) und null ohne Versuche');
    check($stats['taskStats']['1']['1'] === ['correct' => 2, 'wrong' => 1], 'Auswertung je Aufgabe');
    $expectedGroups = array_pad([1, 1, 1], count($catalog->levels()) + 1, 0);
    check(array_column($stats['completion'], 'count') === $expectedGroups, 'Bestehensgruppen');
    check($stats['completion'][2]['label'] === 'Level 1–2 bestanden', 'Beschriftung der Gruppen');
});

test('Import der alten users.json', function () use ($catalog): void {
    $db = freshDatabase();
    $legacy = [
        ['username' => 'lehrer1', 'password' => 'import-pw', 'role' => 'teacher'],
        ['username' => 'max', 'password' => 'passwort', 'role' => 'student', 'teacher' => 'lehrer1',
            'progress' => ['level1Passed' => true, 'level2Passed' => false],
            'history' => ['level1Passed' => [
                ['timestamp' => '2025-06-28T00:12:50.266Z', 'score' => 33, 'details' => [['task' => 1, 'correct' => false, 'answer' => 'X']]],
                ['timestamp' => '2025-06-28T00:15:00.000Z', 'manual' => 'freigeschaltet'],
            ]]],
    ];
    $result = (new LegacyImporter($db))->import($legacy);
    check($result['imported'] === ['lehrer1', 'max'], 'Benutzer importiert');
    check((new LegacyImporter($db))->import($legacy)['skipped'] === ['lehrer1', 'max'], 'zweiter Import überspringt vorhandene');

    $client = new Client($db, $catalog);
    check($client->login('max', 'passwort')->data()['user']['passedLevels'] === [1], 'Login und Fortschritt nach Import');
    $teacher = new Client($db, $catalog);
    $teacher->login('lehrer1', 'import-pw');
    $maxId = $teacher->call('GET', '/students')->data()['students'][0]['id'];
    $history = asArray($teacher->call('GET', "/students/{$maxId}/history"))['history'];
    check($history[1][0]['timestamp'] === '2025-06-28T00:12:50.266Z' && $history[1][0]['score'] === 33, 'Versuch übernommen');
    check($history[1][1]['manual'] === 'freigeschaltet', 'manueller Eintrag übernommen');
});

test('Migration ergänzt fehlende Spalten in bestehenden Datenbanken', function (): void {
    $db = freshDatabase();
    if ($db->driver() === 'mysql') {
        $db->pdo()->exec('ALTER TABLE users DROP INDEX idx_users_class, DROP COLUMN class_id');
    } else {
        $db->pdo()->exec('DROP INDEX idx_users_class');
        $db->pdo()->exec('ALTER TABLE users DROP COLUMN class_id');
    }
    check(!$db->hasColumn('users', 'class_id'), 'Spalte fehlt vor der Migration');
    $db->migrate();
    check($db->hasColumn('users', 'class_id'), 'Spalte nach der Migration vorhanden');

    $users = new UserRepository($db);
    $id = $users->create('lehrer', 'x', 'teacher', null);
    check($users->findById($id)['class_id'] === null, 'Benutzer weiterhin nutzbar');
});

test('Löschen einer Lehrkraft löscht ihre Schüler/-innen', function () use ($catalog): void {
    $db = freshDatabase();
    $users = new UserRepository($db);
    $teacherId = $users->create('lehrer', 'x', 'teacher', null);
    $studentId = $users->create('kind', 'x', 'student', $teacherId);
    $users->delete($teacherId);
    check($users->findById($studentId) === null, 'Fremdschlüssel mit ON DELETE CASCADE');
});

fwrite(STDOUT, "\n{$passes} Prüfungen bestanden, {$failures} fehlgeschlagen.\n");
exit($failures === 0 ? 0 : 1);
