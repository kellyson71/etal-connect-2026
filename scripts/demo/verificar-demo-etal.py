"""Verifica a apresentação em navegador e SQLite isolados; não altera a conta do usuário.
Requer app local em 8770, Playwright e o venv do backend. O login de teste só é
habilitado no servidor efêmero que este script cria e encerra.
"""
import json
import os
from pathlib import Path
import secrets
import socket
import subprocess
import tempfile
import time
import urllib.request
from playwright.sync_api import sync_playwright, expect
ROOT=Path(__file__).resolve().parents[2]
FRONT='http://127.0.0.1:8770'

def run():
    with tempfile.TemporaryDirectory(prefix='etal-e2e-') as temp:
        with socket.socket() as sock:
            sock.bind(('127.0.0.1',0));port=sock.getsockname()[1]
        api=f'http://127.0.0.1:{port}'
        env={**os.environ,'ETAL_BANCO':f'sqlite:///{temp}/demo-etal.db','ETAL_LOGIN_DEV':'1','ETAL_DEMO':'1','ETAL_SUAP_PORTAL':'0','ETAL_JANELA_PRESENCA':'0','ETAL_SEGREDO':secrets.token_urlsafe(32),'ETAL_ORGANIZACAO':'20251094040030','ETAL_URL_PUBLICA':FRONT}
        python=str(ROOT/'backend/.venv/bin/python')
        subprocess.run([python,'-m','app.demo'],cwd=ROOT/'backend',env=env,check=True,stdout=subprocess.DEVNULL)
        proc=subprocess.Popen([python,'-m','uvicorn','app.main:app','--host','127.0.0.1','--port',str(port)],cwd=ROOT/'backend',env=env,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
        try:
            for _ in range(50):
                try:urllib.request.urlopen(api+'/api/saude',timeout=1);break
                except OSError:time.sleep(.1)
            with sync_playwright() as pw:
                browser=pw.chromium.launch(executable_path='/opt/google/chrome/chrome',args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
                ctx=browser.new_context(viewport={'width':390,'height':844},service_workers='block',reduced_motion='reduce')
                ctx.route('**/config.js',lambda r:r.fulfill(body='window.ETAL_CONFIG='+json.dumps({'api':api,'demo':True}),content_type='text/javascript'))
                p=ctx.new_page();errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
                p.goto(FRONT+'/?moldura')
                expect(p.locator('#mat')).to_be_visible()
                expect(p.locator('[data-act="demo-admin"]')).to_have_count(0)
                print('PASS: entrada por matrícula, sem botão de demo',flush=True)
                # Cria só a sessão da fixture no banco efêmero. Sem autenticação SUAP externa.
                assert ctx.request.post(api+'/api/auth/dev',data={'matricula':'20251094040030','nome':'Organização','organizacao':True}).ok
                p.reload()
                expect(p.locator('.b-strip.pend')).to_be_visible()
                p.locator('.b-strip.pend').click()
                expect(p.locator('.qr-debug')).to_be_visible()
                p.locator('.qr-debug summary').click()
                assert p.locator('.qr-debug-grid button').count() >= 20
                expect(p.locator('.qr-debug-grid')).to_contain_text('FastAPI')
                p.wait_for_timeout(350)
                p.screenshot(path='/tmp/etal-debug-qrs.png')
                p.locator('.qr-debug [data-q="recepcao"]').click()
                expect(p.locator('.wl h1')).to_have_text('Participação confirmada')
                assert ctx.request.get(api+'/api/eu').json()['person']['credentialedAt']
                print('PASS: grade de 20 QRs e credenciamento pelo mesmo fluxo da câmera',flush=True)
                p.reload()
                p.locator('#tabbar [data-act="scan"]').click()
                p.locator('.qr-debug summary').click()
                p.locator('.qr-debug [data-q="fastapi"]').click()
                expect(p.locator('[data-act="scanopen"][data-q="fastapi"]')).to_be_visible(timeout=10000)
                assert 'fastapi' in ctx.request.get(api+'/api/eu').json()['present']
                p.screenshot(path='/tmp/etal-debug-presenca.png')
                print('PASS: QR de minicurso registra presença no SQLite isolado',flush=True)
                p.reload()
                p.locator('#tabbar [data-tab="community"]').click()
                p.locator('.community-start-text').click()
                expect(p.locator('[name="activity"]')).to_have_value('fastapi')
                expect(p.locator('.compose-context summary')).to_contain_text('Check-in realizado')
                expect(p.locator('.compose-submit')).to_be_disabled()
                p.wait_for_timeout(200)
                p.screenshot(path='/tmp/etal-nova-publicacao.png')
                p.locator('#community-post').fill('Aprendi FastAPI no ETAL!')
                expect(p.locator('.compose-submit')).to_be_enabled()
                p.locator('.compose-context summary').click()
                p.locator('[name="activity"]').select_option('react-native')
                p.locator('#community-image').set_input_files([str(ROOT/'prototipo/assets/community/projeto.jpg'),str(ROOT/'prototipo/assets/community/equipe.jpg')])
                expect(p.locator('.community-upload')).to_have_count(2)
                expect(p.locator('[name="activity"]')).to_have_value('react-native')
                expect(p.locator('#community-post')).to_have_value('Aprendi FastAPI no ETAL!')
                p.locator('.compose-mentions summary').click()
                p.locator('.social-people-results [data-handle="ana.beatriz"]').click()
                expect(p.locator('#community-post')).to_have_value('Aprendi FastAPI no ETAL! @ana.beatriz ')
                p.locator('.compose-submit').click()
                expect(p.locator('.community-post')).to_have_count(7)
                draft=p.evaluate('COMMUNITY.read().posts[0]')
                assert draft['activity']=='react-native' and draft['day']==26 and len(draft['images'])==2
                print('PASS: contexto por QR após recarregar, troca manual, texto, marcação e fotos preservados ao publicar',flush=True)
                p.reload()
                p.locator('#tabbar [data-tab="agenda"]').click()
                expect(p.locator('.page:not(.leaving) .ses')).to_have_count(5)
                p.locator('[data-act="day"][data-day="27"]').click()
                expect(p.locator('.ses-camp')).to_have_count(4)
                expect(p.locator('.ses[data-id="abertura"]')).to_be_visible()
                expect(p.locator('.ses-pausa')).to_have_count(0)
                p.locator('.ses[data-id="abertura"]').scroll_into_view_if_needed()
                p.screenshot(path='/tmp/etal-agenda-abertura.png')
                p.locator('.ses-camp[data-id="valorant"]').click()
                expect(p.locator('.tour.valorant')).to_be_visible()
                p.screenshot(path='/tmp/etal-demo-valorant.png')
                p.locator('#tabbar [data-tab="community"]').click()
                expect(p.locator('.community-post')).to_have_count(7)
                text=p.locator('.page:not(.leaving)').inner_text().lower()
                assert not any(w in text for w in ['demonstração','simulada','protótipo','imagem de exemplo']),text
                p.screenshot(path='/tmp/etal-demo-publicacoes.png')
                print('PASS: agenda da API, quatro campeonatos e seis publicações sem rótulos',flush=True)
                p.locator('#tabbar [data-tab="map"]').click()
                frame=p.frame_locator('.mapa-fixo iframe')
                expect(frame.locator('#busca')).to_be_visible(timeout=30000)
                map_page=next(f for f in p.frames if '/mapa3d/' in f.url)
                map_page.wait_for_function('!!window.CampusNovo',timeout=45000)
                frame.locator('#busca').fill('210')
                print('Mapa: '+frame.locator('#resultados').inner_text(),flush=True)
                frame.locator('#resultados button').filter(has_text='Sala 210').click()
                expect(frame.locator('#sala-atividades button')).to_have_count(2)
                frame.locator('#sala-atividades button').first.click()
                expect(p.locator('.page:not(.leaving)')).to_contain_text('Introdução ao React Native')
                print('PASS: sala 210 lista os dois dias e abre detalhe no app',flush=True)
                assert not errors,errors
                browser.close()
        finally:
            proc.terminate()
            try:proc.wait(timeout=5)
            except subprocess.TimeoutExpired:proc.kill();proc.wait()

if __name__=='__main__':run()
