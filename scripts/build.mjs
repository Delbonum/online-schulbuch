// Baut das Online-Schulbuch aus content/ und site/ nach dist/.
//
//   node scripts/build.mjs                    → dist/ für https://online-schulbuch.de/
//   node scripts/build.mjs --basis=/vorschau/ → Vorschau unter einem Unterordner (noindex)
//
// Aufbau eines Fachs: content/<fach>/kapitel.json legt Reihenfolge, Titel und URLs fest.
// Jede Seite ist ein HTML-Fragment unter content/<fach>/<kapitel>/<seite>.html
// (Kapitelseite: content/<fach>/<kapitel>/index.html). Optional steht am Dateianfang ein
// Kopfkommentar mit Angaben wie „alt: /alte-url“, „layout: breit“ oder „skripte: …“.

import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { icon } from './icons.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = join(ROOT, 'content');

const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const [k, v] = a.replace(/^--/, '').split('=');
  return [k, v ?? true];
}));
const BASIS = normBasis(args.basis ?? '/');
const VORSCHAU = BASIS !== '/';
const ZIEL = join(ROOT, args.ziel ?? 'dist');

function normBasis(b) {
  let s = String(b);
  if (!s.startsWith('/')) s = `/${s}`;
  if (!s.endsWith('/')) s += '/';
  return s;
}

const site = JSON.parse(readFileSync(join(CONTENT, 'site.json'), 'utf8'));
const fehler = [];
const warnungen = [];

// ------------------------------------------------------------------ Hilfen

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// Eigenständige Apps (z. B. das KryptoGAME) liegen immer unter ihrer echten Adresse – auch in der Vorschau.
const EIGENSTAENDIG = site.eigenstaendig ?? [];
const u = (pfad) => {
  if (/^[a-z]+:/i.test(pfad) || EIGENSTAENDIG.some((e) => `/${pfad.replace(/^\//, '')}`.startsWith(e))) return pfad;
  return BASIS + pfad.replace(/^\//, '');
};

function leseFragment(datei) {
  const roh = readFileSync(datei, 'utf8');
  const meta = {};
  let inhalt = roh;
  const m = roh.match(/^<!--\n([\s\S]*?)\n-->\n?/);
  if (m) {
    for (const zeile of m[1].split('\n')) {
      const kv = zeile.match(/^([\w-]+):\s*(.*)$/);
      if (kv) meta[kv[1]] = kv[2].trim();
    }
    inhalt = roh.slice(m[0].length);
  }
  return { meta, inhalt: inhalt.trim() };
}

function klartext(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

// ------------------------------------------------------------------ Struktur einlesen

const faecher = site.faecher.map((slug) => {
  const cfg = JSON.parse(readFileSync(join(CONTENT, slug, 'kapitel.json'), 'utf8'));
  return { slug, ...cfg, url: `/${slug}/` };
});

const seiten = []; // alle Buchseiten
const nachUrl = new Map();

for (const fach of faecher) {
  for (const kap of fach.kapitel) {
    kap.url = `/${fach.slug}/${kap.slug}/`;
    kap.fach = fach;
    if (kap.geplant) continue;
    const kette = [];
    const besuche = (knoten, eltern) => {
      knoten.fach = fach;
      knoten.kapitel = kap;
      knoten.eltern = eltern;
      if (knoten.extern) {
        knoten.url = knoten.extern;
        return;
      }
      const istKapitel = knoten === kap;
      knoten.url = istKapitel ? kap.url : `${kap.url}${knoten.slug}/`;
      const datei = join(CONTENT, fach.slug, kap.slug, istKapitel ? 'index.html' : `${knoten.slug}.html`);
      if (!existsSync(datei)) {
        fehler.push(`Inhaltsdatei fehlt: ${datei.slice(ROOT.length + 1)}`);
      } else {
        const { meta, inhalt } = leseFragment(datei);
        const seite = { typ: 'buch', knoten, fach, kap, meta, inhalt, url: knoten.url, datei };
        knoten.seite = seite;
        if (nachUrl.has(seite.url)) fehler.push(`Doppelte URL: ${seite.url}`);
        nachUrl.set(seite.url, seite);
        seiten.push(seite);
        if (!knoten.entwurf) kette.push(seite);
      }
      for (const kind of knoten.seiten ?? []) besuche(kind, [...eltern, knoten]);
    };
    besuche(kap, []);
    kette.forEach((s, i) => { s.zurueck = kette[i - 1]; s.weiter = kette[i + 1]; });
  }
}

// Inhaltsdateien, die in keiner kapitel.json vorkommen
for (const fach of faecher) {
  const bekannt = new Set(seiten.filter((s) => s.fach === fach).map((s) => s.datei));
  const suche = (ordner) => {
    for (const name of readdirSync(ordner)) {
      const pfad = join(ordner, name);
      if (statSync(pfad).isDirectory()) suche(pfad);
      else if (name.endsWith('.html') && !bekannt.has(pfad) && pfad !== join(CONTENT, fach.slug, 'index.html')) {
        warnungen.push(`Nicht verlinkt (fehlt in kapitel.json): ${pfad.slice(ROOT.length + 1)}`);
      }
    }
  };
  suche(join(CONTENT, fach.slug));
}

const zaehleSeiten = (knoten) => (knoten.seite && !knoten.entwurf ? 1 : 0) + (knoten.seiten ?? []).reduce((a, k) => a + zaehleSeiten(k), 0);

// ------------------------------------------------------------------ Inhalte umwandeln

const BOX = {
  hinweis: ['hinweis', 'Hinweis'],
  aufgabe: ['aufgabe', 'Aufgabe'],
  tipp: ['hinweis', 'Tipp'],
  merke: ['hinweis', 'Merke'],
};

function wandle(html, quelle) {
  let s = html;
  // Kästen bekommen eine Überschrift mit Symbol
  s = s.replace(/<aside class="box (\w+)">/g, (m, art) => {
    const [ic, titel] = BOX[art] ?? ['hinweis', art];
    return `<aside class="box ${art}"><p class="box-titel">${icon(ic)}${titel}</p>`;
  });
  // Externe Einbettungen erst nach Klick laden (Datenschutz)
  s = s.replace(/<div class="einbettung" data-src="([^"]+)" data-anbieter="([^"]+)"><\/div>/g, (m, src, anbieter) => {
    const host = new URL(src.replace(/&amp;/g, '&')).hostname;
    return `<figure class="einbettung" data-src="${src}">
<div class="einbettung-hinweis">
<p><strong>Interaktive Übung von ${esc(anbieter)}</strong></p>
<p class="klein">Die Übung wird von <em>${esc(host)}</em> geladen. Erst wenn du auf „Übung laden“ klickst, wird eine Verbindung zu diesem Anbieter hergestellt.</p>
<p><button type="button" class="knopf primaer" data-einbettung-laden>Übung laden</button> <a href="${src}" target="_blank" rel="noopener">in neuem Tab öffnen ${icon('extern', 'icon klein')}</a></p>
</div>
</figure>`;
  });
  // Platzhalter, die vor der Veröffentlichung ausgefüllt werden müssen
  if (!VORSCHAU && s.includes('class="todo"')) fehler.push(`Offene Platzhalter (<mark class="todo">) in ${quelle}`);
  // Seiteninterne Links und Quellen an den Basispfad anpassen
  s = s.replace(/(href|src)="\/(?!\/)([^"]*)"/g, (m, attr, pfad) => {
    const ziel = `/${pfad}`.split('#')[0];
    if (attr === 'href' && ziel.endsWith('/') && !nachUrl.has(ziel) && !statischeUrls.has(ziel)) {
      fehler.push(`Toter Link ${ziel} in ${quelle}`);
    }
    return `${attr}="${u(pfad)}"`;
  });
  return s;
}

// Seiten außerhalb der Fächer (Impressum usw.) und Werkzeug-Ordner, auf die Links zeigen dürfen
const statischeUrls = new Set(['/', '/impressum/', '/datenschutz/', '/lizenz/', '/informatik/kryptogame/', ...faecher.map((f) => f.url)]);

// ------------------------------------------------------------------ Bausteine

function kopf({ titel, beschreibung, url, noindex, stile = [], skripte = [] }) {
  const volltitel = titel ? `${titel} – ${site.titel}` : site.titel;
  const robots = VORSCHAU || noindex ? '<meta name="robots" content="noindex, nofollow">' : '';
  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(volltitel)}</title>
<meta name="description" content="${esc(beschreibung ?? site.beschreibung)}">
${robots}
<link rel="canonical" href="${site.domain}${url}">
<meta property="og:title" content="${esc(volltitel)}">
<meta property="og:type" content="website">
<meta property="og:locale" content="de_DE">
<meta name="theme-color" content="#5b3cc4">
<link rel="icon" href="${u('assets/img/logo.svg')}" type="image/svg+xml">
<link rel="stylesheet" href="${u('assets/css/schulbuch.css')}">
${stile.map((st) => `<link rel="stylesheet" href="${u(st)}">`).join('\n')}
<script>document.documentElement.classList.add('js')</script>
<script src="${u('assets/js/schulbuch.js')}" defer></script>
${skripte.map((sk) => `<script type="module" src="${u(sk)}"></script>`).join('\n')}
</head>`;
}

function kopfleiste({ fach, mitMenue }) {
  const faecherNav = faecher.map((f) => `<a href="${u(f.url)}"${fach === f ? ' aria-current="true"' : ''}>${esc(f.titel)}</a>`).join('');
  return `<a class="sprung" href="#inhalt">Zum Inhalt springen</a>
${VORSCHAU ? '<div class="vorschau-band">Vorschau – diese Seiten sind noch nicht öffentlich verlinkt.</div>' : ''}
<header class="kopf">
<div class="kopf-innen">
${mitMenue ? `<button type="button" class="kopf-knopf menue-knopf" aria-controls="seitenleiste" aria-expanded="false">${icon('menue')}<span>Inhalt</span></button>` : ''}
<a class="marke" href="${u('/')}"><img src="${u('assets/img/logo.svg')}" alt="" width="32" height="32"><span>${esc(site.titel)}</span></a>
<nav class="faecher-nav" aria-label="Fächer">${faecherNav}</nav>
<button type="button" class="kopf-knopf suche-knopf" data-suche-oeffnen aria-label="Suchen">${icon('suche')}<span>Suchen</span><kbd>/</kbd></button>
</div>
</header>`;
}

function fuss() {
  return `<footer class="fuss">
<div class="fuss-innen">
<p><img src="${u('assets/img/logo.svg')}" alt="" width="20" height="20"> ${esc(site.titel)} von ${esc(site.autor)} · Inhalte unter <a href="${u('/lizenz/')}">${esc(site.lizenz.name)}</a></p>
<nav aria-label="Rechtliches"><a href="${u('/impressum/')}">Impressum</a><a href="${u('/datenschutz/')}">Datenschutz</a><a href="${u('/lizenz/')}">Lizenz</a></nav>
</div>
</footer>
<dialog class="suche" aria-label="Suche">
<form method="dialog" class="suche-form" role="search">
${icon('suche')}
<input type="search" name="q" placeholder="Im Schulbuch suchen …" autocomplete="off" aria-label="Suchbegriff">
<button type="submit" class="kopf-knopf" aria-label="Suche schließen">${icon('schliessen')}</button>
</form>
<div class="suche-treffer" aria-live="polite"></div>
</dialog>
<script>window.SCHULBUCH_BASIS=${JSON.stringify(BASIS)}</script>
</body>
</html>
`;
}

function menueEintrag(knoten, aktuell) {
  const kinder = knoten.seiten ?? [];
  const aktiv = knoten.seite && knoten.seite === aktuell;
  const enthaelt = (k) => k.seite === aktuell || (k.seiten ?? []).some(enthaelt);
  const offen = enthaelt(knoten);
  const label = esc(knoten.kurz ?? knoten.titel);
  const zeit = knoten.zeitraum ? `<span class="nav-zeit">${esc(knoten.zeitraum)}</span>` : '';
  let link;
  if (knoten.geplant) link = `<span class="nav-link geplant">${label}<span class="abzeichen">bald</span></span>`;
  else if (knoten.extern) link = `<a class="nav-link" href="${u(knoten.url)}" target="_blank" rel="noopener">${label} ${icon('extern', 'icon klein')}<span class="sr">(öffnet in neuem Tab)</span></a>`;
  else link = `<a class="nav-link" href="${u(knoten.url)}"${aktiv ? ' aria-current="page"' : ''}>${label}${zeit}</a>`;
  const sichtbar = kinder.filter((k) => !k.entwurf || k.seite === aktuell);
  if (!sichtbar.length) return `<li>${link}</li>`;
  return `<li class="gruppe${offen ? ' offen' : ''}"><div class="nav-zeile">${link}<button type="button" class="nav-auf" aria-expanded="${offen}" aria-label="${label} auf- oder zuklappen">${icon('chevron', 'icon klein')}</button></div>
<ul>${sichtbar.map((k) => menueEintrag(k, aktuell)).join('')}</ul></li>`;
}

function seitenleiste(fach, aktuell) {
  return `<nav id="seitenleiste" class="seitenleiste" aria-label="Inhalt ${esc(fach.titel)}">
<div class="seitenleiste-innen">
<a class="nav-fach" href="${u(fach.url)}">${icon(fach.icon)}${esc(fach.titel)}</a>
<ul class="nav-baum">${fach.kapitel.map((k) => menueEintrag(k, aktuell)).join('')}</ul>
</div>
</nav>`;
}

function brotkrumen(seite) {
  const teile = [{ titel: seite.fach.titel, url: seite.fach.url }];
  for (const e of seite.knoten.eltern) teile.push({ titel: e.kurz ?? e.titel, url: e.url });
  return `<nav class="brotkrumen" aria-label="Du bist hier"><ol>${teile.map((t) => `<li><a href="${u(t.url)}">${esc(t.titel)}</a></li>`).join('')}<li aria-current="page">${esc(seite.knoten.kurz ?? seite.knoten.titel)}</li></ol></nav>`;
}

function kachel(knoten, { thema } = {}) {
  const titel = esc(knoten.lang ?? knoten.titel);
  const besch = knoten.beschreibung ? `<p>${esc(knoten.beschreibung)}</p>` : '';
  const anzahl = knoten.seiten?.length && !knoten.geplant ? zaehleSeiten(knoten) - (knoten.seite ? 1 : 0) : 0;
  const meta = [];
  if (knoten.zeitraum && !knoten.lang) meta.push(esc(knoten.zeitraum));
  if (anzahl) meta.push(`${anzahl} ${anzahl === 1 ? 'Seite' : 'Seiten'}`);
  if (thema) meta.push(esc(thema));
  if (knoten.beta) meta.push('Beta');
  const ic = knoten.icon ? `<span class="kachel-icon">${icon(knoten.icon)}</span>` : '';
  const fuss = meta.length ? `<p class="kachel-meta">${meta.join(' · ')}</p>` : '';
  if (knoten.geplant) {
    return `<div class="kachel geplant">${ic}<h3>${titel}</h3>${besch}<p class="kachel-meta"><span class="abzeichen">in Vorbereitung</span></p></div>`;
  }
  if (knoten.extern) {
    return `<a class="kachel" href="${u(knoten.url)}" target="_blank" rel="noopener">${ic}<h3>${titel} ${icon('extern', 'icon klein')}</h3>${besch}<p class="kachel-meta">${meta.concat('öffnet in neuem Tab').join(' · ')}</p></a>`;
  }
  return `<a class="kachel" href="${u(knoten.url)}">${ic}<h3>${titel}</h3>${besch}${fuss}</a>`;
}

function unterseiten(knoten) {
  const kinder = (knoten.seiten ?? []).filter((k) => !k.entwurf);
  if (!kinder.length) return '';
  const themen = new Map(faecher.flatMap((f) => f.kapitel.map((k) => [k.slug, k.kurz ?? k.titel])));
  if (kinder.some((k) => k.beschreibung)) {
    return `<section class="unterseiten" aria-label="In diesem Kapitel"><div class="kacheln">${kinder.map((k) => kachel(k, { thema: themen.get(k.thema) })).join('')}</div></section>`;
  }
  return `<section class="unterseiten" aria-label="In diesem Kapitel"><h2 class="unterseiten-titel">In diesem Kapitel</h2><ol class="liste-seiten">${kinder.map((k) => `<li><a href="${u(k.url)}"><span>${esc(k.lang ?? k.titel)}</span>${k.zeitraum && !k.lang ? `<span class="nav-zeit">${esc(k.zeitraum)}</span>` : ''}</a></li>`).join('')}</ol></section>`;
}

function blaettern(seite) {
  const z = seite.zurueck;
  const w = seite.weiter;
  if (!z && !w) return '';
  const karte = (s, richtung) => `<a class="blatt ${richtung}" href="${u(s.url)}" rel="${richtung === 'zurueck' ? 'prev' : 'next'}"><span class="blatt-richtung">${richtung === 'zurueck' ? `${icon('pfeilLinks', 'icon klein')} Zurück` : `Weiter ${icon('pfeilRechts', 'icon klein')}`}</span><span class="blatt-titel">${esc(s.knoten.kurz ?? s.knoten.titel)}</span></a>`;
  return `<nav class="blaettern" aria-label="Blättern">${z ? karte(z, 'zurueck') : '<span></span>'}${w ? karte(w, 'weiter') : ''}</nav>`;
}

// ------------------------------------------------------------------ Seitentypen

function buchseite(seite) {
  const { knoten, fach, meta } = seite;
  const breit = meta.layout === 'breit';
  const dach = [];
  const block = knoten.eltern[knoten.eltern.length - 1];
  if (block && block !== seite.kap) dach.push(block.kurz ?? block.titel);
  else if (knoten !== seite.kap) dach.push(seite.kap.kurz ?? seite.kap.titel);
  if (knoten.zeitraum) dach.push(knoten.zeitraum);
  const stile = meta.stile ? meta.stile.split(/\s*,\s*/) : [];
  const skripte = meta.skripte ? meta.skripte.split(/\s*,\s*/) : [];
  const titel = knoten.lang ?? knoten.titel;
  return `${kopf({ titel: `${knoten.kurz ?? knoten.titel} – ${fach.titel}`, beschreibung: meta.beschreibung ?? knoten.beschreibung, url: seite.url, noindex: knoten.entwurf, stile, skripte })}
<body class="fach-${fach.slug}">
${kopfleiste({ fach, mitMenue: true })}
<div class="buch${breit ? ' breit' : ''}">
${seitenleiste(fach, seite)}
<main id="inhalt" class="haupt">
${brotkrumen(seite)}
<header class="seitenkopf">
${dach.length ? `<p class="dachzeile">${dach.map(esc).join(' · ')}</p>` : ''}
<h1>${esc(titel)}${knoten.beta ? ' <span class="abzeichen">Beta</span>' : ''}</h1>
</header>
<div class="${breit ? 'breit-inhalt' : 'text'}">
${wandle(seite.inhalt, seite.datei)}
</div>
${meta.unterseiten === 'nein' ? '' : unterseiten(knoten)}
${blaettern(seite)}
</main>
</div>
${fuss()}`;
}

function fachseite(fach) {
  const datei = join(CONTENT, fach.slug, 'index.html');
  const intro = existsSync(datei) ? wandle(leseFragment(datei).inhalt, datei) : '';
  return `${kopf({ titel: fach.titel, beschreibung: fach.beschreibung, url: fach.url })}
<body class="fach-${fach.slug}">
${kopfleiste({ fach })}
<main id="inhalt" class="breit-seite">
<header class="held fach-held">
<span class="held-icon">${icon(fach.icon)}</span>
<div><h1>${esc(fach.titel)}</h1><p>${esc(fach.beschreibung)}</p></div>
</header>
${intro ? `<div class="text">${intro}</div>` : ''}
<div class="kacheln">${fach.kapitel.map((k) => kachel(k)).join('')}</div>
</main>
${fuss()}`;
}

function startseite() {
  const datei = join(CONTENT, 'index.html');
  const intro = existsSync(datei) ? wandle(leseFragment(datei).inhalt, datei) : '';
  const fachKachel = (f) => {
    const offen = f.kapitel.filter((k) => !k.geplant);
    const n = offen.reduce((a, k) => a + zaehleSeiten(k), 0);
    return `<a class="kachel fach-kachel fach-${f.slug}" href="${u(f.url)}"><span class="kachel-icon">${icon(f.icon)}</span><h2>${esc(f.titel)}</h2><p>${esc(f.beschreibung)}</p><p class="kachel-meta">${offen.length} ${offen.length === 1 ? 'Kapitel' : 'Kapitel'} · ${n} Seiten</p></a>`;
  };
  return `${kopf({ url: '/' })}
<body class="start">
${kopfleiste({})}
<main id="inhalt" class="breit-seite">
<header class="held start-held">
<img src="${u('assets/img/logo.svg')}" alt="" width="88" height="88">
<div><h1>${esc(site.titel)}</h1><p>${esc(site.beschreibung)}</p></div>
</header>
<section aria-label="Fächer"><div class="kacheln faecher-kacheln">${faecher.map(fachKachel).join('')}</div></section>
${intro ? `<div class="text">${intro}</div>` : ''}
</main>
${fuss()}`;
}

function einfacheSeite({ titel, inhalt, url, quelle, noindex }) {
  return `${kopf({ titel, url, noindex })}
<body>
${kopfleiste({})}
<main id="inhalt" class="breit-seite schmal">
<header class="seitenkopf"><h1>${esc(titel)}</h1></header>
<div class="text">${wandle(inhalt, quelle)}</div>
</main>
${fuss()}`;
}

// ------------------------------------------------------------------ Schreiben

function schreibe(pfad, html) {
  const ziel = join(ZIEL, pfad.replace(/^\//, ''), pfad.endsWith('/') ? 'index.html' : '');
  mkdirSync(dirname(ziel), { recursive: true });
  writeFileSync(ziel, html);
}

rmSync(ZIEL, { recursive: true, force: true });
mkdirSync(ZIEL, { recursive: true });
cpSync(join(ROOT, 'site'), ZIEL, { recursive: true });

// Werkzeuge aus apps/ einbinden
const APPS = [
  ['apps/ki-lernspiele/assets/js', 'assets/werkzeuge/ki-lernspiele/js'],
  ['apps/ki-lernspiele/assets/css', 'assets/werkzeuge/ki-lernspiele/css'],
  ['apps/werkzeuge', 'assets/werkzeuge'],
];
for (const [von, nach] of APPS) {
  if (!existsSync(join(ROOT, von))) { fehler.push(`Werkzeug-Ordner fehlt: ${von}`); continue; }
  cpSync(join(ROOT, von), join(ZIEL, nach), { recursive: true, filter: (p) => !/[\\/](tests?|README\.md)$/.test(p) });
}

schreibe('/', startseite());
for (const fach of faecher) schreibe(fach.url, fachseite(fach));
for (const seite of seiten) schreibe(seite.url, buchseite(seite));

const EINFACH = [
  ['impressum', 'Impressum'],
  ['datenschutz', 'Datenschutzerklärung'],
  ['lizenz', 'Lizenz'],
];
for (const [slug, titel] of EINFACH) {
  const datei = join(CONTENT, 'seiten', `${slug}.html`);
  if (!existsSync(datei)) { fehler.push(`Seite fehlt: content/seiten/${slug}.html`); continue; }
  schreibe(`/${slug}/`, einfacheSeite({ titel, inhalt: leseFragment(datei).inhalt, url: `/${slug}/`, quelle: datei }));
}
writeFileSync(join(ZIEL, '404.html'), einfacheSeite({
  titel: 'Seite nicht gefunden',
  url: '/404.html',
  noindex: true,
  quelle: '404',
  inhalt: `<p>Diese Seite gibt es (nicht mehr). Vielleicht hilft dir die Suche weiter – oder du startest auf der <a href="/">Startseite</a>.</p>`,
}));

// Suchindex
const index = [
  ...faecher.map((f) => ({ t: f.titel, u: u(f.url), f: f.titel, k: 'Fach', x: f.beschreibung })),
  ...seiten.filter((s) => !s.knoten.entwurf).map((s) => ({
    t: s.knoten.lang ?? s.knoten.titel,
    u: u(s.url),
    f: s.fach.titel,
    k: [s.kap !== s.knoten ? (s.kap.kurz ?? s.kap.titel) : null, s.knoten.zeitraum].filter(Boolean).join(' · '),
    x: klartext(s.inhalt).slice(0, 6000),
  })),
];
writeFileSync(join(ZIEL, 'suche.json'), JSON.stringify(index));

// Sitemap, robots.txt und Weiterleitungen (nur für die echte Seite)
if (!VORSCHAU) {
  const urls = ['/', ...faecher.map((f) => f.url), ...seiten.filter((s) => !s.knoten.entwurf).map((s) => s.url), '/impressum/', '/datenschutz/', '/lizenz/'];
  writeFileSync(join(ZIEL, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((p) => `<url><loc>${site.domain}${p}</loc></url>`).join('\n')}
</urlset>
`);
  writeFileSync(join(ZIEL, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${site.domain}/sitemap.xml\n`);

  const weiter = [];
  for (const s of seiten) {
    for (const alt of (s.meta.alt ?? '').split(/\s*,\s*/).filter(Boolean)) weiter.push([alt, s.url]);
  }
  const extra = JSON.parse(readFileSync(join(CONTENT, 'weiterleitungen.json'), 'utf8'));
  const htaccess = [
    '# Automatisch erzeugt von scripts/build.mjs – Änderungen in content/ vornehmen.',
    'DirectoryIndex index.html',
    'ErrorDocument 404 /404.html',
    '',
    '# Alte Adressen (Baukasten-Version) auf die neue Struktur umleiten',
    ...weiter.map(([alt, neu]) => `RedirectMatch 301 ^${alt.replace(/[.+?^${}()|[\]\\]/g, '\\$&')}/?$ ${neu}`),
    ...(extra.umleiten ?? []).map(([alt, neu]) => `RedirectMatch 301 ^${alt.replace(/[.+?^${}()|[\]\\]/g, '\\$&')}$ ${neu}`),
    ...(extra.entfernt ?? []).map((alt) => `Redirect gone ${alt}`),
    '',
    '# Kurze Zwischenspeicherung für Stile und Skripte (Dateinamen enthalten keine Versionsnummer)',
    '<IfModule mod_expires.c>',
    '  ExpiresActive On',
    '  ExpiresByType text/css "access plus 1 hour"',
    '  ExpiresByType text/javascript "access plus 1 hour"',
    '  ExpiresByType application/javascript "access plus 1 hour"',
    '  ExpiresByType image/svg+xml "access plus 1 week"',
    '</IfModule>',
    '',
  ].join('\n');
  writeFileSync(join(ZIEL, '.htaccess'), htaccess);
}

for (const w of warnungen) console.warn(`Warnung: ${w}`);
if (fehler.length) {
  for (const f of fehler) console.error(`Fehler: ${f}`);
  process.exit(1);
}
console.log(`Fertig: ${seiten.length} Buchseiten, ${faecher.length} Fächer → ${ZIEL.slice(ROOT.length + 1)} (Basis ${BASIS})`);
