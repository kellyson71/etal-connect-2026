"""Banco: SQLite para desenvolver, PostgreSQL em produção (ETAL_BANCO=postgresql+psycopg://...)."""
from collections.abc import Iterator
from pathlib import Path

from sqlalchemy import create_engine, event, inspect
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from .config import config


class Base(DeclarativeBase):
    pass


def _engine(url: str):
    if url.startswith('sqlite'):
        eng = create_engine(url, connect_args={'check_same_thread': False})
        event.listen(eng, 'connect', lambda c, _: c.execute('PRAGMA foreign_keys=ON'))
        return eng
    c = config()
    return create_engine(url, pool_pre_ping=True, pool_size=c.banco_conexoes, max_overflow=c.banco_extras, pool_timeout=15)


engine = _engine(config().banco)
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)


BASE = Path(__file__).resolve().parents[1]
REVISAO_BASE = '0001'  # tabelas como estavam antes das migrações
TABELAS_BASE = ('pessoas', 'atividades', 'agenda', 'presencas', 'avisos', 'numeros_sala', 'links_acesso', 'cenarios_demo',
                'arquivos')


def migrar() -> None:
    """Leva o banco até a última migração (migracoes/versoes/). Um banco criado antes das migrações (com as tabelas e
    sem alembic_version) é marcado na revisão base e segue dali. Se ele for de uma versão ainda mais antiga, sem alguma
    tabela da revisão base (o banco da Vercel não tinha a de materiais), essas tabelas são criadas antes."""
    from alembic import command
    from alembic.config import Config

    cfg = Config(str(BASE / 'alembic.ini'))
    with engine.begin() as con:
        tabelas = set(inspect(con).get_table_names())
        cfg.attributes['conexao'] = con
        if 'pessoas' in tabelas and 'alembic_version' not in tabelas:
            from . import modelos  # noqa: F401 (registra as tabelas)
            faltam = [Base.metadata.tables[t] for t in TABELAS_BASE if t not in tabelas]
            Base.metadata.create_all(con, tables=faltam)
            command.stamp(cfg, REVISAO_BASE)
        command.upgrade(cfg, 'head')



def sessao() -> Iterator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
