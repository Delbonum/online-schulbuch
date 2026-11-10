// Terminbuchung: Rechnungen ohne DOM (testbar). Dieselbe Slot-Rechnung steht im Server (TerminController::slots).
//
// Zeiten sind Ortszeit ohne Zeitzone: Datum „2026-11-13“, Uhrzeit „08:00“, Slot-Schlüssel „20261113-0800“.

export const minuten = (hhmm) => {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(hhmm ?? ''));
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};
export const uhrzeit = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
export const schluessel = (datum, von) => `${datum.replaceAll('-', '')}-${von.replace(':', '')}`;

/** Termin-Slots: ab Beginn jeweils Dauer + Pause, solange der Termin vor dem Ende fertig ist. */
export function slots(periods, { dauer, pause = 0 }) {
  const liste = [];
  const sortiert = [...periods].filter((p) => p.datum && minuten(p.von) !== null && minuten(p.bis) !== null)
    .sort((a, b) => (a.datum + a.von).localeCompare(b.datum + b.von));
  for (const p of sortiert) {
    const ende = minuten(p.bis);
    if (!(dauer > 0)) break;
    for (let t = minuten(p.von); t + dauer <= ende; t += dauer + pause) {
      liste.push({ key: schluessel(p.datum, uhrzeit(t)), datum: p.datum, von: uhrzeit(t), bis: uhrzeit(t + dauer) });
    }
  }
  return liste;
}

/** Prüft die Zeiträume wie der Server; gibt eine Fehlermeldung oder null zurück. */
export function pruefeZeitraeume(periods, { dauer }) {
  if (!periods.length) return 'Bitte gib mindestens einen Zeitraum an.';
  for (const [i, p] of periods.entries()) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(p.datum ?? '')) return `Zeitraum ${i + 1}: Bitte wähle ein Datum.`;
    if (minuten(p.von) === null || minuten(p.bis) === null) return `Zeitraum ${i + 1}: Bitte gib Beginn und Ende an.`;
    if (minuten(p.bis) - minuten(p.von) < dauer) return `Zeitraum ${i + 1}: Er ist kürzer als ein einzelner Termin.`;
  }
  const s = [...periods].sort((a, b) => (a.datum + a.von).localeCompare(b.datum + b.von));
  for (let i = 1; i < s.length; i++) {
    if (s[i].datum === s[i - 1].datum && s[i].von < s[i - 1].bis) return `Zwei Zeiträume am ${datumKurz(s[i].datum)} überschneiden sich.`;
  }
  return null;
}

const TAGE = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const wochentag = (datum) => TAGE[new Date(`${datum}T12:00:00`).getDay()];
export const datumKurz = (datum) => `${datum.slice(8, 10)}.${datum.slice(5, 7)}.${datum.slice(0, 4)}`;
/** „Freitag, 13.11.2026“ */
export const datumLang = (datum) => `${wochentag(datum)}, ${datumKurz(datum)}`;
/** „Fr, 13.11.“ */
export const datumMini = (datum) => `${wochentag(datum).slice(0, 2)}, ${datum.slice(8, 10)}.${datum.slice(5, 7)}.`;
/** „Fr, 13.11.2026, 08:00–08:15 Uhr“ */
export const terminText = (s) => `${wochentag(s.datum).slice(0, 2)}, ${datumKurz(s.datum)}, ${s.von}–${s.bis} Uhr`;
/** Slot-Schlüssel → lesbarer Text */
export function slotAusSchluessel(key, liste) {
  return liste.find((s) => s.key === key) ?? null;
}

/** Slots nach Tagen gruppieren: [{datum, slots}] */
export function nachTagen(liste) {
  const tage = [];
  for (const s of liste) {
    if (tage.at(-1)?.datum !== s.datum) tage.push({ datum: s.datum, slots: [] });
    tage.at(-1).slots.push(s);
  }
  return tage;
}

/** Kalenderdatei (.ics) für einen gebuchten Termin, Ortszeit ohne Zeitzone („floating time“) */
export function ics({ titel, beschreibung = '', slot, kennung = 'termin' }) {
  const zeit = (datum, hhmm) => `${datum.replaceAll('-', '')}T${hhmm.replace(':', '')}00`;
  const text = (t) => String(t).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/[,;]/g, (z) => `\\${z}`);
  const jetzt = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Online-Schulbuch//Terminbuchung//DE', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT',
    `UID:${kennung}-${slot.key}@online-schulbuch.de`, `DTSTAMP:${jetzt}`,
    `DTSTART:${zeit(slot.datum, slot.von)}`, `DTEND:${zeit(slot.datum, slot.bis)}`,
    `SUMMARY:${text(titel)}`, ...(beschreibung ? [`DESCRIPTION:${text(beschreibung)}`] : []),
    'END:VEVENT', 'END:VCALENDAR', ''].join('\r\n');
}

/** Tabelle aller Termine als CSV (Semikolon, für Tabellenkalkulationen mit deutschen Einstellungen) */
export function csv(event) {
  const zelle = (w) => (/[;"\n]/.test(String(w)) ? `"${String(w).replace(/"/g, '""')}"` : String(w));
  const zeilen = [['Datum', 'Wochentag', 'Beginn', 'Ende', 'Platz', 'Name', 'gebucht am', 'Hinweis']];
  for (const s of event.slots) {
    for (let platz = 0; platz < s.plaetze; platz++) {
      const b = s.buchungen.find((x) => x.seat === platz);
      zeilen.push([datumKurz(s.datum), wochentag(s.datum), s.von, s.bis, platz + 1, b?.name ?? '',
        b ? new Date(b.am).toLocaleString('de-DE') : '', s.gesperrt ? 'gesperrt' : b && !b.selbst ? 'von der Lehrkraft eingetragen' : '']);
    }
  }
  return `\uFEFF${zeilen.map((z) => z.map(zelle).join(';')).join('\r\n')}\r\n`;
}
