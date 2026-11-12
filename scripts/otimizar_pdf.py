"""PDFs mais leves sem estragar o desenho.

O Chrome guarda as imagens da página no PDF sem perda (PNG e WebP viram imagens enormes). Antes de imprimir,
`imagens_leves(page)` troca cada imagem opaca por um JPEG no tamanho em que ela aparece (2× para ficar nítida).
Imagens com transparência ficam como estão. A página precisa vir de http:// (em file:// o navegador não deixa reler a imagem). O texto e os desenhos continuam vetoriais, selecionáveis e pesquisáveis.
(Ghostscript reduzia mais, mas desfazia as transparências dos slides.)
"""

JS = r"""async ({ escala, qualidade, minimo }) => {
  const imgs = [...document.images].filter((i) => i.complete && i.naturalWidth > 0 && !/^data:image\/(jpeg|svg)/.test(i.currentSrc) && !/\.(svg|jpe?g)(\?|$)/i.test(i.currentSrc));
  let trocadas = 0;
  for (const img of imgs) {
    const r = img.getBoundingClientRect(); const w0 = Math.max(r.width, img.width || 0), h0 = Math.max(r.height, img.height || 0);
    if (!w0 || !h0 || img.naturalWidth * img.naturalHeight < minimo) continue;
    const k = Math.min(1, (w0 * escala) / img.naturalWidth); const w = Math.max(1, Math.round(img.naturalWidth * k)), h = Math.max(1, Math.round(img.naturalHeight * k));
    const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
    const f = getComputedStyle(img).filter; const assar = f && f !== 'none' && !/drop-shadow|blur/.test(f); if (assar) g.filter = f;
    try { g.drawImage(img, 0, 0, w, h); const d = g.getImageData(0, 0, w, h).data; let opaca = true; for (let i = 3; i < d.length; i += 4 * 7) if (d[i] < 250) { opaca = false; break; } if (!opaca) continue; } catch (_) { continue; }
    const url = c.toDataURL('image/jpeg', qualidade); img.removeAttribute('srcset'); img.src = url; if (assar) img.style.setProperty('filter', 'none', 'important'); /* o filtro (cinza, brilho) já está no JPEG */ await img.decode().catch(() => {}); trocadas++;
  }
  /* pôsteres dos vídeos (é o que vai para o papel) */
  for (const v of document.querySelectorAll('video[poster]')) {
    if (/^data:image\/jpeg/.test(v.poster)) continue;
    const im = new Image(); im.src = v.poster; try { await im.decode(); } catch (_) { continue; }
    const r = v.getBoundingClientRect(); const k = Math.min(1, (Math.max(r.width, 300) * escala) / im.naturalWidth);
    const c = document.createElement('canvas'); c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k);
    try { c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); v.poster = c.toDataURL('image/jpeg', qualidade); trocadas++; } catch (_) { /* outra origem */ }
  }
  return trocadas;
}"""


def imagens_leves(page, escala=2, qualidade=0.82, minimo=160 * 160):
    """Troca as imagens opacas da página por JPEG; devolve quantas trocou."""
    return page.evaluate(JS, {'escala': escala, 'qualidade': qualidade, 'minimo': minimo})
