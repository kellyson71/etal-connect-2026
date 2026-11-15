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


def migrar() -> None:
    """Leva o banco até a última migração (migracoes/versoes/). Um banco criado antes das migrações (com as tabelas e
    sem alembic_version) é marcado na revisão base e segue dali."""
    from alembic import command
    from alembic.config import Config

    cfg = Config(str(BASE / 'alembic.ini'))
    with engine.begin() as con:
        tabelas = set(inspect(con).get_table_names())
        cfg.attributes['conexao'] = con
        if 'pessoas' in tabelas and 'alembic_version' not in tabelas:
            command.stamp(cfg, REVISAO_BASE)
        command.upgrade(cfg, 'head')



def sessao() -> Iterator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
