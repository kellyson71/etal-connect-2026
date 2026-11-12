# Histórico de versões

O projeto segue o git flow: `main` tem só versões publicadas, `develop` junta as funcionalidades e cada uma nasce num ramo `feature/*`.

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
