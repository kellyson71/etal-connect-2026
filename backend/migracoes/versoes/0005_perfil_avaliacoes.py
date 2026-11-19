"""perfil preenchido no app, saída da atividade, avaliações e configurações do painel

Revisão: 0005
Anterior: 0004
Criada em: 2026-11-19 10:00:00
"""
from alembic import op
import sqlalchemy as sa


revision = '0005'
down_revision = '0004'
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table('pessoas', schema=None) as batch_op:
        batch_op.add_column(sa.Column('cartao', sa.JSON(), nullable=True))
    with op.batch_alter_table('presencas', schema=None) as batch_op:
        batch_op.add_column(sa.Column('saida_em', sa.DateTime(), nullable=True))
    op.create_table(
        'avaliacoes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('pessoa_id', sa.Integer(), nullable=False),
        sa.Column('atividade_id', sa.String(length=64), nullable=False),
        sa.Column('nota', sa.Integer(), nullable=False),
        sa.Column('rapidos', sa.JSON(), nullable=False),
        sa.Column('comentario', sa.Text(), nullable=False),
        sa.Column('em', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['pessoa_id'], ['pessoas.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['atividade_id'], ['atividades.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('pessoa_id', 'atividade_id'),
    )
    op.create_index('ix_avaliacoes_atividade_id', 'avaliacoes', ['atividade_id'])
    op.create_table(
        'configuracoes',
        sa.Column('chave', sa.String(length=60), nullable=False),
        sa.Column('valor', sa.String(length=200), nullable=False),
        sa.PrimaryKeyConstraint('chave'),
    )


def downgrade() -> None:
    op.drop_table('configuracoes')
    op.drop_index('ix_avaliacoes_atividade_id', table_name='avaliacoes')
    op.drop_table('avaliacoes')
    with op.batch_alter_table('presencas', schema=None) as batch_op:
        batch_op.drop_column('saida_em')
    with op.batch_alter_table('pessoas', schema=None) as batch_op:
        batch_op.drop_column('cartao')
