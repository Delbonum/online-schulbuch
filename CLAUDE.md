# Online-Schulbuch – Hinweise für Claude

Freies digitales Schulbuch (Deutsch, Informatik), live unter https://online-schulbuch.de, Repo
`Delbonum/online-schulbuch` (öffentlich, CC BY-NC-SA 4.0). Aufbau, Befehle und Inhaltsbausteine stehen in
`README.md` – dort zuerst nachsehen statt das Projekt neu zu erkunden.

## Arbeitsweise
- Mit dem Nutzer auf Deutsch kommunizieren; Texte für Schüler:innen in Du-Anrede, einfache Sprache.
- Seiten entstehen aus `content/` (Kapitelstruktur je Fach in `content/<fach>/kapitel.json`) durch
  `node scripts/build.mjs`. Keine Abhängigkeiten, kein Framework einführen.
- Nach Änderungen: `npm test` (19+ Tests) und `npm run vorschau`; beides muss grün sein.
- Live-Build bricht absichtlich ab, solange `<mark class="todo">` in den Inhalten steht.
- Commit-Nachrichten auf Deutsch.

## Design (vom Nutzer so entschieden)
- Durchgehend **hell**, kein automatischer Dark Mode. Nah am ursprünglichen Baukasten-Design:
  Schriften Raleway (Titel) und Sarabun (Text), lokal in `site/assets/fonts`; graue Kacheln mit
  farbigem Symbolquadrat; graue Hinweiskästen; dünne Titelschrift mit Linie darunter.
- Jedes Fach hat ein Farbpaar (Kopfleiste / Akzent) in `site/assets/css/schulbuch.css`:
  Deutsch `#eae23f` / `#4743c5`, Informatik `#8fd460` / `#0b6b72`, neutral (Startseite usw.) `#3d4a5c`.
- Logo: Original `site/assets/img/logo-original.png`; Fachvarianten und Favicons erzeugt
  `python scripts/logo-varianten.py` (Pillow). Neue Fachfarbe dort eintragen.

## Inhalte
- Werkzeuge liegen in `apps/` und stehen vorerst nur in der Toolsammlung
  (`/informatik/werkzeuge/`); die Einbindung in Fachkapitel erfolgt später, wenn es dort Inhalte gibt.
- Das KryptoGAME ist eine eigenständige App (eigenes Design, eigener Build + PHP-Backend) und wird nur
  verlinkt (neuer Tab). `scripts/deploy.sh` fasst `/informatik/kryptogame/` nie an.
- `materialien/` ist unveröffentlichtes Unterrichtsmaterial und bleibt lokal (gitignored).
- Externe Einbettungen (LearningApps) nur per Klick laden (Datenschutz).
