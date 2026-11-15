"""Leitura guardada sem internet e enviada depois: vale só se foi feita durante a atividade e chegou a tempo."""
from datetime import datetime, timedelta

import pytest
from conftest import entrar


@pytest.fixture()
def cenario(app_cliente, monkeypatch):
    from app.config import config
    from app.db import SessionLocal
    from app.modelos import Atividade
    from app.seguranca import token_qr
    monkeypatch.setattr(config(), 'janela_presenca', True)
    with SessionLocal() as db:
        a = db.query(Atividade).filter(Atividade.data.isnot(None)).first()
        ini = datetime.combine(a.data, datetime.strptime(a.inicio, '%H:%M').time())
        fim = datetime.combine(a.data, datetime.strptime(a.fim, '%H:%M').time())
        aid = a.id
    relogio = {'agora': fim + timedelta(minutes=10)}
    monkeypatch.setattr('app.rotas.eu.agora', lambda: relogio['agora'])
    entrar(app_cliente, 'Bia Teste')
    return {'c': app_cliente, 'qr': token_qr(aid), 'ini': ini, 'fim': fim, 'relogio': relogio, 'aid': aid}


def _enviar(s, lido):
    return s['c'].post('/api/presenca', json={'qr': s['qr'], 'lidoEm': lido.isoformat()})


def test_leitura_guardada_durante_a_atividade_vale(cenario):
    r = _enviar(cenario, cenario['ini'] + timedelta(minutes=15))
    assert r.status_code == 200 and r.json()['activity'] == cenario['aid']
    from app.db import SessionLocal
    from app.modelos import Presenca
    with SessionLocal() as db:
        assert db.query(Presenca).one().via == 'qr-adiado'


def test_leitura_fora_da_atividade_nao_vale(cenario):
    assert _enviar(cenario, cenario['fim'] + timedelta(minutes=5)).status_code == 409


def test_envio_tarde_demais_nao_vale(cenario):
    cenario['relogio']['agora'] = cenario['fim'] + timedelta(minutes=61)
    assert _enviar(cenario, cenario['ini'] + timedelta(minutes=15)).status_code == 409


def test_hora_no_futuro_e_recusada(cenario):
    assert _enviar(cenario, cenario['relogio']['agora'] + timedelta(minutes=30)).status_code == 400


def test_sem_hora_continua_a_regra_de_sempre(cenario):
    # leitura normal (online) depois do fim: recusada como antes
    assert cenario['c'].post('/api/presenca', json={'qr': cenario['qr']}).status_code == 409


def test_hora_com_fuso_e_convertida_para_a_do_campus(cenario):
    # 15 min depois do início, no horário do campus (UTC-3), enviado em UTC pelo aparelho
    from datetime import timezone
    from zoneinfo import ZoneInfo
    from app.config import config
    local = (cenario['ini'] + timedelta(minutes=15)).replace(tzinfo=ZoneInfo(config().fuso))
    r = cenario['c'].post('/api/presenca', json={'qr': cenario['qr'], 'lidoEm': local.astimezone(timezone.utc).isoformat()})
    assert r.status_code == 200


def test_enviar_de_novo_nao_duplica(cenario):
    lido = cenario['ini'] + timedelta(minutes=15)
    assert _enviar(cenario, lido).status_code == 200
    r = _enviar(cenario, lido)
    assert r.status_code == 200 and r.json()['alreadyPresent']
    from app.db import SessionLocal
    from app.modelos import Presenca
    with SessionLocal() as db:
        assert db.query(Presenca).count() == 1


def test_qr_falso_com_hora_continua_recusado(cenario):
    r = cenario['c'].post('/api/presenca', json={'qr': cenario['qr'][:-3] + 'abc', 'lidoEm': cenario['ini'].isoformat()})
    assert r.status_code == 400


def test_credenciamento_guardado_vale(cenario):
    from app.seguranca import token_qr
    r = cenario['c'].post('/api/presenca', json={'qr': token_qr(None), 'lidoEm': cenario['ini'].isoformat()})
    assert r.status_code == 200 and r.json()['credentialed'] and r.json()['activity'] is None


def test_recusa_nao_credencia_por_tabela(cenario):
    # leitura fora da atividade: nada fica gravado, nem o credenciamento que viria junto
    assert _enviar(cenario, cenario['fim'] + timedelta(minutes=5)).status_code == 409
    assert cenario['c'].get('/api/eu').json()['person']['credentialedAt'] is None
