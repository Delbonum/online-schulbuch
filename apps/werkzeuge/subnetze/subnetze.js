// Subnetz-Trainer (Oberfläche): Rechner mit Binärdarstellung und Übungsaufgaben. Rechnungen in subnetz.js.
import { analysiere, ARTEN, neueAufgabe, pruefeAntwort } from './subnetz.js';

const wurzel = document.getElementById('subnetze');
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Binärdarstellung: Netzteil (Einsen der Maske) und Geräteteil farbig getrennt */
function binaerZeilen(a) {
  const teile = (bits) => {
    let k = 0;
    return bits.split('').map((c) => (c === '.' ? '<span class="sn-punkt">.</span>' : `<span class="${k++ < a.suffix ? 'sn-n' : 'sn-h'}">${c}</span>`)).join('');
  };
  return `<table class="sn-binaer">
<tr><th>IP-Adresse</th><td>${a.ip}</td><td class="sn-bits">${teile(a.binaer.ip)}</td></tr>
<tr><th>Netzmaske</th><td>${a.maske}</td><td class="sn-bits">${teile(a.binaer.maske)}</td></tr>
<tr class="sn-und"><th>UND ergibt die Netzadresse</th><td>${a.netz}</td><td class="sn-bits">${teile(a.binaer.netz)}</td></tr>
</table>
<p class="sn-legende"><span class="sn-n">■</span> Netzteil (/${a.suffix}: ${a.suffix} Bit, bei allen im Netz gleich) · <span class="sn-h">■</span> Geräteteil (${32 - a.suffix} Bit, frei wählbar)</p>`;
}

function rechner() {
  const el = wurzel.querySelector('.sn-rechner');
  el.innerHTML = `<h2>Rechner</h2>
<form class="sn-form"><label>IP-Adresse <input name="ip" value="192.168.17.189" spellcheck="false" autocomplete="off"></label>
<label>Netzmaske oder Suffix <input name="maske" value="255.255.255.0" spellcheck="false" autocomplete="off"></label></form>
<div class="sn-ergebnis" aria-live="polite"></div>`;
  const f = el.querySelector('form');
  const zeige = () => {
    const aus = el.querySelector('.sn-ergebnis');
    let m = f.elements.maske.value.trim();
    if (/^\/?\d{1,2}$/.test(m)) { const n = Number(m.replace('/', '')); if (n <= 32) m = [24, 16, 8, 0].map((s) => ((n === 0 ? 0 : (0xffffffff << (32 - n)) >>> 0) >>> s) & 255).join('.'); }
    try {
      const a = analysiere(f.elements.ip.value, m);
      aus.innerHTML = `${binaerZeilen(a)}
<dl class="sn-werte">
<dt>Netzadresse</dt><dd>${a.netz}/${a.suffix}</dd>
<dt>Broadcast-Adresse</dt><dd>${a.broadcast}</dd>
<dt>Adressen für Geräte</dt><dd>${a.erste} bis ${a.letzte}</dd>
<dt>Anzahl Geräte</dt><dd>${a.geraete.toLocaleString('de-DE')} (2<sup>${32 - a.suffix}</sup> = ${a.adressen.toLocaleString('de-DE')} Adressen${a.suffix < 31 ? ', davon zwei reserviert' : ''})</dd>
</dl>`;
    } catch (err) { aus.innerHTML = `<p class="sn-falsch">${esc(err.message)}</p>`; }
  };
  f.addEventListener('input', zeige);
  f.addEventListener('submit', (e) => e.preventDefault());
  zeige();
}

function trainer() {
  const el = wurzel.querySelector('.sn-trainer');
  el.innerHTML = `<h2>Üben</h2>
<fieldset class="sn-einstellungen"><legend>Aufgaben</legend>
${Object.entries(ARTEN).map(([k, t], i) => `<label><input type="radio" name="art" value="${k}"${i === 0 ? ' checked' : ''}> ${t}</label>`).join('')}
<label class="sn-krumm"><input type="checkbox" name="krumm"> auch „krumme“ Netzmasken (z. B. 255.255.248.0)</label>
</fieldset>
<div class="sn-aufgabe" aria-live="polite"></div>
<form class="sn-antwort"><input name="antwort" autocomplete="off" spellcheck="false" aria-label="Deine Antwort"><button class="knopf primaer">Prüfen</button></form>
<div class="sn-jn" hidden><button type="button" class="knopf" data-jn="ja">Ja, gleiches Subnetz</button> <button type="button" class="knopf" data-jn="nein">Nein</button></div>
<div class="sn-rueckmeldung" aria-live="polite"></div>
<p class="sn-leiste"><button type="button" class="knopf sn-neu">Neue Aufgabe</button> <span class="sn-zaehler"></span></p>`;
  let aufgabe;
  let richtig = 0;
  let gesamt = 0;
  let beantwortet = false;
  const art = () => el.querySelector('[name="art"]:checked').value;
  const neu = () => {
    aufgabe = neueAufgabe(art(), { krumm: el.querySelector('[name="krumm"]').checked });
    beantwortet = false;
    el.querySelector('.sn-aufgabe').innerHTML = `<p>${esc(aufgabe.frage)}</p>`;
    const jn = aufgabe.art === 'gleich';
    el.querySelector('.sn-jn').hidden = !jn;
    el.querySelector('.sn-antwort').hidden = jn;
    el.querySelector('.sn-rueckmeldung').innerHTML = '';
    const feld = el.querySelector('[name="antwort"]');
    feld.value = '';
    feld.placeholder = aufgabe.art === 'anzahl' ? 'Zahl' : aufgabe.art === 'suffix' && aufgabe.loesung.startsWith('/') ? 'z. B. /24' : 'z. B. 192.168.0.0';
    if (!jn) feld.focus({ preventScroll: true });
  };
  const bewerte = (antwort) => {
    if (beantwortet) return;
    beantwortet = true;
    const ok = pruefeAntwort(aufgabe, antwort);
    gesamt++; if (ok) richtig++;
    const a = aufgabe.analyse;
    let erklaerung = binaerZeilen(a);
    if (aufgabe.art === 'gleich') {
      const z = analysiere(aufgabe.ziel, aufgabe.maske);
      erklaerung += `<p>Netzadresse der Ziel-IP ${aufgabe.ziel}: <strong>${z.netz}</strong> – ${z.netz === a.netz ? 'gleich, also dasselbe Subnetz: direkt zustellen.' : 'verschieden, also ein anderes Subnetz: ab zum Gateway.'}</p>`;
    }
    if (aufgabe.art === 'anzahl') erklaerung += `<p>${32 - a.suffix} Bit für den Geräteteil: 2<sup>${32 - a.suffix}</sup> = ${a.adressen.toLocaleString('de-DE')} Adressen, minus Netz- und Broadcast-Adresse.</p>`;
    if (aufgabe.art === 'broadcast') erklaerung += '<p>Broadcast-Adresse: Im Geräteteil stehen nur Einsen.</p>';
    el.querySelector('.sn-rueckmeldung').innerHTML = `<p class="${ok ? 'sn-richtig' : 'sn-falsch'}">${ok ? 'Richtig!' : `Leider nicht. Richtig ist: <strong>${esc(aufgabe.loesung)}</strong>`}</p>${erklaerung}`;
    el.querySelector('.sn-zaehler').textContent = `${richtig} von ${gesamt} richtig`;
  };
  el.querySelector('.sn-antwort').addEventListener('submit', (e) => { e.preventDefault(); bewerte(el.querySelector('[name="antwort"]').value); });
  el.querySelectorAll('[data-jn]').forEach((b) => b.addEventListener('click', () => bewerte(b.dataset.jn)));
  el.querySelector('.sn-neu').addEventListener('click', neu);
  el.querySelector('.sn-einstellungen').addEventListener('change', neu);
  neu();
}

wurzel.innerHTML = '<section class="sn-trainer werkzeug"></section><section class="sn-rechner werkzeug"></section>';
trainer();
rechner();
