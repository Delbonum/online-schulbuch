#!/usr/bin/env bash
# Lädt das Schulbuch auf den Webspace.
#
#   scripts/deploy.sh vorschau            → https://online-schulbuch.de/vorschau/ (wird vorher komplett geleert)
#   scripts/deploy.sh live                → https://online-schulbuch.de/
#   scripts/deploy.sh api                 → Schulbuch-API (server/) nach /api/
#   scripts/deploy.sh kryptogame          → KryptoGAME bauen und nach /informatik/kryptogame/ laden
#   scripts/deploy.sh live api kryptogame → mehreres zusammen, trotzdem mit nur EINER Anmeldung
#
# Dateien werden überschrieben bzw. ergänzt; was nicht mitkommt, bleibt auf dem Server liegen.
# Die Konfiguration der API (api/config.php, api/config.basis.php mit dem Datenbankzugang) wird nie
# hochgeladen und nie überschrieben.
set -euo pipefail

HOST="srv-nixphilippe01@online-schulbuch.de"
# Genau EINE direkte Anmeldung, ohne ControlMaster: Unter Git Bash/Windows scheitert der
# Master-Start oft, und ssh baut dann still eine zweite Anmeldung auf (Fail2Ban-Gefahr).
SSH=(ssh -o BatchMode=yes -o ControlMaster=no -o ControlPath=none -o ConnectTimeout=20)
cd "$(dirname "$0")/.."

if [ "${1:-}" = vorschau ]; then
  node scripts/build.mjs --basis=vorschau
  tar -C dist -czf - . | "${SSH[@]}" "$HOST" 'rm -rf httpdocs/vorschau && mkdir -p httpdocs/vorschau && tar -xzf - -C httpdocs/vorschau'
  echo "Vorschau online: https://online-schulbuch.de/vorschau/"
  exit 0
fi

[ $# -gt 0 ] || { echo "Aufruf: $0 vorschau | live|api|kryptogame [...]" >&2; exit 1; }

# Alles in einem Ordner sammeln, der das Home-Verzeichnis auf dem Server nachbildet, und in einem Rutsch übertragen
paket="$(mktemp -d)"
trap 'rm -rf "$paket"' EXIT
chmod 755 "$paket"
web="$paket/httpdocs"
mkdir -p "$web"
for teil in "$@"; do
  case "$teil" in
    live)
      node scripts/build.mjs
      cp -r dist/. "$web/"
      ;;
    api)
      mkdir -p "$web/api" "$paket/kryptogame-data/quizzes"
      tar -C server --exclude='./config.php' --exclude='./config.*.php' --exclude='./data/*.sqlite*' \
        --exclude='./users.json' --exclude='./tests' --exclude='./dev-server.php' --exclude='./quizzes' -cf - . | tar -C "$web/api" -xf -
      cp server/config.example.php "$web/api/"
      # Prüfungen mit Lösungen außerhalb des Webordners (nginx liefert .json sonst womöglich direkt aus)
      cp server/quizzes/*.json "$paket/kryptogame-data/quizzes/"
      ;;
    kryptogame)
      (cd apps/kryptogame && npm run build)
      mkdir -p "$web/informatik/kryptogame"
      cp -r apps/kryptogame/build/. "$web/informatik/kryptogame/"
      ;;
    *)
      echo "Unbekannter Teil: $teil (erlaubt: live, api, kryptogame)" >&2
      exit 1
      ;;
  esac
done

# --no-overwrite-dir: Rechte vorhandener Ordner (Home, httpdocs) nie verändern
tar -C "$paket" -czf - . | "${SSH[@]}" "$HOST" \
  'tar --no-overwrite-dir -xzf - && if [ -d httpdocs/api ] && [ ! -f httpdocs/api/config.php ]; then echo "WARNUNG: httpdocs/api/config.php fehlt – die API antwortet mit 503."; fi'
echo "Hochgeladen: $*"
