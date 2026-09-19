// QR-Code-Masken: die acht Maskenmuster auf den Datenbereich einer 21×21-Matrix anwenden.
import { N, idx, matrixToString, parseMatrix, exportPng, exportSvg, createGrid } from './export.js';

const inputMatrix = document.getElementById('inputMatrix');
const outputMatrix = document.getElementById('outputMatrix');
const inputPreview = document.getElementById('inputPreview');
const outputPreview = document.getElementById('outputPreview');
const inputStatus = document.getElementById('inputStatus');
const outputStatus = document.getElementById('outputStatus');
const maskButtons = [...document.querySelectorAll('[data-mask]')];

let originalModules = new Array(N * N).fill(0);
let currentModules = new Array(N * N).fill(0);
const reserved = new Array(N * N).fill(false);

// Nicht maskiert werden: Positionsmarker samt Rand (je 8×8), Synchronisationslinien,
// dunkles Modul und die Bereiche der Formatinformation.
function initReserved() {
  const placeFinder = (rs, cs) => {
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const row = rs + r;
      const col = cs + c;
      if (row >= 0 && row < N && col >= 0 && col < N) reserved[idx(row, col)] = true;
    }
  };
  placeFinder(0, 0);
  placeFinder(0, N - 8);
  placeFinder(N - 8, 0);
  for (let c = 0; c < N; c++) reserved[idx(6, c)] = true;
  for (let r = 0; r < N; r++) reserved[idx(r, 6)] = true;
  reserved[idx(8, N - 8)] = true;
  for (let r = 0; r <= 8; r++) if (r !== 6) reserved[idx(r, 8)] = true;
  for (let c = 0; c <= 8; c++) if (c !== 6) reserved[idx(8, c)] = true;
  for (let r = 0; r <= 8; r++) reserved[idx(r, N - 8)] = true;
  for (let c = 0; c <= 8; c++) reserved[idx(N - 8, c)] = true;
}

function refreshPreview(container, modules) {
  for (const el of container.children) {
    el.classList.toggle('black', modules[idx(+el.dataset.r, +el.dataset.c)] === 1);
  }
}

// r = Zeile, c = Spalte (jeweils ab 0 gezählt)
const maskFunctions = [
  (r, c) => (r + c) % 2 === 0,
  (r) => r % 2 === 0,
  (r, c) => c % 3 === 0,
  (r, c) => (r + c) % 3 === 0,
  (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
  (r, c) => ((r * c) % 2 + (r * c) % 3) === 0,
  (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
  (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
];

function applyMask(maskIndex) {
  currentModules = [...originalModules];
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const k = idx(r, c);
    if (!reserved[k] && maskFunctions[maskIndex](r, c)) currentModules[k] = currentModules[k] === 1 ? 0 : 1;
  }
  outputMatrix.value = matrixToString(currentModules);
  refreshPreview(outputPreview, currentModules);
  outputStatus.textContent = `Maske ${maskIndex} angewendet.`;
  maskButtons.forEach((b) => b.classList.toggle('active', Number(b.dataset.mask) === maskIndex));
}

inputMatrix.addEventListener('input', () => {
  const matrix = parseMatrix(inputMatrix.value);
  if (!matrix) {
    inputStatus.textContent = 'Keine gültige 21×21-Matrix (21 Zeilen mit je 21 Nullen und Einsen).';
    return;
  }
  originalModules = matrix;
  refreshPreview(inputPreview, originalModules);
  inputStatus.textContent = 'QR-Code geladen.';
  applyMask(0);
});

document.getElementById('pasteButton').addEventListener('click', async () => {
  try {
    inputMatrix.value = await navigator.clipboard.readText();
    inputMatrix.dispatchEvent(new Event('input'));
  } catch {
    inputStatus.textContent = 'Kein Zugriff auf die Zwischenablage – füge die Matrix mit Strg+V ein.';
  }
});

document.getElementById('copyOutput').addEventListener('click', () => {
  navigator.clipboard.writeText(outputMatrix.value).catch(() => {});
});
document.getElementById('exportPngOutput').addEventListener('click', () => exportPng(currentModules, 'qr_maskiert.png'));
document.getElementById('exportSvgOutput').addEventListener('click', () => exportSvg(currentModules, 'qr_maskiert.svg'));
maskButtons.forEach((btn) => btn.addEventListener('click', () => applyMask(Number(btn.dataset.mask))));

createGrid(inputPreview);
createGrid(outputPreview);
initReserved();
