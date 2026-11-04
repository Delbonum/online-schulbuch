// Online-Schulbuch: Menü, Suche und nachladbare Einbettungen.
(() => {
  const BASIS = window.SCHULBUCH_BASIS || '/';

  // ---------------------------------------------------------- Kurzlink kopieren
  document.querySelectorAll('[data-kopieren]').forEach((knopf) => {
    knopf.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(knopf.dataset.kopieren);
        knopf.textContent = 'kopiert ✓';
      } catch {
        knopf.textContent = 'bitte markieren';
      }
      setTimeout(() => { knopf.textContent = 'kopieren'; }, 2000);
    });
  });

  // ---------------------------------------------------------- Fotos groß anzeigen (data-gross = größere Datei)
  document.querySelectorAll('figure.foto img').forEach((bild) => {
    bild.tabIndex = 0;
    bild.title = 'Zum Vergrößern klicken';
    const zeige = () => {
      const dialog = document.createElement('dialog');
      dialog.className = 'bild-gross';
      const gross = document.createElement('img');
      gross.src = bild.dataset.gross || bild.src;
      gross.alt = bild.alt;
      dialog.append(gross);
      const unterschrift = bild.closest('figure').querySelector('figcaption');
      if (unterschrift) {
        const p = document.createElement('p');
        p.innerHTML = unterschrift.innerHTML;
        dialog.append(p);
        dialog.style.setProperty('--bild-unterschrift', '6em');
      }
      dialog.addEventListener('click', (e) => { if (!e.target.closest('a')) dialog.close(); });
      dialog.addEventListener('close', () => { dialog.remove(); bild.focus(); });
      document.body.append(dialog);
      dialog.showModal();
    };
    bild.addEventListener('click', zeige);
    bild.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); zeige(); } });
  });

  // ---------------------------------------------------------- Kapitel auf- und zuklappen
  document.querySelectorAll('.nav-auf').forEach((knopf) => {
    knopf.addEventListener('click', () => {
      const gruppe = knopf.closest('.gruppe');
      const offen = gruppe.classList.toggle('offen');
      knopf.setAttribute('aria-expanded', String(offen));
    });
  });

  // ---------------------------------------------------------- Menü-Schublade
  const leiste = document.getElementById('seitenleiste');
  const menueKnopf = document.querySelector('.menue-knopf');
  let schleier = null;

  function menue(offen) {
    if (!leiste || !menueKnopf) return;
    leiste.classList.toggle('offen', offen);
    menueKnopf.setAttribute('aria-expanded', String(offen));
    if (offen && !schleier) {
      schleier = document.createElement('div');
      schleier.className = 'schleier';
      schleier.addEventListener('click', () => menue(false));
      document.body.append(schleier);
      (leiste.querySelector('[aria-current]') || leiste.querySelector('a'))?.focus();
    } else if (!offen && schleier) {
      schleier.remove();
      schleier = null;
      menueKnopf.focus();
    }
  }
  menueKnopf?.addEventListener('click', () => menue(!leiste.classList.contains('offen')));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && leiste?.classList.contains('offen')) menue(false);
  });
  // Aktuelle Seite in der Seitenleiste sichtbar machen (nur die Leiste scrollen, nicht die Seite)
  const aktuell = leiste?.querySelector('[aria-current]');
  if (aktuell) {
    const oben = aktuell.getBoundingClientRect().top - leiste.getBoundingClientRect().top;
    leiste.scrollTop = Math.max(0, oben - leiste.clientHeight / 2);
  }

  // ---------------------------------------------------------- Einbettungen erst nach Klick laden
  document.querySelectorAll('[data-einbettung-laden]').forEach((knopf) => {
    knopf.addEventListener('click', () => {
      const figur = knopf.closest('.einbettung');
      const rahmen = document.createElement('iframe');
      rahmen.src = figur.dataset.src;
      rahmen.title = 'Interaktive Übung';
      rahmen.loading = 'lazy';
      rahmen.allow = 'fullscreen';
      rahmen.setAttribute('allowfullscreen', '');
      figur.replaceChildren(rahmen);
    });
  });

  // ---------------------------------------------------------- Inhalte für Lehrkräfte
  // Der Build verschlüsselt alles in <lehrkraft> mit AES-GCM. Den Schlüssel gibt die Schulbuch-API
  // (dieselbe wie beim KryptoGAME) nur an angemeldete Lehrkräfte heraus; gemerkt wird nur der Schlüssel,
  // nie das Passwort. Wer schon im KryptoGAME als Lehrkraft angemeldet ist, braucht kein Passwort mehr.
  const lkLink = document.querySelector('[data-lk-pruef]');
  if (lkLink) {
    const SPEICHER = 'schulbuch-lehrkraft';
    const API = lkLink.dataset.api;
    const b64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
    const lies = () => { try { return sessionStorage.getItem(SPEICHER) || localStorage.getItem(SPEICHER); } catch { return null; } };
    const vergiss = () => { try { sessionStorage.removeItem(SPEICHER); localStorage.removeItem(SPEICHER); } catch { /* egal */ } };
    const merke = (schluessel, dauerhaft) => {
      try { (dauerhaft ? localStorage : sessionStorage).setItem(SPEICHER, schluessel); } catch { /* gilt dann nur für diese Seite */ }
    };

    // Lehrkraft-Ansicht ein-/ausschalten, ohne sich abzumelden (z. B. für den Beamer); gilt für alle Seiten
    const ANSICHT = 'schulbuch-lehrkraft-ansicht';
    const schalter = document.querySelector('.lk-schalter');
    function ansicht(an) {
      document.documentElement.classList.toggle('lehrkraft-aus', !an);
      schalter?.setAttribute('aria-checked', String(an));
    }
    try { ansicht(localStorage.getItem(ANSICHT) !== 'aus'); } catch { ansicht(true); }
    schalter?.addEventListener('click', () => {
      const an = document.documentElement.classList.contains('lehrkraft-aus');
      ansicht(an);
      try { an ? localStorage.removeItem(ANSICHT) : localStorage.setItem(ANSICHT, 'aus'); } catch { /* gilt dann nur für diese Seite */ }
    });

    // Anfrage an die Schulbuch-API; Fehler tragen den HTTP-Status (0 = Server nicht erreichbar).
    async function anfrage(methode, pfad, daten) {
      let antwort;
      try {
        antwort = await fetch(API + pfad, {
          method: methode,
          credentials: 'same-origin',
          headers: { Accept: 'application/json', ...(daten && { 'Content-Type': 'application/json' }) },
          body: daten && JSON.stringify(daten),
        });
      } catch {
        throw Object.assign(new Error('Der Server ist nicht erreichbar.'), { status: 0 });
      }
      const json = antwort.status === 204 ? null : await antwort.json().catch(() => null);
      if (!antwort.ok) throw Object.assign(new Error(json?.error || `Serverfehler (${antwort.status}).`), { status: antwort.status });
      return json;
    }

    async function entschluessle(schluessel, wert) {
      const [iv, daten] = wert.split('.');
      const klar = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(iv) }, schluessel, b64(daten));
      return new TextDecoder().decode(klar);
    }

    // Wirft einen Fehler, wenn der Schlüssel nicht passt (GCM prüft die Echtheit mit).
    async function freischalten(schluesselB64) {
      const schluessel = await crypto.subtle.importKey('raw', b64(schluesselB64), 'AES-GCM', false, ['decrypt']);
      await entschluessle(schluessel, lkLink.dataset.lkPruef);
      for (const box of document.querySelectorAll('.lehrkraft[data-lk]')) {
        const html = await entschluessle(schluessel, box.dataset.lk);
        const titel = box.querySelector('.box-titel');
        box.classList.remove('gesperrt');
        box.removeAttribute('data-lk');
        box.replaceChildren(titel);
        box.insertAdjacentHTML('beforeend', html);
      }
      document.documentElement.classList.add('lehrkraft-modus');
      lkLink.textContent = 'Lehrkraft abmelden';
      lkLink.setAttribute('aria-pressed', 'true');
    }

    let lkDialog = null;
    function dialogZeigen() {
      if (!lkDialog) {
        lkDialog = document.createElement('dialog');
        lkDialog.className = 'lk-dialog';
        lkDialog.innerHTML = `<form method="dialog">
<h2>Anmeldung für Lehrkräfte</h2>
<p>Mit deinem Lehrkräfte-Konto siehst du Lehrerhinweise und Lösungsvorschläge und nutzt die Werkzeuge
(z. B. das KryptoGAME) im Lehrkraft-Modus.</p>
<label class="sr" for="lk-name">Benutzername</label>
<input id="lk-name" type="text" autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="Benutzername" required>
<label class="sr" for="lk-passwort">Passwort</label>
<input id="lk-passwort" type="password" autocomplete="current-password" placeholder="Passwort" required>
<p><label><input type="checkbox" class="lk-merken"> auf diesem Gerät angemeldet bleiben</label></p>
<p class="lk-fehler" aria-live="polite"></p>
<div class="lk-knoepfe"><button type="button" class="knopf lk-abbrechen">Abbrechen</button><button type="submit" class="knopf primaer">Anmelden</button></div>
<p class="lk-zusatz">Noch kein Konto? <a href="/informatik/kryptogame/registrieren" target="_blank" rel="noopener">Zugang beantragen</a></p>
</form>`;
        document.body.append(lkDialog);
        const name = lkDialog.querySelector('#lk-name');
        const passwort = lkDialog.querySelector('#lk-passwort');
        const fehler = lkDialog.querySelector('.lk-fehler');
        lkDialog.querySelector('.lk-abbrechen').addEventListener('click', () => lkDialog.close());
        lkDialog.querySelector('form').addEventListener('submit', async (e) => {
          e.preventDefault();
          fehler.textContent = 'Einen Moment …';
          try {
            const { user } = await anfrage('POST', '/auth/login', { username: name.value.trim(), password: passwort.value });
            if (user.role !== 'teacher') {
              await anfrage('POST', '/auth/logout', {}).catch(() => {});
              throw new Error('Das ist kein Konto für Lehrkräfte.');
            }
            const { key } = await anfrage('GET', '/teacher-content/key');
            await freischalten(key);
            merke(key, lkDialog.querySelector('.lk-merken').checked);
            passwort.value = '';
            fehler.textContent = '';
            lkDialog.close();
          } catch (err) {
            fehler.textContent = err.status === 401 ? 'Benutzername oder Passwort stimmen nicht.' : err.message;
            passwort.select();
          }
        });
      }
      lkDialog.showModal();
    }

    async function anmelden() {
      if (!window.crypto?.subtle) {
        alert('Die Anmeldung funktioniert nur über eine sichere Verbindung (https).');
        return;
      }
      // Schon angemeldet (z. B. im KryptoGAME)? Dann gleich freischalten, sonst nach dem Passwort fragen.
      try {
        const { key } = await anfrage('GET', '/teacher-content/key');
        await freischalten(key);
        merke(key, false);
      } catch {
        dialogZeigen();
      }
    }

    async function abmelden() {
      vergiss();
      await anfrage('POST', '/auth/logout', {}).catch(() => {});
      location.reload();
    }

    document.addEventListener('click', (e) => {
      const ausloeser = e.target.closest('[data-lk-anmelden]');
      if (!ausloeser) return;
      e.preventDefault();
      if (document.documentElement.classList.contains('lehrkraft-modus')) {
        if (ausloeser === lkLink) abmelden();
      } else {
        anmelden();
      }
    });

    const gemerkt = lies();
    if (gemerkt && window.crypto?.subtle) freischalten(gemerkt).catch(vergiss);
  }

  // ---------------------------------------------------------- Suche
  const dialog = document.querySelector('dialog.suche');
  if (!dialog) return;
  const eingabe = dialog.querySelector('input');
  const liste = dialog.querySelector('.suche-treffer');
  let index = null;
  let treffer = [];
  let gewaehlt = 0;

  const norm = (s) => s.toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFD').replace(/[̀-ͯ]/g, '');
  const escHtml = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  async function ladeIndex() {
    if (index) return index;
    const antwort = await fetch(`${BASIS}suche.json`);
    index = (await antwort.json()).map((e) => ({ ...e, nt: norm(e.t), nx: norm(e.x), nk: norm(e.k || '') }));
    return index;
  }

  function oeffnen() {
    if (dialog.open) return;
    dialog.showModal();
    eingabe.select();
    ladeIndex().then(suchen).catch(() => {
      liste.innerHTML = '<p class="suche-leer">Die Suche konnte nicht geladen werden.</p>';
    });
  }

  // Ausschnitt rund um den ersten Treffer, Fundstellen markiert
  function ausschnitt(text, woerter) {
    const n = norm(text);
    let pos = -1;
    for (const w of woerter) { const p = n.indexOf(w); if (p >= 0 && (pos < 0 || p < pos)) pos = p; }
    if (pos < 0) return escHtml(text.slice(0, 140)) + (text.length > 140 ? ' …' : '');
    const start = Math.max(0, pos - 60);
    let s = (start > 0 ? '… ' : '') + text.slice(start, start + 170) + (start + 170 < text.length ? ' …' : '');
    s = escHtml(s);
    for (const w of woerter) {
      if (w.length < 2) continue;
      // Markierung auf dem Originaltext: einfache, umlauttolerante Suche
      const muster = w.replace(/ae/g, '(?:ae|ä)').replace(/oe/g, '(?:oe|ö)').replace(/ue/g, '(?:ue|ü)').replace(/ss/g, '(?:ss|ß)');
      s = s.replace(new RegExp(`(${muster})`, 'gi'), '<mark>$1</mark>');
    }
    return s;
  }

  function suchen() {
    if (!index) return;
    const woerter = norm(eingabe.value).split(/\s+/).filter(Boolean);
    if (!woerter.length) {
      liste.innerHTML = '<p class="suche-leer">Suchbegriff eingeben – z. B. „Romantik“, „Lyrik“ oder „KI“.</p>';
      treffer = [];
      return;
    }
    treffer = index.map((e) => {
      let punkte = 0;
      for (const w of woerter) {
        const imTitel = e.nt.includes(w);
        const imText = e.nx.includes(w) || e.nk.includes(w);
        if (!imTitel && !imText) return null;
        punkte += (imTitel ? 10 : 0) + (e.nt.startsWith(w) ? 5 : 0) + (imText ? 1 + Math.min(5, e.nx.split(w).length - 1) : 0);
      }
      return { e, punkte };
    }).filter(Boolean).sort((a, b) => b.punkte - a.punkte).slice(0, 12).map((t) => t.e);
    gewaehlt = 0;
    if (!treffer.length) {
      liste.innerHTML = '<p class="suche-leer">Keine Treffer.</p>';
      return;
    }
    liste.innerHTML = treffer.map((e, i) => `<a href="${e.u}"${i === 0 ? ' class="gewaehlt"' : ''}>
<div class="treffer-ort">${escHtml([e.f, e.k].filter(Boolean).join(' · '))}</div>
<div class="treffer-titel">${escHtml(e.t)}</div>
<div class="treffer-text">${ausschnitt(e.x, woerter)}</div></a>`).join('');
  }

  function waehle(i) {
    const links = [...liste.querySelectorAll('a')];
    if (!links.length) return;
    gewaehlt = (i + links.length) % links.length;
    links.forEach((a, j) => a.classList.toggle('gewaehlt', j === gewaehlt));
    links[gewaehlt].scrollIntoView({ block: 'nearest' });
  }

  eingabe.addEventListener('input', suchen);
  eingabe.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); waehle(gewaehlt + 1); }
    if (e.key === 'ArrowUp') { e.preventDefault(); waehle(gewaehlt - 1); }
    if (e.key === 'Enter' && treffer[gewaehlt]) { e.preventDefault(); location.href = treffer[gewaehlt].u; }
  });
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
  document.querySelectorAll('[data-suche-oeffnen]').forEach((k) => k.addEventListener('click', oeffnen));
  document.addEventListener('keydown', (e) => {
    const tippt = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName) || document.activeElement?.isContentEditable;
    if ((e.key === '/' && !tippt) || (e.key.toLowerCase() === 'k' && (e.ctrlKey || e.metaKey))) {
      e.preventDefault();
      oeffnen();
    }
  });
})();
