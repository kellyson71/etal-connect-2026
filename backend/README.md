# Backend do ETAL Connect

API em FastAPI: entrada pelo SUAP e de visitantes, programação, agenda, presença por QR assinado, avisos ao vivo (SSE) e painel da organização.
Plano completo, rotas e implantação: [`docs/PLANO_TECNICO.md`](../docs/PLANO_TECNICO.md).

```sh
python3 -m venv .venv && .venv/bin/pip install -r requirements-dev.txt
.venv/bin/python -m app.importar programacao seed/programacao.json
ETAL_LOGIN_DEV=1 .venv/bin/uvicorn app.main:app --port 8000   # http://127.0.0.1:8000/api/docs
.venv/bin/python -m pytest -q
```

Configuração por variáveis `ETAL_*` (ver `deploy/.env.example`). Produção: `deploy/docker-compose.yml`.
