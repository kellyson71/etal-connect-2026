"""Captura o motor real do mapa, em cenas amplas para a apresentação.

Uso: python3 scripts/capturar-cenas-documentacao.py
Requer Playwright, Pillow e Chrome. Usa um servidor temporário e não modifica o app.
"""
from datetime import datetime
import hashlib
import io
import json
from pathlib import Path
import runpy
import subprocess

from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
HELPERS = runpy.run_path(str(ROOT / 'scripts/capturar-documentacao.py'))
SCENES = {
    'cena-campus': 'mode=campus',
    'cena-evento': 'mode=evento',
    'cena-andares': 'view=floors',
    'cena-entorno': 'view=entorno',
    'cena-jardim': 'view=garden',
    'cena-noite': 'mode=campus&hour=20',
}


def main():
    port = HELPERS['porta']()
    server = subprocess.Popen(['python3', '-m', 'http.server', str(port), '--bind', '127.0.0.1'],
                              cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        base = f'http://127.0.0.1:{port}'
        HELPERS['esperar'](base)
        with sync_playwright() as p:
            browser = p.chromium.launch(channel='chrome', headless=True)
            page = browser.new_page(viewport={'width': 1440, 'height': 900}, device_scale_factor=1.5)
            for name, params in SCENES.items():
                page.goto(f'{base}/docs/demos/campus.html?qualidade=alta&clean=1&{params}', wait_until='networkidle')
                page.wait_for_function('Campus3D.spritesReady() >= 42')
                page.wait_for_timeout(2200)
                Image.open(io.BytesIO(page.screenshot())).convert('RGB').save(ROOT / f'docs/assets/{name}.webp', quality=93, method=6)
                print(name, flush=True)
            browser.close()
        evidence = {'capturado_em': datetime.now().astimezone().isoformat(timespec='seconds'),
                    'motor_sha256': hashlib.sha256((ROOT / 'prototipo/campus3d.js').read_bytes()).hexdigest(),
                    'cenas': SCENES}
        (ROOT / 'docs/assets/cenas.json').write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + '\n')
    finally:
        server.terminate()
        server.wait(timeout=10)


if __name__ == '__main__':
    main()
