"""As migrações criam o mesmo banco que os modelos descrevem, e um banco antigo (de antes delas) segue sem perder dados."""
import os
import subprocess
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]


def _rodar(banco: str, codigo: str) -> str:
    env = {**os.environ, 'ETAL_BANCO': banco}
    r = subprocess.run([sys.executable, '-c', codigo], cwd=BASE, env=env, capture_output=True, text=True, timeout=120)
    assert r.returncode == 0, r.stderr
    return r.stdout


def test_migracoes_batem_com_os_modelos(tmp_path):
    banco = f'sqlite:///{tmp_path / "novo.db"}'
    _rodar(banco, 'from app.db import migrar; migrar()')
    # alembic check: falha se os modelos tiverem algo que as migrações não criam
    r = subprocess.run([str(Path(sys.executable).parent / 'alembic'), 'check'], cwd=BASE, env={**os.environ, 'ETAL_BANCO': banco},
                       capture_output=True, text=True, timeout=120)
    assert r.returncode == 0, r.stdout + r.stderr


def test_banco_antigo_e_atualizado_sem_perder_dados(tmp_path):
    banco = f'sqlite:///{tmp_path / "antigo.db"}'
    # banco como era antes: tabelas da revisão base, sem alembic_version, com uma pessoa
    _rodar(banco, (
        'from alembic.config import Config; from alembic import command; from app.db import BASE, engine; from sqlalchemy import text\n'
        "cfg = Config(str(BASE / 'alembic.ini')); command.upgrade(cfg, '0001')\n"
        "with engine.begin() as c:\n"
        "    c.execute(text('DROP TABLE alembic_version'))\n"
        "    c.execute(text(\"INSERT INTO pessoas (tipo, nome, papel) VALUES ('visitante', 'Pessoa Antiga', 'participante')\"))\n"
    ))
    saida = _rodar(banco, (
        'from app.db import migrar, engine; from sqlalchemy import text\n'
        'migrar()\n'
        "with engine.connect() as c:\n"
        "    print(c.execute(text('SELECT nome FROM pessoas')).scalar(), c.execute(text('SELECT version_num FROM alembic_version')).scalar())\n"
    ))
    assert saida.startswith('Pessoa Antiga ')
