#!/usr/bin/env bash
# Start a new film from the skill's starter: copies assets/starter to <dest> (default ./launch), refreshes its tools from
# scripts/, and installs puppeteer-core. Then: put the brand's logo at <dest>/brand/logo.svg, point film.config.json at the
# product (root, inject), and render the sample to prove the toolchain:  node <dest>/tools/at.js <dest>/probe 1.5 3.6 5.5 7.6 9.8 11 14.5
set -euo pipefail
SK="$(cd "$(dirname "$0")/.." && pwd)"
DEST="${1:-launch}"
if [ -e "$DEST/film/film.js" ]; then echo "$DEST already has a film; not overwriting" >&2; exit 1; fi
mkdir -p "$DEST"
cp -R "$SK/assets/starter/." "$DEST/"
cp "$SK/scripts/"{config.js,serve.js,frame.js,render.js,at.js,animcheck.js,record.js} "$DEST/tools/"
mkdir -p "$DEST/out" "$DEST/assets"
(cd "$DEST/tools" && npm install --silent --no-audit --no-fund)
echo "new film in $DEST: edit film/timeline.js and film/film.js; brand/logo.svg is a placeholder"
