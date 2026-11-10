<?php

declare(strict_types=1);

namespace Schulbuch\Controller;

use DateTimeImmutable;
use DateTimeZone;
use PDOException;
use Schulbuch\Database;
use Schulbuch\Http\HttpException;
use Schulbuch\Http\Request;
use Schulbuch\Http\Response;
use Schulbuch\Service\Auth;
use Schulbuch\Service\Validator;

/**
 * Rollenspiel „Nachrichten im Netzwerk“ (/informatik/werkzeuge/netzwerk-rollenspiel/): Die Lehrkraft startet eine
 * Runde (Anzahl, Gruppen, Stufe, Zufallszahl), die Klasse scannt den QR-Code. Jedes Gerät bekommt sofort eine
 * zufällige freie Rolle (Nummer 1 … Anzahl); vergebene Rollen sind für andere gesperrt. Die Karte selbst (Name,
 * MAC, IP …) berechnet der Browser aus den Einstellungen und der Nummer (rollen.js).
 *
 * Vergabe: Es kommt immer eine Gruppe mit den wenigsten vergebenen Rollen an die Reihe (bei Gleichstand zufällig),
 * damit die Gruppen gleich groß werden, auch wenn weniger Personen mitspielen als eingestellt. Innerhalb der Gruppe
 * wird zuerst Nummer 1 der Gruppe vergeben (in Stufe 3 der Router), in Gruppe 1 dann Nummer 2 (der DNS-Server),
 * danach eine zufällige freie Nummer. So funktioniert jedes Netz, sobald es Mitglieder hat.
 *
 * Gespeichert wird nur Nummer ↔ zufällige Browser-Kennung, keine Namen. Runden verfallen 60 Tage nach der letzten
 * Änderung.
 */
final class RollenspielController
{
    public const LOESCHEN_NACH_TAGEN = 60;
    private const MAX_RUNDEN = 100;
    public const GRENZEN = ['minPersonen' => 3, 'maxPersonen' => 64, 'maxGruppen' => 8, 'minJeGruppe' => 3];

    public function __construct(private Auth $auth, private Database $db)
    {
    }

    // ------------------------------------------------------------ Lehrkräfte

    public function index(Request $request): Response
    {
        $teacher = $this->auth->requireTeacher();
        $this->aufraeumen();
        $rows = $this->db->fetchAll('SELECT * FROM rollenspiel_runden WHERE teacher_id = ? ORDER BY updated_at DESC, id DESC', [$teacher['id']]);
        return Response::json(['runden' => array_map(fn (array $r): array => $this->payload($r, true), $rows)]);
    }

    public function create(Request $request): Response
    {
        $teacher = $this->auth->requireTeacher();
        $this->aufraeumen();
        $n = (int) $this->db->fetchOne('SELECT COUNT(*) AS n FROM rollenspiel_runden WHERE teacher_id = ?', [$teacher['id']])['n'];
        if ($n >= self::MAX_RUNDEN) {
            throw HttpException::conflict('Du hast schon sehr viele Rollenspiel-Runden. Lösche zuerst alte.');
        }
        $settings = self::pruefe($request->json());
        $now = Database::now();
        $this->db->execute('INSERT INTO rollenspiel_runden (teacher_id, code, settings, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
            [$teacher['id'], $this->neuerCode(), json_encode($settings), $now, $now]);
        return Response::json(['runde' => $this->payload($this->eigene($teacher, (string) $this->db->lastInsertId()), true)], 201);
    }

    /** @param array<string, string> $params */
    public function show(Request $request, array $params): Response
    {
        $teacher = $this->auth->requireTeacher();
        return Response::json(['runde' => $this->payload($this->eigene($teacher, $params['id']), true)]);
    }

    /**
     * Einstellungen ändern. Stufe und Darstellung (vereinfacht) gehen immer – die Karten aller Geräte ändern sich
     * mit. Anzahl, Gruppen und Zufallszahl nur, solange noch keine Rolle vergeben ist.
     *
     * @param array<string, string> $params
     */
    public function update(Request $request, array $params): Response
    {
        $teacher = $this->auth->requireTeacher();
        $runde = $this->eigene($teacher, $params['id']);
        $alt = self::settings($runde);
        $neu = self::pruefe($request->json() + $alt);
        $struktur = ['personen', 'gruppen', 'seed'];
        $geaendert = array_filter($struktur, static fn (string $k): bool => $neu[$k] !== $alt[$k]);
        if ($geaendert !== [] && $this->rollen((int) $runde['id']) !== []) {
            throw HttpException::conflict('Anzahl, Gruppen und Zufallszahl lassen sich nur ändern, solange keine Rolle vergeben ist. Gib zuerst alle Rollen frei.');
        }
        $this->db->execute('UPDATE rollenspiel_runden SET settings = ?, updated_at = ? WHERE id = ?', [json_encode($neu), Database::now(), $runde['id']]);
        return Response::json(['runde' => $this->payload($this->eigene($teacher, $params['id']), true)]);
    }

    /** @param array<string, string> $params */
    public function delete(Request $request, array $params): Response
    {
        $teacher = $this->auth->requireTeacher();
        $runde = $this->eigene($teacher, $params['id']);
        $this->db->execute('DELETE FROM rollenspiel_rollen WHERE runde_id = ?', [$runde['id']]);
        $this->db->execute('DELETE FROM rollenspiel_runden WHERE id = ?', [$runde['id']]);
        return Response::noContent();
    }

    /** Eine Rolle wieder freigeben (z. B. Gerät gewechselt) – ohne Nummer alle */
    public function release(Request $request, array $params): Response
    {
        $teacher = $this->auth->requireTeacher();
        $runde = $this->eigene($teacher, $params['id']);
        if (isset($params['nr'])) {
            $this->db->execute('DELETE FROM rollenspiel_rollen WHERE runde_id = ? AND nr = ?', [$runde['id'], Validator::positiveInt($params['nr'], 'Nummer')]);
        } else {
            $this->db->execute('DELETE FROM rollenspiel_rollen WHERE runde_id = ?', [$runde['id']]);
        }
        $this->db->execute('UPDATE rollenspiel_runden SET updated_at = ? WHERE id = ?', [Database::now(), $runde['id']]);
        return Response::json(['runde' => $this->payload($this->eigene($teacher, $params['id']), true)]);
    }

    // ------------------------------------------------------------ Ohne Konto: eigene Rolle

    /** Stand abfragen (Stufe kann sich ändern, Rolle kann freigegeben worden sein) */
    public function join(Request $request, array $params): Response
    {
        $this->aufraeumen();
        $runde = $this->perCode($params['code']);
        return Response::json(['runde' => $this->payload($runde, false, self::kennung($request->query('participant'), false))]);
    }

    /** Rolle holen: die schon vergebene oder eine neue, zufällige */
    public function take(Request $request, array $params): Response
    {
        $runde = $this->perCode($params['code']);
        $ich = self::kennung($request->json()['participant'] ?? null, true);
        $settings = self::settings($runde);
        for ($versuch = 0; $versuch < 5; $versuch++) {
            $belegt = $this->rollen((int) $runde['id']);
            foreach ($belegt as $r) {
                if ($r['participant'] === $ich) {
                    return Response::json(['runde' => $this->payload($runde, false, $ich)]);
                }
            }
            $nr = self::waehle($settings, array_map(static fn (array $r): int => (int) $r['nr'], $belegt));
            if ($nr === null) {
                throw HttpException::conflict('Alle Rollen sind schon vergeben. Sag deiner Lehrkraft Bescheid.');
            }
            try {
                $this->db->execute('INSERT INTO rollenspiel_rollen (runde_id, nr, participant, created_at) VALUES (?, ?, ?, ?)',
                    [$runde['id'], $nr, $ich, Database::now()]);
                $this->db->execute('UPDATE rollenspiel_runden SET updated_at = ? WHERE id = ?', [Database::now(), $runde['id']]);
                return Response::json(['runde' => $this->payload($runde, false, $ich)], 201);
            } catch (PDOException $e) {
                // Gleichzeitig vergeben: neu auswählen
                if (!str_starts_with((string) $e->getCode(), '23')) {
                    throw $e;
                }
            }
        }
        throw HttpException::conflict('Gerade melden sich sehr viele gleichzeitig an. Bitte lade die Seite neu.');
    }

    // ------------------------------------------------------------ Vergabe

    /** @return list<int> Gruppengrößen wie in rollen.js: so gleich wie möglich, vorne die größeren */
    public static function groessen(int $personen, int $gruppen): array
    {
        return array_map(static fn (int $i): int => intdiv($personen, $gruppen) + ($i < $personen % $gruppen ? 1 : 0), range(0, $gruppen - 1));
    }

    /**
     * Nächste Rolle: Gruppe mit den wenigsten vergebenen Rollen, darin zuerst Nummer 1 (Router), in Gruppe 1 dann
     * Nummer 2 (DNS-Server), sonst zufällig.
     *
     * @param array{personen: int, gruppen: int} $settings
     * @param list<int> $belegt
     */
    public static function waehle(array $settings, array $belegt): ?int
    {
        $kandidaten = [];
        $wenigste = PHP_INT_MAX;
        $start = 1;
        foreach (self::groessen($settings['personen'], $settings['gruppen']) as $g => $groesse) {
            $nummern = range($start, $start + $groesse - 1);
            $start += $groesse;
            $frei = array_values(array_diff($nummern, $belegt));
            if ($frei === []) {
                continue;
            }
            $vergeben = $groesse - count($frei);
            if ($vergeben < $wenigste) {
                $wenigste = $vergeben;
                $kandidaten = [];
            }
            if ($vergeben === $wenigste) {
                $kandidaten[] = [$g, $nummern, $frei];
            }
        }
        if ($kandidaten === []) {
            return null;
        }
        [$g, $nummern, $frei] = $kandidaten[random_int(0, count($kandidaten) - 1)];
        if (in_array($nummern[0], $frei, true)) {
            return $nummern[0];
        }
        if ($g === 0 && in_array($nummern[1], $frei, true)) {
            return $nummern[1];
        }
        return $frei[random_int(0, count($frei) - 1)];
    }

    /**
     * @param array<string, mixed> $b
     * @return array{personen: int, gruppen: int, stufe: int, seed: int, vereinfacht: bool}
     */
    public static function pruefe(array $b): array
    {
        $g = self::GRENZEN;
        $zahl = static function (mixed $w, int $min, int $max, string $text): int {
            if (!is_int($w) && !(is_string($w) && preg_match('/^\d+$/', $w))) {
                throw HttpException::badRequest($text);
            }
            $w = (int) $w;
            if ($w < $min || $w > $max) {
                throw HttpException::badRequest($text);
            }
            return $w;
        };
        $s = [
            'personen' => $zahl($b['personen'] ?? null, $g['minPersonen'], $g['maxPersonen'], "Es können {$g['minPersonen']} bis {$g['maxPersonen']} Personen mitspielen."),
            'gruppen' => $zahl($b['gruppen'] ?? null, 1, $g['maxGruppen'], "Es sind 1 bis {$g['maxGruppen']} Gruppen möglich."),
            'stufe' => $zahl($b['stufe'] ?? null, 1, 3, 'Die Stufe muss 1, 2 oder 3 sein.'),
            'seed' => $zahl($b['seed'] ?? 0, 0, 999, 'Die Zufallszahl liegt zwischen 0 und 999.'),
            'vereinfacht' => (bool) ($b['vereinfacht'] ?? false),
        ];
        if (intdiv($s['personen'], $s['gruppen']) < $g['minJeGruppe']) {
            throw HttpException::badRequest("Jede Gruppe braucht mindestens {$g['minJeGruppe']} Personen – weniger Gruppen wählen.");
        }
        if ($s['stufe'] === 3 && $s['gruppen'] < 2) {
            throw HttpException::badRequest('Für Stufe 3 (Netze verbinden) braucht es mindestens zwei Gruppen.');
        }
        return $s;
    }

    // ------------------------------------------------------------ Hilfen

    /** @return array<string, mixed> */
    private function payload(array $runde, bool $lehrkraft, ?string $ich = null): array
    {
        $rollen = $this->rollen((int) $runde['id']);
        $settings = self::settings($runde);
        $out = ['code' => $runde['code'], 'settings' => $settings, 'vergeben' => count($rollen)];
        if ($lehrkraft) {
            $out += [
                'id' => (int) $runde['id'],
                'rollen' => array_map(static fn (array $r): array => ['nr' => (int) $r['nr'], 'am' => Database::toIso((string) $r['created_at'])], $rollen),
                'createdAt' => Database::toIso((string) $runde['created_at']),
                'updatedAt' => Database::toIso((string) $runde['updated_at']),
            ];
        } else {
            $meine = null;
            foreach ($rollen as $r) {
                if ($ich !== null && $r['participant'] === $ich) {
                    $meine = (int) $r['nr'];
                }
            }
            $out['nr'] = $meine;
        }
        return $out;
    }

    /** @return list<array<string, mixed>> */
    private function rollen(int $rundeId): array
    {
        return $this->db->fetchAll('SELECT nr, participant, created_at FROM rollenspiel_rollen WHERE runde_id = ? ORDER BY nr', [$rundeId]);
    }

    /** @return array{personen: int, gruppen: int, stufe: int, seed: int, vereinfacht: bool} */
    private static function settings(array $runde): array
    {
        return self::pruefe(json_decode((string) $runde['settings'], true) ?: []);
    }

    private function eigene(array $teacher, string $id): array
    {
        $runde = $this->db->fetchOne('SELECT * FROM rollenspiel_runden WHERE id = ?', [Validator::positiveInt($id, 'ID')]);
        if ($runde === null || (int) $runde['teacher_id'] !== (int) $teacher['id']) {
            throw HttpException::notFound('Nicht gefunden.');
        }
        return $runde;
    }

    private function perCode(string $code): array
    {
        $runde = preg_match('/^\d{6}$/', $code) ? $this->db->fetchOne('SELECT * FROM rollenspiel_runden WHERE code = ?', [$code]) : null;
        if ($runde === null) {
            throw HttpException::notFound('Zu diesem Code gibt es kein Rollenspiel.');
        }
        return $runde;
    }

    private function neuerCode(): string
    {
        for ($i = 0; $i < 100; $i++) {
            $code = (string) random_int(100000, 999999);
            $belegt = $this->db->fetchOne('SELECT code FROM rollenspiel_runden WHERE code = ?', [$code]) !== null
                || $this->db->fetchOne('SELECT code FROM termin_events WHERE code = ?', [$code]) !== null
                || $this->db->fetchOne('SELECT code FROM poll_runs WHERE code = ?', [$code]) !== null;
            if (!$belegt) {
                return $code;
            }
        }
        throw HttpException::conflict('Es konnte kein freier Code gefunden werden. Bitte später erneut versuchen.');
    }

    private function aufraeumen(): void
    {
        $grenze = (new DateTimeImmutable('now', new DateTimeZone('UTC')))->modify('-' . self::LOESCHEN_NACH_TAGEN . ' days')->format('Y-m-d H:i:s.v');
        foreach (array_column($this->db->fetchAll('SELECT id FROM rollenspiel_runden WHERE updated_at < ?', [$grenze]), 'id') as $id) {
            $this->db->execute('DELETE FROM rollenspiel_rollen WHERE runde_id = ?', [$id]);
            $this->db->execute('DELETE FROM rollenspiel_runden WHERE id = ?', [$id]);
        }
    }

    private static function kennung(mixed $wert, bool $pflicht): ?string
    {
        if (is_string($wert) && preg_match('/^[a-z0-9]{16}$/', $wert)) {
            return $wert;
        }
        if ($pflicht) {
            throw HttpException::badRequest('Ungültige Teilnahme-Kennung.');
        }
        return null;
    }
}
