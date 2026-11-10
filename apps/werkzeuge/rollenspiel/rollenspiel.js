// Rollenspiel „Nachrichten im Netzwerk“ (Oberfläche): Rollen verteilen – digital per QR-Code oder als Druckvorlage.
//
// Digital: Die Lehrkraft (mit Konto) startet eine Runde. Wer den QR-Code scannt, bekommt sofort eine zufällige freie
// Rolle (Server: RollenspielController); vergebene Rollen bekommt niemand sonst. Die Karte selbst berechnet der
// Browser aus Einstellungen und Rollennummer (rollen.js). Stufe und Darstellung stellt die Lehrkraft für alle um.

import { STUFEN, DNS_IP, GRENZEN, erzeuge, macListe, neuerSeed, pruefe, format } from './rollen.js';
import { api, html, esc, meldung, zweiSchritte, kennung, lies, schreib, zugang, kurzUrl, zeit } from '../live/live.js';

const wurzel = document.getElementById('rollenspiel');
const ROLLEN = { client: 'Client', router: 'Router', dns: 'DNS-Server' };
let timer = null;
const stoppe = () => { clearTimeout(timer); timer = null; };
const uhr = (iso) => new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

// ------------------------------------------------------------------ Regeln je Stufe (Kurzfassung für Karte und Druck)

const ROUTER_REGEL = '<li><strong>Als Router</strong> packst du nur den äußeren Umschlag aus. Steht innen nicht deine IP, schaust du in deine <strong>Routingtabelle</strong>, steckst das Paket in einen neuen äußeren Umschlag (deine MAC der passenden Hand als Quelle) und gibst es mit dieser Hand weiter. Den inneren Umschlag änderst du nie.</li>';
const DNS_REGEL = '<li><strong>Als DNS-Server</strong> beantwortest du DNS-Zettel: Name in deiner DNS-Tabelle suchen, IP eintragen, zurückschicken (Quell- und Ziel-IP tauschen).</li>';

function regeln(stufe, rolle = 'client', broadcast = 'FF:FF') {
  const arp = stufe === 1
    ? '<li><strong>Ziel-MAC</strong> steht in der <strong>MAC-Liste</strong> deiner Gruppe (Tafel bzw. Zettel).</li>'
    : `<li><strong>Ziel-MAC unbekannt?</strong> ARP: Schreibe die gesuchte IP auf einen ARP-Zettel, Umschlag an <strong>${broadcast}</strong> (an alle in deiner Gruppe). Wer die IP hat, trägt seine MAC ein und schickt den Zettel zurück. Merke dir die Antwort in deiner ARP-Tabelle.</li>`;
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
  const zeile = (titel, wert) => `<tr><th>${titel}</th><td>${wert ? esc(wert) : '<span class="rs-leer">–</span>'}</td></tr>`;
  const nics = k.nics.map((n) => `<table class="rs-daten">
${k.nics.length > 1 ? `<caption>${esc(n.hand)} · Netz ${esc(n.netz)}</caption>` : ''}
${zeile('MAC', n.mac)}${zeile('IP', n.ip)}${zeile('Netzmaske', n.maske)}
</table>`).join('');
  const weitere = k.rolle === 'router' ? '' : `<table class="rs-daten">${zeile('Gateway', k.gateway)}${zeile('DNS-Server', k.dns)}</table>`;
  let zusatz = erg.vereinfacht ? `<p class="rs-vereinfacht">Netzmaske ${esc(erg.maske)}: Bei einer 9 muss die Zahl der IP-Adresse gleich sein, bei einer 0 ist sie beliebig.</p>` : '';
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
    zusatz += '<div class="rs-zusatz"><p class="rs-zusatz-titel">Deine ARP-Tabelle (selbst führen)</p><p class="klein">Notiere auf einem Zettel jede Antwort: IP → MAC. Dann musst du beim nächsten Mal nicht mehr fragen.</p></div>';
  }
  return `<article class="rs-karte rs-${k.rolle}">
<header><span class="rs-nr">Nr. ${k.nr}</span><span class="rs-rolle">${ROLLEN[k.rolle]}</span><span class="rs-gruppe">Gruppe ${k.gruppe}</span></header>
<p class="rs-name">${esc(k.name)}</p>
<div class="rs-nics">${nics}${weitere}</div>
${zusatz}
</article>`;
}

// ------------------------------------------------------------------ Schülerinnen und Schüler: Rolle per Code

function schueler(code) {
  stoppe();
  const ich = kennung(`rollenspiel-${code}`);
  wurzel.innerHTML = `<div class="rs-schueler">
<p class="rs-kopf-code">Rollenspiel · Code <strong>${code.slice(0, 3)} ${code.slice(3)}</strong></p>
<div class="rs-ausgabe" aria-live="polite"><p class="rs-bitte">Deine Rolle wird ausgelost …</p></div>
</div>`;
  const aus = wurzel.querySelector('.rs-ausgabe');
  let zuletzt = null;

  const zeige = (runde) => {
    if (zuletzt && JSON.stringify([runde.settings, runde.nr]) === JSON.stringify([zuletzt.settings, zuletzt.nr])) return;
    const vorher = zuletzt;
    zuletzt = runde;
    if (runde.nr === null) {
      aus.innerHTML = `<p class="rs-bitte">Deine Rolle wurde von deiner Lehrkraft freigegeben.</p>
<p><button type="button" class="knopf primaer rs-holen">Neue Rolle holen</button></p>`;
      aus.querySelector('.rs-holen').addEventListener('click', holen);
      return;
    }
    const k = runde.settings;
    const erg = erzeuge(k);
    const karte = erg.karten[runde.nr - 1];
    const neu = vorher?.nr === runde.nr && vorher.settings.stufe !== k.stufe
      ? `<p class="rs-neu" role="status">Deine Lehrkraft hat auf ${esc(STUFEN[k.stufe].titel)} umgestellt.</p>` : '';
    aus.innerHTML = `${neu}<p class="rs-stufe">${esc(STUFEN[k.stufe].titel)}</p>
${karteHtml(karte, erg)}
<details class="aufklapp rs-regel-box" open><summary>Spielregeln</summary>${regeln(k.stufe, karte.rolle, erg.broadcast)}</details>`;
  };

  const fehler = (err) => {
    zuletzt = null;
    if (err.status === 404) {
      stoppe();
      aus.innerHTML = `<p class="rs-fehler">Zu diesem Code gibt es kein Rollenspiel (mehr). Prüfe den Code oder frag deine Lehrkraft.</p><p><a href="${location.pathname}">Anderen Code eingeben</a></p>`;
      return;
    }
    aus.innerHTML = `<p class="rs-fehler">${esc(err.message)}</p><p><button type="button" class="knopf rs-holen">Noch einmal versuchen</button></p>`;
    aus.querySelector('.rs-holen').addEventListener('click', holen);
  };

  const pruefen = async () => {
    try { zeige((await api('GET', `/rollenspiel/${code}?participant=${ich}`)).runde); } catch (err) { if (err.status === 404) { fehler(err); return; } }
    timer = setTimeout(pruefen, 5000);
  };

  async function holen() {
    stoppe();
    try { zeige((await api('POST', `/rollenspiel/${code}/rolle`, { participant: ich })).runde); } catch (err) { fehler(err); if (err.status === 404) return; }
    timer = setTimeout(pruefen, 5000);
  }
  holen();
}

// ------------------------------------------------------------------ Übersicht der Gruppen (Skizze) und Rollenliste

function uebersichtSvg(erg, vergeben = null) {
  const G = erg.gruppen.length;
  const B = 640; const H = erg.stufe === 3 ? 390 : 200;
  const cx = B / 2; const cy = H / 2;
  const linien = [];
  const teile = [];
  erg.gruppen.forEach((gr, i) => {
    let x; let y;
    if (erg.stufe === 3) {
      const w = (2 * Math.PI * i) / G - Math.PI / 2;
      x = cx + Math.cos(w) * 230; y = cy + Math.sin(w) * 125;
      linien.push(`<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" class="linie"/>`);
    } else {
      x = (B / (G + 1)) * (i + 1); y = cy;
    }
    const r = Math.min(62, (B / (G + 1)) / 2 - 4);
    const da = vergeben ? gr.mitglieder.filter((m) => vergeben.has(m.nr)).length : null;
    teile.push(`<circle cx="${x}" cy="${y}" r="${r}" class="flaeche"/>
<text x="${x}" y="${y - 6}" text-anchor="middle" class="titel">Gruppe ${gr.nr}</text>
<text x="${x}" y="${y + 12}" text-anchor="middle">${gr.netz}</text>
<text x="${x}" y="${y + 28}" text-anchor="middle" class="klein">${da === null ? `Nr. ${gr.von}–${gr.bis}` : `${da} von ${gr.mitglieder.length} da`}</text>`);
  });
  if (erg.stufe === 3) {
    linien.push(`<ellipse cx="${cx}" cy="${cy}" rx="78" ry="40" class="flaeche"/><text x="${cx}" y="${cy - 4}" text-anchor="middle" class="titel">Backbone</text><text x="${cx}" y="${cy + 14}" text-anchor="middle">3.3.3.x</text>`);
  }
  return `<figure class="skizze rs-skizze"><svg viewBox="0 0 ${B} ${H}" role="img" aria-label="Übersicht der Gruppen">${linien.join('')}${teile.join('')}</svg>
<figcaption>${erg.stufe === 3 ? 'Die Router (jeweils die erste Nummer einer Gruppe) stehen mit der linken Hand im Backbone zusammen.' : 'Jede Gruppe ist ein eigenes lokales Netz. Am besten sitzt jede Gruppe zusammen.'}</figcaption></figure>`;
}

function rollenTabelle(erg, rollen = null) {
  const nachNr = rollen ? new Map(rollen.map((r) => [r.nr, r])) : null;
  return `<div class="rs-scroll"><table class="rs-liste"><thead><tr><th>Nr.</th><th>Gruppe</th><th>Rolle</th><th>Name</th><th>IP</th><th>MAC</th><th>Gateway</th>${nachNr ? '<th>Status</th>' : ''}</tr></thead><tbody>
${erg.karten.map((c) => {
    const r = nachNr?.get(c.nr);
    const status = nachNr ? `<td class="rs-status-zelle">${r ? `vergeben ${uhr(r.am)} <button type="button" class="knopf rs-frei" data-nr="${c.nr}">freigeben</button>` : '<span class="rs-leer">frei</span>'}</td>` : '';
    return `<tr${nachNr && !r ? ' class="rs-offen"' : ''}><td>${c.nr}</td><td>${c.gruppe}</td><td>${ROLLEN[c.rolle]}</td><td>${esc(c.name)}</td><td>${c.nics.map((n) => n.ip).join(' / ')}</td><td>${c.nics.map((n) => n.mac).join(' / ')}</td><td>${c.gateway || '–'}</td>${status}</tr>`;
  }).join('')}
</tbody></table></div>`;
}

const druckKnoepfe = (k) => `<button type="button" class="knopf" data-druck="karten">Rollenkarten drucken</button>
${k.stufe === 1 ? '<button type="button" class="knopf" data-druck="maclisten">MAC-Listen drucken</button>' : ''}
<button type="button" class="knopf" data-druck="zettel">Umschläge und Zettel drucken</button>
<button type="button" class="knopf" data-druck="regeln">Spielregeln drucken</button>`;

// ------------------------------------------------------------------ Lehrkraft: Einstellungen, Runden, Druck

const STANDARD = { personen: 24, gruppen: 4, stufe: 2, vereinfacht: false };
function gemerkt() {
  let alt = {};
  try { alt = JSON.parse(lies('rollenspiel:einstellungen') ?? '{}') ?? {}; } catch { /* egal */ }
  return { ...STANDARD, seed: neuerSeed(), ...alt };
}

async function lehrkraft() {
  stoppe();
  history.replaceState(null, '', location.pathname);
  let lehrer = null;
  try { const { user } = await api('GET', '/auth/me'); lehrer = user?.role === 'teacher' ? user : null; } catch { /* ohne Server: nur Druck */ }
  const start = gemerkt();
  wurzel.innerHTML = `<form class="rs-code-eingabe"><label>Du hast einen Code bekommen? <input name="code" inputmode="numeric" maxlength="7" placeholder="123456" autocomplete="off"></label> <button class="knopf primaer">Zu meiner Rolle</button> <span class="rs-fehler" aria-live="polite"></span></form>
<div class="rs-lehrkraft">
<h2>Rollen einstellen</h2>
<form class="rs-form">
<label>Mitspielende <input type="number" name="personen" min="${GRENZEN.minPersonen}" max="${GRENZEN.maxPersonen}" value="${start.personen}"></label>
<label>Gruppen (= Netze) <input type="number" name="gruppen" min="1" max="${GRENZEN.maxGruppen}" value="${start.gruppen}"></label>
<label>Stufe <select name="stufe">${Object.entries(STUFEN).map(([s, t]) => `<option value="${s}"${Number(s) === start.stufe ? ' selected' : ''}>${esc(t.titel)}</option>`).join('')}</select></label>
<label>Zufallszahl <input type="number" name="seed" min="0" max="999" value="${start.seed}"></label>
<button type="button" class="knopf rs-mischen">Neu mischen</button>
<label class="rs-check"><input type="checkbox" name="vereinfacht"${start.vereinfacht ? ' checked' : ''}> Vereinfachte Adressen: MAC aus drei Buchstaben (z. B. <code>KTV</code>, an alle: <code>FFF</code>), Netzmaske <code>9.9.9.0</code></label>
</form>
<div class="rs-ergebnis" aria-live="polite"></div>
</div>`;

  const f = wurzel.querySelector('.rs-code-eingabe');
  f.addEventListener('submit', (e) => {
    e.preventDefault();
    const code = f.elements.code.value.replace(/\D/g, '');
    if (code.length !== 6) { f.querySelector('.rs-fehler').textContent = 'Der Code hat sechs Ziffern.'; return; }
    location.search = `?code=${code}`;
  });

  const form = wurzel.querySelector('.rs-form');
  const lese = () => ({ ...Object.fromEntries(['personen', 'gruppen', 'stufe', 'seed'].map((n) => [n, Number(form.elements[n].value)])), vereinfacht: form.elements.vereinfacht.checked });
  const zeige = () => {
    const k = lese();
    const aus = wurzel.querySelector('.rs-ergebnis');
    const fehler = pruefe(k);
    if (fehler) { aus.innerHTML = `<p class="rs-fehler">${esc(fehler)}</p>`; return; }
    schreib('rollenspiel:einstellungen', JSON.stringify(k));
    const erg = erzeuge(k);
    aus.innerHTML = `<h2>Digital verteilen</h2>
<div class="rs-digital"></div>
<h2>Oder drucken</h2>
<p>Rollenkarten ausdrucken und ausschneiden – günstig, wenn keine Geräte zur Verfügung stehen oder die Gruppen räumlich verteilt werden sollen. Mit derselben Zufallszahl bleiben Namen und Adressen in allen Stufen gleich.</p>
<p class="rs-knoepfe">${druckKnoepfe(k)}</p>
${uebersichtSvg(erg)}
<details class="aufklapp"><summary>Alle Rollen im Überblick (${erg.karten.length})</summary>${rollenTabelle(erg)}</details>`;
    aus.querySelectorAll('[data-druck]').forEach((b) => b.addEventListener('click', () => drucke(b.dataset.druck, erg, k)));
    digital(aus.querySelector('.rs-digital'), k, lehrer, (u) => { lehrer = u; zeige(); });
  };
  form.addEventListener('input', zeige);
  wurzel.querySelector('.rs-mischen').addEventListener('click', () => { form.elements.seed.value = neuerSeed(); zeige(); });
  zeige();
}

/** Bereich „Digital verteilen“: Anmeldung bzw. Runde starten und frühere Runden */
async function digital(bereich, k, lehrer, angemeldet) {
  if (!lehrer) {
    bereich.innerHTML = `<p>Alle scannen einen QR-Code und bekommen sofort eine zufällige Rolle – jede Rolle nur einmal. Dafür meldet sich die Lehrkraft mit ihrem Lehrkräfte-Konto des Online-Schulbuchs an; Schülerinnen und Schüler brauchen kein Konto. Noch kein Konto? <a href="/informatik/kryptogame/registrieren" target="_blank" rel="noopener">Zugang beantragen</a>.</p>
<form class="uf-anmelden rs-anmelden">
<label>Benutzername <input name="name" autocomplete="username" autocapitalize="none" spellcheck="false" required></label>
<label>Passwort <input name="passwort" type="password" autocomplete="current-password" required></label>
<button type="submit" class="knopf primaer">Anmelden</button>
</form><div class="rs-meldung"></div>`;
    const form = bereich.querySelector('form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const ziel = bereich.querySelector('.rs-meldung');
      meldung(ziel, 'Einen Moment …', 'info');
      try {
        const { user } = await api('POST', '/auth/login', { username: form.name.value.trim(), password: form.passwort.value });
        if (user.role !== 'teacher') { await api('POST', '/auth/logout', {}).catch(() => {}); throw new Error('Das ist kein Konto für Lehrkräfte.'); }
        angemeldet(user);
      } catch (err) { meldung(ziel, err.status === 401 ? 'Benutzername oder Passwort stimmen nicht.' : err.message); }
    });
    return;
  }
  bereich.innerHTML = `<p>Mit den Einstellungen oben eine Runde starten: Es erscheint ein QR-Code. Wer ihn scannt, bekommt sofort eine zufällige freie Rolle. Die Gruppen füllen sich gleichmäßig, Router und DNS-Server werden zuerst vergeben – so funktioniert jedes Netz, auch wenn weniger Personen kommen als eingestellt.</p>
<p><button type="button" class="knopf primaer rs-starten">Runde starten</button></p>
<div class="rs-meldung"></div><div class="rs-runden"></div>`;
  bereich.querySelector('.rs-starten').addEventListener('click', async () => {
    try { runde((await api('POST', '/rollenspiele', k)).runde); } catch (err) { meldung(bereich.querySelector('.rs-meldung'), err.message); }
  });
  try {
    const { runden } = await api('GET', '/rollenspiele');
    if (!runden.length || !bereich.isConnected) return;
    const liste = bereich.querySelector('.rs-runden');
    liste.innerHTML = `<h3>Frühere Runden</h3><ul class="rs-runden-liste">${runden.map((r) => `<li data-id="${r.id}"><span><strong>${r.code.slice(0, 3)} ${r.code.slice(3)}</strong> · ${r.settings.personen} Mitspielende, ${r.settings.gruppen} Gruppen, Stufe ${r.settings.stufe}${r.settings.vereinfacht ? ', vereinfacht' : ''} · ${r.vergeben} vergeben · zuletzt ${zeit(r.updatedAt)}</span>
<span class="rs-knoepfe"><button type="button" class="knopf rs-oeffnen">Öffnen</button><button type="button" class="knopf rs-weg">Löschen</button></span></li>`).join('')}</ul>
<p class="klein">Runden werden 60 Tage nach der letzten Änderung automatisch gelöscht.</p>`;
    liste.querySelectorAll('li').forEach((li) => {
      const r = runden.find((x) => String(x.id) === li.dataset.id);
      li.querySelector('.rs-oeffnen').addEventListener('click', () => runde(r));
      zweiSchritte(li.querySelector('.rs-weg'), 'Wirklich löschen?', async () => {
        try { await api('DELETE', `/rollenspiele/${r.id}`); li.remove(); } catch (err) { meldung(bereich.querySelector('.rs-meldung'), err.message); }
      });
    });
  } catch { /* Liste ist nicht wichtig */ }
}

/** Laufende Runde: QR-Code, Stand der Vergabe, Stufe umstellen, Rollen freigeben */
function runde(r0) {
  stoppe();
  let r = r0;
  let zuletzt = '';
  let beamerZeichnen = null;
  wurzel.innerHTML = `<div class="rs-runde">
<p><button type="button" class="knopf rs-zurueck">← Zu den Einstellungen</button></p>
<section class="rs-verteilen">
<div class="uf-zugang rs-zugang"></div>
<div>
<p class="rs-status"></p>
<p>Alle scannen den QR-Code (oder öffnen <strong>${esc(kurzUrl('roleplay'))}</strong> und geben den Code ein). Jedes Gerät bekommt sofort eine zufällige freie Rolle und behält sie, auch nach dem Neuladen.</p>
<form class="rs-form rs-live">
<label>Stufe <select name="stufe">${Object.entries(STUFEN).map(([s, t]) => `<option value="${s}">${esc(t.titel)}</option>`).join('')}</select></label>
<label class="rs-check"><input type="checkbox" name="vereinfacht"> Vereinfachte Adressen (MAC aus drei Buchstaben, Netzmaske 9.9.9.0)</label>
</form>
<p class="klein">Umstellen wirkt nach wenigen Sekunden auf allen Geräten; Rollen, Namen und IP-Adressen bleiben gleich. Für die nächste Stufe dieselbe Runde wieder öffnen.</p>
<p class="rs-knoepfe"><button type="button" class="knopf primaer rs-beamer">Beamer-Ansicht</button><span class="rs-druck-knoepfe rs-knoepfe"></span></p>
<p class="rs-knoepfe"><button type="button" class="knopf rs-alle-frei">Alle Rollen freigeben</button><button type="button" class="knopf rs-loeschen">Runde löschen</button></p>
<div class="rs-meldung"></div>
</div>
</section>
<div class="rs-skizze-platz"></div>
<h2>Rollen</h2>
<div class="rs-tabelle"></div>
</div>`;
  const el = wurzel.querySelector('.rs-runde');
  const ziel = el.querySelector('.rs-meldung');
  const live = el.querySelector('.rs-live');
  zugang(el.querySelector('.rs-zugang'), 'roleplay', r.code);

  const zeichne = () => {
    const k = r.settings;
    const erg = erzeuge(k);
    el.querySelector('.rs-status').innerHTML = `<strong class="rs-zahl">${r.vergeben}</strong> von ${k.personen} Rollen vergeben · ${k.gruppen} Gruppen`;
    if (document.activeElement?.form !== live) {
      live.elements.stufe.value = String(k.stufe);
      live.elements.vereinfacht.checked = k.vereinfacht;
    }
    const stand = JSON.stringify([k, r.rollen]);
    if (stand === zuletzt) return;
    zuletzt = stand;
    el.querySelector('.rs-druck-knoepfe').innerHTML = druckKnoepfe(k);
    el.querySelectorAll('[data-druck]').forEach((b) => b.addEventListener('click', () => drucke(b.dataset.druck, erg, k)));
    el.querySelector('.rs-skizze-platz').innerHTML = uebersichtSvg(erg, new Set(r.rollen.map((x) => x.nr)));
    el.querySelector('.rs-tabelle').innerHTML = rollenTabelle(erg, r.rollen);
    el.querySelectorAll('.rs-frei').forEach((b) => zweiSchritte(b, 'Wirklich?', async () => {
      try { r = (await api('DELETE', `/rollenspiele/${r.id}/rollen/${b.dataset.nr}`)).runde; zeichne(); } catch (err) { meldung(ziel, err.message); }
    }));
    beamerZeichnen?.();
  };

  const laden = async () => {
    if (!el.isConnected) return;
    try { r = (await api('GET', `/rollenspiele/${r.id}`)).runde; zeichne(); } catch (err) {
      if (err.status === 404) { meldung(ziel, 'Diese Runde gibt es nicht mehr.'); return; }
    }
    timer = setTimeout(laden, 4000);
  };

  live.addEventListener('change', async () => {
    meldung(ziel, '');
    try {
      r = (await api('PATCH', `/rollenspiele/${r.id}`, { stufe: Number(live.elements.stufe.value), vereinfacht: live.elements.vereinfacht.checked })).runde;
      zeichne();
    } catch (err) { meldung(ziel, err.message); }
  });
  el.querySelector('.rs-zurueck').addEventListener('click', lehrkraft);
  zweiSchritte(el.querySelector('.rs-alle-frei'), 'Wirklich alle freigeben?', async () => {
    try { r = (await api('DELETE', `/rollenspiele/${r.id}/rollen`)).runde; zeichne(); } catch (err) { meldung(ziel, err.message); }
  });
  zweiSchritte(el.querySelector('.rs-loeschen'), 'Wirklich löschen?', async () => {
    try { await api('DELETE', `/rollenspiele/${r.id}`); lehrkraft(); } catch (err) { meldung(ziel, err.message); }
  });

  // Beamer-Ansicht: großer QR-Code und Stand der Gruppen
  el.querySelector('.rs-beamer').addEventListener('click', () => {
    document.querySelector('.rs-buehne')?.remove();
    const b = html(`<div class="uf-buehne code-gross rs-buehne" role="dialog" aria-modal="true" aria-label="Rollenspiel">
<header class="uf-buehne-kopf"><h2>Rollenspiel: Nachrichten im Netzwerk</h2><div class="uf-buehne-status"></div>
<div class="uf-buehne-knoepfe"><button type="button" class="knopf uf-vollbild">Vollbild</button><button type="button" class="knopf uf-schliessen">Schließen</button></div></header>
<div class="uf-buehne-inhalt"><aside class="uf-zugang"></aside><main class="uf-auswertung rs-beamer-inhalt"></main></div>
</div>`);
    document.body.append(b);
    document.documentElement.classList.add('uf-buehne-offen');
    zugang(b.querySelector('.uf-zugang'), 'roleplay', r.code);
    beamerZeichnen = () => {
      if (!b.isConnected) { beamerZeichnen = null; return; }
      b.querySelector('.uf-buehne-status').innerHTML = `<strong class="uf-teilnehmende">${r.vergeben}</strong> von ${r.settings.personen} Rollen vergeben`;
      b.querySelector('.rs-beamer-inhalt').innerHTML = `<p class="rs-beamer-stufe">${esc(STUFEN[r.settings.stufe].titel)}</p>${uebersichtSvg(erzeuge(r.settings), new Set(r.rollen.map((x) => x.nr)))}`;
    };
    beamerZeichnen();
    const schliessen = () => {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      b.remove();
      beamerZeichnen = null;
      document.documentElement.classList.remove('uf-buehne-offen');
    };
    b.querySelector('.uf-schliessen').addEventListener('click', schliessen);
    b.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !document.fullscreenElement) schliessen(); });
    b.querySelector('.uf-vollbild').addEventListener('click', () => (document.fullscreenElement ? document.exitFullscreen().catch(() => {}) : b.requestFullscreen?.().catch(() => {})));
    b.querySelector('.uf-schliessen').focus();
  });

  zeichne();
  timer = setTimeout(laden, 4000);
}

// ------------------------------------------------------------------ Druckvorlagen

function zettelHtml(broadcast) {
  const umschlagAussen = `<div class="rs-zettel rs-aussen"><p class="rs-z-titel">Äußerer Umschlag · Ethernet-Rahmen</p><p>Quell-MAC: <span class="rs-linie"></span></p><p>Ziel-MAC: <span class="rs-linie"></span></p><p class="klein">Ziel-MAC ${broadcast} = an alle in der Gruppe (Broadcast)</p></div>`;
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
  const { broadcast } = format(k);
  const kopf = `<p class="rs-druck-kopf">Rollenspiel „Nachrichten im Netzwerk“ · ${esc(STUFEN[k.stufe].titel)} · ${k.personen} Mitspielende, ${k.gruppen} Gruppen, Zufallszahl ${k.seed}${k.vereinfacht ? ', vereinfachte Adressen' : ''}</p>`;
  if (art === 'karten') ziel.innerHTML = `${kopf}<div class="rs-karten">${erg.karten.map((c) => karteHtml(c, erg, { druck: true })).join('')}</div>`;
  if (art === 'maclisten') {
    ziel.innerHTML = `${kopf}${erg.gruppen.map((g) => `<section class="rs-macliste"><h2>MAC-Liste Gruppe ${g.nr} (Netz ${g.netz})</h2><table class="rs-liste gross"><thead><tr><th>Name</th><th>IP</th><th>MAC</th></tr></thead><tbody>${macListe(erg, g.nr).map((e) => `<tr><td>${esc(e.name)}</td><td>${e.ip}</td><td>${e.mac}</td></tr>`).join('')}</tbody></table></section>`).join('')}`;
  }
  if (art === 'zettel') ziel.innerHTML = kopf + zettelHtml(broadcast);
  if (art === 'regeln') {
    ziel.innerHTML = `${kopf}<h2>Spielregeln</h2>${regeln(k.stufe, 'client', broadcast)}${k.stufe === 3 ? `<h3>Zusätzlich für Router und DNS-Server</h3><ul>${ROUTER_REGEL}${DNS_REGEL}</ul>` : ''}`;
  }
  document.documentElement.classList.add('rs-drucken');
  const fertig = () => { document.documentElement.classList.remove('rs-drucken'); window.removeEventListener('afterprint', fertig); };
  window.addEventListener('afterprint', fertig);
  window.print();
}

// ------------------------------------------------------------------ Start

const startCode = new URLSearchParams(location.search).get('code');
if (startCode && /^\d{6}$/.test(startCode)) schueler(startCode);
else lehrkraft();
