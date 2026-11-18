"""Minicursos da pessoa e vagas reais a partir da página pública de inscrição do evento no SUAP (nomes fictícios)."""
from conftest import entrar

PAGINA = """
<div class="box-item"><h5><strong>Minicurso</strong> das 14:00 às 18:00</h5><p class="true">4 vaga(s) remanescente(s)</p>
<p>Introdução ao React Native com Expo - Fulano de Tal (Minicurso de 4h)</p><dl class="definition-list flex">
<div class="list-item"><dt>Participante</dt><dd>Ana Clara de Souza Lima</dd></div>
<div class="list-item"><dt>Participante</dt><dd>Bruno Alves</dd></div>
<div class="list-item"><dt>Monitor</dt><dd>Carla Dias</dd></div></dl></div>
<div class="box-item"><h5><strong>Minicurso</strong> das 08:00 às 12:00</h5><p>Vagas ocupadas</p>
<p>Desenvolvendo jogos com Game Maker - Beltrano (Minicurso de 4h)</p><dl class="definition-list flex">
<div class="list-item"><dt>Participante</dt><dd>Ana Clara Souza Lima</dd></div></dl></div>
<div class="box-item"><h5><strong>Palestra</strong> das 07:30 às 08:30</h5><p>Vagas ilimitadas</p>
<p>Saúde Mental na Era da IA - Sicrano</p><dl class="definition-list flex">
<div class="list-item"><dt>Participante</dt><dd>Ana Clara de Souza Lima</dd></div></dl></div>
"""


def _pagina(monkeypatch):
    from app import suap_inscricoes
    lidas = suap_inscricoes.ler_pagina(PAGINA)
    monkeypatch.setattr(suap_inscricoes, 'atividades', lambda: lidas)
    return lidas


def test_le_vagas_e_nomes():
    from app import suap_inscricoes
    rn, gm, pal = suap_inscricoes.ler_pagina(PAGINA)
    assert (rn.tipo, rn.restantes, rn.participantes) == ('Minicurso', 4, 2)
    assert (gm.restantes, gm.participantes) == (0, 1) and pal.restantes is None
    assert suap_inscricoes.esta_na_lista(['Ana Lima'], rn)  # nome usual: primeiro e último, na ordem
    assert suap_inscricoes.esta_na_lista(['Ana Clara de Souza Lima'], rn)
    assert not suap_inscricoes.esta_na_lista(['Ana Souza'], rn)  # último nome diferente
    assert not suap_inscricoes.esta_na_lista(['Bruno'], rn)  # um nome só não basta
    assert suap_inscricoes.esta_na_lista(['Carla Dias'], rn)  # monitor também está no minicurso


def test_inscricoes_da_pessoa_vem_da_pagina(app_cliente, monkeypatch):
    _pagina(monkeypatch)
    entrar(app_cliente, 'Ana Lima', matricula='20250100')
    eu = app_cliente.get('/api/eu').json()
    assert sorted(eu['saved']) == sorted(eu['inscricoes']) == ['game-maker', 'react-native', 'saude-mental']
    # inscrição no SUAP não sai pelo app (nem minicurso, nem palestra)
    assert app_cliente.delete('/api/eu/agenda/saude-mental').status_code == 409
    assert app_cliente.delete('/api/eu/agenda/game-maker').status_code == 409
    # minicurso que saiu da lista do SUAP sai da agenda; palestra que a pessoa salvou continua
    from app import suap_inscricoes
    outra = suap_inscricoes.ler_pagina(PAGINA.replace('Ana Clara Souza Lima', 'Outra Pessoa').replace(
        '<dd>Ana Clara de Souza Lima</dd></div></dl></div>\n"""', '<dd>Outra Pessoa</dd></div></dl></div>\n"""'))
    monkeypatch.setattr(suap_inscricoes, 'atividades', lambda: outra)
    assert sorted(app_cliente.get('/api/eu').json()['saved']) == ['react-native', 'saude-mental']


def test_quem_nao_esta_na_lista_nao_ganha_minicurso(app_cliente, monkeypatch):
    _pagina(monkeypatch)
    entrar(app_cliente, 'Davi Moura', matricula='20250101')
    assert app_cliente.get('/api/eu').json()['saved'] == []
    assert app_cliente.get('/api/eu').json()['inscricoes'] == []


def test_vagas_reais_na_programacao(app_cliente, monkeypatch):
    _pagina(monkeypatch)
    prog = {x['id']: x for x in app_cliente.get('/api/programacao').json()['sessions']}
    assert (prog['react-native']['seats'], prog['react-native']['taken']) == (6, 2)
    assert (prog['game-maker']['seats'], prog['game-maker']['taken']) == (1, 1)


def test_sem_a_pagina_nada_muda(app_cliente):
    entrar(app_cliente, 'Ana Lima', matricula='20250102')
    assert app_cliente.get('/api/eu').json()['saved'] == []


def test_titulos_parecidos_nao_se_confundem():
    from types import SimpleNamespace as A
    from app.suap_inscricoes import AtividadeSuap, correspondencia
    lidas = [AtividadeSuap('Apresentação Cultural', 'Banda Inteira (Apresentação Cultural de 0:30h)', None, 0),
             AtividadeSuap('Vivência', 'Banda Inteira, Cerimônia de Encerramento e Entrega de Premiações (Vivência)', None, 0)]
    m = correspondencia(lidas, [A(id='encerramento', titulo='Banda Inteira, Cerimônia de Encerramento e Entrega de Premiações'),
                                A(id='banda', titulo='Banda Inteira')])
    assert m['banda'] is lidas[0] and m['encerramento'] is lidas[1]
