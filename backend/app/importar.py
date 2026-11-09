"""Importa a programação (JSON no formato do app) e inscritos exportados do SUAP (CSV).

  python -m app.importar programacao seed/programacao.json
  python -m app.importar inscritos inscritos.csv        # colunas: nome; matricula; email (separador ; ou ,)
"""
import csv
import json
import sys
from datetime import date
from pathlib import Path

from sqlalchemy import select

from .db import SessionLocal, criar_tabelas
from .modelos import Atividade, Pessoa

CAMPOS = {'id', 'type', 'title', 'short', 'description', 'speaker', 'role', 'date', 'day', 'time', 'end', 'floor', 'zone', 'room', 'seats', 'taken', 'demo'}


def programacao(arquivo: str) -> int:
    dados = json.loads(Path(arquivo).read_text())
    n = 0
    with SessionLocal() as db:
        for s in dados['sessions']:
            a = db.get(Atividade, s['id']) or Atividade(id=s['id'])
            a.tipo, a.titulo, a.curto = s['type'], s['title'], s.get('short') or s['title'][:120]
            a.descricao, a.palestrante, a.papel_palestrante = s.get('description'), s.get('speaker'), s.get('role')
            a.data, a.inicio, a.fim = date.fromisoformat(s['date']), s['time'], s['end']
            a.andar, a.zona, a.sala, a.vagas = s.get('floor'), s.get('zone'), s.get('room'), s.get('seats')
            a.extra = {k: v for k, v in s.items() if k not in CAMPOS}
            db.add(a)
            n += 1
        db.commit()
    return n


def inscritos(arquivo: str) -> int:
    texto = Path(arquivo).read_text(encoding='utf-8-sig')
    leitor = csv.DictReader(texto.splitlines(), delimiter=';' if texto.count(';') > texto.count(',') else ',')
    n = 0
    with SessionLocal() as db:
        for linha in leitor:
            l = {k.strip().lower(): (v or '').strip() for k, v in linha.items() if k}
            matricula, email, nome = l.get('matricula') or None, (l.get('email') or '').lower() or None, l.get('nome') or ''
            if not (matricula or email) or not nome:
                continue
            p = (matricula and db.scalar(select(Pessoa).where(Pessoa.matricula == matricula))) or \
                (email and db.scalar(select(Pessoa).where(Pessoa.email == email)))
            if not p:
                db.add(Pessoa(tipo='suap' if matricula else 'visitante', matricula=matricula, email=email, nome=nome))
                n += 1
        db.commit()
    return n


if __name__ == '__main__':
    criar_tabelas()
    acao, arg = sys.argv[1], sys.argv[2]
    if acao == 'programacao':
        print(f'{programacao(arg)} atividades importadas')
    elif acao == 'inscritos':
        print(f'{inscritos(arg)} pessoas novas')
    else:
        raise SystemExit('ação desconhecida: programacao | inscritos')
