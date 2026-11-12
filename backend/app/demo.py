"""Popula somente um banco local de demonstração; execução por scripts/rodar-demo.sh."""
import json
from datetime import datetime
from pathlib import Path
from sqlalchemy import select, delete
from .config import config
from .db import criar_tabelas, SessionLocal
from .importar import programacao
from .modelos import Pessoa, Agenda, Presenca, Aviso, CenarioDemo
BASE=Path(__file__).resolve().parents[1]
ADMIN='20251094040030'
# Inscrições da conta de teste, como viriam do SUAP: Game Maker é a inscrição real no VII ETAL; o resto completa a agenda.
ADMIN_AGENDA=['game-maker','impacto-ia','saude-mental','imagens-ia']

def popular():
    if not config().banco.startswith('sqlite:') or not config().banco.endswith('/demo-etal.db'):
        raise RuntimeError('A preparação da demo exige um SQLite separado chamado demo-etal.db.')
    criar_tabelas()
    n=programacao(str(BASE/'seed/programacao.json'))
    data=json.loads((BASE/'seed/cenario-demo.json').read_text())
    with SessionLocal() as db:
        scenario=db.get(CenarioDemo,'vii-etal') or CenarioDemo(id='vii-etal')
        scenario.dados=data;db.add(scenario)
        for i,row in enumerate(data['people']):
            person=db.scalar(select(Pessoa).where(Pessoa.matricula==row['id'])) or Pessoa(tipo='dev',matricula=row['id'])
            person.nome=row['name'];person.curso='Informática' if i%2 else 'Análise e Desenvolvimento de Sistemas';person.campus='Pau dos Ferros';person.papel='participante';person.credenciado_em=datetime(2025,11,26,13,10+i);db.add(person);db.flush()
            activities=[['react-native','fastapi','experiencia-ia','react-next','opencv','game-maker'][i%6],'saude-mental','impacto-ia','mesa-egressos']
            for activity in activities:
                if not db.scalar(select(Agenda).where(Agenda.pessoa_id==person.id,Agenda.atividade_id==activity)):db.add(Agenda(pessoa_id=person.id,atividade_id=activity))
            if not db.scalar(select(Presenca).where(Presenca.pessoa_id==person.id,Presenca.atividade_id=='saude-mental')):db.add(Presenca(pessoa_id=person.id,atividade_id='saude-mental',em=datetime(2025,11,28,7,30),via='demo'))
        admin=db.scalar(select(Pessoa).where(Pessoa.matricula==ADMIN)) or Pessoa(tipo='suap',matricula=ADMIN,nome='Organização')
        admin.papel='organizacao';db.add(admin);db.flush()
        for activity in ADMIN_AGENDA:
            if not db.scalar(select(Agenda).where(Agenda.pessoa_id==admin.id,Agenda.atividade_id==activity)):db.add(Agenda(pessoa_id=admin.id,atividade_id=activity))
        title='Bem-vindos ao VII ETAL'
        db.execute(delete(Aviso).where(Aviso.titulo=='Bem-vindos ao VII ETAL · demonstração'))
        if not db.scalar(select(Aviso).where(Aviso.titulo==title)):db.add(Aviso(titulo=title,texto='Confira a programação, encontre sua sala e participe das atividades. Bom evento!',em=datetime(2025,11,26,13)))
        db.commit()
    return {'activities':n,'people':len(data['people'])+1,'tournaments':len(data['tournaments']),'posts':len(data['posts'])}

def reiniciar_admin():
    if not config().banco.endswith('/demo-etal.db'):
        raise RuntimeError('Reinício exclusivo do banco da demo.')
    with SessionLocal() as db:
        admin=db.scalar(select(Pessoa).where(Pessoa.matricula==ADMIN))
        if admin:
            db.execute(delete(Presenca).where(Presenca.pessoa_id==admin.id))
            admin.credenciado_em=None
            db.commit()

if __name__=='__main__':
    import argparse
    parser=argparse.ArgumentParser()
    parser.add_argument('--reiniciar-admin',action='store_true')
    args=parser.parse_args()
    result=popular()
    if args.reiniciar_admin:reiniciar_admin()
    print(json.dumps(result,ensure_ascii=False))
