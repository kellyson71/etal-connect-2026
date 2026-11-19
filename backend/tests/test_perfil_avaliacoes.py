"""Perfil do app no servidor, saída pelo QR da sala, avaliações, busca de pessoas, dados e planilha do painel."""
from datetime import datetime, timedelta

from app.seguranca import token_qr
from conftest import entrar

CARTAO = {'publish': True, 'nadic': 'bolsista', 'langs': ['Python', 'Python', 'JavaScript'], 'areas': ['IA'], 'open': ['Estágio'],
          'bio': 'Curto jogos.', 'tema': 'noite'}


def _atividade(c):
    return next(s for s in c.get('/api/programacao').json()['sessions'] if s.get('floor') is not None)


def test_perfil_salvo_no_servidor_e_devolvido_em_eu(app_cliente):
    entrar(app_cliente)
    r = app_cliente.put('/api/eu/cartao', json=CARTAO)
    assert r.status_code == 200 and r.json()['langs'] == ['Python', 'JavaScript']
    assert app_cliente.get('/api/eu').json()['card']['tema'] == 'noite'
    assert app_cliente.put('/api/eu/cartao', json={**CARTAO, 'bio': 'x' * 200}).status_code == 422


def test_segunda_leitura_libera_avaliacao(app_cliente):
    entrar(app_cliente)
    aid = _atividade(app_cliente)['id']
    nota = {'nota': 5, 'rapidos': ['Didática clara', 'inventado'], 'comentario': ' Ótima aula '}
    assert app_cliente.post('/api/presenca', json={'qr': token_qr(aid)}).json()['left'] is None
    assert app_cliente.put(f'/api/eu/avaliacoes/{aid}', json=nota).status_code == 409
    r = app_cliente.post('/api/presenca', json={'qr': token_qr(aid)}).json()
    assert r['alreadyPresent'] and r['left'] and not r['rated']
    v = app_cliente.put(f'/api/eu/avaliacoes/{aid}', json=nota).json()
    assert v['quick'] == ['Didática clara'] and v['text'] == 'Ótima aula'
    eu = app_cliente.get('/api/eu').json()
    assert eu['left'][aid] and eu['ratings'][aid]['n'] == 5
    assert app_cliente.post('/api/presenca', json={'qr': token_qr(aid)}).json()['rated']
    assert app_cliente.put(f'/api/eu/avaliacoes/{aid}', json={'nota': 6}).status_code == 422


def test_saida_so_perto_do_fim_com_janela(app_cliente, monkeypatch):
    from app.config import config
    from app.rotas import eu as rotas_eu
    monkeypatch.setattr(config(), 'janela_presenca', True)
    entrar(app_cliente)
    a = _atividade(app_cliente)
    ini = datetime.fromisoformat(f"{a['date']}T{a['time']}")
    fim = datetime.fromisoformat(f"{a['date']}T{a['end']}")
    monkeypatch.setattr(rotas_eu, 'agora', lambda: ini)
    r = app_cliente.post('/api/presenca', json={'qr': token_qr(a['id'])}).json()
    assert r['exitFrom'] == (fim - timedelta(minutes=20)).strftime('%H:%M')
    assert app_cliente.post('/api/presenca', json={'qr': token_qr(a['id'])}).json()['left'] is None
    monkeypatch.setattr(rotas_eu, 'agora', lambda: fim + timedelta(minutes=10))
    assert app_cliente.post('/api/presenca', json={'qr': token_qr(a['id'])}).json()['left'] == (fim + timedelta(minutes=10)).strftime('%H:%M')


def test_busca_de_pessoas_respeita_perfil_oculto(app_cliente):
    entrar(app_cliente, 'Bruna Visível')
    app_cliente.put('/api/eu/cartao', json=CARTAO)
    aid = _atividade(app_cliente)['id']
    app_cliente.post('/api/presenca', json={'qr': token_qr(aid)})
    entrar(app_cliente, 'Bruno Oculto')
    app_cliente.put('/api/eu/cartao', json={**CARTAO, 'publish': False, 'phone': '84999990000'})
    achados = {p['name']: p for p in app_cliente.get('/api/pessoas', params={'q': 'brun'}).json()}
    assert set(achados) == {'Bruna Visível', 'Bruno Oculto'}
    assert achados['Bruna Visível']['card']['langs'] == ['Python', 'JavaScript']
    assert achados['Bruno Oculto']['card'] == {'publish': False}
    visivel = app_cliente.get(f"/api/pessoas/{achados['Bruna Visível']['id']}").json()
    assert visivel['attended'] == [aid]
    assert app_cliente.get(f"/api/pessoas/{achados['Bruno Oculto']['id']}").json()['card'] == {'publish': False}
    assert app_cliente.get('/api/pessoas', params={'q': 'b'}).json() == []


def test_painel_dados_avaliacoes_e_planilha(app_cliente):
    entrar(app_cliente, 'Carla Participante', matricula='2023001')
    app_cliente.put('/api/eu/cartao', json=CARTAO)
    aid = _atividade(app_cliente)['id']
    for _ in range(2):
        app_cliente.post('/api/presenca', json={'qr': token_qr(aid)})
    app_cliente.put(f'/api/eu/avaliacoes/{aid}', json={'nota': 4, 'rapidos': ['Faltou prática'], 'comentario': 'Mais exercícios'})
    entrar(app_cliente, 'Org', org=True, matricula='org1')
    ps = {p['name']: p for p in app_cliente.get('/api/org/participantes').json()}
    assert ps['Carla Participante']['present'] == [aid] and ps['Carla Participante']['rated'] == [aid]
    assert ps['Carla Participante']['nadic'] == 'bolsista'
    d = app_cliente.get('/api/org/dados').json()
    assert d['perfis'] == 1 and ['Python', 1] in d['langs'] and ['bolsista', 1] in d['nadic']
    av = app_cliente.get('/api/org/avaliacoes').json()
    assert av[0]['activity'] == aid and av[0]['avg'] == 4 and av[0]['dist'] == [0, 0, 0, 1, 0]
    assert av[0]['comments'] == [{'n': 4, 'text': 'Mais exercícios', 'at': av[0]['comments'][0]['at']}]
    assert 'Carla' not in str(av)
    url = app_cliente.get('/api/org/planilha').json()['url']
    caminho = url.split('http://teste', 1)[1]
    csv = app_cliente.get(caminho, params={'atividade': aid, 'situacao': 'avaliaram'}).text
    assert csv.startswith('nome,tipo') and 'Carla Participante' in csv and '2023001' in csv and 'Org' not in csv
    novo = app_cliente.post('/api/org/planilha/novo').json()['url']
    assert novo != url and app_cliente.get(caminho).status_code == 404
    assert app_cliente.get('/api/planilha/qualquercoisa.csv').status_code == 404
