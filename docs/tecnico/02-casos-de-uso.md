# 02 · Fluxos e casos de uso observados

Os casos abaixo vêm das telas e das rotas. Não representam validação formal com a comissão do evento.

## Atores e objetivos

| Ator | Objetivos | Caminho principal |
|---|---|---|
| Participante IFRN | Entrar, consultar, salvar atividades, ler QR, encontrar sala | App de celular + API de participante |
| Visitante | Usar o app sem conta SUAP | Cadastro local no demo; link por e-mail no modo API |
| Organização | Avisar, trocar sala, numerar ambientes e consultar registros | admin.html e /api/org |
| SUAP | Fornecer identidade à entrada institucional | OAuth2 ou consulta de perfil pela API |
| Serviço de e-mail | Entregar o link do visitante | SMTP, quando configurado |

## Entrar e abrir o app

1. A pessoa escolhe SUAP ou visitante no crachá.
2. A identificação acontece por um destes caminhos:
   - **SUAP pela página do SUAP (OAuth2):** `GET /api/auth/suap` leva ao SUAP, onde a senha é digitada, e `/api/auth/suap/retorno` abre a sessão. O app é cliente confidential, com grant authorization code e redirecionamento para `/api/auth/suap/retorno` do endereço de produção e do da `develop`. Se `/api/eu/` responder 404, a API tenta `/api/rh/eu/`.
   - **SUAP com matrícula e senha:** `POST /api/auth/suap/senha` (limite de 8 por minuto). A API pede o token JWT em `{ETAL_SUAP_API_URL}/api/token/pair`, lê `/api/rh/eu/` com Bearer, cria ou atualiza a pessoa e abre a sessão. Senha e token não são guardados.
   - **Visitante:** link por e-mail.
   Nos dois caminhos do SUAP, a mesma função (`_pessoa_suap`) grava a pessoa; foto relativa do SUAP vira URL completa.
3. O app mostra o perfil e abre a navegação.
4. No modo API, GET /api/eu recupera perfil, agenda e presenças.

Alternativas: OAuth2 sem configuração redireciona com aviso de indisponibilidade; senha incorreta na entrada direta retorna 401 ("Matrícula ou senha incorreta."); se o SUAP não responder, 503; sem matrícula na resposta do SUAP, 502; link expirado ou reutilizado não abre uma nova sessão. A simulação local com SuaPy é um caminho separado, em prototipo/server.py.

Resultado: a pessoa está autenticada. O campo de credenciamento pode continuar vazio.

## Escolher atividade e chegar à sala

1. Consultar a programação por dia e categoria.
2. Abrir a atividade e verificar horário, palestrante e sala.
3. Salvar na agenda pessoal.
4. Abrir a localização; o mapa usa andar e zona para desenhar a rota.

No modo API, salvar envia POST /api/eu/agenda/{atividade_id}. Repetir não duplica. Atividade inexistente retorna 404; vagas esgotadas retornam 409. Remover usa DELETE na mesma rota. Salvar não registra presença.

## Achar um lugar e traçar a rota

1. No Mapa, a pessoa toca na barra de busca, que fica embaixo e sobe junto com o teclado.
2. Sem digitar, usa os atalhos Banheiro, Bebedouro e Descanso ou o botão Atividades.
3. Digitando, vê os resultados crescendo para cima, com o melhor junto da barra.
4. Toca num resultado, ou aperta Enter para abrir o melhor, e o mapa traça a rota a pé desde a portaria (salas, lugares, atividades com sala e bebedouros).

Alternativas: atividade sem sala não tem rota; sem resultado, a lista fica vazia. A rota usa só o desenho do campus, sem GPS. Não altera dados.

## Credenciar e registrar presença

1. Entrar no app, se ainda não houver sessão.
2. Ler o QR pelo app ou abrir /q/{token} pela câmera do celular.
3. Enviar o token a POST /api/presenca.
4. A API valida assinatura, atividade e janela de horário.
5. QR do evento preenche o credenciamento; QR de atividade também registra uma presença.
6. O app mostra o resultado devolvido pelo servidor.

| Alternativa | Comportamento |
|---|---|
| QR não reconhecido | 400; não registra |
| Sem sessão | 401; precisa entrar |
| Atividade do QR inexistente | 404 |
| Fora da janela | 409; não confirma credenciamento nem presença |
| Leitura repetida | Resposta com alreadyPresent; não cria outra linha |
| Sem rede | Não há confirmação nem fila offline de presença |

A janela padrão é de 20 minutos antes do início até o fim da atividade. A presença não exige que a atividade esteja salva na agenda.

## Publicar aviso ou trocar sala

1. Organização entra no painel com a API ligada.
2. Envia aviso ou muda a sala de uma atividade.
3. A API grava a mudança e publica a atualização.
4. O app recebe por SSE; na configuração Vercel, consulta a cada 12 segundos.

Troca de sala gera aviso por padrão. A numeração usa a chave andar:zona e aparece nas atividades, planta e mapa 3D. Participante comum recebe 403 nas rotas da organização.

## Consultar registros e imprimir QRs

As rotas reais permitem listar participantes, credenciar manualmente, obter totais, baixar CSV de presenças / credenciados e imprimir QRs. O botão de CSV e os participantes do painel ainda usam dados simulados. Os arquivos reais devem ser obtidos pelas rotas /api/org correspondentes.

O CSV não registra nada automaticamente no SUAP. A existência de exportação não comprova compatibilidade com um processo institucional de importação.
