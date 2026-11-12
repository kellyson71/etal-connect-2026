<p align="center">
  <img src="marca/etal-logo.png" height="56" alt="ETAL">
  &nbsp;&nbsp;&nbsp;
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="marca/nadic-logo-claro.svg">
    <img src="marca/nadic-logo.svg" height="52" alt="NADIC">
  </picture>
</p>

# Documentos do ETAL Connect

Os PDFs abrem direto no GitHub. As versões em HTML são as originais, interativas, e abrem no navegador a partir de uma cópia local do repositório.

## PDFs

| Documento | O que tem | Páginas | Tamanho |
|---|---|---|---|
| **[Apresentação](pdf/ETAL-Connect-apresentacao.pdf)** | O projeto em slides: o encontro, o participante, a organização, o mapa do campus real ao 3D, a presença por QR e o apêndice técnico (arquitetura, banco, API, PWA, rotas). | 25 | 4,9 MB |
| **[Comparação dos mapas](pdf/ETAL-Connect-comparacao-dos-mapas.pdf)** | 20 pares de capturas: o mapa clássico (Canvas) e o mapa 3D atual (WebGL) vistos dos mesmos lugares, por fora, por dentro e no app. | 21 | 3,5 MB |
| **[Notas de continuidade](pdf/ETAL-Connect-notas-de-continuidade.pdf)** | Contexto e decisões, telas e fluxos, regras do mapa e da planta, estrutura técnica, próximos passos, verificação e a programação de referência do VII ETAL. | 16 | 0,6 MB |
| **[Explorações visuais](pdf/ETAL-Connect-exploracoes-visuais.pdf)** | As propostas de design que vieram antes do app atual: direções visuais, home e mapa, e as três entradas testadas (cartaz, crachá e explorar). | 3 | 6,5 MB |

## Originais em HTML (para abrir no computador)

| Documento | Arquivo |
|---|---|
| Apresentação interativa (slides, demonstrações do app e do mapa, tela cheia) | [`DOCUMENTACAO.html`](../DOCUMENTACAO.html) |
| Comparação dos mapas, com os pares em JPG para slides | [`comparacao-modelos/index.html`](comparacao-modelos/index.html) · [`pares/`](comparacao-modelos/pares/) |
| Notas | [`contexto`](contexto.html) · [`fluxos`](fluxos.html) · [`mapas`](mapas.html) · [`tecnico`](tecnico.html) · [`proximos-passos`](proximos-passos.html) · [`validacao`](validacao.html) · [`programacao-referencia`](programacao-referencia.html) |
| Explorações | [`direcoes-visuais`](direcoes-visuais.html) · [`propostas-home-mapa`](propostas-home-mapa.html) · [`telas-cracha`](telas-cracha.html) |

Para apresentar, abra `DOCUMENTACAO.html` no navegador (duplo clique) e use as setas ou o botão de tela cheia. Funciona sem servidor.

## Referência técnica (Markdown)

[Requisitos](tecnico/01-requisitos.md) · [Casos de uso](tecnico/02-casos-de-uso.md) · [Banco de dados](tecnico/03-banco-de-dados.md) · [Arquitetura](tecnico/04-arquitetura.md) · [API](tecnico/05-api.md) · [Testes](tecnico/06-testes.md) · [Mapa e fontes](tecnico/07-mapa-e-fontes.md) · [PWA e apresentação](tecnico/08-pwa-e-apresentacao.md) · [Plano técnico de implantação](PLANO_TECNICO.md) · [Referências do campus](CAMPUS_REFERENCIAS.md)

## Gerar de novo

```sh
npm run docs        # HTML da apresentação e das notas
npm run docs:pdf    # todos os PDFs desta pasta (Playwright e Chrome locais, pdfunite)
python3 scripts/documentar-modelos.py --somente-documento   # comparação dos mapas (precisa dos PNGs originais)
python3 scripts/capturar-prints.py                          # prints do README (com o protótipo rodando)
```

Os PDFs ficam leves porque, antes de imprimir, as capturas de tela da página viram JPEG no tamanho em que aparecem (`scripts/otimizar_pdf.py`); texto e desenhos continuam vetoriais e pesquisáveis.

A comparação dos mapas já ocupou 204 MB: um ZIP de 101 MB que copiava a própria pasta, 75 MB de PNGs originais em resolução cheia e JPGs em qualidade máxima. Agora o ZIP não existe mais, os PNGs ficam só na máquina de quem gera (os hashes deles estão em `evidencias.json`) e as imagens publicadas têm o tamanho de uso. A pasta caiu para cerca de 8 MB.
