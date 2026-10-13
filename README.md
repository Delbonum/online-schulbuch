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
  deutsch/lektueren/…     Unterrichtsreihen zu Lektüren, verschachtelt: <autor>/<werk>/<seite>.html
  informatik/…            dasselbe für Informatik
  seiten/                 Impressum, Datenschutz, Lizenz
  weiterleitungen.json    zusätzliche Umleitungen und entfernte Adressen
site/                     Design und Skripte (werden 1:1 übernommen)
apps/
  ki-lernspiele/          Tic Tac Toe, NIM, Bauernschach (Spiellogik + Tests)
  werkzeuge/              Zahlensysteme, QR-Code-Werkzeuge, Grammatik-Übungen,
                          arbeitsblatt/ (Bausteine für digitale Arbeitsblätter)
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
3. `npm run vorschau` – Menü, Brotkrumen, Vor/Zurück, Suche und die Liste „In diesem Kapitel“ entstehen automatisch.

Ein Kapitel mit `"geplant": true` erscheint als „in Vorbereitung“, ohne dass es schon eine Seite braucht.

**Kurzlinks** (`online-schulbuch.de/1.4.5`): Die erste Zahl ist die feste Fachnummer aus `content/site.json` (`fachnummern`: 1 Deutsch, 2 Mathematik … 9 Informatik, 10 Musik – auch für noch nicht vorhandene Fächer reserviert). Der Build vergibt jeder neuen Seite die nächste freie Nummer unter
ihrem Elternteil und schreibt sie in `content/kurzlinks.json` (mit committen!). Vergebene Nummern bleiben fest,
auch wenn Seiten eingefügt oder verschoben werden – gedruckte Kurzlinks bleiben so gültig. Die `.htaccess` leitet
sie per 302 weiter, jede Seite zeigt ihren Kurzlink unten an. Wird ein Slug umbenannt, in der Datei den alten
Schlüssel auf die neue Adresse ändern (der Build warnt bei Nummern ohne Seite).

Normalerweise liegen alle Seiten eines Kapitels flach in seinem Ordner. Ein Eintrag mit `"ordner": true`
öffnet eine eigene Ebene – für die Adresse und für die Dateien. Beispiel Lektüren:
`content/deutsch/lektueren/brecht/index.html` (Autor), `…/brecht/der-gute-mensch-von-sezuan/index.html` (Werk),
`…/der-gute-mensch-von-sezuan/vorspiel.html` → `/deutsch/lektueren/brecht/der-gute-mensch-von-sezuan/vorspiel/`.
`"lehrkraft": true` markiert eine Seite für Lehrkräfte (Schloss im Menü). `"beschreibung"` dient als
Seitenbeschreibung (Suchmaschinen) und als Text auf der Kapitelkachel; `"icon"` (aus `scripts/icons.mjs`) nur
für Kapitel ersten Grades.

### Kacheln und Listen (verbindlich, gilt für alle Fächer)

- **Kacheln gibt es nur auf zwei Ebenen:** auf der Startseite für die Fächer und auf der Fachseite für die
  Kapitel ersten Grades (z. B. Deutsch → Textgattungen, Literaturepochen, Grammatik, Lektüren).
- **Innerhalb eines Kapitels nie Kacheln** – auf keiner Ebene darunter (Unterkapitel, Autor, Werk, Reihe,
  Werkzeugsammlung …). Dort erzeugt der Build unten automatisch die schlichte nummerierte Liste
  „In diesem Kapitel“, wie bei den Literaturepochen. Navigiert wird über Menü, Liste und Zurück/Weiter.
- Das gilt auch für handgeschriebene Inhalte: kein `<div class="kacheln">` in `content/`. Einen einzelnen
  wichtigen Link (z. B. auf eine externe App) als Kasten (`box info` mit `data-titel`) setzen.
- `"icon"` nur bei Kapiteln ersten Grades angeben. Bei tieferen Einträgen wird es nicht angezeigt.
- Soll eine Seite gar keine Liste zeigen, im Kopfkommentar `unterseiten: nein` setzen.

Bausteine für den Inhalt:

```html
<aside class="box aufgabe"><p>…</p></aside>        <!-- Aufgabe -->
<aside class="box hinweis"><p>…</p></aside>        <!-- Hinweis; ebenso tipp, merke, info, material -->
<aside class="box material" data-titel="M1 · Titel"> … <p class="quelle">S. 16</p></aside>
<blockquote class="zitat"><p>…</p><span class="beleg">S. 16</span></blockquote>   <!-- Zitat; Verse: <div class="vers"> -->
<lehrkraft titel="Lösungsvorschlag"> … </lehrkraft>   <!-- nur für Lehrkräfte, siehe unten -->
<div class="einbettung" data-src="https://learningapps.org/watch?v=…" data-anbieter="LearningApps"></div>
```

Externe Übungen werden erst nach einem Klick geladen (Datenschutz). Optional steht am Anfang einer Datei ein
Kopfkommentar, z. B. mit `alt: /alte-adresse` (erzeugt eine Weiterleitung), `layout: breit` (für Werkzeuge),
`stile:` und `skripte:`.

### Digitale Arbeitsblätter

Diese Bausteine werden nur mit HTML geschrieben; `apps/werkzeuge/arbeitsblatt/arbeitsblatt.js` macht sie
interaktiv und wird vom Build automatisch eingebunden, sobald einer davon auf einer Seite vorkommt
(Beschreibung aller Attribute im Kopf der Datei):

```html
<textarea class="notiz" data-notiz="sezuan-vorspiel-1" aria-label="Aufgabe 1: …"></textarea>
<div class="notiz-rueckblick" data-notiz="sezuan-vermutung-1">Ersatztext</div>   <!-- frühere Antwort zeigen -->
<div class="quiz" data-anweisung="…"><div class="frage" data-erklaerung="…"><p>Frage</p>
  <ul><li>falsch</li><li data-richtig>richtig</li></ul></div></div>
<div class="sortieren" data-kategorien="A|B"><p>Anweisung</p><ul><li data-gehoert="A" data-erklaerung="…">…</li></ul></div>
<ol class="reihenfolge"><li>erstes</li><li>zweites</li></ol>           <!-- in richtiger Reihenfolge notieren -->
<div class="position" data-id="sezuan-pos-1" data-vergleich="…"><p>Aussage</p></div>   <!-- Meinungslinie -->
<ul class="abhaken" data-id="sezuan-gelesen"><li>…</li></ul>   <!-- Liste zum Abhaken, z. B. Leseplan -->
<figure class="skizze"><svg …>…</svg><figcaption>…</figcaption></figure>   <!-- eigene Grafik, Farben per CSS-Klassen -->
<einbinden datei="teile/zuschauer-theater.html">   <!-- Baustein aus content/teile/, z. B. eine Skizze auf mehreren Seiten -->
```

Antworten werden nur im Browser gespeichert (`localStorage`, Schlüssel `ab:<id>`); unter jeder Seite gibt es
„Als Textdatei sichern“, „Drucken / als PDF“ und „Löschen“. Der Druckknopf erzeugt ein kurzes
Antwortblatt (Seitentitel, Namenszeile, je Abschnitt die Aufgabe und darunter die eigene Antwort, Meinungslinien
und Abhakenlisten); Strg+P druckt weiterhin die ganze Seite. Angemeldete Lehrkräfte sehen in der Leiste zusätzlich
„Arbeitsblatt drucken / als PDF“ (auch „mit Lösungen“): eine Papierfassung der Seite mit Schreiblinien statt Feldern,
Quiz zum Ankreuzen, Sortieren mit Buchstaben und Tabelle, Reihenfolge mit Kästchen, Meinungslinie als Skala;
aufklappbare Kästen ohne Antwortfelder entfallen (mit Lösungen: alles offen, plus die Kästen für Lehrkräfte).
Die Mischung ist fest, damit Blatt und Lösungsfassung zusammenpassen. Die `data-notiz`-ids müssen im ganzen Schulbuch eindeutig
sein – deshalb mit dem Kürzel der Reihe beginnen (`sezuan-…`). Gleiche id auf einer späteren Seite = Rückblick.

### Inhalte für Lehrkräfte

Alles in `<lehrkraft titel="…">…</lehrkraft>` wird beim Bauen mit AES-GCM verschlüsselt (Schlüssel aus dem
Passwort per PBKDF2) und erst im Browser nach der Anmeldung über „Für Lehrkräfte“ in der Fußzeile entschlüsselt.
Das Passwort steht in der Datei `.lehrkraft-passwort` im Projektordner (gitignored, nie committen) oder in der
Umgebungsvariable `LEHRKRAFT_PASSWORT`. Ohne Passwort fehlen diese Inhalte in der Vorschau; der
Live-Build bricht ab. Lehrkraft-Inhalte erscheinen nicht im Suchindex. Ohne Anmeldung sind die Kästen ganz
unsichtbar. Nach der Anmeldung erscheint im Kopf links neben der Suche ein Schalter (Symbol: Lehrkraft an der Tafel), der die Kästen aus- und
wieder einblendet, ohne abzumelden (z. B. für den Beamer; gemerkt in `localStorage`).

Hinweis: Das Repository ist öffentlich – im Quelltext unter `content/` sind die Lösungen lesbar. Geschützt ist nur
die Website.

## Lektüren: Unterrichtsreihen anlegen

Jede Lektüre bekommt eine Reihe unter `content/deutsch/lektueren/<autor>/<werk>/` (Autor- und Werk-Eintrag mit
`"ordner": true` in `content/deutsch/kapitel.json`). Vorbild ist *Der gute Mensch von Sezuan*
(`…/brecht/der-gute-mensch-von-sezuan/`). Für alle Reihen gilt:

1. **Kein Vorwissen voraussetzen.** Die Schülerinnen und Schüler haben das Buch zu Beginn noch nicht gelesen.
   Die ersten Seiten und Arbeitsblätter funktionieren ohne Kenntnis des Textes (Einstieg über die Grundfrage,
   Alltagsbezug, Vermutungen zu Titel, Personen, Klappentext). Der Anfang wird gemeinsam gelesen.
2. **Lesebegleitend und spoilerfrei.** Danach folgt pro Leseabschnitt eine Seite (Lesecheck-Quiz, Aufgaben,
   Vermutung zum Weiterlesen, Leseauftrag als Hausaufgabe). Keine Seite verrät mehr als bis dahin gelesen ist –
   auch nicht in Beispielen, Quizfragen oder Lösungshinweisen. Frühe Vermutungen werden mit
   `notiz-rueckblick` später wieder aufgerufen.
3. **Erst danach die Gesamtdeutung:** Überblick/Aufbau, Figuren, zentrale Themen, Gattung und Form,
   Kontext und Rezeption, Bezug zur Gegenwart (mit Vorher-nachher-Vergleich der Meinungslinie), Klausurtraining.
   Zum Schluss eine Seite „Hinweise für Lehrkräfte“ (`"lehrkraft": true`) mit Konzeption, Verlaufsplan,
   Kompetenzen, Differenzierung, Leistungsüberprüfung, Literatur.
4. **Seitenangaben beziehen sich immer auf die gedruckten Seitenzahlen der Buchausgabe**, nie auf die
   Seitennummer einer PDF-Datei. Die Ausgabe steht auf der Werkseite; zusätzlich die Szene/das Kapitel nennen,
   damit man die Stelle auch in anderen Ausgaben findet. Zitate wörtlich aus dem Buch übernehmen.
5. **Lösungen und Lehrerhinweise** stehen in `<lehrkraft>` direkt unter den Aufgaben, auf die sie sich beziehen.
6. **Modern und mehrperspektivisch:** handlungs- und produktionsorientierte Aufgaben, kooperative Formen,
   interaktive Bausteine, Gegenwartsbezug; Deutungen als Angebote nebeneinanderstellen statt eine vorzugeben.
7. **Rechte beachten:** Texte von Autorinnen und Autoren, die vor weniger als 70 Jahren gestorben sind, sind
   geschützt – nur kurze Zitate mit Beleg (Brecht: bis 31.12.2026). Keine Bilder aus Schulbüchern, Verlagen oder
   von Inszenierungen ohne Nutzungsrecht; Skizzen lieber selbst als SVG (`figure.skizze`) zeichnen.
8. **Flexibel planbar.** Jede Reihe besteht aus Kernseiten und fakultativen Zusatzseiten. Zusatzseiten stehen in
   `kapitel.json` direkt hinter der Leseseite, ab der sie nichts mehr vorwegnehmen. Jede Seite beginnt mit einem
   Kasten `<lehrkraft titel="Einsatz dieser Seite">` (Typ, frühestens nach, Dauer, verschiebbar/kürzbar; auf
   Leseseiten auch: welcher Lesestand welche Aufgabe voraussetzt und welche Schlüsselszenen sich zum gemeinsamen
   Lesen eignen). Jede Leseseite hat eine aufklappbare Kurzfassung je Bild/Kapitel
   (`<details class="aufklapp">`). Dazu gehören eine Seite „Leseplan“ (Termine, Abhakliste, Lesetagebuch) und auf
   der Lehrkräfte-Seite eine Bausteinübersicht mit mehreren Planungsmodellen (kompakt, gestreckte Lesezeit mit
   Zwischenbausteinen, Schlüsselszenen, Lektüre vorab). Vorbild: *Der gute Mensch von Sezuan*.
9. **Bilder:** einfache Grafiken selbst als SVG zeichnen (`figure.skizze`); Fotos nur gemeinfrei oder frei
   lizenziert (z. B. Wikimedia Commons), verkleinert unter `site/assets/img/lektueren/`, als `figure.foto` mit
   Urheber, Quelle und Lizenz in der Bildunterschrift.
10. **Das Buch selbst** (z. B. als PDF) gehört nach `materialien/` und wird nie committet. Text lässt sich mit
   `pdftotext` herausziehen; dabei die PDF-Seiten den gedruckten Seitenzahlen zuordnen (die Zahl steht meist
   unten auf der Seite) und jede Seitenangabe danach prüfen.

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
Für die Vorschau (`npm run vorschau`) den Server im Ordner über `dist/` starten und `dist` in `vorschau` umbenennen
bzw. kopieren, da alle Adressen mit `/vorschau/` beginnen. Die Lehrkraft-Anmeldung braucht `https` oder `localhost`.
Es gibt keine Abhängigkeiten außer Node.js (ab Version 20).

## KryptoGAME

Das KryptoGAME ist eine eigenständige React-App mit PHP-Backend und Datenbank. Es wird separat gebaut und
hochgeladen (siehe `apps/kryptogame/README.md`) und liegt immer unter `/informatik/kryptogame/`.
`scripts/deploy.sh` fasst diesen Ordner nie an.

## Lizenz

Alle Inhalte – Texte, Aufgaben, Grafiken und Programmcode – stehen unter
[CC BY-NC-SA 4.0](LICENSE.md), © Philippe Nix. Ausgenommen sind Inhalte Dritter wie die eingebetteten
Übungen von LearningApps.org.
