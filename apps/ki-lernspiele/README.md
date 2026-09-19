# KI-Lernspiele

Algorithmus gegen lernende KI an drei kleinen Spielen – Teil des Online-Schulbuchs:
https://online-schulbuch.de/informatik/werkzeuge/ki-lernspiele/

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

## Aufbau

```
assets/js/core/     learner.js (Schachtel-Lerner), minimax.js, util.js – ohne DOM
assets/js/games/    Spiellogik + Adas Regeln – ohne DOM
assets/js/ui/       gemeinsame Oberfläche (app.js), Lernkurve, Suchbaum, Gedächtnis, Brett-Ansichten
assets/js/apps/     Einstiegspunkte der drei Spiele
assets/css/         Spielkomponenten (Grundfarben und Seitenrahmen kommen aus dem Schulbuch)
tests/              Logik-Tests (node:test)
```

Die Seiten selbst (Einleitung, Erklärtexte) liegen im Schulbuch unter `content/informatik/werkzeuge/`.
Ein neues Spiel braucht nur eine Logik-Datei (`initialState`, `toMove`, `legalMoves`, `play`, `result`, `key`,
optional `canonical` für Symmetrien), eine Ansicht (`createBoard`, `renderMini`) und eine kleine Einstiegsdatei.

Die Tests (`npm test` im Hauptordner) prüfen unter anderem erschöpfend, dass Adas Tic-Tac-Toe-Regeln in keinem
Spielverlauf verlieren, dass Adas NIM-Regel mit Minimax übereinstimmt und dass Kai in allen Spielen tatsächlich lernt.
Der ursprüngliche Python/tkinter-Prototyp ist in der Git-Historie erhalten.

## Quellen und Inspiration

- Martin Gardner: „A matchbox game-learning machine“, *Scientific American*, März 1962 (Hexapawn)
- Donald Michie: MENACE (1961)
- Stefan Seegerer: [Schlag das Krokodil](https://www.stefanseegerer.de/schlag-das-krokodil)
- [Hexapawn von mrozilla](https://www.mrozilla.cz/lab/hexapawn/)
