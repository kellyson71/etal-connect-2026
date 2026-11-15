from datetime import datetime, timedelta, timezone
import httpx
import pytest
from app import suap_portal as suap
from conftest import entrar


def test_portal_nao_expoe_chaves_privadas_e_ignora_origem_externa():
    with httpx.Client() as client:
        portal = suap.Portal(client, 'https://suap.ifrn.edu.br', datetime.now(timezone.utc) + timedelta(minutes=20))
        suap.parse_events(portal, '''<table><tbody><tr><td><a href="/eventos/evento/8528/">8528</a></td><td>VII ETAL</td><td><a href="/eventos/download/chave-privada/">Certificado</a><a href="https://outro.invalid/eventos/download/chave/">Ignorar</a></td></tr></tbody></table>''')
        assert portal.events == [{'id':8528,'name':'VII ETAL','url':'https://suap.ifrn.edu.br/eventos/evento/8528/'}]
        assert len(portal.certificates) == 1
        assert 'chave-privada' not in str(portal.certificates)
        assert portal.downloads['evento-8528-0'].endswith('/chave-privada/')


def test_certificado_exige_sessao_do_titular_e_pdf():
    def mock(request):
        return httpx.Response(200, content=b'<html>Login expirou</html>')
    client = httpx.Client(transport=httpx.MockTransport(mock))
    portal = suap.Portal(client, 'https://suap.ifrn.edu.br', datetime.now(timezone.utc)+timedelta(minutes=20), downloads={'meu':'https://suap.ifrn.edu.br/eventos/download/privado/'})
    suap._sessions[-1] = portal
    try:
        with pytest.raises(ValueError): suap.certificate(-2,'meu')
        with pytest.raises(ValueError, match='PDF'): suap.certificate(-1,'meu')
    finally: suap.discard(-1)


def test_portal_exige_login_e_nao_simula_certificados(app_cliente):
    assert app_cliente.get('/api/eu/suap').status_code == 401
    entrar(app_cliente)
    data = app_cliente.get('/api/eu/suap').json()
    assert data['connected'] is False and data['certificates'] == []
    assert app_cliente.get('/api/eu/suap/certificados/alheio').status_code == 409
    assert app_cliente.get('/api/cenario-demo').status_code == 404


def test_matricula_admin_reconhecida_no_login_suap(app_cliente, monkeypatch):
    from app.config import config
    from app.rotas.auth import _pessoa_suap
    from app.db import SessionLocal
    monkeypatch.setattr(config(), 'organizacao', '20251094040030')
    with SessionLocal() as db:
        person = _pessoa_suap({'identificacao':'20251094040030','nome_usual':'Admin da demo'},db)
        assert person.papel == 'organizacao'


def test_portal_vinculado_a_sessao_e_nao_so_a_matricula(app_cliente):
    from fastapi.testclient import TestClient
    from app.main import app
    entrar(app_cliente, matricula='mesma-matricula')
    pid=app_cliente.get('/api/eu').json()['person']['id']
    key=f'{pid}:token-exclusivo'
    suap._sessions[key]=suap.Portal(httpx.Client(),'https://suap.ifrn.edu.br',datetime.now(timezone.utc)+timedelta(minutes=20))
    try:
        app_cliente.cookies.set('etal_suap_portal','token-exclusivo',domain='testserver.local',path='/api')
        assert app_cliente.get('/api/eu/suap').json()['connected'] is True
        with TestClient(app) as other:
            entrar(other,matricula='mesma-matricula')
            assert other.get('/api/eu/suap').json()['connected'] is False
        app_cliente.post('/api/auth/dev',json={'matricula':'mesma-matricula'})
        assert app_cliente.get('/api/eu/suap').json()['connected'] is False
    finally: suap.discard(key)
