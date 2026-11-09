# 5. API

Referência das rotas, conforme `backend/app/main.py` e `backend/app/rotas/`. A documentação interativa (OpenAPI) fica em `/api/docs`.

## 5.1 Regras gerais

- Formato: JSON em UTF-8. Os nomes dos campos das respostas seguem o app (`title`, `time`, `room`...), em inglês; os dos corpos das requisições de avisos e visitantes são em português.
- Autenticação: cookie `etal_sessao` (`HttpOnly`, `SameSite=Lax`, 30 dias, `Secure` em produção). O app envia com `credentials: 'include'`.
- Papéis: **público** (sem login), **logado** (qualquer pessoa com sessão) e **organização** (`papel = organizacao`).
- Horários: `HH:MM` no horário local do campus (`America/Fortaleza`). Datas completas em ISO 8601, sem fuso.
- CORS: só as origens de `ETAL_ORIGENS`, com credenciais.
- Limite de requisições: por IP (cabeçalho `X-Forwarded-For` ou endereço da conexão), em memória do processo, janela de 60 segundos. Excedido: 429 "Muitas tentativas. Espere um minuto.".
- Erros: `{"detail": "mensagem"}`. Erros de validação do corpo: 422 com `detail` em lista.

| Código | Quando |
|---|---|
| 400 | QR não reconhecido. |
| 401 | Sem sessão ou sessão inválida ("Entre para continuar." / "Sessão inválida. Entre de novo."). |
| 403 | Logado, mas não é da organização ("Só a organização do evento."); ou código de homologação errado. |
| 404 | Atividade, pessoa ou rota inexistente. |
| 409 | Vagas esgotadas ou QR fora da janela de horário. |
| 422 | Corpo inválido. |
| 429 | Limite de requisições. |
| 503 | E-mail não configurado. |

## 5.2 Formatos de resposta

**Atividade** (`formatos.atividade`): os campos de `extra` (materiais etc.) mais:

| Campo | Tipo | Origem |
|---|---|---|
| `id` | texto | `atividades.id` |
| `type` | texto | `tipo` |
| `title` | texto | `titulo` |
| `short` | texto | `curto` |
| `description` | texto ou nulo | `descricao` |
| `speaker` | texto ou nulo | `palestrante` |
| `role` | texto ou nulo | `papel_palestrante` |
| `date` | data ISO | `data` |
| `day` | inteiro | dia do mês |
| `time` | `HH:MM` | `inicio` |
| `end` | `HH:MM` | `fim` |
| `floor` | inteiro (ausente se a atividade não tem sala) | `andar` |
| `zone` | texto (ausente se sem sala) | `zona` |
| `room` | texto ou nulo | `sala` |
| `seats` | inteiro (ausente se sem vagas) | `vagas` |
| `taken` | inteiro | inscritos na agenda (só em `/api/programacao`; nas respostas da organização vale 0) |

**Aviso:** `{ id, title, text, activity, time, at }`. `activity` é o id da atividade ou nulo; `time` é `HH:MM`; `at` é a data e hora ISO.

**Pessoa:** `{ id, name, first, initials, source, matricula, course, campus, institution, city, photo, org, credentialedAt }`. `source` é `suap`, `visitante` ou `dev`. `org` é verdadeiro para a organização. `credentialedAt` é ISO ou nulo.

## 5.3 Rotas públicas

| Método | Rota | Auth | Corpo | Resposta | Erros |
|---|---|---|---|---|---|
| GET | `/api/saude` | público | — | `{"ok": true}` (testa o banco) | 500 se o banco falhar |
| GET | `/api/programacao` | público | — | `{"sessions": [Atividade...], "rooms": {"andar:zona": "número"}}`, ordenado por data e início | — |
| GET | `/api/avisos` | público | — | Lista dos 50 avisos mais recentes (`Aviso[]`) | — |
| GET | `/api/lotacao` | público | — | `{"idAtividade": presentes}` só das atividades que acontecem agora; `{}` se não houver | — |
| GET | `/api/ao-vivo` | público | — | Fluxo SSE (`text/event-stream`). Ver 5.7 | — |
| GET | `/api/homologacao/qrs` | público, só com `ETAL_LOGIN_DEV=1` | — | Lista `[{id, title, when, url, svg}]`: o primeiro item é a recepção (`id` nulo); depois, uma atividade por item, por data e início. `url` é `.../q/token` e `svg` é o QR | 404 se o modo dev está desligado |
| GET | `/q/{token}` | público | — | 302 para `<endereço>/?qr={token}` (não valida o token; quem valida é `/api/presenca`) | — |

## 5.4 Entrada (`/api/auth`)

| Método | Rota | Auth | Corpo | Resposta | Erros |
|---|---|---|---|---|---|
| GET | `/api/auth/suap` | público | — | 302 para o SUAP. Grava o cookie `etal_oauth_estado` (10 minutos) | Se `ETAL_SUAP_CLIENT_ID` está vazio: 302 para `/?login=suap-indisponivel` |
| GET | `/api/auth/suap/retorno` | público | query `code`, `state` | 302 para `/?login=ok` com cookie de sessão. Cria ou atualiza a pessoa pela matrícula | Sempre 302; em falha vai para `/?login=erro` (estado inválido, sem matrícula) ou `/?login=suap-indisponivel` |
| POST | `/api/auth/visitante` | público, 5 por minuto | `{nome (2 a 200), email, instituicao?, cidade?}` | 202 `{"enviado": true}`. Em modo dev sem SMTP: `{"enviado": false, "link": "..."}` | 422, 429, 503 "Envio de e-mail não configurado." |
| GET | `/api/auth/link` | público | query `t` (token do e-mail) | 302 para `/?login=ok` com cookie de sessão | Sempre 302; em falha vai para `/?login=link-expirado` (inexistente, já usado ou vencido) |
| POST | `/api/auth/dev` | só com `ETAL_LOGIN_DEV=1` | `{nome?, matricula?, organizacao?, codigo?}` | `{"ok": true, "id": n}` e cookie de sessão | 404 se o modo dev está desligado; 403 "Código de homologação errado." se `ETAL_SENHA_HOMOLOGACAO` está definida e `codigo` não confere |
| POST | `/api/auth/sair` | público | — | `{"ok": true}` e apaga o cookie | — |

Notas:

- O papel de organização vem de `ETAL_ORGANIZACAO` (matrícula ou e-mail, sem diferenciar maiúsculas). É avaliado ao entrar pelo SUAP e ao criar o visitante.
- O `state` do OAuth2 é comparado com o cookie; a senha nunca chega à API.
- Escopo pedido ao SUAP: `identificacao email`.
- Atividades sem sala vêm sem os campos `floor`, `zone` e `seats` na resposta.

## 5.5 Participante (`/api`)

Todas exigem sessão (401 sem ela).

| Método | Rota | Corpo | Resposta | Erros |
|---|---|---|---|---|
| GET | `/api/eu` | — | `{"person": Pessoa, "saved": [idAtividade...], "present": {"idAtividade": "HH:MM"}}` | 401 |
| POST | `/api/eu/agenda/{atividade_id}` | — | `{"ok": true}`. Repetir não duplica | 404 atividade inexistente; 409 "Vagas esgotadas." |
| DELETE | `/api/eu/agenda/{atividade_id}` | — | `{"ok": true}` (mesmo que não estivesse salva) | 401 |
| POST | `/api/presenca` (20 por minuto) | `{"qr": "..."}` (8 a 600 caracteres; token puro ou URL `.../q/token`) | `{"credentialed": true, "newCredential": bool, "activity": id ou null, "alreadyPresent": bool, "time": "HH:MM"}` | 400 QR não reconhecido; 404 atividade do QR inexistente; 409 fora da janela; 429 |

Regras de `/api/presenca`:

1. QR do evento (sem atividade): só credencia (`credenciado_em`). `activity` volta nulo.
2. QR de atividade: credencia, se preciso, e registra a presença (`via = qr`).
3. Com `ETAL_JANELA_PRESENCA` ligada, só vale de `inicio - ETAL_ANTECEDENCIA_MIN` até `fim`. Fora disso, 409 "Este QR vale durante a atividade (HH:MM às HH:MM do dia D)." e nada é gravado.
4. Leitura repetida: `alreadyPresent = true`, sem nova linha.
5. A presença não exige que a atividade esteja na agenda da pessoa.
6. Cada presença nova publica o evento `lotacao` com o total da atividade.

## 5.6 Organização (`/api/org`)

Todas exigem sessão de organização (401 sem sessão, 403 para participante comum).

| Método | Rota | Corpo | Resposta | Erros |
|---|---|---|---|---|
| POST | `/api/org/avisos` | `{titulo (2 a 140), texto (2 a 1000), atividade?}` | 201 `Aviso`. Publica o evento `aviso` | 404 atividade inexistente; 422 |
| PATCH | `/api/org/atividades/{id}/sala` | `{andar?, zona?, sala (1 a 120), avisar (padrão true)}` | `Atividade` atualizada. Publica `sala` e, se `avisar`, grava e publica o aviso "Mudança de sala" | 404 |
| PUT | `/api/org/salas` | `{"andar:zona": "número", ...}`; número vazio apaga | O mapa completo `{"andar:zona": "número"}`. Publica `numeros`. Número cortado em 12 caracteres | 422 |
| GET | `/api/org/participantes?q=` | — | `Pessoa[]` (até 500, por nome). `q` filtra nome, matrícula ou e-mail (sem diferenciar maiúsculas) | — |
| POST | `/api/org/credenciar/{pessoa_id}` | — | `Pessoa`. Grava `credenciado_em` se vazio | 404 |
| GET | `/api/org/resumo` | — | `{"pessoas": n, "credenciados": n, "presencas": n, "agenda": n}` | — |
| GET | `/api/org/presencas.csv` | — | CSV (`;`, UTF-8 com BOM) com colunas `nome;matricula;email;atividade;titulo;quando;via`, ordenado por atividade e nome. `quando` em `dd/mm/aaaa hh:mm` | — |
| GET | `/api/org/credenciados.csv` | — | CSV com `nome;matricula;email;tipo;credenciado_em` | — |
| GET | `/api/org/qrs` | — | Página HTML para imprimir: um QR do credenciamento e um por atividade que tem andar. Cada QR é um SVG com a URL `<endereço>/q/token` | — |

## 5.7 Canal ao vivo (`GET /api/ao-vivo`)

Servidor envia eventos (SSE). O navegador reconecta sozinho (`retry: 5000`). A cada 20 segundos sem evento, o servidor manda `: ping`. Cada conexão tem uma fila de 100 mensagens; se encher, a conexão é descartada. Usa um processo só.

| Evento | Dados | Quando |
|---|---|---|
| `aviso` | `Aviso` | Aviso novo (da organização ou da troca de sala). |
| `sala` | `{activity, floor, zone, room}` | Atividade mudou de sala. |
| `numeros` | `{"andar:zona": "número"}` | Numeração alterada (mapa completo). |
| `lotacao` | `{activity, present}` | Presença nova registrada. |

Exemplo:

```
event: aviso
data: {"id": 7, "title": "Mudança de sala", "text": "Oficina: agora em Sala 102. Antes era Lab 3.", "activity": "oficina-x", "time": "14:05", "at": "2026-11-26T14:05:10"}
```

## 5.8 Variáveis de configuração

Lidas com o prefixo `ETAL_` (ou do arquivo `.env`).

| Variável | Padrão | Uso |
|---|---|---|
| `ETAL_BANCO` | `sqlite:///./etal.db` | Conexão com o banco. |
| `ETAL_SEGREDO` | `troque-este-segredo` | Assina sessões e QRs. Trocar invalida ambos. |
| `ETAL_URL_PUBLICA` | vazio | Base dos redirecionamentos, do retorno do SUAP e dos QRs. Vazio: usa o endereço do pedido (`x-forwarded-host` e `x-forwarded-proto`). |
| `ETAL_SENHA_HOMOLOGACAO` | vazio | Código exigido em `POST /api/auth/dev` (campo `codigo`). Vazio: sem código. |
| `ETAL_SEMEAR` | desligado | Com `1`, `api/index.py` importa a programação de exemplo (Vercel). |
| `DATABASE_URL` | — | Na Vercel (Neon); convertida para `postgresql+psycopg` em `config.py` quando `ETAL_BANCO` não é definido. |
| `ETAL_ORIGENS` | `http://127.0.0.1:8770,http://localhost:8770` | CORS. |
| `ETAL_COOKIE_SEGURO` | `false` | `Secure` nos cookies. Ligado em produção. |
| `ETAL_LOGIN_DEV` | `false` | Habilita `/api/auth/dev`, `/api/homologacao/qrs` e devolve o link do visitante na resposta. |
| `ETAL_SUAP_CLIENT_ID`, `ETAL_SUAP_CLIENT_SECRET` | vazios | Aplicação OAuth2 do SUAP. |
| `ETAL_SUAP_AUTHORIZE_URL`, `ETAL_SUAP_TOKEN_URL`, `ETAL_SUAP_USERINFO_URL` | endereços do SUAP do IFRN | Endpoints OAuth2. |
| `ETAL_SUAP_ESCOPO` | `identificacao email` | Escopo pedido. |
| `ETAL_ORGANIZACAO` | vazio | Matrículas ou e-mails da organização, separados por vírgula. |
| `ETAL_SMTP_HOST`, `_PORTA` (587), `_USUARIO`, `_SENHA`, `_REMETENTE` | — | Envio do link do visitante (STARTTLS). |
| `ETAL_JANELA_PRESENCA` | `true` | Liga a janela de horário da presença. |
| `ETAL_ANTECEDENCIA_MIN` | `20` | Minutos antes do início em que o QR já vale. |
| `ETAL_FUSO` | `America/Fortaleza` | Fuso do campus. |

## 5.9 Importação (linha de comando)

```sh
python -m app.importar programacao seed/programacao.json
python -m app.importar inscritos inscritos.csv   # colunas: nome, matricula, email (separador ; ou ,)
```

A programação atualiza as atividades pelo `id` (criando as que faltam). Os inscritos só criam pessoas novas, pela matrícula ou e-mail; quem já existe não é alterado. Linhas sem nome ou sem matrícula e e-mail são ignoradas.
