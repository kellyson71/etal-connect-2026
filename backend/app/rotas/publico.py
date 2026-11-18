"""Programação, avisos, lotação e o canal ao vivo (SSE). Não exigem login."""
import asyncio
from collections import Counter

import hashlib
import json

from fastapi import APIRouter, Depends, Request
from fastapi.responses import Response, StreamingResponse
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .. import formatos, suap_inscricoes
from ..ao_vivo import canal
from ..db import sessao
from ..modelos import Agenda, Atividade, Aviso, NumeroSala, Presenca
from ..seguranca import agora

rota = APIRouter(prefix='/api', tags=['público'])


@rota.get('/saude')
def saude(db: Session = Depends(sessao)):
    db.execute(select(1))
    return {'ok': True}


def _json_com_etag(request: Request, dados) -> Response:
    """Resposta com ETag: se o app já tem esta versão, volta 304 sem corpo. O navegador faz isso sozinho nas consultas
    periódicas (hospedagem sem ao vivo, como a Vercel), e a programação não é baixada de novo a cada consulta."""
    corpo = json.dumps(dados, ensure_ascii=False, separators=(',', ':'), default=str).encode()
    etag = '"' + hashlib.sha1(corpo).hexdigest()[:20] + '"'
    cab = {'ETag': etag, 'Cache-Control': 'no-cache'}
    if etag in request.headers.get('if-none-match', ''):
        return Response(status_code=304, headers=cab)
    return Response(corpo, media_type='application/json', headers=cab)


@rota.get('/programacao')
def programacao(request: Request, db: Session = Depends(sessao)):
    inscritos = Counter(dict(db.execute(select(Agenda.atividade_id, func.count()).group_by(Agenda.atividade_id)).all()))
    ativs = db.scalars(select(Atividade).order_by(Atividade.data, Atividade.inicio)).all()
    salas = {n.chave: n.numero for n in db.scalars(select(NumeroSala))}
    sessoes = [formatos.atividade(a, inscritos[a.id]) for a in ativs]
    # minicursos: vagas de verdade, da página de inscrição do evento no SUAP (quando ela responde)
    lidas = suap_inscricoes.atividades()
    if lidas:
        mapa = suap_inscricoes.correspondencia(lidas, [a for a in ativs if a.tipo in suap_inscricoes.COM_INSCRICAO])
        for s in sessoes:
            achada = mapa.get(s['id'])
            if achada and achada.restantes is not None:
                s['seats'], s['taken'] = achada.participantes + achada.restantes, achada.participantes
    return _json_com_etag(request, {'sessions': sessoes, 'rooms': salas})


@rota.get('/avisos')
def avisos(request: Request, db: Session = Depends(sessao)):
    return _json_com_etag(request, [formatos.aviso(v) for v in db.scalars(select(Aviso).order_by(Aviso.em.desc(), Aviso.id.desc()).limit(50))])


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


@rota.get('/cenario-demo')
def cenario_demo(db: Session = Depends(sessao)):
    from fastapi import HTTPException
    from ..config import config
    from ..modelos import CenarioDemo
    if not config().demo:
        raise HTTPException(404)
    cenario = db.get(CenarioDemo, 'vii-etal')
    if not cenario:
        raise HTTPException(404)
    return {k: cenario.dados.get(k) for k in ('event', 'tournaments', 'posts')}
