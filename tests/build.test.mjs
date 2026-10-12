// Prüft den Seitengenerator: Build läuft, alle Seiten sind vollständig, alte Adressen werden umgeleitet.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { pbkdf2Sync, createDecipheriv } from 'node:crypto';
import { readFileSync, readdirSync, statSync, existsSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ZIEL = 'dist-test';
const OUT = join(ROOT, ZIEL);

function alleDateien(ordner, endung) {
  return readdirSync(ordner).flatMap((n) => {
    const p = join(ordner, n);
    return statSync(p).isDirectory() ? alleDateien(p, endung) : p.endsWith(endung) ? [p] : [];
  });
}

test('Vorschau-Build läuft fehlerfrei durch', () => {
  execFileSync(process.execPath, ['scripts/build.mjs', '--basis=vorschau', `--ziel=${ZIEL}`], { cwd: ROOT, stdio: 'pipe' });
  assert.ok(existsSync(join(OUT, 'index.html')));
});

test('Jede Seite hat Titel, Überschrift und gültige interne Verweise', () => {
  const seiten = alleDateien(OUT, '.html');
  assert.ok(seiten.length > 40, `nur ${seiten.length} Seiten`);
  for (const datei of seiten) {
    const html = readFileSync(datei, 'utf8');
    assert.match(html, /<title>[^<]+<\/title>/, datei);
    assert.match(html, /<h1[^>]*>/, datei);
    assert.match(html, /name="robots" content="noindex/, `Vorschau muss noindex sein: ${datei}`);
    for (const [, pfad] of html.matchAll(/(?:href|src)="(\/vorschau\/[^"#?]*)"/g)) {
      const ziel = join(OUT, pfad.replace('/vorschau/', ''));
      const ok = pfad.endsWith('/') ? existsSync(join(ziel, 'index.html')) : existsSync(ziel);
      assert.ok(ok, `Verweis ins Leere: ${pfad} in ${datei}`);
    }
  }
});

test('Suchindex enthält alle Epochen', () => {
  const index = JSON.parse(readFileSync(join(OUT, 'suche.json'), 'utf8'));
  const titel = new Set(index.map((e) => e.t));
  for (const t of ['Romantik', 'Barock', 'Exilliteratur', 'Tic Tac Toe', 'Zahlensysteme üben']) assert.ok(titel.has(t), t);
});

test('Jede Seite der alten Baukasten-Version hat eine neue Adresse', () => {
  // Alle Ordner der alten Seite (Stand 19.09.2026) außer der alten Startseite /deutsch
  const alt = ['textgattungen', 'grossgattungen', 'literaturepochen', 'Antike', '750-1805', '750Mittelalter', '1470HumRen',
    '1600Barock', '1720Aufklaerung', '1765SturmDrang', '1786WeimarerKlassik', '1795-1925', '1795Romantik',
    '8715-biedermeier', '1825JungesDE', '1850Vormaerz', '1850Realismus', '1880Naturalismus', '1890Impressionismus',
    '1890Moderne', '1910Expressionismus', '1915-heute', '1919AvanDada', '1918WeimarRep', '1933Exilliteratur',
    '1945Nachkriegsliteratur', '1950BRD', '1950DDR', '1970NeuSub', '1980PostmoderneGegenwart', 'ueberblick', 'zeitstrahl'];
  const eingetragen = new Set(alleDateien(join(ROOT, 'content'), '.html')
    .flatMap((d) => [...readFileSync(d, 'utf8').matchAll(/^alt: (.+)$/gm)].flatMap((m) => m[1].split(/\s*,\s*/))));
  for (const a of alt) assert.ok(eingetragen.has(`/${a}`), `keine Weiterleitung für /${a}`);
  assert.ok(eingetragen.has('/informatik/zahlensystemumstellung.html'));
});

test('Lektüren: Ordner-Einträge erzeugen verschachtelte Adressen', () => {
  const basis = join(OUT, 'deutsch', 'lektueren', 'brecht', 'der-gute-mensch-von-sezuan');
  assert.ok(existsSync(join(OUT, 'deutsch', 'lektueren', 'brecht', 'index.html')));
  assert.ok(existsSync(join(basis, 'index.html')));
  assert.ok(existsSync(join(basis, 'vorspiel', 'index.html')));
  const html = readFileSync(join(basis, 'vorspiel', 'index.html'), 'utf8');
  assert.match(html, /assets\/werkzeuge\/arbeitsblatt\/arbeitsblatt\.js/, 'Arbeitsblatt-Skript wird automatisch eingebunden');
});

test('Kacheln nur auf Start- und Fachseiten, innerhalb von Kapiteln nur Listen', () => {
  const buchseiten = alleDateien(OUT, '.html').filter((d) => /<div class="buch[ "]/.test(readFileSync(d, 'utf8')));
  assert.ok(buchseiten.length > 40);
  for (const datei of buchseiten) assert.doesNotMatch(readFileSync(datei, 'utf8'), /class="kacheln/, `Kacheln innerhalb eines Kapitels: ${datei}`);
  const lektueren = readFileSync(join(OUT, 'deutsch', 'lektueren', 'index.html'), 'utf8');
  assert.match(lektueren, /<ol class="liste-seiten">/);
  assert.match(readFileSync(join(OUT, 'deutsch', 'index.html'), 'utf8'), /class="kacheln/);
});

test('Inhalte für Lehrkräfte stehen ohne Passwort nicht in der Vorschau und nicht im Suchindex', () => {
  const html = readFileSync(join(OUT, 'deutsch', 'lektueren', 'brecht', 'der-gute-mensch-von-sezuan', 'lehrkraefte', 'index.html'), 'utf8');
  assert.doesNotMatch(html, /Leitfrage der Reihe/);
  assert.doesNotMatch(html, /<lehrkraft/);
  assert.doesNotMatch(readFileSync(join(OUT, 'suche.json'), 'utf8'), /Erwartungshorizont/);
});

test('Mit Passwort werden Lehrkraft-Inhalte verschlüsselt und lassen sich entschlüsseln', () => {
  const ziel = 'dist-test-lk';
  execFileSync(process.execPath, ['scripts/build.mjs', '--basis=vorschau', `--ziel=${ziel}`], {
    cwd: ROOT, stdio: 'pipe', env: { ...process.env, LEHRKRAFT_PASSWORT: 'geheim' },
  });
  try {
    const html = readFileSync(join(ROOT, ziel, 'deutsch', 'lektueren', 'brecht', 'der-gute-mensch-von-sezuan', 'lehrkraefte', 'index.html'), 'utf8');
    assert.doesNotMatch(html, /Leitfrage der Reihe/, 'Klartext darf nicht in der Seite stehen');
    assert.match(html, /class="kopf-knopf lk-schalter" role="switch"/, 'Schalter für die Lehrkraft-Ansicht im Kopf');
    const [, salz, runden] = html.match(/data-lk-salz="([^"]+)" data-lk-runden="(\d+)"/);
    const [, wert] = html.match(/data-lk="([^"]+)"/);
    const schluessel = pbkdf2Sync('geheim', salz, Number(runden), 32, 'sha256');
    const [iv, daten] = wert.split('.').map((t) => Buffer.from(t, 'base64'));
    const d = createDecipheriv('aes-256-gcm', schluessel, iv);
    d.setAuthTag(daten.subarray(-16));
    const klar = Buffer.concat([d.update(daten.subarray(0, -16)), d.final()]).toString('utf8');
    assert.match(klar, /Leitfrage der Reihe/);
  } finally {
    rmSync(join(ROOT, ziel), { recursive: true, force: true });
  }
});

test('Live-Build bricht ohne Lehrkraft-Passwort ab', () => {
  const env = { ...process.env };
  delete env.LEHRKRAFT_PASSWORT;
  const r = spawnSync(process.execPath, ['scripts/build.mjs', '--ziel=dist-test-live'], { cwd: ROOT, env, encoding: 'utf8' });
  rmSync(join(ROOT, 'dist-test-live'), { recursive: true, force: true });
  if (existsSync(join(ROOT, '.lehrkraft-passwort'))) return; // lokal mit Passwortdatei: nichts zu prüfen
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /kein Passwort/);
});

test.after(() => rmSync(OUT, { recursive: true, force: true }));
