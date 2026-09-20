#!/usr/bin/env bash
# Prüft nach dem Hochladen, ob alles auf dem Server angekommen ist.
#
#   scripts/pruefen.sh live                  Übersicht über die Live-Version
#   scripts/pruefen.sh vorschau              dasselbe für /vorschau/
#   scripts/pruefen.sh live /deutsch/grammatik/ /impressum/
#                                            zusätzlich einzelne Adressen per HTTP abrufen
#   scripts/pruefen.sh live --ohne-http      nur über SSH prüfen, gar kein HTTP
#
# Warum dieses Skript und keine curl-Schleife?
# Plesk/Fail2Ban auf dem Server sperrt die IP-Adresse, wenn in kurzer Zeit zu viele
# Verbindungen eintreffen – danach ist die Website 10–60 Minuten nicht erreichbar.
# Deshalb hält sich dieses Skript an drei Regeln:
#   1. Alle Datei-Prüfungen laufen in EINEM einzigen SSH-Aufruf.
#   2. Höchstens HTTP_MAX HTTP-Anfragen pro Durchgang, mit PAUSE Sekunden dazwischen.
#   3. Beim ersten Verbindungsfehler (curl-Code 000) wird sofort abgebrochen –
#      niemals weiter anfragen, das verlängert die Sperre nur.
set -euo pipefail

HOST="srv-nixphilippe01@online-schulbuch.de"
DOMAIN="https://online-schulbuch.de"
HTTP_MAX=8      # absolute Obergrenze an HTTP-Anfragen pro Durchgang
PAUSE=3         # Sekunden zwischen zwei HTTP-Anfragen

cd "$(dirname "$0")/.."

ziel="${1:-}"
shift || true
case "$ziel" in
  live)     fern="httpdocs";          basis="$DOMAIN" ;;
  vorschau) fern="httpdocs/vorschau"; basis="$DOMAIN/vorschau" ;;
  *) echo "Aufruf: $0 live|vorschau [--ohne-http] [/adresse/ ...]" >&2; exit 1 ;;
esac

ohne_http=0
adressen=()
for a in "$@"; do
  if [ "$a" = "--ohne-http" ]; then ohne_http=1; else adressen+=("$a"); fi
done

# ---------------------------------------------------------------- SSH (ein Aufruf)

# ~/.ssh/config bündelt alle Aufrufe über eine Steuerverbindung (ControlMaster).
# Wird diese Verbindung vom Server abgeschossen, bleibt ein toter Socket liegen und
# jeder weitere Aufruf scheitert mit „Failed to connect to new control master“.
# Deshalb vorher prüfen und die Leiche wegräumen – das kostet keine Verbindung.
socket=$(ssh -G "$HOST" | sed -n 's/^controlpath //p')
if [ -n "$socket" ] && [ -e "$socket" ] && ! ssh -O check "$HOST" >/dev/null 2>&1; then
  echo "(toter Steuer-Socket entfernt)"
  rm -f "$socket"
fi

echo "== Server ($fern) =="
ssh -o BatchMode=yes -o ConnectTimeout=20 "$HOST" "
  cd '$fern' || exit 1
  echo 'Seiten gesamt:      '\$(ls -R . | grep -c '^index.html$')
  echo 'Deutsch-Kapitel:    '\$(ls deutsch | grep -cv '^index.html$')
  echo 'Informatik-Kapitel: '\$(ls informatik | grep -cv '^index.html$')
  echo
  echo 'Zuletzt geändert:'
  ls -la index.html sitemap.xml suche.json .htaccess 2>/dev/null | grep -v '^total'
" || { echo "SSH nicht erreichbar – siehe Hinweis unten." >&2; exit 2; }

[ "$ohne_http" = "1" ] && { echo; echo "HTTP übersprungen (--ohne-http)."; exit 0; }

# ---------------------------------------------------------------- HTTP (streng begrenzt)

pruefe() {  # $1 = Adresse; gibt den Status aus, bricht bei 000 ab
  local code
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "$basis$1?v=$RANDOM" || echo 000)
  printf '  %-45s %s\n' "$1" "$code"
  if [ "$code" = "000" ]; then
    cat >&2 <<'HINWEIS'

ABBRUCH: keine Antwort (Code 000).
Das ist fast immer die Fail2Ban-Sperre des Servers – die eigene IP ist für Port 80/443
gesperrt. Jetzt KEINE weiteren Anfragen schicken, das verlängert die Sperre nur.
  - Prüfstand über SSH erheben: scripts/pruefen.sh <ziel> --ohne-http
  - Sperre aufheben: Plesk-Panel (Port 8443) → Tools & Einstellungen → IP-Adressensperre
  - oder 10–60 Minuten warten bzw. das Netz wechseln (Handy-Hotspot)
HINWEIS
    exit 3
  fi
}

echo
echo "== HTTP-Stichproben (höchstens $HTTP_MAX) =="
[ "${#adressen[@]}" -eq 0 ] && adressen=("/")

if [ "${#adressen[@]}" -gt "$HTTP_MAX" ]; then
  echo "Zu viele Adressen (${#adressen[@]}); erlaubt sind $HTTP_MAX." >&2
  exit 1
fi

erste=1
for a in "${adressen[@]}"; do
  [ "$erste" = "1" ] || sleep "$PAUSE"
  erste=0
  pruefe "$a"
done

echo
echo "Fertig. Denk daran: Plesk-nginx cacht einige Minuten (X-Cache-Status: STALE)."
