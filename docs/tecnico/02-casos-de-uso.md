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
2. A identificação acontece pelo caminho disponível no ambiente.
3. O app mostra o perfil e abre a navegação.
4. No modo API, GET /api/eu recupera perfil, agenda e presenças.

Alternativas: OAuth2 sem configuração redireciona com aviso de indisponibilidade; senha incorreta na entrada direta retorna 401; link expirado ou reutilizado não abre uma nova sessão. A simulação local com SuaPy é um caminho separado, em prototipo/server.py.

Resultado: a pessoa está autenticada. O campo de credenciamento pode continuar vazio.

## Escolher atividade e chegar à sala

1. Consultar a programação por dia e categoria.
2. Abrir a atividade e verificar horário, palestrante e sala.
3. Salvar na agenda pessoal.
4. Abrir a localização; o mapa usa andar e zona para desenhar a rota.

No modo API, salvar envia POST /api/eu/agenda/{atividade_id}. Repetir não duplica. Atividade inexistente retorna 404; vagas esgotadas retornam 409. Remover usa DELETE na mesma rota. Salvar não registra presença.

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
