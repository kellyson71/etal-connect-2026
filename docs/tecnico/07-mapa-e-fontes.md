# 07 · Do lugar real ao mapa

## A descoberta da planta

A pesquisa do projeto encontrou a dissertação de Larissa Leiros de Souza, Padronização e flexibilidade: proposta de um edifício tipo para uma escola técnica profissionalizante, UFRN, 2012. O documento inclui as plantas dos três pavimentos da tipologia vertical do Campus Pau dos Ferros, nas figuras 9, 10 e 11, páginas impressas 132 e 133 (páginas 134 e 135 do PDF).

O usuário comparou as plantas com o prédio que conhece e pediu que elas orientassem a reconstrução do interior. A geometria passou a ser traçada sobre as figuras; os usos atuais de alguns ambientes foram corrigidos com suas informações. Isso não transforma o registro de 2012 em cadastro atual oficial de salas.

[Documento no repositório UFRN](https://repositorio.ufrn.br/server/api/core/bitstreams/2be1d619-02aa-4c23-aa6b-4d65aa238aba/content)

## O levantamento externo

| Fonte | Como foi usada | Limite |
|---|---|---|
| KML inicial, 35 marcações | Contornos, pontos e caminhos do campus | Marcações manuais sobre imagem, não levantamento topográfico |
| KML completo, 66 marcações | Fundo do campus e referências adicionais | Parte das identificações e alturas é aproximada |
| Google Maps / Earth | Satélite, árvores, canteiros e relações de posição | Fotos e marcações são referência, não um serviço de navegação embutido |
| Google Street View | Apartamentos, BR-405, entrada, cores e volumes do entorno | As datas das imagens são anteriores às capturas do usuário |
| Fotografias do campus | Fachada, pátio, auditório e obelisco | Autoria original nem sempre identificada no material recebido |

A apresentação seleciona apenas imagens relacionadas ao projeto. As capturas de Street View e os recortes do jardim vêm dos prints de 09/11/2026 indicados pelo usuário; fotos e satélite também foram recuperados de registros anteriores do projeto. Não foram copiados diálogos completos nem imagens de outros assuntos.

## Conversão e representação

1. Polígonos, linhas e pontos são marcados no Google Earth e exportados como KML.
2. A transformação usa WGS84, uma origem no pátio e rotação dos eixos para coordenadas locais em metros.
3. Os contornos do modelo recebem limpeza e alinhamento, preservando os originais.
4. A planta interna usa os pixels das figuras de 2012; WORLD a relaciona aos metros do modelo.
5. O Canvas desenha volumes, piso, rótulos e a rota. O app não carrega o Google Maps para renderizar o campus.

Fontes do código: scripts/import-fundo-kml.py, scripts/build-campus-limpo.py, scripts/build-principal-plan.py e prototipo/campus3d.js. As regras de geometria continuam em docs/mapas.html e AGENTS.md.

## Rota implementada e localização futura

Hoje a rota parte da portaria (`mapa3d/src/rotas.js`):

- **Calçadas: Dijkstra** num grafo dos caminhos a pé do campus (pontos a menos de 1,5 m são o mesmo nó), da portaria até a porta de cada entrada do bloco.
- **Dentro do bloco: A\*** numa grade de 5 unidades da planta (cerca de 33 cm), só nos corredores, com a distância em linha reta como estimativa. Andar rente à parede custa 1,8 × e cada curva soma 3. Depois a "escadinha" da grade é alisada: o caminho pula direto entre pontos que se enxergam sem sair do corredor.
- **Escolhas:** cada entrada (principal, auditório, Anexo) é testada com o custo total (calçada + dentro); entre andares, escada e rampa são comparadas, com a escada pesando 1,6 × por andar. A opção pode ser forçada pelo usuário.
- **Salas que abrem para outra sala** seguem as portas em cadeia até um corredor. Minutos = metros ÷ 75.

A animação do slide "Como a rota é calculada" usa o mesmo código (`explicar` em `rotas.js`, dados gerados por `node scripts/gerar-rota-apresentacao.mjs`).

O app não usa navigator.geolocation para acompanhar a posição real. O ponto azul não deve ser apresentado como GPS ativo.

Uma evolução possível é pedir permissão de localização, converter latitude e longitude pelo mesmo sistema local e considerar a incerteza antes de usar a posição como origem. Outra proposta é tomar o QR de uma sala como origem conhecida dentro do prédio. Nenhuma dessas duas origens está implementada atualmente.

A ilustração de GPS da apresentação é didática e não solicita coordenadas.
