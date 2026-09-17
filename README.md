# Krypto-Zeitreise (KryptoGAME)

Ein interaktives Lernspiel zur **klassischen Kryptologie** für den Informatikunterricht.
Als Mitglied des geheimen *Krypto-Zeitkommandos* reisen die Lernenden durch die Geschichte –
von Julius Caesar über Al-Kindi und Blaise de Vigenère bis zum One-Time-Pad – und lernen dabei
Verschlüsselungsverfahren kennen, wenden sie an und knacken sie.

🌐 **Live-Version:** <https://online-schulbuch.de/informatik/kryptogame/>

---

## Inhalt

- [Zielgruppe und Konzept](#zielgruppe-und-konzept)
- [Levelübersicht](#levelübersicht)
- [Rollen](#rollen)
- [Technik](#technik)
- [Projektstruktur](#projektstruktur)
- [Lokale Entwicklung](#lokale-entwicklung)
- [Build und Deployment](#build-und-deployment)
- [Backend-API](#backend-api)
- [Bekannte Baustellen und Roadmap](#bekannte-baustellen-und-roadmap)
- [Autor](#autor)
- [Lizenz](#lizenz)

---

## Zielgruppe und Konzept

Das Spiel lässt sich flexibel in der **Sekundarstufe I und II** einsetzen.

Jedes Level folgt demselben Aufbau:

1. **Story-Einstieg:** Eine Zeitreise führt zu einer historischen Person oder Situation.
2. **Interaktive Aufgaben:** Mit Werkzeugen wie Chiffrierscheibe, Tabula Recta oder Häufigkeitsanalyse
   werden Nachrichten ver- und entschlüsselt.
3. **Fachkonzepte:** Die Begriffe werden zusammengefasst und gesichert, dazu gibt es ein frei nutzbares Tool.
4. **Zwischenprüfung:** Erst wenn *alle* Aufgaben richtig gelöst sind, wird das nächste Level freigeschaltet.
   Einige Prüfungsaufgaben greifen Ergebnisse auf, die sich die Lernenden in den vorherigen Aufgaben notieren sollen.

## Levelübersicht

| Level | Epoche / Personen | Inhalte | Werkzeuge |
|-------|-------------------|---------|-----------|
| **1** | Rom, 50 v. Chr. – Julius Caesar | Caesar-Verfahren, Verschiebezahl und Schlüssel, Ver- und Entschlüsseln | Chiffrierscheibe (Alberti), Verschiebe-Tool |
| **2** | Bagdad, 9. Jh. – Al-Kindi | Ersetzungsverfahren (monoalphabetische Substitution), Schlüsselraum (26 vs. 26!), Brute Force, Häufigkeitsanalyse | Alphabet-Verschiebung (Brute Force), Häufigkeitsanalyse-Tool, Ersetzungs-Tool |
| **3** | 16.–20. Jh. – Trithemius, Bellaso, Vigenère, Babbage, Kasiski, Miller, Mauborgne | Polyalphabetische Verfahren, progressive Caesar-Chiffre, Tabula Recta, Vigenère-Verfahren, Kasiski-Test, Kolonnenanalyse, One-Time-Pad | Progressive-Caesar-Tool, Tabula Recta, Vigenère-Tool, Schlüssellängen-Tool, Kolonnenanalyse-Tool |
| **4** | *in Planung* | – | – |

## Rollen

| Rolle | Anmeldung | Fortschritt | Besonderheiten |
|-------|-----------|-------------|----------------|
| **Gast** | „Als Gast fortfahren“ | nur lokal im Browser | Kein Konto nötig |
| **Schüler/-in** | Benutzername + Passwort (von der Lehrkraft angelegt) | im Backend gespeichert | Jeder Prüfungsversuch wird mit Punktzahl und Einzelantworten protokolliert |
| **Lehrkraft** | Benutzername + Passwort | – | Alle Level frei zugänglich; **Dashboard** mit Schülerverwaltung (anlegen, bearbeiten, löschen, Fortschritt manuell setzen/zurücksetzen), Versuchsverlauf je Schüler/-in und globaler Statistik (Bestehensquoten, Durchschnittsscores, Auswertung je Aufgabe) |

## Technik

**Frontend**
- [React 18](https://react.dev/) mit [Create React App](https://create-react-app.dev/) (`react-scripts`)
- [React Router 6](https://reactrouter.com/) – `basename` ist `/informatik/kryptogame`
- [Tailwind CSS 3](https://tailwindcss.com/) mit der Schriftart *Oxanium* (Google Fonts)
- [Recharts](https://recharts.org/) für die Statistiken im Lehrkräfte-Dashboard
- [react-beautiful-dnd](https://github.com/atlassian/react-beautiful-dnd) für Drag-&-Drop-Aufgaben
- [lucide-react](https://lucide.dev/) für Icons

**Backend** (`backend/`)
- [Node.js](https://nodejs.org/) mit [Express 5](https://expressjs.com/)
- Datenspeicherung als **eine JSON-Datei** in [JSONBin.io](https://jsonbin.io/), Zugriff über `axios`
- Aktuell gehostet auf dem kostenlosen Tarif von [Render](https://render.com/) (`https://kryptogame.onrender.com`)

## Projektstruktur

```
KryptoGAME/
├── backend/
│   ├── server.js              # Express-API (Login, Fortschritt, Schülerverwaltung, Statistik)
│   ├── users.json             # Beispiel-/Startdaten (wird vom Server nicht mehr gelesen)
│   └── package.json
├── public/
│   └── index.html
├── src/
│   ├── App.js                 # Layout, Seitennavigation und alle Routen
│   ├── index.js               # Einstiegspunkt (Router + AuthProvider)
│   ├── index.css              # Tailwind + globale Stilklassen
│   ├── auth/
│   │   ├── AuthContext.jsx    # Login/Logout, Zugriffsprüfung, Fortschritt speichern
│   │   ├── LoginPage.jsx
│   │   ├── TopBar.jsx
│   │   └── Dashboard.jsx      # Lehrkräfte-Dashboard
│   ├── img/                   # Illustrationen (historische Personen, Hintergrund)
│   └── pages/
│       ├── components/
│       │   ├── LevelGuard.jsx     # Sperrt Seiten, bis das vorherige Level bestanden ist
│       │   ├── WeiterButton.jsx
│       │   ├── ZugriffsError.jsx
│       │   └── tools/             # Interaktive Krypto-Werkzeuge
│       ├── lvl1/ … lvl4/          # Seiten je Level (Intro, Aufgaben, Fachkonzepte, Quiz, Abschluss)
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

## Lokale Entwicklung

### Voraussetzungen

- [Node.js](https://nodejs.org/) (LTS-Version empfohlen) und npm
- Ein [JSONBin.io](https://jsonbin.io/)-Konto mit einem Bin, das ein Array von Benutzern enthält
  (Aufbau siehe `backend/users.json`)

### 1. Backend starten

```bash
cd backend
npm install
```

Umgebungsvariablen setzen:

| Variable | Bedeutung |
|----------|-----------|
| `JSONBIN_BIN_ID` | ID des JSONBin-Bins mit den Benutzerdaten |
| `JSONBIN_API_KEY` | Master Key des JSONBin-Kontos |
| `PORT` | optional, Standard: `3001` |

```bash
# Linux/macOS
JSONBIN_BIN_ID=… JSONBIN_API_KEY=… npm start

# Windows PowerShell
$env:JSONBIN_BIN_ID="…"; $env:JSONBIN_API_KEY="…"; npm start
```

Das Backend läuft anschließend unter `http://localhost:3001`.

### 2. Frontend starten

Im Projektwurzelverzeichnis:

```bash
npm install
npm start
```

Das Spiel ist dann unter <http://localhost:3000/informatik/kryptogame> erreichbar.

> **Hinweis:** Die Backend-Adresse ist derzeit fest als `http://localhost:3001` im Quellcode eingetragen
> (`src/auth/AuthContext.jsx`, `src/auth/Dashboard.jsx` und in den Quiz-Seiten).

## Build und Deployment

```bash
npm run build
```

Den Inhalt von `build/` auf den Webspace ins Verzeichnis `/informatik/kryptogame/` hochladen.
Weil `BrowserRouter` verwendet wird, muss der Webserver unbekannte Pfade unterhalb dieses Verzeichnisses
auf `index.html` umleiten, damit Seiten direkt aufgerufen oder neu geladen werden können.

Vor dem Build für die Live-Version muss die Backend-Adresse im Code auf `https://kryptogame.onrender.com` geändert werden.
Die aktuell veröffentlichte Version nutzt diese Adresse, der Stand im Repository dagegen noch `localhost`.

## Backend-API

| Methode | Pfad | Zweck |
|---------|------|-------|
| `POST` | `/login` | Anmeldung (`username`, `password`) → Benutzerdaten ohne Passwort |
| `GET` | `/progress/:username` | Fortschritt einer Schülerin / eines Schülers |
| `POST` | `/progress/:username` | Fortschritt setzen (`{ level1Passed: true, … }`, optional `_skipHistory`) |
| `POST` | `/progress/:username/recordAttempt` | Prüfungsversuch protokollieren (`levelKey`, `score`, `details`) |
| `GET` | `/progress/:username/history` | Verlauf aller Prüfungsversuche |
| `GET` | `/students?teacher=…` | Schüler/-innen einer Lehrkraft |
| `POST` | `/students` | Schüler/-in anlegen (`username`, `password`, `teacher`) |
| `PUT` | `/students/:username` | Schüler/-in bearbeiten (Name, Passwort, Fortschritt) |
| `DELETE` | `/students/:username` | Schüler/-in löschen |
| `DELETE` | `/students/:username/reset` | Fortschritt und Verlauf zurücksetzen |
| `GET` | `/teachers/:teacher/statistics` | Aggregierte Statistik für das Dashboard |

### Datenmodell (ein Eintrag im JSONBin-Array)

```json
{
  "username": "max",
  "password": "…",
  "role": "student",
  "teacher": "lehrer1",
  "progress": { "level1Passed": true },
  "history": {
    "level1Passed": [
      { "timestamp": "2025-06-28T00:12:50.266Z", "score": 33, "details": [ { "task": 1, "correct": false, "answer": "…" } ] },
      { "timestamp": "2025-06-29T10:00:00.000Z", "manual": "freigeschaltet" }
    ]
  }
}
```

## Bekannte Baustellen und Roadmap

Das Projekt ist funktionsfähig und wird im Unterricht eingesetzt. Technisch gibt es aber einiges zu verbessern.

### Datenhaltung und Hosting
- [ ] Die Benutzerdaten liegen als eine einzige JSON-Datei (JSONBin) vor. Das soll durch eine **richtige Datenbank** ersetzt werden.
- [ ] Das Backend auf dem kostenlosen Render-Tarif geht nach Inaktivität in den Sleep-Modus, der erste Aufruf dauert dann lange.
      Der Webspace des Frontends unterstützt kein Node.js, aber PHP. Mögliche Wege:
      **Backend auf PHP + MySQL/MariaDB umstellen** oder **einen anderen Anbieter für das Node-Backend** wählen.
- [ ] Backend-Adresse über eine Umgebungsvariable (`REACT_APP_API_URL`) konfigurieren statt fest im Code

### Sicherheit
- [ ] Passwörter nur gehasht speichern (z. B. bcrypt/argon2 bzw. `password_hash` in PHP)
- [ ] Echte Authentifizierung (Session/Token). Bisher prüft die API nicht, wer eine Anfrage stellt.
- [ ] Berechtigungen serverseitig prüfen: Lehrkräfte dürfen nur ihre eigenen Schüler/-innen sehen und ändern
- [ ] Prüfungsbewertung auf den Server verlagern. Bisher stehen die Lösungen im ausgelieferten JavaScript.
- [ ] Nur geprüfte Felder bei `PUT /students/:username` übernehmen

### Code-Qualität
- [ ] `node_modules/`, `build/` und `kryptogame.zip` aus dem Repository entfernen und eine `.gitignore` anlegen
- [ ] `backend/users.json` mit echten Zugangsdaten nicht im (öffentlichen) Repository ablegen
- [ ] Quiz-Logik in eine wiederverwendbare Komponente auslagern (bisher in jedem Level kopiert)
- [ ] Level-Struktur (Navigation, Routen, Prüfungen) datengetrieben aus einer zentralen Konfiguration erzeugen
- [ ] Fehler beheben: Gäste können Level 2 nicht freischalten (der Fortschritt wird als Cookie gespeichert, aber aus `localStorage` gelesen)
- [ ] Tippfehler und kleinere inhaltliche Ungenauigkeiten in den Texten korrigieren
- [ ] Bilder für das Web komprimieren (einzelne PNGs sind mehrere MB groß)

### Erweiterungen
- [ ] **Level 4** und weitere Level (z. B. Transpositionsverfahren, Enigma, moderne symmetrische Verfahren, Diffie-Hellman, RSA)
- [ ] Mobile Darstellung verbessern

## Autor

**Philippe Nix** ([WiskundeKnobbel](https://github.com/Delbonum))

## Lizenz

Dieses Werk ist lizenziert unter einer
[Creative Commons Namensnennung – Nicht kommerziell – Weitergabe unter gleichen Bedingungen 4.0 International Lizenz (CC BY-NC-SA 4.0)](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.de).

[![CC BY-NC-SA 4.0](https://licensebuttons.net/l/by-nc-sa/4.0/88x31.png)](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.de)
