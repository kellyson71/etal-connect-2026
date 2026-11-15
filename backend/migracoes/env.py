"""Ambiente das migrações: usa o banco de ETAL_BANCO e os modelos de app/modelos.py."""
from alembic import context
from sqlalchemy import engine_from_config, pool

from app import modelos  # noqa: F401  (registra as tabelas no Base)
from app.config import config as etal
from app.db import Base

cfg = context.config
url = cfg.get_main_option('sqlalchemy.url') or etal().banco
alvo = Base.metadata


def offline() -> None:
    context.configure(url=url, target_metadata=alvo, literal_binds=True, render_as_batch=url.startswith('sqlite'))
    with context.begin_transaction():
        context.run_migrations()


def online() -> None:
    con = cfg.attributes.get('conexao')
    if con is not None:  # conexão passada por app/db.py (migrar)
        context.configure(connection=con, target_metadata=alvo, render_as_batch=con.dialect.name == 'sqlite')
        with context.begin_transaction():
            context.run_migrations()
        return
    eng = engine_from_config({'sqlalchemy.url': url}, prefix='sqlalchemy.', poolclass=pool.NullPool)
    with eng.connect() as conexao:
        context.configure(connection=conexao, target_metadata=alvo, render_as_batch=conexao.dialect.name == 'sqlite')
        with context.begin_transaction():
            context.run_migrations()


offline() if context.is_offline_mode() else online()
