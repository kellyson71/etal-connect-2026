"""Grava os vídeos curtos da apresentação com o motor real do mapa e do app (dados de exemplo).

Uso: python3 scripts/gravar-videos-apresentacao.py [nomes]   (precisa de Playwright, Chrome e ffmpeg; serve a pasta do repositório)
Saída: docs/assets/videos/*.mp4 e um quadro de capa .webp de cada um.

Os vídeos p-* (entrar, agenda, presença, aviso) usam a API de verdade com uma conta do SUAP:
  ETAL_API=http://127.0.0.1:8011 ETAL_MATRICULA=... ETAL_SENHA=... ETAL_CAMERA=camera.y4m python3 scripts/gravar-videos-apresentacao.py p-entrar p-agenda p-presenca p-aviso
A API local precisa de ETAL_ORIGENS=http://127.0.0.1:8771, ETAL_JANELA_PRESENCA=0 e da matrícula em ETAL_ORGANIZACAO (para o aviso).
ETAL_CAMERA é um vídeo .y4m em pé com o QR assinado de uma atividade: vira a câmera do Chrome. A senha não é gravada em lugar nenhum.
"""
import http.server, os, shutil, socketserver, subprocess, sys, tempfile, threading
from functools import partial
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/assets/videos'
OUT.mkdir(parents=True, exist_ok=True)
CHROME = '/usr/bin/google-chrome-stable'
ARGS = ['--headless=new', '--use-gl=angle', '--enable-unsafe-swiftshader', '--disable-gpu-vsync']
ISOLA = "try{localStorage.clear();localStorage.setItem('etal-mapa',JSON.stringify({seen:true,mode:'evento',flat:false}))}catch(e){}"

API = os.environ.get('ETAL_API', '').rstrip('/')

socketserver.TCPServer.allow_reuse_address = True

def servir():
    h = partial(http.server.SimpleHTTPRequestHandler, directory=str(ROOT))
    h.log_message = lambda *a: None
    s = socketserver.ThreadingTCPServer(('127.0.0.1', 8771 if API else 0), h); threading.Thread(target=s.serve_forever, daemon=True).start()
    return s, f'http://127.0.0.1:{s.server_address[1]}'

def gravar(p, nome, url, roteiro, tam=(1440, 810), corte=1.2, dpr=1, estado=None, salvar=None, args=(), init=''):
    tmp = Path(tempfile.mkdtemp())
    b = p.chromium.launch(executable_path=CHROME, args=ARGS + list(args))
    ctx = b.new_context(viewport={'width': tam[0], 'height': tam[1]}, device_scale_factor=dpr, record_video_dir=str(tmp), record_video_size={'width': tam[0], 'height': tam[1]},
                        storage_state=estado if estado and Path(estado).exists() else None)
    ctx.add_init_script(ISOLA + init)
    pg = ctx.new_page(); pg.goto(url); pg.wait_for_timeout(1200)
    roteiro(pg)
    if salvar: ctx.storage_state(path=salvar)
    video = pg.video.path(); ctx.close(); b.close()
    mp4 = OUT / f'{nome}.mp4'
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-ss', str(corte), '-i', str(video), '-c:v', 'libx264', '-preset', 'slow', '-crf', '24', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', str(mp4)], check=True)
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-sseof', '-0.5', '-i', str(mp4), '-frames:v', '1', str(OUT / f'{nome}.webp')], check=True)
    shutil.rmtree(tmp, ignore_errors=True)
    print(nome, round(float(subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',str(mp4)],capture_output=True,text=True).stdout or 0),1), 's', round(mp4.stat().st_size / 1e6, 1), 'MB')

def real(p, base, quer):
    """Telas do participante com a API e o SUAP de verdade: entra, monta a agenda, lê o QR com a câmera e recebe um aviso."""
    app = base + '/prototipo/index.html'
    sessao = Path(tempfile.gettempdir()) / 'etal-gravacao-sessao.json'
    F = dict(tam=(430, 932), corte=1.4, estado=str(sessao), init=f"window.ETAL_CONFIG={{api:'{API}'}};")
    def clicar(pg, sel, ms=900):
        el = pg.locator(sel).first
        if el.count(): el.click()
        pg.wait_for_timeout(ms)
    def entrar(pg):
        pg.wait_for_selector('#mat', timeout=15000); pg.wait_for_timeout(900)
        pg.click('#mat'); pg.keyboard.type(os.environ['ETAL_MATRICULA'], delay=55); pg.wait_for_timeout(300)
        pg.click('#pwd'); pg.keyboard.type(os.environ['ETAL_SENHA'], delay=70); pg.wait_for_timeout(500)
        pg.click('[data-form=login] button[type=submit]')
        pg.wait_for_selector('.filled', timeout=20000); pg.wait_for_timeout(3600)
        clicar(pg, 'text=Abrir o app', 3000)
    if quer('p-entrar'):
        sessao.unlink(missing_ok=True)
        gravar(p, 'p-entrar', app, entrar, **{**F, 'estado': None}, salvar=str(sessao))
    def agenda(pg):
        pg.wait_for_timeout(1600)
        clicar(pg, '[data-act=tab][data-tab=agenda]', 1500)
        clicar(pg, '.page [data-act=save]:not(.on)', 1500)
        clicar(pg, '.page [data-act=save]:not(.on)', 1500)
        clicar(pg, '[data-act=filter][data-f=saved]', 2800)
    if quer('p-agenda'): gravar(p, 'p-agenda', app, agenda, **F)
    def presenca(pg):
        pg.wait_for_timeout(1600)
        clicar(pg, '#tabbar [data-act=scan]', 300)
        pg.wait_for_selector('.scan-res.in', timeout=15000); pg.wait_for_timeout(3400)
        clicar(pg, '.scan-res [data-act=scanopen]', 2600)
        pg.mouse.move(215, 600); pg.mouse.wheel(0, 420); pg.wait_for_timeout(1800)
    if quer('p-presenca'):
        cam = ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', '--use-file-for-fake-video-capture=' + os.environ['ETAL_CAMERA']]
        gravar(p, 'p-presenca', app, presenca, **F, args=cam)
    def aviso(pg):
        pg.wait_for_timeout(1500)
        clicar(pg, '[data-act=tab][data-tab=agenda]', 1800)
        pg.evaluate("""async (api) => fetch(api + '/api/org/atividades/react-native/sala', { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ andar: 2, zona: 'lab-sul-1', sala: 'Lab 213' }) })""", API)
        pg.wait_for_timeout(2600)
        pg.evaluate("document.getElementById('notif')?.click()"); pg.wait_for_timeout(4200)
    if quer('p-aviso'): gravar(p, 'p-aviso', app, aviso, **F)

def main(base):
    demo = base + '/docs/demos/campus.html?clean&qualidade=alta'
    with sync_playwright() as p:
        so = set(sys.argv[1:])
        quer = lambda n: not so or n in so

        if API:
            real(p, base, quer); return

        def capa(pg):
            pg.evaluate('window.Campus3D.setLayers({ ...window.Campus3D.layers(), labels: false })')
            pg.evaluate('window.Campus3D.zoom(1.5)'); pg.wait_for_timeout(1000)
            pg.evaluate("""() => new Promise((ok) => { const C = window.Campus3D; const v = C.getView(); const t0 = performance.now();
              const f = (t) => { const k = Math.min(1, (t - t0) / 16000); C.setView({ ...v, t: v.t - k * 0.9 }); if (k < 1) requestAnimationFrame(f); else ok(); }; requestAnimationFrame(f); })""")
        if quer('capa'): gravar(p, 'capa', demo + '&mode=campus&hour=17.4', capa)

        def evento(pg):
            pg.wait_for_timeout(1800); pg.evaluate('window.Campus3D.eventReveal()'); pg.wait_for_timeout(4200)
        if quer('evento'): gravar(p, 'evento', demo + '&mode=campus&hour=14', evento)

        # Telas do participante: vídeos curtos em pé, como o celular
        app = base + '/prototipo/index.html'
        F = dict(tam=(430, 932), corte=1.4)
        def clicar(pg, sel, ms=900):
            el = pg.locator(sel).first
            if el.count(): el.click()
            pg.wait_for_timeout(ms)
        def cracha(pg):
            pg.wait_for_timeout(900)
            for sel, txt in (('#gname', 'Ana Beatriz Souza'), ('#gmail', 'ana.souza@email.com'), ('#ginst', 'UERN'), ('#gcity', 'Pau dos Ferros')):
                pg.click(sel); pg.keyboard.type(txt, delay=45); pg.wait_for_timeout(250)
            pg.check('#gok'); pg.wait_for_timeout(400)
            clicar(pg, '[data-form=guest] button[type=submit]', 6500)
        if quer('t-cracha'): gravar(p, 't-cracha', app + '?tela=visitante', cracha, **F)
        def salvar(pg):
            pg.wait_for_timeout(1200)
            clicar(pg, '.page [data-act=save]:not(.on)', 1600)
            clicar(pg, '.page [data-act=save]:not(.on)', 1600)
            clicar(pg, '[data-act=filter][data-f=saved]', 2600)
        if quer('t-salvar'): gravar(p, 't-salvar', app + '?tela=agenda', salvar, **F)
        def materiais(pg):
            pg.wait_for_timeout(1500)
            clicar(pg, '.page [data-act=scan]', 1800)
            clicar(pg, '[data-act=simulate][data-q="react-native"]', 3200)
            clicar(pg, '[data-act=scanopen]', 2200)
            pg.mouse.move(215, 600); pg.mouse.wheel(0, 520); pg.wait_for_timeout(2600)
        if quer('t-materiais'): gravar(p, 't-materiais', app + '?tela=atividade&demo=1', materiais, **F)
        def aviso(pg):
            pg.wait_for_timeout(1300)
            pg.mouse.move(215, 600); pg.mouse.wheel(0, 380); pg.wait_for_timeout(900)
            clicar(pg, '.page [data-act=remind]', 1300)
            clicar(pg, '.page [data-act=remindtest]', 5200)
        if quer('t-aviso'): gravar(p, 't-aviso', app + '?tela=atividade', aviso, **F)
        def conquista(pg):
            pg.wait_for_timeout(4200)
            pg.evaluate("document.getElementById('combtoast')?.click()"); pg.wait_for_timeout(600)
            clicar(pg, '[data-act=tab][data-tab=profile]', 400); pg.goto(app + '?tela=colmeia'); pg.wait_for_timeout(3800)
        if quer('t-conquista'): gravar(p, 't-conquista', app + '?tela=favo', conquista, **F)
        def contato(pg):
            pg.wait_for_timeout(1500)
            clicar(pg, '[data-act=simulate][data-q=colega]', 3200)
            clicar(pg, '[data-act=scanopen]', 3500)
        if quer('t-contato'): gravar(p, 't-contato', app + '?tela=qr&demo=1', contato, **F)
        def sala(pg):
            pg.wait_for_timeout(2200)
            clicar(pg, '[data-act=finder]', 900)
            pg.keyboard.type('lab 210', delay=90); pg.wait_for_timeout(1300); pg.keyboard.press('Enter'); pg.wait_for_timeout(9000)
        if quer('t-sala'): gravar(p, 't-sala', app + '?tela=mapa', sala, **F)
        if so and not so & {'campus-voo', 'andares', 'rota', 'dia-24h', 'app-tour'}: return
        def voo(pg):
            pg.evaluate('window.Campus3D.zoom(1.45)'); pg.wait_for_timeout(900)
            pg.evaluate("""() => new Promise((ok) => { const C = window.Campus3D; const v = C.getView(); const t0 = performance.now();
              const f = (t) => { const k = Math.min(1, (t - t0) / 11000); C.setView({ ...v, t: v.t + k * Math.PI * 0.9 }); if (k < 1) requestAnimationFrame(f); else ok(); }; requestAnimationFrame(f); })""")
        gravar(p, 'campus-voo', demo + '&mode=evento&hour=15', voo)

        def andares(pg):
            C = 'window.Campus3D'
            pg.evaluate(f'{C}.openStack()'); pg.wait_for_timeout(3500)
            for l in (0, 1, 2):
                pg.evaluate(f'{C}.goFloor({l})'); pg.wait_for_timeout(1300); pg.evaluate(f'{C}.zoom(1.35)'); pg.wait_for_timeout(2300)
            pg.evaluate(f'{C}.openStack()'); pg.wait_for_timeout(2500)
        gravar(p, 'andares', demo + '&mode=evento&hour=14', andares)

        def rota(pg):
            pg.evaluate("window.Campus3D.journey(2, 'labs-norte-2')"); pg.wait_for_timeout(9000); pg.evaluate('window.Campus3D.zoom(1.3)'); pg.wait_for_timeout(3000)
        gravar(p, 'rota', demo + '&mode=evento&hour=14', rota)

        def dia(pg):
            pg.evaluate("""() => { const d = document.createElement('div'); d.id = 'relogio';
              d.style.cssText = 'position:fixed;left:48px;top:40px;font:800 96px/1 Manrope,system-ui,sans-serif;color:#fff;letter-spacing:-3px;text-shadow:0 6px 30px rgba(0,0,0,.45);z-index:9';
              document.body.appendChild(d); document.getElementById('stamp').hidden = true; }""")
            pg.evaluate("""() => new Promise((ok) => { const C = window.Campus3D; const t0 = performance.now(); const dur = 16000;
              const f = (t) => { const k = Math.min(1, (t - t0) / dur); const h = (6 + k * 24) % 24; C.setHour(h);
                const hh = Math.floor(h), mm = Math.floor((h - hh) * 60 / 15) * 15; document.getElementById('relogio').textContent = String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
                if (k < 1) requestAnimationFrame(f); else ok(); }; requestAnimationFrame(f); })""")
        gravar(p, 'dia-24h', demo + '&mode=campus&hour=6', dia)

        def app(pg):
            pg.wait_for_timeout(1500)
            for sel, ms in [('[data-act=tab][data-tab=agenda]', 2600), ('text=Introdução ao React Native com Expo', 3200), ('[data-act=tab][data-tab=map]', 3800), ('[data-act=finder]', 1200)]:
                el = pg.locator(sel).first
                if el.count(): el.click()
                pg.wait_for_timeout(ms)
            pg.fill('#fq', 'bebedouro'); pg.wait_for_timeout(1500); pg.press('#fq', 'Enter'); pg.wait_for_timeout(4500)
        gravar(p, 'app-tour', base + '/prototipo/index.html?tela=home', app, tam=(430, 932), corte=1.5)

if __name__ == '__main__':
    srv, base = servir()
    try: main(base)
    finally: srv.shutdown()
