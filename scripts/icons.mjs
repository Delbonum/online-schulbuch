// Einfache Linien-Icons (24×24, Strichfarbe = currentColor).
const P = {
  buch: '<path d="M3 5.5C5.5 4 8.5 4 12 6c3.5-2 6.5-2 9-.5V19c-2.5-1.5-5.5-1.5-9 .5-3.5-2-6.5-2-9-.5z"/><path d="M12 6v13.5"/>',
  feder: '<path d="M20 4c-7 0-12 5-13 12l-2 4"/><path d="M20 4c0 7-5 12-12 12"/><path d="M9 15l4-4"/>',
  stammbaum: '<g stroke-width="1.45"><circle cx="12" cy="4.5" r="2"/><path d="M12 6.5V9M5 11V9h14v2M12 9v2"/><circle cx="5" cy="13" r="2"/><circle cx="12" cy="13" r="2"/><circle cx="19" cy="13" r="2"/><path d="M12 15v2M8.5 19v-2h7v2"/><circle cx="8.5" cy="20.3" r="1.6"/><circle cx="15.5" cy="20.3" r="1.6"/></g>',
  zeitstrahl: '<g stroke-width="1.4"><path d="M2 12h20M19.5 9.5L22 12l-2.5 2.5"/><circle cx="5" cy="12" r="1.5" fill="currentColor"/><circle cx="10.5" cy="12" r="1.5" fill="currentColor"/><circle cx="16" cy="12" r="1.5" fill="currentColor"/><path d="M5 10V6.5M10.5 14v3.5M16 10V6.5"/></g>',
  grammatik: '<path d="M3.5 18l4.5-12L12.5 18M5.2 14h5.6"/><path d="M14.6 10.8c.8-.9 1.8-1.3 3-1.3 2 0 2.9 1.1 2.9 3V18M20.5 13.3c-3.8 0-6.3.8-6.3 2.6 0 1.4 1 2.3 2.6 2.3 2.4 0 3.7-1.6 3.7-3.6"/>',
  chip: '<rect x="6" y="6" width="12" height="12" rx="2"/><rect x="9.5" y="9.5" width="5" height="5"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>',
  binaer: '<g stroke-width="1.4"><path d="M5 4v6M3.5 4.6 5 4M15.5 4.6 17 4M17 4v6"/><rect x="9.5" y="4" width="3" height="6" rx="1.5"/><rect x="3.5" y="14" width="3" height="6" rx="1.5"/><path d="M11 14v6M9.5 14.6 11 14"/><rect x="15.5" y="14" width="3" height="6" rx="1.5"/></g>',
  code: '<path d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/>',
  algorithmus: '<rect x="8" y="2.5" width="8" height="4.5" rx="1"/><path d="M12 7v3"/><path d="M12 10l4.5 3-4.5 3-4.5-3z"/><path d="M7.5 13H4v5M16.5 13H20v5"/><rect x="2" y="18" width="4" height="3.5" rx=".8"/><rect x="18" y="18" width="4" height="3.5" rx=".8"/>',
  rechner: '<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M8 20h8M12 16v4"/>',
  netzwerk: '<circle cx="12" cy="5" r="2.5"/><circle cx="5" cy="19" r="2.5"/><circle cx="19" cy="19" r="2.5"/><path d="M10.7 7.2L6.3 16.8M13.3 7.2l4.4 9.6M7.5 19h9"/>',
  schloss: '<rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/><path d="M12 14.5v2.5"/>',
  automat: '<g stroke-width="1.4"><path d="M1 12h2.6M2.2 10.6 3.6 12l-1.4 1.4"/><circle cx="7" cy="12" r="3.2"/><path d="M10.4 12h3.6M12.6 10.6 14 12l-1.4 1.4"/><circle cx="17.6" cy="12" r="3.3"/><circle cx="17.6" cy="12" r="2"/></g>',
  ki: '<path d="M9 3.5a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 6 1.5V5a2 2 0 0 0-3-1.5z"/><path d="M15 3.5a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-6 1.5"/><path d="M12 9h2.5M12 14h3"/>',
  datenbank: '<ellipse cx="12" cy="5.5" rx="7.5" ry="2.5"/><path d="M4.5 5.5v13c0 1.4 3.4 2.5 7.5 2.5s7.5-1.1 7.5-2.5v-13M4.5 12c0 1.4 3.4 2.5 7.5 2.5s7.5-1.1 7.5-2.5"/>',
  gesellschaft: '<circle cx="8" cy="8" r="3"/><circle cx="16.5" cy="9" r="2.5"/><path d="M2.5 19c.5-3.5 2.8-5.5 5.5-5.5s5 2 5.5 5.5M14 14.2c.8-.5 1.6-.7 2.5-.7 2.3 0 4.2 1.8 4.5 5"/>',
  werkzeug: '<g stroke-width="1.45"><g transform="rotate(-45 12 12)"><path d="M12 2.5v7.5"/><rect x="10.2" y="12" width="3.6" height="9.5" rx="1.6"/><path d="M10.6 10h2.8"/></g><path d="M15.4 3a3.6 3.6 0 0 0-3.4 4.9L3.4 16.5a1.6 1.6 0 0 0 2.3 2.3l8.6-8.6a3.6 3.6 0 0 0 4.9-3.4c0-.4 0-.8-.2-1.1l-2 2-1.9-.5-.5-1.9 2-2c-.3-.1-.7-.2-1.2-.2z"/></g>',
  extern: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  lehrkraft: '<rect x="10" y="3" width="11.5" height="8.5" rx="1"/><path d="M13 6.2h5.5M13 8.8h3"/><circle cx="5.5" cy="9" r="2.5"/><path d="M1.5 21v-3.5a3.5 3.5 0 0 1 3.5-3.5h3l4-3.5"/><path d="M8 14.5V21"/>',
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
  buecher: '<rect x="3" y="4" width="4" height="16" rx=".8"/><rect x="8.5" y="6" width="4" height="14" rx=".8"/><path d="M14.2 7.4l3.8-1 3.6 13.4-3.8 1z"/><path d="M3 8h4M8.5 9.5h4"/>',
  person: '<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5c.8-4 3.8-6.5 7.5-6.5s6.7 2.5 7.5 6.5"/>',
  maske: '<path d="M3 4.5c3 1.3 7 1.3 10 0v6a5 5 0 0 1-10 0z"/><path d="M5.5 8.2h1.6M8.9 8.2h1.6M6 11.6c1.1.8 2.9.8 4 0"/><path d="M15.2 8.6c2 .5 3.9.3 5.8-.6v6a5 5 0 0 1-7.6 4.2"/><path d="M16.6 12.2h1.2M19.2 11.9h.8M17 16.3c.7-.5 1.8-.6 2.6-.1"/>',
  waage: '<path d="M12 3v17M7 20h10M5 6h14M12 4.5l-.01 0"/><path d="M5 6l-3 7h6zM19 6l-3 7h6z"/>',
  kolben: '<path d="M9.5 3h5M10 3v6l-5.2 9.2A1.9 1.9 0 0 0 6.5 21h11a1.9 1.9 0 0 0 1.7-2.8L14 9V3"/><path d="M7.2 15h9.6"/>',
  wolke: '<path d="M7 18.5h10.5a4 4 0 0 0 .4-8A5.5 5.5 0 0 0 7.4 9 4.8 4.8 0 0 0 7 18.5z"/>',
  parabel: '<path d="M4 4c1.5 9 4.5 14 8 14s6.5-5 8-14"/><path d="M12 3v17" stroke-dasharray="2 2.5"/>',
  buehne: '<path d="M3 4h18M4 4v16M20 4v16"/><path d="M4 4c1 4 3 6 5.5 6.5M20 4c-1 4-3 6-5.5 6.5"/><path d="M2.5 20h19M8 16.5h8"/>',
  note: '<path d="M9 18V5.5l11-2.5v12.5"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="15.5" r="2.5"/><path d="M9 9.5l11-2.5"/>',
  frage: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.3a2.6 2.6 0 0 1 5 .9c0 1.8-2.5 2.2-2.5 3.8M12 17v.5"/>',
  weltkugel: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.7 5.6 3.7 9s-1.2 6.4-3.7 9c-2.5-2.6-3.7-5.6-3.7-9S9.5 5.6 12 3z"/>',
  sprechblase: '<path d="M4 5.5h12a1.5 1.5 0 0 1 1.5 1.5v7a1.5 1.5 0 0 1-1.5 1.5H9l-4 3.5v-3.5H4A1.5 1.5 0 0 1 2.5 14V7A1.5 1.5 0 0 1 4 5.5z"/><path d="M20 9.5h.5A1.5 1.5 0 0 1 22 11v6a1.5 1.5 0 0 1-1.5 1.5H20V21l-3-2.5h-4"/>',
}

export function icon(name, cls = 'icon') {
  const p = P[name];
  if (!p) throw new Error(`Unbekanntes Icon: ${name}`);
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
}

export const ICONS = Object.keys(P);
