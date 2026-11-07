"""Atualiza a lista de arquivos guardados pelo service worker e a versão do app.

Rodar depois de mudar qualquer arquivo do protótipo: a versão é um hash do conteúdo,
então o celular percebe a mudança e oferece "Atualizar".
Uso: python3 scripts/build-pwa.py
"""
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / 'prototipo'
PAGES = ['./', 'index.html', 'manifest.webmanifest', 'app.js', 'app.css', 'data.js', 'plan-data.js', 'campus-data.js',
         'campus-fundo.js', 'campus-limpo.js', 'campus-entorno.js', 'sprites.js', 'campus3d.js']
ASSETS = sorted(str(p.relative_to(ROOT)) for p in (ROOT / 'assets').rglob('*') if p.suffix in ('.svg', '.png', '.jpg', '.webp'))
files = PAGES[1:] + ASSETS
digest = hashlib.sha256()
for f in files:
    digest.update(f.encode())
    digest.update((ROOT / f).read_bytes())
version = digest.hexdigest()[:10]
block = f"/* <gerado> */\nconst VERSION = '{version}';\nconst CORE = {json.dumps(PAGES + ASSETS, ensure_ascii=False)};\n/* </gerado> */"
sw = ROOT / 'sw.js'
text = re.sub(r'/\* <gerado> \*/.*?/\* </gerado> \*/', lambda _: block, sw.read_text(), flags=re.S)
sw.write_text(text)
print(f'sw.js: versão {version}, {len(PAGES + ASSETS)} arquivos guardados')
