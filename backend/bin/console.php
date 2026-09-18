<?php

declare(strict_types=1);

// Verwaltungsbefehle für das KryptoGAME-Backend.
// Aufruf: php bin/console.php <befehl> [argumente]

use Kryptogame\Config;
use Kryptogame\Database;
use Kryptogame\LegacyImporter;
use Kryptogame\Repository\UserRepository;
use Kryptogame\Service\QuizCatalog;
use Kryptogame\Service\Validator;

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require __DIR__ . '/../src/bootstrap.php';

$usage = <<<TXT
    Verwendung: php bin/console.php <befehl>

    Befehle:
      migrate                               Tabellen anlegen (kann gefahrlos wiederholt werden)
      create-teacher <name> [passwort]      Lehrkraft anlegen (ohne Passwort wird eines erzeugt)
      set-password <name> [passwort]        Passwort einer Person neu setzen
      make-master <name>                    Lehrkraft zum Master-Konto machen (darf Lehrkräfte verwalten)
      revoke-master <name>                  Master-Rechte wieder entziehen
      import-json <datei>                   Benutzer aus der alten users.json / JSONBin übernehmen
      check-quizzes                         Prüfungsdateien in quizzes/ auf Fehler prüfen

    TXT;

$command = $argv[1] ?? null;
if ($command === null || in_array($command, ['-h', '--help', 'help'], true)) {
    fwrite(STDOUT, $usage);
    exit($command === null ? 1 : 0);
}

try {
    if ($command === 'check-quizzes') {
        $catalog = new QuizCatalog(__DIR__ . '/../quizzes');
        foreach ($catalog->levels() as $level) {
            fwrite(STDOUT, "Level {$level}: " . count($catalog->get($level)['questions']) . " Fragen – OK\n");
        }
        exit(0);
    }

    $config = Config::load(__DIR__ . '/../config.php');
    $db = Database::connect($config['db']);
    $users = new UserRepository($db);

    switch ($command) {
        case 'migrate':
            $db->migrate();
            fwrite(STDOUT, "Datenbank ist eingerichtet ({$db->driver()}).\n");
            break;

        case 'create-teacher':
            $username = Validator::username($argv[2] ?? null);
            if ($users->usernameExists($username)) {
                throw new RuntimeException("Der Benutzername \"{$username}\" ist bereits vergeben.");
            }
            [$password, $generated] = passwordArgument($argv[3] ?? null);
            $users->create($username, password_hash($password, PASSWORD_DEFAULT), 'teacher', null);
            fwrite(STDOUT, "Lehrkraft \"{$username}\" angelegt.\n");
            if ($generated) {
                fwrite(STDOUT, "Passwort: {$password}\n");
            }
            break;

        case 'set-password':
            $user = $users->findByUsername((string) ($argv[2] ?? ''))
                ?? throw new RuntimeException('Benutzer nicht gefunden.');
            [$password, $generated] = passwordArgument($argv[3] ?? null);
            $users->updatePasswordHash($user['id'], password_hash($password, PASSWORD_DEFAULT));
            fwrite(STDOUT, "Passwort für \"{$user['username']}\" geändert.\n");
            if ($generated) {
                fwrite(STDOUT, "Passwort: {$password}\n");
            }
            break;

        case 'make-master':
        case 'revoke-master':
            $user = $users->findByUsername((string) ($argv[2] ?? ''))
                ?? throw new RuntimeException('Benutzer nicht gefunden.');
            if ($user['role'] !== 'teacher') {
                throw new RuntimeException('Nur Lehrkräfte können Master-Konto werden.');
            }
            $makeMaster = $command === 'make-master';
            $users->setMaster($user['id'], $makeMaster);
            fwrite(STDOUT, "\"{$user['username']}\" " . ($makeMaster ? 'ist jetzt Master-Konto.' : 'hat keine Master-Rechte mehr.') . "\n");
            break;

        case 'import-json':
            $file = (string) ($argv[2] ?? '');
            if (!is_file($file)) {
                throw new RuntimeException("Datei \"{$file}\" nicht gefunden.");
            }
            $data = json_decode((string) file_get_contents($file), true, 512, JSON_THROW_ON_ERROR);
            // JSONBin-Export: { "record": [...] }
            $data = $data['record'] ?? $data;
            if (!is_array($data) || !array_is_list($data)) {
                throw new RuntimeException('Erwartet wird eine Liste von Benutzern.');
            }
            $result = (new LegacyImporter($db))->import($data);
            fwrite(STDOUT, count($result['imported']) . " Benutzer importiert.\n");
            if ($result['skipped'] !== []) {
                fwrite(STDOUT, 'Übersprungen (existieren bereits): ' . implode(', ', $result['skipped']) . "\n");
            }
            break;

        default:
            fwrite(STDERR, "Unbekannter Befehl \"{$command}\".\n\n" . $usage);
            exit(1);
    }
} catch (Throwable $e) {
    fwrite(STDERR, 'Fehler: ' . $e->getMessage() . "\n");
    exit(1);
}

/**
 * @return array{0: string, 1: bool} Passwort und ob es erzeugt wurde
 */
function passwordArgument(?string $given): array
{
    if ($given !== null) {
        return [Validator::password($given), false];
    }
    $alphabet = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    $password = '';
    for ($i = 0; $i < 12; $i++) {
        $password .= $alphabet[random_int(0, strlen($alphabet) - 1)];
    }
    return [$password, true];
}
