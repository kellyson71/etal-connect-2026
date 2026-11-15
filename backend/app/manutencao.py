"""Tarefas de manutenção, para rodar à mão ou no cron do servidor.

    python -m app.manutencao publicacoes [dias]   # apaga publicações (e fotos) com mais de N dias; padrão ETAL_PUBLICACOES_DIAS

Publicação apagada leva junto comentários, curtidas, salvos e fotos. Denúncias ficam, só com a cópia do texto, para o
histórico da moderação."""
import sys
from datetime import timedelta

from sqlalchemy import select

from .config import config
from .db import SessionLocal, migrar
from .modelos import Publicacao
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


if __name__ == '__main__':
    migrar()
    if len(sys.argv) < 2 or sys.argv[1] != 'publicacoes':
        raise SystemExit('uso: python -m app.manutencao publicacoes [dias]')
    dias = int(sys.argv[2]) if len(sys.argv) > 2 else config().publicacoes_dias
    print(f'{publicacoes_antigas(dias)} publicações com mais de {dias} dias apagadas')
