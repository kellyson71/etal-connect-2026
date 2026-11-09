"""Homologação: QRs prontos para testar a leitura. Só existe com ETAL_LOGIN_DEV=1."""
import segno
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import config
from ..db import sessao
from ..modelos import Atividade
from ..seguranca import publica, token_qr

rota = APIRouter(prefix='/api/homologacao', tags=['homologação'])


@rota.get('/qrs')
def qrs(request: Request, db: Session = Depends(sessao)):
    if not config().login_dev:
        raise HTTPException(404)
    base = publica(request)
    itens = [(None, 'Recepção (credenciamento)', '')] + [
        (a.id, a.titulo, f'{a.data:%d/%m} · {a.inicio}–{a.fim}') for a in db.scalars(select(Atividade).order_by(Atividade.data, Atividade.inicio))]
    out = []
    for aid, titulo, quando in itens:
        url = f'{base}/q/{token_qr(aid)}'
        out.append({'id': aid, 'title': titulo, 'when': quando, 'url': url,
                    'svg': segno.make(url, error='m').svg_inline(scale=5, border=2, dark='#0e1726')})
    return out
