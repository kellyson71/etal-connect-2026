"""Exporta o protótipo para um único index.html na raiz do projeto, para abrir por duplo clique.

Embute CSS, scripts, dados do mapa e imagens (sprites, texturas, logos). Não precisa de node_modules
nem de servidor. Sem o servidor local, o login do SUAP não funciona: a tela oferece a conta de
visitante e os dados de exemplo. Service worker e instalação também ficam de fora, porque o
navegador não os permite em arquivos locais.
Uso: python3 scripts/export-prototipo.py   (ou npm run export:html)
"""
import base64
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'prototipo'
OUT = ROOT / 'index.html'
MIME = {'.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp'}


def data_uri(path):
    return f'data:{MIME[path.suffix]};base64,{base64.b64encode(path.read_bytes()).decode()}'


assets = {str(p.relative_to(SRC)): data_uri(p) for p in sorted((SRC / 'assets').rglob('*')) if p.suffix in MIME and 'ref2012' not in p.parts}  # plantas de 2012: só o painel usa
html = (SRC / 'index.html').read_text()
# Recursos que não funcionam em arquivo local.
html = re.sub(r'<link rel="(manifest|apple-touch-icon)"[^>]*>\n?', '', html)
html = html.replace('href="assets/icon.svg"', f'href="{assets["assets/icon.svg"]}"')


def inline_literals(text):
    """Troca caminhos fixos como 'assets/suap-logo.svg' pela imagem embutida."""
    return re.sub(r'assets/[\w./-]+\.(?:svg|png|jpg|webp)', lambda m: assets.get(m.group(0), m.group(0)), text)


css = inline_literals((SRC / 'app.css').read_text())
html = html.replace('<link rel="stylesheet" href="app.css">', f'<style>\n{css}\n</style>')
boot = f'<script>window.ASSET_DATA = {json.dumps(assets)};</script>\n'


def inline_script(m):
    name = m.group(1)
    code = (SRC / name).read_text()
    if name in ('app.js', 'data.js'):
        code = inline_literals(code)
    return f'<script>/* {name} */\n{code.replace("</script", "<\\/script")}\n</script>'


html = re.sub(r'<script src="([\w.-]+\.js)"></script>', inline_script, html)
html = html.replace('<script>/* plan-data.js */', boot + '<script>/* plan-data.js */', 1)
html = html.replace('<p class="stage-note">ETAL Connect · protótipo · login pelo SUAP, programação demonstrativa</p>',
                    '<p class="stage-note">ETAL Connect · protótipo exportado · sem o servidor local, entre como visitante ou com dados de exemplo</p>')
OUT.write_text(html)
print(f'index.html: {len(html) / 1024:.0f} KB, {len(assets)} imagens embutidas')
