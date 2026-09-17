<?php

// Kopiere diese Datei nach config.php und trage die Zugangsdaten ein.
// config.php enthält Passwörter und darf NICHT ins Git-Repository.

return [
    // Produktion (MySQL/MariaDB):
    'db' => [
        'dsn' => 'mysql:host=localhost;dbname=kryptogame;charset=utf8mb4',
        'user' => 'kryptogame',
        'password' => 'GEHEIM',
    ],

    // Lokale Entwicklung ohne Datenbankserver (SQLite-Datei im Ordner data/):
    // 'db' => ['dsn' => 'sqlite:data/kryptogame.sqlite'],

    // URL-Pfad, unter dem dieser Ordner erreichbar ist
    'base_path' => '/informatik/kryptogame/api',

    // Session-Cookie nur über HTTPS senden (lokal ohne HTTPS: false)
    'secure_cookies' => true,

    // Wie lange eine Anmeldung ohne Aktivität gültig bleibt (Sekunden)
    'session_lifetime' => 8 * 3600,

    // Fehlermeldungen im Detail ausgeben – nur lokal auf true setzen!
    'debug' => false,

    // Einrichtung ohne SSH über setup.php: ein langes Zufallstoken (mind. 20 Zeichen) eintragen,
    // setup.php im Browser öffnen und das Token danach wieder auf '' setzen.
    'setup_token' => '',
];
