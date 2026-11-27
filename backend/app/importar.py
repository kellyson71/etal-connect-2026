"""Importa a programação (JSON no formato do app) e inscritos exportados do SUAP (CSV).

  python -m app.importar programacao seed/programacao.json
  python -m app.importar inscritos inscritos.csv        # colunas: nome; matricula; email; atividades (separador ; ou ,)

Na coluna opcional `atividades` vão os IDs dos minicursos em que a pessoa se inscreveu no SUAP, separados por espaço ou
`|` (ex.: `react-native|game-maker`). Minicurso tem vaga limitada e a inscrição é no SUAP: no app ele não se salva, e é
esta lista que diz quem está inscrito (e quantas vagas já foram preenchidas).
"""
import csv
import json
import sys
from datetime import date
from pathlib import Path

from sqlalchemy import func, select

from .db import SessionLocal, migrar
from .modelos import Agenda, Atividade, Pessoa

CAMPOS = {'id', 'type', 'title', 'short', 'description', 'speaker', 'role', 'date', 'day', 'time', 'end', 'floor', 'zone', 'room', 'seats', 'taken'}


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
            anexos = [m for m in ((a.extra or {}).get('materials') or []) if m.get('file')]  # arquivos enviados pelo painel ficam
            a.extra = {k: v for k, v in s.items() if k not in CAMPOS}
            if anexos:
                a.extra = {**a.extra, 'materials': [*(a.extra.get('materials') or []), *[m for m in anexos if m not in (a.extra.get('materials') or [])]]}
            db.add(a)
            n += 1
        db.commit()
    return n



def programacao_inicial(arquivo: str) -> int:
    """Carrega a programação só num banco sem atividades (a primeira subida do servidor); depois disso, quem manda é
    o painel ou um `importar programacao` à mão, e nada do que a organização mudou é sobrescrito."""
    with SessionLocal() as db:
        if db.scalar(select(func.count()).select_from(Atividade)):
            return 0
    return programacao(arquivo)

def inscritos(arquivo: str) -> tuple[int, int]:
    """Devolve (pessoas novas, inscrições novas em minicursos)."""
    texto = Path(arquivo).read_text(encoding='utf-8-sig')
    leitor = csv.DictReader(texto.splitlines(), delimiter=';' if texto.count(';') > texto.count(',') else ',')
    n = ins = 0
    with SessionLocal() as db:
        for linha in leitor:
            l = {k.strip().lower(): (v or '').strip() for k, v in linha.items() if k}
            matricula, email, nome = l.get('matricula') or None, (l.get('email') or '').lower() or None, l.get('nome') or ''
            if not (matricula or email) or not nome:
                continue
            p = (matricula and db.scalar(select(Pessoa).where(Pessoa.matricula == matricula))) or \
                (email and db.scalar(select(Pessoa).where(Pessoa.email == email)))
            if not p:
                p = Pessoa(tipo='suap' if matricula else 'visitante', matricula=matricula, email=email, nome=nome)
                db.add(p)
                db.flush()
                n += 1
            for aid in l.get('atividades', '').replace('|', ' ').replace(',', ' ').split():
                if db.get(Atividade, aid) and not db.scalar(select(Agenda).where(Agenda.pessoa_id == p.id, Agenda.atividade_id == aid)):
                    db.add(Agenda(pessoa_id=p.id, atividade_id=aid))
                    ins += 1
        db.commit()
    return n, ins


if __name__ == '__main__':
    migrar()
    acao, arg = sys.argv[1], sys.argv[2]
    if acao == 'programacao':
        print(f'{programacao(arg)} atividades importadas')
    elif acao == 'inscritos':
        pessoas, inscricoes = inscritos(arg)
        print(f'{pessoas} pessoas novas, {inscricoes} inscrições novas em minicursos')
    else:
        raise SystemExit('ação desconhecida: programacao | inscritos')
