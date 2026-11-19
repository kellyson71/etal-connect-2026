"""O que é da pessoa: perfil, agenda e presença por QR."""
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from urllib.parse import quote
from pydantic import BaseModel, Field
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from .. import arquivos, formatos, suap_inscricoes
from ..ao_vivo import canal
from ..config import config
from ..db import sessao
from ..limite import contar, limitar
from ..modelos import Agenda, Arquivo, Atividade, Avaliacao, Pessoa, Presenca
from ..seguranca import agora, ler_qr, pessoa_atual

rota = APIRouter(prefix='/api', tags=['participante'])
# Minicurso e oficina têm vaga limitada e a inscrição é no SUAP: quem está inscrito vem da lista de inscritos da página
# do evento no SUAP (app/suap_inscricoes.py) ou da lista importada pela organização (python -m app.importar inscritos),
# não do marcador do app.
COM_INSCRICAO = suap_inscricoes.COM_INSCRICAO


def sincronizar_inscricoes(db: Session, p: Pessoa) -> set[str]:
    """Põe na agenda as atividades em que a pessoa está inscrita no SUAP. Nos minicursos a lista manda sozinha: o que
    saiu da lista sai da agenda (os que não estão na página ficam, como os da lista importada). Devolve as inscrições."""
    lidas = suap_inscricoes.atividades()
    if not lidas:
        return set()
    ativs = db.scalars(select(Atividade)).all()
    mapa = suap_inscricoes.correspondencia(lidas, ativs)
    if not mapa:
        return set()
    tipos = {a.id: a.tipo for a in ativs}
    meus = {aid for aid, s in mapa.items() if suap_inscricoes.esta_na_lista([p.nome_completo, p.nome], s)}
    atuais = set(db.scalars(select(Agenda.atividade_id).where(Agenda.pessoa_id == p.id, Agenda.atividade_id.in_(list(mapa)))))
    for aid in meus - atuais:
        db.add(Agenda(pessoa_id=p.id, atividade_id=aid))
    sair = {aid for aid in atuais - meus if tipos.get(aid) in COM_INSCRICAO}
    if sair:
        db.execute(delete(Agenda).where(Agenda.pessoa_id == p.id, Agenda.atividade_id.in_(sair)))
    if sair or meus - atuais:
        db.commit()
    return meus


@rota.get('/eu')
def eu(p: Pessoa = Depends(pessoa_atual), db: Session = Depends(sessao)):
    """Perfil, agenda e presenças. `inscricoes`: atividades em que a pessoa está inscrita no SUAP (já na agenda)."""
    inscricoes = sincronizar_inscricoes(db, p)
    agenda = db.scalars(select(Agenda.atividade_id).where(Agenda.pessoa_id == p.id)).all()
    pres, saidas = {}, {}
    for a, em, saida in db.execute(select(Presenca.atividade_id, Presenca.em, Presenca.saida_em).where(Presenca.pessoa_id == p.id)):
        pres[a] = em.strftime('%H:%M')
        if saida:
            saidas[a] = saida.strftime('%H:%M')
    notas = {v.atividade_id: formatos.avaliacao(v) for v in db.scalars(select(Avaliacao).where(Avaliacao.pessoa_id == p.id))}
    return {'person': formatos.pessoa(p), 'saved': list(agenda), 'inscricoes': sorted(inscricoes), 'present': pres,
            'left': saidas, 'ratings': notas, 'card': p.cartao}


@rota.post('/eu/agenda/{atividade_id}')
def salvar(atividade_id: str, p: Pessoa = Depends(pessoa_atual), db: Session = Depends(sessao)):
    """Salva uma atividade na agenda. Minicurso e oficina não: a inscrição neles é feita no SUAP."""
    a = db.get(Atividade, atividade_id) or _404()
    if a.tipo in COM_INSCRICAO:
        raise HTTPException(409, 'A inscrição neste minicurso é feita no SUAP.')
    if not db.scalar(select(Agenda).where(Agenda.pessoa_id == p.id, Agenda.atividade_id == a.id)):
        if a.vagas and db.scalar(select(func.count()).select_from(Agenda).where(Agenda.atividade_id == a.id)) >= a.vagas:
            raise HTTPException(409, 'Vagas esgotadas.')
        db.add(Agenda(pessoa_id=p.id, atividade_id=a.id))
        db.commit()
    return {'ok': True}


@rota.delete('/eu/agenda/{atividade_id}')
def tirar(atividade_id: str, p: Pessoa = Depends(pessoa_atual), db: Session = Depends(sessao)):
    """Tira da agenda. A inscrição em minicurso só sai pelo SUAP (e pela próxima lista importada)."""
    a = db.get(Atividade, atividade_id)
    if a and a.tipo in COM_INSCRICAO:
        raise HTTPException(409, 'Para cancelar a inscrição no minicurso, use o SUAP.')
    if a and a.id in sincronizar_inscricoes(db, p):
        raise HTTPException(409, 'Você está inscrito nesta atividade no SUAP. Para cancelar, use o SUAP.')
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


@rota.post('/presenca', dependencies=[Depends(limitar('presenca-ip'))])
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
    saiu = None
    if dados['a']:
        a = db.get(Atividade, dados['a']) or _404()
        c = config()
        ja = db.scalar(select(Presenca).where(Presenca.pessoa_id == p.id, Presenca.atividade_id == a.id))
        if ja:
            # segunda leitura: perto do fim vale como saída e libera a avaliação; antes disso, só confirma a presença
            saiu = _saida(ja, a, lido or t, c)
            db.commit()
            return {'credentialed': True, 'newCredential': novo_cred, 'activity': a.id, 'alreadyPresent': True,
                    'time': ja.em.strftime('%H:%M'), 'left': saiu, 'exitFrom': _abre_saida(a, c),
                    'rated': bool(db.scalar(select(Avaliacao.id).where(Avaliacao.pessoa_id == p.id, Avaliacao.atividade_id == a.id)))}
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
        db.add(Presenca(pessoa_id=p.id, atividade_id=a.id, em=t, via='qr-adiado' if lido else 'qr'))
        atividade = a
    db.commit()
    if atividade:
        n = db.scalar(select(func.count()).select_from(Presenca).where(Presenca.atividade_id == atividade.id))
        canal.publicar('lotacao', {'activity': atividade.id, 'present': n})
    return {'credentialed': True, 'newCredential': novo_cred, 'activity': atividade.id if atividade else None,
            'alreadyPresent': False, 'time': t.strftime('%H:%M'), 'left': None,
            'exitFrom': _abre_saida(atividade, config()) if atividade else None, 'rated': False}


def _fim(a: Atividade) -> datetime:
    return datetime.combine(a.data, datetime.strptime(a.fim, '%H:%M').time())


def _abre_saida(a: Atividade, c) -> str | None:
    """Hora a partir da qual a leitura de saída vale (None sem a janela de presença)."""
    return (_fim(a) - timedelta(minutes=c.saida_antes_min)).strftime('%H:%M') if c.janela_presenca else None


def _saida(pres: Presenca, a: Atividade, quando: datetime, c) -> str | None:
    """Registra a saída se a leitura caiu perto do fim (ou sempre, sem a janela). Devolve a hora da saída ou None."""
    if pres.saida_em:
        return pres.saida_em.strftime('%H:%M')
    if c.janela_presenca:
        fim = _fim(a)
        if not fim - timedelta(minutes=c.saida_antes_min) <= quando <= fim + timedelta(minutes=c.saida_depois_min):
            return None
    pres.saida_em = quando
    return quando.strftime('%H:%M')


RAPIDOS = ('Didática clara', 'Conteúdo prático', 'Bom ritmo', 'Material útil', 'Tirou minhas dúvidas', 'Quero mais',
           'Rápido demais', 'Faltou prática', 'Difícil de acompanhar', 'Problema técnico', 'Sala desconfortável')


class NovaAvaliacao(BaseModel):
    nota: int = Field(ge=1, le=5, description='De 1 a 5.')
    rapidos: list[str] = Field(default_factory=list, max_length=6, description='Comentários rápidos, da lista do app.')
    comentario: str = Field(default='', max_length=600, description='Comentário aberto (opcional).')


@rota.put('/eu/avaliacoes/{atividade_id}')
def avaliar(atividade_id: str, n: NovaAvaliacao, p: Pessoa = Depends(pessoa_atual), db: Session = Depends(sessao)):
    """Avalia a atividade. Vale para quem leu o QR da sala na entrada e na saída; avaliar de novo substitui."""
    contar('avaliacao', str(p.id), 20, msg='Muitas avaliações seguidas. Espere um minuto.')
    a = db.get(Atividade, atividade_id) or _404()
    pres = db.scalar(select(Presenca).where(Presenca.pessoa_id == p.id, Presenca.atividade_id == a.id))
    if not pres or not pres.saida_em:
        raise HTTPException(409, 'Leia o QR da sala no fim da atividade para liberar a avaliação.')
    v = db.scalar(select(Avaliacao).where(Avaliacao.pessoa_id == p.id, Avaliacao.atividade_id == a.id)) or Avaliacao(pessoa_id=p.id, atividade_id=a.id)
    v.nota, v.rapidos = n.nota, [r for r in dict.fromkeys(n.rapidos) if r in RAPIDOS]
    v.comentario, v.em = n.comentario.strip(), agora()
    db.add(v)
    db.commit()
    return formatos.avaliacao(v)


class Cartao(BaseModel):
    """Perfil do app. Listas e textos com teto, para ninguém guardar um livro no perfil."""
    publish: bool = True
    phone: str = Field(default='', max_length=20)
    email: str = Field(default='', max_length=80)
    link: str = Field(default='', max_length=80)
    nadic: str = Field(default='', max_length=12)
    langs: list[str] = Field(default_factory=list, max_length=20)
    areas: list[str] = Field(default_factory=list, max_length=20)
    open: list[str] = Field(default_factory=list, max_length=10)
    bio: str = Field(default='', max_length=140)
    tema: str = Field(default='', max_length=20, description='Fundo do crachá escolhido no app.')


@rota.put('/eu/cartao')
def salvar_cartao(c: Cartao, p: Pessoa = Depends(pessoa_atual), db: Session = Depends(sessao)):
    """Guarda o perfil preenchido no app: é o que colegas veem ao buscar a pessoa e o que alimenta os números do painel."""
    dados = c.model_dump()
    for k in ('langs', 'areas', 'open'):
        dados[k] = [x.strip()[:40] for x in dict.fromkeys(dados[k]) if x.strip()]
    p.cartao = dados
    db.commit()
    return dados


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