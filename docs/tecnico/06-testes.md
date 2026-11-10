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
| test_login_suap_com_senha | `POST /api/auth/suap/senha` com cliente HTTP simulado: senha errada responde 401; senha certa responde 200, abre a sessão (`/api/eu` traz o nome) e a foto relativa vira URL completa do SUAP |

Os testes usam SQLite de teste, programação de exemplo e sessões de desenvolvimento. O teste SUAP não faz chamadas a uma conta real. Não há cobertura automatizada completa das telas do app.

## Reproduzir os testes

```sh
cd backend
.venv/bin/python -m pytest -q
```

## Evidências visuais

- Nove telas do app capturadas em 390 × 844, com resolução 2×.
- Painel desktop capturado separadamente, com dados de demonstração.
- Swagger real em /api/docs e execução de GET /api/saude com HTTP 200.
- Contrato de POST /api/presenca no Swagger.
- Modelo de sete tabelas e rotas OpenAPI extraídos do código em docs/assets/evidencias.json.
- Apresentação de 22 slides conferida no Chrome: navegação real de agenda e crachá, mapa com troca de andar e rota por rampa, controle de luz e qualidade 2D, planta comparada, seleção das tabelas e abertura do dicionário.
- Demos verificadas com armazenamento isolado; o estado de teste do documento principal permaneceu intacto. O app embutido também abriu pela versão local em arquivo. Nenhum erro de JavaScript apareceu nessa conferência.

As imagens ficam em docs/assets/. O script scripts/capturar-documentacao.py cria banco temporário, inicia e encerra os servidores da captura e não altera config.js. Os atalhos ?tela= são apenas meios de obter as telas demonstrativas; não provam a jornada autenticada ponta a ponta.

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

Entrega SMTP e retorno OAuth2 reais, carga do evento, acessibilidade, operação sem conexão, participantes reais no painel, migrações e recuperação de backup. O CI em .github/workflows/backend.yml testa a API; a etapa de implantação é condicional.
