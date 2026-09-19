# KI-Lernspiele: TicTacToeAI

Ein Education-Lerntool, das an drei kleinen Spielen zwei grundverschiedene Arten von „KI“ erfahrbar macht:

- **Ada – algorithmisches Vorgehen:** Ada folgt festen Regeln (Wenn-dann-Pseudocode, Schritt für Schritt hervorgehoben)
  oder dem **Minimax-Suchbaum**, den man aufklappen und nachrechnen kann. Ada verliert nie – weil ein Mensch vorher nachgedacht hat.
- **Kai – verstärkendes Lernen:** Kai hat für jede Spielstellung eine „Streichholzschachtel“. Er beginnt zufällig und lernt aus
  Niederlagen, wahlweise durch **Züge streichen** (Hexapawn / „Schlag das Krokodil“) oder durch **Perlen sammeln** (MENACE).
  Lernkurve, Training gegen Zufall oder Ada, Symmetrie-Schalter sowie Speichern und Laden des Gedächtnisses sind eingebaut.

| Spiel | Ada | Kai |
|---|---|---|
| **Tic Tac Toe** | Regeln + Suchbaum | Schachteln (mit/ohne Symmetrie) |
| **NIM** (Streichhölzer, Varianten einstellbar) | Rechenregel „Zielzahlen“ + Suchbaum | eine Schachtel pro Holzanzahl |
| **Bauernschach** (Hexapawn, 3×3) | Suchbaum | 19 Schachteln (37 ohne Symmetrie) |

## Online nutzen

Die Seite läuft komplett im Browser, ohne Server, Anmeldung oder Tracking. Sie wird über GitHub Pages veröffentlicht:
**https://delbonum.github.io/TicTacToeAI/**

## Lokal starten

ES-Module brauchen einen kleinen Webserver (ein Doppelklick auf `index.html` genügt nicht):

```sh
python -m http.server 8000
# dann http://localhost:8000 öffnen
```

## Aufbau

```
index.html                 Startseite
tictactoe/ nim/ bauernschach/   je eine Seite pro Spiel
assets/js/core/            learner.js (Schachtel-Lerner), minimax.js, util.js – ohne DOM
assets/js/games/           Spiellogik + Adas Regeln – ohne DOM
assets/js/ui/              gemeinsame Oberfläche (app.js), Lernkurve, Suchbaum, Gedächtnis, Brett-Ansichten
tests/                     Logik-Tests (node:test)
legacy/python-tkinter/     ursprünglicher Desktop-Prototyp
```

Ein neues Spiel braucht nur eine Logik-Datei (`initialState`, `toMove`, `legalMoves`, `play`, `result`, `key`,
optional `canonical` für Symmetrien), eine Ansicht (`createBoard`, `renderMini`) und eine kleine Einstiegsdatei.

## Tests

```sh
node --test tests/*.test.mjs
```

Die Tests prüfen unter anderem erschöpfend, dass Adas Tic-Tac-Toe-Regeln in keinem Spielverlauf verlieren, dass Adas
NIM-Regel mit Minimax übereinstimmt und dass Kai in allen Spielen tatsächlich lernt.

## Quellen und Inspiration

- Martin Gardner: „A matchbox game-learning machine“, *Scientific American*, März 1962 (Hexapawn)
- Donald Michie: MENACE (1961)
- Stefan Seegerer: [Schlag das Krokodil](https://www.stefanseegerer.de/schlag-das-krokodil)
- [Hexapawn von mrozilla](https://www.mrozilla.cz/lab/hexapawn/)
