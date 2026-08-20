#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
if [[ $# -eq 0 ]]; then
  read -r -p "Modrinth project URL: " MODRINTH_URL
else
  MODRINTH_URL="$1"
fi
python3 tools/import_mod.py "$MODRINTH_URL"
