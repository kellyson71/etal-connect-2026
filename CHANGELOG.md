# Histórico de versões

O projeto segue o git flow: `main` tem só versões publicadas, `develop` junta as funcionalidades e cada uma nasce num ramo `feature/*`.

## Não lançado

ETAL 2026
- Inscrições abertas no SUAP (evento 10301): os 13 minicursos da programação de 2026 ganham o botão Inscrever-se com o link do evento. O `docker-compose.yml` passa a apontar `ETAL_SUAP_INSCRICOES_URL` para 2026, valendo mais que o `.env` do servidor.

Painel
- Importar planilha na aba Programação: cola as linhas do Google Sheets ou escolhe um CSV, confere a prévia (novas, atualizadas e com erro) e grava tudo de uma vez (`POST /api/org/programacao`). O Exportar CSV sai nas mesmas colunas, para editar e importar de volta.

## 0.13.0 (2026-11-27)

ETAL 2026
- Programação final do ETAL 2026 (3 e 4 de dezembro) em `backend/seed/programacao-2026.json`: credenciamento, os 13 minicursos com sala e ministrante, competições, palestras, mesas, apresentações e encerramento.
- Com `ETAL_PROGRAMACAO_INICIAL`, a API carrega a programação ao iniciar só se o banco ainda não tem atividades; depois, quem manda é o painel. O `docker-compose.yml` já aponta para a de 2026.
- Com servidor, os dias do evento e o "agora" saem da programação (antes eram os de 2025, fixos), com o mês certo nas telas e no crachá. Antes do evento tudo aparece como por vir; depois, como encerrado.
- Campeonatos: os de exemplo de 2025 saem; sem chaves publicadas, a tela mostra as competições da agenda.
- Lugar ainda sem marcação no mapa aparece sem a prévia 3D; o exemplo embarcado só complementa a mesma atividade (mesmo dia).

Entrada e divulgação
- O painel manda quem não entrou para a entrada do ETAL e, depois de entrar, volta direto para a página pedida, sem a abertura do crachá. O botão do crachá passa a dizer Entrar no ETAL.
- Prévia do link com a arte do ETAL Connect (Open Graph) no WhatsApp e nas redes.

## 0.12.0 (2026-11-27)

Perfil, avaliações e pessoas
- Perfil em passos, com progresso e crachá ao vivo, guardado também no servidor; fundo do crachá escolhido no perfil.
- Segunda leitura do QR da sala, perto do fim, vale como saída e libera a avaliação da atividade (estrelas, comentários rápidos e comentário aberto).
- Busca de pessoas pelo nome, com o perfil público: o que a pessoa fez, conduziu e a colocação nos campeonatos. A mesma pessoa não aparece duas vezes.
- Painel: participantes por categoria (inscritos, presentes, até o fim, avaliaram, faltaram), NADIC, curso e interesse; planilha CSV do filtro atual e link para o Google Sheets (`=IMPORTDATA`); dados do público; ranking e comentários das avaliações, sem nomes.

Inscrições do SUAP
- O servidor lê a página pública de inscrição do evento no SUAP e põe na agenda de cada pessoa as atividades em que ela está inscrita; os minicursos mostram as vagas reais.
- Minicurso não se salva no app: mostra as vagas, o selo Inscrito e leva à inscrição no SUAP. A importação de inscritos ganha a coluna de atividades.
- Programação sempre completa, com Minha agenda como filtro; o início junta o destaque e a agenda da pessoa num bloco só; edição de perfil unificada.

Entrada e publicações
- Visitante sem servidor de e-mail entra direto, sem confirmar o e-mail; por isso essa entrada nunca dá acesso à organização e recusa e-mails de contas do SUAP. Com SMTP, continua o link de uso único.
- Antes do evento, quem entrou já publica, comenta e usa o chat; durante o evento, continua valendo o QR da recepção.

Correções
- Mapa 3D reabre sozinho quando o navegador derruba o contexto WebGL, com a câmera guardada; a planta de reserva ganhou Tentar de novo.
- Horas dos certificados sem resto de ponto flutuante e com vírgula (1,5 h).
- Vercel: deploy de produção pelo GitHub Actions a cada push no `develop`.

Preparo para o evento
- Banco com migrações (Alembic): a API aplica as que faltam ao iniciar, e um banco antigo é atualizado sem perder dados.
- Limites por pessoa e não por rede (o Wi-Fi do campus sai por um endereço só): 6 senhas erradas por matrícula por minuto, com um teto por rede; links de visitante e leituras de QR também limitados.
- Fila curta para o SUAP: um número fixo de entradas conversa com ele ao mesmo tempo; quem passa de 12 s de espera vê a contagem e o app tenta de novo sozinho.
- Materiais das atividades em disco, abertos no app ou baixados.
- Presença lida sem internet: o app guarda só QR do ETAL, avisa que ainda não vale e envia quando a rede volta; o servidor confere a hora da leitura com as regras de sempre.
- Teste de ponta a ponta da presença sem rede, com a API de verdade, na CI.
- `docs/regras-de-negocio.md`: as regras do app em anotações.

Publicações no servidor
- Feed com fotos, comentários, chat geral, curtidas, salvos, denúncias e moderação passam a ficar no servidor (antes, só no aparelho), com as mesmas telas.
- Chegam ao vivo para quem está com a tela aberta; o aviso leva só a versão, e o app só busca de novo se algo mudou.
- Fotos regravadas no servidor, sem a localização; matrícula e e-mail de quem publica não vão para os outros.
- Três denúncias de pessoas diferentes tiram o conteúdo do ar até a organização revisar; toda moderação fica no histórico.
- Limites por pessoa e limpeza depois de 90 dias (`python -m app.manutencao publicacoes`).
- Moderação também no painel do computador, pela API.

Publicação no servidor do NADIC
- Duas imagens prontas, publicadas no GitHub Container Registry a cada push na `main`, no mesmo modelo do horários: o app (Caddy com o site e o mapa 3D já montados) e a API. O servidor só precisa do `docker-compose.yml` e do `.env`; com os segredos de SSH, o GitHub também atualiza o servidor.
- Corrigido: a imagem da API não levava as migrações do banco e não subia; e o mapa 3D (gerado no build) ficava fora do site servido pelo Docker.
- O app fica atrás do proxy do servidor (trechos prontos para nginx e Apache) ou, com as portas livres, pede o próprio certificado.
- Vercel mais econômica: o app consulta a cada minuto, só com a aba visível (antes, a cada 12 s), e a programação e os avisos voltam 304 sem corpo quando nada mudou. No plano gratuito, as consultas de abas abertas tinham estourado a cota do mês.
- Versão de teste na Vercel em dia com as migrações e as dependências novas (antes quebraria na próxima versão), com teste para não voltar a quebrar.
- `deploy/README.md` (passo a passo), `deploy/diagnostico.sh` (o que o servidor tem) e `deploy/backup.sh` (banco e arquivos, 14 dias).

Plano B
- Listas de presença em papel para imprimir pelo painel (uma por atividade, já com quem salvou na agenda) e o lançamento delas depois, com presença marcada como manual.
- `docs/contingencia.md`: o que fazer se o app, a internet, o SUAP ou o servidor falharem.

Monitoramento e teste de carga
- Uma linha JSON por requisição (rota sem tokens, sem IP nem dado da pessoa) e rodízio dos logs no Docker.
- Painel da organização → Servidor: requisições, tempos, erros, fila do SUAP, celulares ao vivo e movimento dos últimos 10 minutos.
- Verificação de saúde com o banco, usada pelo Docker.
- Teste de carga (`scripts/carga/rodar-local.sh`): 700 pessoas na abertura, com PostgreSQL e um SUAP de mentira. Resultados em `docs/tecnico/09-teste-de-carga.md`.
- Por causa do teste: o teto da rede no login conta só senha errada (antes barrava 498 de 700 pessoas atrás do mesmo Wi-Fi); fila do SUAP de 8 para 16; o app insiste por até 4 minutos com a fila cheia.

## 0.11.0 (2026-11-15)

- Código do app dividido por assunto: 30 partes em `prototipo/app/` (entrada, início, agenda, atividade, publicações, mapa, campeonatos, organização, leitor de QR, navegação, servidor…), montadas no `app.js` por `npm run app`, sem mudar o comportamento.
- As 115 ações dos botões saem de um `switch` de quase 1.000 linhas e viram um registro por assunto (`ACOES`, arquivos `25-acoes-*.js`).
- Estilos em 27 partes em `prototipo/estilos/`, montadas no `app.css` na mesma ordem.
- Código que ninguém usava sai do app e do mapa clássico.
- Teste no navegador (`npm run test:navegador`, também na CI): 19 telas e as ações de cada uma, sem erro de JavaScript.
- `prototipo/LEIAME.md` explica a organização do protótipo.

## 0.10.0 (2026-11-15)

Mapa
- Modo Evento como mapa ilustrado: cores chapadas por categoria (grama, vias, calçadas, prédios, telhados), partes do evento em cor cheia, contornos nas quinas e etiquetas com ícone. O modo Campus continua realista.
- Tema escuro do mapa ilustrado, com a luz seguindo o horário (sol e sombras de dia; luar, janelas e postes à noite) e um selo de dia ou noite.
- Como chegar como um GPS: o bloco fica inteiro, só o andar atual em destaque; a pessoa anda em ritmo constante, desacelera na entrada e na escada ou rampa e sobe na vertical; marcador com seta e pino do destino que aparece no andar certo. Mais rápido que antes.
- Celular: pinça no ponto dos dedos, giro e inclinação separados, toque duplo para aproximar; tocar o mapa solta a câmera de uma animação.
- Toque duplo no bloco principal abre os andares; nos outros lugares (auditório, cantina, pátio) mostra a programação deles, com o que está acontecendo agora e a próxima, e "Ver na programação" abre a Agenda só com aquele lugar.

Projeto
- Repositório organizado: saem o modelo React/Vinext do começo e as cópias antigas do mapa (guardados na tag `antes-da-organizacao`); scripts em pastas por assunto; dados do campus em `dados/`; documentação reunida em `docs/` com um índice só; o arquivo único para duplo clique passa a ser gerado em `dist/` e anexado às versões.
- Prettier, ESLint e EditorConfig; `npm test` reúne os testes; CI do front-end com lint, formatação e testes.
- Material de terceiros (fotos do Google Maps, dissertação de 2012) fica fora do repositório, com as fontes citadas.

## 0.9.2 (2026-11-12)

- Painel: espaço abaixo da busca; avisos, painel da sala e campos acompanham o tema escuro.

## 0.9.1 (2026-11-12)

- Painel da organização no computador também no celular: abas embaixo, tabelas em cartões, tema escuro e menos texto; sem a planta de 2012.

## 0.9.0 (2026-11-12)

- Agenda com card limpo por tipo (hexágono com o ícone, cores do logo do ETAL) e detalhe da atividade com hierarquia: quando, vagas e a sala no mapa primeiro, textos depois.
- Leitura de QR por tipo: campeonato em tela toda com a arte do jogo; aula, palestra e mesa-redonda numa folha com a ação certa.
- Campeonato redesenhado: chave em rodadas com duelos, elenco com a situação de cada jogador e regras em passos.
- Organização por matrícula: painel em destaque no Perfil, só para organizadores, com resultados, regras, inscrição manual, troca de sala, avisos, credenciamento manual e equipe pelo celular.
- O app segue a hora do aparelho; tema claro/escuro num toque na home, acompanhado pelo mapa; convite leve para instalar o app.
- Mapa: um só, mantido entre as abas (não recarrega); andar em foco mais perto; auditório se abre com o térreo; rota do auditório pelo pátio e pela passagem entre os canteiros; próxima atividade numa pílula; cartão de rota enxuto.
- Servidor local em HTTPS (`HTTPS=1`) para testar o leitor de QR no celular.

## 0.8.0 (2026-11-11)

- Mapa 3D abre mais rápido: um programa de shader por tipo de material (o véu do evento gerava um por cor), shaders e texturas preparados durante o carregamento.
- Modo Evento só com o campus, sem o bairro em volta e sem o que há dentro das salas; o modo Campus monta tudo na primeira vez, com câmera mais baixa, toque nos prédios e arraste limitado ao campus.
- O passeio virou segredo do mapa (e só é baixado quando alguém o acha). No computador, o mapa abre no modo Evento.
- QR Codes de teste numa página só (`qrs.html`): a câmera do celular abre o app e faz a leitura depois da entrada.
- Agenda redesenhada: card limpo por tipo de atividade (palestra, mesa-redonda, minicurso e oficina, campeonato), com as cores dos hexágonos do logo do ETAL; campeonatos com a arte de cada jogo. Detalhe com bloco próprio por tipo.
- Documentação em PDF (`docs/pdf/`) com índice em `docs/README.md`; PDFs mais leves; comparação dos mapas de 204 MB para 7,5 MB.
- README mais curto, com os logos do ETAL e do NADIC e prints novas.

## 0.7.0 (2026-11-11)

- Modo Passear no mapa: personagem com a foto do SUAP no rosto, carros passando na BR-405 e estacionados que dá para dirigir (modelos do Sketchbook, MIT).
- Física no passeio a partir da geometria do mapa, entrada no bloco principal pela porta, rampa e escada, e voo com câmera própria. No computador, o mapa abre direto no passeio, com mouse e teclado.
- Portão de pedestres de frente para a passarela, com a guarita entre ele e o portão de veículos.
- Por dentro do bloco no passeio: portas que abrem quando empurradas (entrada de vidro e portas das salas), salas com móveis, corredores com bancos, murais, lixeiras e extintores, quadro de avisos no hall e bebedouro no patamar do 1º andar.
- Rampa e escada corrigidas: parede debaixo da pista que chega do andar de cima, vão cercado no último andar, escada com faixa de piso por onde se entra. Paredes de fora agora existem também por dentro.
- Cones da rua soltos: dá para empurrar e derrubar, a pé ou de carro.
- Primeira pessoa dentro do bloco principal: a câmera entra nos olhos do personagem ao passar pela porta e sai ao deixar o prédio, com balanço de passo; V (ou o botão) troca para a vista de cima.
- Home mais leve: cenário do campus em camadas (serras, névoa, fachada com janelas, carnaúbas, sol sem anéis, pássaros), atalhos numa fileira de pílulas, "Ao vivo" numa linha, seções que entram ao rolar.
- Colmeia redesenhada: favos com relevo de mel, brilho e um desenho próprio para cada conquista; lista com favo por linha.
- Mapa no celular ao alcance do dedão: busca, cartão, modos e andares numa doca embaixo; teclado numérico "123" acha a sala a cada dígito.
- Passeio no celular: tela cheia e deitada, controle em formato de gamepad com ícones; os botões respondem no toque, então dá para andar e pular (ou voar) ao mesmo tempo.
- Computador: sem moldura de celular. O app fica numa coluna e o mapa ocupa o resto da tela, já no passeio; "Ver como celular" volta para a moldura.
- Mapa: tela de carregamento com barra e etapas; o voo de entrada roda a cada vez que o app é aberto e não é mais pulado em aparelho lento; a rota sai da portaria; na subida fica um pouco da escadinha e a câmera acompanha a ponta da linha; com um andar em foco a escadinha continua montada.
- Bloco principal: porta de vidro dos fundos (Anexo), saída do hall do auditório e porta do auditório abrem de verdade; luzes no forro, janelas claras por dentro e luz junto de quem anda; paredes de fora não piscam mais; rampa de parede a parede e deslize em paredes inclinadas.
- Passeio: três marchas no voo (normal, rápido, muito rápido), troca da hora do dia (T ou o botão do sol).
- App: sem moldura em qualquer aparelho de toque (também deitado); Agenda em linha do tempo com cor por tipo; Perfil só com o essencial e o resto em "Mais opções"; home sem "Programação de hoje", Campeonatos e Avisos.
- Abertura sem a interface por cima (tocar pula) e ajustes no celular: legenda inteira, cartão menor sem destino, botões da rota numa linha.

## 0.6.0 (2026-11-11)

Reformulação completa do mapa.

- O mapa novo (`mapa3d/`) passa a ser o padrão do app. O mapa anterior (`prototipo/campus3d.js`) fica guardado como **mapa clássico**: Perfil → Personalizar → Mapa, ou `?mapa=classico`.
- Abertura do mapa no estilo da original, com voo contínuo e as partes do evento subindo do chão, cada uma com a sua cor.
- Andares do prédio real (paredes, portas, piso, cartazes e armários) abertos em escada; botões de andar animados em todos os modos.
- Rota pela rampa e pela escada sem saltos: os andares descem até a altura real e a câmera acompanha a subida.

## 0.5.0 (2026-11-09)

- Leitor de QR com o servidor: a câmera trava no código, registra a presença e mostra o cartão de confirmação com a última imagem atrás; "Ler outro QR" reabre a câmera.
- Nome vindo do SUAP com as iniciais em maiúscula.
- Salas da programação de exemplo iguais à planta (React Native no Lab 210, FastAPI no Lab 209).
- O bloco de entrada fica sob a cobertura do pátio, como no lugar.
- Crachá preenchido sem a dica "Puxe o crachá para baixo".
- Servidor do protótipo com `ETAL_API` para usar a API local.
- Apresentação como proposta para a organização: telas do participante gravadas com o SUAP de verdade, um passo por slide.

## 0.4.2 (2026-11-09)

- Bloco de entrada do bloco principal no modelo do campus: o volume que sai do térreo, com pastilha azul, painel de boas-vindas, letreiro e porta de vidro, visível através da cobertura do pátio.

## 0.4.1 (2026-11-09)

- Pátio interno: a mureta fecha também as pontas do vão, ligando as salas dos dois lados.
- Na vista de fora, o pátio aparece fundo, no térreo, com as varandas do 1º e do 2º andar.

## 0.4.0 (2026-11-09)

Primeiro teste como produção.

- Entrada pelo SUAP de duas formas: pela página do SUAP (OAuth2) ou com matrícula e senha (token JWT da API do SUAP). Senha e token não ficam guardados.
- Sem moldura de celular nem enfeites de demonstração quando há servidor.
- Mapa pensado para o polegar: abas e busca embaixo, 3D/2D e controles numa coluna à direita; sai o cartão "Onde o ETAL acontece".
- Busca colada no teclado, com Banheiro, Bebedouro e Descanso à mão e o botão Atividades; o melhor resultado fica junto da barra, e Enter abre com a rota.
- Rota até o bebedouro mais próximo.
- Pátio interno: jardim só no térreo; no 1º e 2º andar, vão aberto com mureta de ponta a ponta.
- Documentação técnica (requisitos, casos de uso, banco de dados, arquitetura, API e testes).

## 0.3.0 (2026-11-09)

O app passa a funcionar de verdade, com servidor.

- API em FastAPI com banco (SQLite para desenvolver, PostgreSQL em produção): entrada pelo SUAP (OAuth2) e de visitante por link no e-mail, programação, agenda com vagas, presença por QR assinado, avisos ao vivo e painel da organização.
- App e painel ligados à API; sem ela, seguem com os dados de exemplo.
- Leitor de QR com a câmera do aparelho (BarcodeDetector ou jsQR) e QR lido pela câmera do celular abrindo o app.
- Página `/homologacao` com entrada de teste e os QRs para ler; `/demo` com as ferramentas de teste no leitor.
- Versão de teste na Vercel (API como função Python e PostgreSQL Neon), publicada a cada push no GitHub.
- Implantação no IFRN com Docker Compose e Caddy; testes no GitHub Actions.

## 0.2.0 (2026-11-09)

Mapa e planta revisados com o campus de hoje.

- Crachá que desce puxando, conquista da colmeia e participação confirmada.
- Entorno da BR-405: apartamentos, Elétrica, Brisanet, faixas, calçada, postes e as duas entradas.
- Planta interna refeita a partir das plantas de 2012, com o uso atual das salas e marcas com ícones.
- Sol e sombras pelo horário, luzes da noite, jardim e obra do prédio novo do NADIC.
- Busca por salas, atividades, banheiros e bebedouros, com o mais próximo primeiro.
- Animação de entrada do mapa e rota automática antes da atividade.

## 0.1.0 (2026-11-07)

Primeiro protótipo navegável.

- Telas do app: entrada, início, programação, agenda, atividade, crachá e QR do evento.
- Mapa do campus em 3D, com os prédios do fundo importados do KML e o entorno.
- Planta do bloco principal e rota a pé até a sala.
- PWA instalável, com uso sem internet.
- Painel da organização para computador.
