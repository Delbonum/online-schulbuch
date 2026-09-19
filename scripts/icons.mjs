// Einfache Linien-Icons (24×24, Strichfarbe = currentColor).
const P = {
  buch: '<path d="M3 5.5C5.5 4 8.5 4 12 6c3.5-2 6.5-2 9-.5V19c-2.5-1.5-5.5-1.5-9 .5-3.5-2-6.5-2-9-.5z"/><path d="M12 6v13.5"/>',
  feder: '<path d="M20 4c-7 0-12 5-13 12l-2 4"/><path d="M20 4c0 7-5 12-12 12"/><path d="M9 15l4-4"/>',
  zeitstrahl: '<path d="M3 12h18"/><circle cx="6" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="18" cy="12" r="2"/><path d="M6 6v4M12 14v4M18 6v4"/>',
  grammatik: '<path d="M4 18l4.5-12L13 18M5.7 14h5.6"/><path d="M15 12.5c.6-1 1.6-1.5 2.7-1.5 1.7 0 2.8 1 2.8 2.7V18M20.5 15c-3.5 0-5.5.5-5.5 1.8 0 .8.7 1.4 1.9 1.4 2 0 3.6-1.2 3.6-3.2"/>',
  chip: '<rect x="6" y="6" width="12" height="12" rx="2"/><rect x="9.5" y="9.5" width="5" height="5"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>',
  binaer: '<path d="M5 4v6M3.5 4H5M9.5 4h3v6h-3zM17 4v6M15.5 4H17"/><path d="M4 14h3v6H4zM10.5 14v6M9 14h1.5M15 14h3v6h-3z"/>',
  code: '<path d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/>',
  algorithmus: '<rect x="8" y="2.5" width="8" height="4.5" rx="1"/><path d="M12 7v3"/><path d="M12 10l4.5 3-4.5 3-4.5-3z"/><path d="M7.5 13H4v5M16.5 13H20v5"/><rect x="2" y="18" width="4" height="3.5" rx=".8"/><rect x="18" y="18" width="4" height="3.5" rx=".8"/>',
  rechner: '<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M8 20h8M12 16v4"/>',
  netzwerk: '<circle cx="12" cy="5" r="2.5"/><circle cx="5" cy="19" r="2.5"/><circle cx="19" cy="19" r="2.5"/><path d="M10.7 7.2L6.3 16.8M13.3 7.2l4.4 9.6M7.5 19h9"/>',
  schloss: '<rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/><path d="M12 14.5v2.5"/>',
  automat: '<circle cx="6" cy="12" r="3"/><circle cx="18" cy="12" r="3"/><circle cx="18" cy="12" r="1.6"/><path d="M9 11c2-1.5 4-1.5 6 0M13.5 9.8l1.5 1.2-1.7.9"/><path d="M1 12h2"/>',
  ki: '<path d="M9 3.5a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 6 1.5V5a2 2 0 0 0-3-1.5z"/><path d="M15 3.5a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-6 1.5"/><path d="M12 9h2.5M12 14h3"/>',
  datenbank: '<ellipse cx="12" cy="5.5" rx="7.5" ry="2.5"/><path d="M4.5 5.5v13c0 1.4 3.4 2.5 7.5 2.5s7.5-1.1 7.5-2.5v-13M4.5 12c0 1.4 3.4 2.5 7.5 2.5s7.5-1.1 7.5-2.5"/>',
  gesellschaft: '<circle cx="8" cy="8" r="3"/><circle cx="16.5" cy="9" r="2.5"/><path d="M2.5 19c.5-3.5 2.8-5.5 5.5-5.5s5 2 5.5 5.5M14 14.2c.8-.5 1.6-.7 2.5-.7 2.3 0 4.2 1.8 4.5 5"/>',
  werkzeug: '<path d="M14.5 6.5a4 4 0 0 0 5 5L21 13l-8 8-3-3 8-8-1.5-1.5a4 4 0 0 0-5-5l2.5 2.5-2 2z" transform="rotate(0)"/><path d="M4 20l6-6"/>',
  extern: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  suche: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
  menue: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  schliessen: '<path d="M6 6l12 12M18 6L6 18"/>',
  chevron: '<path d="M9 5l7 7-7 7"/>',
  pfeilLinks: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  pfeilRechts: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  hinweis: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  aufgabe: '<path d="M14.5 4.5l5 5L9 20H4v-5z"/><path d="M12.5 6.5l5 5"/>',
  spiel: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.3"/><circle cx="15.5" cy="15.5" r="1.3"/><circle cx="15.5" cy="8.5" r="1.3"/><circle cx="8.5" cy="15.5" r="1.3"/>',
  qr: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM18 18h3v3M14 20h1M20 14v1"/>',
}

export function icon(name, cls = 'icon') {
  const p = P[name];
  if (!p) throw new Error(`Unbekanntes Icon: ${name}`);
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
}

export const ICONS = Object.keys(P);
