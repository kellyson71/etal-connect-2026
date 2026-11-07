# Modelo 3D do campus

Cópia congelada em 07/11/2026, antes das otimizações. Abra `index.html` no navegador; não precisa de servidor nem de build.

Aqui estão o motor (`campus3d.js`, Canvas 2D), os dados e as imagens. O desenvolvimento continua em `prototipo/`, e esta pasta não muda sozinha.

## O que tem
- `campus3d.js`: motor do mapa: vista semi-3D e 2D, modo evento, andares abertos e rotas.
- `campus-data.js`: levantamento original, em metros.
- `campus-fundo.js`: marcações novas do KML.
- `campus-limpo.js`: marcações endireitadas, usadas no desenho.
- `campus-entorno.js`: arredores lidos nas fotos de satélite, aproximados.
- `plan-data.js`: planta dos três andares.
- `sprites.js` e `assets/sprites/`: árvores, casas e texturas.
- `fontes/`: KML do campus e créditos dos modelos (Kenney, CC0).

## Como regenerar (a partir da raiz do projeto)
- Planta: `python3 scripts/build-principal-plan.py`, conferida por `scripts/check-principal-plan.py`.
- Marcações: `python3 scripts/import-fundo-kml.py <arquivo.kml>` e `python3 scripts/build-campus-limpo.py`.
- Imagens: `scripts/assets/render_sprites.py` no Blender e `scripts/assets/build_sprites.py`.

As alturas são adotadas e várias posições são aproximadas: não é levantamento arquitetônico oficial.
