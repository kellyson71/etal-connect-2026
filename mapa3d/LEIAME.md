# Modelo 3D novo do campus (em construção)

Bancada separada do protótipo, para refazer o mapa em 3D de verdade (WebGL, three.js) com mais detalhe.
Desde 11/11/2026 é o mapa padrão do app; o anterior (`prototipo/campus3d.js`) fica como mapa clássico.

Abrir: `python3 mapa3d/servir.py` e depois http://127.0.0.1:8772/mapa3d/ (a página recarrega sozinha quando um arquivo muda).

- As posições vêm dos mesmos arquivos do protótipo (`prototipo/campus-*.js`, `plan-data.js`), lidos direto de lá. As listas de prédios e alturas em `src/dados.js` são cópia das de `prototipo/campus3d.js`.
- O bloco principal sai da planta de 2012 (`src/principal.js`): salas, corredores, portas, rampa, escada e pátio interno. O contorno externo segue a planta, não o polígono do levantamento (diferença de até cerca de 1 m).
- Texturas feitas em código (`src/texturas.js`), com cores e desenhos tirados das fotos de `referencias/imagens/google-maps`. Nenhuma foto entra no modelo.
- Árvores, palmeiras: Nature Kit da Kenney, CC0 (`assets/modelos/CREDITOS.txt`). three.js r160 em `vendor/` (MIT).
- Correções informadas pelo usuário (nov/2026), que valem mais que o satélite: sem árvores na passarela da entrada (quatro à esquerda, sobre as motos); totem dentro da sebe da esquerda; guarita junto ao portão de pedestres; portão de veículos comum, com blocos amarelos que fazem a curva para a esquerda; árvores da frente só nos canteiros em pílula junto ao muro; jardim da direita com caminhos largos de placa e faixa amarela e duas mesas de pedra em volta de árvores; jardins junto ao bloco são gramados; piso de bloquete entre bloco, cantina e Anexo; Anexo com dois níveis de vidraça e porta no meio (7,4 m); terreno 65 cm mais baixo entre a biblioteca e o Anexo e no pátio das caixas d'água (`BAIXO` em `src/dados.js`), com calçada alta rente ao ginásio até o fim da academia.
- Mais correções do usuário: calçadas de 3,2 m coladas no Anexo, biblioteca, ginásio e academia, com borda amarela tátil, e terreno 90 cm abaixo entre elas; do ginásio para os fundos é calçamento; caminhos do coreto elevados com faixa amarela e bloquete em volta dele; rampa e escada fechadas por paredes (quem sobe não vê quem desce), rampa de borracha preta; pilares da cobertura do pátio nas pontas; ilha gramada com mureta de tijolo e árvores pequenas junto à rodovia; sem caminho até a estufa e a Casa do Mel (gramado com mato); estufa de tela de sombreamento com plantas em pneus; vôlei em caixa de areia elevada; grade em volta da piscina; prédio novo já erguido, só no reboco; muro em volta do campo. As duas casinhas ao lado do campo estão em posição estimada.
- Noite (`hora()` em `src/main.js`): janelas `vidroAceso` (Anexo todo, cerca de 40% dos laboratórios, poucas no resto), poças de luz dos postes (`luzes` em `src/detalhes.js`) e luar fraco.
- Entorno (`src/entorno.js`): casas do bairro ao longo das ruas (ilustrativas), galpões, casas grandes muradas ao lado do prédio dos apartamentos (posição aproximada), cerca de arame do terreno vizinho ao longo da estrada de terra do Seu Assis, mato de caatinga por instâncias e serras no horizonte. Brisanet com testeira laranja, estacionamento cercado e coberturas das motos. Portão dos ônibus na ponta esquerda da frente do campus. Com o mato, a cena passa de 240 mil triângulos: reduzir a quantidade no perfil de celular.
- Altura adotada pelas fotos: pergolado com 2,9 m (no protótipo a coberta tem 4,8 m).

## Legibilidade, andares e rotas (10/11/2026, escolhas do usuário)

- Modos: **Evento** (padrão) põe um véu de cor nos prédios do evento (bloco principal verde, auditório azul, cantina laranja, pátio verde-claro; `src/estilo.js`, `comVeu` em `src/texturas.js`) e desbota o resto; legenda no canto. **Campus** mostra tudo nas cores reais. Texturas e luz não mudaram.
- **Andares**: a câmera aproxima sem cortes, o campus esmaece, o bloco real é fatiado (`principal.fatiar`) e dá lugar a uma maquete em escada (`src/interior.js`: cada andar sobe 7,5 m e recua 30 m), com salas em bloco colorido por uso, número grande, portas, escada e rampa ligando os andares. A maquete e a rota são desenhadas numa segunda passada, por cima do campus. Botões 2/1/T focam um andar; 2D é a mesma maquete achatada vista de cima (não há mais planta SVG).
- Subida na rota: os andares descem da escada até a altura real do prédio e a câmera chega perto da rampa ou da escada; a linha acompanha a maquete a cada quadro (pontos reais levados pela abertura atual), então sobe pela rampa inteira e pelos dois lances da escada sem pular. Andares acima da ponta da linha ficam translúcidos. Nos Andares, o andar em foco também desce até a altura real (os de baixo ficam fantasmas, os de cima somem).
- Nos modos Evento e Campus, os botões de andar cortam o prédio real logo acima das salas (`palco.corte`, `principal.corteDe`): salas, portas, piso dos corredores, cartazes ao lado das portas e, no 1º andar, os armários dos alunos no corredor em frente à sala 108.
- Transições por pose de câmera (`src/camera.js`) e estado do palco (`src/palco.js`), sempre interpoladas.
- Rotas (`src/rotas.js`, `rota(dest, origem, forcar)`): partem da sala da atividade em que a pessoa está inscrita acontecendo agora (`origem` mandado pelo app, ou `?origem=andar:zona`), senão da portaria; destinos de fora (bebedouros do Anexo e da Cantina) seguem o grafo de caminhos do mapa original; "Bebedouro mais perto" usa a distância da rota real. Salas que abrem para outra sala seguem as portas em cadeia. O banheiro do auditório está interditado (`closed`) e fica fora de rotas e busca.
- Viagem (`src/viagem.js`): voo, linha no campus, abertura do bloco, andar de saída, subida, corredor (os outros andares somem) e chegada; se a porta ficaria escondida, a câmera gira devagar até ficar de frente para ela. O trecho já percorrido esmaece na chegada. No celular o cartão recolhe e a legenda some durante a viagem.
- App: com `?mapa=novo`, a aba Mapa é este mapa embutido; "Como chegar" de uma atividade abre a rota. Mensagens `etal:mapa:abrir` / `etal:mapa:sincronizar` levam `floor`, `zone`, `origem`, hora, atividades e números de sala; respostas `etal:mapa:pronto` e `etal:mapa:fechar`. API `window.CampusNovo`: `route`, `focus`, `clearRoute`, `setMode`, `setHour`, `setOrigem`, `syncRooms`.
- `npm run pwa` empacota `mapa3d/` em `prototipo/mapa3d/` (gerado). No app é o padrão; `?mapa=classico` ou Perfil → Personalizar → Mapa → Clássico voltam ao mapa Canvas.
- Andares (11/11): o próprio prédio real se abre em escada (`principal.escalonar`): cada andar tem um plano de corte logo acima das salas e as subidas (rampa com as paredes, escada) são inclinadas pela mesma matriz da abertura. Da maquete (`src/interior.js`) fica só a sala escolhida, que sobe verde na chegada. Os botões de andar fazem a mesma animação nos modos Evento e Campus (no Campus o entorno esmaece menos).
- Abertura (`src/abertura.js`): na primeira visita, voo contínuo por pontos-chave (de cima com o horizonte, aproximação, passagem baixa pela Elétrica, vista do evento) e depois as partes do evento sobem do chão com um salto, uma de cada vez, ganhando a cor (`VEUS` por parte). Nas próximas, aproximação curta. `?intro=1` repete; `?intro=0` pula.

## Passeio (ramo feature/passeio-campus, 11/11/2026)

Desde a revisão de carregamento (11/11/2026) o passeio é um segredo: não tem botão. Abre com cinco toques seguidos no obelisco, digitando "passear" na busca ou com `?passeio=1`. O módulo (`src/passeio.js`, física e móveis) só é baixado nessa hora, e o computador não abre mais direto nele.

- Modo **Passear** (`src/passeio.js`): personagem e carro do Sketchbook (swift502, MIT; `assets/sketchbook/`). O papel com o rosto na textura do personagem é redesenhado com a foto do perfil (o app manda `foto` e `nome` em `etal:mapa:abrir`; sem foto, as iniciais). Andar, correr e pular em terceira pessoa; não atravessa os prédios nem o muro (os três portões da frente ficam abertos); o chão vem do terreno por raio, com cache.
- Carros: quatro em cada faixa da BR-405, em mão dupla, mantendo distância e parando para quem estiver na pista; nove estacionados de frente para os blocos amarelos do estacionamento, de cores diferentes. Nos estacionados dá para entrar (anda até a porta, abre, senta, fecha), dirigir e sair parado; o carro fica onde foi deixado.
- Teclado: WASD/setas, Shift corre, Espaço pula (no carro, freio de mão), E entra/sai, Esc sai do passeio. Celular: controle redondo e botões Correr, Pular e Entrar/Sair. Arrastar gira a câmera; roda ou pinça aproxima.
- Física (`src/colisao.js`): grade de obstáculos de 25 cm feita da própria geometria (faces quase verticais na faixa do corpo, 0,42–1,9 m acima do chão): cones, sebes, bancos, mesas, postes, portões, muro, guarita, prédios e paredes do bloco barram; meio-fio e degrau baixo dá para subir. Troncos das árvores entram como círculos. Uma grade para o chão e uma por andar do bloco; a entrada principal e a porta de vidro do Anexo são abertas na grade.
- Dentro do bloco: altura pela planta (andar × 3,45 m) e, na rampa e na escada, pela fração da subida, sem saltos entre os andares. O prédio é cortado acima do andar (e da cabeça) e a câmera sobe para ver por cima. A recepção virou hall aberto, com o balcão encostado na parede.
- Voar (F ou botão Voar): decola com impulso; para a frente é para onde a câmera olha (olhar para cima sobe, para baixo mergulha); Espaço sobe, C desce; Shift dá o turbo, que sobe aos poucos de 26 até 70 m/s. Efeitos de velocidade: riscos de vento mais longos, rastro fino atrás do corpo, lente que abre até 74°, bordas da tela riscadas, tremida leve e um anel de estrondo ao passar de 45 m/s. Pose medida nos ossos do modelo (braços para trás no voo normal e parado no ar, acima da cabeça só acima de 15 m/s; a troca passa por baixo, pela frente do corpo), corpo inclina com a velocidade e nas curvas; riscos de vento, lente que abre com a velocidade e câmera que inclina nas curvas. Prédios mais altos que quem voa barram. F de novo pousa (cai e amortece com a animação de queda).
- Computador (mouse, sem toque) abrindo `mapa3d/` direto: começa no passeio, sem os botões de tela; clicar no mapa trava o mouse na câmera (Esc solta). `?passeio=0` abre o mapa normal.
- Portaria: a guarita fica entre o portão de veículos e o de pedestres (`GUARITA` em `src/dados.js`), com janelinha preta para a rua e portinha para a passagem; o vão de pedestres fica de frente para a passarela. As rotas saem desse vão.

## Interior do bloco (revisão de 11/11/2026)

- Rampa fechada por paredes também no fim da volta; no térreo, parede debaixo da pista que chega do 1º andar; no 2º andar o vão é cercado. Escada com faixa de piso no lado sul de cada andar (entrada pela circulação), medidas em `src/subidas.js`.
- Portas de verdade: vão na parede e folha solta que gira quando empurrada (`src/moveis.js`). Entrada principal com duas folhas de vidro. Salas com móveis simples e tampa por sala; no passeio o prédio é cortado logo acima da cabeça.
- Corredores com bancos, murais, lixeiras, extintores e vasos; quadro de avisos na parede da direita do hall; bebedouro no patamar do 1º andar. Tudo isso é ambientação, não levantamento.
- Cones da rua são peças soltas: empurrados e derrubados pela pessoa e pelos carros.
- Abertura: interface escondida durante o voo; tocar pula.

Verificação:
```
node --test mapa3d/tests/rotas.test.mjs
python3 mapa3d/servir.py
python3 mapa3d/tests/browser.py
```
O teste de navegador usa Playwright Python e `CHROME_BIN` (padrão `/opt/google/chrome/chrome`). Capturas de revisão em `/tmp/etal-*.png`. O cenário real ainda contém posições estimadas; não é levantamento de acessibilidade nem navegação GPS.

Resultados de 10/11: cinco testes automatizados de rotas passaram; fluxo Playwright em 390×844 passou (três destinos, movimento reduzido, seleção, andares separados, planta, atividade → mapa → retorno, sem erros JavaScript). O perfil de desempenho ainda precisa ser medido em celulares físicos; headless/SwiftShader não representa a GPU do usuário.
