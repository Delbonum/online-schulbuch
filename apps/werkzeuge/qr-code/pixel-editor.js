// QR-Code Pixel-Editor (21×21, Version 1): Module per Klick schwarz/weiß färben.
import { N, idx, matrixToString, parseMatrix, exportPng, exportSvg, createGrid } from './export.js';

const gridEl = document.getElementById('grid');
const matrixText = document.getElementById('matrixText');
const editReserved = document.getElementById('editReserved');
const showCoords = document.getElementById('showCoords');

let modules = [];
let reserved = [];

// Positionsmarker, Synchronisationslinien und „dunkles Modul“ vorbelegen und schützen
function initMatrix() {
  modules = new Array(N * N).fill(0);
  reserved = new Array(N * N).fill(false);
  const placeFinder = (rs, cs) => {
    for (let r = 0; r < 7; r++) for (let c = 0; c < 7; c++) {
      const k = idx(rs + r, cs + c);
      reserved[k] = true;
      if (r === 0 || r === 6 || c === 0 || c === 6) modules[k] = 1;
      else if (r === 1 || r === 5 || c === 1 || c === 5) modules[k] = 0;
      else modules[k] = 1;
    }
  };
  placeFinder(0, 0);
  placeFinder(0, N - 7);
  placeFinder(N - 7, 0);
  for (let c = 7; c <= N - 8; c++) { reserved[idx(6, c)] = true; modules[idx(6, c)] = c % 2 ? 0 : 1; }
  for (let r = 7; r <= N - 8; r++) { reserved[idx(r, 6)] = true; modules[idx(r, 6)] = r % 2 ? 0 : 1; }
  reserved[idx(8, N - 8)] = true;
  modules[idx(8, N - 8)] = 1;
}

function refreshGrid() {
  for (const el of gridEl.children) {
    const k = idx(+el.dataset.r, +el.dataset.c);
    el.classList.toggle('black', modules[k] === 1);
    el.classList.toggle('reserved', reserved[k]);
    el.classList.toggle('gesperrt', reserved[k] && !editReserved.checked);
    el.textContent = showCoords.checked ? `${el.dataset.r},${el.dataset.c}` : '';
  }
  matrixText.value = matrixToString(modules);
}

createGrid(gridEl);
initMatrix();

gridEl.addEventListener('click', (ev) => {
  const t = ev.target.closest('.qr-zelle');
  if (!t) return;
  const k = idx(+t.dataset.r, +t.dataset.c);
  if (reserved[k] && !editReserved.checked) return;
  modules[k] = modules[k] ? 0 : 1;
  refreshGrid();
});

editReserved.addEventListener('change', refreshGrid);
showCoords.addEventListener('change', refreshGrid);

document.getElementById('clear').addEventListener('click', () => {
  for (let k = 0; k < N * N; k++) if (!reserved[k]) modules[k] = 0;
  refreshGrid();
});

document.getElementById('copyMatrix').addEventListener('click', () => {
  navigator.clipboard.writeText(matrixText.value).catch(() => {});
});

matrixText.addEventListener('input', () => {
  const m = parseMatrix(matrixText.value);
  if (!m) return;
  modules = m;
  const pos = matrixText.selectionStart;
  refreshGrid();
  matrixText.setSelectionRange(pos, pos);
});

document.getElementById('exportPng').addEventListener('click', () => exportPng(modules, 'qr.png'));
document.getElementById('exportSvg').addEventListener('click', () => exportSvg(modules, 'qr.svg'));

refreshGrid();
