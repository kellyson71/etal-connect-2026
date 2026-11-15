"""materiais em disco: o conteúdo sai do banco (coluna dados passa a aceitar vazio)

Revisão: 0002
Anterior: 0001
Criada em: 2026-11-15 15:26:44.132878
"""
from alembic import op
import sqlalchemy as sa


revision = '0002'
down_revision = '0001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table('arquivos', schema=None) as batch_op:
        batch_op.alter_column('dados',
               existing_type=sa.LargeBinary(),
               nullable=True)



def downgrade() -> None:
    with op.batch_alter_table('arquivos', schema=None) as batch_op:
        batch_op.alter_column('dados',
               existing_type=sa.LargeBinary(),
               nullable=False)

