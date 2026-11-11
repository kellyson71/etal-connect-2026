"""Documenta os dois motores existentes, sem modificar o aplicativo.

Uso: python3 scripts/documentar-modelos.py
Saída: docs/comparacao-modelos/ (HTML, PDF, PNGs, pares e evidências).
Requer Playwright, Pillow e Chrome locais. Usa somente dados demonstrativos.
"""
from datetime import datetime
import argparse
import hashlib
import html
import json
from pathlib import Path
import socket
import shutil
import subprocess
import time
import urllib.request

from PIL import Image, ImageDraw, ImageFont
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/comparacao-modelos'
WIDTH, HEIGHT, SCALE = 1600, 1000, 1.5
HOUR = 14


def scene(key, title, note, center, span, angle=.5, elevation=42, **kw):
    return dict(key=key, title=title, note=note, center=center, span=span,
                angle=angle, elevation=elevation, mode='campus', **kw)


SCENES = [
    scene('01-campus-frente', 'Campus · vista pela frente', 'Organização dos blocos, caminhos e áreas livres a partir da rodovia.', [-64, -120], 550),
    scene('02-campus-fundos', 'Campus · vista pelos fundos', 'O mesmo conjunto observado pelo lado oposto, incluindo a área esportiva.', [-64, -120], 550, angle=3.64),
    scene('03-evento', 'Modo Evento · edifícios em destaque', 'Bloco principal, auditório, cantina e pátio recebem as cores do evento.', [-8, -8], 155, event=True),
    scene('04-fachada', 'Bloco principal · fachada de entrada', 'Entrada do bloco, cobertura do pátio e relação com a circulação externa.', [-8, -22], 110, elevation=28),
    scene('05-auditorio', 'Auditório · vista lateral', 'Volume único do auditório e sua ligação com o bloco principal.', [-22, -25], 105, angle=-1.1, elevation=35),
    scene('06-fundos-bloco', 'Bloco principal · fundos', 'Fachada posterior e circulação em direção ao Anexo.', [-10, -27], 110, angle=3.64, elevation=32),
    scene('07-portaria', 'Portaria · acesso ao campus', 'Portões, guarita e início da passarela. A posição da guarita foi revista no modelo novo.', [12, 43], 85, angle=.18, elevation=35),
    scene('08-jardim', 'Jardim · entrada e pátio', 'Canteiros, caminhos e vegetação ao lado da entrada.', [12, 24], 65, angle=1.05, elevation=55),
    scene('09-entorno', 'Entorno · BR-405 e vizinhança', 'Apartamentos, Elétrica, Brisanet e acesso pela rodovia; posições vizinhas são aproximadas.', [-35, 93], 250, angle=3.4, elevation=50),
    scene('10-esportes', 'Campus · equipamentos e área esportiva', 'Ginásio, piscina, quadras e blocos do fundo do terreno.', [-85, -170], 280, elevation=55),
    scene('11-andares', 'Bloco principal · três andares abertos', 'Abertura nativa de cada motor: o clássico separa os pisos verticalmente; o novo também os recua em escada. Enquadramentos ajustados a essas aberturas.', [-8, -30], 140, angle=.62, elevation=48, kind='stack'),
    scene('12-terreo', 'Por dentro · térreo', 'Mesmo pavimento: setores administrativos, recepção, auditório e circulação. No novo, o corte a 1,25 m expõe o interior; o clássico representa as salas em volumes.', [-8, -28], 105, angle=1.42, elevation=60, kind='floor', level=0, connections=True),
    scene('13-primeiro', 'Por dentro · primeiro andar', 'Salas, corredores e pátio interno vistos por cima; corte do novo a 1,25 m acima do piso.', [-8, -28], 105, angle=1.42, elevation=60, kind='floor', level=1, connections=True),
    scene('14-segundo', 'Por dentro · segundo andar', 'A mesma leitura do segundo pavimento, preservando a direção de observação.', [-8, -28], 105, angle=1.42, elevation=60, kind='floor', level=2, connections=True),
    scene('15-rampa', 'Por dentro · rampa e circulação leste', 'No clássico, a área da rampa é um plano com divisória. O novo acrescenta pistas inclinadas, paredes e patamares; a subida que chega ao primeiro andar fica visível.', None, 32, angle=1.42, elevation=62, kind='detail', level=1, zone_kind='ramp', connections=True),
    scene('16-escada', 'Por dentro · escada oeste', 'Mesmo centro da planta: volume e símbolo no clássico, degraus e patamares no novo. A subida até o primeiro andar fica visível.', None, 30, angle=1.42, elevation=62, kind='detail', level=1, zone_kind='stairs', connections=True),
    scene('17-nadic', 'Por dentro · sala dos bolsistas do NADIC', 'Mesmo ambiente, identificado pela zona sala-nadic no primeiro andar. A representação de móveis existe somente no novo.', None, 27, angle=1.42, elevation=58, kind='detail', level=1, zone='sala-nadic'),
    scene('18-planta', 'Primeiro andar · leitura em planta', 'Projeção superior do mesmo pavimento. No clássico, o modo 2D é nativo; no novo, a câmera é colocada quase na vertical sobre o corte.', [-8, -28], 105, angle=1.42, elevation=89.9, kind='flat', level=1),
]


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def server():
    with socket.socket() as s:
        s.bind(('127.0.0.1', 0))
        port = s.getsockname()[1]
    process = subprocess.Popen(['python3', '-m', 'http.server', str(port), '--bind', '127.0.0.1'],
                               cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    base = f'http://127.0.0.1:{port}'
    for _ in range(100):
        try:
            urllib.request.urlopen(base, timeout=1).close()
            return process, base
        except OSError:
            time.sleep(.1)
    process.terminate()
    raise RuntimeError('Não foi possível abrir o servidor temporário')


OLD_POSE = r"""async s => {
 const C=Campus3D; C.setFlat(false); await C.toCampus(); C.setMode(s.event?'evento':'campus');
 C.setHour(14); C.setLayers({labels:false,trees:true,shadows:true,cars:true});
 const kind=s.kind||'exterior'; let center=s.center, h=3;
 if(kind==='stack') {await C.openStack(); const v=C.getView();center=[v.x,v.y];h=0;}
 if(['floor','detail','flat'].includes(kind)) {await C.goFloor(s.level);h=1;}
 if(kind==='flat') C.setFlat(true);
 const e=s.elevation*Math.PI/180, k=kind==='flat'?1:Math.sin(e), z=1600/s.span;
 const target=[center[0],center[1]];
 C.setView({x:center[0]-Math.sin(s.angle)*h*.92/k,y:center[1]-Math.cos(s.angle)*h*.92/k,
            z,t:s.angle,k,hv:kind==='flat'?0:1});
 C.redraw(); await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
 return {engine:'Canvas 2D · projeção axonométrica',target,view:C.getView(),state:C.state(),quality:C.quality()};
}"""

NEW_POSE = r"""async s => {
 const m=MAPA3D;m.abertura.terminar();m.viagem.limpar();m.palco.parar();
 m.estilo.setMode(s.event?'evento':'campus');CampusNovo.setHour(14);
 const kind=s.kind||'exterior';let center=s.center,h=3,span=s.span;
 const st={abre:0,esc:1,corte:99,ops:[1,1,1],elos:[1,1],plano:0,chegada:0,iso:0,isoMax:1};
 if(kind==='stack'){Object.assign(st,{abre:1,esc:1});center=[-8,-58];h=9;span=170;}
 if(['floor','detail','flat'].includes(kind)){
  const level=s.level;Object.assign(st,{abre:1,esc:0,corte:level*3.45+1.25,
    ops:[0,1,2].map(k=>k===level?1:0),elos:s.connections?[0,1].map(k=>k<Math.max(level,1)?1:0):[0,0]});h=level*3.45+1;
 }
 m.palco.set(st);m.controls.enableDamping=false;m.controls.enabled=false;
 m.camera.fov=38;m.camera.near=.15;m.camera.far=4000;m.camera.updateProjectionMatrix();
 const e=s.elevation*Math.PI/180, px=1600/span;
 const d=1000/(2*Math.tan(m.camera.fov*Math.PI/360)*px);
 const target=[center[0],h,center[1]],a=s.angle;
 const pos=[target[0]+Math.sin(a)*Math.cos(e)*d,target[1]+Math.sin(e)*d,target[2]+Math.cos(a)*Math.cos(e)*d];
 m.camera.position.set(...pos);m.controls.target.set(...target);m.camera.lookAt(m.controls.target);
 m.controls.update();
 const over=st.abre>.05;m.principal.grupo.traverse(o=>o.layers.set(over?1:0));m.viagem.camada(over?1:0);
 m.renderer.shadowMap.needsUpdate=true;
 window.renderDocumentation=()=>{m.camera.layers.set(0);m.renderer.autoClear=true;m.renderer.render(m.scene,m.camera);
  if(over){const bg=m.scene.background;m.scene.background=null;m.renderer.autoClear=false;m.renderer.clearDepth();
  m.camera.layers.set(1);m.renderer.render(m.scene,m.camera);m.camera.layers.set(0);m.renderer.autoClear=true;m.scene.background=bg;}};
 renderDocumentation();await new Promise(r=>requestAnimationFrame(()=>{renderDocumentation();r()}));
 return {engine:'three.js r160 · perspectiva',target,position:m.camera.position.toArray(),fov:m.camera.fov,
    elevation:s.elevation,angle:a,span,stage:{...m.palco.estado()}};
}"""


def prepare(page, base, engine):
    page.bring_to_front()
    if engine == 'classico':
        page.goto(base + '/docs/demos/campus.html?qualidade=alta&clean=1&hour=14', wait_until='networkidle')
        page.wait_for_function('Campus3D.spritesReady() >= 42')
        page.evaluate('Campus3D.setQuality("alta")')
    else:
        page.goto(base + '/mapa3d/?passeio=0&intro=0&aba=1', wait_until='domcontentloaded')
        page.wait_for_function('window.MAPA3D?.ready', timeout=90000)
        page.add_style_tag(content='body>:not(#tela){visibility:hidden!important}#tela{visibility:visible!important}')
    page.evaluate('document.fonts.ready')
    page.wait_for_timeout(800)


def resolve_scenes(page):
    return page.evaluate(r"""scenes=>scenes.map(s=>{
      if(s.center)return s;const l=PLAN.floors[s.level];
      const z=s.zone?l.zones.find(z=>z.id===s.zone):l.zones.find(z=>z.kind===s.zone_kind);
      if(!z)throw Error('Zona não encontrada: '+s.key);
      const p=z.points?z.points.split(' ').map(v=>v.split(',').map(Number)):[[z.x,z.y],[z.x+z.w,z.y],[z.x+z.w,z.y+z.h],[z.x,z.y+z.h]];
      const xs=p.map(q=>q[0]),ys=p.map(q=>q[1]);
      return {...s,zone:z.id,center:[PLAN.world.x0+(Math.min(...xs)+Math.max(...xs))/2*PLAN.world.sx,
        PLAN.world.y0+(Math.min(...ys)+Math.max(...ys))/2*PLAN.world.sy]};
    })""", SCENES)


def capture(page, base, spec, engine):
    page.bring_to_front()
    pose = page.evaluate(OLD_POSE if engine == 'classico' else NEW_POSE, spec)
    page.wait_for_timeout(350)
    if engine == 'novo':
        page.evaluate('renderDocumentation()')
    path = OUT / 'imagens' / engine / (spec['key'] + '.png')
    page.locator('#map' if engine == 'classico' else '#tela').screenshot(path=str(path), animations='disabled')
    return {'file': str(path.relative_to(OUT)), 'sha256': digest(path), 'camera': pose}


def pair_images(spec):
    images = [Image.open(OUT / 'imagens' / e / (spec['key'] + '.png')).convert('RGB') for e in ('classico', 'novo')]
    # The original PNGs retain full resolution; this derived board fits slides.
    w, h = 1280, 800  # bom para slide; os PNGs originais ficam só na máquina (não vão para o Git)
    board = Image.new('RGB', (w * 2 + 64, h + 116), '#f4f6fa')
    draw = ImageDraw.Draw(board)
    font_path = subprocess.check_output(['fc-match', '-f', '%{file}', 'sans-serif'], text=True).strip()
    font = ImageFont.truetype(font_path, 30)
    for i, (image, label) in enumerate(zip(images, ['CLÁSSICO · Canvas', 'NOVO · WebGL'])):
        x = 16 + i * (w + 32)
        draw.text((x + 12, 17), label, font=font, fill='#22386f')
        board.paste(image.resize((w, h), Image.Resampling.LANCZOS), (x, 66))
    path = OUT / 'pares' / (spec['key'] + '.jpg')
    board.save(path, quality=82, optimize=True, progressive=True)
    return str(path.relative_to(OUT))


def mobile(context, base):
    records = []
    mobile_context = context.browser.new_context(viewport={'width':390,'height':844},
        device_scale_factor=SCALE, is_mobile=True, has_touch=True, reduced_motion='reduce',
        service_workers='block', locale='pt-BR')
    for key, title, tela in [('19-app-evento', 'No aplicativo · modo Evento', 'mapa'),
                              ('20-app-andares', 'No aplicativo · andares abertos', 'bloco')]:
        row = dict(key=key, title=title, note='Interface real em 390 × 844 px, tema claro e dados de exemplo. O enquadramento é o padrão de cada interface.', kind='mobile')
        for engine in ['classico', 'novo']:
            page = mobile_context.new_page()
            page.goto(base + f'/prototipo/?tela={tela}&mapa={engine}&tema=light&qualidade=alta&ceu=14&moldura', wait_until='domcontentloaded')
            if engine == 'novo':
                frame = page.frame_locator('.mapa-aba iframe')
                frame.locator('#modos').wait_for(timeout=90000)
                inner = page.locator('.mapa-aba iframe').element_handle().content_frame()
                inner.wait_for_function('window.MAPA3D?.ready', timeout=90000)
                if tela == 'bloco':
                    inner.evaluate('CampusNovo.setMode("andares")')
                page.wait_for_timeout(2600)
            else:
                page.wait_for_function('Campus3D.spritesReady() >= 42')
                page.wait_for_timeout(700)
            path = OUT / 'imagens' / engine / (key + '.png')
            page.locator('.screen').screenshot(path=str(path))
            row[engine] = {'file':str(path.relative_to(OUT)), 'sha256':digest(path)}
            page.close()
        records.append(row)
        print(key, flush=True)
    mobile_context.close()
    return records


def documents(evidence):
    esc = html.escape
    cards = []
    for i, s in enumerate(evidence['views'], 1):
        for engine in ['classico','novo']:
            # prévias leves (também as do celular): o HTML e o PDF usam só elas
            preview = OUT / 'previas' / engine / (s['key']+'.jpg')
            preview.parent.mkdir(parents=True, exist_ok=True)
            with Image.open(OUT/s[engine]['file']) as original:
                image = original.convert('RGB')
                image.thumbnail((440,952) if s.get('kind') == 'mobile' else (1200,750),Image.Resampling.LANCZOS)
                image.save(preview,quality=80,optimize=True,progressive=True)
            s[engine]['preview'] = str(preview.relative_to(OUT))
        figures = ''.join(f'<figure><figcaption>{label}</figcaption><a href="{s.get("pair") or s[e]["preview"]}"><img src="{s[e]["preview"]}" alt="{esc(s["title"])} — {label}"></a></figure>'
                          for e, label in [('classico', 'Clássico · Canvas'), ('novo', 'Novo · WebGL')])
        board = f'<a class="download" href="{s["pair"]}" download>Baixar comparação em JPG ↗</a>' if s.get('pair') else ''
        cards.append(f'<section class="sheet" id="{s["key"]}"><header><span class="eyebrow">ETAL Connect / Comparação {i:02}</span><h2>{esc(s["title"])}</h2><p>{esc(s["note"])}</p></header><div class="pair {"mobile" if s.get("kind")=="mobile" else ""}">{figures}</div><footer>{board}<span>{i:02} / {len(evidence["views"]):02} · Capturas reais dos motores</span></footer></section>')
    nav = ''.join(f'<a href="#{s["key"]}">{i:02} · {esc(s["title"])}</a>' for i, s in enumerate(evidence['views'], 1))
    date = evidence['capturedAt'][:10]
    doc = f'''<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>ETAL Connect · Comparação dos mapas</title>
<style>
@font-face{{font-family:Texto;src:url('fontes/dm-sans.woff2');font-weight:100 900}}
*{{box-sizing:border-box}}:root{{font-family:Texto,system-ui,sans-serif;color:#1f2f57;background:#e9edf4}}body{{margin:0}}a{{color:#22386f}}.cover,.sheet{{background:white;max-width:1600px;margin:28px auto;padding:38px;border:1px solid #dfe5ef;border-radius:18px}}.eyebrow{{text-transform:uppercase;letter-spacing:.13em;font-size:11px;color:#66738f;font-weight:700}}h1{{font-size:44px;line-height:1.1;max-width:850px;margin:20px 0}}h2{{font-size:27px;margin:10px 0}}p{{font-size:15px;line-height:1.5;max-width:1100px;color:#52627e}}.lead{{font-size:20px}}.links{{display:flex;flex-wrap:wrap;gap:12px;margin:28px 0}}.links a{{padding:12px 16px;border:1px solid #dfe5ef;border-radius:10px;text-decoration:none}}.pair{{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:24px}}figure{{margin:0;min-width:0}}figcaption{{font-size:13px;font-weight:700;margin-bottom:10px}}figure img{{display:block;width:100%;height:auto;border:1px solid #e2e7ef;border-radius:9px}}.mobile img{{max-width:280px;margin:auto}}footer{{display:flex;justify-content:space-between;gap:20px;font-size:11px;color:#66738f;margin-top:20px}}nav{{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:24px 0}}nav a{{font-size:13px;text-decoration:none}}.method{{border-top:1px solid #dfe5ef;padding-top:14px;margin-top:24px}}.method p{{font-size:12px}}.back{{position:fixed;bottom:16px;right:16px;background:#22386f;color:white;text-decoration:none;padding:12px 17px;border-radius:30px}}@media(max-width:700px){{.cover,.sheet{{margin:12px;padding:20px}}h1{{font-size:30px}}.pair,nav{{grid-template-columns:1fr}}}}@page{{size:A4 landscape;margin:10mm}}@media print{{:root{{background:white}}body{{margin:0}}.cover,.sheet{{max-width:none;width:100%;border:0;border-radius:0;margin:0;padding:4mm 0;break-after:page;page-break-after:always}}.sheet:last-child{{break-after:auto;page-break-after:auto}}.cover{{height:185mm}}h1{{font-size:32px;margin:12px 0}}.lead{{font-size:16px}}h2{{font-size:23px;margin:7px 0}}.eyebrow{{font-size:9px}}p{{font-size:11px;line-height:1.4;margin:7px 0}}.pair{{gap:5mm;margin-top:4mm}}figure img{{width:100%;height:100mm;object-fit:contain;background:#f4f6fa;border-radius:0}}.mobile img{{height:128mm;width:auto;max-width:100%}}figcaption{{font-size:10px;margin-bottom:2mm}}footer{{margin-top:3mm;font-size:9px}}.download,.back,nav,.cover .links{{display:none}}.method{{margin-top:9mm;padding-top:4mm}}.method p{{font-size:11px}}}}
</style></head><body><main><section class="cover" id="inicio"><span class="eyebrow">ETAL Connect / registro visual / {date}</span><h1>Do mapa clássico<br>ao modelo 3D atual</h1><p class="lead">Os mesmos lugares, observados de direções equivalentes.</p><p>20 comparações: campus e entorno, fachadas, acesso, jardins, andares, rampa, escada, sala e interface do aplicativo.</p><div class="links"><a href="../pdf/ETAL-Connect-comparacao-dos-mapas.pdf">Abrir PDF</a><a href="https://etal-connect.vercel.app/?tela=mapa&amp;mapa=classico&amp;moldura&amp;tema=light&amp;qualidade=alta&amp;ceu=14">Explorar o clássico ↗</a><a href="https://etal-connect.vercel.app/?tela=mapa&amp;mapa=novo&amp;moldura&amp;tema=light&amp;ceu=14">Explorar o novo ↗</a></div><nav>{nav}</nav><div class="method"><p><b>Como comparar.</b> Nas cenas externas, os motores usam o mesmo centro no levantamento, azimute, inclinação do chão, horário (14h) e escala no plano do alvo. O Canvas usa projeção axonométrica e altura estilizada; o WebGL usa perspectiva. Portanto, coincidência exata de pixels não é esperada. Na abertura dos três andares, o enquadramento acomoda a disposição nativa de cada motor.</p><p><b>Interiores.</b> Os pavimentos comparados são os mesmos. O corte horizontal do modelo novo, a 1,25 m acima do piso, revela paredes e móveis; o clássico conserva suas salas em volumes simplificados. Estas capturas documentam a geometria existente, sem inventar uma versão em primeira pessoa para o clássico.</p><p><b>Versões.</b> Clássico preservado em prototipo/campus3d.js e atual em mapa3d/, no commit <code>{evidence['commit'][:7]}</code>. O backup congelado de 07/11 em modelo-3d/ é um arquivo histórico anterior e não foi usado como se fosse o clássico atual.</p><p>As representações usam a planta de referência de 2012, o levantamento do campus e ajustes registrados no projeto. Nomes de salas e alocações demonstrativas. Este registro não é um levantamento arquitetônico oficial.</p></div></section>{''.join(cards)}</main><a class="back" href="#inicio">Índice ↑</a></body></html>'''
    (OUT / 'index.html').write_text(doc)
    (OUT / 'README.md').write_text(f'''# Comparação visual dos mapas do ETAL Connect

Capturado em {evidence['capturedAt']}. Fonte: commit `{evidence['commit']}`.

- `index.html`: documento com as imagens lado a lado e links para os modelos.
- PDF para apresentação e impressão: `docs/pdf/ETAL-Connect-comparacao-dos-mapas.pdf`.
- `pares/`: 18 comparações em JPG, prontas para colocar em slides (clicar numa imagem do HTML abre o par).
- `previas/`: imagens leves para o HTML e o PDF.
- `imagens/classico/` e `imagens/novo/`: os 40 PNGs originais (cenas em 2400 × 1500 px, interfaces em 585 × 1266 px). Ficam só na máquina de quem gerou (fora do Git, 75 MB); os hashes estão em `evidencias.json` e o script os recria.
- `evidencias.json`: parâmetros das câmeras, arquivos-fonte, hashes e erros de navegador.

Reproduzir a partir da raiz: `python3 scripts/documentar-modelos.py`.
É necessário Playwright, Pillow e Chrome; o script abre e encerra seu próprio servidor local.
As capturas usam contextos novos, dados demonstrativos e armazenamento isolado; não alteram o aplicativo nem o backup `modelo-3d/`.

Clássico: https://etal-connect.vercel.app/?tela=mapa&mapa=classico&moldura&tema=light&qualidade=alta&ceu=14
Novo: https://etal-connect.vercel.app/?tela=mapa&mapa=novo&moldura&tema=light&ceu=14

A perspectiva do WebGL e a projeção axonométrica do Canvas impedem coincidência exata de pixels.
O registro alinha direção, local e pavimento; o corte dos interiores e a abertura dos andares estão explicados nas legendas.
O backup congelado em 07/11/2026 é anterior ao clássico preservado no app e não é confundido com ele.
''')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--reusar', action='store_true', help='Reutiliza pares já capturados se fontes, câmeras e hashes continuarem iguais.')
    parser.add_argument('--somente-documento', action='store_true', help='Remonta pares, HTML e PDF a partir das 40 capturas existentes e verificadas.')
    args = parser.parse_args()
    for folder in ['imagens/classico', 'imagens/novo', 'pares', 'fontes']:
        (OUT / folder).mkdir(parents=True, exist_ok=True)
    for name in ['dm-sans.woff2', 'dmsans-OFL.txt']:
        shutil.copyfile(ROOT/'exportacao/fontes'/name, OUT/'fontes'/name)
    if args.somente_documento:
        evidence=json.loads((OUT/'evidencias.json').read_text())
        assert len(evidence['views'])==20
        for view in evidence['views']:
            for engine in ['classico','novo']:
                assert digest(OUT/view[engine]['file'])==view[engine]['sha256']
            if view.get('pair'): view['pair']=pair_images(view)
        documents(evidence)
        (OUT/'evidencias.json').write_text(json.dumps(evidence,ensure_ascii=False,indent=2)+'\n')
        proc,base=server()
        try:
            with sync_playwright() as p:
                browser=p.chromium.launch(executable_path='/opt/google/chrome/chrome',headless=True,args=['--no-sandbox'])
                page=browser.new_page(viewport={'width':WIDTH,'height':HEIGHT})
                render_report(page,base)
                browser.close()
            archive()
        finally:
            proc.terminate();proc.wait(timeout=10)
        print('OK: documento e pacote remontados; 40 hashes conferidos.',flush=True)
        return
    proc, base = server()
    errors = []
    evidence = {'capturedAt':datetime.now().astimezone().isoformat(timespec='seconds'),
                'commit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),
                'viewport':{'width':WIDTH,'height':HEIGHT,'deviceScaleFactor':SCALE},'hour':HOUR,
                'captureProtocol':hashlib.sha256((OLD_POSE+NEW_POSE).encode()).hexdigest(),
                'sources':{p:digest(ROOT/p) for p in ['prototipo/campus3d.js','prototipo/plan-data.js','mapa3d/src/main.js','mapa3d/src/principal.js','mapa3d/src/dados.js']},
                'views':[], 'browserErrors':errors}
    previous = json.loads((OUT/'evidencias.json').read_text()) if args.reusar and (OUT/'evidencias.json').exists() else {}
    cached = {s['key']:s for s in previous.get('views',[])} if previous.get('sources') == evidence['sources'] and previous.get('captureProtocol') == evidence['captureProtocol'] else {}
    def reusable(s):
        return all((OUT/s[e]['file']).exists() and digest(OUT/s[e]['file'])==s[e]['sha256'] for e in ['classico','novo'])
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(executable_path='/opt/google/chrome/chrome', headless=True,
                                       args=['--no-sandbox','--enable-unsafe-swiftshader','--disable-background-timer-throttling'])
            context = browser.new_context(viewport={'width':WIDTH,'height':HEIGHT}, device_scale_factor=SCALE,
                                          reduced_motion='reduce',service_workers='block',locale='pt-BR')
            old,new = context.new_page(),context.new_page()
            for page,engine in [(old,'classico'),(new,'novo')]:
                page.on('pageerror',lambda err,e=engine:errors.append({'engine':e,'error':str(err)}))
                prepare(page,base,engine)
            for spec in resolve_scenes(old):
                saved = cached.get(spec['key'])
                if saved and all(saved.get(k)==v for k,v in spec.items()) and reusable(saved):
                    evidence['views'].append(saved)
                    print(spec['key']+' · reutilizada', flush=True)
                    continue
                row = dict(spec)
                for page,engine in [(old,'classico'),(new,'novo')]:
                    row[engine]=capture(page,base,spec,engine)
                row['pair']=pair_images(spec)
                evidence['views'].append(row)
                (OUT/'evidencias.json').write_text(json.dumps(evidence,ensure_ascii=False,indent=2)+'\n')
                print(spec['key'],flush=True)
            old.close();new.close()
            cached_mobile = [cached.get(key) for key in ['19-app-evento','20-app-andares']]
            if all(s and reusable(s) for s in cached_mobile):
                evidence['views'].extend(cached_mobile)
            else:
                evidence['views'].extend(mobile(context,base))
            documents(evidence)
            (OUT/'evidencias.json').write_text(json.dumps(evidence,ensure_ascii=False,indent=2)+'\n')
            context.close()
            context=browser.new_context(viewport={'width':WIDTH,'height':HEIGHT},service_workers='block')
            report=context.new_page()
            render_report(report,base)
            browser.close()
        archive()
        print(f'OK: {len(evidence["views"])} pares; {len(errors)} erros JS. {OUT}',flush=True)
        if errors:raise RuntimeError(f'Erros de navegador: {errors}')
    finally:
        proc.terminate();proc.wait(timeout=10)


PDF = ROOT/'docs/pdf/ETAL-Connect-comparacao-dos-mapas.pdf'


def render_report(page,base):
    page.goto(base+'/docs/comparacao-modelos/',wait_until='networkidle')
    page.evaluate('document.fonts.ready')
    assert page.locator('.sheet').count()==20
    assert page.evaluate('[...document.images].every(i=>i.complete&&i.naturalWidth>0)')
    PDF.parent.mkdir(parents=True, exist_ok=True)
    page.pdf(path=str(PDF),print_background=True,prefer_css_page_size=True,tagged=True,outline=True)
    page.screenshot(path=str(OUT/'indice.png'))


def archive():
    # Antes havia um ZIP com a pasta inteira (101 MB, cópia do que já está no repositório). Saiu; os PNGs originais
    # (75 MB) ficam só na máquina, fora do Git, e os hashes deles continuam em evidencias.json.
    (OUT/'ETAL-Connect-comparacao-modelos.zip').unlink(missing_ok=True)


if __name__=='__main__':
    main()
