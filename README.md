# Krypto-Zeitreise (KryptoGAME)

Ein interaktives Lernspiel zur **Kryptologie** für den Informatikunterricht.
Als Mitglied des geheimen _Krypto-Zeitkommandos_ reisen die Lernenden durch die Geschichte –
von Julius Caesar über Al-Kindi, Vigenère und das One-Time-Pad bis zu Diffie-Hellman und RSA –
und lernen dabei Verschlüsselungsverfahren kennen, wenden sie an und knacken sie.

🌐 **Live-Version:** <https://online-schulbuch.de/informatik/kryptogame/>

---

## Inhalt

- [Zielgruppe und Konzept](#zielgruppe-und-konzept)
- [Levelübersicht](#levelübersicht)
- [Rollen](#rollen)
- [Architektur](#architektur)
- [Projektstruktur](#projektstruktur)
- [Lokale Entwicklung](#lokale-entwicklung)
- [Tests](#tests)
- [Deployment](#deployment)
- [Umzug von JSONBin/Render](#umzug-von-jsonbinrender)
- [Ein neues Level hinzufügen](#ein-neues-level-hinzufügen)
- [Backend-API](#backend-api)
- [Roadmap](#roadmap)
- [Autor](#autor)
- [Lizenz](#lizenz)

---

## Zielgruppe und Konzept

Das Spiel lässt sich flexibel in der **Sekundarstufe I und II** einsetzen.

Jedes Level folgt demselben Aufbau:

1. **Story-Einstieg:** Eine Zeitreise führt zu einer historischen Person oder Situation.
2. **Interaktive Aufgaben:** Mit Werkzeugen wie Chiffrierscheibe, Tabula Recta, Häufigkeitsanalyse oder
   Diffie-Hellman-Rechner werden Nachrichten ver- und entschlüsselt.
3. **Fachkonzepte:** Die Begriffe werden zusammengefasst und gesichert, dazu gibt es ein frei nutzbares Werkzeug.
4. **Zwischenprüfung:** Erst wenn _alle_ Aufgaben richtig gelöst sind, wird das nächste Level freigeschaltet.
   Einige Prüfungsaufgaben greifen Ergebnisse auf, die sich die Lernenden in den vorherigen Aufgaben notieren.

## Levelübersicht

| Level | Epoche / Personen                                                                | Inhalte                                                                                                                                  | Werkzeuge                                                                                                |
| ----- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **1** | Rom, 50 v. Chr. – Julius Caesar                                                  | Caesar-Verfahren, Verschiebezahl und Schlüssel                                                                                           | Chiffrierscheibe (Alberti), Verschiebe-Tool                                                              |
| **2** | Bagdad, 9. Jh. – Al-Kindi                                                        | Ersetzungsverfahren, Schlüsselraum (26 vs. 26!), Brute Force, Häufigkeitsanalyse                                                         | Brute-Force-Tool, Häufigkeitsanalyse, Ersetzungs-Tool                                                    |
| **3** | 16.–20. Jh. – Trithemius, Bellaso, Vigenère, Babbage, Kasiski, Miller, Mauborgne | Polyalphabetische Verfahren, progressive Caesar-Chiffre, Tabula Recta, Vigenère, Kasiski-Test, Kolonnenanalyse, One-Time-Pad             | Progressive-Caesar-Tool, Tabula Recta, Vigenère-Tools, Schlüssellängen- und Kolonnenanalyse              |
| **4** | Stanford, 1976 – Diffie, Hellman, Merkle                                         | Schlüsselaustauschproblem, Farbmisch-Analogie, Modulo-Rechnung, Einwegfunktion, diskreter Logarithmus, Diffie-Hellman, Man-in-the-Middle | Farbmischung, Modulo-Uhr, Modulo-Rechner, diskreter Logarithmus zum Ausprobieren, Diffie-Hellman-Rechner |
| **5** | MIT, 1977 – Rivest, Shamir, Adleman                                              | Asymmetrische Verschlüsselung, Faktorisierung als Einwegfunktion, Schlüsselerzeugung, RSA-Ver- und -Entschlüsselung, digitale Signatur   | Faktorisierungs-Aufgabe, Schlüsselerzeugung, RSA-Rechner                                                 |

## Rollen

| Rolle           | Anmeldung                                   | Fortschritt                     | Besonderheiten                                                                                                                                                                                                                                                                                |
| --------------- | ------------------------------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Gast**        | „Als Gast fortfahren“                       | nur im Browser (`localStorage`) | Kein Konto nötig                                                                                                                                                                                                                                                                              |
| **Schüler/-in** | Benutzername + Passwort (von der Lehrkraft) | in der Datenbank                | Jeder Prüfungsversuch wird mit Punktzahl und Einzelantworten protokolliert                                                                                                                                                                                                                    |
| **Lehrkraft**   | Benutzername + Passwort                     | –                               | Alle Level frei zugänglich; **Dashboard**: Klassen anlegen und Schüler/-innen zuordnen, Zugänge einzeln oder als Liste anlegen (mit druckbaren Zugangskarten), bearbeiten, löschen, Level manuell freischalten/sperren, Prüfungsverlauf mit Details, Statistik für alle oder einzelne Klassen |

## Architektur

```
Browser ──► React-App (statische Dateien)          /informatik/kryptogame/
        └─► PHP-API  ──► MySQL/MariaDB              /informatik/kryptogame/api/
```

**Frontend** – [React 18](https://react.dev/) mit Create React App, [React Router 6](https://reactrouter.com/),
[Tailwind CSS 3](https://tailwindcss.com/), [Recharts](https://recharts.org/) (nur im nachgeladenen Dashboard),
[lucide-react](https://lucide.dev/).

**Backend** – schlanke PHP-API **ohne externe Abhängigkeiten** (PHP ≥ 8.1, PDO), läuft auf gewöhnlichem Shared
Hosting. Daten liegen in **MySQL/MariaDB**; für die lokale Entwicklung genügt **SQLite**.

**Oberfläche** – ein gemeinsamer Seitenrahmen (`.page` in `src/index.css`) gibt allen Levelseiten dieselbe
Textbreite, Abstände und Überschriften. Das Layout ist für Handys ausgelegt: Die Navigation wird dort zum Overlay,
breite Tabellen und Werkzeuge lassen sich seitlich scrollen, Illustrationen werden verkleinert.

**Rollen** – Schüler/-innen, Lehrkräfte und ein **Master-Konto**. Das Master-Konto legt weitere Lehrkräfte an und
gibt Registrierungen frei; festgelegt wird es mit `php bin/console.php make-master <name>` oder über `setup.php`.
Lehrkräfte können sich selbst registrieren (Name, Schule, Ort, E-Mail); die Anfrage geht per E-Mail an die in
`admin_email` hinterlegte Adresse und wird per Link oder im Dashboard entschieden.

**Sicherheit**

- Passwörter werden nur als Hash gespeichert (`password_hash`).
- Anmeldung über ein HttpOnly-Session-Cookie; im Browser werden keine Zugangsdaten oder Rollen gespeichert.
- Bremse gegen Passwort-Raten (vorübergehende Sperre nach 10 Fehlversuchen).
- CSRF-Schutz: schreibende Anfragen nur als JSON und von derselben Herkunft.
- Lehrkräfte sehen und verwalten ausschließlich ihre eigenen Schüler/-innen.
- **Prüfungen werden auf dem Server bewertet** – die Lösungen stehen nicht im ausgelieferten JavaScript.
  Auch die Freischaltung der Level wird serverseitig geprüft.

## Projektstruktur

```
KryptoGAME/
├── backend/                     # PHP-API (wird nach …/kryptogame/api/ hochgeladen)
│   ├── index.php                # Einstiegspunkt aller API-Anfragen
│   ├── setup.php                # Einrichtung per Browser (nur mit Setup-Token aktiv)
│   ├── .htaccess                # Routing + Zugriffsschutz für alle anderen Dateien
│   ├── config.example.php       # Vorlage für config.php (Zugangsdaten, nicht versioniert)
│   ├── bin/console.php          # Kommandozeile: migrate, create-teacher, import-json, …
│   ├── quizzes/levelN.json      # Zwischenprüfungen inkl. Lösungen
│   ├── sql/                     # Datenbankschema (MySQL/MariaDB und SQLite)
│   ├── src/                     # App, Router, Controller, Repositories, Services
│   ├── tests/run.php            # Backend-Tests
│   └── dev-server.php           # Router für den eingebauten PHP-Webserver
├── public/index.html
├── src/
│   ├── levels.js                # ⭐ Zentrale Level-Konfiguration (Seiten, Reihenfolge, Navigation)
│   ├── App.js                   # Layout und Routen (aus levels.js erzeugt)
│   ├── auth/AuthContext.jsx     # Anmeldung, Fortschritt, Freischaltung
│   ├── lib/
│   │   ├── api.js               # Zugriff auf die PHP-API
│   │   ├── crypto.js            # Verschlüsselungsverfahren und Kryptoanalyse (mit Tests)
│   │   ├── colors.js            # Farbmischung für Level 4
│   │   └── progress.js          # Freischaltregel
│   ├── components/
│   │   ├── quiz/                # Gemeinsame Prüfungskomponente und Fragetypen
│   │   ├── tools/               # Interaktive Werkzeuge (Chiffrierscheibe, Vigenère, Diffie-Hellman, …)
│   │   └── …                    # Layout, Navigation, Dialoge
│   ├── dashboard/               # Lehrkräfte-Dashboard
│   ├── pages/lvl1 … lvl5/       # Inhaltsseiten je Level
│   └── img/                     # Illustrationen (WebP)
└── package.json
```

## Lokale Entwicklung

### Voraussetzungen

- [Node.js](https://nodejs.org/) (LTS) und npm
- [PHP 8.1+](https://www.php.net/) mit den Erweiterungen `pdo_sqlite` (lokal) bzw. `pdo_mysql` und `mbstring`

### 1. Backend einrichten

```bash
cp backend/config.example.php backend/config.php
```

In `backend/config.php` für die lokale Entwicklung:

```php
'db' => ['dsn' => 'sqlite:data/kryptogame.sqlite'],
'secure_cookies' => false,
'debug' => true,
'allowed_origins' => ['http://127.0.0.1:8000'],
```

Datenbank anlegen und eine Lehrkraft erstellen:

```bash
php backend/bin/console.php migrate
php backend/bin/console.php create-teacher MeinName meinPasswort
```

### 2. Starten

Zwei Terminals:

```bash
npm run start:api     # PHP-API auf http://127.0.0.1:8000
npm install
npm start             # React-App auf http://localhost:3000/informatik/kryptogame
```

Der React-Entwicklungsserver leitet alle API-Aufrufe per Proxy an den PHP-Server weiter (`proxy` in `package.json`).

### Nützliche Befehle

| Befehl                                            | Zweck                                     |
| ------------------------------------------------- | ----------------------------------------- |
| `npm test`                                        | Frontend-Tests (Jest, Testing Library)    |
| `npm run test:api`                                | Backend-Tests                             |
| `npm run format`                                  | Code mit Prettier formatieren             |
| `php backend/bin/console.php check-quizzes`       | Prüfungsdateien auf Fehler prüfen         |
| `php backend/bin/console.php set-password <name>` | Passwort zurücksetzen (erzeugt ein neues) |

## Tests

```bash
npm test -- --watchAll=false   # Krypto-Bibliothek, Werkzeuge, Freischaltung, Prüfungsablauf, Login
npm run test:api               # API mit SQLite im Arbeitsspeicher
```

Die Backend-Tests lassen sich auch gegen MySQL/MariaDB ausführen (Achtung: die Tabellen der Testdatenbank werden
gelöscht):

```bash
KRYPTOGAME_TEST_DSN="mysql:host=127.0.0.1;dbname=kryptotest;charset=utf8mb4" \
KRYPTOGAME_TEST_USER=… KRYPTOGAME_TEST_PASSWORD=… php backend/tests/run.php
```

Die Backend-Tests prüfen außerdem, dass jede Prüfungsdatei mit ihren eigenen Lösungen bestanden wird und dass keine
Lösung an den Browser ausgeliefert wird. Die Frontend-Tests rechnen die Geheimtext-Aufgaben aller Level nach.

## Deployment

Voraussetzungen beim Hoster: Apache (oder kompatibel, z. B. LiteSpeed) mit `mod_rewrite`, PHP ≥ 8.1 mit `pdo_mysql`
und `mbstring`, eine MySQL-/MariaDB-Datenbank.

1. **Datenbank** im Kundenmenü des Hosters anlegen.
2. **Frontend bauen:** `npm run build`
3. **Hochladen:**
   - Inhalt von `build/` → `/informatik/kryptogame/`
   - Inhalt von `backend/` → `/informatik/kryptogame/api/`
     (`tests/`, `dev-server.php` und `data/` werden auf dem Server nicht benötigt)
4. **Konfigurieren:** `api/config.example.php` → `api/config.php` kopieren und Datenbankzugang eintragen.
5. **Einrichten** – mit SSH-Zugang:
   ```bash
   php api/bin/console.php migrate
   php api/bin/console.php create-teacher MeinName
   ```
   Ohne SSH: in `config.php` ein langes, zufälliges `setup_token` eintragen, `…/kryptogame/api/setup.php` im Browser
   öffnen, Tabellen anlegen und Lehrkräfte erstellen. **Danach das Token wieder auf `''` setzen.**
6. **Direktaufrufe von Unterseiten** (z. B. nach dem Neuladen von `/level2/start`) brauchen eine Weiterleitung auf
   `index.html`. Dazu im Ordner `/informatik/kryptogame/` diese `.htaccess` ablegen:
   ```apache
   RewriteEngine On
   RewriteRule ^api/ - [L]
   RewriteCond %{REQUEST_FILENAME} !-f
   RewriteCond %{REQUEST_FILENAME} !-d
   RewriteRule ^ index.html [L]
   ```

Soll die API unter einer anderen Adresse laufen, beim Build `REACT_APP_API_URL` setzen und in `config.php`
`base_path` anpassen.

## Umzug von JSONBin/Render

Die bisherigen Daten lassen sich übernehmen; Passwörter werden dabei gehasht:

1. Im JSONBin-Dashboard den Bin als JSON exportieren (oder den Inhalt kopieren).
2. Importieren – per Kommandozeile `php api/bin/console.php import-json export.json` oder über `setup.php`.
3. Vorhandene Benutzernamen werden übersprungen, Fortschritt und Prüfungsverlauf werden mit übernommen.
4. Anschließend den Render-Dienst und den JSONBin-Bin löschen – und die Lehrkräfte bitten, ihr Passwort unter
   **Konto** zu ändern, da die alten Passwörter im Klartext gespeichert waren.

## Datenbank aktualisieren

Neue Versionen können zusätzliche Spalten oder Tabellen brauchen. `migrate` legt fehlende Tabellen an und ergänzt
fehlende Spalten – vorhandene Daten bleiben erhalten:

```bash
php backend/bin/console.php migrate
```

Ohne SSH-Zugang geht das über `setup.php` (Setup-Token vorübergehend in `config.php` eintragen, Formular 1 ausführen,
Token wieder entfernen).

## Ein neues Level hinzufügen

1. **Seiten** unter `src/pages/lvlN/` anlegen – normale React-Komponenten. Den „Weiter“-Button, die Navigation und
   die Zugangssperre übernimmt der Rahmen automatisch.
2. **Werkzeuge** unter `src/components/tools/` ablegen; Rechenlogik gehört (mit Tests) nach `src/lib/`.
3. **In `src/levels.js` eintragen** – Reihenfolge der Seiten, Titel für die Navigation, `quiz: true` für die
   Prüfungsseite und eine versteckte `abschluss`-Seite.
4. **Prüfung** als `backend/quizzes/levelN.json` anlegen. Fragetypen:

   ```json
   { "id": 1, "type": "text", "prompt": "…", "answer": "LÖSUNG" }
   { "id": 2, "type": "single", "prompt": "…", "options": ["a", "b"], "answer": 1 }
   { "id": 3, "type": "multiple", "prompt": "…", "options": ["a", "b", "c"], "answer": [0, 2] }
   { "id": 4, "type": "order", "prompt": "…", "items": ["erster Schritt", "zweiter Schritt"] }
   ```

   Textantworten werden ohne Beachtung von Groß-/Kleinschreibung, Leer- und Satzzeichen verglichen; `answer` darf
   auch eine Liste gleichwertiger Lösungen sein. Bei `order` stehen die Einträge in der richtigen Reihenfolge – sie
   werden für die Anzeige gemischt.

5. `php backend/bin/console.php check-quizzes` und die Tests ausführen.

## Backend-API

Alle Pfade relativ zu `…/api`. Anfragen und Antworten im JSON-Format.

| Methode  | Pfad                      | Rolle      | Zweck                                                        |
| -------- | ------------------------- | ---------- | ------------------------------------------------------------ |
| `POST`   | `/auth/login`             | –          | Anmelden (`username`, `password`)                            |
| `POST`   | `/auth/logout`            | –          | Abmelden                                                     |
| `GET`    | `/auth/me`                | –          | Angemeldete Person inkl. `passedLevels` (oder `null`)        |
| `POST`   | `/auth/password`          | angemeldet | Eigenes Passwort ändern (`currentPassword`, `newPassword`)   |
| `GET`    | `/quizzes/{level}`        | –          | Prüfung ohne Lösungen                                        |
| `POST`   | `/quizzes/{level}/submit` | –          | Antworten bewerten (`answers`); speichert bei Schüler/-innen |
| `GET`    | `/students`               | Lehrkraft  | Eigene Schüler/-innen und verfügbare Level                   |
| `POST`   | `/students`               | Lehrkraft  | Schüler/-in anlegen                                          |
| `PATCH`  | `/students/{id}`          | Lehrkraft  | Name, Passwort oder `passedLevels` ändern                    |
| `DELETE` | `/students/{id}`          | Lehrkraft  | Schüler/-in löschen                                          |
| `POST`   | `/students/{id}/reset`    | Lehrkraft  | Fortschritt und Verlauf zurücksetzen                         |
| `GET`    | `/students/{id}/history`  | Lehrkraft  | Prüfungsversuche und manuelle Änderungen                     |
| `GET`    | `/classes`                | Lehrkraft  | Eigene Klassen mit Anzahl der Schüler/-innen                 |
| `POST`   | `/classes`                | Lehrkraft  | Klasse anlegen (`name`)                                      |
| `PATCH`  | `/classes/{id}`           | Lehrkraft  | Klasse umbenennen                                            |
| `DELETE` | `/classes/{id}`           | Lehrkraft  | Klasse löschen (Schüler/-innen bleiben erhalten)             |
| `POST`   | `/register`               | –          | Registrierung einer Lehrkraft beantragen                     |
| `GET`    | `/register/{token}/{ja}`  | –          | Freigabe/Ablehnung über den Link aus der E-Mail (HTML-Seite) |
| `GET`    | `/registrations`          | Master     | Alle Registrierungsanfragen                                  |
| `POST`   | `/registrations/{id}/{e}` | Master     | Anfrage freigeben (`approve`) oder ablehnen (`reject`)       |
| `GET`    | `/teachers`               | Master     | Alle Lehrkräfte                                              |
| `POST`   | `/teachers`               | Master     | Lehrkraft anlegen                                            |
| `PATCH`  | `/teachers/{id}`          | Master     | Name, Passwort oder Master-Rechte ändern                     |
| `DELETE` | `/teachers/{id}`          | Master     | Lehrkraft mit allen Daten löschen                            |
| `GET`    | `/statistics`             | Lehrkraft  | Auswertung; optional `?classId=<id>` oder `?classId=none`    |

## Roadmap

- [ ] Umzug der Live-Version auf das PHP-Backend (siehe [Deployment](#deployment) und [Umzug](#umzug-von-jsonbinrender))
- [ ] Weitere mögliche Level: Transpositionsverfahren (Skytale), Enigma, Hashfunktionen, Zertifikate und HTTPS
- [ ] Interaktive Man-in-the-Middle-Simulation in Level 4
- [ ] Klassen an mehrere Lehrkräfte freigeben (Teamteaching)
- [ ] Prüfungsfragen aus einem Aufgabenpool zufällig ziehen

## Autor

**Philippe Nix** ([WiskundeKnobbel](https://github.com/Delbonum))

## Lizenz

Dieses Werk ist lizenziert unter einer
[Creative Commons Namensnennung – Nicht kommerziell – Weitergabe unter gleichen Bedingungen 4.0 International Lizenz (CC BY-NC-SA 4.0)](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.de).

[![CC BY-NC-SA 4.0](https://licensebuttons.net/l/by-nc-sa/4.0/88x31.png)](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.de)
