from conftest import entrar


def test_org_cria_e_edita_atividade_com_materiais(app_cliente):
    entrar(app_cliente, 'Org', org=True, matricula='org-atividades')
    nova = {'titulo': 'Introdução ao Git', 'tipo': 'Minicurso', 'data': '2025-11-27', 'inicio': '14:00', 'fim': '16:00',
            'sala': 'Lab 213', 'andar': 2, 'zona': 'lab-sul-1', 'palestrante': 'Maria Clara Souza', 'vagas': 25,
            'descricao': 'Versionamento do zero.', 'requisitos': 'Notebook com Git.',
            'materiais': [{'nome': 'Slides', 'tipo': 'pdf'}]}
    r = app_cliente.post('/api/org/atividades', json=nova)
    assert r.status_code == 201, r.text
    a = r.json()
    assert a['id'] == 'introducao-ao-git' and a['day'] == 27 and a['room'] == 'Lab 213'
    assert a['speakerShort'] == 'Maria Souza' and a['initials'] == 'MS'
    assert a['materials'] == [{'kind': 'pdf', 'name': 'Slides', 'url': None, 'meta': 'PDF'}]
    assert app_cliente.post('/api/org/atividades', json=nova).json()['id'] == 'introducao-ao-git-2'
    assert any(s['id'] == 'introducao-ao-git' for s in app_cliente.get('/api/programacao').json()['sessions'])

    r = app_cliente.patch('/api/org/atividades/introducao-ao-git', json={'titulo': 'Git e GitHub', 'fim': '17:00',
        'materiais': [{'nome': 'Repositório', 'tipo': 'link', 'url': 'https://exemplo.org/repo'}]})
    assert r.status_code == 200, r.text
    a = r.json()
    assert a['title'] == 'Git e GitHub' and a['end'] == '17:00' and a['time'] == '14:00' and a['room'] == 'Lab 213'
    assert a['materials'][0]['kind'] == 'link' and a['materials'][0]['url'] == 'https://exemplo.org/repo'
    assert app_cliente.patch('/api/org/atividades/introducao-ao-git', json={'inicio': '18:00'}).status_code == 422
    assert app_cliente.patch('/api/org/atividades/nao-existe', json={'titulo': 'X Y'}).status_code == 404


def test_participante_nao_cria_atividade(app_cliente):
    entrar(app_cliente, 'Ana', matricula='aluno-1')
    r = app_cliente.post('/api/org/atividades', json={'titulo': 'Teste', 'data': '2025-11-26', 'inicio': '10:00', 'fim': '11:00'})
    assert r.status_code == 403


def test_org_lista_qrs_assinados(app_cliente):
    from app.seguranca import ler_qr
    entrar(app_cliente, 'Org', org=True, matricula='org-qrs')
    r = app_cliente.get('/api/org/qrs/lista')
    assert r.status_code == 200
    itens = r.json()
    assert itens[0]['title'] == 'Credenciamento' and itens[0]['id'] is None
    assert len(itens) == 21
    alvo = next(i for i in itens if i['id'] == 'react-native')
    assert ler_qr(alvo['token'])['a'] == 'react-native'


def test_participante_nao_ve_qrs(app_cliente):
    entrar(app_cliente, 'Ana', matricula='aluno-qrs')
    assert app_cliente.get('/api/org/qrs/lista').status_code == 403


def test_material_em_arquivo_abre_so_com_presenca(app_cliente):
    from app.seguranca import token_qr
    entrar(app_cliente, 'Org', org=True, matricula='org-arq')
    pdf = b'%PDF-1.4\n% material de teste\n'
    r = app_cliente.post('/api/org/atividades/react-native/arquivos?nome=Slides%20da%20aula', content=pdf, headers={'content-type': 'application/pdf'})
    assert r.status_code == 201, r.text
    m = r.json()['materials'][-1]
    assert m['kind'] == 'pdf' and m['name'] == 'Slides da aula' and m['url'].startswith('/api/arquivos/')
    assert app_cliente.get(m['url']).content == pdf
    assert app_cliente.post('/api/org/atividades/react-native/arquivos', content=b'x', headers={'content-type': 'application/x-msdownload'}).status_code == 415
    # editar a lista mantém o anexo
    mats = [{'nome': m['name'], 'tipo': 'pdf', 'arquivo': m['file'], 'mime': 'application/pdf'}]
    assert app_cliente.patch('/api/org/atividades/react-native', json={'materiais': mats}).json()['materials'][0]['url'] == m['url']
    app_cliente.post('/api/auth/sair')
    entrar(app_cliente, 'Bia', matricula='aluno-arq')
    assert app_cliente.get(m['url']).status_code == 403
    app_cliente.post('/api/presenca', json={'qr': token_qr('react-native')})
    r = app_cliente.get(m['url'])
    assert r.status_code == 200 and r.headers['content-type'] == 'application/pdf'
