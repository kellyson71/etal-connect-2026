"""Sobe a API de verdade (SQLite temporário, entrada de teste) e o protótipo apontando para ela, para os testes de
ponta a ponta no navegador. Usa o Python do backend (backend/.venv, ou o da variável PYTHON_API).

    with ambiente() as amb:      # amb.app, amb.api, amb.banco
        ...
"""
import contextlib
import functools
import http.server
import json
import os
import socket
import subprocess
import sys
import tempfile
import threading
import time
import urllib.request
from dataclasses import dataclass
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
PROTO = RAIZ / 'prototipo'
BACK = RAIZ / 'backend'


def porta_livre():
    with socket.socket() as s:
        s.bind(('127.0.0.1', 0))
        return s.getsockname()[1]


def python_api():
    if os.environ.get('PYTHON_API'):
        return os.environ['PYTHON_API']
    venv = BACK / '.venv' / 'bin' / 'python'
    return str(venv) if venv.exists() else sys.executable


def chrome():
    return os.environ.get('CHROME_BIN') or (
        '/opt/google/chrome/chrome' if Path('/opt/google/chrome/chrome').exists() else None)


def esperar(url, segundos=20):
    fim = time.time() + segundos
    while time.time() < fim:
        try:
            urllib.request.urlopen(url, timeout=1)
            return
        except OSError:
            time.sleep(0.2)
    raise SystemExit(f'{url} não respondeu')


@dataclass
class Ambiente:
    app: str
    api: str
    banco: Path


@contextlib.contextmanager
def ambiente():
    with tempfile.TemporaryDirectory() as pasta:
        porta_api = porta_livre()
        api = f'http://127.0.0.1:{porta_api}'

        class App(http.server.SimpleHTTPRequestHandler):
            """O protótipo como está, mas com o config.js apontando para a API do teste."""

            def log_message(self, *a):
                pass

            def do_GET(self):
                if self.path.split('?')[0] == '/config.js':
                    corpo = f'window.ETAL_CONFIG = {{ api: {json.dumps(api)} }};'.encode()
                    self.send_response(200)
                    self.send_header('Content-Type', 'text/javascript')
                    self.send_header('Content-Length', str(len(corpo)))
                    self.end_headers()
                    self.wfile.write(corpo)
                    return
                super().do_GET()

        srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(App, directory=str(PROTO)))
        threading.Thread(target=srv.serve_forever, daemon=True).start()
        base = f'http://127.0.0.1:{srv.server_address[1]}'
        banco = Path(pasta) / 'e2e.db'
        env = {**os.environ, 'ETAL_BANCO': f'sqlite:///{banco}', 'ETAL_LOGIN_DEV': '1', 'ETAL_JANELA_PRESENCA': '0',
               'ETAL_SEGREDO': 'segredo-do-teste-de-ponta-a-ponta', 'ETAL_ARQUIVOS': str(Path(pasta) / 'arquivos'),
               'ETAL_ORIGENS': base, 'ETAL_URL_PUBLICA': base}
        py = python_api()
        subprocess.run([py, '-m', 'app.importar', 'programacao', 'seed/programacao.json'], cwd=BACK, env=env,
                       check=True, capture_output=True)
        proc = subprocess.Popen([py, '-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', str(porta_api)],
                                cwd=BACK, env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        try:
            esperar(f'{api}/api/saude')
            yield Ambiente(app=base, api=api, banco=banco)
        finally:
            proc.terminate()
            proc.wait(5)
            srv.shutdown()


ENTRAR = """async ([api, nome, matricula, org]) => {
  const r = await fetch(api + '/api/auth/dev', {method: 'POST', credentials: 'include',
    headers: {'Content-Type': 'application/json'}, body: JSON.stringify({nome, matricula, organizacao: org})});
  return r.status;
}"""
