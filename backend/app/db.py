"""Banco: SQLite para desenvolver, PostgreSQL em produção (ETAL_BANCO=postgresql+psycopg://...)."""
from collections.abc import Iterator

from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from .config import config


class Base(DeclarativeBase):
    pass


def _engine(url: str):
    if url.startswith('sqlite'):
        eng = create_engine(url, connect_args={'check_same_thread': False})
        event.listen(eng, 'connect', lambda c, _: c.execute('PRAGMA foreign_keys=ON'))
        return eng
    return create_engine(url, pool_pre_ping=True, pool_size=5, max_overflow=10)


engine = _engine(config().banco)
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)


def criar_tabelas() -> None:
    from . import modelos  # noqa: F401
    Base.metadata.create_all(engine)


def sessao() -> Iterator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
