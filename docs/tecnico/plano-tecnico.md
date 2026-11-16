# ETAL Connect — plano técnico

Como tirar o app do protótipo e pôr no ar para o ETAL. Estado em novembro de 2026.

## O que já existe

- **App (`prototipo/`)**: HTML, CSS e JS sem framework; PWA instalável e com cache offline (`sw.js`). Mapa 3D, planta dos andares, programação, agenda, crachá, QR, avisos e painel da organização (`admin.html`). Hoje os dados são de exemplo (`data.js`) e o que a organização faz fica só no navegador (`localStorage`).
- **Backend (`backend/`)**: API em FastAPI com banco (SQLite para desenvolver, PostgreSQL em produção). Testes em `backend/tests` (11 cenários).
- **Implantação (`deploy/`)**: `docker compose` com Caddy (HTTPS automático, serve o app e encaminha a API), API e PostgreSQL.
- **CI (`.github/workflows/backend.yml`)**: roda os testes a cada push; implanta por SSH na `main` quando a variável `IMPLANTAR=sim` e os segredos estão configurados.

## Arquitetura

```
celular (PWA)  ──HTTPS──  Caddy ─┬─ /            → arquivos do app (prototipo/)
                                 └─ /api, /q     → API (FastAPI, 1 processo)
                                                     └─ PostgreSQL
SUAP ── OAuth2 (login) ──────────────────────────────┘
```

Tudo numa máquina do IFRN (a do NADIC é `zaira.ifrn.edu.br`), num subdomínio como `etal.nadic.ifrn.edu.br`.
Os dados de alunos (inclusive menores de idade) ficam dentro do IFRN.

## API (resumo)

| Rota | Quem | O que faz |
|---|---|---|
| `GET /api/programacao` | todos | atividades no formato do app + números de sala |
| `GET /api/avisos`, `GET /api/lotacao` | todos | avisos e presença nas atividades de agora |
| `GET /api/ao-vivo` | todos | SSE: `aviso`, `sala`, `numeros`, `lotacao` |
| `GET /api/auth/suap` → `/suap/retorno` | todos | entrada pelo SUAP (OAuth2) |
| `POST /api/auth/visitante` → `GET /api/auth/link` | visitantes | link de entrada por e-mail (30 min, uso único) |
| `POST /api/auth/dev` | só com `ETAL_LOGIN_DEV=1` | entrada sem senha, para testar |
| `GET /api/eu` | logado | perfil, agenda, presenças, credenciamento |
| `POST/DELETE /api/eu/agenda/{id}` | logado | salvar atividade (respeita vagas) |
| `POST /api/presenca` | logado | QR do evento credencia; QR de atividade registra presença (sem duplicar) |
| `POST /api/org/avisos` | organização | aviso (vai na hora para todos) |
| `PATCH /api/org/atividades/{id}/sala` | organização | troca de sala com aviso automático |
| `PUT /api/org/salas` | organização | numeração das salas |
| `POST /api/org/credenciar/{pessoa}` | organização | credenciamento manual |
| `GET /api/org/presencas.csv`, `/credenciados.csv` | organização | exportação para o SUAP (certificados) |
| `GET /api/org/qrs` | organização | página para imprimir os QRs (evento e um por atividade) |
| `GET /q/{token}` | todos | QR lido pela câmera do celular, fora do app: abre o app |
| `GET /api/publicacoes` | logado | feed, comentários, chat, curtidas e salvos; para a organização, também ocultos, denúncias e histórico |
| `POST /api/publicacoes`, `/{id}/comentarios`, `/mensagens` | credenciado | publicar (até 6 fotos), comentar, mandar mensagem |
| `POST /api/publicacoes/{id}/curtir`, `/salvar`, `/denunciar`; `DELETE /api/publicacoes/{id}` | credenciado (salvar e apagar: logado) | curtir, salvar, denunciar, apagar o que é seu |
| `GET /api/org/listas-papel?dia=` | organização | listas de presença em papel para imprimir (plano B) |
| `POST /api/org/presenca-manual` | organização | lança uma lista em papel: credencia e registra presença (`via = 'manual'`) |
| `GET /api/org/sistema` | organização | números do servidor nos últimos 10 minutos |
| `POST /api/publicacoes/moderar` | organização | ocultar, restaurar ou arquivar denúncia, com nota e histórico |

Documentação interativa: `/api/docs`.

### QR de presença

O QR leva um token assinado com o segredo do servidor (não dá para inventar um válido) e a URL `https://DOMINIO/q/<token>`.
O de uma atividade só é aceito de 20 minutos antes até o fim dela (`ETAL_JANELA_PRESENCA`, `ETAL_ANTECEDENCIA_MIN`).
Limite: uma presença por pessoa e atividade; leitura repetida não duplica.
Sem internet na hora da leitura, o app guarda só QR assinado do ETAL de uma atividade da programação (ou do
credenciamento) e envia depois com a hora da leitura (`lidoEm`). O servidor aceita se a leitura caiu dentro da janela da
atividade e se o envio chegou até `ETAL_TOLERANCIA_ENVIO_MIN` (60) minutos depois do fim; hora no futuro é recusada. A
hora do aparelho só restringe: o que não valeria com internet também não vale sem. Essas presenças ficam com
`via = 'qr-adiado'`.
Risco conhecido: foto do QR mandada para quem não está na sala. Mitigações possíveis, da mais simples à mais forte: janela de horário (já feita); QR projetado no telão que muda a cada minuto; conferência da lotação pela organização.

### Limites e fila do SUAP

| Onde | Limite |
|---|---|
| Senha do SUAP (`/api/auth/suap/senha`) | 6 senhas erradas por matrícula por minuto; 60 senhas erradas por endereço de rede (`ETAL_TETO_REDE_SENHA_ERRADA`); quem acerta só tem o teto geral |
| Link de visitante | 3 por e-mail a cada 10 minutos; teto de 300 por endereço de rede |
| Presença | 30 leituras por pessoa por minuto |
| Publicações | 10 posts a cada 10 min, 30 comentários ou mensagens a cada 5 min, 10 denúncias a cada 10 min, por pessoa |
| Rotas com teto geral | `ETAL_TETO_REDE` (3.000) por endereço de rede por minuto |
| Conversa com o SUAP | até `ETAL_SUAP_SIMULTANEOS` (16) ao mesmo tempo; quem espera mais de `ETAL_SUAP_ESPERA` (12 s) recebe 503 com `Retry-After`, e o app tenta de novo sozinho |

O limite é por pessoa porque no Wi-Fi do campus todos saem pelo mesmo endereço; os números saíram do teste de carga
([09-teste-de-carga.md](09-teste-de-carga.md)). Os contadores ficam na memória do processo (um processo só da API).

### Monitoramento e logs

- Uma linha JSON por requisição na saída da API (`docker compose logs -f api`): hora, método, rota como modelo
  (`/q/{token}`, sem o token), situação e tempo. Sem IP, sem query, sem dado da pessoa; o log de acesso do uvicorn fica
  desligado (gravava o endereço inteiro). Erro 5xx vai com o rastro. O Docker guarda 5 arquivos de 20 MB por serviço.
- Painel da organização → Servidor (`GET /api/org/sistema`, a cada 10 s): requisições por minuto, tempos (mediana,
  95%, 99%), erros, limites batendo, fila do SUAP, celulares no ao vivo, banco, entradas, presenças e publicações dos
  últimos 10 minutos, e as rotas mais lentas.
- `GET /api/saude` consulta o banco; o Docker usa para saber se a API está de pé (`HEALTHCHECK`).
- Capacidade de um processo: `ETAL_THREADS` (60) para as rotas comuns e `ETAL_BANCO_CONEXOES` + `ETAL_BANCO_EXTRAS`
  (30 + 20) conexões com o PostgreSQL.

### Publicações

Ficam nas tabelas `publicacoes` (publicação, comentário ou mensagem), `curtidas`, `salvos`, `denuncias` e `moderacao`;
as fotos, em disco como os materiais, regravadas em JPEG (sai o EXIF, com a localização). O app recebe o estado no
mesmo formato que usava no aparelho (`prototipo/community.js`), e as telas não mudaram. Quem publicou aparece por um
código (`p<id>`), nunca pela matrícula ou e-mail. Ao vivo: cada mudança sobe a versão e o SSE avisa só o número; o app
busca de novo se a versão mudou e a tela de publicações está aberta, com atraso aleatório de até 3 s. Três denúncias de
pessoas diferentes (`ETAL_DENUNCIAS_PARA_OCULTAR`) tiram o conteúdo do ar até a revisão. Limpeza depois do evento:
`python -m app.manutencao publicacoes` (apaga as com mais de `ETAL_PUBLICACOES_DIAS`, 90).

### Banco e arquivos

O banco muda por migrações (Alembic, em `backend/migracoes/`): a API aplica as que faltam ao iniciar; um banco antigo,
criado antes das migrações, é marcado na primeira e atualizado. Nova mudança no modelo:
`cd backend && .venv/bin/alembic revision --autogenerate -m "o que mudou"`. Os materiais das atividades ficam em disco
(`ETAL_ARQUIVOS`, volume `arquivos_dados` no Docker), não no banco; o app abre dentro dele ou baixa (`?baixar=true`).

## Rodar localmente

```sh
cd backend
python3 -m venv .venv && .venv/bin/pip install -r requirements-dev.txt
.venv/bin/python -m app.importar programacao seed/programacao.json
ETAL_LOGIN_DEV=1 .venv/bin/uvicorn app.main:app --port 8000      # API em http://127.0.0.1:8000/api/docs
.venv/bin/python -m pytest -q                                    # testes
```

A programação de exemplo sai do protótipo: `node scripts/app/exportar-programacao.mjs --ano 2025 --mes 11`.

## Pôr no ar

Passo a passo completo em [`deploy/README.md`](../../deploy/README.md). Resumo: o GitHub gera duas imagens a cada push
na `main` (`.github/workflows/publicar.yml`), o app (Caddy com o site montado) e a API, e publica no GitHub Container
Registry, como os outros sistemas do NADIC. O servidor só tem `docker-compose.yml` e `.env`; o proxy dele (nginx ou
Apache) encaminha o domínio para `127.0.0.1:8080`. Com os segredos de SSH configurados, o GitHub também atualiza o
servidor. Migrações do banco rodam sozinhas quando a API sobe. Backup: `deploy/backup.sh`.

## Fases

**1. MVP para o evento**

- Entrada pelo SUAP e de visitante.
- Programação vinda do servidor.
- Presença por QR.
- Avisos ao vivo.
- Painel da organização com login.
- Exportação para o SUAP.

O backend dessa fase está pronto e o app já está ligado a ele (ver abaixo). Falta a câmera de verdade no leitor de QR.

**2. Durante o evento**

- Lotação no mapa 3D.
- Troca de sala com aviso automático: a API já tem, falta o app mostrar.
- Notificação push pelo service worker.
- Câmera real lendo o QR (`BarcodeDetector`, com reserva em `jsQR`).

**3. Depois do evento**

- Certificados.
- Avaliação das atividades.
- Retrospectiva com dados reais.
- Estatísticas para a comissão.

## App ligado ao backend

`prototipo/config.js` diz onde está a API:

- `api: null`: só dados de exemplo, como no protótipo.
- `api: ''`: mesma origem. Em produção, o Caddy entrega esta versão.
- `api: 'http://127.0.0.1:8011'`: API local.

O cliente fica em `prototipo/api.js`. Com a API ligada:

- **Abertura:** `GET /api/programacao` troca a programação e a numeração das salas, `GET /api/avisos` traz os avisos e `GET /api/eu` traz o perfil, a agenda, as presenças e o credenciamento. Sem sessão, aparece o crachá de entrada.
- **Crachá:** “Entrar com o SUAP” vai para `/api/auth/suap`, e a senha fica no SUAP. O visitante recebe o link por e-mail; em desenvolvimento, sem SMTP, o link aparece na tela.
- **Agenda:** salvar e tirar gravam no servidor.
- **QR lido fora do app:** a câmera do celular abre `/q/<token>`, que redireciona para `/?qr=` e registra a presença ao abrir (depois da entrada, se for preciso).
- **Ao vivo:** `EventSource('/api/ao-vivo')` traz avisos, trocas de sala e numeração.
- **Painel (`admin.html`):** só a organização entra. Avisos, trocas de sala e numeração vão para a API e chegam a todos na hora.

Ainda de exemplo, mesmo com a API ligada:

- a lista de participantes do painel;
- os gráficos de credenciamento por hora;
- a leitura do QR **dentro** do app, que hoje é simulada.

Para desenvolver com a API:

```sh
cd backend && ETAL_LOGIN_DEV=1 ETAL_JANELA_PRESENCA=0 ETAL_URL_PUBLICA=http://127.0.0.1:8770 ETAL_ORIGENS=http://127.0.0.1:8770 .venv/bin/uvicorn app.main:app --port 8011
# em prototipo/config.js: window.ETAL_CONFIG = { api: 'http://127.0.0.1:8011' };
sh prototipo/rodar.sh   # http://127.0.0.1:8770
```

## Perguntas em aberto

Estas respostas definem o que muda no plano.

- **Data do ETAL 2026.**
- **Acesso à máquina do NADIC:**
  - SSH e Docker;
  - se ela é acessível pela internet (hoje recusa conexão de fora);
  - o subdomínio.
- **OAuth2 do SUAP:** quem registra o app e quais dados o `/api/eu/` devolve.
- **Inscrições e certificados:** se o SUAP Eventos exporta inscritos e importa presença.
- **Dados pessoais:** LGPD para menores de idade e quem responde pelos dados.
- **Manutenção:** quem mantém o app depois.
- **Outros eventos:** se o app deve servir também para outros eventos do campus.
