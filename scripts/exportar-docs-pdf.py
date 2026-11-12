"""Exporta todos os documentos em HTML para PDF, em docs/pdf/. Requer Playwright, Chrome e pdfunite (poppler).

    npm run docs:pdf

- Apresentação (DOCUMENTACAO.html, igual a docs/tecnico/documentacao-tecnica.html): com o tamanho de página do CSS dela.
- Notas de continuidade: as páginas curtas de docs/ juntas num PDF só.
- Explorações visuais (direções, propostas e telas do crachá): cada página vira uma folha larga, como na tela.
- A comparação dos mapas sai de scripts/documentar-modelos.py, no mesmo lugar.
As imagens opacas viram JPEG antes de imprimir (scripts/otimizar_pdf.py), o que deixa os PDFs bem mais leves.
"""
import functools
import http.server
import subprocess
import threading
import sys
import tempfile
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from otimizar_pdf import imagens_leves  # noqa: E402

OUT = ROOT / 'docs/pdf'
NOTAS = ['contexto', 'fluxos', 'mapas', 'tecnico', 'proximos-passos', 'validacao', 'programacao-referencia']
EXPLORACOES = ['direcoes-visuais', 'propostas-home-mapa', 'telas-cracha']


class Quieto(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


def servidor():
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Quieto, directory=str(ROOT)))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, f'http://127.0.0.1:{srv.server_port}/'


BASE = None


def abrir(page, rel):
    page.goto(BASE + rel, wait_until='networkidle')
    page.evaluate('document.fonts.ready')
    # imagens com carregamento preguiçoso: rola até o fim para todas chegarem
    page.evaluate('''async () => { document.querySelectorAll('img[loading="lazy"]').forEach((i) => { i.loading = 'eager'; });
      for (let y = 0; y < document.body.scrollHeight; y += 700) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); } scrollTo(0, 0); }''')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(600)


def impresso(page, rel, destino):
    abrir(page, rel)
    page.emulate_media(media='print')
    n = imagens_leves(page)
    page.pdf(path=str(destino), print_background=True, prefer_css_page_size=True, tagged=True, outline=True)
    page.emulate_media(media='screen')
    return n


def como_na_tela(page, rel, destino, largura=1440):
    page.set_viewport_size({'width': largura, 'height': 1000})
    abrir(page, rel)
    page.add_style_tag(content='*{animation:none!important;transition:none!important} html,body{height:auto!important;overflow:visible!important}')
    n = imagens_leves(page)
    altura = min(page.evaluate('Math.ceil(document.documentElement.scrollHeight)'), 19000)
    page.pdf(path=str(destino), width=f'{largura}px', height=f'{altura}px', print_background=True, tagged=True,
             margin={'top': '0', 'right': '0', 'bottom': '0', 'left': '0'})
    return n


def juntar(partes, destino):
    subprocess.run(['pdfunite', *map(str, partes), str(destino)], check=True)


def main():
    global BASE
    OUT.mkdir(parents=True, exist_ok=True)
    srv, BASE = servidor()
    with sync_playwright() as p, tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        browser = p.chromium.launch(executable_path='/opt/google/chrome/chrome', headless=True)
        page = browser.new_page(viewport={'width': 1440, 'height': 1000}, reduced_motion='reduce')
        feitos = []
        for rel, nome in [('DOCUMENTACAO.html', 'ETAL-Connect-apresentacao.pdf')]:  # docs/tecnico/documentacao-tecnica.html é a mesma apresentação
            impresso(page, rel, OUT / nome); feitos.append(nome)
        partes = []
        for slug in NOTAS:
            partes.append(tmp / f'{slug}.pdf'); impresso(page, f'docs/{slug}.html', partes[-1])
        juntar(partes, OUT / 'ETAL-Connect-notas-de-continuidade.pdf'); feitos.append('ETAL-Connect-notas-de-continuidade.pdf')
        partes = []
        for slug in EXPLORACOES:
            partes.append(tmp / f'{slug}.pdf'); como_na_tela(page, f'docs/{slug}.html', partes[-1])
        juntar(partes, OUT / 'ETAL-Connect-exploracoes-visuais.pdf'); feitos.append('ETAL-Connect-exploracoes-visuais.pdf')
        browser.close()
    srv.shutdown()
    for nome in feitos:
        print(f'docs/pdf/{nome}: {(OUT / nome).stat().st_size / 1e6:.1f} MB')


if __name__ == '__main__':
    main()
