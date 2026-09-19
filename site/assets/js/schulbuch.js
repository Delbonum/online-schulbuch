// Online-Schulbuch: Menü, Suche und nachladbare Einbettungen.
(() => {
  const BASIS = window.SCHULBUCH_BASIS || '/';

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
