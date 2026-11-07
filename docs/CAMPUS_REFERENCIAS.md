# Base recuperada do campus IFRN Pau dos Ferros

Pesquisa local em registros de trabalho anteriores e no projeto Godot `~/projetos/jogo-3d`.

## Arquivos principais

- `~/projetos/jogo-3d/assets/fase/referencia_campus.kml`: levantamento fornecido pelo usuário em 15/10/2026; 35 marcações. Cópia preservada de `Projeto de mapa sem título (3).kml`.
- `~/projetos/jogo-3d/assets/fase/implantacao_kml.json`: as mesmas 35 marcações convertidas para coordenadas locais em metros. Origem geográfica em longitude -38.20467439096546 e latitude -6.146299103855006. É a base mais prática para uma planta SVG interativa.
- `~/projetos/jogo-3d/assets/fase/IMPLANTACAO.md`: procedência, interpretação dos elementos e limites de precisão.
- `~/projetos/jogo-3d/ferramentas/importar_kml.py`: conversão WGS84 para metros, com rotação para alinhar os eixos ao pátio.
- `~/projetos/jogo-3d/ferramentas/montar_implantacao_kml.gd`: gerador dos volumes e caminhos a partir do JSON.
- `~/projetos/jogo-3d/scenes/fase/patio.tscn`: cenário 3D gerado (aproximadamente 2,9 MB).
- `~/projetos/jogo-3d/scripts/fase/escala_campus.gd`: fator 1,2 aplicado à cena do jogo, não às coordenadas originais do KML/JSON.

## Cobertura e reutilização

As marcações incluem contornos do bloco principal, anexo, laboratório, cantina, pátio, diretoria, biblioteca (grafada `bliblioteca` no levantamento), portaria, passarela de entrada, caminho até o anexo, perímetro do campus, jardins, arbustos, áreas de árvores e árvores pontuais. Há elementos sem identificação confirmada.

A geometria horizontal original pode ser desenhada diretamente numa planta 2D. Os contornos representam marcações do usuário sobre imagens, não um levantamento topográfico ou cadastro oficial; telhados podem incluir beirais. Preservar coordenadas originais e indicar a procedência. O cenário Godot ajuda a visualizar a implantação, mas não precisa ser convertido para construir o mapa web.

## Cuidados

- O cenário do jogo foi ampliado em 20%. Não obter dimensões reais diretamente da cena ampliada.
- A portaria foi deslocada visualmente em 3,80 m no jogo. A documentação distingue essa correção do contorno do KML.
- Alturas, mobiliário, quantidade de plantas e algumas construções de entorno foram ajustados ou estimados para o jogo.
- Não há identificação confirmada de auditórios ou salas numeradas no KML. A associação de cada atividade a uma sala continua dependendo de validação.
- O perímetro completo do campus é muito maior que o conjunto detalhado de prédios. Um mapa pode abrir na região detalhada e oferecer uma ação para mostrar todo o campus.

## Situação no aplicativo

A base foi integrada ao mapa em `app/components/campus-map.tsx`. A cópia integral do JSON fica em `app/data/campus-survey.json`; o catálogo de espaços nomeados e suas correspondências com os índices originais fica em `app/data/campus-model.ts`.

A planta permite selecionar os prédios, ampliar, arrastar, usar pinça, alternar a vista dos prédios e do campus inteiro e mostrar ou ocultar camadas. O bloco principal permite explorar sua planta interna.

Os locais de atividades são propostas para o mockup: minicursos e palestras na planta interna do bloco principal e arena de jogos no pátio. O KML não confirma nomes de salas ou auditório; a geometria interna usa as imagens fornecidas depois pelo usuário. Essas associações são identificadas como demonstrativas na interface.

Nenhuma conversa completa, credencial ou dado de terceiros foi copiado para o repositório. Os arquivos do jogo foram apenas consultados, sem alterações.

## Origem dos dados

- 15/10/2026: primeiro levantamento, com o envio de `Projeto de mapa sem título.kml` e revisões posteriores.
- Os levantamentos seguintes reaproveitaram o KML preservado e o JSON da implantação.

Esses registros são locais e não foram copiados para o projeto.

## Planta interna do bloco principal

A planta interna foi reconstruída a partir das três imagens fornecidas posteriormente pelo usuário, priorizando a última representação feita à mão. Sua geometria é esquemática e independente das coordenadas em metros do KML.

- Salas externas e internas em ambos os lados dos corredores horizontais.
- Corredor inferior contínuo até a extremidade oeste no 1º e no 2º andar.
- Caixa de escada quadrada na ala oeste, fora da faixa dos corredores, com acesso lateral.
- Faixas internas divididas em salas ao redor do pátio/vão central.
- Rampa de acessibilidade à direita, com volume saliente inferior na entrada.
- Auditório e saída no térreo; salas no 1º andar; laboratórios, sala dos professores e salas no 2º andar.

`app/data/principal-plan.json` guarda a geometria. `scripts/build-principal-plan.py` gera esse arquivo e a prancha independente `public/maps/bloco-principal.svg` a partir dos mesmos dados. As coordenadas são unidades de desenho, não medidas arquitetônicas. Não foram atribuídos números oficiais às salas.

No app: Mapa → Principal → Explorar planta interna. Há seleção de andar, seleção de espaços, zoom e arraste; a prancha ampliada reúne os três níveis para conferência.

### Correção da recepção e do acesso lateral

Conforme as anotações do usuário, as faixas internas de salas foram alinhadas ao término das salas externas, deixando um único corredor lateral direito reto nos três andares. No térreo, a rampa ocupa a metade direita da faixa saliente; a metade esquerda é passagem livre. A recepção ocupa o trecho final da faixa inferior de salas (x704–770, y300–340), substituindo parte da última sala, fora do corredor. O traçado entrada → recepção utiliza a circulação livre e a porta norte da recepção, sem atravessar a rampa. O bebedouro aparece apenas no 1º andar, no canto inferior direito, com ícone e identificação próprios.

### Salas e atividades no aplicativo

Cada ambiente de aula, laboratório ou professores recebe um número demonstrativo por andar (001…, 101…, 201…). O tipo de uso continua disponível nos detalhes. Não se trata da numeração oficial do campus.

A agenda e os detalhes apresentam uma prévia ampliada da sala e seu andar. O toque abre esse andar e aproxima a sala selecionada. As atividades são filtradas pela combinação de andar e identificador da sala. As associações propostas ficam em `app/data/event-data.ts`: Salas 201, 204, 001 e 108 para os quatro minicursos; auditório do térreo para as duas palestras.
