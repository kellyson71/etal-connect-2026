# Comparação visual dos mapas do ETAL Connect

Capturado em 2026-11-11T14:42:05-03:00. Fonte: commit `442215668157f37e6f6c88f239090c3ee1a4b928`.

- `index.html`: documento com as imagens lado a lado e links para os modelos.
- PDF para apresentação e impressão: `docs/pdf/ETAL-Connect-comparacao-dos-mapas.pdf`.
- `pares/`: 18 comparações em JPG, prontas para colocar em slides (clicar numa imagem do HTML abre o par).
- `previas/`: imagens leves para o HTML e o PDF.
- `imagens/classico/` e `imagens/novo/`: os 40 PNGs originais (cenas em 2400 × 1500 px, interfaces em 585 × 1266 px). Ficam só na máquina de quem gerou (fora do Git, 75 MB); os hashes estão em `evidencias.json` e o script os recria.
- `evidencias.json`: parâmetros das câmeras, arquivos-fonte, hashes e erros de navegador.

Reproduzir a partir da raiz: `python3 scripts/documentar-modelos.py`.
É necessário Playwright, Pillow e Chrome; o script abre e encerra seu próprio servidor local.
As capturas usam contextos novos, dados demonstrativos e armazenamento isolado; não alteram o aplicativo nem o backup `modelo-3d/`.

Clássico: https://etal-connect.vercel.app/?tela=mapa&mapa=classico&moldura&tema=light&qualidade=alta&ceu=14
Novo: https://etal-connect.vercel.app/?tela=mapa&mapa=novo&moldura&tema=light&ceu=14

A perspectiva do WebGL e a projeção axonométrica do Canvas impedem coincidência exata de pixels.
O registro alinha direção, local e pavimento; o corte dos interiores e a abertura dos andares estão explicados nas legendas.
O backup congelado em 07/11/2026 é anterior ao clássico preservado no app e não é confundido com ele.
