"""Monta os atlas do protótipo a partir dos renders do Blender e gera as texturas de telhado.
Uso: python3 scripts/assets/build_sprites.py <pasta dos renders>
Saída: prototipo/assets/sprites/*.webp e prototipo/sprites.js
"""
import json, sys
from pathlib import Path
import numpy as np
from PIL import Image

SRC = Path(sys.argv[1])
ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'prototipo/assets/sprites'
OUT.mkdir(parents=True, exist_ok=True)
meta = json.loads((SRC / 'meta.json').read_text())
TREES = ['tree_oak', 'tree_default', 'tree_fat']
HOUSES = ['building-type-a', 'building-type-c', 'building-type-e', 'building-type-h', 'building-type-k']


def lum(a):
    return 0.3 * a[..., 0] + 0.59 * a[..., 1] + 0.11 * a[..., 2]


def tint(a, mode):
    """a: RGB(A) em 0..1. Mesma conta da paleta neutra do mapa."""
    out = a.copy()
    if mode == 'color-light':
        return out
    if mode == 'color-dark':
        out[..., :3] = a[..., :3] * np.array([0.58, 0.66, 0.82])
        return out
    L = lum(a)
    if mode == 'mono-light':
        c = [176 + L * 76, 179 + L * 74, 186 + L * 69]
    else:
        c = [15 + L * 62, 23 + L * 64, 42 + L * 72]
    out[..., :3] = np.stack(c, -1) / 255
    return out


EVENT_COLORS = {'': ((0.42, 0.74, 0.2), (0.5, 0.84, 0.3)), '-blue': ((0.24, 0.39, 0.74), (0.36, 0.52, 0.88)), '-honey': ((0.93, 0.68, 0.16), (0.95, 0.74, 0.26))}


def event(a, dark, variant=''):
    """Fachada e telhado do evento, na cor de cada parte; o vidro continua vidro."""
    out = a.copy()
    glass = (a[..., 2] > a[..., 0] + 0.04) | (lum(a) < 0.34)
    L = lum(a)[..., None]
    g = np.array(EVENT_COLORS[variant][1 if dark else 0])
    wash = np.clip(g * (L / max(0.01, np.percentile(L, 70))), 0, 1)
    out[..., :3] = np.where(glass[..., None], a[..., :3] * np.array([0.72, 0.9, 0.86]), wash)
    return out


def save(a, name, q=84):
    Image.fromarray((np.clip(a, 0, 1) * 255).astype('uint8')).save(OUT / f'{name}.webp', quality=q, method=6)


def atlas(names, cell, recolor=None):
    sprites, cells = [], []
    x = y = rowh = 0
    W = cell * 4
    for n in names:
        entry = {'radius': meta[n]['radius'], 'height': meta[n]['height']}
        for view in ('tilt', 'top'):
            im = Image.open(SRC / f'{n}_{view}.png').convert('RGBA')
            k = cell / im.width
            box = im.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox()
            ax, ay = meta[n][view]['ax'] * im.width, meta[n][view]['ay'] * im.height
            c = im.crop(box).resize((max(1, round((box[2] - box[0]) * k)), max(1, round((box[3] - box[1]) * k))), Image.LANCZOS)
            if x + c.width > W:
                x, y, rowh = 0, y + rowh + 2, 0
            cells.append((c, x, y))
            entry[view] = dict(x=x, y=y, w=c.width, h=c.height, ox=round((ax - box[0]) * k, 1), oy=round((ay - box[1]) * k, 1), mpp=meta[n]['mpp'] / k)
            x += c.width + 2
            rowh = max(rowh, c.height)
        sprites.append(entry)
    H = y + rowh
    sheet = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    for c, cx, cy in cells:
        sheet.paste(c, (cx, cy))
    a = np.asarray(sheet).astype('float32') / 255
    if recolor:
        a = recolor(a)
    return a, sprites


def warm_roofs(a):
    """Os telhados do kit vêm em verde-menta: viram telha, como no bairro das fotos."""
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mask = (g > r + 0.08) & (g >= b - 0.02)
    L = lum(a)
    out = a.copy()
    out[..., :3] = np.where(mask[..., None], np.stack([0.86 * L + 0.14, 0.56 * L + 0.09, 0.42 * L + 0.07], -1), a[..., :3])
    return out


trees, tree_meta = atlas(TREES, 150)
houses, house_meta = atlas(HOUSES, 110, warm_roofs)
MODES = ['color-light', 'color-dark', 'mono-light', 'mono-dark']
for m in MODES:
    save(tint(trees, m), f'trees-{m}')
    save(tint(houses, m), f'houses-{m}')


def noise(n, seed, scales):
    """Ruído contínuo nas bordas, para a textura repetir sem emenda."""
    r = np.random.default_rng(seed)
    out = np.zeros((n, n), 'float32')
    for cells, amp in scales:
        g = r.random((cells, cells), 'float32')
        xs = np.arange(n) * cells / n
        i = xs.astype(int)
        t = xs - i
        t = t * t * (3 - 2 * t)
        j = (i + 1) % cells
        row = g[i][:, i] * ((1 - t)[:, None] * (1 - t)[None, :]) + g[i][:, j] * ((1 - t)[:, None] * t[None, :]) + g[j][:, i] * (t[:, None] * (1 - t)[None, :]) + g[j][:, j] * (t[:, None] * t[None, :])
        out += amp * (row - 0.5)
    return out


def rgb(gray, c):
    return np.dstack([gray * c[0], gray * c[1], gray * c[2]])


# Laje de concreto: manchas suaves e juntas discretas (128 px = 8 m).
n = 128
conc = 0.95 + noise(n, 3, [(4, 0.022), (8, 0.012), (32, 0.006)])
conc[::32, :] *= 0.965
conc[:, ::32] *= 0.965
roof = rgb(np.clip(conc, 0, 1), (1.0, 0.995, 0.975))
# Telha: fiadas com variação de peça (96 px = 3 m).
rng = np.random.default_rng(9)
tile = np.full((96, 96), 0.8, 'float32')
for yy in range(0, 96, 12):
    off = 0 if (yy // 12) % 2 else 6
    for xx in range(-12, 96, 12):
        v = 0.9 + rng.random() * 0.14
        for x in range(xx + off, xx + off + 11):
            tile[yy:yy + 11, x % 96] = v
    tile[yy + 10:yy + 12, :] *= 0.9
telha = rgb(tile, (0.88, 0.6, 0.42))
# Telha metálica do pátio (64 px = 4 m).
ribs = np.ones((64, 64), 'float32') * 0.92
for x in range(0, 64, 16):
    ribs[:, x:x + 3] = 0.84
    ribs[:, x + 3:x + 6] = 1.0
ribs *= 1 + noise(64, 5, [(4, 0.03)])
metal = rgb(np.clip(ribs, 0, 1), (0.97, 0.98, 1.0))
wall = np.clip(np.asarray(Image.open(SRC / 'wall.png').convert('RGB')).astype('float32') / 255 * 1.14, 0, 1)


def ochre(a):
    """Pastilha amarela das fotos do campus; o vidro continua vidro."""
    h, w = a.shape[:2]
    L = lum(a)
    glass = (a[..., 2] > a[..., 0] + 0.04) | (L < 0.42)
    base = np.array([0.86, 0.67, 0.31]) * np.clip(L / np.percentile(L, 75), 0.6, 1.08)[..., None]
    yy, xx = np.mgrid[0:h, 0:w]
    base = base * (1 - 0.1 * ((yy % 8 == 0) | (xx % 8 == 0)))[..., None]
    return np.where(glass[..., None], a[..., :3] * np.array([0.8, 0.86, 0.95]), base)


# Calçamento de pedra (128 px = 8 m): pedras irregulares, com juntas escuras.
rng2 = np.random.default_rng(21)
cells = 16
pts_ = np.array([[(i + 0.5 + (rng2.random() - 0.5) * 0.8) * 8, (j + 0.5 + (rng2.random() - 0.5) * 0.8) * 8] for i in range(cells) for j in range(cells)])
tones = 0.84 + rng2.random(len(pts_)) * 0.16
yy, xx = np.mgrid[0:128, 0:128]
dx = np.abs(xx[..., None] - pts_[:, 0]); dx = np.minimum(dx, 128 - dx)
dy = np.abs(yy[..., None] - pts_[:, 1]); dy = np.minimum(dy, 128 - dy)
dist = np.hypot(dx, dy)
order = np.argsort(dist, axis=-1)
near = order[..., 0]
edge = np.take_along_axis(dist, order[..., 1:2], -1)[..., 0] - np.take_along_axis(dist, order[..., :1], -1)[..., 0]
stone = tones[near] * np.where(edge < 1.1, 0.72, 1.0)
cobble = rgb(stone.astype('float32'), (0.8, 0.77, 0.7))

for name, tex in (('roof', roof), ('telha', telha), ('ribs', metal), ('wall', wall), ('cobble', cobble)):
    for m in MODES:
        src = ochre(tex) if name == 'wall' and m.startswith('color') else tex
        save(tint(src, m), f'{name}-{m}', 88)
    if name not in ('telha', 'cobble'):
        for variant in EVENT_COLORS if name != 'ribs' else ['']:
            save(event(tex, False, variant), f'{name}-event{variant}-light', 88)
            save(event(tex, True, variant), f'{name}-event{variant}-dark', 88)

data = dict(trees=tree_meta, houses=house_meta, tex=dict(roof=dict(px=128, m=8), telha=dict(px=96, m=3), ribs=dict(px=64, m=4), cobble=dict(px=128, m=8), wall=dict(w=128, h=180)))
(ROOT / 'prototipo/sprites.js').write_text('/* Gerado por scripts/assets/build_sprites.py. Modelos: Kenney, CC0 (referencias/modelos/CREDITOS.txt). */\nwindow.SPRITES = ' + json.dumps(data) + ';\n')
total = sum(f.stat().st_size for f in OUT.glob('*.webp'))
print(len(list(OUT.glob('*.webp'))), 'imagens,', round(total / 1024), 'KB')
