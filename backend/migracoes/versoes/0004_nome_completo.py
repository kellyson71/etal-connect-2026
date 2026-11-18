"""nome completo da pessoa no SUAP, para achar as inscrições dela nos minicursos

Revisão: 0004
Anterior: 0003
Criada em: 2026-11-18 01:30:00
"""
from alembic import op
import sqlalchemy as sa


revision = '0004'
down_revision = '0003'
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table('pessoas', schema=None) as batch_op:
        batch_op.add_column(sa.Column('nome_completo', sa.String(length=200), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('pessoas', schema=None) as batch_op:
        batch_op.drop_column('nome_completo')
