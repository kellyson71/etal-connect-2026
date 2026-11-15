"""O que é da pessoa: perfil, agenda e presença por QR."""
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from urllib.parse import quote
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .. import arquivos, formatos
from ..ao_vivo import canal
from ..config import config
from ..db import sessao
from ..limite import contar, limitar
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
    lido_em: datetime | None = Field(default=None, alias='lidoEm', description='Só para leituras guardadas sem internet: quando o QR foi lido no aparelho. A presença vale se essa hora cair na atividade e o envio chegar até ETAL_TOLERANCIA_ENVIO_MIN depois do fim.')
    model_config = {'populate_by_name': True}


def _hora_local(d: datetime) -> datetime:
    """Hora do aparelho no fuso do campus, sem fuso (como as atividades são guardadas)."""
    return d.astimezone(ZoneInfo(config().fuso)).replace(tzinfo=None, microsecond=0) if d.tzinfo else d.replace(microsecond=0)


def _404():
    raise HTTPException(404, 'Atividade não encontrada.')


@rota.post('/presenca', dependencies=[Depends(limitar('presenca-ip', 600))])
def presenca(l: Leitura, p: Pessoa = Depends(pessoa_atual), db: Session = Depends(sessao)):
    """QR do evento: credencia. QR de uma atividade: credencia (se preciso) e registra a presença nela.
    Ler de novo não duplica."""
    contar('presenca', str(p.id), 30, msg='Muitas leituras seguidas. Espere um minuto.')
    dados = ler_qr(l.qr)
    t = agora()
    lido = _hora_local(l.lido_em) if l.lido_em else None
    if lido and lido > t + timedelta(minutes=2):
        raise HTTPException(400, 'A hora da leitura não confere com o relógio do servidor.')
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
            if lido:  # leitura guardada sem internet
                if not ini <= lido <= fim:
                    db.rollback()
                    raise HTTPException(409, f'A leitura foi feita fora da atividade ({a.inicio} às {a.fim} do dia {a.data.day}).')
                if not ini <= t <= fim + timedelta(minutes=c.tolerancia_envio_min):
                    db.rollback()
                    raise HTTPException(409, f'A leitura guardada chegou tarde: o envio vale até {c.tolerancia_envio_min} minutos depois do fim da atividade.')
            elif not ini <= t <= fim:
                db.rollback()
                raise HTTPException(409, f'Este QR vale durante a atividade ({a.inicio} às {a.fim} do dia {a.data.day}).')
        ja = bool(db.scalar(select(Presenca).where(Presenca.pessoa_id == p.id, Presenca.atividade_id == a.id)))
        if not ja:
            db.add(Presenca(pessoa_id=p.id, atividade_id=a.id, em=t, via='qr-adiado' if lido else 'qr'))
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
    destino = arquivos.caminho(arq.id)
    if arq.dados is not None:  # material antigo, que estava no banco: passa para o disco
        if not destino.exists():
            arquivos.gravar(arq.id, arq.dados)
        arq.dados = None
        db.commit()
    elif not destino.exists():
        raise HTTPException(404, 'Material não encontrado.')
    disp = 'attachment' if baixar else 'inline'
    return FileResponse(destino, media_type=arq.tipo, headers={'Content-Disposition': f"{disp}; filename*=UTF-8''{quote(arq.nome)}",
                                                              'Cache-Control': 'private, max-age=3600'})