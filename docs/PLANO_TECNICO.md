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

Documentação interativa: `/api/docs`.

### QR de presença

O QR leva um token assinado com o segredo do servidor (não dá para inventar um válido) e a URL `https://DOMINIO/q/<token>`.
O de uma atividade só é aceito de 20 minutos antes até o fim dela (`ETAL_JANELA_PRESENCA`, `ETAL_ANTECEDENCIA_MIN`).
Limite: uma presença por pessoa e atividade; leitura repetida não duplica.
Risco conhecido: foto do QR mandada para quem não está na sala. Mitigações possíveis, da mais simples à mais forte: janela de horário (já feita); QR projetado no telão que muda a cada minuto; conferência da lotação pela organização.

## Rodar localmente

```sh
cd backend
python3 -m venv .venv && .venv/bin/pip install -r requirements-dev.txt
.venv/bin/python -m app.importar programacao seed/programacao.json
ETAL_LOGIN_DEV=1 .venv/bin/uvicorn app.main:app --port 8000      # API em http://127.0.0.1:8000/api/docs
.venv/bin/python -m pytest -q                                    # testes
```

A programação de exemplo sai do protótipo: `node scripts/exportar-programacao.mjs --ano 2025 --mes 11`.

## Pôr no ar

1. Na máquina do IFRN: Docker e Docker Compose instalados; portas 80 e 443 abertas para a internet.
2. DNS: `etal.nadic.ifrn.edu.br` apontando para a máquina (pedido à TI do IFRN).
3. `git clone` do repositório; `cd deploy && cp .env.example .env` e preencher (segredo, senha do banco, SUAP, organização, e-mail).
4. `docker compose up -d --build`. O Caddy pede o certificado HTTPS sozinho.
5. Importar a programação: `docker compose exec api python -m app.importar programacao seed/programacao.json`.
6. Importar inscritos do SUAP (opcional): `docker compose exec api python -m app.importar inscritos /caminho/inscritos.csv`.
7. Imprimir os QRs: `https://DOMINIO/api/org/qrs` (logado como organização).
8. Implantação automática: no GitHub, segredos `SSH_HOST`, `SSH_USUARIO`, `SSH_CHAVE`, `PASTA` e variável `IMPLANTAR=sim`.

Backup: `docker compose exec db pg_dump -U etal etal > backup.sql` (agendar no cron da máquina durante o evento).

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
cd backend && ETAL_LOGIN_DEV=1 ETAL_JANELA_PRESENCA=0 ETAL_ORIGENS=http://127.0.0.1:8770 .venv/bin/uvicorn app.main:app --port 8011
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
