"""A versão de teste na Vercel (api/index.py) continua subindo: mesmas dependências e o banco migrado na entrada."""
import importlib.util
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]


def _deps(arquivo):
    linhas = (RAIZ / arquivo).read_text().splitlines()
    return {l.split('>')[0].split('[')[0].strip() for l in linhas if l.strip() and not l.startswith('#')}


def test_vercel_tem_as_mesmas_dependencias_da_api():
    assert _deps('requirements.txt') == _deps('backend/requirements.txt') - {'uvicorn'}


def test_vercel_leva_as_migracoes():
    inclui = (RAIZ / 'vercel.json').read_text()
    assert 'migracoes' in inclui and 'alembic.ini' in inclui


def test_entrada_da_vercel_sobe(app_cliente):
    s = importlib.util.spec_from_file_location('entrada_vercel', RAIZ / 'api' / 'index.py')
    m = importlib.util.module_from_spec(s)
    s.loader.exec_module(m)
    assert m.app.title == 'ETAL Connect'
