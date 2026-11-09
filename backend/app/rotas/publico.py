"""Programação, avisos, lotação e o canal ao vivo (SSE). Não exigem login."""
import asyncio
from collections import Counter

from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .. import formatos
from ..ao_vivo import canal
from ..db import sessao
from ..modelos import Agenda, Atividade, Aviso, NumeroSala, Presenca
from ..seguranca import agora

rota = APIRouter(prefix='/api', tags=['público'])


@rota.get('/saude')
def saude(db: Session = Depends(sessao)):
    db.execute(select(1))
    return {'ok': True}


@rota.get('/programacao')
def programacao(db: Session = Depends(sessao)):
    inscritos = Counter(dict(db.execute(select(Agenda.atividade_id, func.count()).group_by(Agenda.atividade_id)).all()))
    ativs = db.scalars(select(Atividade).order_by(Atividade.data, Atividade.inicio)).all()
    salas = {n.chave: n.numero for n in db.scalars(select(NumeroSala))}
    return {'sessions': [formatos.atividade(a, inscritos[a.id]) for a in ativs], 'rooms': salas}


@rota.get('/avisos')
def avisos(db: Session = Depends(sessao)):
    return [formatos.aviso(v) for v in db.scalars(select(Aviso).order_by(Aviso.em.desc(), Aviso.id.desc()).limit(50))]


@rota.get('/lotacao')
def lotacao(db: Session = Depends(sessao)):
    """Quantas pessoas registraram presença em cada atividade que está acontecendo agora."""
    t = agora(); hoje = t.date(); hm = t.strftime('%H:%M')
    ids = [a.id for a in db.scalars(select(Atividade).where(Atividade.data == hoje, Atividade.inicio <= hm, Atividade.fim > hm))]
    if not ids:
        return {}
    return dict(db.execute(select(Presenca.atividade_id, func.count()).where(Presenca.atividade_id.in_(ids)).group_by(Presenca.atividade_id)).all())


@rota.get('/ao-vivo')
async def ao_vivo(request: Request):
    """Eventos: aviso, sala (troca de sala), numeros (numeração das salas), lotacao."""
    q = canal.entrar()

    async def fluxo():
        try:
            yield 'retry: 5000\n\n'
            while not await request.is_disconnected():
                try:
                    yield await asyncio.wait_for(q.get(), timeout=20)
                except TimeoutError:
                    yield ': ping\n\n'
        finally:
            canal.sair(q)

    return StreamingResponse(fluxo(), media_type='text/event-stream', headers={'Cache-Control': 'no-store', 'X-Accel-Buffering': 'no'})
