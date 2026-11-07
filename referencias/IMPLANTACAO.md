# Implantação do campus por KML

Fonte atual: `referencia_campus.kml`, cópia do arquivo `Projeto de mapa sem título (3).kml` fornecido pelo usuário em 15/10/2026, com 35 marcações. As coordenadas são convertidas para metros usando os raios locais WGS84; origem no centro do pátio e rotação rígida para alinhar seus eixos, sem redimensionar contornos ou espaçamentos. Resultado: `implantacao_kml.json`.

- Eixo Z positivo: portaria e estacionamento frontal. Z negativo: bloco principal.
- Bloco principal: extrusão do polígono completo, incluindo os recortes marcados.
- Diretoria: térreo à direita de quem entra, independente do bloco principal.
- Entre os blocos: espaço externo aberto e vegetação, sem parede conectando os volumes.
- Laboratório, cantina, anexo e biblioteca: contornos e orientações próprios do KML.
- Estacionamento frontal: duas áreas de árvores exatamente nos polígonos marcados.
- Jardim à direita da passarela: caminhos diagonais formando canteiros triangulares e árvores na borda.

Modelos reutilizados: árvores, plantas e arbustos já presentes em `modelos/plantas`, palmeiras, bancos, carros, postes e aparelhos de ar-condicionado. Volumes arquitetônicos e caminhos são montados no gerador; não foram adquiridos novos assets nesta revisão.

Alturas revisadas a pedido do usuário: 4,50 m por pavimento mais 0,30 m de cobertura. Principal e laboratório: 9,30 m. Demais blocos e portaria: 4,80 m. Topo da cobertura do pátio: 7,20 m (o pedido posterior substitui a altura igual à diretoria). As alturas não são medidas do KML; contornos e distâncias horizontais permanecem inalterados.

Pátio e toda a área de pedestres ao norte do estacionamento (z < 11) num nível só, 30 cm acima do estacionamento: calçada de pedra (Poly Haven `cobblestone_pavement`), meio-fio branco e faixa de piso tátil de alerta amarelo (ambientCG `TactilePaving003`, CC0) de 50 cm na borda com o estacionamento, inclusive na calçada do laboratório. Rampa no acesso frontal. O caminho interno fica a 38 cm (8 cm acima do pátio), com bordas inclinadas. Jogador e inimigos sobem sozinhos degraus de até 50 cm (`scripts/degraus.gd`). A passarela sobe gradualmente e tem duas faixas amarelas em toda a extensão. O estacionamento usa calçamento (paralelepípedo); o jardim à direita tem grama e caminhos de tijolos. Arbustos nas duas laterais da entrada e no perímetro do pátio, com aberturas de circulação.

A revisão (2) acrescenta três árvores pontuais, uma cobertura de madeira (altura adotada de 4,80 m) e dois jardins com arbustos no perímetro. O marcador e o caminho sem título ficam preservados como metadados, pendentes de identificação; não são tratados como construções.

O muro segue o polígono `area toda do if (muro)` da revisão (3), com aberturas adotadas na frente para veículos e pedestres. Fachada com azulejos claros, faixa vermelha e representação visual dos cobogós (não são furos reais). Portaria revisada para 3,35 m, guarita e grades vermelhas abertas. Árvores externas e ilha `meio fio` seguem suas marcações. A rodovia, postes, cones, carros, prédio de quatro pavimentos, galpão e poucas casas são aproximações visuais das fotos, em `montar_exterior.gd`; os polígonos sem nome permanecem sem identificação confirmada. Limites invisíveis deslocados para fora da área nova. Mesa de pingue-pongue decorativa com colisão no pátio; pássaros animados e partículas de folhas junto aos arbustos. Música fornecida pelo usuário em `assets/sounds/musica`, em loop a -18 dB; consultar os créditos antes de distribuir.

O caminho de entrada mantém o polígono original. A linha até o anexo mantém seu eixo e recebe largura adotada de 2 m. Janelas, portas, móveis, quantidade de plantas e jardins não anotados continuam aproximações pelas fotos. Contornos de telhados podem incluir beirais; não equivalem a um levantamento das paredes.

Para atualizar as marcações: `python ferramentas/importar_kml.py assets/fase/referencia_campus.kml`. Depois: `godot --headless --path . --script ferramentas/montar_patio.gd`. A montagem atual está em `ferramentas/montar_implantacao_kml.gd`; os layouts estimados antigos não são chamados. Semente fixa mantém a vegetação estável entre revisões.

Revisão da fachada pelas fotos: sete árvores à esquerda, uma menor junto à guarita e cinco à direita (quantidade direita estimada). As marcações de árvores externas permanecem como referência, mas a distribuição visual é complementada pelo pedido do usuário. Tree Small 02 da Poly Haven, CC0, simplificada e com texturas 1K. Ilha `meio fio` preenchida com grama e borda pavimentada. Cones em fila longitudinal no eixo do acesso de veículos; carros perpendiculares ao muro. Bairro distante com 22 instâncias de cinco casas do City Kit (Suburban), Kenney, CC0, sem pretensão de levantamento real. Licenças nas pastas dos modelos.

Correção da portaria: cobertura reduzida para 2,90 m, guarita à esquerda de quem olha da rua e passagem à direita, com parede lateral fechada. Grades de 2,10 m, postes de dobradiça apoiados no piso e travessa inferior a 2,5 cm dele; seis cones do Car Kit da Kenney substituem os cones geométricos anteriores. A altura de 2,90 m substitui a estimativa anterior de 3,35 m.

Alinhamento final da portaria: conjunto deslocado 3,80 m no eixo X negativo, deixando a passagem de pedestres centrada em X=12,90, no eixo da passarela existente. Árvore da guarita, letreiro, fechamento frontal e acesso de veículos acompanham o ajuste. O contorno KML original permanece nos metadados; esse deslocamento é uma correção visual solicitada pelo usuário.


## Resto do campus (07/11/2026)

`referencia_campus_completo.kml` é a versão do usuário com 66 marcações, incluindo o fundo do campus. `scripts/import-fundo-kml.py` converte só as novas para `prototipo/campus-fundo.js`, com a mesma transformação do levantamento; `--conferir` compara essa conversão com `campus-survey.json`.

O caminho entre o bloco e o anexo passa a ser o contorno `caminho entre bloco e anexo`, no lugar da linha antiga. Andares informados pelo usuário: prédio do NADIC e prédio auxiliar com 2; academia, vestiário, centro médico e casa do mel com 1. A academia foi associada ao `Polígono sem título` entre o ginásio e a piscina, por dedução, pendente de confirmação. O campo fica fora do polígono do muro no KML.

Posições lidas nas fotos de satélite, aproximadas: árvores do fundo e dos jardins, canteiro e escadinha do Coliseu, placas solares do Anexo. Alturas continuam adotadas. Via de serviço, pátios e trilhas são representações simples.


## Limpeza das marcações (07/11/2026)

As marcações foram feitas à mão e valem como base, não como medida. `scripts/build-campus-limpo.py` gera `prototipo/campus-limpo.js`: quadriláteros viram retângulos em três direções (0°, 59,5° e 64,5°), lados próximos se alinham, e pátio, passarela, portão e coberta passam a se encostar. Os dados originais não mudam, e o script lista quanto cada item se moveu.

`prototipo/campus-entorno.js` traz o entorno lido nas fotos de satélite: caminho de terra até o Seu Assis, lotes, galpões, ruas e áreas verdes, tudo aproximado. As casas do bairro são posicionadas ao longo das ruas de forma ilustrativa, não uma a uma.


## Imagens do mapa (07/11/2026)

Árvores e casas do protótipo são impostores: imagens renderizadas no Blender a partir de modelos CC0 da Kenney (`referencias/modelos`, ver `CREDITOS.txt`), para o mapa continuar leve em celular. A fachada é um módulo modelado no Blender, e concreto, telha e telha metálica são texturas geradas. Para refazer: `blender -b -noaudio -P scripts/assets/render_sprites.py -- <pasta>` e `python3 scripts/assets/build_sprites.py <pasta>`.
