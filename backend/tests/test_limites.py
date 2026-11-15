"""Limites pensados para o Wi-Fi do campus (todo mundo pelo mesmo IP) e fila curta para o SUAP."""
import asyncio

import httpx
import pytest


class _Resp:
    def __init__(self, status, dados):
        self.status_code, self._d = status, dados

    def json(self):
        return self._d

    def raise_for_status(self):
        if self.status_code >= 400:
            raise httpx.HTTPStatusError('erro', request=None, response=None)


def _suap_falso(atraso=0.0):
    class Falso:
        def __init__(self, **_):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *_):
            return False

        async def post(self, url, json):
            await asyncio.sleep(atraso)
            return _Resp(200, {'access': 'a'}) if json['password'] == 'certa' else _Resp(401, {})

        async def get(self, url, headers):
            return _Resp(200, {'identificacao': self.mat, 'nome_usual': 'Pessoa'})
    return Falso


def test_mesma_rede_muitas_pessoas_entram(app_cliente, monkeypatch):
    """30 matrículas diferentes, todas do mesmo IP (o Wi-Fi do campus): ninguém é barrado."""
    falso = _suap_falso()
    monkeypatch.setattr(httpx, 'AsyncClient', falso)
    for i in range(30):
        falso.mat = f'2024{i:04d}'
        r = app_cliente.post('/api/auth/suap/senha', json={'matricula': falso.mat, 'senha': 'certa'})
        assert r.status_code == 200, r.text


def test_tentativas_por_matricula(app_cliente, monkeypatch):
    """Senha errada várias vezes na mesma matrícula: a partir da 7ª tentativa no minuto, 429."""
    falso = _suap_falso()
    falso.mat = '20249999'
    monkeypatch.setattr(httpx, 'AsyncClient', falso)
    cods = [app_cliente.post('/api/auth/suap/senha', json={'matricula': '20249999', 'senha': 'errada'}).status_code for _ in range(7)]
    assert cods[:6] == [401] * 6 and cods[6] == 429
    # outra matrícula da mesma rede continua entrando
    falso.mat = '20248888'
    assert app_cliente.post('/api/auth/suap/senha', json={'matricula': '20248888', 'senha': 'certa'}).status_code == 200


def test_fila_do_suap_cheia_responde_503_com_retry_after(monkeypatch):
    """Com o teto ocupado além da espera, a resposta é 503 com Retry-After (o app tenta de novo sozinho)."""
    from fastapi import HTTPException

    from app import suap_fila
    from app.config import config
    monkeypatch.setattr(config(), 'suap_simultaneos', 1)
    monkeypatch.setattr(config(), 'suap_espera', 0.05)

    async def cenario():
        suap_fila._sem = None
        async with suap_fila.vez_no_suap():
            with pytest.raises(HTTPException) as e:
                async with suap_fila.vez_no_suap():
                    pass
        return e.value
    erro = asyncio.run(cenario())
    assert erro.status_code == 503 and erro.headers['Retry-After']
