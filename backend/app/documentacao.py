"""Textos e exemplos do Swagger. Não altera as regras de autenticação ou de negócio."""
from fastapi.routing import APIRoute
from fastapi.responses import RedirectResponse, Response, StreamingResponse

TAGS = [
    {'name': 'entrada', 'description': 'Autenticação e controle de sessão.'},
    {'name': 'participante', 'description': 'Perfil, agenda e presença do usuário autenticado.'},
    {'name': 'SUAP do participante', 'description': 'Consulta de eventos e certificados do SUAP.'},
    {'name': 'público', 'description': 'Programação e avisos do evento.'},
    {'name': 'publicações', 'description': 'Feed, comentários, chat geral, denúncias e moderação.'},
    {'name': 'organização', 'description': 'Gestão do evento, salas, participantes e relatórios.'},
    {'name': 'homologação', 'description': 'Rotas auxiliares de desenvolvimento e homologação.'},
]


def introducao():
    return None


def erro(texto, exemplo=None):
    return {'description': texto, 'content': {'application/json': {'example': {'detail': exemplo or texto}}}}


# Caminho → método, título, instruções objetivas por endpoint.
OPERACOES = {
'/api/auth/suap': ('get', 'Abrir o login oficial do SUAP (OAuth2)', '''Inicia o fluxo OAuth2 oficial do SUAP via redirecionamento (302).

Abra o link diretamente no navegador: [/api/auth/suap](/api/auth/suap). (O botão "Execute" do Swagger faz requisição AJAX e não segue redirecionamento externo).

Para testar login com matrícula e senha diretamente no Swagger, use **POST /api/auth/suap/senha**.'''),
'/api/auth/suap/retorno': ('get', 'Receber o retorno automático do OAuth2', '''Callback chamado automaticamente pelo SUAP após autorização. Valida o código recebido e grava o cookie de sessão `etal_sessao`.'''),
'/api/auth/suap/senha': ('post', 'Entrar com matrícula e senha do SUAP', '''Autentica com matrícula e senha do SUAP e grava o cookie HttpOnly `etal_sessao`.

As rotas protegidas (como `/api/eu`) usam o cookie automaticamente sem necessidade de copiar token. Limite: 8 tentativas/min por IP.'''),
'/api/auth/visitante': ('post', 'Solicitar um link de acesso para visitante', '''Envia um link de acesso de uso único para o e-mail informado (válido por 30 minutos). Requer SMTP configurado.'''),
'/api/auth/link': ('get', 'Entrar pelo link recebido por e-mail', '''Valida o token de acesso temporário recebido por e-mail, cria a sessão e redireciona ao app.'''),
'/api/auth/dev': ('post', 'Entrar sem SUAP — somente em ambiente de teste', '''Cria sessão de teste local. Ativo somente com `ETAL_LOGIN_DEV=1`; caso contrário, retorna 404.'''),
'/api/auth/sair': ('post', 'Sair e remover os cookies de acesso', '''Encerra a sessão e remove os cookies `etal_sessao` e `etal_suap_portal` deste navegador.'''),
'/api/eu': ('get', 'Ver meu perfil, agenda e presenças', '''Retorna os dados do usuário autenticado: perfil (`person`), IDs salvos na agenda (`saved`) e presenças registradas (`present`). Exige sessão ativa.'''),
'/api/eu/agenda/{atividade_id}': ('post', 'Salvar uma atividade na minha agenda', '''Salva a atividade informada na agenda pessoal local do usuário.'''),
'/api/presenca': ('post', 'Registrar credenciamento ou presença com um QR válido', '''Registra credenciamento ou presença a partir do token assinado do QR escaneado.'''),
'/api/eu/suap': ('get', 'Consultar meus eventos e certificados no SUAP', '''Consulta eventos e certificados do usuário no portal do SUAP via sessão temporária obtida no login.'''),
'/api/eu/suap/certificados/{cert_id}': ('get', 'Baixar um certificado PDF disponibilizado pelo SUAP', '''Retorna o arquivo PDF do certificado correspondente do SUAP (requer sessão ativa do portal).'''),
'/api/saude': ('get', 'Conferir se a API e o banco respondem', 'Verifica se a API e a conexão com o banco de dados estão operacionais. Retorna `{"ok": true}`.'),
'/api/programacao': ('get', 'Listar as atividades e a numeração das salas', 'Retorna as atividades da programação oficial e a numeração/mapeamento das salas.'),
'/api/avisos': ('get', 'Ler os avisos mais recentes do evento', 'Retorna a lista de avisos recentes publicados pela organização.'),
'/api/lotacao': ('get', 'Ver presenças nas atividades em andamento', 'Retorna a quantidade de presenças registradas em cada atividade.'),
'/api/ao-vivo': ('get', 'Acompanhar avisos e mudanças por eventos SSE', 'Canal Server-Sent Events (SSE) para receber avisos, mudanças de salas e lotação em tempo real.'),
'/api/cenario-demo': ('get', 'Consultar o cenário preparado para apresentação', 'Retorna dados do cenário de teste quando `ETAL_DEMO=1` estiver ativo.'),
'/api/org/avisos': ('post', 'Publicar um aviso da organização', 'Publica um aviso para os participantes e notifica o canal ao vivo. Exige papel de organização.'),
'/api/org/atividades/{atividade_id}/arquivos': ('post', 'Anexar um arquivo aos materiais da atividade', 'Envie o arquivo no corpo da requisição, com o Content-Type do arquivo (PDF, imagem, ZIP, PPT/PPTX ou texto, até 15 MB), e o nome em ?nome=. Ele entra na lista de materiais e os apps abertos recebem a atividade atualizada. Exige papel de organização.'),
'/api/arquivos/{arquivo_id}': ('get', 'Abrir um material enviado', 'Devolve o arquivo para ver no app (inline) ou baixar (?baixar=true). Abre para a organização e para quem registrou presença na atividade.'),
'/api/org/qrs/lista': ('get', 'Listar os QRs assinados de todas as atividades', 'Devolve o token assinado do credenciamento e de cada atividade, para a equipe mostrar o QR no celular quando o impresso rasga ou não lê. Exige papel de organização; não depende do modo demo.'),
'/api/org/atividades': ('post', 'Cadastrar uma atividade na programação', 'Cria uma atividade (palestra, minicurso, oficina etc.) com horário, sala, quem conduz, vagas e materiais. O identificador sai do título. Os apps abertos recebem a nova atividade pelo canal ao vivo. Exige papel de organização.'),
'/api/org/atividades/{atividade_id}': ('patch', 'Editar uma atividade e seus materiais', 'Altera só os campos enviados: título, tipo, dia, horário, sala, quem conduz, descrição, o que levar, vagas e a lista de materiais (PDF, link ou ZIP). Os apps abertos recebem a atividade atualizada pelo canal ao vivo. Exige papel de organização.'),
'/api/org/atividades/{atividade_id}/sala': ('patch', 'Trocar a sala de uma atividade', 'Atualiza a sala e zona de uma atividade na programação. Exige papel de organização.'),
'/api/org/salas': ('put', 'Alterar a numeração visível das salas', 'Personaliza a numeração visível das salas no mapa. Exige papel de organização.'),
'/api/org/participantes': ('get', 'Listar os participantes cadastrados no ETAL', 'Lista os participantes cadastrados e a situação de credenciamento. Exige papel de organização.'),
'/api/org/credenciar/{pessoa_id}': ('post', 'Credenciar manualmente um participante', 'Credencia manualmente um participante pelo ID interno. Exige papel de organização.'),
'/api/org/resumo': ('get', 'Consultar os totais para o painel da organização', 'Retorna estatísticas gerais do evento (participantes, credenciados e presenças). Exige papel de organização.'),
'/api/org/presencas.csv': ('get', 'Exportar as presenças em CSV', 'Gera download em CSV dos registros de presença. Exige papel de organização.'),
'/api/org/credenciados.csv': ('get', 'Exportar os credenciados em CSV', 'Gera download em CSV dos participantes credenciados. Exige papel de organização.'),
'/api/org/qrs': ('get', 'Abrir a folha de QRs assinados para impressão', 'Página HTML com QR codes assinados para impressão. Exige papel de organização.'),
'/api/org/debug/qrs': ('get', 'Listar os QRs usados no debug do aplicativo', 'Lista os QRs de teste para o menu de debug local. Exige papel de organização e `ETAL_DEMO=1`.'),
'/api/homologacao/qrs': ('get', 'Obter QRs de teste — somente em homologação', 'Retorna QRs de teste. Ativo somente com `ETAL_LOGIN_DEV=1`.'),
}


def aplicar(app):
    """Aplica títulos, instruções e respostas documentadas às rotas registradas."""
    for route in app.routes:
        if not isinstance(route, APIRoute) or not route.include_in_schema:
            continue
        item = OPERACOES.get(route.path)
        if route.path == '/api/eu/agenda/{atividade_id}' and 'DELETE' in route.methods:
            route.summary = 'Remover uma atividade da minha agenda'
            route.description = 'Remove a atividade da agenda pessoal local do usuário.'
        elif item:
            _, route.summary, route.description = item
        responses = route.responses
        if route.path.startswith('/api/org/'):
            responses.setdefault(401, erro('Sessão ausente ou inválida.', 'Entre para continuar.'))
            responses.setdefault(403, erro('A conta conectada não faz parte da organização.', 'Só a organização do evento.'))
        elif route.path.startswith('/api/eu') or route.path == '/api/presenca':
            responses.setdefault(401, erro('Sessão ausente ou inválida.', 'Entre para continuar.'))
        if route.path in ['/api/auth/suap', '/api/auth/suap/retorno', '/api/auth/link']:
            route.status_code = 302
            route.response_class = RedirectResponse
            responses[302] = {'description': 'Redirecionamento do navegador.', 'headers': {'Location': {'description': 'Destino do redirecionamento.', 'schema': {'type': 'string'}}}}
        elif route.path == '/api/eu/suap/certificados/{cert_id}':
            route.response_class = Response
            responses[200] = {'description': 'PDF disponibilizado pelo SUAP ao titular.', 'content': {'application/pdf': {'schema': {'type': 'string', 'format': 'binary'}}}}
            responses[409] = erro('Sessão do portal expirada ou certificado indisponível.')
            responses[502] = erro('Falha ao obter o arquivo no SUAP.')
        elif route.path.endswith('.csv'):
            route.response_class = Response
            responses[200] = {'description': 'Arquivo CSV para download.', 'content': {'text/csv': {'schema': {'type': 'string'}}}}
        elif route.path == '/api/ao-vivo':
            route.response_class = StreamingResponse
            responses[200] = {'description': 'Fluxo contínuo de eventos SSE.', 'content': {'text/event-stream': {'schema': {'type': 'string'}}}}
        if route.path == '/api/auth/suap/senha':
            responses.update({200: {'description': 'Login realizado; sessão gravada em cookie.', 'headers': {'Set-Cookie': {'description': 'etal_sessao (HttpOnly).', 'schema': {'type': 'string'}}}, 'content': {'application/json': {'example': {'ok': True}}}}, 401: erro('Matrícula ou senha incorreta.'), 429: erro('Limite de 8 tentativas por minuto atingido.'), 502: erro('O SUAP não informou a matrícula.'), 503: erro('O SUAP não respondeu. Tente de novo em instantes.')})
        if route.path == '/api/eu':
            responses[200] = {'description': 'Perfil e dados locais do titular da sessão.', 'content': {'application/json': {'example': {'person': {'id': 1, 'name': 'Pessoa Exemplo', 'matricula': 'SUA_MATRICULA', 'source': 'suap', 'org': False, 'credentialedAt': None}, 'saved': ['oficina-exemplo'], 'present': {}}}}}
        if route.path == '/api/eu/suap':
            responses[200] = {'description': 'Situação da consulta temporária do portal.', 'content': {'application/json': {'example': {'connected': False, 'events': [], 'certificates': [], 'message': 'Entre novamente com matrícula e senha para consultar.'}}}}
        if route.path == '/api/auth/sair':
            responses[200] = {'description': 'Cookies removidos deste navegador.', 'content': {'application/json': {'example': {'ok': True}}}}
        if route.path == '/api/auth/dev':
            responses[404] = erro('Login de teste desabilitado neste servidor.', 'Not Found')
            responses[403] = erro('Código de homologação errado.')
        if route.path == '/api/auth/visitante':
            responses[503] = erro('Envio de e-mail não configurado.')
            responses[429] = erro('Limite de solicitações atingido.')
        if route.path in ['/api/cenario-demo', '/api/org/debug/qrs', '/api/homologacao/qrs']:
            responses[404] = erro('Recurso indisponível neste modo ou cenário não preparado.', 'Not Found')
        if route.path.startswith('/api/eu/agenda/'):
            responses[404] = erro('Atividade não encontrada.')
            if 'POST' in route.methods:
                responses[409] = erro('Vagas esgotadas.')
        if route.path == '/api/presenca':
            responses[400] = erro('QR inválido ou assinatura não reconhecida.')
            responses[404] = erro('Atividade não encontrada.')
            responses[409] = erro('O QR está fora da janela de horário permitida.')
            responses[429] = erro('Limite de leituras atingido.')
        if route.path == '/api/saude':
            responses[200] = {'description': 'API e conexão com o banco disponíveis.', 'content': {'application/json': {'example': {'ok': True}}}}
    if hasattr(app, 'openapi_schema'):
        app.openapi_schema = None
