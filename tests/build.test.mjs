// Prüft den Seitengenerator: Build läuft, alle Seiten sind vollständig, alte Adressen werden umgeleitet.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
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

test.after(() => rmSync(OUT, { recursive: true, force: true }));
