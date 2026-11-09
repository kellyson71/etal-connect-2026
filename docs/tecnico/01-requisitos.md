# 1. Requisitos

Prioridade: **essencial** (sem isso o evento não funciona), **importante** (faz falta, mas há contorno) e **desejável**.
Situação: **feito**, **parcial** ou **planejado**, conforme o código do repositório em novembro de 2026.

## 1.1 Requisitos funcionais

### Entrada e sessão

| Id | Descrição | Prioridade | Situação |
|---|---|---|---|
| RF01 | O participante do IFRN entra com a conta do SUAP por OAuth2. O app guarda matrícula, nome, e-mail, campus e foto. | essencial | feito (depende do registro do app no SUAP pela TI) |
| RF02 | O visitante informa nome, e-mail, instituição e cidade e recebe por e-mail um link de entrada, válido por 30 minutos e de uso único. | essencial | feito (depende de SMTP configurado) |
| RF03 | A sessão dura 30 dias em cookie assinado. A pessoa pode sair. | essencial | feito |
| RF04 | Em desenvolvimento, é possível entrar sem senha (`ETAL_LOGIN_DEV=1`), inclusive como organização. | desejável | feito |
| RF05 | A organização é definida por lista de matrículas ou e-mails na configuração (`ETAL_ORGANIZACAO`). | essencial | feito |

### Programação e agenda

| Id | Descrição | Prioridade | Situação |
|---|---|---|---|
| RF06 | Mostrar a programação por dia, com filtros, detalhes da atividade, palestrantes e sala. | essencial | feito |
| RF07 | A programação vem do servidor (`GET /api/programacao`) com a numeração das salas e o número de inscritos. | essencial | feito |
| RF08 | Salvar e remover atividade da agenda pessoal, sem duplicar, respeitando o limite de vagas. | essencial | feito |
| RF09 | Lembrete 10 minutos antes das atividades salvas, com sala, andar e minutos a pé. Vale só no aparelho, com o app aberto ou instalado. | importante | feito |
| RF10 | Importar a programação (JSON) e os inscritos do SUAP (CSV) por linha de comando. | essencial | feito |

### Credenciamento e presença

| Id | Descrição | Prioridade | Situação |
|---|---|---|---|
| RF11 | O QR do evento credencia a pessoa (grava o horário em `credenciado_em`). | essencial | feito |
| RF12 | O QR de uma atividade registra a presença e credencia, se ainda não estiver credenciada. Ler de novo não duplica. | essencial | feito |
| RF13 | Ler o QR pela câmera do próprio app, em todos os modos: `BarcodeDetector` e, onde ele não existe (computador, iPhone), `jsQR` (`prototipo/vendor/jsQR.js`, carregado sob demanda). | essencial | feito |
| RF14 | Ler o QR pela câmera do celular: o link `/q/<token>` abre o app e registra a presença ao abrir, depois da entrada, se preciso. | essencial | feito |
| RF15 | O QR de atividade só vale de 20 minutos antes do início até o fim da atividade (janela configurável). | essencial | feito |
| RF16 | Recusar QR que não seja do ETAL (assinatura inválida). | essencial | feito |
| RF17 | Página `/homologacao` para testes rápidos de QR: entrada de teste com código, atalhos e grade de QRs com botão "Ler agora". O app em `/demo` traz botões que simulam a leitura. | importante | feito |

### Mapa e busca

| Id | Descrição | Prioridade | Situação |
|---|---|---|---|
| RF18 | Mapa do campus em 3D (modos Evento e Campus) e planta dos três andares do bloco principal. | essencial | feito |
| RF19 | Busca por sala, atividade, tema, palestrante, banheiro, bebedouro, descanso, recepção, escada e rampa. Os resultados de lugares vêm ordenados pelo tempo a pé. | essencial | feito |
| RF20 | "Como chegar": rota a pé da portaria até a porta da sala, escolhendo entrada e escada ou rampa. | essencial | feito |
| RF21 | Ao abrir o mapa até 10 minutos antes de uma atividade salva, mostrar a rota dela, uma vez por atividade. | desejável | feito |
| RF22 | Mostrar a lotação das salas no mapa 3D. | desejável | planejado |

### Avisos e organização

| Id | Descrição | Prioridade | Situação |
|---|---|---|---|
| RF23 | Receber avisos, trocas de sala e numeração em tempo real (SSE `/api/ao-vivo`, com reconexão automática). Na Vercel, por consulta a cada 12 s (`vivo: 'consulta'`), porque o SSE em memória não funciona em funções. | essencial | feito |
| RF24 | A organização envia aviso geral ou ligado a uma atividade. | essencial | feito |
| RF25 | A organização troca a sala de uma atividade; o sistema gera o aviso "Mudança de sala" automaticamente (pode ser desligado). | essencial | feito |
| RF26 | A organização define o número de cada sala (chave `andar:zona`). Vale na planta, nas atividades e no 3D. | importante | feito |
| RF27 | Notificação do sistema para avisos. Hoje é notificação local, com o app aberto. Push de servidor com o app fechado fica para depois. | importante | parcial |
| RF28 | Credenciamento manual pela organização (`POST /api/org/credenciar/{id}`). | importante | parcial (API pronta; o painel ainda usa participantes simulados) |
| RF29 | Exportar presenças e credenciados em CSV para lançar no SUAP. | essencial | parcial (API pronta; o botão do painel exporta dados simulados) |
| RF30 | Imprimir QRs: um do credenciamento e um por atividade com sala (`GET /api/org/qrs`). | essencial | parcial (API pronta; o painel não tem o botão) |
| RF31 | Resumo com totais de pessoas, credenciados, presenças e agendas (`GET /api/org/resumo`). | desejável | parcial (API pronta; a visão geral do painel usa números simulados) |
| RF32 | Painel da organização com visão geral, planta ao vivo, programação, participantes, salas e avisos. | importante | feito (partes de exemplo) |

### Modos e demais

| Id | Descrição | Prioridade | Situação |
|---|---|---|---|
| RF33 | Modo demonstração: com `api: null` em `config.js` o app roda só com dados de exemplo, sem servidor. | importante | feito |
| RF34 | Versão de teste na Vercel (`https://etal-connect.vercel.app`): API como função Python e PostgreSQL Neon, com deploy automático pelo GitHub. | desejável | feito |
| RF35 | Certificados de participação a partir das presenças. | importante | planejado |
| RF36 | Avaliação das atividades. | desejável | planejado |
| RF37 | Retrospectiva e estatísticas com dados reais. | desejável | planejado (a tela existe com dados de exemplo) |

## 1.2 Requisitos não funcionais

| Id | Categoria | Descrição | Prioridade | Situação |
|---|---|---|---|---|
| RNF01 | Usabilidade no celular | Interface pensada para celular em pé: barra de abas na parte de baixo, botão central de QR ao alcance do polegar, painéis que sobem de baixo. Tudo se usa com uma mão. | essencial | feito |
| RNF02 | Usabilidade no celular | O botão de voltar do celular usa o histórico do navegador (`navMark`, `navPush`); voltar fecha painel ou tela, não sai do app. | importante | feito |
| RNF03 | PWA | App instalável (`manifest.webmanifest`, ícones, atalhos "Minha agenda" e "Mapa do campus"). Exige HTTPS ou 127.0.0.1. | essencial | feito |
| RNF04 | Desempenho do mapa | O mapa 3D é desenhado em Canvas 2D, sem biblioteca 3D. Há quatro versões (completo, médio, leve e 2D simples). O automático mede o aparelho, um teste de velocidade e a animação real, e rebaixa a versão se ficar lento. A pessoa pode forçar uma versão e ver o FPS (`?fps=1`). | essencial | feito |
| RNF05 | Desempenho | A economia de dados do navegador força o 2D simples. O mapa guarda a última vista e abre com aproximação curta. | desejável | feito |
| RNF06 | Offline | O service worker guarda o app (HTML, JS, CSS, mapa e imagens) no aparelho. Arquivos: cópia guardada e atualização em segundo plano. Páginas: rede por 3 segundos e, sem resposta, a cópia. `/api/` e `/q/` nunca são guardados. | essencial | feito |
| RNF07 | Offline | Sem rede, a programação mostrada é a de exemplo embutida (`data.js`). Guardar a última programação vinda da API é uma melhoria planejada. | importante | planejado |
| RNF08 | Atualização | Versão do cache gerada por `npm run pwa` (`scripts/build-pwa.py`); o app avisa quando há versão nova e a pessoa decide atualizar. | importante | feito |
| RNF09 | Segurança: sessão | Cookie `etal_sessao` assinado (itsdangerous), `HttpOnly`, `SameSite=Lax`, `Secure` em produção, validade de 30 dias. | essencial | feito |
| RNF10 | Segurança: QR | O QR leva um token assinado com o segredo do servidor; não dá para inventar um válido. A janela de horário reduz o uso de foto do QR fora da sala. | essencial | feito |
| RNF11 | Segurança: limite | Limite de requisições por IP, em memória: 5 por minuto para pedir link de visitante e 20 por minuto para presença. Resposta 429. | importante | feito |
| RNF12 | Segurança: SUAP | OAuth2 com `state` em cookie. A senha é digitada no SUAP e nunca passa pelo app nem pela API. O app só recebe nome, e-mail, matrícula, campus e foto. | essencial | feito |
| RNF13 | Segurança: link | O token do link de visitante é guardado só como hash SHA-256, expira em 30 minutos e vale uma vez. | essencial | feito |
| RNF14 | Segurança: transporte | Em produção, HTTPS automático pelo Caddy, com HSTS, `nosniff` e política de referência. CORS restrito às origens configuradas. | essencial | feito |
| RNF15 | Segurança: segredos | Segredo, senha do banco, código de homologação e credenciais do SUAP ficam no `.env` (fora do Git). Trocar o segredo invalida sessões e QRs impressos. | essencial | feito |
| RNF16 | LGPD | Os dados pessoais (inclusive de menores de idade) ficam no servidor do IFRN, dentro da instituição. A versão de teste na Vercel (Neon) usa só dados fictícios. | essencial | parcial (falta definir o responsável pelos dados e o texto de consentimento oficial) |
| RNF17 | LGPD | Coleta mínima: visitante informa nome, e-mail, instituição e cidade; SUAP fornece o necessário para a identificação. O cadastro de visitante tem campo de consentimento no app. | essencial | feito |
| RNF18 | Acessibilidade | Rótulos `aria-label` nos botões de ícone, regiões `aria-live` para avisos, tema claro e escuro, cores derivadas do destaque com contraste garantido, respeito a `prefers-reduced-motion`, rota acessível (rampa) na busca. | importante | parcial (sem auditoria formal; leitor de tela não testado) |
| RNF19 | Disponibilidade | A API roda com um processo só, porque o canal SSE fica na memória. Para mais de um processo, trocar por LISTEN/NOTIFY do PostgreSQL ou Redis. | importante | feito (limitação documentada) |
| RNF20 | Compatibilidade | Leitura de QR dentro do app depende de `BarcodeDetector` e HTTPS. Onde não existe (por exemplo, iPhone), vale a câmera do celular com `/q/<token>`. | importante | feito |
| RNF21 | Manutenibilidade | Código em português, sem framework no app, API em módulos pequenos (`rotas/`), configuração por variáveis `ETAL_*`, testes automatizados e CI a cada push. | importante | feito |
| RNF22 | Manutenibilidade | Banco criado no início da API (`create_all`). Migrações versionadas com Alembic são necessárias antes de qualquer mudança de esquema com dados reais. | importante | planejado |
| RNF23 | Portabilidade | Implantação com Docker Compose (Caddy, API e PostgreSQL) em qualquer máquina com Docker. | importante | feito |
| RNF24 | Observabilidade | `GET /api/saude` testa a conexão com o banco, usada na verificação do deploy. Sem métricas nem logs centralizados. | desejável | parcial |
| RNF25 | Fuso horário | Horários das atividades guardados no horário local do campus (`America/Fortaleza`), sem fuso. | importante | feito |
