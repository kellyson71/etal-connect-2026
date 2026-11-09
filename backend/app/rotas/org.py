"""Painel da organização: avisos, troca de sala, numeração, credenciamento manual, exportações e QRs para imprimir."""
import csv
import io

import segno
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse, Response
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .. import formatos
from ..ao_vivo import canal
from ..config import config
from ..db import sessao
from ..modelos import Agenda, Atividade, Aviso, NumeroSala, Pessoa, Presenca
from ..seguranca import agora, organizacao, publica, token_qr

rota = APIRouter(prefix='/api/org', tags=['organização'], dependencies=[Depends(organizacao)])


class NovoAviso(BaseModel):
    titulo: str = Field(min_length=2, max_length=140)
    texto: str = Field(min_length=2, max_length=1000)
    atividade: str | None = None


@rota.post('/avisos', status_code=201)
def novo_aviso(n: NovoAviso, eu: Pessoa = Depends(organizacao), db: Session = Depends(sessao)):
    if n.atividade and not db.get(Atividade, n.atividade):
        raise HTTPException(404, 'Atividade não encontrada.')
    v = Aviso(titulo=n.titulo.strip(), texto=n.texto.strip(), atividade_id=n.atividade, autor_id=eu.id, em=agora())
    db.add(v)
    db.commit()
    canal.publicar('aviso', formatos.aviso(v))
    return formatos.aviso(v)


class TrocaSala(BaseModel):
    andar: int | None = None
    zona: str | None = None
    sala: str = Field(min_length=1, max_length=120)
    avisar: bool = True


@rota.patch('/atividades/{atividade_id}/sala')
def trocar_sala(atividade_id: str, t: TrocaSala, eu: Pessoa = Depends(organizacao), db: Session = Depends(sessao)):
    a = db.get(Atividade, atividade_id)
    if not a:
        raise HTTPException(404, 'Atividade não encontrada.')
    antes = a.sala
    a.andar, a.zona, a.sala = t.andar, t.zona, t.sala
    v = None
    if t.avisar:
        v = Aviso(titulo='Mudança de sala', texto=f'{a.curto}: agora em {a.sala}. Antes era {antes}.', atividade_id=a.id, autor_id=eu.id, em=agora())
        db.add(v)
    db.commit()
    canal.publicar('sala', {'activity': a.id, 'floor': a.andar, 'zone': a.zona, 'room': a.sala})
    if v:
        canal.publicar('aviso', formatos.aviso(v))
    return formatos.atividade(a)


@rota.put('/salas')
def numeros(mapa: dict[str, str], db: Session = Depends(sessao)):
    """Numeração definida pela organização: {"andar:zona": "número"}; número vazio volta ao original."""
    for chave, num in mapa.items():
        atual = db.get(NumeroSala, chave)
        if num.strip():
            if atual:
                atual.numero = num.strip()[:12]
            else:
                db.add(NumeroSala(chave=chave, numero=num.strip()[:12]))
        elif atual:
            db.delete(atual)
    db.commit()
    salas = {n.chave: n.numero for n in db.scalars(select(NumeroSala))}
    canal.publicar('numeros', salas)
    return salas


@rota.get('/participantes')
def participantes(q: str = '', db: Session = Depends(sessao)):
    s = select(Pessoa).order_by(Pessoa.nome).limit(500)
    if q:
        s = s.where(Pessoa.nome.ilike(f'%{q}%') | Pessoa.matricula.ilike(f'%{q}%') | Pessoa.email.ilike(f'%{q}%'))
    return [formatos.pessoa(p) for p in db.scalars(s)]


@rota.post('/credenciar/{pessoa_id}')
def credenciar(pessoa_id: int, db: Session = Depends(sessao)):
    p = db.get(Pessoa, pessoa_id)
    if not p:
        raise HTTPException(404, 'Pessoa não encontrada.')
    if not p.credenciado_em:
        p.credenciado_em = agora()
        db.commit()
    return formatos.pessoa(p)


@rota.get('/resumo')
def resumo(db: Session = Depends(sessao)):
    return {'pessoas': db.scalar(select(func.count()).select_from(Pessoa)),
            'credenciados': db.scalar(select(func.count()).select_from(Pessoa).where(Pessoa.credenciado_em.is_not(None))),
            'presencas': db.scalar(select(func.count()).select_from(Presenca)),
            'agenda': db.scalar(select(func.count()).select_from(Agenda))}


def _csv(linhas: list[list], cab: list[str], nome: str) -> Response:
    buf = io.StringIO()
    w = csv.writer(buf, delimiter=';')
    w.writerow(cab)
    w.writerows(linhas)
    return Response('﻿' + buf.getvalue(), media_type='text/csv; charset=utf-8',
                    headers={'Content-Disposition': f'attachment; filename="{nome}"'})


@rota.get('/presencas.csv')
def presencas_csv(db: Session = Depends(sessao)):
    """Presenças por atividade, para lançar no SUAP (certificados)."""
    q = select(Pessoa.nome, Pessoa.matricula, Pessoa.email, Atividade.id, Atividade.titulo, Presenca.em, Presenca.via)\
        .join(Presenca, Presenca.pessoa_id == Pessoa.id).join(Atividade, Atividade.id == Presenca.atividade_id).order_by(Atividade.id, Pessoa.nome)
    return _csv([[n, m or '', e or '', a, t, em.strftime('%d/%m/%Y %H:%M'), v] for n, m, e, a, t, em, v in db.execute(q)],
                ['nome', 'matricula', 'email', 'atividade', 'titulo', 'quando', 'via'], 'presencas.csv')


@rota.get('/credenciados.csv')
def credenciados_csv(db: Session = Depends(sessao)):
    q = select(Pessoa).where(Pessoa.credenciado_em.is_not(None)).order_by(Pessoa.nome)
    return _csv([[p.nome, p.matricula or '', p.email or '', p.tipo, p.credenciado_em.strftime('%d/%m/%Y %H:%M')] for p in db.scalars(q)],
                ['nome', 'matricula', 'email', 'tipo', 'credenciado_em'], 'credenciados.csv')


@rota.get('/qrs', response_class=HTMLResponse)
def qrs(request: Request, db: Session = Depends(sessao)):
    """Página para imprimir: um QR do credenciamento e um por atividade com sala."""
    base = publica(request)
    itens = [('Credenciamento no ETAL', 'Recepção e entrada', token_qr(None))]
    itens += [(a.titulo, f'{a.sala or ""} · {a.data.strftime("%d/%m")} · {a.inicio}–{a.fim}', token_qr(a.id))
              for a in db.scalars(select(Atividade).where(Atividade.andar.is_not(None)).order_by(Atividade.data, Atividade.inicio))]
    cards = ''.join(f'<section><div class="qr">{segno.make(f"{base}/q/{t}", error="m").svg_inline(scale=6, border=2)}</div>'
                    f'<h2>{titulo}</h2><p>{onde}</p><small>Abra o ETAL Connect e leia este QR para registrar a presença.</small></section>'
                    for titulo, onde, t in itens)
    return ('<!doctype html><meta charset="utf-8"><title>QRs do ETAL</title><style>body{font:16px system-ui;margin:0}'
            'section{page-break-after:always;display:grid;place-items:center;align-content:center;min-height:95vh;text-align:center;gap:6px}'
            '.qr svg{width:70mm;height:70mm}h2{margin:12px 0 0;font-size:24px}p{margin:0;color:#444}small{color:#777}</style>' + cards)
