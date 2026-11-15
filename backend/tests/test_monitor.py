"""Monitoramento: o log não leva tokens nem dados da pessoa, e a organização vê os números do servidor."""
import logging

from conftest import entrar


class Guardar(logging.Handler):
    def __init__(self):
        super().__init__()
        self.linhas = []

    def emit(self, r):
        self.linhas.append(r.getMessage())


def test_log_sem_token_nem_dados_da_pessoa(app_cliente):
    from app.seguranca import token_qr
    g = Guardar()
    logging.getLogger('etal').addHandler(g)
    try:
        entrar(app_cliente, 'Ana Sigilo', matricula='20251234')
        token = token_qr('game-maker')
        app_cliente.get(f'/q/{token}', follow_redirects=False)
        app_cliente.get('/api/auth/link?t=segredo-do-link', follow_redirects=False)
        app_cliente.post('/api/presenca', json={'qr': token})
    finally:
        logging.getLogger('etal').removeHandler(g)
    tudo = '\n'.join(g.linhas)
    assert '/q/{token}' in tudo and '/api/auth/link' in tudo and '/api/presenca' in tudo
    for segredo in (token, 'segredo-do-link', 'Ana Sigilo', '20251234', 'testclient'):
        assert segredo not in tudo


def test_numeros_do_servidor_so_para_organizacao(app_cliente):
    entrar(app_cliente)
    assert app_cliente.get('/api/org/sistema').status_code == 403
    entrar(app_cliente, 'Equipe', org=True)
    app_cliente.get('/api/programacao')
    n = app_cliente.get('/api/org/sistema').json()
    assert n['requisicoes']['ultimo_minuto'] >= 3 and n['requisicoes']['entradas'] >= 2
    assert n['suap']['simultaneos'] == 16 and {'em_uso', 'esperando'} <= set(n['suap'])
    assert n['banco']['ms'] >= 0 and 'conectados' in n['ao_vivo'] and n['movimento']['pessoas'] == 2


def test_saude_confere_o_banco(app_cliente):
    assert app_cliente.get('/api/saude').json() == {'ok': True}
