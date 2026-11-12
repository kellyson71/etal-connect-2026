# Contexto do mapa 3D (para continuar em outra conversa)

Estado em 11/11/2026. Complementa `mapa3d/LEIAME.md` (detalhes de cada correção do modelo) e o `AGENTS.md` da raiz (regras do projeto). Ler os três antes de mexer no mapa.

## O que é

`mapa3d/` é o mapa novo do campus IFRN Pau dos Ferros, em WebGL com three.js r160 (em `vendor/`, sem CDN). Desde a 0.6.0 é o **mapa padrão do app**. O mapa anterior, em Canvas (`prototipo/campus3d.js`), continua guardado como **mapa clássico** (Perfil → Personalizar → Mapa, `?mapa=classico`); a exportação em arquivo único e a qualidade 2D usam o clássico. Não apagar o clássico.

- Bancada: `python3 mapa3d/servir.py` → http://127.0.0.1:8772/mapa3d/ (recarrega sozinha quando um arquivo muda).
- No app: `prototipo/rodar.sh` → http://127.0.0.1:8770/?tela=mapa. O app embute o mapa num iframe; `npm run pwa` copia `mapa3d/` para `prototipo/mapa3d/` (gerado, ignorado no Git) e atualiza o cache offline. **Rodar `npm run pwa` depois de qualquer mudança no mapa**, senão o app mostra a versão antiga (e limpar o service worker no navegador ao testar).
- Celular na mesma rede: `REDE=<ip> prototipo/rodar.sh` e abrir http://<ip>:8770/?tela=mapa (HTTP, sem modo offline).
- Testes: `node --test mapa3d/tests/rotas.test.mjs` (5 testes de rota).
- `mapa3d-cartoon/` é uma cópia antiga de teste (estilo maquete, do Codex). Não é usada; o usuário não quer cópias de sugestão. Perguntar antes de apagar.

## Como o usuário trabalha e o que espera

- Escreve em português, por voz (transcrição com erros: "swap" = SUAP, "cartum" = cartoon). Responder em português correto.
- Quer ver o resultado no Chrome dele (abrir a página ao terminar algo visual).
- Corrige detalhes do lugar real com precisão (portões, guarita, caminhos, salas). O que ele diz vale mais que o satélite ou a planta de 2012. Na dúvida sobre o lugar, perguntar; não inventar.
- Não quer trocar textura nem iluminação do modelo realista, nem ganhar outra cópia "de sugestão". Prefere ser consultado por perguntas antes de mudanças de direção visual.
- Commits: nunca mencionar IA (regra global). Horas reais (mtime dos arquivos), git flow (`feature/*` → `develop` com `--no-ff`, `release/x.y.z` → `main` com tag anotada → `develop`), sem PR. **Na última conversa ele pediu para não commitar até resolver tudo**: perguntar antes de commitar.

## Estado do Git

- Ramo atual: `feature/passeio-campus` (saiu do `develop` depois da 0.6.0). Tem 4 commits do passeio (personagem, carros, modo Passear, celular).
- **Sem commit ainda** (18 arquivos): física (`src/colisao.js`), entrada no bloco, voo, turbo e efeitos, modo computador, portaria corrigida, recepção aberta. Commitar com as horas reais quando o usuário liberar; depois juntar ao `develop` e, se ele pedir, fazer a release.
- `main` e `develop` estão no GitHub até a 0.6.0 (tag `v0.6.0`). O ramo do passeio não foi enviado.

## Arquitetura (`mapa3d/src/`)

| Arquivo | Papel |
|---|---|
| `main.js` | Monta a cena, laço de desenho (só desenha quando algo muda), duas passadas de render (com o bloco aberto, bloco, maquete e rota vão na camada 1, por cima do campus), hora do céu, liga abertura, palco, viagem, passeio e interface. `window.MAPA3D` expõe tudo para depurar. |
| `dados.js` | Dados do levantamento e da planta (`window.PLAN` de `prototipo/plan-data.js`), `wp()` planta→mundo, prédios, rodovia, `GUARITA`/`PEDESTRE`, `altura()` do terreno baixo. |
| `geo.js` | `Lote`: junta a geometria por material (uma malha por material). |
| `texturas.js` | Texturas feitas em código e os shaders injetados: `DESAT` (desbotar), `ISO` (esmaecer para o fundo), `VEU` + `VEUS` por parte (véu de cor do evento), `comVeu()`, `desaturavel()`. |
| `terreno.js`, `predios.js`, `detalhes.js`, `vegetacao.js`, `entorno.js` | Chão, muro e calçadas; prédios; portaria, pátio, mesas, postes, luzes; árvores (instâncias, troncos marcados com `userData.tronco`); bairro, Brisanet, apartamentos, Elétrica, serras. |
| `principal.js` | Bloco principal real a partir da planta de 2012: salas fechadas com tampa e número, portas, corredores, rampa e escada (`subida-k`), cartazes, armários da 108. Corte por plano (`fatiar`, `escalonar`, `corteDe`). |
| `interior.js` | Maquete simples do bloco. Hoje só mostra a **sala escolhida** subindo verde na chegada (`soSala`) e serve para tocar nas salas; os andares visíveis são o prédio real. `mapear()` leva um ponto real para a posição em escada. |
| `estilo.js` | Modo Evento: véu de cor por parte (bloco verde, auditório azul, cantina laranja, pátio verde-claro), campus desbotado; legenda. |
| `palco.js` | Estado único das aberturas: `abre`, `esc` (escada), `ops`/`elos` (opacidade de andares e subidas), `chegada`, `plano` (2D), `corte`, `iso`, `isoMax`. Interpola com a câmera (`ir`). |
| `camera.js` | Câmera por pose (alvo, distância em log, elevação, azimute), `mistura`, `enquadrar` fora do cartão. |
| `rotas.js` | Rotas: grade A* na planta, portas em cadeia, rampa/escada, caminhos de fora em grafo, bebedouros, origem na atividade atual. `START` é o vão do portão de pedestres. |
| `viagem.js` | Animação da rota (atos abaixo). |
| `abertura.js` | Voo de entrada e destaque do evento. |
| `interface.js` (+ `interface.css`, `index.html`) | Busca, cartão, modos Evento/Andares/Campus (Passear é segredo), botões de andar e 2D, legenda, pílulas, toque nas salas, mensagens com o app. |
| `passeio.js` | Personagem, carros, voo, câmera em terceira pessoa, controles. |
| `colisao.js` | Física do passeio (grade de obstáculos e altura dentro do bloco). |
| `moveis.js` | Portas que giram e cones que tombam quando alguém encosta. |
| `subidas.js` | Perfil da rampa, medidas da escada e paredes da rampa (geometria, rota e física usam o mesmo). |

Assets: `assets/modelos/` (Kenney, CC0) e `assets/sketchbook/` (personagem `boxman.glb` e carro `car.glb` do Sketchbook, swift502, MIT; créditos e licença na pasta).

## Animações

### Abertura (`abertura.js`)
- Primeira visita (chave `etal-mapa-novo-abertura` no localStorage), ou `?intro=1`: voo contínuo por Catmull-Rom em pose (de cima com o horizonte → aproximação → passagem baixa sobre a Elétrica e a rodovia → vista do evento), ~5,4 s, relógio a partir do primeiro quadro.
- Destaque do evento no fim do voo: o campus perde a cor (`DESAT` 0→0,42) e bloco, cantina, pátio e obelisco **sobem do chão com um salto** (escala y com ultrapassagem), um de cada vez, cada um ganhando o véu da sua cor (`VEUS`).
- Visitas seguintes: aproximação curta. `?intro=0` pula. Rota pedida pelo app pula a abertura. `MAPA3D.abertura.congelar(ms)` prende um instante para revisar.
- Também no computador o mapa abre com a abertura, no modo Evento (antes entrava direto no passeio).

### Modo Evento e Campus
- Evento (padrão): véu de cor ~42% sobre as partes do evento (textura aparece por baixo), resto desbotado, legenda e pílulas sobre os prédios. Campus: cores naturais.

### Andares (`palco.js` + `principal.escalonar`)
- Abrir: o telhado sai e o prédio é cortado de cima até o teto das salas do último andar (abre 0→0,4); depois cada andar fica cortado logo acima das salas (plano de corte por andar) e os três se afastam **em escada** (cada um sobe 7,5 m e recua 30 m; abre 0,4→1). Rampa e escada (com as paredes da rampa) se inclinam pela mesma matriz. O entorno esmaece (no Campus, menos: `isoMax` 0,55).
- Botões 2/1/T: o andar escolhido **desce até a altura real** dentro do prédio; os de baixo ficam fantasmas, os de cima somem. Vindo do prédio fechado, primeiro abre em escada e depois foca. Funciona em qualquer modo.
- 2D: câmera de cima e o andar achatado (não há planta SVG; o usuário achou a planta 2D "tenebrosa").
- Escolhas do usuário: zoom fluido (nada de teleporte), paredes visíveis (a maquete de blocos foi rejeitada por esconder paredes).

### Rota / viagem (`viagem.js`)
Atos: 0 voo até o campus · 1 linha da portaria até a entrada · 2 o bloco se abre em escada · 3 linha no andar de saída · 4 subida: os andares **descem até a altura real**, a câmera chega perto da rampa/escada e a linha sobe pela rampa inteira (ou pelos dois lances) sem pular; andares acima da ponta da linha ficam translúcidos · 5 corredor do andar de destino · 6 chegada: a sala sobe verde; se a porta ficaria escondida, a câmera gira devagar até ela. A linha usa pontos reais levados para a abertura atual a cada quadro. Destinos de fora (bebedouros do Anexo e da Cantina) ficam só no campus. No celular, o cartão recolhe e a legenda some durante a viagem. `MAPA3D.viagem.congelar(u)`/`pular()` para revisar.

### Passeio (`passeio.js` + `colisao.js`)
- Personagem do Sketchbook com a **foto do SUAP** redesenhada no papel do rosto da textura (o app manda `foto` e `nome`; sem foto, iniciais). Andar, correr (Shift), pular (Espaço), animações do próprio modelo.
- Carros: 4 por faixa na BR-405 (mão dupla, mantêm distância, param para quem estiver na pista) e 9 estacionados nas vagas, de cores diferentes. E entra (anda até a porta, abre, senta, fecha), dirige, sai parado.
- Física: grade de 25 cm feita da geometria (faces quase verticais entre 0,42 e 1,9 m acima do chão) para o chão e para cada andar do bloco; troncos como círculos; entrada principal e porta de vidro do Anexo abertas na grade. Dentro do bloco, altura pela planta e fração da rampa/escada (sobe 0→3,48→6,93 sem saltos). O prédio é cortado acima do andar e a câmera sobe para ver por cima.
- Voo (F ou botão): frente = para onde a câmera olha (olhar para cima sobe, para baixo mergulha); Espaço/C sobem e descem; Shift = turbo de 26 até 70 m/s. Pose aplicada nos ossos (`arm_upperL`… sem ponto no nome): braços **para trás** parado e no voo normal, **acima da cabeça** só acima de 15 m/s, e a troca passa **por baixo, pela frente do corpo** (ângulos medidos em `AJ`). Corpo segue a direção do voo e inclina nas curvas. Efeitos: riscos de vento, rastro fino, lente até 74°, bordas riscadas (`#p-veloz`), tremida acima de 40 m/s, anel de estrondo ao passar de 45 m/s. F de novo pousa com animação de queda.
- Computador: no passeio, sem botões de tela; clicar trava o mouse na câmera (Esc solta). `?passeio=0` abre o mapa normal. Celular: controle redondo e botões Correr, Pular, Voar (Subir/Descer no voo), Entrar/Sair.

## Fatos do lugar já confirmados pelo usuário (não desfazer)
- Portaria: a guarita (sala do porteiro, janelinha preta para a rua, portinha na passagem de pedestres) fica **entre o portão de veículos e o de pedestres**; o vão de pedestres fica **de frente para a passarela** (`GUARITA = [8.9, 11.5, 15.05]`).
- Recepção é o hall da entrada (aberto, balcão encostado na parede).
- Armários dos alunos: cinzas, na parede da sala 108, de frente para a 112, dois com adesivos.
- Não existe corredor colado no auditório; banheiro do auditório interditado; entrada do Anexo é a porta de vidro norte; bebedouros reais: entrada do Anexo, Cantina e patamar do 1º andar.
- Demais correções do modelo estão no `LEIAME.md` e no `AGENTS.md`.

## Revisão de 11/11 (interior, portas, cones, interface)

- **Rampa** (`principal.js`, `RAMPA_PAREDES` em `subidas.js`): parede do meio até o patamar, parede do lado da circulação, parede no fim da volta e, no térreo, parede fechando o vão debaixo da pista da direita (que ali está chegando no 1º andar; pedido do usuário). No 2º andar o vão é cercado e a pista da esquerda é fechada. A bordinha branca da rampa não entra na grade de colisão.
- **Escada** (`ESC`, `escadaPlanta` em `subidas.js`, usados por geometria, rota e física): faixa de piso de 2 m no lado sul de cada andar, por onde se entra vindo da circulação; lance da esquerda sobe, patamar de 1,3 m ao norte, lance da direita chega na faixa do andar de cima. Parede entre os lances e do lado da circulação; térreo fechado debaixo do lance que chega; 2º andar cercado.
- **Paredes por dentro**: fachadas e a caixa da entrada ganharam a face interna (antes, de dentro, não existiam).
- **Portas** (`folhaPorta` em `principal.js`, física em `moveis.js`): a parede tem o vão de cada porta (`wallsVaos`); a folha é uma malha solta presa na dobradiça, com mola. Entrada principal: vão de verdade com duas folhas de vidro. A grade de colisão abre o vão das portas (`colisao.js`), e `mover` escorrega de lado nas quinas (muitas portas ficam coladas no canto da sala).
- **Salas**: tampa é uma malha por sala (`principal.destampar`, `salaEm`); móveis simples por uso (`mobiliar`): carteiras e quadro, bancadas com monitores, mesas e armário. Ambientação, não levantamento.
- **Corredores** (`adornos`): bancos, murais, lixeiras, extintores e vasos (só térreo) encostados nas paredes das salas, longe das portas. Quadro de avisos na parede da direita de quem entra no hall, banco do outro lado, bebedouro no patamar do 1º andar.
- **Corte no passeio**: dentro do bloco o prédio é cortado 1,95 m acima dos pés (meia-parede, salas abertas por cima) e a câmera olha mais de cima; com a parede inteira a pessoa sumia atrás da sala da frente.
- **Cones** (`cones()` em `detalhes.js`, física em `moveis.js`): malhas soltas; empurrados pela pessoa e pelos carros, tombam com pancada acima de 2,4 m/s.
- **Pilar do hall**: o pilar do canto da cobertura do pátio caía dentro do hall e travava a passagem; foi posto do lado de fora, rente à parede da entrada (`coberturaPatio`). Confirmar com o usuário onde ele fica de verdade.
- **Abertura**: a interface fica escondida durante o voo (`body.abertura`) e entra com as cores do evento; tocar no mapa ou em "Pular" encerra.
- **Celular**: legenda cabe inteira, cartão sem destino fica pequeno, botões da rota numa linha, câmera do passeio recua em tela em pé e o passeio começa mais para dentro do portão.
- Bancada de revisão usada: Playwright com `/opt/google/chrome/chrome` e SwiftShader; simulação de caminhada chamando `fis.mover`/`alturaEm` e `MAPA3D.passeio.tick(t)` à mão (os quadros reais ficam lentos demais no headless). `tests/browser.py` está desatualizado (espera `#planta2d` e, no computador, a página abre no passeio).

## Primeira pessoa dentro do bloco (11/11)

- `passeio.js`, `tickCamera`: `cam.fp` vai de 0 a 1 quando a pessoa entra no bloco a pé (0,75 s para entrar, 0,6 s para sair). A câmera mergulha do braço da terceira pessoa até os olhos (1,62 m) mantendo a mesma direção do olhar, então não há corte; o olhar sobe para o horizonte na entrada e volta à inclinação anterior na saída. Lente de 38° para 64° (até 70° correndo), plano próximo de 2 m para 0,12 m, corpo escondido a partir de 72% da transição.
- Balanço de passo (`cam.bob`), andar de lado sem girar (A/D), olhar para cima até −1,2 rad. O prédio fica inteiro (sem corte) e ganhou forro no último andar e no hall.
- **V** (computador) ou o botão "Ver de cima" (celular, só aparece dentro do bloco) troca para a vista de cima com o prédio cortado em meia-parede; a escolha fica em `cam.fpLigada`.
- A direção do movimento agora vem do giro da câmera (`cam.yaw`), não da posição dela.

## Interface no celular e controle do passeio (11/11, pedido do usuário: "tudo na mão, no dedão")

- **Doca do dedão** (`interface.js`, `#doca`, `body.dedao`): em telas até 600 px, andares, cartão, busca e modos são movidos para uma doca na parte de baixo; em cima ficam voltar, legenda e ajustes. Em telas maiores voltam ao lugar.
- **Teclado numérico** (`#num-btn`, `#teclado`): botão "123" dentro da busca; cada dígito filtra as salas pelo número e, com número completo e único, abre a sala direto.
- **Controle do passeio**: alavanca à esquerda e botões redondos com ícone à direita (Pular grande, Correr, Voar, Visão, Entrar; no voo, Subir e Descer). Os botões usam `pointerdown` (`toque()` em `passeio.js`): com um dedo na alavanca, o segundo dedo não gera `click`, e era por isso que não dava para andar e pular ao mesmo tempo. `nomear()` troca só o texto do botão.
- **Tela deitada**: ao entrar no passeio em aparelho de toque, `deitar()` pede tela cheia e trava a orientação em paisagem; `levantar()` desfaz ao sair. Onde o navegador não deixa (iPhone), aparece o aviso "Vire o celular". Os iframes do app têm `allow="fullscreen"`.
- **Tela grande do app**: abre no modo Evento (`mapa3d/index.html?aba=1`); `?passeio=1` ainda força o passeio; a mensagem `etal:mapa:abrir` aceita `mode` e uma rota tira o mapa do passeio.
- Não testado em celular de verdade: multitoque, trava de orientação e tela cheia só foram conferidos por automação.

## Revisão de 11/11, parte 3 (pedidos do usuário pelo celular)

- **Carregamento** (`#carga` em `index.html`, `etapa()` em `main.js`): a cena é montada em etapas com `await` entre elas; o primeiro quadro é desenhado ainda sob a tela de carregamento. `pronta` impede o laço de desenhar antes do fim.
- **Abertura**: relógio por quadro com passo máximo de 50 ms (pelo relógio de parede, o primeiro quadro lento pulava o voo inteiro no celular); a marca de "já vista" foi para o `sessionStorage` (voo completo a cada abertura do app).
- **Rota**: `setOrigem` guarda a sala da atividade mas a saída padrão é a portaria (o usuário estranhou a linha saindo do Lab 210). `ES = 0.42` em `viagem.js`: na subida e no destino fica esse tanto da escadinha; nos atos 1, 3 e 5 a câmera chega mais perto e segue a ponta da linha.
- **Andares**: com andar em foco, `esc` continua 1 (escadinha montada), os outros dois andares ficam a 40% e a câmera enquadra o andar na posição dele na escada. As paredes da rampa e da escada ficam no grupo `paredes-k` e somem com a escadinha aberta (esticavam com a matriz).
- **Portas novas**: `fach(..., { vao })` abre a fachada (porta de vidro norte, saída para o Anexo); saída do hall do auditório em [206.5, 492] (em 220 caía na sala do Protocolo); porta dupla do auditório em [118, 302]. A porta norte do auditório ([225, 24]) continua pintada: por dentro ali é a sala do RH na planta.
- **Texturas piscando**: a face de dentro das fachadas estava no mesmo plano da de fora e o azulejo estava dos dois lados; agora a de dentro fica 6 cm para dentro e o azulejo de fora tem um lado só. Na primeira pessoa o plano distante cai para 900 m.
- **Luz por dentro**: `luzDentro` (PointLight que acompanha a pessoa, força 0 do lado de fora), lâmpadas `lampada` no forro dos corredores, vidros `janelaLuz` nas janelas vistas de dentro (a cor segue a hora, `principal.luzes`).
- **Física**: `mover` tenta desvios de até ±83° (desliza em parede inclinada, como as da rampa); dentro do bloco o raio do corpo é 0,24 m; pista da rampa com 2,54 m (de parede a parede); escada com faixa de 1,8 m e patamar de 1,5 m.
- **Voo**: marchas 9 / 20 / até 46 m/s (Shift = rápido, R = muito rápido; no celular o botão Correr passa por Normal → Rápido → Turbo). **Hora**: T ou o botão do sol (manhã, meio-dia, fim de tarde, noite).
- **App**: `html.passeio-cheio` (o mapa avisa `etal:mapa:passeio`) esconde a barra de abas durante o passeio; moldura some em qualquer aparelho de toque.

## Portas e fundos do bloco (11/11, informado pelo usuário)

- A planta de 2012 é antiga. A **saída do auditório** fica no trecho curvo da fachada, de frente para o caminho calçado que chega do pátio: porta dupla de vidro em [181, 490.7] (`principal.js`, laço de `AUD`); a rota do auditório entra por [181, 482] e o caminho de fora termina em [-30, -19.4] (`rotas.js`).
- **Fundos**: o corredor reto do térreo termina numa porta de vidro de **uma folha só** (`fach` com `vao.folhas: 1`), que dá numa calçada de uns 3,8 m (`CALCADA_FUNDOS` em `dados.js`, desenhada em `detalhes.js`) com quatro árvores em fila e redes entre elas (`REDES`). Suposição minha: três redes, uma em cada vão entre as árvores; o usuário disse "quatro árvores e uma rede em cada".
- **Protocolo**: a sala vazava 1,3 m para fora da fachada oeste; no gerador (`scripts/build-principal-plan.py`) ela passou a começar em x = 235, e a planta foi regenerada com `npm run planta`.

## Carregamento, modos e passeio secreto (11/11, parte 4)

Pedido do usuário: o mapa demorava para abrir, principalmente no modo Evento; o Evento deve focar só no campus, sem o
que há dentro das salas; o Campus mostra tudo, com melhor navegação e câmera mais baixa; o Passear vira easter egg.

- **Medição** (bancada headless com SwiftShader, `?intro=0`, tela de celular): antes ~8,5 s até a imagem, 36 programas
  de shader, 548 chamadas, 719 materiais; depois ~5,8 s, 26 programas, 436 chamadas. O primeiro quadro era o maior
  custo (compilar programas e subir texturas). `window.MAPA3D_CARGA` guarda a hora de cada etapa.
- **Um programa por tipo de material** (`injetar` em `texturas.js`): o véu de cor e o desbotar tinham chave de programa
  por cor (`veu4fa627p`…), e o mesmo código era compilado várias vezes. Agora todos usam a chave `etal` e a cor vai em
  uniform. Os materiais do bloco têm sempre dois planos de corte (`NUNCA`), para não dobrar os programas.
- **Compilação antes do primeiro quadro**: `renderer.compileAsync` só com o que aparece (`visiveis` em `main.js`; usa
  `KHR_parallel_shader_compile` onde o celular tem) e texturas enviadas uma a uma (`initTexture`) com a barra andando.
  Os materiais com plano de corte ficam de fora: o `compile` do three r160 não conhece o estado de corte e monta o
  programa errado.
- **Modo Evento só com o campus**: o entorno (bairro, caatinga, serras) e o recheio do bloco (móveis, portas das salas,
  cartazes, armários, adornos dos corredores, poltronas do auditório, janelas vistas de dentro, vasos dos corredores)
  não são montados na abertura. `principal.detalhar()` monta o recheio (grupos `detalhe-k`, guardados em `lotesDet`
  durante a construção) e `montarCampus()` faz isso junto com o entorno; `verCampus(on)` liga e desliga. Andares e rota
  ficam sem recheio (portas aparecem como vãos com batente). As portas de fora (entrada, auditório, fundos) continuam.
- **Modo Campus**: monta tudo na primeira vez (aviso "Montando o campus inteiro…" se demorar), compila antes de mostrar.
  Vista nova (`campusPose`): 31° em tela em pé (miolo do campus, da quadra à rodovia) e 28° deitada (campus inteiro),
  no lugar dos 48° de antes. Tocar num prédio (em Evento ou Campus) mostra o nome no cartão e aproxima (`tocarLugar`).
  Arrastar o mapa não leva o alvo para fora do campus (`LIMITE` em `main.js`); distância máxima 900 m.
- **Passear é segredo**: sem botão. Cinco toques seguidos no obelisco (o primeiro mostra o cartão sem mexer a câmera;
  do terceiro em diante, "Mais 2…"), "passear" na busca, ou `?passeio=1`. `passeio` em `main.js` é um substituto leve:
  o módulo `passeio.js` (com `colisao.js`, `moveis.js` e a luz de dentro) só é importado quando o segredo é achado, e
  antes disso o campus completo é montado. `MAPA3D.passeioReal` é o objeto de verdade, para depurar.

## Pendências e pontos em aberto
- Testar o passeio com teclado e mouse de verdade (testado por automação, com a aba em segundo plano, que deixa tudo lento); o travamento do mouse não foi testado por automação.
- Confirmar com o usuário: posição real do pilar da cobertura junto à entrada, lado e conteúdo do quadro de avisos, o que há de fato nos corredores e dentro das salas.
- Banheiros (sem porta na planta) e auditório continuam fechados no passeio. Atualizar `tests/browser.py`.
- Em velocidade máxima a câmera fica longe e o personagem pequeno; o usuário pode pedir mais perto.
- O mapa clássico continua com a portaria antiga.
- Decidir com o usuário: commits do que está pendente, juntar `feature/passeio-campus` ao `develop`, release, e o destino de `mapa3d-cartoon/`.
