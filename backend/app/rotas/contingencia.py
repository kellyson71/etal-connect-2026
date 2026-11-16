"""Plano B da organização (docs/contingencia.md): listas de presença em papel para imprimir e o lançamento delas depois.

Se o app, a internet ou o servidor caírem durante uma atividade, a equipe passa a lista impressa na sala. Depois, digita
(ou cola) as matrículas e e-mails no painel, e as presenças entram com via = 'manual', iguais às do QR para os
certificados."""
import html
import re
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from ..db import sessao
from ..modelos import Agenda, Atividade, Pessoa, Presenca
from ..seguranca import agora, organizacao

rota = APIRouter(prefix='/api/org', tags=['organização'], dependencies=[Depends(organizacao)])

LINHAS_EM_BRANCO = 15
LINHAS_CREDENCIAMENTO = 60

_ESTILO = ('<style>body{font:13px system-ui,sans-serif;margin:0;color:#111}section{page-break-after:always;padding:12mm}'
           'h1{font-size:20px;margin:0}p{margin:2px 0 10px;color:#333}table{width:100%;border-collapse:collapse}'
           'th,td{border:1px solid #999;padding:6px 8px;text-align:left;height:20px}th{background:#eee}'
           'td.n{width:28px;color:#666;text-align:right}th:nth-child(2){width:38%}th:nth-child(3){width:24%}td.a{width:32%}small{display:block;margin-top:10px;color:#555}'
           '@media screen{body{background:#f3f3f3}section{background:#fff;max-width:200mm;margin:12px auto}}</style>')


def _folha(titulo: str, onde: str, nomes: list[tuple[str, str]], brancos: int) -> str:
    linhas = ''.join(f'<tr><td class="n">{i}</td><td>{html.escape(n)}</td><td>{html.escape(m)}</td><td class="a"></td></tr>'
                     for i, (n, m) in enumerate(nomes, 1))
    linhas += ''.join(f'<tr><td class="n">{i}</td><td></td><td></td><td class="a"></td></tr>'
                      for i in range(len(nomes) + 1, len(nomes) + brancos + 1))
    return (f'<section><h1>{html.escape(titulo)}</h1><p>{html.escape(onde)} · lista de presença em papel (plano B)</p>'
            '<table><thead><tr><th>#</th><th>Nome</th><th>Matrícula ou e-mail</th><th>Assinatura</th></tr></thead>'
            f'<tbody>{linhas}</tbody></table><small>Quem já está na lista salvou a atividade na agenda: só assina. Quem não '
            'está escreve nome e matrícula (ou e-mail, se for convidado) numa linha em branco. Depois de lançar no painel '
            '(Contingência → Lançar lista em papel), entregar a folha à organização para ser destruída.</small></section>')


@rota.get('/listas-papel', response_class=HTMLResponse)
def listas_papel(dia: int | None = None, atividade: str | None = None, db: Session = Depends(sessao)):
    """Página para imprimir as listas de presença em papel: uma folha por atividade (do dia escolhido, ou uma só),
    já com quem salvou a atividade na agenda e linhas em branco; e as folhas do credenciamento."""
    q = select(Atividade).where(Atividade.id != 'credenciamento').order_by(Atividade.data, Atividade.inicio)
    if atividade:
        q = q.where(Atividade.id == atividade)
    ativs = [a for a in db.scalars(q) if dia is None or a.data.day == dia]
    if atividade and not ativs:
        raise HTTPException(404, 'Atividade não encontrada.')
    folhas = []
    if not atividade:
        folhas.append(_folha('Credenciamento no ETAL', f'Recepção{f" · dia {dia}" if dia else ""}', [], LINHAS_CREDENCIAMENTO))
    for a in ativs:
        inscritos = db.execute(select(Pessoa.nome, Pessoa.matricula, Pessoa.email).join(Agenda, Agenda.pessoa_id == Pessoa.id)
                               .where(Agenda.atividade_id == a.id).order_by(Pessoa.nome)).all()
        onde = f'{a.sala or "sem sala"} · {a.data.strftime("%d/%m")} · {a.inicio}–{a.fim}'
        brancos = max(LINHAS_EM_BRANCO, (a.vagas or 0) - len(inscritos))
        folhas.append(_folha(a.titulo, onde, [(n, m or e or '') for n, m, e in inscritos], brancos))
    return f'<!doctype html><meta charset="utf-8"><title>Listas em papel do ETAL</title>{_ESTILO}{"".join(folhas)}'


class ListaPapel(BaseModel):
    atividade: str | None = Field(default=None, description='Atividade da lista; vazio = lista do credenciamento.')
    pessoas: str = Field(max_length=60000, description='Matrículas ou e-mails, um por linha (ou separados por vírgula ou espaço).')


@rota.post('/presenca-manual')
def presenca_manual(l: ListaPapel, db: Session = Depends(sessao)):
    """Lança uma lista em papel: credencia quem ainda não estava e, se for de uma atividade, registra a presença
    (via 'manual'). Quem não tem cadastro no app volta em `nao_encontradas`, para a equipe resolver."""
    a = db.get(Atividade, l.atividade) if l.atividade else None
    if l.atividade and not a:
        raise HTTPException(404, 'Atividade não encontrada.')
    ids = list(dict.fromkeys(x.strip().lower() for x in re.split(r'[\s,;]+', l.pessoas) if x.strip()))
    if len(ids) > 2000:
        raise HTTPException(400, 'Lista grande demais: lance por partes.')
    t = agora()
    lancadas, ja_tinham, nao = [], [], []
    for x in ids:
        p = db.scalar(select(Pessoa).where(or_(func.lower(Pessoa.matricula) == x, func.lower(Pessoa.email) == x)))
        if not p:
            nao.append(x)
            continue
        novo = False
        if not p.credenciado_em:
            p.credenciado_em = t
            novo = True
        if a and not db.scalar(select(Presenca.id).where(Presenca.pessoa_id == p.id, Presenca.atividade_id == a.id)):
            db.add(Presenca(pessoa_id=p.id, atividade_id=a.id, em=t, via='manual'))
            novo = True
        (lancadas if novo else ja_tinham).append(p.nome)
    db.commit()
    return {'lancadas': lancadas, 'ja_tinham': ja_tinham, 'nao_encontradas': nao}
