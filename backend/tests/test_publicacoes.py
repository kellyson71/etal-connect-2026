"""Publicações no servidor: quem pode o quê, fotos, denúncias, moderação e o que cada pessoa recebe."""
import base64
import io

import pytest
from fastapi.testclient import TestClient
from conftest import entrar


def credenciar(c):
    from app.seguranca import token_qr
    assert c.post('/api/presenca', json={'qr': token_qr(None)}).status_code == 200


def foto(gps=False, formato='JPEG'):
    from PIL import Image
    img = Image.new('RGB', (2400, 1200), (200, 120, 40))
    b = io.BytesIO()
    if gps:
        exif = Image.Exif()
        exif[0x8825] = {1: 'S', 2: (6.0, 6.0, 0.0)}  # GPSInfo
        img.save(b, formato, exif=exif)
    else:
        img.save(b, formato)
    return f'data:image/{formato.lower()};base64,' + base64.b64encode(b.getvalue()).decode()


@pytest.fixture()
def tres(app_cliente):
    """Ana (credenciada), Bia (credenciada) e a organização, cada uma com a sua sessão."""
    from app.main import app
    ana = app_cliente
    entrar(ana, 'Ana Teste', matricula='ana')
    credenciar(ana)
    bia = TestClient(app)
    entrar(bia, 'Bia Teste', matricula='bia')
    credenciar(bia)
    org = TestClient(app)
    entrar(org, 'Equipe ETAL', org=True, matricula='org')
    return ana, bia, org


def test_ver_exige_entrar(app_cliente):
    assert app_cliente.get('/api/publicacoes').status_code == 401


def test_sem_credenciamento_ve_mas_nao_publica(app_cliente):
    entrar(app_cliente, 'Caio Teste')
    assert app_cliente.get('/api/publicacoes').status_code == 200
    assert app_cliente.post('/api/publicacoes', json={'texto': 'oi'}).status_code == 403
    assert app_cliente.post('/api/publicacoes/mensagens', json={'texto': 'oi'}).status_code == 403


def test_publicar_comentar_curtir_salvar(tres):
    ana, bia, _ = tres
    pid = ana.post('/api/publicacoes', json={'texto': 'Primeiro dia!', 'atividade': 'game-maker', 'assunto': 'Projetos'}).json()['id']
    assert bia.post(f'/api/publicacoes/{pid}/comentarios', json={'texto': 'Boa!'}).status_code == 200
    assert bia.post(f'/api/publicacoes/{pid}/curtir').json() == {'curtiu': True}
    assert bia.post(f'/api/publicacoes/{pid}/salvar').json() == {'salvou': True}
    v = bia.get('/api/publicacoes').json()
    post = v['posts'][0]
    assert post['text'] == 'Primeiro dia!' and post['activity'] == 'game-maker' and post['tag'] == 'Projetos' and post['day']
    assert post['author'] == 'p' + post['author'][1:] and post['author'] != 'ana'  # a matrícula da Ana não vai para a Bia
    assert v['comments'][pid][0]['author'] == 'bia'  # o que é da própria pessoa vem com o id dela
    assert v['likes'][pid] == ['bia'] and v['bookmarks'] == {'bia': [pid]}
    assert v['reports'] == [] and v['audit'] == []
    assert bia.post(f'/api/publicacoes/{pid}/curtir').json() == {'curtiu': False}


def test_nao_vaza_matricula_nem_email(tres):
    ana, bia, _ = tres
    ana.post('/api/publicacoes', json={'texto': 'oi @bia'})
    corpo = bia.get('/api/publicacoes').text
    assert '"ana"' not in corpo and 'email' not in corpo


def test_mencao_vira_id_da_pessoa(tres):
    ana, bia, _ = tres
    ana.post('/api/publicacoes/mensagens', json={'texto': 'Oi'})
    autor_ana = bia.get('/api/publicacoes').json()['messages'][0]['author']
    bia.post('/api/publicacoes/mensagens', json={'texto': 'Oi @ana', 'mencoes': [autor_ana, 'p99999', 'lixo']})
    msgs = ana.get('/api/publicacoes').json()['messages']
    assert msgs[1]['mentions'] == ['ana']  # quem não existe sai


def test_fotos_sao_regravadas_sem_localizacao(tres):
    ana, bia, _ = tres
    from PIL import Image
    r = ana.post('/api/publicacoes', json={'texto': '', 'fotos': [{'dados': foto(gps=True), 'alt': 'Laranja'},
                                                                   {'dados': foto(formato='PNG')}]})
    assert r.status_code == 200
    img = bia.get('/api/publicacoes').json()['posts'][0]['images']
    assert len(img) == 2 and img[0]['alt'] == 'Laranja'
    f = bia.get(img[0]['src'])
    assert f.status_code == 200 and f.headers['content-type'] == 'image/jpeg'
    salva = Image.open(io.BytesIO(f.content))
    assert max(salva.size) <= 1600 and 0x8825 not in salva.getexif()


def test_foto_falsa_e_recusada(tres):
    ana, _, _ = tres
    falsa = 'data:image/jpeg;base64,' + base64.b64encode(b'<script>alert(1)</script>').decode()
    assert ana.post('/api/publicacoes', json={'fotos': [{'dados': falsa}]}).status_code == 400
    assert ana.post('/api/publicacoes', json={'fotos': [{'dados': 'data:text/html,oi'}]}).status_code == 400
    assert ana.post('/api/publicacoes', json={'fotos': [{'dados': foto()}] * 7}).status_code == 422
    assert ana.post('/api/publicacoes', json={'texto': '   '}).status_code == 400


def test_foto_exige_entrar(tres, app_cliente):
    ana, _, _ = tres
    ana.post('/api/publicacoes', json={'fotos': [{'dados': foto()}]})
    src = ana.get('/api/publicacoes').json()['posts'][0]['images'][0]['src']
    from app.main import app
    assert TestClient(app).get(src).status_code == 401


def test_so_o_autor_apaga_e_apaga_tudo(tres):
    ana, bia, _ = tres
    pid = ana.post('/api/publicacoes', json={'texto': 'vai sumir', 'fotos': [{'dados': foto()}]}).json()['id']
    src = ana.get('/api/publicacoes').json()['posts'][0]['images'][0]['src']
    bia.post(f'/api/publicacoes/{pid}/comentarios', json={'texto': 'comentário'})
    bia.post(f'/api/publicacoes/{pid}/curtir')
    assert bia.delete(f'/api/publicacoes/{pid}').status_code == 403
    assert ana.delete(f'/api/publicacoes/{pid}').json()['resultado'] == 'apagada'
    v = bia.get('/api/publicacoes').json()
    assert v['posts'] == [] and v['comments'] == {} and v['likes'] == {}
    assert ana.get(src).status_code == 404  # a foto sai do disco


def test_organizacao_oculta_restaura_e_guarda_historico(tres):
    ana, bia, org = tres
    pid = ana.post('/api/publicacoes', json={'texto': 'post'}).json()['id']
    assert org.delete(f'/api/publicacoes/{pid}').json()['resultado'] == 'oculta'
    assert bia.get('/api/publicacoes').json()['posts'] == []
    assert bia.post(f'/api/publicacoes/{pid}/curtir').status_code == 404
    vo = org.get('/api/publicacoes').json()
    assert vo['posts'][0]['id'] == pid and vo['moderation'] == {f'post:{pid}': {'hidden': True}}
    assert org.post('/api/publicacoes/moderar', json={'alvo': f'post:{pid}', 'acao': 'restore', 'nota': 'engano'}).status_code == 200
    assert len(bia.get('/api/publicacoes').json()['posts']) == 1
    hist = org.get('/api/publicacoes').json()['audit']
    assert [h['action'] for h in hist] == ['restore', 'hide'] and hist[0]['note'] == 'engano' and hist[0]['by'] == 'Equipe ETAL'


def test_participante_nao_modera(tres):
    ana, bia, _ = tres
    pid = ana.post('/api/publicacoes', json={'texto': 'post'}).json()['id']
    assert bia.post('/api/publicacoes/moderar', json={'alvo': f'post:{pid}', 'acao': 'hide'}).status_code == 403


def test_denuncia_e_ocultacao_automatica(tres):
    from app.main import app
    ana, bia, org = tres
    pid = ana.post('/api/publicacoes/mensagens', json={'texto': 'spam spam'}).json()['id']
    assert bia.post(f'/api/publicacoes/{pid}/denunciar', json={'motivo': 'Inventado'}).status_code == 400
    assert bia.post(f'/api/publicacoes/{pid}/denunciar', json={'motivo': 'Spam ou propaganda'}).json()['oculta'] is False
    assert bia.post(f'/api/publicacoes/{pid}/denunciar', json={'motivo': 'Spam ou propaganda'}).status_code == 409
    rep = org.get('/api/publicacoes').json()['reports']
    assert rep[0]['target'] == f'message:{pid}' and rep[0]['status'] == 'pending' and rep[0]['snapshot']['text'] == 'spam spam'
    assert bia.get('/api/publicacoes').json()['reports'] == []  # denúncias só a organização vê
    for nome in ('Caio', 'Duda'):
        c = TestClient(app)
        entrar(c, nome, matricula=nome.lower())
        credenciar(c)
        r = c.post(f'/api/publicacoes/{pid}/denunciar', json={'motivo': 'Spam ou propaganda'}).json()
    assert r['oculta'] is True  # 3 pessoas diferentes
    assert bia.get('/api/publicacoes').json()['messages'] == []
    vo = org.get('/api/publicacoes').json()
    assert vo['moderation'] == {f'message:{pid}': {'hidden': True}}
    assert all(x['status'] == 'pending' for x in vo['reports'])  # continuam para a organização decidir
    org.post('/api/publicacoes/moderar', json={'alvo': f'message:{pid}', 'acao': 'hide', 'nota': 'spam'})
    assert {x['status'] for x in org.get('/api/publicacoes').json()['reports']} == {'hidden'}


def test_denuncia_de_conteudo_apagado_pode_ser_arquivada(tres):
    ana, bia, org = tres
    pid = ana.post('/api/publicacoes', json={'texto': 'ofensa'}).json()['id']
    bia.post(f'/api/publicacoes/{pid}/denunciar', json={'motivo': 'Ofensa ou assédio'})
    ana.delete(f'/api/publicacoes/{pid}')
    rep = org.get('/api/publicacoes').json()['reports'][0]
    assert rep['snapshot']['text'] == 'ofensa'
    assert org.post('/api/publicacoes/moderar', json={'alvo': f'post:{pid}', 'acao': 'hide'}).status_code == 404
    assert org.post('/api/publicacoes/moderar', json={'alvo': f'post:{pid}', 'acao': 'dismiss'}).status_code == 200
    assert org.get('/api/publicacoes').json()['reports'][0]['status'] == 'dismissed'


def test_limite_de_publicacoes_por_pessoa(tres):
    ana, bia, _ = tres
    for i in range(10):
        assert ana.post('/api/publicacoes', json={'texto': f'post {i}'}).status_code == 200
    r = ana.post('/api/publicacoes', json={'texto': 'mais um'})
    assert r.status_code == 429 and int(r.headers['Retry-After']) > 0
    assert bia.post('/api/publicacoes', json={'texto': 'a Bia continua'}).status_code == 200


def test_manutencao_apaga_publicacoes_antigas(tres):
    from datetime import timedelta
    from app.db import SessionLocal
    from app.modelos import Publicacao
    from app.seguranca import agora
    from app import manutencao
    ana, _, _ = tres
    velha = ana.post('/api/publicacoes', json={'texto': 'antiga', 'fotos': [{'dados': foto()}]}).json()['id']
    src = ana.get('/api/publicacoes').json()['posts'][0]['images'][0]['src']
    nova = ana.post('/api/publicacoes', json={'texto': 'nova'}).json()['id']
    with SessionLocal() as db:
        db.get(Publicacao, velha).criada_em = agora() - timedelta(days=91)
        db.commit()
    assert manutencao.publicacoes_antigas(90) == 1
    ids = [p['id'] for p in ana.get('/api/publicacoes').json()['posts']]
    assert ids == [nova] and ana.get(src).status_code == 404
