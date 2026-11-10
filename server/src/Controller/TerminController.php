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
 * Terminbuchung (/werkzeuge/termine/): Eine Lehrkraft legt Zeiträume und die Dauer eines Termins fest, daraus
 * entstehen Termin-Slots. Schülerinnen und Schüler buchen ohne Konto mit Code und Namen einen Slot – wer zuerst
 * kommt, bekommt ihn (Modus „fifo“). Jede Person (Browser-Kennung) bucht höchstens einen Termin je Veranstaltung.
 *
 * Zeiten sind Ortszeit (Europe/Berlin) ohne Zeitzonenumrechnung; ein Slot heißt z. B. „20261113-0800“.
 * Veranstaltungen samt Namen werden 30 Tage nach ihrem letzten Tag gelöscht.
 */
final class TerminController
{
    public const ZEITZONE = 'Europe/Berlin';
    public const LOESCHEN_NACH_TAGEN = 30;
    private const MAX_ZEITRAEUME = 30;
    private const MAX_SLOTS = 500;
    private const MAX_EVENTS = 200;

    public function __construct(private Auth $auth, private Database $db)
    {
    }

    // ------------------------------------------------------------ Lehrkräfte

    public function index(Request $request): Response
    {
        $teacher = $this->auth->requireTeacher();
        $this->aufraeumen();
        $rows = $this->db->fetchAll('SELECT * FROM termin_events WHERE teacher_id = ? ORDER BY last_day DESC, id DESC', [$teacher['id']]);
        return Response::json(['events' => array_map(fn (array $r): array => $this->payload($r, true, null, false), $rows)]);
    }

    public function create(Request $request): Response
    {
        $teacher = $this->auth->requireTeacher();
        $n = (int) $this->db->fetchOne('SELECT COUNT(*) AS n FROM termin_events WHERE teacher_id = ?', [$teacher['id']])['n'];
        if ($n >= self::MAX_EVENTS) {
            throw HttpException::conflict('Du hast schon sehr viele Terminbuchungen. Lösche zuerst alte.');
        }
        $daten = self::pruefe($request->json());
        $now = Database::now();
        $this->db->execute(
            'INSERT INTO termin_events (teacher_id, code, title, description, mode, settings, periods, blocked, is_open, last_day, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [$teacher['id'], $this->neuerCode(), $daten['title'], $daten['description'], 'fifo', json_encode($daten['settings']),
                json_encode($daten['periods']), json_encode($daten['blocked']), $daten['open'] ? 1 : 0, $daten['lastDay'], $now, $now],
        );
        return Response::json(['event' => $this->payload($this->eigenes($teacher, (string) $this->db->lastInsertId()), true)], 201);
    }

    /** @param array<string, string> $params */
    public function show(Request $request, array $params): Response
    {
        $teacher = $this->auth->requireTeacher();
        return Response::json(['event' => $this->payload($this->eigenes($teacher, $params['id']), true)]);
    }

    /** @param array<string, string> $params */
    public function update(Request $request, array $params): Response
    {
        $teacher = $this->auth->requireTeacher();
        $event = $this->eigenes($teacher, $params['id']);
        $body = $request->json();
        // Teiländerung (öffnen/schließen, Termine sperren): fehlende Angaben aus dem gespeicherten Stand
        if (!array_key_exists('periods', $body)) {
            $alt = self::dekodiere($event);
            $body += ['title' => $event['title'], 'description' => $event['description'], 'settings' => $alt['settings'],
                'periods' => $alt['periods'], 'blocked' => $alt['blocked'], 'open' => (bool) (int) $event['is_open']];
        }
        $daten = self::pruefe($body);
        $slots = array_column(self::slots($daten['periods'], $daten['settings']), null, 'key');
        foreach ($this->buchungen((int) $event['id']) as $b) {
            if (!isset($slots[$b['slot']])) {
                throw HttpException::conflict('Für einen Termin, der wegfallen würde, gibt es schon eine Buchung (' . self::lesbar($b['slot']) . ', ' . $b['name'] . '). Entferne sie zuerst.');
            }
            if ((int) $b['seat'] >= $daten['settings']['plaetze']) {
                throw HttpException::conflict('Am ' . self::lesbar($b['slot']) . ' sind schon mehr Personen gebucht, als es künftig Plätze gäbe. Entferne zuerst Buchungen.');
            }
        }
        $this->db->execute(
            'UPDATE termin_events SET title = ?, description = ?, settings = ?, periods = ?, blocked = ?, is_open = ?, last_day = ?, updated_at = ? WHERE id = ?',
            [$daten['title'], $daten['description'], json_encode($daten['settings']), json_encode($daten['periods']), json_encode($daten['blocked']),
                $daten['open'] ? 1 : 0, $daten['lastDay'], Database::now(), $event['id']],
        );
        return Response::json(['event' => $this->payload($this->eigenes($teacher, $params['id']), true)]);
    }

    /** @param array<string, string> $params */
    public function delete(Request $request, array $params): Response
    {
        $teacher = $this->auth->requireTeacher();
        $event = $this->eigenes($teacher, $params['id']);
        $this->db->execute('DELETE FROM termin_bookings WHERE event_id = ?', [$event['id']]);
        $this->db->execute('DELETE FROM termin_events WHERE id = ?', [$event['id']]);
        return Response::noContent();
    }

    /** Lehrkraft trägt jemanden ein (auch nach Buchungsschluss und ohne Kennung) */
    public function assign(Request $request, array $params): Response
    {
        $teacher = $this->auth->requireTeacher();
        $event = $this->eigenes($teacher, $params['id']);
        $body = $request->json();
        $name = self::name($body['name'] ?? null);
        $slot = $this->slot($event, $body['slot'] ?? null);
        $this->eintragen($event, $slot['key'], null, $name);
        return Response::json(['event' => $this->payload($this->eigenes($teacher, $params['id']), true)], 201);
    }

    /** @param array<string, string> $params */
    public function unassign(Request $request, array $params): Response
    {
        $teacher = $this->auth->requireTeacher();
        $event = $this->eigenes($teacher, $params['id']);
        $this->db->execute('DELETE FROM termin_bookings WHERE event_id = ? AND slot = ? AND seat = ?', [$event['id'], $params['slot'], (int) $params['seat']]);
        return Response::json(['event' => $this->payload($this->eigenes($teacher, $params['id']), true)]);
    }

    // ------------------------------------------------------------ Ohne Konto: buchen

    /** @param array<string, string> $params */
    public function join(Request $request, array $params): Response
    {
        $this->aufraeumen();
        $event = $this->perCode($params['code']);
        return Response::json(['event' => $this->payload($event, false, self::kennung($request->query('participant'), false))]);
    }

    /** @param array<string, string> $params */
    public function book(Request $request, array $params): Response
    {
        $event = $this->perCode($params['code']);
        $body = $request->json();
        $ich = self::kennung($body['participant'] ?? null, true);
        $name = self::name($body['name'] ?? null);
        $slot = $this->slot($event, $body['slot'] ?? null);
        $this->buchbar($event);
        if ($slot['key'] <= self::jetzt()) {
            throw HttpException::conflict('Dieser Termin liegt schon in der Vergangenheit.');
        }
        $settings = self::dekodiere($event)['settings'];
        $meine = $this->db->fetchOne('SELECT slot FROM termin_bookings WHERE event_id = ? AND participant = ?', [$event['id'], $ich]);
        if ($meine !== null && $meine['slot'] === $slot['key']) {
            return Response::json(['event' => $this->payload($event, false, $ich)]);
        }
        if ($meine !== null && !$settings['umbuchen']) {
            throw HttpException::conflict('Du hast schon einen Termin gebucht. Umbuchen ist hier nicht vorgesehen – wende dich an deine Lehrkraft.');
        }
        $gleich = $this->db->fetchOne(
            'SELECT slot FROM termin_bookings WHERE event_id = ? AND LOWER(name) = LOWER(?) AND (participant IS NULL OR participant <> ?)',
            [$event['id'], $name, $ich],
        );
        if ($gleich !== null) {
            throw HttpException::conflict('Unter diesem Namen ist schon ein Termin gebucht. Wenn das nicht du warst, wende dich an deine Lehrkraft.');
        }
        $this->eintragen($event, $slot['key'], $ich, $name);
        return Response::json(['event' => $this->payload($event, false, $ich)], 201);
    }

    /** @param array<string, string> $params */
    public function cancel(Request $request, array $params): Response
    {
        $event = $this->perCode($params['code']);
        $ich = self::kennung($request->json()['participant'] ?? null, true);
        $this->buchbar($event);
        if (!self::dekodiere($event)['settings']['umbuchen']) {
            throw HttpException::conflict('Stornieren ist hier nicht vorgesehen – wende dich an deine Lehrkraft.');
        }
        $this->db->execute('DELETE FROM termin_bookings WHERE event_id = ? AND participant = ?', [$event['id'], $ich]);
        return Response::json(['event' => $this->payload($event, false, $ich)]);
    }

    // ------------------------------------------------------------ Buchen (gemeinsam)

    /**
     * Trägt eine Buchung ein. Ein freier Platz wird in einer Transaktion gesucht; der Primärschlüssel
     * (event, slot, seat) verhindert Doppelbuchungen, wenn zwei gleichzeitig zugreifen.
     */
    private function eintragen(array $event, string $slot, ?string $ich, string $name): void
    {
        $plaetze = self::dekodiere($event)['settings']['plaetze'];
        for ($versuch = 0; $versuch < 3; $versuch++) {
            try {
                $this->db->transaction(function () use ($event, $slot, $ich, $name, $plaetze): void {
                    if ($ich !== null) {
                        $this->db->execute('DELETE FROM termin_bookings WHERE event_id = ? AND participant = ?', [$event['id'], $ich]);
                    }
                    $belegt = array_map('intval', array_column($this->db->fetchAll('SELECT seat FROM termin_bookings WHERE event_id = ? AND slot = ?', [$event['id'], $slot]), 'seat'));
                    $frei = null;
                    for ($s = 0; $s < $plaetze; $s++) {
                        if (!in_array($s, $belegt, true)) {
                            $frei = $s;
                            break;
                        }
                    }
                    if ($frei === null) {
                        throw HttpException::conflict('Dieser Termin ist leider schon vergeben. Bitte wähle einen anderen.');
                    }
                    $this->db->execute('INSERT INTO termin_bookings (event_id, slot, seat, participant, name, created_at) VALUES (?, ?, ?, ?, ?, ?)',
                        [$event['id'], $slot, $frei, $ich, $name, Database::now()]);
                });
                return;
            } catch (PDOException $e) {
                // Gleichzeitig gebucht: anderer Platz oder Fehlermeldung beim nächsten Versuch
                if ($versuch === 2 || !str_starts_with((string) $e->getCode(), '23')) {
                    throw $e;
                }
            }
        }
    }

    private function buchbar(array $event): void
    {
        if (!(int) $event['is_open']) {
            throw HttpException::conflict('Die Buchung ist geschlossen.');
        }
        $schluss = self::dekodiere($event)['settings']['schluss'];
        if ($schluss !== null && str_replace(['-', 'T', ':'], ['', '-', ''], $schluss) <= self::jetzt()) {
            throw HttpException::conflict('Der Buchungsschluss ist vorbei.');
        }
    }

    // ------------------------------------------------------------ Daten

    /**
     * Prüft und vereinheitlicht die Angaben einer Lehrkraft.
     * @param array<string, mixed> $b
     * @return array{title: string, description: string, settings: array<string, mixed>, periods: list<array<string, string>>, blocked: list<string>, open: bool, lastDay: string}
     */
    public static function pruefe(array $b): array
    {
        $title = trim((string) ($b['title'] ?? ''));
        if ($title === '' || mb_strlen($title) > 200) {
            throw HttpException::badRequest('Bitte gib einen Titel an (höchstens 200 Zeichen).');
        }
        $description = trim((string) ($b['description'] ?? ''));
        if (mb_strlen($description) > 2000) {
            throw HttpException::badRequest('Der Hinweistext ist zu lang (höchstens 2000 Zeichen).');
        }
        $s = is_array($b['settings'] ?? null) ? $b['settings'] : [];
        $zahl = static function (mixed $w, int $min, int $max, string $was): int {
            if (!is_int($w) && !(is_string($w) && ctype_digit($w))) {
                throw HttpException::badRequest("{$was} fehlt.");
            }
            $w = (int) $w;
            if ($w < $min || $w > $max) {
                throw HttpException::badRequest("{$was}: erlaubt sind {$min} bis {$max}.");
            }
            return $w;
        };
        $settings = [
            'dauer' => $zahl($s['dauer'] ?? null, 5, 240, 'Dauer eines Termins (Minuten)'),
            'pause' => $zahl($s['pause'] ?? 0, 0, 120, 'Pause zwischen den Terminen (Minuten)'),
            'plaetze' => $zahl($s['plaetze'] ?? 1, 1, 30, 'Plätze je Termin'),
            'namenSichtbar' => (bool) ($s['namenSichtbar'] ?? false),
            'umbuchen' => (bool) ($s['umbuchen'] ?? true),
            'schluss' => null,
        ];
        if (($s['schluss'] ?? null) !== null && $s['schluss'] !== '') {
            if (!is_string($s['schluss']) || !preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/', $s['schluss']) || !self::gueltigesDatum(substr($s['schluss'], 0, 10)) || self::minuten(substr($s['schluss'], 11)) === null) {
                throw HttpException::badRequest('Der Buchungsschluss ist kein gültiger Zeitpunkt.');
            }
            $settings['schluss'] = $s['schluss'];
        }
        $roh = $b['periods'] ?? null;
        if (!is_array($roh) || !array_is_list($roh) || $roh === []) {
            throw HttpException::badRequest('Bitte gib mindestens einen Zeitraum an.');
        }
        if (count($roh) > self::MAX_ZEITRAEUME) {
            throw HttpException::badRequest('Es sind höchstens ' . self::MAX_ZEITRAEUME . ' Zeiträume möglich.');
        }
        $periods = [];
        foreach ($roh as $i => $p) {
            $nr = $i + 1;
            $datum = is_array($p) ? (string) ($p['datum'] ?? '') : '';
            $von = is_array($p) ? (string) ($p['von'] ?? '') : '';
            $bis = is_array($p) ? (string) ($p['bis'] ?? '') : '';
            if (!self::gueltigesDatum($datum)) {
                throw HttpException::badRequest("Zeitraum {$nr}: Das Datum fehlt oder ist ungültig.");
            }
            $a = self::minuten($von);
            $e = self::minuten($bis);
            if ($a === null || $e === null) {
                throw HttpException::badRequest("Zeitraum {$nr}: Bitte gib Beginn und Ende als Uhrzeit an.");
            }
            if ($e - $a < $settings['dauer']) {
                throw HttpException::badRequest("Zeitraum {$nr}: Er ist kürzer als ein einzelner Termin.");
            }
            $periods[] = ['datum' => $datum, 'von' => $von, 'bis' => $bis];
        }
        usort($periods, static fn (array $x, array $y): int => [$x['datum'], $x['von']] <=> [$y['datum'], $y['von']]);
        for ($i = 1; $i < count($periods); $i++) {
            if ($periods[$i]['datum'] === $periods[$i - 1]['datum'] && $periods[$i]['von'] < $periods[$i - 1]['bis']) {
                throw HttpException::badRequest('Zwei Zeiträume am ' . self::lesbarDatum($periods[$i]['datum']) . ' überschneiden sich.');
            }
        }
        $slots = self::slots($periods, $settings);
        if (count($slots) > self::MAX_SLOTS) {
            throw HttpException::badRequest('Das ergibt zu viele Termine (höchstens ' . self::MAX_SLOTS . ').');
        }
        $keys = array_column($slots, 'key');
        $blocked = array_values(array_unique(array_filter(is_array($b['blocked'] ?? null) ? $b['blocked'] : [], static fn ($k): bool => is_string($k) && in_array($k, $keys, true))));
        return ['title' => $title, 'description' => $description, 'settings' => $settings, 'periods' => $periods, 'blocked' => $blocked,
            'open' => (bool) ($b['open'] ?? true), 'lastDay' => end($periods)['datum']];
    }

    /**
     * Termin-Slots aus Zeiträumen: ab Beginn jeweils Dauer + Pause, solange der Termin noch vor dem Ende fertig ist.
     * (Dieselbe Rechnung steht in apps/werkzeuge/termine/slots.js.)
     * @return list<array{key: string, datum: string, von: string, bis: string}>
     */
    public static function slots(array $periods, array $settings): array
    {
        $slots = [];
        foreach ($periods as $p) {
            $ende = self::minuten($p['bis']);
            for ($t = self::minuten($p['von']); $t + $settings['dauer'] <= $ende; $t += $settings['dauer'] + $settings['pause']) {
                $slots[] = ['key' => str_replace('-', '', $p['datum']) . '-' . str_replace(':', '', self::uhrzeit($t)),
                    'datum' => $p['datum'], 'von' => self::uhrzeit($t), 'bis' => self::uhrzeit($t + $settings['dauer'])];
            }
        }
        return $slots;
    }

    /** @return array<string, mixed> */
    private function payload(array $event, bool $lehrkraft, ?string $ich = null, bool $mitSlots = true): array
    {
        $d = self::dekodiere($event);
        $slots = self::slots($d['periods'], $d['settings']);
        $buchungen = $this->buchungen((int) $event['id']);
        $jetzt = self::jetzt();
        $schluss = $d['settings']['schluss'];
        $offen = (bool) (int) $event['is_open'] && ($schluss === null || str_replace(['-', 'T', ':'], ['', '-', ''], $schluss) > $jetzt);
        $plaetze = $d['settings']['plaetze'];
        $out = [
            'code' => $event['code'], 'title' => $event['title'], 'description' => $event['description'], 'mode' => $event['mode'],
            'settings' => $d['settings'], 'buchbar' => $offen,
            'gebucht' => count($buchungen), 'plaetzeGesamt' => (count($slots) - count($d['blocked'])) * $plaetze,
        ];
        if ($lehrkraft) {
            $out += ['id' => (int) $event['id'], 'periods' => $d['periods'], 'blocked' => $d['blocked'], 'open' => (bool) (int) $event['is_open'],
                'lastDay' => $event['last_day'], 'deletesOn' => (new DateTimeImmutable($event['last_day']))->modify('+' . self::LOESCHEN_NACH_TAGEN . ' days')->format('Y-m-d'),
                'createdAt' => Database::toIso($event['created_at']), 'slotCount' => count($slots)];
        }
        if ($mitSlots) {
            $nachSlot = [];
            foreach ($buchungen as $b) {
                $nachSlot[$b['slot']][] = $b;
            }
            $out['slots'] = array_map(function (array $s) use ($nachSlot, $d, $lehrkraft, $plaetze, $jetzt, $ich): array {
                $hier = $nachSlot[$s['key']] ?? [];
                $slot = $s + ['plaetze' => $plaetze, 'belegt' => count($hier), 'gesperrt' => in_array($s['key'], $d['blocked'], true), 'vorbei' => $s['key'] <= $jetzt];
                if ($lehrkraft) {
                    $slot['buchungen'] = array_map(static fn (array $b): array => ['seat' => (int) $b['seat'], 'name' => $b['name'],
                        'selbst' => $b['participant'] !== null, 'am' => Database::toIso($b['created_at'])], $hier);
                } else {
                    if ($d['settings']['namenSichtbar']) {
                        $slot['namen'] = array_column($hier, 'name');
                    }
                    $slot['meiner'] = $ich !== null && in_array($ich, array_column($hier, 'participant'), true);
                }
                return $slot;
            }, $slots);
            if (!$lehrkraft) {
                $meine = $ich === null ? null : $this->db->fetchOne('SELECT slot, name FROM termin_bookings WHERE event_id = ? AND participant = ?', [$event['id'], $ich]);
                $out['meine'] = $meine === null ? null : ['slot' => $meine['slot'], 'name' => $meine['name']];
            }
        }
        return $out;
    }

    /** @return list<array<string, mixed>> */
    private function buchungen(int $eventId): array
    {
        return $this->db->fetchAll('SELECT slot, seat, participant, name, created_at FROM termin_bookings WHERE event_id = ? ORDER BY slot, seat', [$eventId]);
    }

    /** @return array{settings: array<string, mixed>, periods: list<array<string, string>>, blocked: list<string>} */
    private static function dekodiere(array $event): array
    {
        return ['settings' => json_decode($event['settings'], true), 'periods' => json_decode($event['periods'], true), 'blocked' => json_decode($event['blocked'], true) ?: []];
    }

    private function eigenes(array $teacher, string $id): array
    {
        $event = $this->db->fetchOne('SELECT * FROM termin_events WHERE id = ?', [Validator::positiveInt($id, 'ID')]);
        if ($event === null || (int) $event['teacher_id'] !== (int) $teacher['id']) {
            throw HttpException::notFound('Nicht gefunden.');
        }
        return $event;
    }

    private function perCode(string $code): array
    {
        $event = preg_match('/^\d{6}$/', $code) ? $this->db->fetchOne('SELECT * FROM termin_events WHERE code = ?', [$code]) : null;
        if ($event === null) {
            throw HttpException::notFound('Zu diesem Code gibt es keine Terminbuchung.');
        }
        return $event;
    }

    /** @return array{key: string, datum: string, von: string, bis: string} */
    private function slot(array $event, mixed $key): array
    {
        $d = self::dekodiere($event);
        foreach (self::slots($d['periods'], $d['settings']) as $s) {
            if ($s['key'] === $key) {
                if (in_array($key, $d['blocked'], true)) {
                    throw HttpException::conflict('Dieser Termin ist gesperrt.');
                }
                return $s;
            }
        }
        throw HttpException::badRequest('Diesen Termin gibt es nicht.');
    }

    private function neuerCode(): string
    {
        for ($i = 0; $i < 100; $i++) {
            $code = (string) random_int(100000, 999999);
            $belegt = $this->db->fetchOne('SELECT code FROM termin_events WHERE code = ?', [$code]) !== null
                || $this->db->fetchOne('SELECT code FROM poll_runs WHERE code = ?', [$code]) !== null
                || $this->db->fetchOne('SELECT code FROM rollenspiel_runden WHERE code = ?', [$code]) !== null;
            if (!$belegt) {
                return $code;
            }
        }
        throw HttpException::conflict('Es konnte kein freier Code gefunden werden. Bitte später erneut versuchen.');
    }

    private function aufraeumen(): void
    {
        $grenze = (new DateTimeImmutable('now', new DateTimeZone(self::ZEITZONE)))->modify('-' . self::LOESCHEN_NACH_TAGEN . ' days')->format('Y-m-d');
        $alt = array_column($this->db->fetchAll('SELECT id FROM termin_events WHERE last_day < ?', [$grenze]), 'id');
        foreach ($alt as $id) {
            $this->db->execute('DELETE FROM termin_bookings WHERE event_id = ?', [$id]);
            $this->db->execute('DELETE FROM termin_events WHERE id = ?', [$id]);
        }
    }

    // ------------------------------------------------------------ Hilfen

    /** Jetzt als Slot-Schlüssel (Ortszeit), z. B. „20261110-1530“ – vergleichbar mit Slot-Schlüsseln */
    public static function jetzt(): string
    {
        return (new DateTimeImmutable('now', new DateTimeZone(self::ZEITZONE)))->format('Ymd-Hi');
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

    private static function name(mixed $wert): string
    {
        $name = trim(preg_replace('/\s+/u', ' ', is_string($wert) ? $wert : '') ?? '');
        if (mb_strlen($name) < 2 || mb_strlen($name) > 60) {
            throw HttpException::badRequest('Bitte gib deinen Namen an (2 bis 60 Zeichen).');
        }
        return $name;
    }

    private static function minuten(string $hhmm): ?int
    {
        if (!preg_match('/^([01]\d|2[0-3]):([0-5]\d)$/', $hhmm, $m)) {
            return null;
        }
        return (int) $m[1] * 60 + (int) $m[2];
    }

    private static function uhrzeit(int $minuten): string
    {
        return sprintf('%02d:%02d', intdiv($minuten, 60), $minuten % 60);
    }

    private static function gueltigesDatum(string $datum): bool
    {
        if (!preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $datum, $m)) {
            return false;
        }
        return checkdate((int) $m[2], (int) $m[3], (int) $m[1]) && (int) $m[1] >= 2000 && (int) $m[1] <= 2100;
    }

    private static function lesbarDatum(string $datum): string
    {
        return substr($datum, 8, 2) . '.' . substr($datum, 5, 2) . '.' . substr($datum, 0, 4);
    }

    private static function lesbar(string $slot): string
    {
        return substr($slot, 6, 2) . '.' . substr($slot, 4, 2) . '. um ' . substr($slot, 9, 2) . ':' . substr($slot, 11, 2) . ' Uhr';
    }
}
