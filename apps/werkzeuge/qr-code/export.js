// Gemeinsame Hilfen der QR-Werkzeuge: Matrix <-> Text und Export als PNG/SVG.

export const N = 21;
export const QZ = 4; // Ruhezone (quiet zone) in Modulen
export const idx = (r, c) => r * N + c;

export function matrixToString(modules) {
  const out = [];
  for (let r = 0; r < N; r++) {
    let s = '';
    for (let c = 0; c < N; c++) s += modules[idx(r, c)] ? '1' : '0';
    out.push(s);
  }
  return out.join('\n');
}

// Liefert ein Array der Länge N*N oder null, wenn der Text keine 21×21-Matrix ist.
export function parseMatrix(text) {
  const lines = text.trim().split(/\n+/).map((l) => l.trim());
  if (lines.length !== N || lines.some((l) => l.length < N)) return null;
  const m = new Array(N * N).fill(0);
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) m[idx(r, c)] = lines[r][c] === '1' ? 1 : 0;
  return m;
}

function download(url, name) {
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
}

export function exportPng(modules, name) {
  const scale = 20;
  const size = (N + 2 * QZ) * scale;
  const cvs = document.createElement('canvas');
  cvs.width = size;
  cvs.height = size;
  const ctx = cvs.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = '#000';
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    if (modules[idx(r, c)] === 1) ctx.fillRect((c + QZ) * scale, (r + QZ) * scale, scale, scale);
  }
  download(cvs.toDataURL('image/png'), name);
}

export function exportSvg(modules, name) {
  const total = N + 2 * QZ;
  let svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${total * 10}' height='${total * 10}' viewBox='0 0 ${total} ${total}'>`;
  svg += "<rect width='100%' height='100%' fill='white'/>";
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    if (modules[idx(r, c)] === 1) svg += `<rect x='${c + QZ}' y='${r + QZ}' width='1' height='1' fill='black'/>`;
  }
  svg += '</svg>';
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  download(url, name);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Legt N*N Zellen in einem Raster-Element an.
export function createGrid(container, tag = 'div') {
  container.replaceChildren();
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const cell = document.createElement(tag);
    if (tag === 'button') cell.type = 'button';
    cell.className = 'qr-zelle';
    cell.dataset.r = r;
    cell.dataset.c = c;
    container.append(cell);
  }
}
