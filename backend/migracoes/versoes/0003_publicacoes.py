"""publicações no servidor: posts, comentários, chat, curtidas, salvos, denúncias e moderação

Revisão: 0003
Anterior: 0002
Criada em: 2026-11-15 17:40:32.856389
"""
from alembic import op
import sqlalchemy as sa


revision = '0003'
down_revision = '0002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table('moderacao',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('alvo', sa.String(length=80), nullable=False),
    sa.Column('acao', sa.String(length=12), nullable=False),
    sa.Column('por', sa.String(length=200), nullable=False),
    sa.Column('nota', sa.String(length=240), nullable=False),
    sa.Column('texto', sa.String(length=300), nullable=False),
    sa.Column('em', sa.DateTime(), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('publicacoes',
    sa.Column('id', sa.String(length=32), nullable=False),
    sa.Column('tipo', sa.String(length=12), nullable=False),
    sa.Column('pessoa_id', sa.Integer(), nullable=False),
    sa.Column('pai_id', sa.String(length=32), nullable=True),
    sa.Column('texto', sa.Text(), nullable=False),
    sa.Column('atividade_id', sa.String(length=64), nullable=True),
    sa.Column('dia', sa.Integer(), nullable=True),
    sa.Column('assunto', sa.String(length=40), nullable=True),
    sa.Column('mencoes', sa.JSON(), nullable=False),
    sa.Column('fotos', sa.JSON(), nullable=False),
    sa.Column('oculta', sa.Boolean(), nullable=False),
    sa.Column('criada_em', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['pai_id'], ['publicacoes.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['pessoa_id'], ['pessoas.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('publicacoes', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_publicacoes_criada_em'), ['criada_em'], unique=False)
        batch_op.create_index(batch_op.f('ix_publicacoes_pai_id'), ['pai_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_publicacoes_pessoa_id'), ['pessoa_id'], unique=False)

    op.create_table('curtidas',
    sa.Column('pessoa_id', sa.Integer(), nullable=False),
    sa.Column('publicacao_id', sa.String(length=32), nullable=False),
    sa.ForeignKeyConstraint(['pessoa_id'], ['pessoas.id'], ),
    sa.ForeignKeyConstraint(['publicacao_id'], ['publicacoes.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('pessoa_id', 'publicacao_id')
    )
    op.create_table('denuncias',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('publicacao_id', sa.String(length=32), nullable=True),
    sa.Column('alvo', sa.String(length=80), nullable=False),
    sa.Column('pessoa_id', sa.Integer(), nullable=False),
    sa.Column('motivo', sa.String(length=60), nullable=False),
    sa.Column('detalhe', sa.String(length=500), nullable=False),
    sa.Column('copia', sa.JSON(), nullable=False),
    sa.Column('situacao', sa.String(length=12), nullable=False),
    sa.Column('revisada_por', sa.String(length=200), nullable=True),
    sa.Column('revisada_em', sa.DateTime(), nullable=True),
    sa.Column('nota', sa.String(length=240), nullable=True),
    sa.Column('criada_em', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['pessoa_id'], ['pessoas.id'], ),
    sa.ForeignKeyConstraint(['publicacao_id'], ['publicacoes.id'], ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('denuncias', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_denuncias_publicacao_id'), ['publicacao_id'], unique=False)

    op.create_table('salvos',
    sa.Column('pessoa_id', sa.Integer(), nullable=False),
    sa.Column('publicacao_id', sa.String(length=32), nullable=False),
    sa.ForeignKeyConstraint(['pessoa_id'], ['pessoas.id'], ),
    sa.ForeignKeyConstraint(['publicacao_id'], ['publicacoes.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('pessoa_id', 'publicacao_id')
    )


def downgrade() -> None:
    op.drop_table('salvos')
    with op.batch_alter_table('denuncias', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_denuncias_publicacao_id'))

    op.drop_table('denuncias')
    op.drop_table('curtidas')
    with op.batch_alter_table('publicacoes', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_publicacoes_pessoa_id'))
        batch_op.drop_index(batch_op.f('ix_publicacoes_pai_id'))
        batch_op.drop_index(batch_op.f('ix_publicacoes_criada_em'))

    op.drop_table('publicacoes')
    op.drop_table('moderacao')
