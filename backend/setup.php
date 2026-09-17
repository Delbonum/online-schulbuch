<?php

declare(strict_types=1);

// Einrichtung über den Browser für Webspace ohne SSH-Zugang.
// Nur aktiv, wenn in config.php ein 'setup_token' (mind. 20 Zeichen) gesetzt ist.
// Nach der Einrichtung das Token wieder entfernen!

use Kryptogame\Config;
use Kryptogame\Database;
use Kryptogame\LegacyImporter;
use Kryptogame\Repository\UserRepository;
use Kryptogame\Service\Validator;

require __DIR__ . '/src/bootstrap.php';

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store');
header('X-Frame-Options: DENY');
header("Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'; form-action 'self'");

$configFile = __DIR__ . '/config.php';
$rawConfig = is_file($configFile) ? require $configFile : [];
$token = is_array($rawConfig) ? (string) ($rawConfig['setup_token'] ?? '') : '';

if (strlen($token) < 20) {
    http_response_code(404);
    exit('Nicht gefunden.');
}

$message = null;
$isError = false;

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    try {
        if (!hash_equals($token, (string) ($_POST['token'] ?? ''))) {
            usleep(500000);
            throw new RuntimeException('Falsches Setup-Token.');
        }
        $db = Database::connect(Config::load($configFile)['db']);
        $users = new UserRepository($db);

        switch ($_POST['action'] ?? '') {
            case 'migrate':
                $db->migrate();
                $message = 'Datenbanktabellen sind eingerichtet.';
                break;

            case 'create-teacher':
                $username = Validator::username($_POST['username'] ?? null);
                $password = Validator::password($_POST['password'] ?? null);
                if ($users->usernameExists($username)) {
                    throw new RuntimeException("Der Benutzername \"{$username}\" ist bereits vergeben.");
                }
                $users->create($username, password_hash($password, PASSWORD_DEFAULT), 'teacher', null);
                $message = "Lehrkraft \"{$username}\" wurde angelegt.";
                break;

            case 'import-json':
                $data = json_decode((string) ($_POST['json'] ?? ''), true, 512, JSON_THROW_ON_ERROR);
                $data = $data['record'] ?? $data;
                if (!is_array($data) || !array_is_list($data)) {
                    throw new RuntimeException('Erwartet wird eine Liste von Benutzern.');
                }
                $result = (new LegacyImporter($db))->import($data);
                $message = count($result['imported']) . ' Benutzer importiert.'
                    . ($result['skipped'] !== [] ? ' Übersprungen: ' . implode(', ', $result['skipped']) : '');
                break;

            default:
                throw new RuntimeException('Unbekannte Aktion.');
        }
    } catch (Throwable $e) {
        $isError = true;
        $message = $e->getMessage();
    }
}

$e = static fn (string $s): string => htmlspecialchars($s, ENT_QUOTES, 'UTF-8');
?>
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex">
    <title>KryptoGAME – Einrichtung</title>
    <style>
        body { font-family: system-ui, sans-serif; max-width: 40rem; margin: 2rem auto; padding: 0 1rem; line-height: 1.5; }
        fieldset { margin-bottom: 1.5rem; border: 1px solid #ccc; border-radius: .5rem; }
        label { display: block; margin: .5rem 0 .25rem; }
        input, textarea { width: 100%; box-sizing: border-box; padding: .4rem; }
        button { margin-top: .75rem; padding: .4rem 1rem; }
        .msg { padding: .75rem; border-radius: .5rem; background: #e6f4ea; }
        .msg.error { background: #fce8e6; }
    </style>
</head>
<body>
<h1>KryptoGAME – Einrichtung</h1>
<p><strong>Wichtig:</strong> Entferne nach der Einrichtung das <code>setup_token</code> aus der <code>config.php</code>.
    Dann ist diese Seite nicht mehr erreichbar.</p>

<?php if ($message !== null): ?>
    <p class="msg<?= $isError ? ' error' : '' ?>"><?= $e($message) ?></p>
<?php endif ?>

<form method="post">
    <fieldset>
        <legend>1. Datenbanktabellen anlegen</legend>
        <label>Setup-Token <input type="password" name="token" required></label>
        <input type="hidden" name="action" value="migrate">
        <button>Tabellen anlegen</button>
    </fieldset>
</form>

<form method="post">
    <fieldset>
        <legend>2. Lehrkraft anlegen</legend>
        <label>Setup-Token <input type="password" name="token" required></label>
        <label>Benutzername <input name="username" required></label>
        <label>Passwort (mind. <?= Validator::PASSWORD_MIN_LENGTH ?> Zeichen) <input type="password" name="password" required></label>
        <input type="hidden" name="action" value="create-teacher">
        <button>Lehrkraft anlegen</button>
    </fieldset>
</form>

<form method="post">
    <fieldset>
        <legend>3. Optional: Daten aus JSONBin übernehmen</legend>
        <label>Setup-Token <input type="password" name="token" required></label>
        <label>Inhalt der alten users.json bzw. des JSONBin-Exports
            <textarea name="json" rows="8" required></textarea></label>
        <input type="hidden" name="action" value="import-json">
        <button>Importieren</button>
    </fieldset>
</form>
</body>
</html>
