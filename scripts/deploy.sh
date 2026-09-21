#!/usr/bin/env bash
# Lädt das Schulbuch auf den Webspace.
#
#   scripts/deploy.sh vorschau   → https://online-schulbuch.de/vorschau/ (wird vorher komplett geleert)
#   scripts/deploy.sh live       → https://online-schulbuch.de/
#
# Das KryptoGAME (/informatik/kryptogame/) wird hier nie angefasst; es hat ein eigenes
# Deployment (siehe apps/kryptogame/README.md).
set -euo pipefail

HOST="srv-nixphilippe01@online-schulbuch.de"
# Genau EINE direkte Anmeldung, ohne ControlMaster: Unter Git Bash/Windows scheitert der
# Master-Start oft, und ssh baut dann still eine zweite Anmeldung auf (Fail2Ban-Gefahr).
SSH=(ssh -o BatchMode=yes -o ControlMaster=no -o ControlPath=none -o ConnectTimeout=20)
cd "$(dirname "$0")/.."

case "${1:-}" in
  vorschau)
    node scripts/build.mjs --basis=vorschau
    tar -C dist -czf - . | "${SSH[@]}" "$HOST" 'rm -rf httpdocs/vorschau && mkdir -p httpdocs/vorschau && tar -xzf - -C httpdocs/vorschau'
    echo "Vorschau online: https://online-schulbuch.de/vorschau/"
    ;;
  live)
    node scripts/build.mjs
    # Dateien werden überschrieben bzw. ergänzt; Ordner anderer Apps bleiben unberührt.
    tar -C dist -czf - . | "${SSH[@]}" "$HOST" 'tar -xzf - -C httpdocs'
    echo "Live: https://online-schulbuch.de/"
    ;;
  *)
    echo "Aufruf: $0 vorschau|live" >&2
    exit 1
    ;;
esac
