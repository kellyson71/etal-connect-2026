"""Busca de participantes pelo nome e perfil público: o que a pessoa mostrou no perfil, as atividades em que esteve e as
que conduziu. Quem deixou o perfil oculto aparece só com nome e curso."""
import unicodedata

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import sessao
from ..limite import contar
from ..modelos import Atividade, Pessoa, Presenca
from ..seguranca import pessoa_atual

rota = APIRouter(prefix='/api/pessoas', tags=['participante'])


def _dobra(s: str | None) -> str:
    s = unicodedata.normalize('NFD', s or '').encode('ascii', 'ignore').decode().lower()
    return ' '.join(s.split())


def _publico(p: Pessoa) -> dict:
    partes = p.nome.split()
    card = p.cartao or {}
    visivel = card.get('publish', True) is not False
    return {'id': p.id, 'name': p.nome, 'initials': ''.join(x[0] for x in partes[:1] + partes[-1:]).upper() if partes else '',
            'course': p.curso, 'campus': p.campus, 'source': p.tipo, 'photo': p.foto_url, 'public': visivel,
            'card': {**card, 'publish': True} if visivel and card else {'publish': visivel}}


def _conduziu(p: Pessoa, atividades: list[Atividade]) -> list[str]:
    nomes = {_dobra(p.nome), _dobra(p.nome_completo)} - {''}
    return [a.id for a in atividades
            if str((a.extra or {}).get('speakerId', '')) == str(p.id) or (a.palestrante and _dobra(a.palestrante) in nomes)]


@rota.get('')
def buscar(q: str = Query('', max_length=80), eu: Pessoa = Depends(pessoa_atual), db: Session = Depends(sessao)):
    """Até 30 participantes cujo nome contém o texto buscado (sem diferenciar acentos)."""
    contar('busca-pessoas', str(eu.id), 60, msg='Muitas buscas seguidas. Espere um minuto.')
    alvo = _dobra(q)
    if len(alvo) < 2:
        return []
    achados = [p for p in db.scalars(select(Pessoa).order_by(Pessoa.nome)) if alvo in _dobra(p.nome) or alvo in _dobra(p.nome_completo)]
    return [_publico(p) for p in achados[:30]]


@rota.get('/{pessoa_id}')
def perfil(pessoa_id: int, eu: Pessoa = Depends(pessoa_atual), db: Session = Depends(sessao)):
    """Perfil público: atividades em que a pessoa registrou presença e as que conduziu. Perfil oculto não lista nada."""
    p = db.get(Pessoa, pessoa_id)
    if not p:
        raise HTTPException(404, 'Pessoa não encontrada.')
    d = _publico(p)
    if not d['public'] and p.id != eu.id:
        return {**d, 'attended': [], 'taught': []}
    d['attended'] = list(db.scalars(select(Presenca.atividade_id).where(Presenca.pessoa_id == p.id)))
    d['taught'] = _conduziu(p, list(db.scalars(select(Atividade))))
    return d
