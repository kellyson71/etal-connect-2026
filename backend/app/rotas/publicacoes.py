"""Publicações do evento: feed com fotos, comentários, chat geral, curtidas, salvos, denúncias e moderação.

Regras (docs/regras-de-negocio.md):
- ver é para quem entrou; publicar, comentar, curtir, mandar mensagem e denunciar é para quem está credenciado;
- até 6 fotos por publicação; o servidor confere que é imagem e grava de novo, sem os dados escondidos da foto
  (como a localização do GPS);
- cada um apaga o que é seu; conteúdo de outra pessoa a organização tira do ar (oculta), com nota e histórico;
- denúncias de 3 pessoas diferentes (ETAL_DENUNCIAS_PARA_OCULTAR) tiram o conteúdo do ar até a organização revisar;
- quem não é da organização nunca recebe conteúdo oculto, denúncias ou o histórico.

O app recebe o estado no mesmo formato que usava no aparelho (prototipo/community.js), para as telas não mudarem.
Quem publicou aparece por um código (p<id>), nunca pela matrícula ou e-mail."""
import base64
import binascii
import io
import secrets
import time
from datetime import datetime
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from .. import arquivos
from ..ao_vivo import canal
from ..config import config
from ..db import sessao
from ..limite import contar, limitar
from ..modelos import Curtida, Denuncia, Moderacao, Pessoa, Publicacao, Salvo
from ..seguranca import agora, organizacao, pessoa_atual

rota = APIRouter(prefix='/api/publicacoes', tags=['publicações'])

MOTIVOS = ['Spam ou propaganda', 'Ofensa ou assédio', 'Conteúdo inadequado', 'Informação enganosa', 'Outro motivo']
ASSUNTOS = ['No evento', 'Conexões', 'Projetos', 'Dicas']
FOTO_MAX = 4 * 1024 * 1024  # já chega reduzida pelo app (1200 px); o teto é contra envio direto pela API
FOTO_LADO = 1600
MAX_POSTS, MAX_MENSAGENS = 300, 200  # o que o app recebe: as mais recentes
# Versão das publicações: muda a cada alteração. O aviso ao vivo leva só o número, e o app que já tem essa versão não
# busca de novo (com centenas de celulares abertos, cada mudança não vira centenas de downloads repetidos).
_versao = {'n': int(time.time() * 1000)}


def _credenciada(p: Pessoa = Depends(pessoa_atual)) -> Pessoa:
    if p.credenciado_em is None:
        raise HTTPException(403, 'Leia o QR Code da recepção para participar.')
    return p


def id_publico(p_id: int, eu: Pessoa) -> str:
    """O app compara o autor com o id da própria pessoa (matrícula, e-mail ou número); os outros veem só p<número>."""
    if p_id == eu.id:
        return eu.matricula or eu.email or str(eu.id)
    return f'p{p_id}'


def _id_interno(texto: str, eu: Pessoa) -> int | None:
    if texto in {eu.matricula, eu.email, str(eu.id)}:
        return eu.id
    if texto.startswith('p') and texto[1:].isdigit():
        return int(texto[1:])
    return None


def _alvo(x: Publicacao) -> str:
    return {'post': f'post:{x.id}', 'comentario': f'comment:{x.pai_id}:{x.id}', 'mensagem': f'message:{x.id}'}[x.tipo]


def _iniciais(nome: str) -> str:
    partes = nome.split()
    return ((partes[0][0] if partes else '?') + (partes[-1][0] if len(partes) > 1 else '')).upper()


def _autor(p: Pessoa, eu: Pessoa) -> dict:
    return {'author': id_publico(p.id, eu), 'name': p.nome, 'initials': _iniciais(p.nome), 'photo': p.foto_url,
            'role': p.curso or (p.instituicao if p.tipo == 'visitante' else None) or ('Visitante' if p.tipo == 'visitante' else 'Participante')}


def _ms(d: datetime) -> int:
    return int(d.timestamp() * 1000)


def estado(db: Session, eu: Pessoa) -> dict:
    """Tudo o que a tela de publicações mostra, no formato de prototipo/community.js."""
    org = eu.papel == 'organizacao'
    def recentes(tipo, n):
        q = select(Publicacao).where(Publicacao.tipo == tipo).order_by(Publicacao.criada_em.desc(), Publicacao.id.desc()).limit(n)
        return db.scalars(q if org else q.where(Publicacao.oculta.is_(False))).all()
    posts, mensagens = recentes('post', MAX_POSTS), recentes('mensagem', MAX_MENSAGENS)
    q = select(Publicacao).where(Publicacao.tipo == 'comentario', Publicacao.pai_id.in_([p.id for p in posts]))
    comentarios = db.scalars(q if org else q.where(Publicacao.oculta.is_(False))).all()
    itens = sorted([*posts, *mensagens, *comentarios], key=lambda x: (x.criada_em, x.id))
    if not org:  # comentário de publicação oculta também some
        vivos = {x.id for x in itens if x.tipo == 'post'}
        itens = [x for x in itens if x.tipo != 'comentario' or x.pai_id in vivos]
    pessoas = {p.id: p for p in db.scalars(select(Pessoa).where(Pessoa.id.in_({x.pessoa_id for x in itens})))} if itens else {}
    v = {'versao': _versao['n'], 'posts': [], 'messages': [], 'comments': {}, 'likes': {}, 'bookmarks': {}, 'reports': [], 'moderation': {},
         'audit': [], 'mentionSeen': {}}
    ids = {x.id for x in itens}
    for x in itens:
        base = {'id': x.id, **_autor(pessoas[x.pessoa_id], eu), 'created': _ms(x.criada_em), 'text': x.texto,
                'mentions': [id_publico(m, eu) for m in x.mencoes or []]}
        if x.tipo == 'post':
            v['posts'].insert(0, {**base, 'activity': x.atividade_id, 'day': x.dia, 'tag': x.assunto, 'likes': 0,
                                  'images': [{'src': f'/api/publicacoes/fotos/{f["id"]}', 'alt': f.get('alt', '')} for f in x.fotos or []]})
        elif x.tipo == 'comentario':
            v['comments'].setdefault(x.pai_id, []).append(base)
        else:
            v['messages'].append(base)
        if x.oculta:
            v['moderation'][_alvo(x)] = {'hidden': True}
    for pid, aid in db.execute(select(Curtida.pessoa_id, Curtida.publicacao_id)):
        if aid in ids:
            v['likes'].setdefault(aid, []).append(id_publico(pid, eu))
    v['bookmarks'][id_publico(eu.id, eu)] = [a for a in db.scalars(select(Salvo.publicacao_id).where(Salvo.pessoa_id == eu.id)) if a in ids]
    if org:
        nomes = {p.id: p.nome for p in db.scalars(select(Pessoa).where(Pessoa.id.in_(select(Denuncia.pessoa_id))))}
        for d in db.scalars(select(Denuncia).order_by(Denuncia.criada_em.desc(), Denuncia.id.desc()).limit(500)):
            v['reports'].append({'id': str(d.id), 'target': d.alvo, 'author': id_publico(d.pessoa_id, eu), 'name': nomes.get(d.pessoa_id, ''),
                                 'reason': d.motivo, 'detail': d.detalhe, 'created': _ms(d.criada_em),
                                 'status': {'pendente': 'pending', 'ocultada': 'hidden', 'arquivada': 'dismissed'}[d.situacao],
                                 'snapshot': d.copia, 'reviewedBy': d.revisada_por, 'note': d.nota,
                                 'reviewedAt': _ms(d.revisada_em) if d.revisada_em else None})
        for m in db.scalars(select(Moderacao).order_by(Moderacao.em.desc(), Moderacao.id.desc()).limit(100)):
            v['audit'].append({'id': str(m.id), 'target': m.alvo, 'action': 'hide' if m.acao == 'auto' else m.acao,
                               'by': m.por, 'at': _ms(m.em), 'note': m.nota, 'text': m.texto})
    return v


def _avisar(tipo: str = 'mudou') -> None:
    """Os celulares abertos buscam o estado de novo (o aviso não leva conteúdo)."""
    _versao['n'] += 1
    canal.publicar('publicacoes', {'tipo': tipo, 'versao': _versao['n']})


@rota.get('', dependencies=[Depends(limitar('publicacoes', 1200))])
def ver(versao: int | None = None, eu: Pessoa = Depends(pessoa_atual), db: Session = Depends(sessao)):
    """Feed (as 300 publicações mais recentes, com os comentários), chat (as 200 últimas mensagens), curtidas e os
    salvos da pessoa. Para a organização, também o que está oculto, as denúncias e o histórico da moderação. Com
    `versao` igual à atual, responde só `{versao, igual: true}`."""
    contar('publicacoes-ver', str(eu.id), 60, msg='Muitas atualizações seguidas. Espere um pouco.')
    if versao == _versao['n']:
        return {'versao': versao, 'igual': True}
    return estado(db, eu)


class Foto(BaseModel):
    dados: str = Field(max_length=6_000_000, description='Imagem JPG, PNG ou WebP em data URL (data:image/jpeg;base64,...).')
    alt: str = Field(default='', max_length=240, description='Descrição da foto, para quem usa leitor de tela.')


class NovaPublicacao(BaseModel):
    texto: str = Field(default='', max_length=2000)
    atividade: str | None = Field(default=None, max_length=64)
    dia: int | None = Field(default=None, ge=1, le=31)
    assunto: str = Field(default='No evento', max_length=40)
    mencoes: list[str] = Field(default_factory=list, max_length=30)
    fotos: list[Foto] = Field(default_factory=list, max_length=6)


class NovoTexto(BaseModel):
    texto: str = Field(min_length=1, max_length=1000)
    mencoes: list[str] = Field(default_factory=list, max_length=30)


def _foto(f: Foto) -> bytes:
    """Confere que é imagem de verdade e grava de novo em JPEG: sai a localização e o que mais vier escondido."""
    from PIL import Image, ImageOps, UnidentifiedImageError
    cab, _, b64 = f.dados.partition(',')
    if not cab.startswith('data:image/') or ';base64' not in cab:
        raise HTTPException(400, 'Foto em formato desconhecido.')
    try:
        bruto = base64.b64decode(b64, validate=True)
    except (binascii.Error, ValueError):
        raise HTTPException(400, 'Foto corrompida.')
    if len(bruto) > FOTO_MAX:
        raise HTTPException(413, 'Foto grande demais.')
    try:
        img = Image.open(io.BytesIO(bruto))
        if img.format not in {'JPEG', 'PNG', 'WEBP'}:
            raise HTTPException(400, 'Use fotos JPG, PNG ou WebP.')
        img = ImageOps.exif_transpose(img).convert('RGB')
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError):
        raise HTTPException(400, 'Não é uma foto válida.')
    img.thumbnail((FOTO_LADO, FOTO_LADO))
    saida = io.BytesIO()
    img.save(saida, 'JPEG', quality=82, optimize=True)
    return saida.getvalue()


def _mencoes(lista: list[str], eu: Pessoa, db: Session) -> list[int]:
    ids = {i for i in (_id_interno(x, eu) for x in lista) if i is not None}
    return sorted(db.scalars(select(Pessoa.id).where(Pessoa.id.in_(ids))).all()) if ids else []


def _novo_id() -> str:
    return secrets.token_hex(16)


def _agora_exato() -> datetime:
    """Com frações de segundo: duas mensagens no mesmo segundo ficam na ordem em que chegaram."""
    from zoneinfo import ZoneInfo
    return datetime.now(ZoneInfo(config().fuso)).replace(tzinfo=None)


@rota.post('', dependencies=[Depends(limitar('publicar', 300))])
async def publicar(n: NovaPublicacao, eu: Pessoa = Depends(_credenciada), db: Session = Depends(sessao)):
    """Nova publicação (texto e/ou até 6 fotos)."""
    contar('publicar', str(eu.id), 10, janela=600, msg='Você publicou bastante agora. Espere uns minutos.')
    texto = n.texto.strip()
    if not texto and not n.fotos:
        raise HTTPException(400, 'Escreva algo ou escolha uma foto.')
    fotos = await run_in_threadpool(lambda: [_foto(f) for f in n.fotos])  # trabalho de imagem fora do laço principal
    guardadas = []
    for f, dados in zip(n.fotos, fotos):
        fid = secrets.token_hex(16)
        arquivos.gravar(fid, dados)
        guardadas.append({'id': fid, 'alt': f.alt.strip()})

    def gravar():
        from ..modelos import Atividade
        a = db.get(Atividade, n.atividade) if n.atividade else None
        x = Publicacao(id=_novo_id(), tipo='post', pessoa_id=eu.id, texto=texto, atividade_id=a.id if a else None,
                       dia=a.data.day if a else n.dia, assunto=n.assunto if n.assunto in ASSUNTOS else 'No evento',
                       mencoes=_mencoes(n.mencoes, eu, db), fotos=guardadas, criada_em=_agora_exato())
        db.add(x)
        db.commit()
        return x.id
    pid = await run_in_threadpool(gravar)
    _avisar()
    return {'id': pid}


def _post_visivel(db: Session, pid: str) -> Publicacao:
    x = db.get(Publicacao, pid)
    if not x or x.tipo != 'post' or x.oculta:
        raise HTTPException(404, 'Esta publicação não está mais disponível.')
    return x


@rota.post('/{pid}/comentarios', dependencies=[Depends(limitar('comentar', 600))])
def comentar(pid: str, n: NovoTexto, eu: Pessoa = Depends(_credenciada), db: Session = Depends(sessao)):
    """Comentário numa publicação visível (só para quem está credenciado)."""
    contar('comentar', str(eu.id), 30, janela=300, msg='Muitos comentários seguidos. Espere um pouco.')
    _post_visivel(db, pid)
    x = Publicacao(id=_novo_id(), tipo='comentario', pessoa_id=eu.id, pai_id=pid, texto=n.texto.strip(),
                   mencoes=_mencoes(n.mencoes, eu, db), criada_em=_agora_exato())
    db.add(x)
    db.commit()
    _avisar()
    return {'id': x.id}


@rota.post('/mensagens', dependencies=[Depends(limitar('comentar', 600))])
def mensagem(n: NovoTexto, eu: Pessoa = Depends(_credenciada), db: Session = Depends(sessao)):
    """Mensagem no chat geral."""
    contar('comentar', str(eu.id), 30, janela=300, msg='Muitas mensagens seguidas. Espere um pouco.')
    x = Publicacao(id=_novo_id(), tipo='mensagem', pessoa_id=eu.id, texto=n.texto.strip(),
                   mencoes=_mencoes(n.mencoes, eu, db), criada_em=_agora_exato())
    db.add(x)
    db.commit()
    _avisar()
    return {'id': x.id}


def _alternar(modelo, pid: str, eu: Pessoa, db: Session) -> bool:
    _post_visivel(db, pid)
    ja = db.get(modelo, (eu.id, pid))
    if ja:
        db.delete(ja)
    else:
        db.add(modelo(pessoa_id=eu.id, publicacao_id=pid))
    db.commit()
    return not ja


@rota.post('/{pid}/curtir')
def curtir(pid: str, eu: Pessoa = Depends(_credenciada), db: Session = Depends(sessao)):
    """Curte a publicação, ou desfaz a curtida se já tinha curtido."""
    contar('curtir', str(eu.id), 120, msg='Calma: muitas curtidas seguidas.')
    r = _alternar(Curtida, pid, eu, db)
    _avisar()
    return {'curtiu': r}


@rota.post('/{pid}/salvar')
def salvar(pid: str, eu: Pessoa = Depends(pessoa_atual), db: Session = Depends(sessao)):
    """Guarda ou tira dos salvos (só a própria pessoa vê)."""
    contar('salvar', str(eu.id), 120, msg='Muitas ações seguidas. Espere um pouco.')
    return {'salvou': _alternar(Salvo, pid, eu, db)}


def _apagar(db: Session, x: Publicacao) -> None:
    """Apaga de vez, com comentários, curtidas, salvos e fotos. Denúncias ficam, com a cópia do texto."""
    filhos = db.scalars(select(Publicacao.id).where(Publicacao.pai_id == x.id)).all()
    todos = [x.id, *filhos]
    db.execute(delete(Curtida).where(Curtida.publicacao_id.in_(todos)))
    db.execute(delete(Salvo).where(Salvo.publicacao_id.in_(todos)))
    for d in db.scalars(select(Denuncia).where(Denuncia.publicacao_id.in_(todos))):
        d.publicacao_id = None
    db.execute(delete(Publicacao).where(Publicacao.pai_id == x.id))
    for f in x.fotos or []:
        try:
            arquivos.caminho(f['id']).unlink(missing_ok=True)
        except ValueError:
            pass
    db.delete(x)


def _ocultar(db: Session, x: Publicacao, por: str, nota: str, acao: str = 'hide') -> None:
    x.oculta = True
    alvo = _alvo(x)
    for d in db.scalars(select(Denuncia).where(Denuncia.alvo == alvo, Denuncia.situacao == 'pendente')):
        if acao == 'hide':
            d.situacao, d.revisada_por, d.revisada_em, d.nota = 'ocultada', por, agora(), nota
    db.add(Moderacao(alvo=alvo, acao=acao, por=por, nota=nota, texto=(x.texto or 'Publicação com fotos')[:300], em=agora()))


@rota.delete('/{pid}')
def apagar(pid: str, eu: Pessoa = Depends(pessoa_atual), db: Session = Depends(sessao)):
    """O autor apaga de vez o que é seu. A organização, num conteúdo de outra pessoa, tira do ar (fica no histórico)."""
    x = db.get(Publicacao, pid)
    if not x or (x.oculta and eu.papel != 'organizacao'):
        raise HTTPException(404, 'Esta publicação não está mais disponível.')
    if x.pessoa_id == eu.id:
        _apagar(db, x)
        resultado = 'apagada'
    elif eu.papel == 'organizacao':
        _ocultar(db, x, eu.nome, 'Excluída diretamente nas publicações.')
        resultado = 'oculta'
    else:
        raise HTTPException(403, 'Você só pode excluir o que é seu.')
    db.commit()
    _avisar()
    return {'ok': True, 'resultado': resultado}


class NovaDenuncia(BaseModel):
    motivo: str = Field(description='Um dos motivos da lista: ' + '; '.join(MOTIVOS))
    detalhe: str = Field(default='', max_length=500)


@rota.post('/{pid}/denunciar')
def denunciar(pid: str, n: NovaDenuncia, eu: Pessoa = Depends(_credenciada), db: Session = Depends(sessao)):
    """Denuncia uma publicação, comentário ou mensagem. Denúncias de pessoas diferentes acima do limite tiram o
    conteúdo do ar até a organização revisar."""
    contar('denunciar', str(eu.id), 10, janela=600, msg='Muitas denúncias seguidas. A organização já foi avisada.')
    if n.motivo not in MOTIVOS:
        raise HTTPException(400, 'Escolha o motivo da denúncia.')
    x = db.get(Publicacao, pid)
    if not x or x.oculta:
        raise HTTPException(404, 'Este conteúdo não está mais disponível.')
    alvo = _alvo(x)
    if db.scalar(select(Denuncia.id).where(Denuncia.alvo == alvo, Denuncia.pessoa_id == eu.id, Denuncia.situacao == 'pendente')):
        raise HTTPException(409, 'Você já denunciou este conteúdo.')
    autor = db.get(Pessoa, x.pessoa_id)
    db.add(Denuncia(publicacao_id=x.id, alvo=alvo, pessoa_id=eu.id, motivo=n.motivo, detalhe=n.detalhe.strip(),
                    copia={'name': autor.nome if autor else '', 'text': x.texto,
                           'type': {'post': 'Publicação', 'comentario': 'Comentário', 'mensagem': 'Mensagem'}[x.tipo]},
                    criada_em=agora()))
    db.flush()
    pessoas = db.scalars(select(Denuncia.pessoa_id).where(Denuncia.alvo == alvo, Denuncia.situacao == 'pendente').distinct()).all()
    oculta = len(pessoas) >= config().denuncias_para_ocultar
    if oculta:  # sai do ar até a organização revisar; as denúncias continuam pendentes
        _ocultar(db, x, 'Automático', f'{len(pessoas)} denúncias de pessoas diferentes.', acao='auto')
    db.commit()
    _avisar('denuncia')
    return {'ok': True, 'oculta': oculta}


@rota.get('/fotos/{fid}')
def foto(fid: str, eu: Pessoa = Depends(pessoa_atual)):
    """Foto de uma publicação (só para quem entrou no app)."""
    try:
        cam = arquivos.caminho(fid)
    except ValueError:
        raise HTTPException(404)
    if not cam.exists():
        raise HTTPException(404)
    return FileResponse(cam, media_type='image/jpeg', headers={'Cache-Control': 'private, max-age=86400'})


class Revisao(BaseModel):
    alvo: str = Field(max_length=80, description='Conteúdo revisado: post:<id>, comment:<publicação>:<id> ou message:<id>.')
    acao: Literal['hide', 'restore', 'dismiss'] = Field(description='hide: tirar do ar; restore: voltar; dismiss: arquivar as denúncias.')
    nota: str = Field(default='', max_length=240)


@rota.post('/moderar', dependencies=[Depends(organizacao)])
def moderar(r: Revisao, eu: Pessoa = Depends(pessoa_atual), db: Session = Depends(sessao)):
    """Só a organização. Toda ação fica no histórico, com quem fez, quando e a nota. Denúncias de um conteúdo que o
    autor já apagou podem ser arquivadas (só sobrou a cópia na denúncia)."""
    x = db.get(Publicacao, r.alvo.rsplit(':', 1)[-1])
    if x and _alvo(x) != r.alvo:
        x = None
    if not x and r.acao != 'dismiss':
        raise HTTPException(404, 'O conteúdo foi excluído pelo autor.')
    nota = r.nota.strip()
    if r.acao == 'hide':
        _ocultar(db, x, eu.nome, nota)
    else:
        if r.acao == 'restore':
            x.oculta = False
        for d in db.scalars(select(Denuncia).where(Denuncia.alvo == r.alvo, Denuncia.situacao == 'pendente')):
            d.situacao, d.revisada_por, d.revisada_em, d.nota = 'arquivada', eu.nome, agora(), nota
        texto = (x.texto or 'Publicação com fotos') if x else 'Conteúdo excluído pelo autor'
        db.add(Moderacao(alvo=r.alvo, acao=r.acao, por=eu.nome, nota=nota, texto=texto[:300], em=agora()))
    db.commit()
    _avisar()
    return {'ok': True}
