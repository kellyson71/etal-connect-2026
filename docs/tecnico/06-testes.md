# 06 · Evidências e verificação

Na revisão documental de 09/11/2026, a execução local de .venv/bin/python -m pytest -q terminou com **14 testes passando** e um aviso de depreciação do cliente de testes Starlette / httpx. Isso é evidência do backend local; não é homologação do evento.

## Cenários automatizados presentes

| Teste | Confere |
|---|---|
| test_programacao_publica | Programação acessível sem sessão e com campos do app |
| test_eu_exige_login | Perfil protegido |
| test_agenda | Salvar, repetir, consultar e remover |
| test_presenca_por_qr | Credenciamento e presença sem duplicidade |
| test_qr_falso_recusado | QR inventado recusado |
| test_janela_de_horario | QR fora da janela recusado |
| test_org_protegida | Participante não publica aviso |
| test_org_aviso_troca_sala_e_exportacao | Aviso, mudança de sala, numeração, CSV e QRs |
| test_visitante_por_link | Entrada e bloqueio de reuso do link |
| test_qr_aberto_na_camera | Redirecionamento /q/{token} |
| test_suap_sem_configuracao | Comportamento sem aplicação OAuth2 configurada |
| test_homologacao | Código de teste e QRs do ambiente de homologação |
| test_atividade_sem_sala_sem_andar | Atividade sem localização não inventa andar |
| test_limites (3) | 30 matrículas pelo mesmo endereço entram; a 7ª senha errada da mesma matrícula é barrada; fila do SUAP cheia responde 503 com `Retry-After` |
| test_migracoes (2) | O modelo bate com as migrações; banco antigo é atualizado sem perder dados |
| test_presenca_adiada (10) | Leitura guardada sem internet: vale durante a atividade; fora dela, tarde demais ou com hora no futuro não vale; fuso convertido; não duplica; QR falso recusado; recusa não credencia |
| test_publicacoes (16) | Ver exige entrar; sem credenciamento não publica; publicar, comentar, curtir, salvar; matrícula e e-mail não vazam; menções; fotos regravadas sem localização; foto falsa recusada; só o autor apaga, e apaga tudo; organização oculta, restaura e guarda histórico; participante não modera; denúncia e ocultação automática; arquivar denúncia de conteúdo apagado; limite por pessoa; limpeza das antigas; versão evita baixar de novo |
| test_limites (+2) | No teto da rede só contam senhas erradas; esperar na fila do SUAP não gasta tentativa |
| test_monitor (3) | O log não leva token, nome, matrícula nem IP; números do servidor só para a organização; saúde consulta o banco |
| test_contingencia (3) | Lista em papel com quem salvou e linhas em branco (nomes escapados); lançar a lista credencia e registra presença manual, sem duplicar, e devolve quem não tem cadastro; só a organização |
| test_material_antigo_do_banco_passa_para_o_disco | Material guardado no banco antes da mudança vai para o disco ao ser aberto |
| test_login_suap_com_senha | `POST /api/auth/suap/senha` com cliente HTTP simulado: senha errada responde 401; senha certa responde 200, abre a sessão (`/api/eu` traz o nome) e a foto relativa vira URL completa do SUAP |

Os testes usam SQLite de teste, programação de exemplo e sessões de desenvolvimento. O teste SUAP não faz chamadas a uma conta real.

No app e no mapa (`npm test` e `npm run test:navegador`, também na CI do front-end):

| Teste | Confere |
|---|---|
| `mapa3d/tests/rotas.test.mjs` | Rotas do mapa 3D: origem, portas, alturas, rampa e escada, destinos inválidos |
| `prototipo/tests/community.test.mjs` | Publicações: armazenamento, menções, denúncias e moderação |
| `scripts/planta/check-principal-plan.py` | Regras da planta do bloco (recepção, corredores, escada, rampa, bebedouro) |
| `prototipo/tests/telas.py` | 19 telas do app no Chromium, tocando nas ações de cada uma, sem erro de JavaScript |
| `prototipo/tests/presenca_sem_rede.py` | Com a API de verdade: leitura sem rede guardada (mesmo fechando o app) e sem valer; enviada quando a rede volta e marcada como adiada; recusada sai da fila e avisa; servidor fora do ar mantém; QR que não é do ETAL não é guardado |
| `prototipo/tests/publicacoes_servidor.py` | Com a API de verdade e três navegadores: sem exemplos; publicar com foto; a outra pessoa vê ao vivo; curtida e comentário; denúncia, organização tira do ar e some da tela; chat |
| `montar-app.mjs --verificar` | O app.js e o app.css montados estão em dia com as partes |

O teste das telas confere que nada quebra; não compara a aparência das telas.

Carga: [09-teste-de-carga.md](09-teste-de-carga.md) (700 pessoas na abertura, com PostgreSQL e um SUAP de mentira).

## Reproduzir os testes

```sh
cd backend
.venv/bin/python -m pytest -q
cd ..
npm test
npm run test:navegador
```

## Evidências visuais

- Nove telas do app capturadas em 390 × 844, com resolução 2×.
- Painel desktop capturado separadamente, com dados de demonstração.
- Swagger real em /api/docs e execução de GET /api/saude com HTTP 200.
- Contrato de POST /api/presenca no Swagger.
- Modelo de sete tabelas e rotas OpenAPI extraídos do código em docs/assets/evidencias.json.
- Apresentação de 22 slides conferida no Chrome: navegação real de agenda e crachá, mapa com troca de andar e rota por rampa, controle de luz e qualidade 2D, planta comparada, seleção das tabelas e abertura do dicionário.
- Demos verificadas com armazenamento isolado; o estado de teste do documento principal permaneceu intacto. O app embutido também abriu pela versão local em arquivo. Nenhum erro de JavaScript apareceu nessa conferência.

As imagens ficam em docs/assets/. O script scripts/docs/capturar-documentacao.py cria banco temporário, inicia e encerra os servidores da captura e não altera config.js. Os atalhos ?tela= são apenas meios de obter as telas demonstrativas; não provam a jornada autenticada ponta a ponta.

evidencias.json inclui os hashes das fontes do app; cenas.json registra o hash do motor e os parâmetros das cenas. Eles permitem conferir se as capturas correspondem ao código atual. O PDF foi conferido com 22 páginas e usa imagens estáticas no lugar dos iframes.

## Ensaio antes do evento

| Etapa | Conferir no ambiente escolhido |
|---|---|
| Entrada | Perfil real de teste, visitante por e-mail, sair e reentrar |
| Programação | Dias, horários, salas, vagas e conteúdo aprovados |
| Agenda | Persistir após reabrir; impedir duplicação e excesso de vagas |
| QR | Evento, atividade, repetido, inválido, sem sessão e fora do horário |
| Mapa | Atividade → sala correta → rota → retorno da navegação |
| Avisos | Publicação e mudança de sala com celulares já abertos |
| Organização | Contas e papéis; CSV real pela API; comparação com os registros |
| Sem rede | App e mapa disponíveis; nenhuma presença apresentada como sincronizada |
| Dispositivos | Chrome Android, Safari iOS, leitor de tela e tamanhos pequenos |

## O que continua aberto

Entrega SMTP e retorno OAuth2 reais, velocidade do SUAP de verdade e carga no servidor do NADIC, acessibilidade, participantes reais no painel e recuperação de backup. O CI em .github/workflows/backend.yml testa a API; a etapa de implantação é condicional.
