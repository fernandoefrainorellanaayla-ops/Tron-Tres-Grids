#!/usr/bin/env bash
# TRON - Las Tres Grids (Linux / macOS)
cd "$(dirname "$0")"
PY=$(command -v python3 || command -v python)
[ -z "$PY" ] && { echo "Instala Python 3.9+ desde https://www.python.org/downloads/"; exit 1; }
[ -f server/config.local.sh ] && source server/config.local.sh
exec "$PY" server/npc_ai_server.py --open
