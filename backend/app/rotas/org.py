"""Painel da organização: avisos, troca de sala, numeração, credenciamento manual, participantes por categoria,
dados dos perfis, avaliações, exportações (CSV e link para planilha) e QRs para imprimir."""
import csv
import hashlib
import hmac
import io
from collections import Counter, defaultdict
import re
import secrets
import unicodedata
from urllib.parse import unquote
from datetime import date
from typing import Literal

import segno
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import HTMLResponse, Response
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .. import arquivos, formatos
from ..ao_vivo import canal
from ..config import config
from ..db import sessao
from ..modelos import Agenda, Arquivo, Atividade, Avaliacao, Aviso, Configuracao, NumeroSala, Pessoa, Presenca, Publicacao
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


HORA = r'^([01]\d|2[0-3]):[0-5]\d$'


class Material(BaseModel):
    nome: str = Field(min_length=1, max_length=120, examples=['Slides da aula'])
    tipo: Literal['pdf', 'link', 'zip', 'imagem', 'slides', 'texto'] = 'pdf'
    url: str | None = Field(default=None, max_length=500, examples=['https://exemplo.org/slides.pdf'])
    detalhe: str | None = Field(default=None, max_length=80, examples=['PDF · 2 MB'])
    arquivo: str | None = Field(default=None, max_length=32, description='Id de um arquivo já enviado (mantém o anexo ao editar a lista).')
    mime: str | None = Field(default=None, max_length=100)


class AtividadeEdicao(BaseModel):
    """Campos que a organização pode mudar; os ausentes ficam como estão."""
    titulo: str | None = Field(default=None, min_length=2, max_length=300)
    curto: str | None = Field(default=None, max_length=120)
    tipo: str | None = Field(default=None, min_length=2, max_length=40, examples=['Minicurso'])
    data: date | None = Field(default=None, examples=['2025-11-26'])
    inicio: str | None = Field(default=None, pattern=HORA, examples=['14:00'])
    fim: str | None = Field(default=None, pattern=HORA, examples=['18:00'])
    sala: str | None = Field(default=None, max_length=120)
    andar: int | None = None
    zona: str | None = Field(default=None, max_length=64)
    palestrante: str | None = Field(default=None, max_length=200)
    papel: str | None = Field(default=None, max_length=200)
    descricao: str | None = Field(default=None, max_length=4000)
    requisitos: str | None = Field(default=None, max_length=1000)
    vagas: int | None = Field(default=None, ge=1, le=5000)
    materiais: list[Material] | None = Field(default=None, max_length=30)


class NovaAtividade(AtividadeEdicao):
    titulo: str = Field(min_length=2, max_length=300, examples=['Introdução ao Git'])
    tipo: str = Field(default='Palestra', min_length=2, max_length=40)
    data: date = Field(examples=['2025-11-26'])
    inicio: str = Field(pattern=HORA, examples=['14:00'])
    fim: str = Field(pattern=HORA, examples=['15:00'])


def _iniciais(nome: str) -> str:
    partes = nome.split()
    return ''.join(x[0] for x in partes[:1] + partes[-1:]).upper() if partes else ''


def _aplicar(a: Atividade, dados: dict):
    """Copia os campos enviados para a atividade; materiais, requisitos e quem conduz vão também para o formato do app."""
    colunas = {'titulo': 'titulo', 'curto': 'curto', 'tipo': 'tipo', 'data': 'data', 'inicio': 'inicio', 'fim': 'fim', 'sala': 'sala',
               'andar': 'andar', 'zona': 'zona', 'palestrante': 'palestrante', 'papel': 'papel_palestrante', 'descricao': 'descricao', 'vagas': 'vagas'}
    for campo, coluna in colunas.items():
        if campo in dados:
            setattr(a, coluna, dados[campo].strip() if isinstance(dados[campo], str) else dados[campo])
    if not a.curto:
        a.curto = a.titulo[:120]
    extra = dict(a.extra or {})
    if 'requisitos' in dados:
        extra['requirements'] = (dados['requisitos'] or '').strip()
    if 'materiais' in dados and dados['materiais'] is not None:
        extra['materials'] = [{'kind': m['tipo'], 'name': m['nome'].strip(), 'url': (f"/api/arquivos/{m['arquivo']}" if m.get('arquivo') else m.get('url') or None),
                               **({'file': m['arquivo'], 'mime': m.get('mime')} if m.get('arquivo') else {}),
                               'meta': m.get('detalhe') or {'pdf': 'PDF', 'link': 'Link', 'zip': 'Arquivo ZIP', 'imagem': 'Imagem', 'slides': 'Slides', 'texto': 'Texto'}[m['tipo']]} for m in dados['materiais']]
    if 'palestrante' in dados:
        partes = (dados['palestrante'] or '').split()
        if partes:
            extra['speakerShort'] = f'{partes[0]} {partes[-1]}' if len(partes) > 1 else partes[0]
            extra['initials'] = _iniciais(' '.join(partes))
        else:
            extra.pop('speakerShort', None); extra.pop('initials', None)
    extra.setdefault('learn', []); extra.setdefault('materials', [])
    a.extra = extra
    if a.inicio >= a.fim:
        raise HTTPException(422, 'O fim precisa ser depois do início.')


@rota.post('/atividades', status_code=201)
def nova_atividade(n: NovaAtividade, db: Session = Depends(sessao)):
    base = re.sub(r'[^a-z0-9]+', '-', unicodedata.normalize('NFKD', n.titulo).encode('ascii', 'ignore').decode().lower()).strip('-')[:48] or 'atividade'
    ident, k = base, 2
    while db.get(Atividade, ident):
        ident, k = f'{base}-{k}', k + 1
    a = Atividade(id=ident, tipo=n.tipo, titulo=n.titulo, curto='', data=n.data, inicio=n.inicio, fim=n.fim, extra={})
    _aplicar(a, n.model_dump(exclude_unset=True) | {'titulo': n.titulo, 'tipo': n.tipo, 'data': n.data, 'inicio': n.inicio, 'fim': n.fim})
    db.add(a)
    db.commit()
    canal.publicar('atividade', formatos.atividade(a))
    return formatos.atividade(a)


@rota.patch('/atividades/{atividade_id}')
def editar_atividade(atividade_id: str, e: AtividadeEdicao, db: Session = Depends(sessao)):
    a = db.get(Atividade, atividade_id)
    if not a:
        raise HTTPException(404, 'Atividade não encontrada.')
    dados = e.model_dump(exclude_unset=True)
    for campo in ('titulo', 'tipo', 'data', 'inicio', 'fim'):
        if campo in dados and dados[campo] is None:
            raise HTTPException(422, f'O campo {campo} não pode ficar vazio.')
    _aplicar(a, dados)
    db.commit()
    inscritos = db.scalar(select(func.count()).select_from(Agenda).where(Agenda.atividade_id == a.id)) or 0
    canal.publicar('atividade', formatos.atividade(a, inscritos))
    return formatos.atividade(a, inscritos)


LIMITE_ARQUIVO = 15 * 1024 * 1024
TIPOS_ARQUIVO = {'application/pdf': 'pdf', 'application/zip': 'zip', 'application/x-zip-compressed': 'zip', 'image/png': 'imagem', 'image/jpeg': 'imagem', 'image/webp': 'imagem',
                 'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'slides', 'application/vnd.ms-powerpoint': 'slides', 'text/plain': 'texto'}


def _tamanho(n: int) -> str:
    return f'{n / 1024 / 1024:.1f} MB'.replace('.', ',') if n >= 1024 * 1024 else f'{max(1, round(n / 1024))} KB'


@rota.post('/atividades/{atividade_id}/arquivos', status_code=201)
async def enviar_arquivo(atividade_id: str, request: Request, nome: str = '', db: Session = Depends(sessao)):
    """Recebe o arquivo no corpo da requisição (Content-Type = tipo do arquivo) e o acrescenta aos materiais da atividade."""
    a = db.get(Atividade, atividade_id)
    if not a:
        raise HTTPException(404, 'Atividade não encontrada.')
    tipo = (request.headers.get('content-type') or '').split(';')[0].strip().lower()
    if tipo not in TIPOS_ARQUIVO:
        raise HTTPException(415, 'Envie PDF, imagem, ZIP, slides (PPT/PPTX) ou texto.')
    dados = await request.body()
    if not dados:
        raise HTTPException(422, 'O arquivo veio vazio.')
    if len(dados) > LIMITE_ARQUIVO:
        raise HTTPException(413, 'O arquivo passa de 15 MB.')
    nome = (unquote(nome) or 'Material').strip()[:200]
    arq = Arquivo(id=secrets.token_hex(16), atividade_id=a.id, nome=nome, tipo=tipo, tamanho=len(dados), dados=None)
    await run_in_threadpool(arquivos.gravar, arq.id, dados)
    db.add(arq)
    extra = dict(a.extra or {})
    rotulo = {'pdf': 'PDF', 'zip': 'ZIP', 'imagem': 'Imagem', 'slides': 'Slides', 'texto': 'Texto'}[TIPOS_ARQUIVO[tipo]]
    extra['materials'] = [*(extra.get('materials') or []), {'kind': TIPOS_ARQUIVO[tipo], 'name': nome, 'url': f'/api/arquivos/{arq.id}', 'file': arq.id, 'mime': tipo, 'meta': f'{rotulo} · {_tamanho(len(dados))}'}]
    a.extra = extra
    db.commit()
    canal.publicar('atividade', formatos.atividade(a))
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


def _participantes(db: Session, q: str = '') -> list[dict]:
    """Pessoas com tudo o que o painel filtra: agenda, presenças, saídas, avaliações e o resumo do perfil."""
    s = select(Pessoa).order_by(Pessoa.nome).limit(5000)
    if q:
        s = s.where(Pessoa.nome.ilike(f'%{q}%') | Pessoa.matricula.ilike(f'%{q}%') | Pessoa.email.ilike(f'%{q}%'))
    pessoas = list(db.scalars(s))
    agenda, pres, saida, notas = defaultdict(list), defaultdict(list), defaultdict(list), defaultdict(list)
    for pid, aid in db.execute(select(Agenda.pessoa_id, Agenda.atividade_id)):
        agenda[pid].append(aid)
    for pid, aid, sai in db.execute(select(Presenca.pessoa_id, Presenca.atividade_id, Presenca.saida_em)):
        pres[pid].append(aid)
        if sai:
            saida[pid].append(aid)
    for pid, aid in db.execute(select(Avaliacao.pessoa_id, Avaliacao.atividade_id)):
        notas[pid].append(aid)
    out = []
    for p in pessoas:
        c = p.cartao or {}
        out.append({**formatos.pessoa(p), 'email': p.email, 'saved': agenda[p.id], 'present': pres[p.id], 'left': saida[p.id],
                    'rated': notas[p.id], 'profile': bool(c), 'nadic': c.get('nadic') or '', 'langs': c.get('langs') or [],
                    'areas': c.get('areas') or [], 'open': c.get('open') or []})
    return out


@rota.get('/participantes')
def participantes(q: str = '', db: Session = Depends(sessao)):
    return _participantes(db, q)


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


@rota.get('/qrs/lista')
def qrs_lista(db: Session = Depends(sessao)):
    """QRs assinados para a equipe mostrar no celular quando o QR impresso rasga ou não lê."""
    itens = [{'id': None, 'title': 'Credenciamento', 'where': 'Recepção', 'day': None, 'time': None, 'token': token_qr(None)}]
    for a in db.scalars(select(Atividade).order_by(Atividade.data, Atividade.inicio)):
        if a.id == 'credenciamento':
            continue
        itens.append({'id': a.id, 'title': a.titulo, 'where': a.sala or '', 'day': a.data.day, 'time': a.inicio, 'token': token_qr(a.id)})
    return itens


@rota.get('/debug/qrs')
def debug_qrs(request: Request, db: Session = Depends(sessao)):
    """Catálogo de leitura do debug, exclusivo da organização no cenário local."""
    if not config().demo:
        raise HTTPException(404)
    base = publica(request)
    rows = [{'id': None, 'title': 'Credenciamento', 'url': f'{base}/q/{token_qr(None)}'}]
    for activity in db.scalars(select(Atividade).order_by(Atividade.data, Atividade.inicio)):
        if activity.id != 'credenciamento':
            rows.append({'id': activity.id, 'title': activity.titulo, 'url': f'{base}/q/{token_qr(activity.id)}'})
    return rows


@rota.get('/sistema')
def sistema(db: Session = Depends(sessao)):
    """Números do servidor nos últimos 10 minutos, para acompanhar o evento: requisições, tempos, erros, limites,
    fila do SUAP, conexões ao vivo e do banco, e o movimento (entradas, presenças, publicações)."""
    import time as _t
    from datetime import timedelta
    from .. import suap_fila
    from ..db import engine
    from ..modelos import Publicacao
    from ..monitor import numeros
    t0 = _t.perf_counter()
    db.execute(select(1))
    banco_ms = round((_t.perf_counter() - t0) * 1000, 1)
    desde = agora() - timedelta(minutes=10)
    c = config()
    pool = engine.pool
    return {
        **numeros(),
        'suap': {'simultaneos': c.suap_simultaneos, 'em_uso': suap_fila.em_uso(), 'esperando': suap_fila.esperando},
        'ao_vivo': {'conectados': len(canal.ouvintes)},
        'banco': {'ms': banco_ms, 'conexoes_em_uso': pool.checkedout() if hasattr(pool, 'checkedout') else None,
                  'conexoes_max': c.banco_conexoes + c.banco_extras if not c.banco.startswith('sqlite') else None},
        'movimento': {
            'pessoas': db.scalar(select(func.count()).select_from(Pessoa)),
            'credenciadas': db.scalar(select(func.count()).select_from(Pessoa).where(Pessoa.credenciado_em.isnot(None))),
            'presencas_10_min': db.scalar(select(func.count()).select_from(Presenca).where(Presenca.em >= desde)),
            'publicacoes_10_min': db.scalar(select(func.count()).select_from(Publicacao).where(Publicacao.criada_em >= desde)),
        },
    }



def _contagem(itens) -> list[list]:
    return [[k, n] for k, n in Counter(itens).most_common()]


@rota.get('/dados')
def dados(db: Session = Depends(sessao)):
    """Números dos perfis e da participação: NADIC, linguagens, interesses, cursos, cidades e publicações."""
    pessoas = list(db.scalars(select(Pessoa)))
    cards = [p.cartao for p in pessoas if p.cartao]
    pres = Counter(db.scalars(select(Presenca.atividade_id)))
    saidas = Counter(db.scalars(select(Presenca.atividade_id).where(Presenca.saida_em.is_not(None))))
    tipos_pub = Counter(db.scalars(select(Publicacao.tipo).where(Publicacao.oculta.is_(False))))
    assuntos = Counter(x for x in db.scalars(select(Publicacao.assunto).where(Publicacao.tipo == 'post', Publicacao.oculta.is_(False))) if x)
    return {
        'pessoas': len(pessoas),
        'ifrn': sum(p.tipo != 'visitante' for p in pessoas),
        'visitantes': sum(p.tipo == 'visitante' for p in pessoas),
        'credenciados': sum(p.credenciado_em is not None for p in pessoas),
        'perfis': len(cards),
        'perfisPublicos': sum(c.get('publish', True) is not False for c in cards),
        'nadic': _contagem(c.get('nadic') for c in cards if c.get('nadic')),
        'langs': _contagem(x for c in cards for x in c.get('langs') or []),
        'areas': _contagem(x for c in cards for x in c.get('areas') or []),
        'open': _contagem(x for c in cards for x in c.get('open') or []),
        'cursos': _contagem(p.curso for p in pessoas if p.curso)[:12],
        'cidades': _contagem(p.cidade for p in pessoas if p.cidade)[:12],
        'presencas': [[a, n, saidas.get(a, 0)] for a, n in pres.most_common()],
        'publicacoes': {'posts': tipos_pub.get('post', 0), 'comentarios': tipos_pub.get('comentario', 0),
                        'mensagens': tipos_pub.get('mensagem', 0), 'assuntos': [[k, n] for k, n in assuntos.most_common()]},
    }


@rota.get('/avaliacoes')
def avaliacoes(db: Session = Depends(sessao)):
    """Avaliações por atividade: média, quantidade, distribuição das notas, comentários rápidos mais escolhidos e
    comentários abertos, sem o nome de quem avaliou. Ordenado da maior para a menor média."""
    por = defaultdict(list)
    for v in db.scalars(select(Avaliacao).order_by(Avaliacao.em.desc())):
        por[v.atividade_id].append(v)
    pres = Counter(db.scalars(select(Presenca.atividade_id)))
    saidas = Counter(db.scalars(select(Presenca.atividade_id).where(Presenca.saida_em.is_not(None))))
    out = []
    for aid, vs in por.items():
        notas = [v.nota for v in vs]
        out.append({'activity': aid, 'count': len(vs), 'avg': round(sum(notas) / len(notas), 2),
                    'dist': [notas.count(n) for n in range(1, 6)], 'present': pres.get(aid, 0), 'left': saidas.get(aid, 0),
                    'quick': _contagem(r for v in vs for r in v.rapidos or []),
                    'comments': [{'n': v.nota, 'text': v.comentario, 'at': v.em.isoformat()} for v in vs if v.comentario][:100]})
    return sorted(out, key=lambda x: (-x['avg'], -x['count']))


# Link para planilha: um endereço com chave, que o Google Sheets lê com =IMPORTDATA("...") e atualiza sozinho.
# A chave sai do segredo do servidor e de uma versão guardada no banco; gerar um link novo invalida o anterior.
def _versao_planilha(db: Session) -> str:
    v = db.get(Configuracao, 'planilha')
    if not v:
        v = Configuracao(chave='planilha', valor=secrets.token_hex(8))
        db.add(v)
        db.commit()
    return v.valor


def _chave_planilha(versao: str) -> str:
    return hmac.new(config().segredo.encode(), f'planilha:{versao}'.encode(), hashlib.sha256).hexdigest()[:32]


@rota.get('/planilha')
def link_planilha(request: Request, db: Session = Depends(sessao)):
    """Endereço da planilha de participantes para colar no Google Sheets (=IMPORTDATA) ou no Excel (Dados > Da Web)."""
    return {'url': f"{publica(request).rstrip('/')}/api/planilha/{_chave_planilha(_versao_planilha(db))}.csv"}


@rota.post('/planilha/novo')
def novo_link_planilha(request: Request, db: Session = Depends(sessao)):
    """Gera um endereço novo para a planilha; o anterior para de funcionar na hora."""
    v = db.get(Configuracao, 'planilha') or Configuracao(chave='planilha')
    v.valor = secrets.token_hex(8)
    db.add(v)
    db.commit()
    return link_planilha(request, db)


CAB_PLANILHA = ['nome', 'tipo', 'curso', 'matricula', 'email', 'credenciado', 'nadic', 'linguagens', 'interesses',
                'inscricoes', 'presencas', 'avaliou']


def _linhas_planilha(db: Session, atividade: str = '', situacao: str = '') -> list[list]:
    titulos = {a.id: a.curto for a in db.scalars(select(Atividade))}
    linhas = []
    for p in _participantes(db):
        if atividade:
            grupo = {'presentes': p['present'], 'avaliaram': p['rated']}.get(situacao, p['saved'] + p['present'])
            if atividade not in grupo:
                continue
        linhas.append([p['name'], 'Visitante' if p['source'] == 'visitante' else 'IFRN', p['course'] or '', p['matricula'] or '',
                       p['email'] or '', 'sim' if p['credentialedAt'] else 'não', p['nadic'], ', '.join(p['langs']), ', '.join(p['areas']),
                       ', '.join(titulos.get(a, a) for a in p['saved']), ', '.join(titulos.get(a, a) for a in p['present']),
                       ', '.join(titulos.get(a, a) for a in p['rated'])])
    return linhas


planilha = APIRouter(prefix='/api/planilha', tags=['organização'])


@planilha.get('/{chave}.csv')
def planilha_csv(chave: str, atividade: str = '', situacao: str = '', db: Session = Depends(sessao)):
    """CSV separado por vírgula, sem login: quem tem o endereço lê. Filtros opcionais: ?atividade=<id>&situacao=presentes."""
    if not hmac.compare_digest(chave, _chave_planilha(_versao_planilha(db))):
        raise HTTPException(404, 'Planilha não encontrada.')
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(CAB_PLANILHA)
    w.writerows(_linhas_planilha(db, atividade, situacao))
    return Response(buf.getvalue(), media_type='text/csv; charset=utf-8', headers={'Cache-Control': 'no-store'})
