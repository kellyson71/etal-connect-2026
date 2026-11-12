#!/bin/sh
# Banco separado; nenhuma credencial SUAP é armazenada.
set -eu
cd "$(dirname "$0")/.."
DEMO_ROOT=$(pwd)
export ETAL_BANCO="sqlite:///$DEMO_ROOT/backend/demo-etal.db"
export ETAL_SUAP_PORTAL=1
export ETAL_DEMO=1 ETAL_LOGIN_DEV=0 ETAL_JANELA_PRESENCA=0
export ETAL_ORGANIZACAO="${ETAL_ORGANIZACAO:-20251094040030}"
export ETAL_SEGREDO="${ETAL_SEGREDO:-$(python3 -c 'import secrets; print(secrets.token_urlsafe(40))')}"
export ETAL_URL_PUBLICA="http://127.0.0.1:8770"
export ETAL_API="http://127.0.0.1:8011"
(cd backend && .venv/bin/python -m app.demo "$@")
(cd backend && exec .venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8011) &
DEMO_API_PID=$!
cleanup() { kill "$DEMO_API_PID" 2>/dev/null || true; }
trap cleanup EXIT INT TERM
python3 -c 'import urllib.request,time
for i in range(30):
 try: urllib.request.urlopen("http://127.0.0.1:8011/api/saude",timeout=1);break
 except OSError: time.sleep(.2)
else: raise SystemExit("A API da demo não iniciou.")'
sh prototipo/rodar.sh
