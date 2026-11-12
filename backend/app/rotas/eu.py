"""O que é da pessoa: perfil, agenda e presença por QR."""
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from urllib.parse import quote
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .. import formatos
from ..ao_vivo import canal
from ..config import config
from ..db import sessao
from ..limite import limitar
from ..modelos import Agenda, Arquivo, Atividade, Pessoa, Presenca
from ..seguranca import agora, ler_qr, pessoa_atual

rota = APIRouter(prefix='/api', tags=['participante'])


@rota.get('/eu')
def eu(p: Pessoa = Depends(pessoa_atual), db: Session = Depends(sessao)):
    agenda = db.scalars(select(Agenda.atividade_id).where(Agenda.pessoa_id == p.id)).all()
    pres = {a: em.strftime('%H:%M') for a, em in db.execute(select(Presenca.atividade_id, Presenca.em).where(Presenca.pessoa_id == p.id))}
    return {'person': formatos.pessoa(p), 'saved': list(agenda), 'present': pres}


@rota.post('/eu/agenda/{atividade_id}')
def salvar(atividade_id: str, p: Pessoa = Depends(pessoa_atual), db: Session = Depends(sessao)):
    a = db.get(Atividade, atividade_id) or _404()
    if not db.scalar(select(Agenda).where(Agenda.pessoa_id == p.id, Agenda.atividade_id == a.id)):
        if a.vagas and db.scalar(select(func.count()).select_from(Agenda).where(Agenda.atividade_id == a.id)) >= a.vagas:
            raise HTTPException(409, 'Vagas esgotadas.')
        db.add(Agenda(pessoa_id=p.id, atividade_id=a.id))
        db.commit()
    return {'ok': True}


@rota.delete('/eu/agenda/{atividade_id}')
def tirar(atividade_id: str, p: Pessoa = Depends(pessoa_atual), db: Session = Depends(sessao)):
    item = db.scalar(select(Agenda).where(Agenda.pessoa_id == p.id, Agenda.atividade_id == atividade_id))
    if item:
        db.delete(item)
        db.commit()
    return {'ok': True}


class Leitura(BaseModel):
    qr: str = Field(min_length=8, max_length=600, description='URL completa ou token assinado de um QR do ETAL. Obtenha um QR válido em /api/org/qrs. Texto comum ou ID da atividade não substituem a assinatura.', examples=['URL_OU_TOKEN_DO_QR'])


def _404():
    raise HTTPException(404, 'Atividade não encontrada.')


@rota.post('/presenca', dependencies=[Depends(limitar('presenca', 20))])
def presenca(l: Leitura, p: Pessoa = Depends(pessoa_atual), db: Session = Depends(sessao)):
    """QR do evento: credencia. QR de uma atividade: credencia (se preciso) e registra a presença nela.
    Ler de novo não duplica."""
    dados = ler_qr(l.qr)
    t = agora()
    novo_cred = p.credenciado_em is None
    if novo_cred:
        p.credenciado_em = t
    atividade = None
    ja = False
    if dados['a']:
        a = db.get(Atividade, dados['a']) or _404()
        c = config()
        if c.janela_presenca:
            ini = datetime.combine(a.data, datetime.strptime(a.inicio, '%H:%M').time()) - timedelta(minutes=c.antecedencia_min)
            fim = datetime.combine(a.data, datetime.strptime(a.fim, '%H:%M').time())
            if not ini <= t <= fim:
                db.rollback()
                raise HTTPException(409, f'Este QR vale durante a atividade ({a.inicio} às {a.fim} do dia {a.data.day}).')
        ja = bool(db.scalar(select(Presenca).where(Presenca.pessoa_id == p.id, Presenca.atividade_id == a.id)))
        if not ja:
            db.add(Presenca(pessoa_id=p.id, atividade_id=a.id, em=t, via='qr'))
        atividade = a
    db.commit()
    if atividade and not ja:
        n = db.scalar(select(func.count()).select_from(Presenca).where(Presenca.atividade_id == atividade.id))
        canal.publicar('lotacao', {'activity': atividade.id, 'present': n})
    return {'credentialed': True, 'newCredential': novo_cred, 'activity': atividade.id if atividade else None,
            'alreadyPresent': ja, 'time': t.strftime('%H:%M')}


@rota.get('/arquivos/{arquivo_id}')
def abrir_arquivo(arquivo_id: str, baixar: bool = False, p: Pessoa = Depends(pessoa_atual), db: Session = Depends(sessao)):
    """Material da atividade. Abre para a organização e para quem registrou presença nela."""
    arq = db.get(Arquivo, arquivo_id)
    if not arq:
        raise HTTPException(404, 'Material não encontrado.')
    presente = db.scalar(select(Presenca).where(Presenca.pessoa_id == p.id, Presenca.atividade_id == arq.atividade_id))
    if p.papel != 'organizacao' and not presente:
        raise HTTPException(403, 'O material abre depois da presença na atividade.')
    disp = 'attachment' if baixar else 'inline'
    return Response(arq.dados, media_type=arq.tipo, headers={'Content-Disposition': f"{disp}; filename*=UTF-8''{quote(arq.nome)}", 'Cache-Control': 'private, max-age=3600', 'X-Content-Type-Options': 'nosniff'})
