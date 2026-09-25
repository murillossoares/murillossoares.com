#!/usr/bin/env bash
# Run by systemd (scripts/linkedin/systemd/linkedin-export.path) when a LinkedIn export ZIP lands in the
# downloads folder. Publishes it with ingest-export.sh; on failure moves the ZIP aside so the watcher does not loop.
set -uo pipefail

DIR="${LINKEDIN_EXPORT_DIR:-$HOME/Downloads}"
FAILED="$DIR/linkedin-export-failed"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

notify() {
  echo "$1"
  command -v notify-send >/dev/null && notify-send "LinkedIn export" "$1" 2>/dev/null || true
}

shopt -s nullglob
zips=("$DIR"/*LinkedInDataExport*.zip)
if [ "${#zips[@]}" -eq 0 ]; then
  # The .path unit and LINKEDIN_EXPORT_DIR must point at the same folder; say so instead of exiting silently.
  echo "no *LinkedInDataExport*.zip in $DIR (check LINKEDIN_EXPORT_DIR and PathExistsGlob point to the same folder)"
  exit 0
fi
for zip in "${zips[@]}"; do
  # Wait until the browser has finished writing the file (size stable for 5 seconds).
  prev=-1
  for _ in $(seq 1 60); do
    size="$(stat -c %s -- "$zip" 2>/dev/null || echo -1)"
    [ "$size" = "$prev" ] && [ "$size" -gt 0 ] && break
    prev="$size"
    sleep 5
  done

  if "$HERE/ingest-export.sh" "$zip" --push --delete-zip; then
    notify "Positions.csv publicado a partir de $(basename "$zip")."
  else
    mkdir -p "$FAILED" && chmod 700 "$FAILED"
    mv -- "$zip" "$FAILED/" 2>/dev/null || rm -f -- "$zip"
    notify "Falha ao publicar $(basename "$zip"); veja: journalctl --user -u linkedin-export.service"
  fi
done
exit 0
