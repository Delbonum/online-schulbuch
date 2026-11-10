// Rollenspiel „Nachrichten im Netzwerk“ (Oberfläche): Rollen verteilen – analog als Druckvorlage oder digital per Code/QR-Code.
// Die Logik steckt in rollen.js. Es wird nichts an einen Server geschickt: Code + eigene Nummer ergeben überall dieselbe Karte.

import { STUFEN, BROADCAST, DNS_IP, GRENZEN, erzeuge, code, leseCode, macListe, neuerSeed, pruefe } from './rollen.js';
import { qrSvg } from '../qr-code/qr-encode.js';

const wurzel = document.getElementById('rollenspiel');
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const merke = (k, v) => { try { sessionStorage.setItem(`rollenspiel:${k}`, v); } catch { /* egal */ } };
const hole = (k) => { try { return sessionStorage.getItem(`rollenspiel:${k}`); } catch { return null; } };

// ------------------------------------------------------------------ Regeln je Stufe (Kurzfassung für Karte und Druck)

const ROUTER_REGEL = '<li><strong>Als Router</strong> packst du nur den äußeren Umschlag aus. Steht innen nicht deine IP, schaust du in deine <strong>Routingtabelle</strong>, steckst das Paket in einen neuen äußeren Umschlag (deine MAC der passenden Hand als Quelle) und gibst es mit dieser Hand weiter. Den inneren Umschlag änderst du nie.</li>';
const DNS_REGEL = '<li><strong>Als DNS-Server</strong> beantwortest du DNS-Zettel: Name in deiner DNS-Tabelle suchen, IP eintragen, zurückschicken (Quell- und Ziel-IP tauschen).</li>';

function regeln(stufe, rolle = 'client') {
  const arp = stufe === 1
    ? '<li><strong>Ziel-MAC</strong> steht in der <strong>MAC-Liste</strong> deiner Gruppe (Tafel bzw. Zettel).</li>'
    : `<li><strong>Ziel-MAC unbekannt?</strong> ARP: Schreibe die gesuchte IP auf einen ARP-Zettel, Umschlag an <strong>${BROADCAST}</strong> (an alle in deiner Gruppe). Wer die IP hat, trägt seine MAC ein und schickt den Zettel zurück. Merke dir die Antwort in deiner ARP-Tabelle.</li>`;
  const ziel = stufe === 3
    ? '<li><strong>Liegt die Ziel-IP in deinem Netz?</strong> (die ersten drei Zahlen gleich) Ja → an die Ziel-IP. Nein → an dein <strong>Gateway</strong> (den Router).</li>'
    : '<li>Du schickst nur an IP-Adressen in deiner Gruppe (die ersten drei Zahlen sind gleich).</li>';
  const dns = stufe === 3 ? `<li><strong>Nur einen Namen?</strong> Erst den DNS-Server (${DNS_IP}) nach der IP fragen: DNS-Zettel mit dem Namen schicken.</li>` : '';
  const extra = rolle === 'router' ? ROUTER_REGEL : rolle === 'dns' ? DNS_REGEL : '';
  return `<ol class="rs-regeln">
${dns}<li><strong>Nachricht schreiben</strong> (z. B. „Ping“ und die Uhrzeit) und in den <strong>inneren Umschlag</strong> stecken: Quell-IP = deine IP, Ziel-IP = IP des Empfängers.</li>
${ziel}${arp}<li>Inneren Umschlag in den <strong>äußeren Umschlag</strong> stecken: Quell-MAC = deine MAC, Ziel-MAC = MAC des nächsten Empfängers. Nur an diese Person übergeben.</li>
<li><strong>Empfangen:</strong> Äußeren Umschlag öffnen, wenn er an deine MAC geht. Inneren nur öffnen, wenn er an deine IP geht. Auf „Ping“ antwortest du mit „Pong“ (IP-Adressen tauschen).</li>
${extra}<li>Sprich nur über Umschläge und Zettel – keine Zurufe!</li>
</ol>`;
}

// ------------------------------------------------------------------ Karte (Datenblatt)

function karteHtml(k, erg, { druck = false } = {}) {
  const rollenName = { client: 'Client', router: 'Router', dns: 'DNS-Server' }[k.rolle];
  const zeile = (titel, wert) => `<tr><th>${titel}</th><td>${wert ? esc(wert) : '<span class="rs-leer">–</span>'}</td></tr>`;
  const nics = k.nics.map((n) => `<table class="rs-daten">
${k.nics.length > 1 ? `<caption>${esc(n.hand)} · Netz ${esc(n.netz)}</caption>` : ''}
${zeile('MAC', n.mac)}${zeile('IP', n.ip)}${zeile('Netzmaske', n.maske)}
</table>`).join('');
  const weitere = k.rolle === 'router' ? '' : `<table class="rs-daten">${zeile('Gateway', k.gateway)}${zeile('DNS-Server', k.dns)}</table>`;
  let zusatz = '';
  if (erg.stufe === 1) {
    zusatz += `<details class="rs-zusatz"${druck ? ' open' : ''}><summary>MAC-Liste deiner Gruppe</summary><table class="rs-liste"><thead><tr><th>Name</th><th>IP</th><th>MAC</th></tr></thead><tbody>${macListe(erg, k.gruppe).map((e) => `<tr><td>${esc(e.name)}</td><td>${e.ip}</td><td>${e.mac}</td></tr>`).join('')}</tbody></table></details>`;
  }
  if (k.routing) {
    zusatz += `<div class="rs-zusatz"><p class="rs-zusatz-titel">Routingtabelle (von oben nach unten: die erste passende Zeile gilt)</p><table class="rs-liste"><thead><tr><th>Ziel-IP</th><th>Was tun?</th><th>Hand</th></tr></thead><tbody>${k.routing.map((r) => `<tr><td>${esc(r.ziel)}</td><td>${esc(r.aktion)}</td><td>${esc(r.hand)}</td></tr>`).join('')}</tbody></table></div>`;
  }
  if (k.dnsTabelle) {
    zusatz += `<details class="rs-zusatz"${druck ? ' open' : ''}><summary>DNS-Tabelle (${k.dnsTabelle.length} Einträge)</summary><table class="rs-liste rs-dns"><thead><tr><th>Name</th><th>IP</th></tr></thead><tbody>${k.dnsTabelle.map((e) => `<tr><td>${esc(e.name)}</td><td>${e.ip}</td></tr>`).join('')}</tbody></table></details>`;
  }
  if (!druck && erg.stufe >= 2) {
    zusatz += `<div class="rs-zusatz"><p class="rs-zusatz-titel">Deine ARP-Tabelle (selbst führen)</p><p class="klein">Notiere auf einem Zettel jede Antwort: IP → MAC. Dann musst du beim nächsten Mal nicht mehr fragen.</p></div>`;
  }
  return `<article class="rs-karte rs-${k.rolle}">
<header><span class="rs-nr">Nr. ${k.nr}</span><span class="rs-rolle">${rollenName}</span><span class="rs-gruppe">Gruppe ${k.gruppe}</span></header>
<p class="rs-name">${esc(k.name)}</p>
<div class="rs-nics">${nics}${weitere}</div>
${zusatz}
</article>`;
}

// ------------------------------------------------------------------ Schüleransicht

function schueler(k0) {
  wurzel.innerHTML = `<div class="rs-schueler">
<div class="rs-kopf"><span>Code <strong>${code(k0)}</strong></span>
<label>Stufe <select class="rs-stufe">${Object.entries(STUFEN).map(([s, t]) => `<option value="${s}"${Number(s) === k0.stufe ? ' selected' : ''}>${s} · ${esc(t.kurz)}</option>`).join('')}</select></label>
<label>Deine Nummer <input type="number" class="rs-eigene" min="1" max="${k0.personen}" inputmode="numeric" value="${esc(hole(`nr:${k0.personen}-${k0.gruppen}-${k0.seed}`) ?? '')}"></label></div>
<div class="rs-ausgabe" aria-live="polite"></div>
<p class="klein"><a href="${location.pathname}">Eigene Rollen erzeugen (für Lehrkräfte)</a></p>
</div>`;
  const stufeWahl = wurzel.querySelector('.rs-stufe');
  const nrFeld = wurzel.querySelector('.rs-eigene');
  const zeige = () => {
    const k = { ...k0, stufe: Number(stufeWahl.value) };
    const ausgabe = wurzel.querySelector('.rs-ausgabe');
    const fehler = pruefe(k);
    if (fehler) { ausgabe.innerHTML = `<p class="rs-fehler">${esc(fehler)}</p>`; return; }
    const nr = Number(nrFeld.value);
    if (!Number.isInteger(nr) || nr < 1 || nr > k.personen) {
      ausgabe.innerHTML = `<p class="rs-bitte">Gib deine Nummer ein (1 bis ${k.personen}). Deine Lehrkraft sagt dir, welche Nummer du hast – zum Beispiel durch Durchzählen.</p>`;
      return;
    }
    merke(`nr:${k.personen}-${k.gruppen}-${k.seed}`, String(nr));
    const erg = erzeuge(k);
    const karte = erg.karten[nr - 1];
    ausgabe.innerHTML = `${karteHtml(karte, erg)}
<details class="aufklapp rs-regel-box"><summary>Spielregeln (${esc(STUFEN[k.stufe].titel)})</summary>${regeln(k.stufe, karte.rolle)}</details>`;
  };
  stufeWahl.addEventListener('change', zeige);
  nrFeld.addEventListener('input', zeige);
  zeige();
}

// ------------------------------------------------------------------ Lehrkraft-Ansicht

function uebersichtSvg(erg) {
  const G = erg.gruppen.length;
  const B = 640; const H = erg.stufe === 3 ? 360 : 200;
  const cx = B / 2; const cy = H / 2;
  const teile = [];
  erg.gruppen.forEach((gr, i) => {
    let x; let y;
    if (erg.stufe === 3) {
      const w = (2 * Math.PI * i) / G - Math.PI / 2;
      x = cx + Math.cos(w) * 230; y = cy + Math.sin(w) * 130;
      teile.push(`<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" class="linie"/>`);
    } else {
      x = (B / (G + 1)) * (i + 1); y = cy;
    }
    const r = Math.min(62, (B / (G + 1)) / 2 - 4);
    teile.push(`<circle cx="${x}" cy="${y}" r="${r}" class="flaeche"/>
<text x="${x}" y="${y - 6}" text-anchor="middle" class="titel">Gruppe ${gr.nr}</text>
<text x="${x}" y="${y + 12}" text-anchor="middle">${gr.netz}</text>
<text x="${x}" y="${y + 28}" text-anchor="middle" class="klein">Nr. ${gr.von}–${gr.bis}</text>`);
  });
  if (erg.stufe === 3) {
    teile.unshift(`<ellipse cx="${cx}" cy="${cy}" rx="78" ry="40" class="rahmen"/><text x="${cx}" y="${cy - 4}" text-anchor="middle" class="titel">Backbone</text><text x="${cx}" y="${cy + 14}" text-anchor="middle">3.3.3.x</text>`);
  }
  return `<figure class="skizze rs-skizze"><svg viewBox="0 0 ${B} ${H}" role="img" aria-label="Übersicht der Gruppen">${teile.join('')}</svg>
<figcaption>${erg.stufe === 3 ? 'Die Router (jeweils die erste Nummer einer Gruppe) stehen mit der linken Hand im Backbone zusammen.' : 'Jede Gruppe ist ein eigenes lokales Netz. Am besten sitzt jede Gruppe zusammen.'}</figcaption></figure>`;
}

function lehrkraft() {
  const start = { personen: 24, gruppen: 4, stufe: 2, seed: neuerSeed() };
  wurzel.innerHTML = `<div class="rs-lehrkraft">
<form class="rs-form">
<label>Mitspielende <input type="number" name="personen" min="${GRENZEN.minPersonen}" max="${GRENZEN.maxPersonen}" value="${start.personen}"></label>
<label>Gruppen (= Netze) <input type="number" name="gruppen" min="1" max="${GRENZEN.maxGruppen}" value="${start.gruppen}"></label>
<label>Stufe <select name="stufe">${Object.entries(STUFEN).map(([s, t]) => `<option value="${s}"${Number(s) === start.stufe ? ' selected' : ''}>${esc(t.titel)}</option>`).join('')}</select></label>
<label>Zufallszahl <input type="number" name="seed" min="0" max="999" value="${start.seed}"></label>
<button type="button" class="knopf rs-mischen">Neu mischen</button>
</form>
<div class="rs-ergebnis" aria-live="polite"></div>
</div>`;
  const form = wurzel.querySelector('.rs-form');
  const lies = () => Object.fromEntries(['personen', 'gruppen', 'stufe', 'seed'].map((n) => [n, Number(form.elements[n].value)]));
  const zeige = () => {
    const k = lies();
    const aus = wurzel.querySelector('.rs-ergebnis');
    const fehler = pruefe(k);
    if (fehler) { aus.innerHTML = `<p class="rs-fehler">${esc(fehler)}</p>`; return; }
    const erg = erzeuge(k);
    const link = new URL(`${location.pathname}#code=${code(k)}`, location.href).href;
    aus.innerHTML = `<section class="rs-verteilen">
<div class="rs-qr">${qrSvg(link, { titel: `QR-Code zur Rollenkarte (${link})` })}</div>
<div><p class="rs-code-titel">Code für die Klasse</p><p class="rs-code">${code(k)}</p>
<p>Digital: Alle scannen den QR-Code (oder öffnen <a href="${esc(link)}" target="_blank" rel="noopener">diese Seite</a> und geben den Code ein) und tragen ihre <strong>Nummer</strong> ein. Nummern vergeben, z. B. durch Durchzählen: ${erg.gruppen.map((g) => `Nr. ${g.von}–${g.bis} = Gruppe ${g.nr}`).join(', ')}.</p>
<p>Analog: Karten ausdrucken und ausschneiden. Für die nächste Stufe dieselbe Zufallszahl behalten – dann bleiben Namen, MAC- und IP-Adressen gleich.</p>
<p class="rs-knoepfe"><button type="button" class="knopf primaer" data-druck="karten">Rollenkarten drucken</button>
${k.stufe === 1 ? '<button type="button" class="knopf" data-druck="maclisten">MAC-Listen drucken</button>' : ''}
<button type="button" class="knopf" data-druck="zettel">Umschläge und Zettel drucken</button>
<button type="button" class="knopf" data-druck="regeln">Spielregeln drucken</button></p></div>
</section>
${uebersichtSvg(erg)}
<details class="aufklapp"><summary>Alle Rollen im Überblick (${erg.karten.length})</summary>
<div class="rs-scroll"><table class="rs-liste"><thead><tr><th>Nr.</th><th>Gruppe</th><th>Rolle</th><th>Name</th><th>IP</th><th>MAC</th><th>Gateway</th></tr></thead><tbody>
${erg.karten.map((c) => `<tr><td>${c.nr}</td><td>${c.gruppe}</td><td>${{ client: 'Client', router: 'Router', dns: 'DNS-Server' }[c.rolle]}</td><td>${esc(c.name)}</td><td>${c.nics.map((n) => n.ip).join(' / ')}</td><td>${c.nics.map((n) => n.mac).join(' / ')}</td><td>${c.gateway || '–'}</td></tr>`).join('')}
</tbody></table></div></details>`;
    aus.querySelectorAll('[data-druck]').forEach((b) => b.addEventListener('click', () => drucke(b.dataset.druck, erg, k)));
  };
  form.addEventListener('input', zeige);
  wurzel.querySelector('.rs-mischen').addEventListener('click', () => { form.elements.seed.value = neuerSeed(); zeige(); });
  zeige();
}

// ------------------------------------------------------------------ Druckvorlagen

function zettelHtml() {
  const umschlagAussen = '<div class="rs-zettel rs-aussen"><p class="rs-z-titel">Äußerer Umschlag · Ethernet-Rahmen</p><p>Quell-MAC: <span class="rs-linie"></span></p><p>Ziel-MAC: <span class="rs-linie"></span></p><p class="klein">Ziel-MAC FF:FF = an alle in der Gruppe (Broadcast)</p></div>';
  const umschlagInnen = '<div class="rs-zettel rs-innen"><p class="rs-z-titel">Innerer Umschlag · IP-Paket</p><p>Quell-IP: <span class="rs-linie"></span></p><p>Ziel-IP: <span class="rs-linie"></span></p></div>';
  const arp = '<div class="rs-zettel rs-arp"><p class="rs-z-titel">ARP-Zettel</p><p>Wer hat die IP <span class="rs-linie"></span> ?</p><p>Meine MAC ist <span class="rs-linie"></span></p><p class="klein">Hast du die IP? MAC eintragen und an den Absender zurückschicken.</p></div>';
  const dns = '<div class="rs-zettel rs-dnsz"><p class="rs-z-titel">DNS-Zettel</p><p>Welche IP hat der Name <span class="rs-linie"></span> ?</p><p>IP: <span class="rs-linie"></span></p></div>';
  const nachricht = '<div class="rs-zettel rs-nachricht"><p class="rs-z-titel">Nachricht</p><p>Ping / Pong / Text: <span class="rs-linie"></span></p><p><span class="rs-linie lang"></span></p><p>Uhrzeit: <span class="rs-linie"></span></p></div>';
  const reihe = (z, n) => Array.from({ length: n }, () => z).join('');
  return `<h2>Umschläge und Zettel</h2><p class="klein">Mit echten Briefumschlägen: Die Felder direkt auf die Umschläge schreiben (innen klein, außen groß). Ohne Umschläge: Zettel falten und ineinanderlegen. Bereits benutzte Werte durchstreichen und Zettel wiederverwenden.</p>
<div class="rs-zettel-raster">${reihe(umschlagAussen, 4)}${reihe(umschlagInnen, 4)}</div>
<div class="rs-zettel-raster rs-seitenumbruch">${reihe(arp, 4)}${reihe(dns, 2)}${reihe(nachricht, 2)}</div>`;
}

function drucke(art, erg, k) {
  let ziel = document.querySelector('.rs-druck');
  if (!ziel) { ziel = document.createElement('div'); ziel.className = 'rs-druck'; document.body.append(ziel); }
  const kopf = `<p class="rs-druck-kopf">Rollenspiel „Nachrichten im Netzwerk“ · ${esc(STUFEN[k.stufe].titel)} · Code ${code(k)}</p>`;
  if (art === 'karten') ziel.innerHTML = `${kopf}<div class="rs-karten">${erg.karten.map((c) => karteHtml(c, erg, { druck: true })).join('')}</div>`;
  if (art === 'maclisten') {
    ziel.innerHTML = `${kopf}${erg.gruppen.map((g) => `<section class="rs-macliste"><h2>MAC-Liste Gruppe ${g.nr} (Netz ${g.netz})</h2><table class="rs-liste gross"><thead><tr><th>Name</th><th>IP</th><th>MAC</th></tr></thead><tbody>${macListe(erg, g.nr).map((e) => `<tr><td>${esc(e.name)}</td><td>${e.ip}</td><td>${e.mac}</td></tr>`).join('')}</tbody></table></section>`).join('')}`;
  }
  if (art === 'zettel') ziel.innerHTML = kopf + zettelHtml();
  if (art === 'regeln') {
    ziel.innerHTML = `${kopf}<h2>Spielregeln</h2>${regeln(k.stufe)}${k.stufe === 3 ? `<h3>Zusätzlich für Router und DNS-Server</h3><ul>${ROUTER_REGEL}${DNS_REGEL}</ul>` : ''}`;
  }
  document.documentElement.classList.add('rs-drucken');
  const fertig = () => { document.documentElement.classList.remove('rs-drucken'); window.removeEventListener('afterprint', fertig); };
  window.addEventListener('afterprint', fertig);
  window.print();
}

// ------------------------------------------------------------------ Start

function starte() {
  const m = location.hash.match(/code=([\d-]+)/);
  if (m) {
    const k = leseCode(decodeURIComponent(m[1]));
    if (!k.fehler) { schueler(k); return; }
  }
  lehrkraft();
  // Code-Eingabe für Schülerinnen und Schüler ohne QR-Code
  wurzel.insertAdjacentHTML('afterbegin', `<form class="rs-code-eingabe"><label>Du hast einen Code bekommen? <input name="code" placeholder="z. B. 24-4-2-517" autocomplete="off"></label> <button class="knopf primaer">Zu meiner Karte</button> <span class="rs-fehler" aria-live="polite"></span></form>`);
  const f = wurzel.querySelector('.rs-code-eingabe');
  f.addEventListener('submit', (e) => {
    e.preventDefault();
    const k = leseCode(f.elements.code.value);
    if (k.fehler) { f.querySelector('.rs-fehler').textContent = k.fehler; return; }
    location.hash = `code=${code(k)}`;
  });
}
window.addEventListener('hashchange', starte);
starte();
