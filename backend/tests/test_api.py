from app.seguranca import token_qr
from conftest import entrar


def test_programacao_publica(app_cliente):
    r = app_cliente.get('/api/programacao')
    assert r.status_code == 200
    s = r.json()['sessions']
    assert len(s) == 21
    assert {'id', 'title', 'time', 'end', 'room', 'date'} <= set(s[0])


def test_eu_exige_login(app_cliente):
    assert app_cliente.get('/api/eu').status_code == 401


def test_agenda(app_cliente):
    entrar(app_cliente)
    aid = app_cliente.get('/api/programacao').json()['sessions'][0]['id']
    assert app_cliente.post(f'/api/eu/agenda/{aid}').json()['ok']
    assert app_cliente.post(f'/api/eu/agenda/{aid}').json()['ok']  # repetir não duplica
    assert app_cliente.get('/api/eu').json()['saved'] == [aid]
    prog = {x['id']: x for x in app_cliente.get('/api/programacao').json()['sessions']}
    assert prog[aid]['taken'] == 1
    app_cliente.delete(f'/api/eu/agenda/{aid}')
    assert app_cliente.get('/api/eu').json()['saved'] == []


def test_presenca_por_qr(app_cliente):
    entrar(app_cliente)
    # QR do evento: só credencia
    r = app_cliente.post('/api/presenca', json={'qr': f'http://teste/q/{token_qr(None)}'}).json()
    assert r['credentialed'] and r['newCredential'] and r['activity'] is None
    # QR de uma atividade: registra presença, e ler de novo não duplica
    aid = app_cliente.get('/api/programacao').json()['sessions'][0]['id']
    r1 = app_cliente.post('/api/presenca', json={'qr': token_qr(aid)}).json()
    r2 = app_cliente.post('/api/presenca', json={'qr': token_qr(aid)}).json()
    assert r1['activity'] == aid and not r1['alreadyPresent'] and r2['alreadyPresent']
    eu = app_cliente.get('/api/eu').json()
    assert aid in eu['present'] and eu['person']['credentialedAt']


def test_qr_falso_recusado(app_cliente):
    entrar(app_cliente)
    assert app_cliente.post('/api/presenca', json={'qr': 'http://teste/q/inventado.qualquer'}).status_code == 400


def test_janela_de_horario(app_cliente, monkeypatch):
    from app.config import config
    monkeypatch.setattr(config(), 'janela_presenca', True)
    entrar(app_cliente)
    aid = app_cliente.get('/api/programacao').json()['sessions'][0]['id']  # atividade de 2025: fora do horário
    assert app_cliente.post('/api/presenca', json={'qr': token_qr(aid)}).status_code == 409


def test_org_protegida(app_cliente):
    entrar(app_cliente)
    assert app_cliente.post('/api/org/avisos', json={'titulo': 'Oi', 'texto': 'Teste'}).status_code == 403


def test_org_aviso_troca_sala_e_exportacao(app_cliente):
    entrar(app_cliente, 'Org', org=True, matricula='org1')
    r = app_cliente.post('/api/org/avisos', json={'titulo': 'Intervalo', 'texto': 'Café no pátio'})
    assert r.status_code == 201
    assert app_cliente.get('/api/avisos').json()[0]['title'] == 'Intervalo'
    aid = app_cliente.get('/api/programacao').json()['sessions'][0]['id']
    r = app_cliente.patch(f'/api/org/atividades/{aid}/sala', json={'andar': 1, 'zona': 'sala-norte-1', 'sala': 'Sala 102'})
    assert r.json()['room'] == 'Sala 102'
    assert app_cliente.get('/api/avisos').json()[0]['title'] == 'Mudança de sala'
    assert app_cliente.put('/api/org/salas', json={'0:secretaria-academica': '003'}).json() == {'0:secretaria-academica': '003'}
    assert app_cliente.get('/api/programacao').json()['rooms'] == {'0:secretaria-academica': '003'}
    app_cliente.post('/api/presenca', json={'qr': token_qr(aid)})
    csv = app_cliente.get('/api/org/presencas.csv').text
    assert 'org1' in csv and aid in csv
    assert 'svg' in app_cliente.get('/api/org/qrs').text


def test_visitante_por_link(app_cliente):
    r = app_cliente.post('/api/auth/visitante', json={'nome': 'Bia Fora', 'email': 'bia@exemplo.com'})
    assert r.status_code == 202
    link = r.json()['link']
    r = app_cliente.get(link.replace('http://teste', ''), follow_redirects=False)
    assert r.status_code == 302 and 'login=ok' in r.headers['location']
    assert app_cliente.get('/api/eu').json()['person']['name'] == 'Bia Fora'
    # o mesmo link não serve duas vezes
    r = app_cliente.get(link.replace('http://teste', ''), follow_redirects=False)
    assert 'link-expirado' in r.headers['location']


def test_qr_aberto_na_camera(app_cliente):
    r = app_cliente.get(f'/q/{token_qr(None)}', follow_redirects=False)
    assert r.status_code == 302 and '/?qr=' in r.headers['location']


def test_suap_sem_configuracao(app_cliente):
    r = app_cliente.get('/api/auth/suap', follow_redirects=False)
    assert r.status_code == 302 and r.headers['location'].endswith('/?login=suap-indisponivel')


def test_homologacao(app_cliente, monkeypatch):
    from app.config import config
    monkeypatch.setattr(config(), 'senha_homologacao', 'etal')
    assert app_cliente.post('/api/auth/dev', json={'nome': 'X', 'codigo': 'errado'}).status_code == 403
    assert app_cliente.post('/api/auth/dev', json={'nome': 'X', 'codigo': 'etal'}).status_code == 200
    qrs = app_cliente.get('/api/homologacao/qrs').json()
    assert qrs[0]['id'] is None and '<svg' in qrs[0]['svg'] and len(qrs) > 5
    assert app_cliente.post('/api/presenca', json={'qr': qrs[1]['url']}).json()['activity'] == qrs[1]['id']
