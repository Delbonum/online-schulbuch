<?php

declare(strict_types=1);

namespace Schulbuch\Controller;

use DateTimeImmutable;
use DateTimeZone;
use Schulbuch\Database;
use Schulbuch\Http\HttpException;
use Schulbuch\Http\Request;
use Schulbuch\Http\Response;

/**
 * Modem der Netzwerk-Simulation: verbindet zwei Simulationen in verschiedenen Browsern. Seite A bietet eine
 * Verbindung an und bekommt einen sechsstelligen Code, Seite B wählt sich mit dem Code ein. Danach reicht der
 * Server Ethernet-Rahmen (JSON) von einer Seite zur anderen weiter; beide fragen regelmäßig nach.
 *
 * Kein Konto nötig. Jede Seite weist sich mit einem geheimen Schlüssel (token) aus; gespeichert werden nur die
 * gerade unterwegs befindlichen Rahmen. Verbindungen verfallen nach 12 Stunden.
 */
final class ModemController
{
    private const MAX_RAHMEN = 50;          // je Anfrage
    private const MAX_GROESSE = 16000;      // Zeichen je Rahmen
    private const MAX_WARTEND = 500;        // Rahmen, die höchstens auf eine Seite warten
    private const PARTNER_SEKUNDEN = 15;    // so lange gilt die andere Seite als verbunden

    public function __construct(private Database $db)
    {
    }

    public function anbieten(Request $request): Response
    {
        $this->aufraeumen();
        for ($i = 0; $i < 50; $i++) {
            $code = (string) random_int(100000, 999999);
            if ($this->db->fetchOne('SELECT code FROM modem_links WHERE code = ?', [$code]) === null) {
                break;
            }
        }
        $token = bin2hex(random_bytes(16));
        $now = Database::now();
        $this->db->execute('INSERT INTO modem_links (code, token_a, seen_a, created_at) VALUES (?, ?, ?, ?)', [$code, $token, $now, $now]);
        return Response::json(['code' => $code, 'seite' => 'a', 'token' => $token], 201);
    }

    /** @param array<string, string> $params */
    public function einwaehlen(Request $request, array $params): Response
    {
        $link = $this->link($params['code']);
        if ($link['token_b'] !== null && $this->frisch($link['seen_b'])) {
            throw HttpException::conflict('Mit diesem Code ist schon ein anderes Modem verbunden.');
        }
        $token = bin2hex(random_bytes(16));
        $this->db->execute('UPDATE modem_links SET token_b = ?, seen_b = ? WHERE code = ?', [$token, Database::now(), $link['code']]);
        $this->db->execute("DELETE FROM modem_frames WHERE code = ? AND to_side = 'b'", [$link['code']]);
        return Response::json(['code' => $link['code'], 'seite' => 'b', 'token' => $token]);
    }

    /** Rahmen an die andere Seite schicken */
    public function senden(Request $request, array $params): Response
    {
        [$link, $seite] = $this->anmelden($params['code'], $request->json()['token'] ?? null);
        $rahmen = $request->json()['rahmen'] ?? null;
        if (!is_array($rahmen) || !array_is_list($rahmen) || count($rahmen) > self::MAX_RAHMEN) {
            throw HttpException::badRequest('Ungültige Rahmen.');
        }
        $ziel = $seite === 'a' ? 'b' : 'a';
        $now = Database::now();
        foreach ($rahmen as $r) {
            $text = json_encode($r, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            if (!is_array($r) || $text === false || strlen($text) > self::MAX_GROESSE) {
                continue;
            }
            $this->db->execute('INSERT INTO modem_frames (code, to_side, payload, created_at) VALUES (?, ?, ?, ?)', [$link['code'], $ziel, $text, $now]);
        }
        // Stau begrenzen: Die andere Seite holt nicht ab → älteste Rahmen verwerfen
        $wartend = (int) $this->db->fetchOne('SELECT COUNT(*) AS n FROM modem_frames WHERE code = ? AND to_side = ?', [$link['code'], $ziel])['n'];
        if ($wartend > self::MAX_WARTEND) {
            $grenze = $this->db->fetchOne('SELECT id FROM modem_frames WHERE code = ? AND to_side = ? ORDER BY id DESC LIMIT 1 OFFSET ' . self::MAX_WARTEND, [$link['code'], $ziel]);
            if ($grenze !== null) {
                $this->db->execute('DELETE FROM modem_frames WHERE code = ? AND to_side = ? AND id <= ?', [$link['code'], $ziel, $grenze['id']]);
            }
        }
        return Response::json(['partner' => $this->partnerDa($link, $seite)]);
    }

    /** Rahmen abholen (werden danach gelöscht) und Lebenszeichen geben */
    public function abholen(Request $request, array $params): Response
    {
        [$link, $seite] = $this->anmelden($params['code'], $request->query('token'));
        $zeilen = $this->db->fetchAll('SELECT id, payload FROM modem_frames WHERE code = ? AND to_side = ? ORDER BY id LIMIT 200', [$link['code'], $seite]);
        if ($zeilen !== []) {
            $this->db->execute('DELETE FROM modem_frames WHERE code = ? AND to_side = ? AND id <= ?', [$link['code'], $seite, end($zeilen)['id']]);
        }
        return Response::json([
            'rahmen' => array_map(static fn (array $z): mixed => json_decode((string) $z['payload'], true), $zeilen),
            'partner' => $this->partnerDa($link, $seite),
        ]);
    }

    /** Verbindung beenden (Seite A löscht sie ganz, Seite B gibt ihren Platz frei) */
    public function auflegen(Request $request, array $params): Response
    {
        [$link, $seite] = $this->anmelden($params['code'], $request->json()['token'] ?? null);
        if ($seite === 'a') {
            $this->db->execute('DELETE FROM modem_links WHERE code = ?', [$link['code']]);
        } else {
            $this->db->execute('UPDATE modem_links SET token_b = NULL, seen_b = NULL WHERE code = ?', [$link['code']]);
        }
        return Response::noContent();
    }

    // ------------------------------------------------------------ Hilfen

    /** @return array<string, mixed> */
    private function link(string $code): array
    {
        $link = preg_match('/^\d{6}$/', $code) ? $this->db->fetchOne('SELECT * FROM modem_links WHERE code = ?', [$code]) : null;
        if ($link === null) {
            throw HttpException::notFound('Zu diesem Code wartet kein Modem.');
        }
        return $link;
    }

    /** @return array{0: array<string, mixed>, 1: string} */
    private function anmelden(string $code, mixed $token): array
    {
        $link = $this->link($code);
        $seite = is_string($token) && hash_equals($link['token_a'], $token) ? 'a'
            : (is_string($token) && $link['token_b'] !== null && hash_equals((string) $link['token_b'], $token) ? 'b' : null);
        if ($seite === null) {
            throw HttpException::forbidden('Diese Modem-Verbindung gehört jemand anderem.');
        }
        $this->db->execute("UPDATE modem_links SET seen_{$seite} = ? WHERE code = ?", [Database::now(), $link['code']]);
        return [$link, $seite];
    }

    private function partnerDa(array $link, string $seite): bool
    {
        $andere = $seite === 'a' ? $link['seen_b'] : $link['seen_a'];
        return ($seite === 'a' ? $link['token_b'] !== null : true) && $this->frisch($andere);
    }

    private function frisch(mixed $zeit): bool
    {
        if (!is_string($zeit) || $zeit === '') {
            return false;
        }
        $t = new DateTimeImmutable($zeit, new DateTimeZone('UTC'));
        return time() - $t->getTimestamp() <= self::PARTNER_SEKUNDEN;
    }

    private function aufraeumen(): void
    {
        $grenze = (new DateTimeImmutable('-12 hours', new DateTimeZone('UTC')))->format('Y-m-d H:i:s.v');
        $this->db->execute('DELETE FROM modem_links WHERE seen_a < ? AND (seen_b IS NULL OR seen_b < ?)', [$grenze, $grenze]);
    }
}
