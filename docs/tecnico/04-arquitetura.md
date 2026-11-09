# 4. Arquitetura

## 4.1 Visão de componentes

```mermaid
flowchart LR
    subgraph celular[Celular do participante]
        PWA[PWA<br/>prototipo/<br/>HTML + JS + Canvas]
        SW[Service worker<br/>sw.js<br/>cache offline]
        CAM[Câmera<br/>BarcodeDetector ou jsQR]
        PWA --- SW
        PWA --- CAM
    end

    subgraph org[Computador da organização]
        ADM[Painel<br/>admin.html]
    end

    subgraph ifrn[Máquina do IFRN - Docker Compose]
        CADDY[Caddy<br/>HTTPS, arquivos do app,<br/>proxy /api e /q]
        API[API FastAPI<br/>1 processo]
        SSE[Canal ao vivo<br/>SSE /api/ao-vivo]
        DB[(PostgreSQL 16)]
        CADDY -->|/api/*, /q/*| API
        API --- SSE
        API --> DB
    end

    SUAP[SUAP<br/>OAuth2]
    SMTP[Servidor de e-mail<br/>SMTP]

    PWA -->|HTTPS| CADDY
    ADM -->|HTTPS| CADDY
    SSE -.->|avisos, salas, lotação| PWA
    SSE -.-> ADM
    API -->|token e /api/eu/| SUAP
    PWA -->|redireciona o login| SUAP
    API -->|link do visitante| SMTP
```

| Componente | Papel |
|---|---|
| PWA (`prototipo/`) | Telas, mapa, agenda, leitor de QR, lembretes. Fala com a API por `api.js`. Sem framework. Leitor de QR com `BarcodeDetector` ou `jsQR`. |
| Service worker (`sw.js`) | Guarda o app para uso sem internet. Não guarda `/api/` nem `/q/`. Mostra notificações locais. |
| Painel (`admin.html`) | Versão para computador. Só a organização acessa quando a API está ligada. |
| Caddy | HTTPS automático, entrega os arquivos do app, encaminha `/api/*` e `/q/*` para a API e responde `/config.js` com `api: ''`. |
| API FastAPI (`backend/app`) | Regras de negócio, sessão, QR assinado, painel `/api/org`. Um processo só. |
| Canal ao vivo | Fila em memória por ouvinte, entregue como SSE. Eventos `aviso`, `sala`, `numeros`, `lotacao`. |
| Banco | PostgreSQL em produção, SQLite em desenvolvimento. |
| SUAP | Autentica a pessoa (OAuth2) e entrega nome, matrícula, e-mail, campus e foto. |

## 4.2 Estrutura de pastas

| Pasta | Conteúdo |
|---|---|
| `prototipo/` | O app. `index.html` (também servido em `/demo`), `homologacao.html` e `homologacao.js` (página `/homologacao`), `vendor/jsQR.js` (leitor de QR sem `BarcodeDetector`, carregado sob demanda), `app.js` (telas e lógica), `app.css`, `api.js` (cliente), `config.js` (modo), `data.js` (programação de exemplo), `campus3d.js` (motor do mapa em Canvas), `plan-data.js`, `campus-*.js`, `sprites.js` (dados do mapa), `admin.html`/`admin.js`/`admin.css` (painel), `sw.js`, `manifest.webmanifest`, `server.py` e `rodar.sh` (servidor local e login de simulação com a suapy). |
| `backend/app/` | API: `main.py` (aplicação e `/q/{token}`), `config.py`, `db.py`, `modelos.py`, `seguranca.py` (cookie e QR), `limite.py`, `ao_vivo.py` (SSE), `formatos.py` (formato de resposta igual ao do app), `importar.py` (CLI) e `rotas/` (`auth.py`, `eu.py`, `publico.py`, `org.py`). |
| `backend/tests/` | Testes de API com pytest. |
| `backend/seed/` | `programacao.json`, programação de exemplo. |
| `api/`, `vercel.json`, `requirements.txt` (raiz), `scripts/vercel-build.sh` | Versão de teste na Vercel. |
| `deploy/` | `docker-compose.yml`, `Caddyfile`, `.env.example`. |
| `.github/workflows/` | `backend.yml`: testes e implantação por SSH. |
| `scripts/` | Geradores: planta (`build-principal-plan.py` e `check-principal-plan.py`), cache offline (`build-pwa.py`), exportação do arquivo único (`export-prototipo.py`), programação de exemplo (`exportar-programacao.mjs`). |
| `docs/` | Plano técnico, páginas de contexto e esta documentação (`docs/tecnico/`). |
| `referencias/`, `maps/`, `modelo-3d/` | Levantamento do campus, plantas e cópia congelada do mapa (não editar). |
| `app/`, `components/`, `db/`, `worker/` | Primeira versão em React (Vinext). Legado; o produto é `prototipo/`. |

## 4.3 Modos do app (`prototipo/config.js`)

| `api` | Modo | Comportamento |
|---|---|---|
| `null` (padrão) | Demonstração | `window.ETAL_API` fica nulo. Dados de exemplo, entrada simulada, leitura de QR simulada. O que a organização faz fica no `localStorage` (`etal-org`). |
| `''` | Mesma origem (produção) | O app fala com `/api/...` do mesmo domínio. O Caddy entrega `config.js` com este valor. Na Vercel, o `config.js` traz também `vivo: 'consulta'` (avisos por consulta a cada 12 s, em vez de SSE). |
| `'http://127.0.0.1:8011'` | API local | Para desenvolver. A API precisa liberar a origem do app em `ETAL_ORIGENS`. |

Com a API ligada, o `apiStart()` do app lê a programação, os avisos e o perfil (`/api/eu`), abre o canal ao vivo e, sem sessão, mostra o crachá de entrada. O cliente usa `credentials: 'include'` para enviar o cookie.

## 4.4 Login com o SUAP

```mermaid
sequenceDiagram
    autonumber
    actor P as Participante
    participant A as App (PWA)
    participant API as API FastAPI
    participant S as SUAP
    participant DB as Banco

    P->>A: Entrar com o SUAP
    A->>API: GET /api/auth/suap
    API->>API: gera state e guarda em cookie (10 min)
    API-->>P: 302 para suap.ifrn.edu.br/o/authorize
    P->>S: matrícula e senha (só no SUAP)
    S-->>P: 302 para /api/auth/suap/retorno?code&state
    P->>API: GET /api/auth/suap/retorno
    API->>API: confere state com o cookie
    API->>S: POST /o/token/ (code, client_id, client_secret)
    S-->>API: access_token
    API->>S: GET /api/eu/ (Bearer)
    S-->>API: matrícula, nome, e-mail, campus, foto
    API->>DB: cria ou atualiza a Pessoa pela matrícula
    API-->>P: 302 para /?login=ok + cookie de sessão assinado
    P->>A: app abre
    A->>API: GET /api/eu
    API-->>A: perfil, agenda e presenças
```

## 4.5 Presença por QR

```mermaid
sequenceDiagram
    autonumber
    actor P as Participante
    participant C as Câmera
    participant A as App (PWA)
    participant API as API FastAPI
    participant DB as Banco
    participant L as Canal ao vivo (SSE)

    alt Câmera do app
        P->>A: toca em Ler QR
        A->>C: abre a câmera traseira
        C-->>A: texto do QR (.../q/token)
    else Câmera do celular
        P->>C: aponta para o QR
        C->>API: GET /q/token
        API-->>A: 302 para /?qr=token
        A->>A: guarda o token e pede entrada se preciso
    end
    A->>API: POST /api/presenca {qr}
    API->>API: confere o limite de 20 por minuto
    API->>API: valida a assinatura do token
    API->>DB: busca a atividade
    API->>API: confere a janela (início - 20 min até o fim)
    alt fora da janela
        API-->>A: 409 e não grava nada
    else dentro da janela
        API->>DB: grava credenciado_em se vazio
        API->>DB: grava Presenca se ainda não existe
        API->>L: publica lotacao (atividade, total)
        API-->>A: credentialed, activity, alreadyPresent, time
        A-->>P: Presença registrada
    end
```

## 4.6 Implantação

### Produção: máquina do IFRN

```mermaid
flowchart TB
    Internet((Internet)) -->|80, 443| caddy
    subgraph compose[docker compose em deploy/]
        caddy[caddy:2-alpine]
        api[api<br/>backend/Dockerfile<br/>uvicorn, 1 worker]
        db[(postgres:16-alpine<br/>volume pg_dados)]
        caddy -->|api:8000| api
        api --> db
    end
    arq[../prototipo montado em /srv/app, somente leitura] --> caddy
```

- Domínio previsto: `etal.nadic.ifrn.edu.br` (a configurar com a TI do IFRN). O Caddy pede o certificado sozinho.
- Configuração em `deploy/.env` (modelo em `.env.example`): `DOMINIO`, `POSTGRES_PASSWORD`, `ETAL_SEGREDO`, `ETAL_SUAP_CLIENT_ID`, `ETAL_SUAP_CLIENT_SECRET`, `ETAL_ORGANIZACAO`, `ETAL_SMTP_*`, `ETAL_JANELA_PRESENCA`, `ETAL_ANTECEDENCIA_MIN`.
- O compose define `ETAL_BANCO`, `ETAL_URL_PUBLICA` (com o domínio), `ETAL_ORIGENS` e `ETAL_COOKIE_SEGURO=true`.
- A imagem da API roda com usuário sem privilégios (uid 10001) e **um worker só**, porque o canal SSE vive na memória do processo.
- Subir: `cd deploy && docker compose up -d --build`. Importar a programação: `docker compose exec api python -m app.importar programacao seed/programacao.json`.
- Implantação automática (`.github/workflows/backend.yml`): na `main`, depois dos testes, se a variável `IMPLANTAR=sim` e os segredos `SSH_HOST`, `SSH_USUARIO`, `SSH_CHAVE` e `PASTA` existirem, o GitHub entra por SSH, faz `git pull --ff-only`, `docker compose up -d --build` e chama `/api/saude`.
- Pendências: acesso à máquina do NADIC (hoje recusa conexão de fora), subdomínio e registro do app no SUAP.

### Versão de teste: Vercel

Endereço: `https://etal-connect.vercel.app`. Serve para homologar sem depender da máquina do IFRN. O repositório no GitHub é privado.

```mermaid
flowchart LR
    GH[GitHub<br/>push] -->|main| VP[Vercel - produção]
    GH -->|develop e demais branches| VV[Vercel - prévia]
    VP --> F[Site estático<br/>publico/ gerado de prototipo/]
    VP --> FN[Função Python<br/>api/index.py<br/>FastAPI de backend/app]
    FN --> N[(PostgreSQL Neon)]
    VV --> F
    VV --> FN
```

| Arquivo | Papel |
|---|---|
| `vercel.json` | Roda `scripts/vercel-build.sh`, publica `publico/`, inclui `backend/{app,seed}` na função (limite de 30 s) e define as reescritas: `/api/*` e `/q/*` para a função, `/demo` para `/index.html` e `/homologacao` para `/homologacao.html`. Cabeçalhos: `no-cache` em `sw.js` e `config.js`, `nosniff` e política de referência. |
| `scripts/vercel-build.sh` | Copia o app (`*.html`, `*.js`, `*.css`, manifest, `assets/` e `vendor/`) para `publico/` e gera o `config.js` com `{ api: '', vivo: 'consulta' }`. |
| `api/index.py` | Importa `backend/app` (cria as tabelas e, com `ETAL_SEMEAR=1`, importa a programação de exemplo). |
| `requirements.txt` (raiz) | Dependências da função. |

- O banco é PostgreSQL no Neon, pela integração da Vercel (`DATABASE_URL`).
- Deploy automático a cada push no GitHub: `main` publica a produção e as demais branches (como `develop`) geram prévias.
- **Avisos ao vivo:** o SSE em memória não funciona em funções. Com `vivo: 'consulta'`, o `api.js` consulta `/api/avisos` e `/api/programacao` a cada 12 segundos.
- `ETAL_URL_PUBLICA` fica vazia: a API usa o endereço do pedido (`x-forwarded-host` e `x-forwarded-proto`).
- Usar só dados fictícios (RNF16). A entrada de teste (`ETAL_LOGIN_DEV=1`) e `/homologacao` ficam ligadas nesta versão.

## 4.7 Fluxo de trabalho no Git (git flow)

```mermaid
gitGraph
    commit id: "v0.1.0" tag: "v0.1.0"
    branch develop
    checkout develop
    commit id: "base"
    branch "feature/qr-camera"
    checkout "feature/qr-camera"
    commit id: "camera"
    commit id: "testes"
    checkout develop
    merge "feature/qr-camera"
    branch "release/0.2.0"
    checkout "release/0.2.0"
    commit id: "ajustes"
    checkout main
    merge "release/0.2.0" tag: "v0.2.0"
    checkout develop
    merge "release/0.2.0"
    checkout main
    branch "hotfix/link-visitante"
    commit id: "correção"
    checkout main
    merge "hotfix/link-visitante" tag: "v0.2.1"
    checkout develop
    merge "hotfix/link-visitante"
```

| Branch | Para quê | Nasce de | Volta para |
|---|---|---|---|
| `main` | Código em produção. Cada versão recebe uma tag `vX.Y.Z`. Dispara a implantação. | — | — |
| `develop` | Integração do próximo lançamento. Gera a prévia. | `main` | — |
| `feature/*` | Uma funcionalidade ou correção não urgente. | `develop` | `develop` |
| `release/*` | Preparo de uma versão: ajustes finais, versão do cache (`npm run pwa`), testes de homologação. | `develop` | `main` e `develop` |
| `hotfix/*` | Correção urgente em produção. | `main` | `main` e `develop` |

Regras:

- Tags seguem versionamento semântico: `vX.Y.Z` (X: mudança incompatível; Y: funcionalidade nova; Z: correção).
- O CI (`backend.yml`) roda os testes em todo push que mexe em `backend/`, `deploy/` ou `prototipo/` e em pull request com mudanças em `backend/`.
- A implantação por SSH só roda na `main`.
- Depois de mudar arquivos do app, rodar `npm run pwa` para renovar a versão do cache offline.
- Neste repositório já existem as branches `main` e `develop` e as tags `v0.1.0` e `v0.2.0`.
