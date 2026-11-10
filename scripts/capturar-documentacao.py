"""Captura evidências locais com dados de exemplo, sem alterar config.js ou o banco do app.

Uso: python3 scripts/capturar-documentacao.py
Requer Playwright no Python que executa este script e backend/.venv instalado.
"""
import json
import hashlib
from datetime import datetime
import os
from pathlib import Path
import socket
import subprocess
import tempfile
import time
import urllib.request

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/assets'
PYTHON = ROOT / 'backend/.venv/bin/python'


def porta():
    with socket.socket() as s:
        s.bind(('127.0.0.1', 0))
        return s.getsockname()[1]


def esperar(url):
    for _ in range(100):
        try:
            with urllib.request.urlopen(url, timeout=1):
                return
        except OSError:
            time.sleep(.1)
    raise RuntimeError(f'Servidor não abriu: {url}')


def main():
    OUT.mkdir(exist_ok=True)
    api_port, site_port = porta(), porta()
    with tempfile.TemporaryDirectory(prefix='etal-docs-') as pasta:
        env = {**os.environ, 'ETAL_BANCO': f'sqlite:///{pasta}/documentacao.db',
               'ETAL_LOGIN_DEV': '1', 'ETAL_JANELA_PRESENCA': '0',
               'ETAL_SEGREDO': 'apenas-evidencia-local', 'ETAL_URL_PUBLICA': '',
               'ETAL_SUAP_CLIENT_ID': '', 'ETAL_SUAP_CLIENT_SECRET': '',
               'ETAL_SMTP_HOST': '', 'ETAL_ORGANIZACAO': ''}
        subprocess.run([str(PYTHON), '-m', 'app.importar', 'programacao', 'seed/programacao.json'],
                       cwd=ROOT / 'backend', env=env, check=True, capture_output=True)
        extrair = '''
import json
from app.main import app
from app.db import Base
from app import modelos
from sqlalchemy import UniqueConstraint
print(json.dumps({'openapi': app.openapi(), 'tabelas': [
 {'nome': t.name, 'campos': [{'nome': c.name, 'tipo': str(c.type), 'nulo': c.nullable,
 'pk': c.primary_key, 'unico': bool(c.unique), 'fk': [str(f.target_fullname) for f in c.foreign_keys]}
 for c in t.columns], 'unicos': [list(u.columns.keys()) for u in t.constraints if isinstance(u, UniqueConstraint)]}
 for t in Base.metadata.sorted_tables]}, ensure_ascii=False))
'''
        evidencia = json.loads(subprocess.check_output([str(PYTHON), '-c', extrair], cwd=ROOT / 'backend', env=env))
        evidencia['capturado_em'] = time.strftime('%Y-%m-%d')
        evidencia['capturado_em_iso'] = datetime.now().astimezone().isoformat(timespec='seconds')
        evidencia['fontes_app'] = {name: hashlib.sha256((ROOT / 'prototipo' / name).read_bytes()).hexdigest()
                                 for name in ('index.html', 'app.js', 'app.css', 'campus3d.js', 'plan-data.js')}
        evidencia['origem'] = 'API local, SQLite temporário, programação de exemplo; nenhuma conta real.'
        (OUT / 'evidencias.json').write_text(json.dumps(evidencia, ensure_ascii=False, indent=2) + '\n')
        api = subprocess.Popen([str(PYTHON), '-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', str(api_port)],
                               cwd=ROOT / 'backend', env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        site = subprocess.Popen(['python3', '-m', 'http.server', str(site_port), '--bind', '127.0.0.1'],
                                cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        try:
            api_url, site_url = f'http://127.0.0.1:{api_port}', f'http://127.0.0.1:{site_port}'
            esperar(api_url + '/api/saude')
            esperar(site_url)
            with sync_playwright() as p:
                browser = p.chromium.launch(channel='chrome', headless=True)
                context = browser.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2,
                                              locale='pt-BR', color_scheme='light', service_workers='block')
                page = context.new_page()
                for tela in ('login', 'home', 'agenda', 'atividade', 'qr', 'credencial', 'mapa', 'bloco', 'rota'):
                    page.goto(f'{site_url}/prototipo/?tela={tela}&tema=light&qualidade=alta&ceu=14', wait_until='networkidle')
                    page.evaluate('document.fonts.ready')
                    page.wait_for_timeout(7500 if tela in ('mapa', 'bloco', 'rota') else 1600)
                    page.locator('.device').screenshot(path=str(OUT / f'app-{tela}.png'))
                    print(f'Tela: {tela}', flush=True)
                context.close()
                context = browser.new_context(viewport={'width': 1440, 'height': 900}, device_scale_factor=1.5,
                                              locale='pt-BR', color_scheme='light', service_workers='block')
                page = context.new_page()
                page.goto(site_url + '/prototipo/admin.html', wait_until='networkidle')
                page.wait_for_timeout(1500)
                page.screenshot(path=str(OUT / 'painel.png'))
                page.goto(api_url + '/api/docs', wait_until='networkidle')
                page.locator('.swagger-ui .opblock').first.wait_for(timeout=30000)
                page.add_style_tag(content='.swagger-ui .topbar{display:none}.swagger-ui .wrapper{max-width:1260px}')
                page.screenshot(path=str(OUT / 'swagger-visao-geral.png'))
                bloco = page.locator('.opblock').filter(has=page.locator('[data-path="/api/saude"]'))
                bloco.locator('.opblock-summary').click()
                bloco.get_by_role('button', name='Try it out').click()
                bloco.get_by_role('button', name='Execute', exact=True).click()
                bloco.locator('.responses-table.live-responses-table').wait_for()
                bloco.screenshot(path=str(OUT / 'swagger-saude.png'))
                page.goto(api_url + '/api/docs', wait_until='networkidle')
                presenca = page.locator('.opblock').filter(has=page.locator('[data-path="/api/presenca"]'))
                presenca.locator('.opblock-summary').click()
                presenca.screenshot(path=str(OUT / 'swagger-presenca.png'))
                browser.close()
        finally:
            for proc in (api, site):
                proc.terminate()
                proc.wait(timeout=10)
    print('Evidências gravadas em docs/assets/.')


if __name__ == '__main__':
    main()
