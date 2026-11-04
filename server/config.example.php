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
    // 'db' => ['dsn' => 'sqlite:data/schulbuch.sqlite'],

    // URL-Pfad, unter dem dieser Ordner erreichbar ist
    'base_path' => '/api',

    // Session-Cookie nur über HTTPS senden (lokal ohne HTTPS: false)
    'secure_cookies' => true,

    // Wie lange eine Anmeldung ohne Aktivität gültig bleibt (Sekunden)
    'session_lifetime' => 8 * 3600,

    // Zusätzlich erlaubte Origins für schreibende Anfragen. Nur für die lokale Entwicklung nötig:
    // Der Proxy des React-Entwicklungsservers ersetzt den Origin-Header durch die Adresse des PHP-Servers.
    // 'allowed_origins' => ['http://127.0.0.1:8000'],
    'allowed_origins' => [],

    // Ordner mit den Prüfungen des KryptoGAMEs (enthalten die Lösungen!). Auf dem Server außerhalb des
    // öffentlichen Webordners ablegen, da manche Webserver .json-Dateien direkt ausliefern und .htaccess ignorieren.
    // 'quizzes_dir' => __DIR__ . '/../../kryptogame-data/quizzes',

    // Schlüssel der Inhalte für Lehrkräfte im Schulbuch: derselbe Wert wie in .lehrkraft-schluessel
    // (Base64, 32 Byte). Nur angemeldete Lehrkräfte bekommen ihn über GET /teacher-content/key.
    'content_key' => '',

    // Registrierung von Lehrkräften: Anfragen gehen an diese Adresse, versendet wird über mail()
    'admin_email' => 'deine-adresse@example.org',
    'mail_from' => 'schulbuch@example.org',
    // Öffentliche Adresse der Website (für Links in E-Mails)
    'site_url' => 'https://example.org',

    // Fehlermeldungen im Detail ausgeben – nur lokal auf true setzen!
    'debug' => false,

    // Einrichtung ohne SSH über setup.php: ein langes Zufallstoken (mind. 20 Zeichen) eintragen,
    // setup.php im Browser öffnen und das Token danach wieder auf '' setzen.
    'setup_token' => '',
];
