import os
import sys
from pathlib import Path

import pytest

BASE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BASE))
os.environ.update({'ETAL_BANCO': 'sqlite:///./teste.db', 'ETAL_LOGIN_DEV': '1', 'ETAL_JANELA_PRESENCA': '0',
                   'ETAL_SEGREDO': 'segredo-de-teste', 'ETAL_URL_PUBLICA': 'http://teste'})


@pytest.fixture()
def app_cliente():
    from fastapi.testclient import TestClient

    from app import importar
    from app.db import Base, engine
    from app.main import app
    from app.limite import _hist
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    importar.programacao(str(BASE / 'seed/programacao.json'))
    _hist.clear()
    with TestClient(app) as c:
        yield c
    Base.metadata.drop_all(engine)


def entrar(c, nome='Ana Teste', org=False, matricula=None):
    r = c.post('/api/auth/dev', json={'nome': nome, 'organizacao': org, 'matricula': matricula})
    assert r.status_code == 200
    return r
