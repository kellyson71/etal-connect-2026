# Referências do campus e procedência do mapa

A [apresentação visual](../DOCUMENTACAO.html#referencias-campus) conta o caminho das referências até o modelo. A galeria em Fontes e detalhes reúne as imagens selecionadas, seus créditos e o documento encontrado.

## O que encontramos

| Material | Uso no projeto | Onde está |
|---|---|---|
| Dissertação de Larissa Leiros de Souza, UFRN, 2012 | Plantas do térreo, 1º e 2º pavimentos; informações arquitetônicas e cartas solares | [PDF original](assets/fontes/souza-2012.pdf), recortes em prototipo/assets/ref2012/ |
| Levantamento Google Earth, 35 marcações | Contornos e posições iniciais dos prédios e caminhos | referencias/referencia_campus.kml e implantacao_kml.json |
| Levantamento completo, 66 marcações | Fundo do campus e referências adicionais | referencias/referencia_campus_completo.kml |
| Satélite e Street View do histórico do projeto | Jardim, calçada, rodovia e entorno | docs/assets/fontes/, com procedência em creditos.json |
| Fotos do campus fornecidas pelo usuário | Fachadas, auditório, obelisco e pátio | Galeria da apresentação |

A dissertação se chama Padronização e flexibilidade: proposta de um edifício tipo para uma escola técnica profissionalizante. As figuras 9–11 do material anexo mostram o Campus Pau dos Ferros: páginas impressas 132–133, equivalentes às páginas 134–135 do PDF. O usuário confirmou que essas plantas correspondem ao prédio e pediu que o interior fosse reconstruído a partir delas.

[Documento na UFRN](https://repositorio.ufrn.br/server/api/core/bitstreams/2be1d619-02aa-4c23-aa6b-4d65aa238aba/content)

## Como as bases se conectam

1. O levantamento externo veio de polígonos, linhas e pontos marcados no Google Earth, inicialmente preservados no projeto Godot.
2. As coordenadas WGS84 foram convertidas para metros locais, com origem no centro do pátio e eixos alinhados ao levantamento.
3. A base original foi preservada; uma camada gerada limpa e alinha contornos para a visualização.
4. A planta interna foi traçada nos pixels das figuras de 2012. WORLD a ajusta ao contorno externo; o ajuste tem erro aproximado de 1 m, não precisão de cadastro arquitetônico.
5. O motor Canvas desenha o campus, os andares e as rotas a partir dessas bases.

A origem geográfica da base preservada é longitude -38.20467439096546 e latitude -6.146299103855006. O jogo aplicava uma ampliação visual de 1,2; essa escala do cenário não deve ser usada para medir as coordenadas originais.

## O produto atual

O mapa usado pelo app está em prototipo/campus3d.js. A geometria interna vem de scripts/build-principal-plan.py e gera prototipo/plan-data.js, JSON e SVG. O comando npm run planta regenera e confere as regras. Os componentes de mapa em app/ pertencem à versão React legada.

A atividade se liga ao ambiente por andar + zona; o número visível não é a chave. A organização pode personalizar a numeração. Usos de 2012 e informações atuais do usuário têm procedências diferentes; usos incertos continuam identificados como tais.

## Limites importantes

- Marcações sobre satélite são referências manuais, não levantamento topográfico oficial. Contornos de telhado podem incluir beirais.
- Alturas, elementos decorativos e parte do entorno são aproximações visuais.
- A geometria usa a planta encontrada, mas os usos atuais das salas e as alocações do evento não estão todos validados.
- Não existe rastreamento GPS no app. A rota atual parte da portaria; usar a posição real ou o QR de uma sala como origem ainda é proposta.
- O Google Maps / Earth foi referência de pesquisa. A cena do app é própria e não depende do serviço do Google para desenhar o campus.
- referencias/IMPLANTACAO.md preserva também decisões do cenário Godot e estimativas antigas; não deve substituir a fonte atual da planta.

As invariantes geométricas atuais estão em [Mapa e planta](mapas.html) e AGENTS.md. As imagens recuperadas para a apresentação ficam fora do cache offline e da exportação do aplicativo. Apenas imagens relacionadas ao campus foram selecionadas; nenhum diálogo completo foi incorporado.
