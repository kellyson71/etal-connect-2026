"""Plano B: listas de presença em papel e o lançamento delas no sistema."""
from conftest import entrar


def test_lista_em_papel_traz_quem_se_inscreveu_e_linhas_em_branco(app_cliente, tmp_path):
    from app import importar
    entrar(app_cliente, 'Zé <Script>', matricula='20250001')
    lista = tmp_path / 'inscritos.csv'
    lista.write_text('nome;matricula;atividades\nZé <Script>;20250001;game-maker\n', encoding='utf-8')
    assert importar.inscritos(str(lista)) == (0, 1)
    entrar(app_cliente, 'Equipe', org=True, matricula='org')
    r = app_cliente.get('/api/org/listas-papel?atividade=game-maker')
    assert r.status_code == 200 and 'text/html' in r.headers['content-type']
    assert 'Zé &lt;Script&gt;' in r.text and '20250001' in r.text and '<script>' not in r.text.lower().replace('<style>', '')
    assert r.text.count('<tr><td class="n">') >= 16  # inscrito + linhas em branco
    dia = app_cliente.get('/api/org/listas-papel?dia=26').text
    assert 'Credenciamento no ETAL' in dia and dia.count('<section>') > 2
    assert app_cliente.get('/api/org/listas-papel?atividade=nao-existe').status_code == 404


def test_lancar_lista_em_papel(app_cliente):
    entrar(app_cliente, 'Ana', matricula='20250002')
    entrar(app_cliente, 'Equipe', org=True, matricula='org')
    r = app_cliente.post('/api/org/presenca-manual', json={'atividade': 'game-maker', 'pessoas': '20250002\n ORG , 99999999'})
    assert r.status_code == 200
    j = r.json()
    assert sorted(j['lancadas']) == ['Ana', 'Equipe'] and j['nao_encontradas'] == ['99999999']
    again = app_cliente.post('/api/org/presenca-manual', json={'atividade': 'game-maker', 'pessoas': '20250002'}).json()
    assert again['ja_tinham'] == ['Ana'] and again['lancadas'] == []
    csv = app_cliente.get('/api/org/presencas.csv').text
    assert 'Ana;20250002' in csv and ';manual' in csv
    cred = app_cliente.post('/api/org/presenca-manual', json={'pessoas': '20250002'}).json()
    assert cred['ja_tinham'] == ['Ana']  # já credenciada pela lista da atividade


def test_contingencia_so_organizacao(app_cliente):
    entrar(app_cliente, 'Ana')
    assert app_cliente.get('/api/org/listas-papel').status_code == 403
    assert app_cliente.post('/api/org/presenca-manual', json={'pessoas': 'x'}).status_code == 403
