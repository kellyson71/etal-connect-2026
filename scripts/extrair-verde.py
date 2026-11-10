"""Tira as copas das árvores da imagem de satélite e grava prototipo/campus-verde.js.

Uso: python3 scripts/extrair-verde.py [imagem.png]
Sem imagem, baixa o mosaico (zoom 20) em volta da origem do levantamento. A imagem é só referência de pesquisa:
não entra no repositório. O resultado são círculos (x, y, raio, tipo) no sistema de coordenadas do mapa, em metros.

Como funciona: marca os pixels de vegetação (verde, ou avermelhado de copa em flor), mede em cada um a distância
até a borda da mancha e vai colocando círculos do maior para o menor. Uma copa isolada vira um círculo; um
canteiro comprido vira uma fileira deles.
"""
import io
import json
import math
from pathlib import Path
import sys
import urllib.request

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
LAT, LON, ZOOM, RAIO = -6.146299103855006, -38.20467439096546, 20, 4  # origem do levantamento; mosaico de 9 × 9
NORTH, EAST = (-0.9984, 0.0573), (-0.0573, -0.9984)  # os mesmos de campus3d.js
MPP = 156543.03392 * math.cos(math.radians(LAT)) / 2 ** ZOOM
R_MIN, R_MAX = 1.2, 5.6  # metros


def mosaico():
    n = 2 ** ZOOM
    xt = (LON + 180) / 360 * n
    yt = (1 - math.asinh(math.tan(math.radians(LAT))) / math.pi) / 2 * n
    x0, y0, lado = int(xt) - RAIO, int(yt) - RAIO, 2 * RAIO + 1
    im = Image.new('RGB', (256 * lado, 256 * lado))
    for i in range(lado):
        for j in range(lado):
            req = urllib.request.Request(f'https://mt1.google.com/vt/lyrs=s&x={x0 + i}&y={y0 + j}&z={ZOOM}', headers={'User-Agent': 'Mozilla/5.0'})
            im.paste(Image.open(io.BytesIO(urllib.request.urlopen(req, timeout=20).read())), (i * 256, j * 256))
    return im, ((xt - x0) * 256, (yt - y0) * 256)


def origem_de(im):
    n = 2 ** ZOOM
    xt = (LON + 180) / 360 * n
    yt = (1 - math.asinh(math.tan(math.radians(LAT))) / math.pi) / 2 * n
    return ((xt - (int(xt) - RAIO)) * 256, (yt - (int(yt) - RAIO)) * 256)


def mundo(px, py, o):
    e, nn = (px - o[0]) * MPP, -(py - o[1]) * MPP
    return e * EAST[0] + nn * NORTH[0], e * EAST[1] + nn * NORTH[1]


def distancia(mask, passos):
    """Distância (em pixels, xadrez) de cada pixel da máscara até a borda dela."""
    im = Image.fromarray((mask * 255).astype('uint8'))
    d = np.zeros(mask.shape, dtype=np.int16)
    for _ in range(passos):
        d += np.asarray(im, dtype=np.uint8) > 0
        im = im.filter(ImageFilter.MinFilter(3))
    return d


CHAO_M, CHAO_PX = 150, 0.6  # o mapa de chão cobre ±150 m, com 0,6 m por pixel
ROAD_Y0, ROAD_Y1 = 66.2, 76.6  # a pista é desenhada pelo motor


def materiais(a, verde, o):
    """Mapa do chão em poucos materiais, já nos eixos do mapa. Guarda só o índice do material de cada ponto
    (PNG de 5 tons) e a cor média de cada um: a cena continua desenhada pelo app, não é a foto."""
    import base64
    r, g, b = a[..., 0].astype(np.float32), a[..., 1].astype(np.float32), a[..., 2].astype(np.float32)
    L, sat = (r + g + b) / 3, np.maximum(np.maximum(r, g), b) - np.minimum(np.minimum(r, g), b)
    cls = np.where(L > 142, 0, 1)                      # terra clara / terra seca com mato ralo
    cls = np.where((sat < 26) & (L > 150), 2, cls)     # concreto e calçada
    cls = np.where((sat < 24) & (L < 112), 3, cls)     # piso escuro e sombra funda
    cls = np.where(verde, 4, cls)                      # chão debaixo das copas
    n = int(2 * CHAO_M / CHAO_PX)
    ys, xs = np.mgrid[0:n, 0:n]
    wx, wy = -CHAO_M + (xs + 0.5) * CHAO_PX, -CHAO_M + (ys + 0.5) * CHAO_PX
    e, nn = wx * EAST[0] + wy * EAST[1], wx * NORTH[0] + wy * NORTH[1]   # eixos ortonormais: a inversa é a transposta
    px, py = np.round(o[0] + e / MPP).astype(int), np.round(o[1] - nn / MPP).astype(int)
    ok = (px >= 0) & (py >= 0) & (px < a.shape[1]) & (py < a.shape[0]) & ~((wy > ROAD_Y0 - 0.6) & (wy < ROAD_Y1 + 0.6))
    idx = np.full((n, n), 5, dtype=np.uint8)
    idx[ok] = cls[py[ok], px[ok]]
    im = Image.fromarray(idx * 50).filter(ImageFilter.ModeFilter(5)).filter(ImageFilter.ModeFilter(5))
    buf = io.BytesIO(); im.save(buf, 'PNG', optimize=True)
    cores = []
    for k in range(5):
        m = cls == k
        cores.append([int(r[m].mean()), int(g[m].mean()), int(b[m].mean())])
    print('chão:', n, 'px,', len(buf.getvalue()) // 1024, 'KB; cores', cores)
    return {'m': CHAO_M, 'n': n, 'cores': cores, 'png': 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode()}


def main():
    if len(sys.argv) > 1:
        im = Image.open(sys.argv[1]).convert('RGB'); o = origem_de(im)
    else:
        im, o = mosaico()
    a = np.asarray(im.filter(ImageFilter.GaussianBlur(1.2)), dtype=np.int16)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    verde = (2 * g - r - b > 13) & (g > r + 1) & (g > b + 5) & (g > 38)
    # copa em flor (flamboyant, buganvília): rosado/avermelhado saturado, mais escuro que telha e terra
    flor = (r > g + 22) & (r > b + 14) & (r < 190) & (g < 120) & (r - np.minimum(g, b) > 40)
    passos = int(R_MAX / MPP) + 2
    yy, xx = np.mgrid[0:a.shape[0], 0:a.shape[1]]
    trees = []
    for tipo, mask in (('v', verde), ('f', flor)):
        m = np.asarray(Image.fromarray((mask * 255).astype('uint8')).filter(ImageFilter.MedianFilter(5))) > 0
        d = distancia(m, passos).astype(np.float32)
        rmin = (R_MIN if tipo == 'v' else 1.8) / MPP
        while True:
            i = int(d.argmax()); py, px = divmod(i, d.shape[1]); rad = float(d[py, px])
            if rad < rmin:
                break
            x, y = mundo(px, py, o)
            # tom: copas mais escuras ou mais claras, pelo brilho médio do miolo
            y0, y1, x0, x1 = max(0, py - 3), py + 4, max(0, px - 3), px + 4
            tom = float(g[y0:y1, x0:x1].mean())
            trees.append([round(x, 1), round(y, 1), round(min(R_MAX, rad * MPP * 1.12), 1), tipo, round(tom)])
            # apaga a copa colocada (deixa sobrepor um pouco a vizinha)
            k = int(rad * 0.95) + 2
            ya, yb, xa, xb = max(0, py - k), py + k + 1, max(0, px - k), px + k + 1
            d[ya:yb, xa:xb][(yy[ya:yb, xa:xb] - py) ** 2 + (xx[ya:yb, xa:xb] - px) ** 2 <= (rad * 0.95) ** 2] = 0
    chao = materiais(a, verde, o)
    # tom relativo (0 escuro … 3 claro), por quartil
    cortes = np.percentile([t[4] for t in trees], [25, 50, 75])
    for t in trees:
        t[4] = int(sum(t[4] > c for c in cortes))
    lado = a.shape[0] * MPP / 2
    out = {'fonte': 'satélite (Google, zoom 20), copas e chão tirados por scripts/extrair-verde.py', 'meio_lado': round(lado - 6, 1), 'trees': trees, 'chao': chao}
    (ROOT / 'prototipo/campus-verde.js').write_text('window.CAMPUS_VERDE=' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n')
    print(len(trees), 'copas;', sum(t[3] == 'f' for t in trees), 'em flor; cobre ±', out['meio_lado'], 'm')


if __name__ == '__main__':
    main()
