"""Confere o contrato publicado no Swagger, sem chamar o SUAP real."""


def test_swagger_explica_fluxos_e_documenta_cookie_e_redirecionamento(app_cliente):
    spec=app_cliente.get('/api/openapi.json').json()
    assert not spec['info'].get('description')
    paths=spec['paths']
    oauth=paths['/api/auth/suap']['get']
    assert 'OAuth2' in oauth['summary'] and '302' in oauth['responses'] and '200' not in oauth['responses']
    assert '/api/auth/suap/senha' in oauth['description']
    login=paths['/api/auth/suap/senha']['post']
    assert {'200','401','429','502','503','422'} <= set(login['responses'])
    assert 'Set-Cookie' in login['responses']['200']['headers']
    assert spec['components']['schemas']['LoginSuap']['properties']['senha']['examples']==['SUA_SENHA']
    cookie=spec['components']['securitySchemes']['SessaoETAL']
    assert cookie['in']=='cookie' and cookie['name']=='etal_sessao'
    assert paths['/api/eu']['get']['security']==[{'SessaoETAL':[]}]
    assert not paths['/api/programacao']['get'].get('security')
    assert set(paths['/api/eu/suap/certificados/{cert_id}']['get']['responses']['200']['content'])=={'application/pdf'}
    assert set(paths['/api/org/presencas.csv']['get']['responses']['200']['content'])=={'text/csv'}
    for path,methods in paths.items():
        for operation in methods.values():
            assert len(operation.get('description',''))>=20,path
            assert operation.get('summary'),path


def test_documentacao_de_seguranca_preserva_401_e_login_por_cookie(app_cliente):
    from conftest import entrar
    assert app_cliente.get('/api/eu').status_code==401
    entrar(app_cliente)
    assert app_cliente.get('/api/eu').status_code==200
    assert app_cliente.post('/api/auth/sair').status_code==200
    assert app_cliente.get('/api/eu').status_code==401
