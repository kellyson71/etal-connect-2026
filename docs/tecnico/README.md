# ETAL Connect — documentação técnica

Documentação técnica do **ETAL Connect**, aplicativo do ETAL (Encontro de Tecnologia do Alto Oeste Potiguar), no IFRN Campus Pau dos Ferros. O app é desenvolvido pelo NADIC (Núcleo de Apoio ao Desenvolvimento e Inovação Científica e Tecnológica) como projeto técnico de curso. Estado descrito: novembro de 2026.

## Objetivo

Reunir num só lugar o que o participante precisa durante o evento:

- entrar com a conta do SUAP (ou como visitante);
- ver a programação e montar a própria agenda;
- registrar presença lendo o QR da sala;
- achar salas, banheiros e bebedouros no mapa do campus, com rota a pé;
- receber avisos e trocas de sala ao vivo;
- usar o app mesmo com a internet do campus instável (PWA com cache offline).

A organização ganha um painel para enviar avisos, trocar salas, numerar salas, credenciar pessoas e exportar presenças para o SUAP.

## Público

| Público | O que faz no sistema |
|---|---|
| Participantes do IFRN (alunos e servidores) | Entram pelo SUAP, montam a agenda, registram presença, usam o mapa. |
| Visitantes de fora do IFRN | Entram por um link enviado ao e-mail e usam as mesmas telas. |
| Organização do ETAL e do NADIC | Usam o painel (`admin.html`) e a API `/api/org`. |

## Escopo

**Dentro do escopo (MVP para o evento):** entrada pelo SUAP e de visitante, programação, agenda com vagas, presença por QR assinado, credenciamento, avisos ao vivo (SSE), trocas de sala, numeração das salas, mapa 3D com busca e rota, exportação em CSV, impressão dos QRs, uso offline.

**Fora do escopo por enquanto (planejado):** certificados, avaliação das atividades, retrospectiva com dados reais, estatísticas para a comissão, lotação no mapa 3D, notificação push de servidor, migrações de banco com Alembic. Ver as fases em [`../PLANO_TECNICO.md`](../PLANO_TECNICO.md).

**O que ainda é exemplo no app:** parte da programação (só seis atividades seguem o VII ETAL, de 2025), a lista de participantes e os gráficos do painel, campeonatos, materiais e certificados. A tela Perfil → Sobre este protótipo separa o real do exemplo.

## Índice

| Arquivo | Conteúdo |
|---|---|
| [01-requisitos.md](01-requisitos.md) | Requisitos funcionais e não funcionais, com prioridade e situação. |
| [02-casos-de-uso.md](02-casos-de-uso.md) | Atores, diagrama e fichas dos casos de uso. |
| [03-banco-de-dados.md](03-banco-de-dados.md) | Modelo entidade-relacionamento e dicionário de dados. |
| [04-arquitetura.md](04-arquitetura.md) | Componentes, pastas, sequências, implantação e fluxo git. |
| [05-api.md](05-api.md) | Referência das rotas da API. |
| [06-testes.md](06-testes.md) | Testes automatizados, CI e roteiro de homologação. |

## Tecnologias

| Camada | Tecnologia |
|---|---|
| App | HTML, CSS e JavaScript sem framework; PWA (`manifest.webmanifest`, `sw.js`); mapa em Canvas (`campus3d.js`). |
| API | Python 3.12, FastAPI, SQLAlchemy 2, Pydantic, httpx, itsdangerous, segno (QR). |
| Banco | SQLite (desenvolvimento) e PostgreSQL 16 (produção). |
| Implantação | Docker Compose, Caddy (HTTPS automático), GitHub Actions. |
| Entrada | SUAP OAuth2; link por e-mail para visitantes. |

## Convenções desta documentação

- **Situação** dos itens: *feito* (existe no código), *parcial* (existe em parte) e *planejado* (não existe ainda).
- Nomes de rotas, arquivos e variáveis aparecem em `código`.
- O que não está no código é marcado como planejado. Nada aqui descreve funcionalidade inexistente como pronta.
- Termo "protótipo": o diretório `prototipo/` é o app em si. O nome ficou do início do projeto.

## Como rodar rapidamente

```sh
# API
cd backend
python3 -m venv .venv && .venv/bin/pip install -r requirements-dev.txt
.venv/bin/python -m app.importar programacao seed/programacao.json
ETAL_LOGIN_DEV=1 .venv/bin/uvicorn app.main:app --port 8000   # http://127.0.0.1:8000/api/docs

# App (modo demonstração, sem API)
sh prototipo/rodar.sh   # http://127.0.0.1:8770
```
