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
  werkzeuge/              fächerübergreifende Tools (online-schulbuch.de/50), z. B. Umfragen
  seiten/                 Impressum, Datenschutz, Lizenz
  weiterleitungen.json    zusätzliche Umleitungen und entfernte Adressen
site/                     Design und Skripte (werden 1:1 übernommen)
apps/
  ki-lernspiele/          Tic Tac Toe, NIM, Bauernschach (Spiellogik + Tests)
  werkzeuge/              Zahlensysteme, QR-Code-Werkzeuge (qr-encode.js erzeugt echte QR-Codes),
                          Grammatik-Übungen, arbeitsblatt/ (Bausteine für digitale Arbeitsblätter),
                          live/ (gemeinsamer Rahmen der Live-Tools), umfragen/, wortwolke/, quiz/,
                          evaluation/ (Live-Tools, Daten über die Schulbuch-API)
                          netzwerk/ (Netzwerk-Simulation im Stil von Filius: netz.js = TCP/IP-Stapel ohne DOM,
                          befehle.js = Befehlszeile, netzwerk.js = Oberfläche, beispiele.js = Beispielnetze, per Link
                          ladbar mit ?beispiel=<slug>; Geräte-Bilder in bilder/ sind
                          Platzhalter und lassen sich durch Dateien gleichen Namens ersetzen),
                          rollenspiel/ (Rollenkarten für das Netzwerk-Rollenspiel: per QR-Code zufällig vergeben
                          über die API oder als Druckvorlage; wahlweise vereinfachte Adressen),
                          subnetze/ (Subnetz-Trainer)
  kryptogame/             KryptoGAME – eigenständige React-App mit eigenem Build (Backend: server/)
  autocell/               AutoCell – fertig gebaute Web-Version aus eigenem Repository (→ /informatik/autocell/,
                          aktualisieren mit scripts/autocell-holen.mjs, siehe apps/autocell/README.md)
server/                   Schulbuch-API (PHP + MySQL, → /api/): Konten, Klassen, Anmeldung für Lehrkräfte,
                          Daten des KryptoGAMEs; später auch für Live-Werkzeuge
scripts/build.mjs         baut aus content/, site/ und apps/ die fertige Website nach dist/
scripts/deploy.sh         lädt Vorschau, Live-Version, API und KryptoGAME hoch
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
Kapitel, die keine Themen sind, bekommen in `kapitel.json` eine feste `"nummer"` (Informatik: Projekte 45,
Toolsammlung 50). Sie stehen automatisch hinter allen Themen, nach Nummer geordnet; neue Themen nummerieren
sich davor weiter (9.11, 9.12 …).

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
- **Ausnahme Tools** (`/werkzeuge/`, Kurzlink 50, Kachel „Tools“ auf der Startseite): Die Seite zeigt oben die
  fächerübergreifenden Tools aus `content/werkzeuge/kapitel.json` (`"global": true`, Farbe anthrazit) und darunter
  unter „Fachspezifische Tools“ automatisch alle Einträge der Toolsammlungen der Fächer (Kapitel `werkzeuge`) in
  der jeweiligen Fachfarbe. Ein neues fächerübergreifendes Tool ist ein neues Kapitel in
  `content/werkzeuge/kapitel.json`; ein neues Fach-Tool kommt in die Toolsammlung seines Fachs.
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
<table class="verlauf ausfuell">…<td><textarea class="notiz" data-notiz="…" aria-label="…"></textarea></td>…</table>   <!-- Ausfülltabelle: Feld je Zelle, auf dem Handy Karten -->
<!-- … mit data-erweiterbar="id" am table: Knopf „+ Zeile“, wenn die Zeilenzahl offen ist. Felder der letzten Zeile: data-notiz="id-Zeile-Spalte", aria-label mit „Zeile N“ -->
<div class="felder zwei"><div><label for="x">Dafür:</label><textarea class="notiz" id="x" data-notiz="x"></textarea></div>…</div>   <!-- geführte Felder; „zwei“ = nebeneinander -->
<div class="markieren" data-id="…" data-titel="…" data-farben="A|B|C">Text</div>   <!-- Wörter nach Kategorien markieren -->
<div class="kurve" data-id="…" data-titel="…" data-oben="…" data-unten="…" data-schritte="1|2|3"></div>   <!-- eigene Kurve, ein Regler je Schritt -->
<div class="notiz-rueckblick" data-notiz="alte-id" data-alt hidden></div>   <!-- frühere Antwort zeigen, wenn ein Feld ersetzt wurde -->
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

### Live-Werkzeuge (Umfragen, Wortwolke, Quiz, Evaluation)

Die fächerübergreifenden Tools unter `/werkzeuge/` teilen sich einen Rahmen (`apps/werkzeuge/live/live.js` und
`live.css`): Lehrkräfte melden sich mit ihrem Konto an, legen Einträge an, führen sie durch (sechsstelliger Code,
QR-Code und Kurzadresse am Beamer) und sehen ihre früheren Durchführungen. **Schülerinnen und Schüler brauchen kein
Konto** – sie geben den Code auf einer beliebigen Tool-Seite ein (falsche Seite leitet weiter) oder scannen den QR-Code.
Jeder Eintrag lässt sich samt allen Ergebnissen als JSON **exportieren und vollständig wieder importieren**; Einträge,
die **500 Tage** weder bearbeitet noch durchgeführt wurden, löscht der Server.

| Tool | Seite / Kurzadresse | Besonderheiten |
| --- | --- | --- |
| Umfragen | `/werkzeuge/umfragen/`, `/umfrage` | Schieberegler und Antwortvorgaben; „Frage für Frage“ (ausführliche Statistik, Countdown) oder „Alle Fragen auf einmal“ (kompakt) |
| Wortwolke | `/werkzeuge/wortwolke/`, `/wortwolke` | 1–5 Begriffe pro Person; Begriffe per Klick ausblenden (Moderation); Ansicht als Liste |
| Quiz | `/werkzeuge/quiz/`, `/quiz` | Spielnamen, Lobby, Zeit je Frage, 500–1000 Punkte je nach Tempo, Auflösung, Rangliste, Siegerpodest |
| Evaluation | `/werkzeuge/evaluation/`, `/evaluation` | anonym; während der Durchführung nur die Zahl der Abgaben; Auswertung (Skalen wie in der PoKUK-Maske, Aussagen, Freitexte, CSV) erst nach dem Ende und ab einer Mindestzahl (Standard 5); Vorlagen in `apps/werkzeuge/evaluation/vorlagen.js` |

Anonymität der Evaluation (serverseitig, `PollController`): Antworten werden unter einer neuen Zufallskennung ohne
Zeitpunkt gespeichert, getrennt davon nur, *dass* eine Kennung abgegeben hat; Ergebnisse und Export gibt es erst
nach dem Ende und ab der Mindestzahl.

#### Terminbuchung

`/werkzeuge/termine/` (Kurzadresse `/termine`, Dateien `apps/werkzeuge/termine/`, Server `TerminController`, Tabellen
`termin_events` und `termin_bookings`): Die Lehrkraft legt Zeiträume (Datum, von, bis), die Dauer eines Termins, eine
Pause dazwischen und die Plätze je Termin fest; daraus entstehen die Termine (Rest am Ende eines Zeitraums entfällt,
dieselbe Rechnung in `slots.js` und `TerminController::slots`). Die Klasse bucht **ohne Konto** mit sechsstelligem Code
bzw. QR-Code und Namen; Vergabe nach dem Prinzip „Wer zuerst bucht, bekommt den Termin“ (Modus `fifo`, Spalte `mode` für
spätere Modi wie Wunschlisten mit Prioritäten). Je Browser-Kennung eine Buchung; der Primärschlüssel (Termin, Platz)
verhindert Doppelbuchungen bei gleichzeitigen Klicks. Einstellbar: Umbuchen/Stornieren, Namen für alle sichtbar,
Buchungsschluss, Buchung offen/geschlossen, einzelne Termine sperren. Die Lehrkraft trägt Namen nach oder entfernt sie,
speichert die Liste als CSV, druckt sie und zeigt eine Beamer-Ansicht. Schülerinnen und Schüler können ihren Termin als
`.ics` in den Kalender übernehmen. Zeiten sind Ortszeit (Europe/Berlin); Terminbuchungen werden samt Namen **30 Tage nach
dem letzten Termin** gelöscht. Codes sind über Terminbuchung und Live-Tools hinweg eindeutig; ein Terminbuchungs-Code auf
einer Live-Tool-Seite leitet weiter (und umgekehrt).

#### Live-Umfragen aus dem Schulbuch

Meinungslinien und Quizze im Schulbuch lassen sich in den Hinweisen für Lehrkräfte direkt als Umfrage starten – die
Seite selbst funktioniert unverändert weiter:

```html
<div class="quiz" data-id="reihe-lesecheck-1" …> … </div>          <!-- Quiz braucht dafür eine data-id -->
<lehrkraft titel="Als Live-Umfrage durchführen">
<p>Kurz erklären, wofür sich die Umfrage hier eignet (Lehrkräfte werden gesiezt).</p>
<als-umfrage ids="id-1 id-2" titel="Titel der Umfrage" modus="single"></als-umfrage>
</lehrkraft>
```

Der Build macht aus `<als-umfrage>` eine Modus-Wahl (`modus` = Vorauswahl: `single` „Frage für Frage“ oder `all`)
und die Knöpfe **„Live-Umfrage starten“** (Standard: startet sofort im gewählten Modus, ohne Speichern und Start-Dialog)
und „Vorher bearbeiten“. Dieselbe Stelle im Schulbuch nutzt immer dieselbe Umfrage der Lehrkraft (frühere Ergebnisse
bleiben unter „Ergebnisse früherer Durchführungen“). `ids` nennt die `data-id` von Meinungslinien (`.position`, werden
Skalenfragen 0–10 mit den Polen als Beschriftung) oder Quizzen (`.quiz`, werden Auswahlfragen mit Lösung, die Vorgaben
fest gemischt). Passt der Text einer Meinungslinie nicht als Frage, ersetzt ihn `data-umfrage-text` an der `.position`.
Den Kasten direkt hinter die Meinungslinie bzw. das Quiz setzen. **Bei neuen Inhalten mitdenken:** Jede Meinungslinie
(Meinungsbild der Klasse, Vorher-nachher-Vergleich) und jeder Lesecheck bzw. jedes Verständnisquiz, das sich für eine
gemeinsame Diagnose in der Klasse eignet, bekommt so einen Kasten. Selbstchecks zum eigenständigen Üben und Tests
(z. B. Abschlusstest) nicht.

### Inhalte für Lehrkräfte

Alles in `<lehrkraft titel="…">…</lehrkraft>` wird beim Bauen mit AES-GCM verschlüsselt und erst im Browser
entschlüsselt. Lehrkräfte melden sich dazu über „Für Lehrkräfte“ in der Fußzeile mit ihrem **eigenen Konto** an
(dasselbe wie im KryptoGAME, siehe [Schulbuch-API](#schulbuch-api)); die API gibt den Schlüssel nur an Lehrkräfte
heraus. Wer schon im KryptoGAME angemeldet ist, wird ohne Passwort freigeschaltet.
Der Schlüssel (32 Byte, Base64) steht in der Datei `.lehrkraft-schluessel` im Projektordner (gitignored, nie
committen) oder in der Umgebungsvariable `LEHRKRAFT_SCHLUESSEL` – und derselbe Wert auf dem Server in
`api/config.php` (`content_key`). Ohne Schlüssel fehlen diese Inhalte in der Vorschau; der Live-Build bricht ab.
Wird ein Konto gesperrt, kann es einen schon gemerkten Schlüssel weiter benutzen: dann einen neuen Schlüssel
erzeugen (Befehl steht in `scripts/build.mjs`), auf dem Server eintragen und neu bauen – alle Lehrkräfte melden
sich einmal neu an. Lehrkraft-Inhalte erscheinen nicht im Suchindex. Ohne Anmeldung sind die Kästen ganz
unsichtbar. Nach der Anmeldung erscheint im Kopf links neben der Suche ein Schalter (Symbol: Lehrkraft an der Tafel), der die Kästen aus- und
wieder einblendet, ohne abzumelden (z. B. für den Beamer; gemerkt in `localStorage`).

**Lösungen abschnittsweise (verbindlich, alle Fächer):** Lösungshinweise stehen nie gesammelt am Seitenende, sondern
jeweils am Ende des Abschnitts (`<h2>`), zu dem die Aufgaben gehören – ein Kasten pro Abschnitt mit den Lösungen
zu allen Aufgaben dieses Abschnitts, z. B. `<lehrkraft titel="Lösungsvorschlag zu Aufgabe 3 und 4">` direkt vor der
nächsten Überschrift. Hat ein Abschnitt keine Aufgaben mit Lösung, entfällt der Kasten. Der Kasten „Einsatz dieser
Seite“ steht am Seitenanfang.

**Keine Bezüge auf Ausgangsmaterial (verbindlich, alle Fächer und Reihen):** Hinweise für Lehrkräfte müssen für eine
beliebige Lehrkraft verständlich sein. Material, das nur als Vorlage oder Anregung für eine Reihe diente (Präsentationen,
Arbeitsblätter, Notizen, frühere Fassungen eines Projekts, andere Software wie Filius), wird nicht erwähnt – keine
„Abweichung von der Vorlage“, kein „ersetzt das Arbeitsblatt …“, kein „steht in den Notizen“. Veröffentlichte Quellen
(Bücher, Websites, Unterrichtsideen anderer) gehören mit Nachweis unter „Literatur und Links“ bzw. in die Bildnachweise.

**Keine Anrede (verbindlich, alle Fächer):** Hinweise und Lösungen für Lehrkräfte sprechen niemanden an, also kein „Sie“. Stattdessen indirekt („indem plakativ formuliert wird“), mit „man“ oder nominal („durch plakatives Formulieren“).

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
   **Zitierweise:** Nur wörtliche Zitate stehen in Anführungszeichen und bekommen die Seite ohne „vgl.“ (`„Leid läutert!“ (S. 94)`);
   indirekte Zitate und Textstellenangaben bekommen „vgl.“ (`(vgl. S. 94)`), auch in Quiz-Erklärungen und Grafiken.
   Ohne „vgl.“ bleiben nur Leseaufträge („Lies das Lied (S. 91 f.)“) und reine Inhaltsangaben wie Leseplan, Zeitleisten und Planungstabellen.
5. **Lösungen und Lehrerhinweise** stehen in `<lehrkraft>` am Ende des Abschnitts, zu dem die Aufgaben gehören
   (ein Kasten je Abschnitt, siehe „Inhalte für Lehrkräfte“) – nie alle gesammelt am Seitenende.
6. **Modern und mehrperspektivisch:** handlungs- und produktionsorientierte Aufgaben, kooperative Formen,
   interaktive Bausteine, Gegenwartsbezug; Deutungen als Angebote nebeneinanderstellen statt eine vorzugeben.
7. **Rechte beachten:** Texte von Autorinnen und Autoren, die vor weniger als 70 Jahren gestorben sind, sind
   geschützt – nur kurze Zitate mit Beleg (Brecht: bis 31.12.2026). Keine Bilder aus Schulbüchern, Verlagen oder
   von Inszenierungen ohne Nutzungsrecht; Skizzen lieber selbst als SVG (`figure.skizze`) zeichnen.
8. **Live-Umfragen:** Meinungslinien und Lesechecks bekommen in den Hinweisen für Lehrkräfte einen Knopf
   „Als Live-Umfrage durchführen“ (siehe „Live-Umfragen aus dem Schulbuch“) – vor allem die Meinungslinie zu
   Beginn und ihr Vorher-nachher-Vergleich am Ende der Reihe.
9. **Flexibel planbar.** Jede Reihe besteht aus Kernseiten und fakultativen Zusatzseiten. Zusatzseiten stehen in
   `kapitel.json` direkt hinter der Leseseite, ab der sie nichts mehr vorwegnehmen. Jede Seite beginnt mit einem
   Kasten `<lehrkraft titel="Einsatz dieser Seite">` (Typ, frühestens nach, Dauer, verschiebbar/kürzbar; auf
   Leseseiten auch: welcher Lesestand welche Aufgabe voraussetzt und welche Schlüsselszenen sich zum gemeinsamen
   Lesen eignen). Jede Leseseite hat eine aufklappbare Kurzfassung je Bild/Kapitel
   (`<details class="aufklapp">`). Dazu gehören eine Seite „Leseplan“ (Termine, Abhakliste, Lesetagebuch) und auf
   der Lehrkräfte-Seite eine Bausteinübersicht mit mehreren Planungsmodellen (kompakt, gestreckte Lesezeit mit
   Zwischenbausteinen, Schlüsselszenen, Lektüre vorab). Vorbild: *Der gute Mensch von Sezuan*.
10. **Bilder:** einfache Grafiken selbst als SVG zeichnen (`figure.skizze`); Fotos nur gemeinfrei oder frei
   lizenziert (z. B. Wikimedia Commons), verkleinert unter `site/assets/img/lektueren/`, als `figure.foto` mit
   Urheber, Quelle und Lizenz in der Bildunterschrift.
11. **Das Buch selbst** (z. B. als PDF) gehört nach `materialien/` und wird nie committet. Text lässt sich mit
   `pdftotext` herausziehen; dabei die PDF-Seiten den gedruckten Seitenzahlen zuordnen (die Zahl steht meist
   unten auf der Seite) und jede Seitenangabe danach prüfen.
12. **Abwechslungsreiche Aufgabenformen:** Nicht jede Aufgabe bekommt ein einzelnes Freitextfeld. Tabellen als Ausfülltabelle,
   Bestimmungsaufgaben als geführte Felder, Abwägungen als Pro/Contra mit Fazit, Standpunkte als Meinungslinie mit Begründung
   (und Live-Umfrage), Textuntersuchungen mit „Markieren“, Verläufe mit „Kurve“. Reine Schreibaufgaben bleiben Freitext.

## Befehle

```sh
npm run vorschau          # baut nach dist/ für https://online-schulbuch.de/vorschau/
npm run build             # baut die Live-Version (bricht ab, solange Platzhalter offen sind)
npm test                  # Tests für Spiele, Werkzeuge und den Seitengenerator
scripts/deploy.sh vorschau
scripts/deploy.sh live
scripts/deploy.sh live api kryptogame   # mehrere Teile zusammen, mit nur einer SSH-Anmeldung
scripts/pruefen.sh live   # prüft nach dem Hochladen, was auf dem Server liegt
```

`scripts/pruefen.sh` fasst alle Server-Abfragen in einem einzigen SSH-Aufruf zusammen und begrenzt
die HTTP-Stichproben. Das ist Absicht: Der Server sperrt die eigene IP-Adresse, wenn in kurzer Zeit
zu viele Verbindungen eintreffen.

Lokal ansehen: nach `npm run build` im Ordner `dist/` z. B. `python -m http.server 8000` starten.
Für die Vorschau (`npm run vorschau`) den Server im Ordner über `dist/` starten und `dist` in `vorschau` umbenennen
bzw. kopieren, da alle Adressen mit `/vorschau/` beginnen. Die Lehrkraft-Anmeldung braucht `https` oder `localhost` und eine laufende Schulbuch-API unter `/api/`.
Es gibt keine Abhängigkeiten außer Node.js (ab Version 20).

## Schulbuch-API

`server/` ist eine schlanke PHP-API ohne Abhängigkeiten (PHP ≥ 8.1, MySQL/MariaDB, lokal SQLite), live unter
`/api/`. Sie ist für die **ganze Website** zuständig:

- **Konten:** Lehrkräfte (Selbstregistrierung mit Freigabe durch das Master-Konto), Klassen und Schülerzugänge.
  Eine Anmeldung gilt überall – im Schulbuch (Inhalte für Lehrkräfte) und in den Werkzeugen (z. B. KryptoGAME).
  Session-Cookie `SCHULBUCH_SESSION`, nur für `/api/`.
- **Schlüssel für die Inhalte für Lehrkräfte:** `GET /api/teacher-content/key` (nur Lehrkräfte).
- **Live-Tools** (Tabellen `poll_*`, Spalte `kind`: `poll`, `wordcloud`, `quiz`, `evaluation`): `/api/polls[?kind=…]`
  (anlegen, bearbeiten, löschen, `…/export`, `/polls/import`), `POST /api/polls/{id}/runs` (Durchführung mit
  sechsstelligem Code starten), `/api/poll-runs/{id}` (Stand; `PATCH` steuert: `current`, `countdown`, `hide`/`show`,
  `start`, `phase`, `kick`, `end`), ohne Konto: `GET /api/join/{code}`, `POST /api/join/{code}/answers`,
  `POST /api/join/{code}/name` (Quiz). Countdown und Ablauf einer Quizfrage rücken beim Abruf serverseitig weiter;
  Durchführungen enden nach 12 Stunden automatisch.
- **Terminbuchung** (Tabellen `termin_*`): `/api/termine` (Lehrkraft: anlegen, bearbeiten, löschen; `POST …/{id}/buchungen`,
  `DELETE …/{id}/buchungen/{slot}/{platz}`), ohne Konto: `GET /api/termin/{code}`, `POST …/buchen`, `POST …/stornieren`.
- **Netzwerk-Rollenspiel** (Tabellen `rollenspiel_*`): `/api/rollenspiele` (Lehrkraft: Runde anlegen, Stufe/Darstellung
  ändern, löschen; `DELETE …/{id}/rollen[/{nr}]` gibt Rollen frei), ohne Konto: `POST /api/rollenspiel/{code}/rolle`
  (zufällige freie Rolle, Gruppen gleichmäßig, Router und DNS-Server zuerst; gleiche Kennung = gleiche Rolle) und
  `GET /api/rollenspiel/{code}?participant=…`. Gespeichert werden nur Nummer und Kennung; Löschung 60 Tage nach der
  letzten Änderung.
- **Modem der Netzwerk-Simulation** (Tabellen `modem_*`, ohne Konto): `POST /api/modem` (Verbindung anbieten →
  sechsstelliger Code und geheimer `token`), `POST /api/modem/{code}/join` (einwählen), `POST …/send` und
  `GET /api/modem/{code}?token=…` (Ethernet-Rahmen weiterreichen bzw. abholen, danach gelöscht),
  `POST …/hangup`. Verbindungen ohne Lebenszeichen verfallen nach 12 Stunden.
- **Neue Tabellen** legt die API nach dem Hochladen beim ersten Aufruf selbst an (Markierung
  `data/.schema-<Prüfsumme>`), denn auf dem Server gibt es kein PHP auf der Kommandozeile.
- **KryptoGAME:** Fortschritt, Prüfungen (Bewertung auf dem Server), Statistik.

Neue Werkzeuge mit Lehrkraft-Modus fragen `GET /api/auth/me` (`role: "teacher"`) ab, statt eine eigene Anmeldung
mitzubringen. Eigene Daten eines Werkzeugs bekommen eigene Tabellen mit Präfix und eigene Pfade
(z. B. `wolke_…` und `/api/wolke/…`); Konten und Klassen werden gemeinsam genutzt.

Tests: `php server/tests/run.php`. Lokal starten: `php -S 127.0.0.1:8000 server/dev-server.php`
(Einrichtung, Befehle und alle Endpunkte: `apps/kryptogame/README.md`).

Auf dem Server liegt die Konfiguration in `httpdocs/api/config.php` (bindet `config.basis.php` mit dem
Datenbankzugang ein); `scripts/deploy.sh api` lädt sie nie hoch. Die Prüfungen mit Lösungen liegen außerhalb des
Webordners in `kryptogame-data/quizzes/`.

## KryptoGAME

Das KryptoGAME ist eine eigenständige React-App (eigenes Design, eigener Build) unter `/informatik/kryptogame/`;
seine Daten verwaltet die Schulbuch-API. `scripts/deploy.sh kryptogame` baut und lädt es hoch, `scripts/deploy.sh live`
fasst den Ordner nie an. Details: `apps/kryptogame/README.md`.

## Lizenz

Alle Inhalte – Texte, Aufgaben, Grafiken und Programmcode – stehen unter
[CC BY-NC-SA 4.0](LICENSE.md), © Philippe Nix. Ausgenommen sind Inhalte Dritter wie die eingebetteten
Übungen von LearningApps.org.
