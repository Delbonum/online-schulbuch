<?php

// Router-Skript für den eingebauten PHP-Webserver (nur lokale Entwicklung):
//   php -S localhost:8000 backend/dev-server.php
// Der React-Entwicklungsserver leitet API-Aufrufe per Proxy hierher weiter.

if (PHP_SAPI !== 'cli-server') {
    http_response_code(404);
    exit;
}

if (str_ends_with((string) parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH), '/setup.php')) {
    require __DIR__ . '/setup.php';
    return;
}

require __DIR__ . '/index.php';
