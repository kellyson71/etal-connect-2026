"""Tarefas de manutenção, para rodar à mão ou no cron do servidor.

    python -m app.manutencao publicacoes [dias]   # apaga publicações (e fotos) com mais de N dias; padrão ETAL_PUBLICACOES_DIAS
    python -m app.manutencao remover-atividade <id>   # tira da programação uma atividade que não vai acontecer

Publicação apagada leva junto comentários, curtidas, salvos e fotos. Denúncias ficam, só com a cópia do texto, para o
histórico da moderação."""
import sys
from datetime import timedelta

from sqlalchemy import delete, func, select, update

from .config import config
from .db import SessionLocal, migrar
from .modelos import Agenda, Arquivo, Atividade, Avaliacao, Aviso, Presenca, Publicacao
from .seguranca import agora


def publicacoes_antigas(dias: int) -> int:
    from .rotas.publicacoes import _apagar
    limite = agora() - timedelta(days=dias)
    with SessionLocal() as db:
        velhas = db.scalars(select(Publicacao).where(Publicacao.criada_em < limite, Publicacao.pai_id.is_(None))).all()
        for x in velhas:
            _apagar(db, x)
        db.commit()
        return len(velhas)


def remover_atividade(atividade_id: str) -> bool:
    """Tira uma atividade da programação (e das agendas). O painel só cria e edita; a programação inicial só carrega em
    banco vazio, então uma atividade que saiu do seed continua no servidor até sair por aqui. Recusa quando já há
    presença, avaliação ou material: aí a atividade aconteceu, e o caminho é editar pelo painel."""
    with SessionLocal() as db:
        a = db.get(Atividade, atividade_id)
        if not a:
            return False
        for modelo, nome in ((Presenca, 'presenças'), (Avaliacao, 'avaliações'), (Arquivo, 'materiais')):
            if db.scalar(select(func.count()).select_from(modelo).where(modelo.atividade_id == atividade_id)):
                raise ValueError(f'{atividade_id} tem {nome}: edite pelo painel em vez de remover.')
        db.execute(delete(Agenda).where(Agenda.atividade_id == atividade_id))
        db.execute(update(Aviso).where(Aviso.atividade_id == atividade_id).values(atividade_id=None))
        db.delete(a)
        db.commit()
        return True


USO = 'uso: python -m app.manutencao publicacoes [dias] | remover-atividade <id>'

if __name__ == '__main__':
    migrar()
    tarefa = sys.argv[1] if len(sys.argv) > 1 else ''
    if tarefa == 'publicacoes':
        dias = int(sys.argv[2]) if len(sys.argv) > 2 else config().publicacoes_dias
        print(f'{publicacoes_antigas(dias)} publicações com mais de {dias} dias apagadas')
    elif tarefa == 'remover-atividade' and len(sys.argv) == 3:
        try:
            print(f'{sys.argv[2]} removida' if remover_atividade(sys.argv[2]) else f'{sys.argv[2]} não existe')
        except ValueError as erro:
            raise SystemExit(str(erro)) from None
    else:
        raise SystemExit(USO)
