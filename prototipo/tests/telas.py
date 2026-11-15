"""Teste de fumaça do app no navegador: abre as telas principais e toca nas ações seguras de cada uma, sem erro de
JavaScript. Serve o protótipo num servidor estático temporário (sem SUAP, com os dados de exemplo).

    python3 prototipo/tests/telas.py            # usa o Chrome do sistema, se houver, ou o Chromium do Playwright
"""
import functools
import http.server
import os
import sys
import threading
from pathlib import Path

from playwright.sync_api import sync_playwright

PROTO = Path(__file__).resolve().parents[1]
TELAS = ['home', 'agenda', 'atividade', 'speaker', 'comunidade', 'mural', 'chat', 'profile', 'personalizar', 'sobre',
         'org', 'games', 'cartao', 'colmeia', 'notices', 'materials', 'campus', 'login', 'visitante']
# ações que não saem do app nem gravam nada fora do navegador
SEGURAS = {'day', 'filter', 'save', 'tema', 'finder', 'finderq', 'community-mode', 'tourtab', 'tourround', 'lermais',
           'today', 'mine', 'agendaLugar', 'retro', 'retroclose', 'retronext', 'retroprev', 'closeov', 'back', 'ui', 'theme',
           'accent', 'quality', 'dim', 'uihome', 'uisky', 'skycycle', 'hudcycle', 'lgmode', 'togglepwd', 'scanmode', 'flip',
           'gallery-step', 'social-mod-filter', 'ask', 'vote', 'rate', 'remind', 'placeclose', 'zoneclose', 'scan'}


class Quieto(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


def main():
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Quieto, directory=str(PROTO)))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    base = f'http://127.0.0.1:{srv.server_address[1]}'
    chrome = os.environ.get('CHROME_BIN') or ('/opt/google/chrome/chrome' if Path('/opt/google/chrome/chrome').exists() else None)
    falhas, tocadas = [], set()
    with sync_playwright() as p:
        nav = p.chromium.launch(executable_path=chrome) if chrome else p.chromium.launch()
        for tela in TELAS:
            ctx = nav.new_context(viewport={'width': 412, 'height': 860}, service_workers='block')
            pg = ctx.new_page()
            erros = []
            pg.on('pageerror', lambda e, erros=erros: erros.append(str(e)[:200]))
            url = f'{base}/?tela={tela}&moldura&ceu=14.04'
            marcar = """(seguras) => { let i = 0; for (const el of document.querySelectorAll('[data-act]')) {
                 const r = el.getBoundingClientRect();
                 if (i < 12 && seguras.includes(el.dataset.act) && r.width && r.height) el.dataset.teste = i++; } return i; }"""
            pg.goto(url)
            pg.wait_for_timeout(1000)
            n = pg.evaluate(marcar, sorted(SEGURAS))
            # cada ação é tocada numa tela recém-aberta (um toque costuma trocar a tela)
            vistos = 0
            for i in range(n):
                if i:
                    pg.goto(url)
                    pg.wait_for_timeout(700)
                    pg.evaluate(marcar, sorted(SEGURAS))
                el = pg.locator(f'[data-teste="{i}"]')
                try:
                    act = el.first.get_attribute('data-act', timeout=1000)
                    el.first.click(timeout=1500)
                    pg.wait_for_timeout(250)
                    tocadas.add(act)
                    vistos += 1
                except Exception:
                    continue  # coberto por outra camada: segue para a próxima
            if erros:
                falhas.append((tela, erros))
            print(f'{tela:13s} {vistos:2d} ações  ' + ('ERRO: ' + erros[0] if erros else 'ok'))
            ctx.close()
        nav.close()
    srv.shutdown()
    print(f'ações tocadas: {len(tocadas)} ({", ".join(sorted(tocadas))})')
    if falhas:
        sys.exit(1)


if __name__ == '__main__':
    main()
