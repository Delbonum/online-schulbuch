# Online-Schulbuch

Ein freies digitales Schulbuch für **Deutsch** und **Informatik** mit Texten, Aufgaben und interaktiven
Werkzeugen – online unter **https://online-schulbuch.de**.

## Aufbau des Projekts

```
content/                  Inhalte (das „Manuskript“ des Buchs)
  site.json               Titel, Fächer, Lizenz
  index.html              Text auf der Startseite
  deutsch/kapitel.json    Kapitelstruktur Deutsch: Reihenfolge, Titel, Zeiträume, URLs
  deutsch/<kapitel>/…     eine HTML-Datei pro Seite (Kapitelseite: index.html)
  informatik/…            dasselbe für Informatik
  seiten/                 Impressum, Datenschutz, Lizenz
  weiterleitungen.json    zusätzliche Umleitungen und entfernte Adressen
site/                     Design und Skripte (werden 1:1 übernommen)
apps/
  ki-lernspiele/          Tic Tac Toe, NIM, Bauernschach (Spiellogik + Tests)
  werkzeuge/              Zahlensysteme, QR-Code-Werkzeuge, Grammatik-Übungen
  kryptogame/             KryptoGAME – eigenständige App mit eigenem Build und PHP-Backend
scripts/build.mjs         baut aus content/, site/ und apps/ die fertige Website nach dist/
scripts/deploy.sh         lädt die Vorschau oder die Live-Version hoch
tests/                    Tests für den Seitengenerator
materialien/              unveröffentlichtes Unterrichtsmaterial (nur lokal, nicht im Repository)
```

## Eine Seite hinzufügen

1. In `content/<fach>/kapitel.json` an der gewünschten Stelle einen Eintrag ergänzen, z. B.
   `{ "titel": "Lyrik", "slug": "lyrik" }` in den `seiten` eines Kapitels.
2. Die Datei `content/<fach>/<kapitel>/lyrik.html` anlegen – nur der Inhalt, ohne Kopf und Menü.
3. `npm run vorschau` – Menü, Brotkrumen, Vor/Zurück, Suche und Kacheln entstehen automatisch.

Ein Kapitel mit `"geplant": true` erscheint als „in Vorbereitung“, ohne dass es schon eine Seite braucht.

Bausteine für den Inhalt:

```html
<aside class="box aufgabe"><p>…</p></aside>        <!-- Aufgabe -->
<aside class="box hinweis"><p>…</p></aside>        <!-- Hinweis -->
<div class="einbettung" data-src="https://learningapps.org/watch?v=…" data-anbieter="LearningApps"></div>
```

Externe Übungen werden erst nach einem Klick geladen (Datenschutz). Optional steht am Anfang einer Datei ein
Kopfkommentar, z. B. mit `alt: /alte-adresse` (erzeugt eine Weiterleitung), `layout: breit` (für Werkzeuge),
`stile:` und `skripte:`.

## Befehle

```sh
npm run vorschau          # baut nach dist/ für https://online-schulbuch.de/vorschau/
npm run build             # baut die Live-Version (bricht ab, solange Platzhalter offen sind)
npm test                  # Tests für Spiele, Werkzeuge und den Seitengenerator
scripts/deploy.sh vorschau
scripts/deploy.sh live
scripts/pruefen.sh live   # prüft nach dem Hochladen, was auf dem Server liegt
```

`scripts/pruefen.sh` fasst alle Server-Abfragen in einem einzigen SSH-Aufruf zusammen und begrenzt
die HTTP-Stichproben. Das ist Absicht: Der Server sperrt die eigene IP-Adresse, wenn in kurzer Zeit
zu viele Verbindungen eintreffen.

Lokal ansehen: nach `npm run build` im Ordner `dist/` z. B. `python -m http.server 8000` starten.
Es gibt keine Abhängigkeiten außer Node.js (ab Version 20).

## KryptoGAME

Das KryptoGAME ist eine eigenständige React-App mit PHP-Backend und Datenbank. Es wird separat gebaut und
hochgeladen (siehe `apps/kryptogame/README.md`) und liegt immer unter `/informatik/kryptogame/`.
`scripts/deploy.sh` fasst diesen Ordner nie an.

## Lizenz

Alle Inhalte – Texte, Aufgaben, Grafiken und Programmcode – stehen unter
[CC BY-NC-SA 4.0](LICENSE.md), © Philippe Nix. Ausgenommen sind Inhalte Dritter wie die eingebetteten
Übungen von LearningApps.org.
