"""Entrada da API na Vercel (versão de teste). Em produção no IFRN, a API roda com Docker (ver deploy/)."""
import os
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parent.parent / 'backend'
sys.path.insert(0, str(BACKEND))

from sqlalchemy import func, select  # noqa: E402

from app.db import SessionLocal, criar_tabelas  # noqa: E402
from app.main import app  # noqa: E402,F401
from app.modelos import Atividade  # noqa: E402

# Funções não garantem o evento de início do FastAPI: cria as tabelas aqui.
criar_tabelas()
# Homologação: banco novo já começa com a programação de exemplo.
if os.environ.get('ETAL_SEMEAR') == '1':
    with SessionLocal() as db:
        vazio = not db.scalar(select(func.count()).select_from(Atividade))
    if vazio:
        from app.importar import programacao
        programacao(str(BACKEND / 'seed' / 'programacao.json'))
