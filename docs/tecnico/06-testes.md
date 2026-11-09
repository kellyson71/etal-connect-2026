# 6. Testes

## 6.1 Testes automatizados do backend

Arquivos: `backend/tests/conftest.py` e `backend/tests/test_api.py`. São 13 cenários, com pytest e `TestClient` do FastAPI.

### Preparação (`conftest.py`)

- Variáveis de ambiente de teste: banco `sqlite:///./teste.db`, `ETAL_LOGIN_DEV=1`, `ETAL_JANELA_PRESENCA=0`, segredo fixo e `ETAL_URL_PUBLICA=http://teste`.
- A cada cenário: apaga e recria as tabelas, importa `seed/programacao.json` (21 atividades), zera o limite de requisições e sobe a API. No fim, apaga as tabelas.
- Função `entrar(...)`: entra pela rota de desenvolvimento, como participante ou organização.

### Cenários

| # | Teste | O que verifica |
|---|---|---|
| 1 | `test_programacao_publica` | `GET /api/programacao` responde 200 sem login, traz 21 atividades e os campos `id`, `title`, `time`, `end`, `room`, `date`. |
| 2 | `test_eu_exige_login` | `GET /api/eu` sem sessão responde 401. |
| 3 | `test_agenda` | Salvar atividade grava; salvar de novo não duplica; `/api/eu` lista a atividade; `taken` na programação vira 1; remover esvazia a agenda. |
| 4 | `test_presenca_por_qr` | QR do evento só credencia (`newCredential`, sem atividade). QR de atividade registra a presença; ler de novo devolve `alreadyPresent`. `/api/eu` mostra a presença e `credentialedAt`. Aceita a URL `.../q/token` e o token puro. |
| 5 | `test_qr_falso_recusado` | QR inventado responde 400. |
| 6 | `test_janela_de_horario` | Com a janela ligada, QR de atividade fora do horário responde 409. |
| 7 | `test_org_protegida` | Participante comum não envia aviso: 403. |
| 8 | `test_org_aviso_troca_sala_e_exportacao` | Organização envia aviso (201) e ele aparece em `/api/avisos`. Troca de sala atualiza `room` e cria o aviso "Mudança de sala". `PUT /api/org/salas` grava a numeração e `/api/programacao` a devolve. O CSV de presenças contém a matrícula e a atividade. `/api/org/qrs` traz SVG. |
| 9 | `test_visitante_por_link` | Visitante pede o link (202); o link abre a sessão (302 para `login=ok`) e `/api/eu` mostra o nome; usar o mesmo link de novo redireciona para `link-expirado`. |
| 10 | `test_qr_aberto_na_camera` | `GET /q/<token>` redireciona (302) para `/?qr=`. |
| 11 | `test_suap_sem_configuracao` | `GET /api/auth/suap` sem credenciais do SUAP responde 302 (para `/?login=suap-indisponivel`). |
| 12 | `test_homologacao` | Com o código definido, `POST /api/auth/dev` com código errado responde 403 e com o certo, 200. `GET /api/homologacao/qrs` traz a recepção (`id` nulo), SVG e mais de 5 itens. `POST /api/presenca` com a URL do segundo QR registra a presença na atividade certa. |
| 13 | `test_atividade_sem_sala_sem_andar` | A atividade `encerramento` (sem sala) vem de `/api/programacao` sem o campo `floor`. |

### Não coberto pelos testes automatizados

- Retorno do SUAP com `code` válido (exige mock do SUAP).
- Limite de requisições (429) e envio de e-mail por SMTP.
- Eventos do canal SSE (`/api/ao-vivo`) e a consulta periódica da Vercel (`vivo: 'consulta'`).
- Importação de inscritos por CSV; rotas `/api/org/participantes`, `/credenciar`, `/resumo` e `/credenciados.csv`; vagas esgotadas (409).
- Todo o código do app (`prototipo/`): não há testes automatizados de interface.

## 6.2 Como rodar

```sh
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements-dev.txt
.venv/bin/python -m pytest -q
```

Um arquivo `teste.db` temporário é criado na pasta `backend/` durante a execução.

## 6.3 Integração contínua (GitHub Actions)

Arquivo: `.github/workflows/backend.yml`.

| Job | Quando | O que faz |
|---|---|---|
| `testes` | Push que mexe em `backend/**`, `deploy/**`, `prototipo/**` ou no próprio workflow; pull request que mexe em `backend/**` | Python 3.12, instala `requirements-dev.txt` (com cache do pip) e roda `python -m pytest -q` em `backend/`. |
| `implantar` | Só na `main`, depois de `testes`, e só se a variável do repositório `IMPLANTAR` for `sim` | Entra por SSH (segredos `SSH_HOST`, `SSH_USUARIO`, `SSH_CHAVE`, `PASTA`), faz `git pull --ff-only`, `docker compose up -d --build` e chama `/api/saude` dentro do contêiner da API. |

## 6.4 Roteiro de testes manuais e homologação

Objetivo: conferir o fluxo completo antes do evento, no celular e no computador.

### Preparação

| Ambiente | Como preparar |
|---|---|
| Local | API (sem `ETAL_URL_PUBLICA`, que pega o endereço do pedido): `ETAL_LOGIN_DEV=1 ETAL_JANELA_PRESENCA=0 ETAL_ORIGENS=http://127.0.0.1:8770 .venv/bin/uvicorn app.main:app --port 8011`. Em `prototipo/config.js`: `window.ETAL_CONFIG = { api: 'http://127.0.0.1:8011' };`. App: `sh prototipo/rodar.sh`. |
| Produção ou teste | Domínio com HTTPS (a câmera e a instalação do PWA exigem). SUAP e SMTP configurados. Programação importada. Pelo menos uma conta de organização em `ETAL_ORGANIZACAO`. |

Para testar QR sem imprimir folhas e fora do horário real, usar `/homologacao` (exige `ETAL_LOGIN_DEV=1`; o código é `ETAL_SENHA_HOMOLOGACAO`) e desligar a janela (`ETAL_JANELA_PRESENCA=false`) no ambiente de teste. A página lista os QRs da recepção e de cada atividade, com o botão "Ler agora". O app em `/demo` traz botões que simulam a leitura. Na Vercel (`https://etal-connect.vercel.app`) a homologação já fica disponível. Nunca deixar o modo de teste nem a janela desligada em produção.

### Roteiro

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Abrir o app no celular. | Carrega a tela de entrada (crachá). Com a API ligada, sem sessão, mostra o crachá em branco. |
| 2 | Entrar com o SUAP (conta de teste). | Vai ao SUAP, volta ao app e mostra nome, foto e matrícula no crachá. A senha só foi digitada no SUAP. |
| 3 | Sair e entrar como visitante. | Recebe o e-mail com o link; ao abrir, o app entra. O mesmo link, aberto de novo, mostra "Esse link expirou". |
| 4 | Abrir a Agenda e escolher um dia. | Lista a programação do servidor, com salas numeradas. |
| 5 | Salvar uma atividade. | Aparece como salva; fechar e reabrir o app mantém. O número de inscritos sobe em 1. |
| 6 | Salvar até esgotar as vagas (outra conta). | Aviso "Vagas esgotadas." |
| 7 | Ligar o lembrete e esperar 10 minutos antes do início (ou usar "Ver como o lembrete chega"). | Notificação com sala, andar e minutos a pé. |
| 8 | Imprimir ou abrir `/api/org/qrs` e ler o QR do credenciamento pela câmera do app. | "Credenciamento confirmado"; o crachá mostra o horário. |
| 9 | Ler o QR de uma atividade pela câmera do app. | "Presença registrada: nome da atividade". Ler de novo: "Presença já estava registrada". |
| 10 | Ler o QR de uma atividade pela câmera do celular (fora do app). | Abre o ETAL Connect e registra a presença ao abrir; se não estiver logado, pede a entrada e registra depois. |
| 11 | Abrir `/homologacao`, entrar com o código e tocar em "Ler agora" num QR. | O resultado mostra a presença registrada (ou a mensagem de janela de horário). |
| 11b | Ler um QR de outro sistema (por exemplo, de um site). | O app informa que o QR não é do ETAL; nada é gravado. |
| 12 | Com a janela ligada, ler o QR de uma atividade de outro horário. | Mensagem "Este QR vale durante a atividade (...)". |
| 13 | Abrir o Mapa, tocar em "Buscar", digitar "banheiro" e "bebedouro". | Lista ordenada por minutos a pé; escolher um mostra a rota da portaria até ele. |
| 14 | Abrir uma atividade e tocar para ver no mapa. | Rota até a porta da sala. |
| 15 | No computador ou iPhone (sem `BarcodeDetector`), ler um QR pela câmera do app. | O `jsQR` é carregado e a leitura funciona. |
| 15b | Em modo avião, abrir o app já instalado. | O app abre e o mapa funciona; a programação mostrada é a de exemplo embutida. |
| 16 | No computador, abrir `admin.html` logado como organização. | O painel abre. Com conta comum, mostra "Só para a organização do ETAL". |
| 17 | No painel, enviar um aviso com o app aberto no celular. | O aviso aparece no topo da lista em poucos segundos, com vibração e notificação. |
| 18 | No painel, trocar a sala de uma atividade com "avisar os inscritos". | O app mostra o aviso "Mudança de sala" e a nova sala na atividade e no mapa. |
| 19 | No painel, mudar o número de uma sala. | A planta, a atividade e o 3D mostram o novo número. Apagar o valor volta ao original. |
| 20 | Baixar `/api/org/presencas.csv` e `/credenciados.csv`. | Arquivos abrem no Excel com acentos corretos e as presenças dos testes. |
| 21 | Perfil, Personalizar, Mapa: rodar "Testar desempenho". | O teste mostra o FPS de cada versão do mapa e recomenda uma. Forçar o 2D simples funciona. |
| 22 | Conferir o `/api/saude` e `/api/docs`. | `{"ok": true}` e a página do OpenAPI abre. |

### Critérios de aceite

- Nenhum passo de 1 a 14 e 16 a 20 falha.
- Nenhuma senha aparece em logs, e-mails ou no armazenamento do navegador.
- A janela de horário está ligada e o segredo é o definitivo antes de imprimir os QRs.
- Os testes automatizados passam (`pytest`) no commit que vai para a produção.
