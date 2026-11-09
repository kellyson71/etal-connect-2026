# 05 · API FastAPI e Swagger

Aplicação em backend/app/main.py. Documentação interativa em /api/docs; contrato em /api/openapi.json. As capturas da apresentação foram feitas na execução local, com SQLite temporário e dados de exemplo.

## Grupos e permissões

| Grupo | Rotas principais | Acesso |
|---|---|---|
| Público | /api/saude, /programacao, /avisos, /lotacao, /ao-vivo | Sem sessão |
| Entrada | /api/auth/suap, /suap/retorno, /suap/senha, /visitante, /link, /sair | Sem sessão prévia |
| Participante | /api/eu, /api/eu/agenda/{id}, /api/presenca | Sessão válida |
| Organização | /api/org/avisos, /atividades/{id}/sala, /salas, /participantes, /credenciar/{id}, /resumo, CSV e QRs | Papel organizacao |
| Homologação | /api/auth/dev e /api/homologacao/qrs | Só com ETAL_LOGIN_DEV ligado; código opcional configurado |

A lista exata de métodos e caminhos está na tabela gerada do OpenAPI, nas referências da apresentação. GET /q/{token} é um redirecionamento para o app e fica fora do esquema.

## Contratos mais usados

| Ação | Chamada | Resultado |
|---|---|---|
| Verificar API e banco | GET /api/saude | ok: true |
| Carregar programação | GET /api/programacao | sessions e rooms |
| Recuperar sessão | GET /api/eu | person, saved e present |
| Salvar atividade | POST /api/eu/agenda/{atividade_id} | ok; idempotente |
| Remover atividade | DELETE /api/eu/agenda/{atividade_id} | ok; idempotente |
| Registrar leitura | POST /api/presenca com qr | credentialed, newCredential, activity, alreadyPresent e time |
| Publicar aviso | POST /api/org/avisos | Aviso criado, HTTP 201 |
| Trocar sala | PATCH /api/org/atividades/{atividade_id}/sala | Atividade atualizada; aviso por padrão |
| Numerar ambientes | PUT /api/org/salas | Mapa completo de andar:zona para número |
| Entrar com matrícula e senha do SUAP | POST /api/auth/suap/senha com {matricula, senha} | {ok: true} e cookie de sessão; 401 "Matrícula ou senha incorreta."; 503 se o SUAP não responder; 502 se não vier matrícula; 429 acima de 8 por minuto |

As respostas seguem o formato do app, com campos como title, time e room. A validação dos corpos usa Pydantic. Os esquemas de resposta só aparecem onde declarados pela implementação; o Swagger não deve ser interpretado como um modelo de resposta mais detalhado do que o código fornece.

## Sessão e identidade

Cookie etal_sessao assinado, HttpOnly, SameSite=Lax, com duração de 30 dias. Secure depende da configuração do ambiente. A lista ETAL_ORGANIZACAO define os papéis ao identificar pessoas.

OAuth2 usa state e redirecionamento ao SUAP: a senha é digitada lá. Se /api/eu/ do SUAP responder 404, o retorno OAuth2 tenta /api/rh/eu/. A rota separada POST /api/auth/suap/senha (limite de 8 por minuto) recebe matrícula e senha, pede o token JWT em {ETAL_SUAP_API_URL}/api/token/pair, lê /api/rh/eu/ com Bearer, cria ou atualiza a pessoa e abre a sessão; senha e tokens não são persistidos. Os dois caminhos usam a função _pessoa_suap, e foto relativa do SUAP vira URL completa. O servidor local SuaPy é outro caminho, em prototipo/server.py. Não confundir essas três implementações.

Visitantes recebem link válido por 30 minutos e de uso único; o banco guarda SHA-256 do token. Envio real depende de SMTP. O modo de teste pode devolver um link na resposta quando SMTP não está configurado.

## Presença

```json
{
  "qr": "URL ou token assinado de homologação"
}
```

A API confere assinatura, sessão, atividade e janela. QR do evento só credencia. QR da atividade também registra presença. O par pessoa / atividade não pode se repetir. Não exige atividade salva na agenda e não registra frequência automaticamente no SUAP.

| Código | Significado principal |
|---|---|
| 400 | QR inválido |
| 401 | Falta sessão ou credenciais incorretas |
| 403 | Falta papel de organização ou código de teste incorreto |
| 404 | Recurso inexistente; modo de teste desativado |
| 409 | Vagas esgotadas ou QR fora da janela |
| 422 | Corpo não atende ao esquema |
| 429 | Limite de tentativas atingido |
| 503 | Serviço externo indisponível ou e-mail sem configuração |

Erros normalmente usam detail. As permissões das rotas não implicam que o Swagger ofereça um botão de autorização completo para a sessão por cookie.

## Atualizações ao vivo

SSE em /api/ao-vivo envia aviso, sala, numeros e lotacao. O canal é mantido na memória do processo. Na configuração Vercel, o cliente consulta avisos e programação a cada 12 segundos. Notificação push de servidor não está implementada.

## Configuração e importação

As variáveis ETAL_* estão em backend/app/config.py e deploy/.env.example: banco, segredo, origens, cookies, SUAP, SMTP, organização e janela de presença. Não incluir valores reais na documentação.

```sh
python -m app.importar programacao seed/programacao.json
python -m app.importar inscritos inscritos.csv
```

Importação de programação atualiza pelo id. Importação de inscritos cria pessoas novas por matrícula ou e-mail. Não substitui uma integração institucional de presença ou certificado.
