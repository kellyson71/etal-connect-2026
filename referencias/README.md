# Referências

Material usado para construir o mapa e a planta. Nada daqui é carregado pelo app.

| Arquivo | O que é |
|---|---|
| `referencia_campus.kml` | Levantamento do campus no Google Earth (35 marcações): contornos e posições dos prédios e caminhos. Convertido para `dados/campus-survey.json`. |
| `referencia_campus_completo.kml` | Levantamento completo (66 marcações), com o fundo do campus. Importado por `scripts/import-fundo-kml.py`. |
| `imagens/01…08` | Croquis de ajuste da planta do bloco principal (corredores, escada, rampa, banheiros, recepção). |
| `modelos/` | Modelos 3D da Kenney (CC0) de onde saem as imagens dos prédios e árvores do mapa clássico (`scripts/assets/render_sprites.py`, no Blender). Créditos em `modelos/CREDITOS.txt`. |
| `inspiracoes-dribbble.html` | Referências de apps de evento no Dribbble, separadas por tela. |

## Fora do repositório (`local/`)

Material de terceiros fica só na máquina de quem trabalha no mapa, na pasta `referencias/local/` (ignorada pelo Git):

- **Fotos do Google Maps** (galeria do lugar, enviadas por usuários do Google): referência de cores e texturas. Os direitos são dos autores; não publicar nem empacotar no app.
- **Dissertação de 2012** (Larissa Leiros de Souza, UFRN), de onde vêm as plantas do bloco: disponível no [repositório da UFRN](https://repositorio.ufrn.br/server/api/core/bitstreams/2be1d619-02aa-4c23-aa6b-4d65aa238aba/content).

As procedências de cada imagem usada na documentação estão em `docs/assets/fontes/creditos.json` e em [`docs/tecnico/campus-referencias.md`](../docs/tecnico/campus-referencias.md).
