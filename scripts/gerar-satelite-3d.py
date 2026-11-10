"""Imagem de satélite deformada para o mesmo enquadramento do modelo 3D (cortina "Google Maps → 3D" da apresentação).

O chão da vista 3D é uma transformação afim do plano local (campus3d.js, P com h = 0). Para cada pixel da vista,
volta-se ao plano local, depois à latitude e longitude (inverso de import-fundo-kml.py) e busca-se a cor no mosaico de satélite.
Uso: python3 scripts/gerar-satelite-3d.py   (precisa de rede, Playwright, Chrome, numpy e Pillow)
Saída: docs/assets/campus-3d.webp, docs/assets/campus-satelite.webp e as fontes no rodapé do slide.
"""
import importlib.util, io, json, math, urllib.request, http.server, socketserver, threading
from functools import partial
from pathlib import Path
import numpy as np
from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/assets'
W, H, Z = 1440, 810, 19

spec = importlib.util.spec_from_file_location('kml', ROOT / 'scripts/import-fundo-kml.py'); kml = importlib.util.module_from_spec(spec); spec.loader.exec_module(kml)
patio = next(e for e in kml.marks(kml.REF) if e['nome'] == 'patio')
lon0 = sum(p[0] for p in patio['geo']) / 4; lat0 = sum(p[1] for p in patio['geo']) / 4
rad = math.pi / 180; s = math.sin(lat0 * rad); den = 1 - 0.00669437999014 * s * s
east = 6378137 / math.sqrt(den) * math.cos(lat0 * rad) * rad; south = 6378137 * (1 - 0.00669437999014) / den ** 1.5 * rad
metres = lambda p: ((p[0] - lon0) * east, -(p[1] - lat0) * south)
a, b = map(metres, patio['geo'][:2]); n = math.hypot(b[0] - a[0], b[1] - a[1]); ax = ((b[0] - a[0]) / n, (b[1] - a[1]) / n)
M = np.array([[-ax[1], ax[0]], [-ax[0], -ax[1]]]); Minv = np.linalg.inv(M)

def servir():
    h = partial(http.server.SimpleHTTPRequestHandler, directory=str(ROOT)); h.log_message = lambda *a: None
    srv = socketserver.ThreadingTCPServer(('127.0.0.1', 0), h); threading.Thread(target=srv.serve_forever, daemon=True).start(); return srv

srv = servir()
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome-stable', args=['--headless=new', '--use-gl=angle', '--enable-unsafe-swiftshader'])
    pg = b.new_page(viewport={'width': W, 'height': H})
    pg.goto(f'http://127.0.0.1:{srv.server_address[1]}/docs/demos/campus.html?clean&mode=campus&hour=13&qualidade=alta'); pg.wait_for_timeout(3500)
    pg.evaluate('window.Campus3D.zoom(1.25)'); pg.wait_for_timeout(1500)
    cam = pg.evaluate('window.Campus3D.getView()')
    pg.screenshot(path=str(OUT / 'campus-3d.png')); b.close()
srv.shutdown()

# pixel da vista → plano local (só o chão, h = 0)
sx, sy = np.meshgrid(np.arange(W) + 0.5, np.arange(H) + 0.5)
u = (sx - W / 2) / cam['z']; v = (sy - H / 2) / (cam['k'] * cam['z'])
c, s_ = math.cos(cam['t']), math.sin(cam['t'])
X = cam['x'] + u * c + v * s_; Y = cam['y'] - u * s_ + v * c
lq = np.tensordot(Minv, np.stack([X, Y + 2]), axes=1)
lon = lon0 + lq[0] / east; lat = lat0 - lq[1] / south
N = 2 ** Z
gx = (lon + 180) / 360 * N * 256
gy = (1 - np.arcsinh(np.tan(np.radians(lat))) / math.pi) / 2 * N * 256
tx0, tx1 = int(gx.min() // 256), int(gx.max() // 256); ty0, ty1 = int(gy.min() // 256), int(gy.max() // 256)
mosaic = Image.new('RGB', ((tx1 - tx0 + 1) * 256, (ty1 - ty0 + 1) * 256))
for tx in range(tx0, tx1 + 1):
    for ty in range(ty0, ty1 + 1):
        req = urllib.request.Request(f'https://mt1.google.com/vt/lyrs=s&x={tx}&y={ty}&z={Z}', headers={'User-Agent': 'Mozilla/5.0'})
        mosaic.paste(Image.open(io.BytesIO(urllib.request.urlopen(req, timeout=20).read())).convert('RGB'), ((tx - tx0) * 256, (ty - ty0) * 256))
arr = np.asarray(mosaic)
ix = np.clip((gx - tx0 * 256).astype(int), 0, arr.shape[1] - 1); iy = np.clip((gy - ty0 * 256).astype(int), 0, arr.shape[0] - 1)
Image.fromarray(arr[iy, ix]).save(OUT / 'campus-satelite.webp', quality=86)
Image.open(OUT / 'campus-3d.png').convert('RGB').save(OUT / 'campus-3d.webp', quality=88); (OUT / 'campus-3d.png').unlink()
print('blocos', (tx1 - tx0 + 1) * (ty1 - ty0 + 1), 'vista', json.dumps(cam))
