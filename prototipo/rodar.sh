#!/bin/sh
# Prepara o ambiente (só na primeira vez) e abre o servidor do protótipo em http://127.0.0.1:8770
cd "$(dirname "$0")" || exit 1
[ -x .venv/bin/python ] || { python3 -m venv .venv && .venv/bin/pip install -q -r requirements.txt; } || exit 1
exec .venv/bin/python server.py
