// Zahlensysteme üben: Zahlen zwischen verschiedenen Basen umrechnen.

const NAMEN = { 2: 'Dualsystem', 3: 'Dreiersystem', 8: 'Oktalsystem', 10: 'Dezimalsystem', 12: 'Zwölfersystem', 16: 'Hexadezimalsystem' };
const ZIFFERN = '0123456789ABCDEF';

const $ = (id) => document.getElementById(id);
const aufgabeEl = $('zs-aufgabe');
const form = $('zs-form');
const antwort = $('zs-antwort');
const ergebnis = $('zs-ergebnis');
const zaehler = $('zs-zaehler');
const regler = $('zs-max');
const maxAnzeige = $('zs-max-wert');
const basenBoxen = [...document.querySelectorAll('[name="zs-basis"]')];

let zahl = 0;
let von = 10;
let nach = 2;
let beantwortet = false;
let richtig = 0;
let gesamt = 0;

const zufall = (n) => Math.floor(Math.random() * n);
const inBasis = (n, b) => n.toString(b).toUpperCase();

function gewaehlteBasen() {
  return basenBoxen.filter((b) => b.checked).map((b) => Number(b.value));
}

function neueAufgabe() {
  const basen = gewaehlteBasen();
  ergebnis.textContent = '';
  ergebnis.className = 'zs-ergebnis';
  antwort.value = '';
  beantwortet = false;
  if (basen.length < 2) {
    aufgabeEl.innerHTML = '<p>Bitte wähle mindestens zwei Zahlensysteme aus.</p>';
    antwort.disabled = true;
    return;
  }
  antwort.disabled = false;
  zahl = zufall(Number(regler.value) + 1);
  von = basen[zufall(basen.length)];
  const rest = basen.filter((b) => b !== von);
  nach = rest[zufall(rest.length)];
  aufgabeEl.innerHTML = `<p class="zs-frage">Wandle die Zahl</p>
<p class="zs-zahl"><span>${inBasis(zahl, von)}</span><sub>${von}</sub></p>
<p class="zs-frage">aus dem ${NAMEN[von]} ins <strong>${NAMEN[nach]}</strong> (Basis ${nach}) um.</p>`;
  antwort.placeholder = `Ziffern: ${ZIFFERN.slice(0, nach).split('').join(' ')}`;
  antwort.focus();
}

function pruefen(e) {
  e.preventDefault();
  if (antwort.disabled) return;
  if (beantwortet) { neueAufgabe(); return; }
  const eingabe = antwort.value.trim().toUpperCase().replace(/\s+/g, '');
  if (!eingabe) {
    ergebnis.textContent = 'Bitte gib eine Antwort ein.';
    ergebnis.className = 'zs-ergebnis';
    return;
  }
  const korrekt = inBasis(zahl, nach);
  const normiert = eingabe.replace(/^0+(?=.)/, '');
  beantwortet = true;
  gesamt++;
  if (normiert === korrekt) {
    richtig++;
    ergebnis.textContent = '✓ Richtig! Drücke Enter für die nächste Aufgabe.';
    ergebnis.className = 'zs-ergebnis richtig';
  } else {
    const ungueltig = [...normiert].some((z) => !ZIFFERN.slice(0, nach).includes(z));
    ergebnis.innerHTML = `✗ Leider falsch${ungueltig ? ` – im ${NAMEN[nach]} gibt es nur die Ziffern ${ZIFFERN.slice(0, nach).split('').join(', ')}` : ''}. Richtig ist <strong>${korrekt}</strong><sub>${nach}</sub> (dezimal ${zahl}).`;
    ergebnis.className = 'zs-ergebnis falsch';
  }
  zaehler.textContent = `${richtig} von ${gesamt} richtig`;
}

form.addEventListener('submit', pruefen);
$('zs-neu').addEventListener('click', neueAufgabe);
regler.addEventListener('input', () => { maxAnzeige.textContent = regler.value; });
regler.addEventListener('change', neueAufgabe);
basenBoxen.forEach((b) => b.addEventListener('change', neueAufgabe));

maxAnzeige.textContent = regler.value;
neueAufgabe();
