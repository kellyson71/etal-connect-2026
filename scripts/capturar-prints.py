"""Tira as prints do README (docs/prints/) do protótipo rodando em http://127.0.0.1:8770.

    sh prototipo/rodar.sh &   # em outro terminal
    python3 scripts/capturar-prints.py

Celular de 390 × 844 (2×), movimento reduzido (o mapa pula a abertura), sem service worker e com os dados de exemplo.
O mapa 3D roda no Chrome sem placa de vídeo (SwiftShader): demora, mas a imagem é a mesma.
"""
import sys
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/prints'
BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:8770'
CEL = dict(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True,
           reduced_motion='reduce', service_workers='block', locale='pt-BR')
PERFIL = "sessionStorage.setItem('etal-perfil', JSON.stringify({ name: 'Maria Clara Fernandes', first: 'Maria Clara', initials: 'MC', course: 'Informática', year: '3º ano', id: '20231094010012', campus: 'Pau dos Ferros' }))"


def salvar(png, nome, largura=None):
    """PNG em paleta (bem menor, sem perder a nitidez da interface)."""
    im = Image.open(png).convert('RGB')
    if largura and im.width > largura:
        im = im.resize((largura, round(im.height * largura / im.width)), Image.Resampling.LANCZOS)
    im.quantize(colors=256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.FLOYDSTEINBERG).save(OUT / nome, optimize=True)
    Path(png).unlink()
    print(nome, f'{(OUT / nome).stat().st_size // 1024} KB')


def tela(ctx, url, nome, espera=1600, antes=None):
    p = ctx.new_page(); p.goto(BASE + url); p.wait_for_timeout(espera)
    if antes: antes(p)
    tmp = OUT / ('_' + nome); p.screenshot(path=str(tmp)); p.close(); salvar(tmp, nome)


def mapa(ctx, nome, acao=None, espera=4000):
    p = ctx.new_page(); p.goto(BASE + '/?tela=mapa')
    fr = None
    for _ in range(240):
        p.wait_for_timeout(500)
        fr = next((f for f in p.frames if 'mapa3d' in f.url), None)
        if fr and fr.evaluate('!!(window.MAPA3D && window.MAPA3D.ready)'): break
    if acao: fr.evaluate(acao)
    p.wait_for_timeout(espera)
    tmp = OUT / ('_' + nome); p.screenshot(path=str(tmp)); p.close(); salvar(tmp, nome)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as pw:
        b = pw.chromium.launch(executable_path='/opt/google/chrome/chrome', args=['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'])
        c = b.new_context(**CEL)
        tela(c, '/?tela=login', '01-entrada.png')
        tela(c, '/?tela=home', '02-inicio.png')
        tela(c, '/?tela=agenda', '03-agenda.png')
        tela(c, '/?tela=atividade', '04-atividade.png')
        # QR lido pela câmera do celular: o link abre o app e confirma a presença (exemplo)
        p = c.new_page(); p.goto(BASE + '/'); p.evaluate(PERFIL); p.goto(BASE + '/?qr=etal:react-native'); p.wait_for_timeout(4200)
        tmp = OUT / '_05'; p.screenshot(path=str(tmp) + '.png'); p.close(); salvar(str(tmp) + '.png', '05-presenca.png')
        mapa(c, '06-mapa-evento.png')
        mapa(c, '07-como-chegar.png', "window.CampusNovo.route(2, 'labs-norte-2'); setTimeout(() => window.MAPA3D.viagem.pular(), 300)", 7000)
        mapa(c, '08-andares.png', "window.CampusNovo.setMode('andares')", 6000)
        mapa(c, '09-campus.png', "window.CampusNovo.setMode('campus')", 9000)
        c.close()
        d = b.new_context(viewport={'width': 1440, 'height': 900}, device_scale_factor=1, reduced_motion='reduce', service_workers='block', locale='pt-BR')
        tela(d, '/admin.html', '10-painel.png', 2500)
        tela(d, '/qrs.html', '11-qr-codes.png', 1500)
        b.close()


if __name__ == '__main__':
    main()
