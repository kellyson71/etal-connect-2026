"""Servidor local do modelo 3D novo: entrega a pasta do projeto e avisa a página quando um arquivo muda.

Uso: python3 mapa3d/servir.py  →  http://127.0.0.1:8772/mapa3d/
"""
import http.server
import os
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
VIGIAR = [RAIZ / 'mapa3d' / 'src', RAIZ / 'mapa3d' / 'index.html', RAIZ / 'mapa3d' / 'assets']


def versao():
    m = 0.0
    for alvo in VIGIAR:
        arquivos = [alvo] if alvo.is_file() else alvo.rglob('*') if alvo.exists() else []
        for a in arquivos:
            try:
                m = max(m, a.stat().st_mtime)
            except OSError:
                pass
    return str(m)


class H(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/__versao':
            corpo = versao().encode()
            self.send_response(200)
            self.send_header('Content-Type', 'text/plain')
            self.send_header('Cache-Control', 'no-store')
            self.send_header('Content-Length', str(len(corpo)))
            self.end_headers()
            self.wfile.write(corpo)
            return
        super().do_GET()

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def log_message(self, *a):
        pass


if __name__ == '__main__':
    os.chdir(RAIZ)
    print('http://127.0.0.1:8772/mapa3d/')
    http.server.ThreadingHTTPServer(('127.0.0.1', 8772), H).serve_forever()
