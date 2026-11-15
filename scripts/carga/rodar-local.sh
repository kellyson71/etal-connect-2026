#!/bin/sh
# Teste de carga na própria máquina, montado como em produção: PostgreSQL 16 no Docker, a API com um processo só
# e um SUAP de mentira (scripts/carga/suap_falso.py) com atraso parecido com o real. Nada sai da máquina.
#   scripts/carga/rodar-local.sh --pessoas 700 --chegada 60            (opções: ver carga.py)
#   SUAP_ATRASO=1.5 scripts/carga/rodar-local.sh ...                   (SUAP mais lento)
#   ETAL_SUAP_SIMULTANEOS=16 scripts/carga/rodar-local.sh ...          (outra fila do SUAP)
set -eu
cd "$(dirname "$0")/../.."
RAIZ=$(pwd)
PY="$RAIZ/backend/.venv/bin/python"
PG=etal-carga-pg
ARQ=$(mktemp -d)
docker run -d --rm --name $PG -e POSTGRES_PASSWORD=carga -e POSTGRES_USER=etal -e POSTGRES_DB=etal \
  -p 127.0.0.1:55432:5432 postgres:16-alpine >/dev/null
API=''; SUAP=''
limpar() { kill $API $SUAP 2>/dev/null || true; docker stop $PG >/dev/null 2>&1 || true; rm -rf "$ARQ"; }
trap limpar EXIT INT TERM
SUAP_ATRASO=${SUAP_ATRASO:-0.8} "$PY" -m uvicorn suap_falso:app --app-dir scripts/carga --host 127.0.0.1 --port 8099 \
  --log-level warning &
SUAP=$!
export ETAL_BANCO=postgresql+psycopg://etal:carga@127.0.0.1:55432/etal ETAL_LOGIN_DEV=1 ETAL_JANELA_PRESENCA=0 \
  ETAL_SEGREDO=segredo-do-teste-de-carga ETAL_SUAP_API_URL=http://127.0.0.1:8099 ETAL_ARQUIVOS="$ARQ" \
  ETAL_ORIGENS=http://127.0.0.1
# o PostgreSQL reinicia uma vez ao se preparar: tenta importar a programação até ele aceitar
i=0
until (cd backend && "$PY" -m app.importar programacao seed/programacao.json >/dev/null 2>&1); do
  i=$((i + 1)); [ $i -gt 60 ] && { echo 'O PostgreSQL não subiu.'; exit 1; }; sleep 1
done
(cd backend && exec "$PY" -m uvicorn app.main:app --host 127.0.0.1 --port 8098 --no-access-log --log-level warning \
  >"$ARQ/api.log" 2>&1) &
API=$!
"$PY" -c 'import urllib.request,time
for i in range(60):
 try: urllib.request.urlopen("http://127.0.0.1:8098/api/saude",timeout=1);break
 except OSError: time.sleep(.5)
else: raise SystemExit("A API não subiu.")'
"$PY" scripts/carga/carga.py --api http://127.0.0.1:8098 "$@"
