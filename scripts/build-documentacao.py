"""Apresentação do ETAL Connect: slides, fontes reais e demonstrações do código atual.

Geração: npm run docs. Não modifica prototipo/ nem publica o projeto.
"""
from html import escape
import json
import os
from pathlib import Path
import runpy
import sys

ROOT = Path(__file__).resolve().parents[1]
BASE = runpy.run_path(str(ROOT / 'scripts/documentacao_base.py'))
markdown = BASE['markdown']
reference = BASE['reference']
EVIDENCIA = json.loads((ROOT / 'docs/assets/evidencias.json').read_text())
SLIDES = []

ICONS = {
 'arrow-right':'M4 12h16m-6-6 6 6-6 6', 'arrow-left':'M20 12H4m6-6-6 6 6 6',
 'arrow-down':'M12 4v16m-6-6 6 6 6-6', 'close':'m6 6 12 12M6 18 18 6',
 'map':'m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Zm6-3v15m6-12v15',
 'pin':'M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Zm-5 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
 'calendar':'M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2Zm2-2v5M17 2v5M3 10h18M7 14h3m4 0h3m-10 3h3',
 'qr':'M3 3h6v6H3Zm12 0h6v6h-6ZM3 15h6v6H3Zm12 0h2v2h4v4h-6v-2m6-6v2M12 3v3m0 6h3M3 12h3m6 5v4',
 'user':'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a8 8 0 0 1 16 0v2',
 'users':'M16 21v-2a7 7 0 0 0-14 0v2M13 6a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm4-3a4 4 0 0 1 0 8m5 10v-2a7 7 0 0 0-5-6',
 'bell':'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4',
 'phone':'M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm3 3h4m-3 14h2',
 'layers':'m12 3 10 5-10 5L2 8Zm-10 9 10 5 10-5M2 16l10 5 10-5',
 'route':'M4 5h12a4 4 0 0 1 0 8H8a4 4 0 0 0 0 8h12M7 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm13 13v6m-3-3h6',
 'compass':'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-6-3-2 4-4 2 2-4Z',
 'book':'M3 3h7a3 3 0 0 1 3 3v15a4 4 0 0 0-4-2H3Zm10 3a3 3 0 0 1 3-3h5v16h-5a4 4 0 0 0-3 2',
 'file':'M6 2h8l5 5v15H5V2Zm8 0v6h5M8 12h8m-8 4h8',
 'globe':'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18Z',
 'grid':'M3 3h7v7H3Zm11 0h7v7h-7ZM3 14h7v7H3Zm11 0h7v7h-7Z',
 'expand':'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5',
 'download':'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5',
 'play':'m8 4 12 8-12 8Z', 'mouse':'M12 2a7 7 0 0 1 7 7v6a7 7 0 0 1-14 0V9a7 7 0 0 1 7-7Zm0 0v8',
 'zoom-in':'M16 10a6 6 0 1 1-12 0 6 6 0 0 1 12 0Zm-1 5 6 6M7 10h6m-3-3v6',
 'zoom-out':'M16 10a6 6 0 1 1-12 0 6 6 0 0 1 12 0Zm-1 5 6 6M7 10h6',
 'rotate':'M3 10a9 9 0 1 1 2 9M3 3v7h7',
 'sun':'M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM12 1v2m0 18v2M1 12h2m18 0h2M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2',
 'moon':'M21 13a9 9 0 1 1-10-10 7 7 0 0 0 10 10Z',
 'check':'m5 12 5 5L20 7', 'shield':'m12 2 9 4v6c0 6-9 10-9 10S3 18 3 12V6Zm-5 10 3 3 7-7',
 'wifi':'M2 8a15 15 0 0 1 20 0M5 12a10 10 0 0 1 14 0m-10 4a5 5 0 0 1 6 0m-3 4h.01',
 'wifi-off':'m2 2 20 20M2 8a15 15 0 0 1 5-3m5-1a15 15 0 0 1 10 4M5 12a10 10 0 0 1 6-3m5 1 3 2m-10 4a5 5 0 0 1 6 0m-3 4h.01',
 'cloud':'M6 19a5 5 0 0 1-1-10 7 7 0 0 1 13-2 6 6 0 0 1 0 12Z',
 'database':'M21 5c0 2-4 3-9 3S3 7 3 5s4-3 9-3 9 1 9 3Zm0 0v14c0 2-4 3-9 3s-9-1-9-3V5m0 7c0 2 4 3 9 3s9-1 9-3',
 'server':'M3 3h18v7H3Zm0 11h18v7H3Zm4-8h.01M7 17h.01m5-11h5m-5 11h5',
 'code':'m8 5-6 7 6 7M16 5l6 7-6 7m-3-17-2 20',
 'browser':'M3 3h18v18H3Zm0 5h18M6 5.5h.01M9 5.5h.01',
 'camera':'M4 6h4l2-3h4l2 3h4v15H4Zm12 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
 'clock':'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-5v6l4 2',
 'walk':'M15 3a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM8 9l4-3 3 5 4 1m-7-6-2 8-5 6m5-6 4 2 2 6',
 'mail':'M3 4h18v16H3Zm0 0 9 9 9-9',
 'terminal':'m4 7 5 5-5 5m9 0h7',
 'flask':'M9 2h6m-5 0v6L3 20h18L14 8V2M7 14h10',
 'spark':'m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5Z',
 'link':'m9 15 6-6M8 17l-2 2a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0m2-1 2-2a4 4 0 0 1 6 6l-5 5a4 4 0 0 1-6 0',
 'react':'M14 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM22 12c0 3-5 5-10 5S2 15 2 12s5-5 10-5 10 2 10 5ZM7 3c3-1 7 2 10 7s3 9 0 11-7-2-10-7S4 5 7 3Zm10 0c-3-1-7 2-10 7s-3 9 0 11 7-2 10-7 3-9 0-11Z',
}


def icon(name):
    return f'<svg class="icon" aria-hidden="true"><use href="#i-{name}"/></svg>'


def badge(text, name=None, tone=''):
    return f'<span class="pill {tone}">{icon(name) if name else ""}{text}</span>'


def button(text, name='arrow-right', attrs='', tone=''):
    return f'<button class="button {tone}" {attrs}>{text}{icon(name)}</button>'


def image(file, alt, cls='', credit=''):
    return f'<button class="zoom-image {cls}" data-zoom data-credit="{escape(credit)}" aria-label="Ampliar: {escape(alt)}"><img src="{{assets}}/{file}" alt="{escape(alt)}"></button>'


def demo(kind='map', params='', poster='cena-campus.webp', phone=False, auto=True):
    return f'''<div class="{'phone-shell' if phone else 'demo-surface'}" data-demo="{kind}" data-params="{params}" data-auto="{str(auto).lower()}">
+<img class="demo-poster" src="{{assets}}/{poster}" alt="Prévia atual do {'aplicativo' if kind=='app' else 'mapa do campus'}; a demonstração interativa carrega neste espaço">
+{'<span class="demo-label">Motor real do aplicativo</span>' if not phone else ''}
+<iframe title="{'Aplicativo' if kind=='app' else 'Mapa do campus'} interativo em modo demonstração" sandbox="allow-scripts" data-src="{{demos}}/{'app.html' if kind=='app' else 'campus.html'}?demo=1&qualidade=media&{params}" loading="lazy"></iframe>
+<button class="demo-launch" data-launch><span>{icon('play')}Explorar ao vivo</span></button></div>'''.replace('\n+', '\n')


def slide(id, title, chapter, body, source='', tone='', cover='cena-campus.webp', heading=None, lede=None):
    head = f'<h2 class="reveal" style="--i:0">{heading}</h2>' if heading else ''
    head += f'<p class="lede reveal" style="--i:1">{lede}</p>' if lede else ''
    SLIDES.append(dict(id=id,title=title,chapter=chapter,body=head+body,source=source,tone=tone,cover=cover))


def vid(name, cls='', loop=True):
    return f'<video class="auto-video {cls}" src="{{assets}}/videos/{name}.mp4" poster="{{assets}}/videos/{name}.webp" muted {"loop " if loop else ""}playsinline preload="metadata"></video>'


def full(name, title, extra=''):
    """Slide de vídeo em tela cheia: o vídeo toca sozinho e o título fica por cima."""
    return f'<div class="full-video">{vid(name)}</div><div class="full-shade"></div><h2 class="full-title reveal">{title}</h2>{extra}'


# ---------------- 01 · Abertura ----------------
slide('visao','ETAL Connect','01 / Abertura',f"""
<div class="cover-video">{vid('capa')}</div><div class="cover-shade"></div>
<div class="cover"><h1 class="cover-title reveal" style="--i:1">ETAL Connect</h1>
<p class="cover-line reveal" style="--i:2">Proposta de aplicativo para o ETAL · IFRN Pau dos Ferros</p></div>
<img class="cover-nadic reveal" style="--i:3" src="{{root}}prototipo/assets/nadic-logo.svg" alt="NADIC">
""",'','dark cover-slide','videos/capa.webp')

slide('chegada','Chegar ao evento','01 / Abertura',f"""
<img class="full-photo" src="{{assets}}/fontes/campus-fachada.webp" alt="Fachada do campus"><div class="photo-shade"></div>
<div class="question-tags big"><span class="reveal" style="--i:1">{icon('clock')}Já começou?</span><span class="reveal" style="--i:2">{icon('pin')}Onde é a sala?</span><span class="reveal" style="--i:3">{icon('qr')}Como confirmo a presença?</span></div>
""",'','dark','fontes/campus-fachada.webp')

# ---------------- 02 · Para o participante ----------------
def tela(nome, legenda, n):
    return f'<figure class="tela reveal" style="--i:{n}"><div class="phone-frame sm">{vid(nome)}</div><figcaption><span>{n}</span>{legenda}</figcaption></figure>'

PASSOS = [('p-entrar', 'Entra com o SUAP e recebe o crachá', 'id'), ('p-agenda', 'Monta a agenda', 'calendar'),
          ('p-presenca', 'Lê o QR da sala e confirma a presença', 'qr'), ('p-aviso', 'Recebe a troca de sala na hora', 'bell')]
for n, (nome, legenda, ic) in enumerate(PASSOS):
    trilha = ''.join(f'<li class="{"on" if k == n else "done" if k < n else ""}"><span>{k + 1}</span>{t}</li>' for k, (_, t, _) in enumerate(PASSOS))
    slide(f'participante-{n + 1}', legenda, '02 / Para o participante', f"""
<div class="destaque"><div class="d-txt"><b class="d-num reveal" style="--i:1">{n + 1}</b><h3 class="reveal" style="--i:2">{legenda}</h3><ol class="d-trilha reveal" style="--i:3">{trilha}</ol></div>
<div class="d-phone reveal" style="--i:1"><div class="phone-frame lg">{vid(nome, loop=False)}</div></div></div>
""", 'Gravado no app com uma conta real do SUAP' if n == 0 else '', '', f'videos/{nome}.webp', 'Para o participante' if n == 0 else None)

slide('materiais','Materiais depois da presença','02 / Para o participante',f"""
<div class="app-show"><div class="phone-frame reveal">{vid('t-materiais')}</div>
<ol class="app-points num">{''.join(f'<li class="reveal" style="--i:{n+2}"><span>{icon(ic)}</span>{t}</li>' for n,(ic,t) in enumerate([('qr','Lê o QR da sala'),('check','A presença é confirmada'),('file','Slides e arquivos liberados'),('star' if False else 'spark','Avalia a atividade')]))}</ol></div>
<p class="tag-proposta reveal" style="--i:7">{icon('clock')}Proposta · hoje com materiais de exemplo</p>
""",'','', 'videos/t-materiais.webp', 'Materiais depois da presença')

slide('conquistas','Conquistas e contatos','02 / Para o participante',f"""
<div class="telas duo">{tela('t-conquista','Cada presença vira um favo da colmeia',1)}{tela('t-contato','Troca de contato pelo QR do crachá',2)}</div>
""",'Telas de exemplo do protótipo','', 'videos/t-conquista.webp', 'Conquistas e contatos')

slide('sala','Achar a sala','02 / Para o participante',f"""
<div class="app-show"><div class="phone-frame reveal">{vid('t-sala')}</div>
<ul class="app-points">{''.join(f'<li class="reveal" style="--i:{n+2}"><span>{icon(ic)}</span>{t}</li>' for n,(ic,t) in enumerate([('pin','Busca a sala, o banheiro ou o bebedouro'),('route','Rota a pé desde a portaria'),('layers','Escada ou rampa, andar por andar')]))}</ul></div>
""",'Gravação do app atual','', 'videos/t-sala.webp', 'Achar a sala')

# ---------------- 03 · Organização e presença ----------------
slide('painel','Painel da organização','03 / Organização e presença',f"""
<div class="pnl" data-steps="6" data-interval="1700">
<div class="pnl-board"><div class="pnl-kpis">{''.join(f'<div class="pnl-kpi"><b data-count="{v}">{v}</b><small>{t}</small></div>' for v,t in [(312,'credenciados'),(82,'na sala agora'),(96,'visitantes')])}</div>
<div class="pnl-chart">{''.join(f'<i style="--h:{h}%;--d:{n*90}ms"></i>' for n,h in enumerate([18,35,62,88,70,46,30,22]))}</div>
<div class="pnl-send" data-step="1"><span>{icon('bell')}</span><div><b>Mudança de sala</b><small>React Native agora no Lab 210</small></div><em data-step="2">Enviar a todos</em></div>
<div class="pnl-csv" data-step="5">{icon('download')}Presenças em CSV → certificados no SUAP</div></div>
<div class="pnl-phones">{''.join(f'<div class="pnl-phone" style="--o:{n}"><img src="{{assets}}/app-home.png" alt=""><div class="pnl-notif" data-step="3">{icon("bell")}<div><b>Mudança de sala</b><small>React Native agora no Lab 210</small></div></div></div>' for n in range(3))}</div>
</div>
""",'Painel do protótipo · avisos e troca de sala já passam pela API; gráficos ainda são de exemplo','', 'painel.png', 'Painel da organização')

def presenca(sid, titulo, cena, pros, contra, status):
    st = 'ok' if status.startswith('Já') else 'todo'
    return slide(sid, titulo, '03 / Organização e presença', f"""
<div class="pres"><div class="pres-scene" data-steps="5" data-interval="1700">{cena}</div>
<div class="pres-side"><span class="pres-status {st}">{icon('check' if st=='ok' else 'clock')}{status}</span>
<div class="pres-pc"><b>{icon('check')}{pros}</b><b class="con">{icon('close')}{contra}</b></div></div></div>
""", '', '', 'qr-exemplo.svg', titulo)

presenca('pres-porta', 'Presença: QR na porta', f"""
<div class="ps-door" data-step="0"><img src="{{assets}}/qr-exemplo.svg" alt="QR impresso"><small>Lab 210</small></div>
<div class="ps-phone ok" data-step="1">{icon('check')}<b>Presença confirmada</b></div>
<div class="ps-chat" data-step="2"><span>{icon('camera')}</span>foto do QR</div>
<div class="ps-home" data-step="3">{icon('user')}<small>em casa</small></div>
<div class="ps-phone warn" data-step="4">{icon('check')}<b>Também confirma</b></div>
""", 'Simples, sem equipe na sala', 'A foto do QR funciona durante a aula', 'Já funciona no app')

presenca('pres-tela', 'Presença: QR na tela, mudando', f"""
<div class="ps-screen" data-step="0"><img src="{{assets}}/qr-exemplo.svg" alt="QR no telão"><i class="ps-ring"></i><small>muda a cada 30 s</small></div>
<div class="ps-phone ok" data-step="1">{icon('check')}<b>Presença confirmada</b></div>
<div class="ps-chat" data-step="2"><span>{icon('camera')}</span>foto do QR</div>
<div class="ps-home" data-step="3">{icon('user')}<small>em casa</small></div>
<div class="ps-phone bad" data-step="4">{icon('close')}<b>QR vencido</b></div>
""", 'A foto chega vencida', 'Precisa de uma tela ligada na sala', 'A implementar')

presenca('pres-equipe', 'Presença: a equipe lê o QR', f"""
<div class="ps-badge" data-step="0"><span class="ps-av">AS</span><b>Ana Beatriz</b><img src="{{assets}}/qr-exemplo.svg" alt="QR pessoal"><small>QR pessoal, muda a cada 30 s</small></div>
<div class="ps-staff" data-step="1">{icon('camera')}<small>equipe do credenciamento</small></div>
<div class="ps-phone ok" data-step="2">{icon('check')}<b>Ana Beatriz · confirmada</b></div>
<div class="ps-chat" data-step="3"><span>{icon('camera')}</span>print do QR</div>
<div class="ps-phone bad" data-step="4">{icon('close')}<b>Não vale: código vencido</b></div>
""", 'Alguém vê quem está na sala', 'Precisa de uma pessoa por sala', 'A implementar')

# ---------------- 04 · Próximos passos ----------------
def wipe(base, top, l, r):
    return f'<div class="wipe reveal"><img src="{{assets}}/{base}" alt="{l}"><div class="wipe-top"><img src="{{assets}}/{top}" alt="{r}"></div><i class="wipe-line"></i><span class="wipe-tag l">{l}</span><span class="wipe-tag r">{r}</span></div>'

slide('planta','Da planta de 2012 ao mapa','04 / Próximos passos', wipe('fontes/planta-2012-0.webp','fontes/planta-atual-0.svg','Dissertação · 2012','Hoje, no app'),
      'Souza, L. L. · Padronização e flexibilidade · UFRN, 2012','', 'fontes/planta-2012-0.webp', 'Da planta de 2012 ao mapa')

# ---------------- 05 · Apêndice técnico ----------------
slide('arquitetura','Como as peças se ligam','05 / Apêndice técnico',f"""
<div class="arch"><div class="arch-node reveal" style="--i:1"><span>{icon('phone')}</span><b>Celular</b><small>PWA</small></div><i class="arch-wire"><em></em></i>
<div class="arch-node reveal" style="--i:2"><span>{icon('cloud')}</span><b>Site + API</b><small>FastAPI · Vercel (teste) · IFRN (produção)</small></div><i class="arch-wire"><em></em></i>
<div class="arch-node reveal" style="--i:3"><span>{icon('database')}</span><b>Banco</b><small>PostgreSQL</small></div>
<div class="arch-side reveal" style="--i:4"><span>{icon('user')}</span><b>SUAP</b><small>login do IFRN</small></div></div>
""",'','', 'cena-campus.webp', 'Como as peças se ligam')

slide('banco','O banco de dados','05 / Apêndice técnico',f"""
<div class="er"><div class="er-main">
<div class="er-card big reveal" style="--i:1"><span>{icon('user')}</span><b>Pessoa</b><small>participante, visitante ou organização</small></div>
<div class="er-links"><div class="er-rel reveal" style="--i:3"><i class="er-line"></i><div class="er-card"><span>{icon('check')}</span><b>Agenda</b><small>salvou a atividade</small></div><i class="er-line"></i></div>
<div class="er-rel reveal" style="--i:4"><i class="er-line"></i><div class="er-card"><span>{icon('qr')}</span><b>Presença</b><small>leu o QR na sala</small></div><i class="er-line"></i></div></div>
<div class="er-card big reveal" style="--i:2"><span>{icon('calendar')}</span><b>Atividade</b><small>horário, sala e vagas</small></div></div>
<div class="er-extra">{''.join(f'<div class="er-card small reveal" style="--i:{n+5}"><span>{icon(ic)}</span><b>{t}</b><small>{d}</small></div>' for n,(ic,t,d) in enumerate([('bell','Aviso','da organização para todos'),('pin','Número de sala','nome de cada sala'),('mail','Link de acesso','entrada do visitante')]))}</div>
<div class="er-count reveal" style="--i:9"><b data-count="7">7</b><small>tabelas</small></div></div>
""",'backend/app/modelos.py · SQLite para desenvolver, PostgreSQL em produção','', 'cena-campus.webp', 'O banco de dados')

slide('qr','O QR é assinado','05 / Apêndice técnico',f"""
<div class="qrf" data-steps="9" data-interval="1500">
<div class="qrf-code"><img class="qrf-ok" src="{{assets}}/qr-exemplo.svg" alt="QR da sala"><img class="qrf-bad" src="{{assets}}/qr-falso.svg" alt="QR alterado"></div>
<div class="qrf-token"><span class="qrf-a" data-step="1">atividade · react-native</span><span class="qrf-sig" data-step="1">assinatura · -vsAoqlqItw…</span></div>
<div class="qrf-server" data-step="2"><span>{icon('server')}</span><b>API</b></div>
<ul class="qrf-checks"><li data-step="3">{icon('shield')}Assinatura confere</li><li data-step="4">{icon('clock')}Dentro do horário · 14:00–18:00</li><li data-step="5" class="qrf-done">{icon('check')}Presença gravada · 14:22</li><li data-step="7" class="qrf-fail">{icon('close')}QR alterado: assinatura não confere</li></ul>
</div>
""",'Token assinado com o segredo do servidor (itsdangerous) · vale de 20 min antes até o fim da atividade','', 'qr-exemplo.svg', 'O QR é assinado')

PWA_ROWS = [('Abre por um link', True, False), ('Instala sem loja de apps', True, False), ('Usa o mesmo mapa web', True, False), ('Funciona sem internet', True, True), ('Câmera para o QR', True, True)]
slide('pwa','Por que PWA','05 / Apêndice técnico',f"""
<div class="pwa-cmp reveal"><div class="pwa-head"><span></span><b class="pwa-us">{icon('browser')}PWA</b><b>{icon('react')}React Native</b></div>
{''.join(f'<div class="pwa-row reveal" style="--i:{n+2}"><span>{t}</span><i class="{"yes" if a else "no"}">{icon("check" if a else "close")}</i><i class="{"yes" if b else "no"}">{icon("check" if b else "close")}</i></div>' for n,(t,a,b) in enumerate(PWA_ROWS))}</div>
""",'React Native exige publicar nas lojas e reescrever o mapa em componentes nativos','', 'app-home.png', 'Por que PWA')

slide('offline','Sem internet','05 / Apêndice técnico',f"""
<div class="off" data-steps="4" data-interval="2600">
<div class="off-cloud" data-step="0"><span>{icon('cloud')}</span><b>Servidor</b></div>
<div class="off-wire"><i class="off-packets"></i><em class="off-cut">{icon('wifi-off')}</em></div>
<div class="off-phone"><img src="{{assets}}/app-home.png" alt="App aberto"><div class="off-cache" data-step="2"><span>{icon('database')}</span>Guardado no aparelho</div></div>
<ul class="off-list"><li data-step="0">{icon('wifi')}Com internet: tudo do servidor</li><li data-step="1">{icon('wifi-off')}A rede cai</li><li data-step="2">{icon('check')}O app abre do cache</li><li data-step="3">{icon('map')}Programação, mapa e planta continuam</li></ul>
</div>
""",'Service worker (sw.js) guarda os arquivos do app e do mapa no aparelho','', 'app-home.png', 'Sem internet')

slide('rotas','Como a rota é calculada','05 / Apêndice técnico',f"""
<div class="algo"><div class="algo-stage reveal"><img src="{{assets}}/fontes/planta-atual-0.svg" alt="Planta do térreo"><canvas class="algo-canvas" width="1920" height="1320" data-algo="{{assets}}/rota-dijkstra.json"></canvas>
<div class="algo-result"><b>72 m</b><small>≈ 1 min a pé</small></div></div>
<ol class="algo-steps">{''.join(f'<li class="reveal" style="--i:{n+2}"><span>{icon(ic)}</span><b>{t}</b></li>' for n,(ic,t) in enumerate([('grid','Grade de 33 cm só nos corredores'),('route','Dijkstra: o caminho de menor custo'),('walk','Parede e curva custam mais'),('clock','metros ÷ 75 = minutos')]))}</ol></div>
""",'Mesma regra do app (campus3d.js, gridPath) · entrada principal → sala 001','', 'fontes/planta-atual-0.svg', 'Como a rota é calculada')

slide('escada-rampa','Escada ou rampa?','05 / Apêndice técnico',f"""
<div class="race"><canvas class="race-canvas" width="1500" height="1150" data-race="{{assets}}/rota-escada-rampa.json"></canvas>
<div class="race-board"><div class="race-row escada"><i></i><b>Escada</b><small>entrada do auditório</small><em data-race-cost="escada">0</em></div>
<div class="race-row rampa"><i></i><b>Rampa</b><small>entrada principal</small><em data-race-cost="rampa">0</em></div>
<p class="race-note">{icon('walk')}Subir escada pesa 1,6 × · rampa 1 ×</p><div class="race-win">{icon('check')}<span>Escada, por pouco</span></div></div></div>
""",'Destino: Lab 210, 2º andar · custos calculados pelo app (campus3d.js, planFor)','', 'videos/rota.webp', 'Escada ou rampa?')

slide('api','API documentada','05 / Apêndice técnico',f"""
<div class="shot-big reveal">{image('swagger-visao-geral.png','Documentação interativa da API (Swagger)')}</div>
""",'FastAPI gera o Swagger automaticamente em /api/docs','', 'swagger-visao-geral.png', 'API documentada')

CHECK = [(True,'App publicado em teste'),(True,'Login pelo SUAP'),(True,'Presença por QR e avisos'),(False,'Servidor do IFRN (NADIC)'),(False,'Programação real do ETAL 2026'),(False,'Teste com pessoas no campus')]


def build_app_demo():
    source = (ROOT / 'prototipo/index.html').read_text()
    source = source.replace('<head>', '<head>\n<script src="isolar.js"></script><base href="../../prototipo/">', 1)
    bootstrap = '''<script>window.ETAL_CONFIG={api:null};try{Object.defineProperty(navigator,'serviceWorker',{value:{register:()=>Promise.reject(new Error('Demonstração isolada')),getRegistration:async()=>null,addEventListener(){},controller:null}});}catch(_){}\nwindow.addEventListener('load',()=>parent.postMessage({type:'etal-demo',ready:true},'*'));</script>'''
    source = source.replace('<script src="config.js"></script>', bootstrap)
    source = source.replace('<title>ETAL Connect</title>', '<title>App real · demonstração isolada</title>')
    (ROOT / 'docs/demos/app.html').write_text('<!-- Gerado a partir de prototipo/index.html; não editar. API desabilitada; usar em iframe isolado. -->\n' + source)


def build_plan_sources():
    source = (ROOT / 'prototipo/plan-data.js').read_text()
    plan = json.loads(source.removeprefix('window.PLAN = ').strip().removesuffix(';'))
    for floor in plan['floors']:
        svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{plan["viewBox"]}">{plan["defs"]}{floor["svg"]}</svg>'
        (ROOT / f'docs/assets/fontes/planta-atual-{floor["level"]}.svg').write_text(svg)


def source_gallery():
    entries = [('fontes/souza-capa.webp','A dissertação','Souza, Larissa Leiros de. UFRN, 2012. Figuras 9–11: plantas dos três pavimentos.'),('fontes/planta-2012-0.webp','Planta original','Figura 9, página impressa 132; página 134 do PDF.'),('fontes/satelite-campus.webp','Levantamento no satélite','Imagem enviada pelo usuário na sessão do projeto. Marcações sobre Google Maps / Earth.'),('fontes/satelite-jardim.webp','O jardim da entrada','Recorte do histórico de prints de 09/11/2026; usado para alinhar caminhos e árvores.'),('fontes/satelite-caminhos.webp','Caminhos e canteiros','Outro recorte do mesmo levantamento, com os caminhos marcados.'),('fontes/street-apartamentos.webp','Street View do entorno','Google Maps. Imagem de out/2024; print do usuário em 09/11/2026.'),('fontes/street-br405.webp','Rodovia e entrada','Google Street View: contexto do acesso e das árvores.'),('fontes/campus-auditorio.webp','O auditório real','Fotografia fornecida pelo usuário para orientar volume, fachada e faixa azul.'),('fontes/campus-patio.webp','Pátio e corredores','Fotografia usada para compreender o interior do bloco.')]
    out = '<h2>As imagens que contam esta história</h2><p class="micro">Imagens selecionadas do histórico do próprio projeto e dos prints indicados pelo usuário. Conversas completas e capturas sem relação com o campus ficaram fora da apresentação.</p><div class="source-gallery">'
    for file,title,credit in entries:
        out += '<figure>' + image(file,title,credit=credit) + f'<figcaption><strong>{title}</strong>{credit}</figcaption></figure>'
    out += '</div><div class="doc-links"><a href="{assets}/fontes/souza-2012.pdf">Dissertação completa / PDF</a><a href="{assets}/fontes/creditos.json">Procedência das imagens</a><a href="https://repositorio.ufrn.br/server/api/core/bitstreams/2be1d619-02aa-4c23-aa6b-4d65aa238aba/content" target="_blank" rel="noopener">Fonte no repositório UFRN ↗</a></div>'
    out += '<h2>Fontes técnicas consultadas</h2><div class="doc-links"><a href="https://web.dev/learn/pwa/service-workers" target="_blank" rel="noopener">PWA / service workers</a><a href="https://reactnative.dev/docs/set-up-your-environment" target="_blank" rel="noopener">React Native / ambiente</a><a href="https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API" target="_blank" rel="noopener">Geolocation API / permissão</a></div>'
    return out


CHAPTER_ART = {
    '02': ('fontes/campus-patio.webp', ''),
    '03': ('cena-evento.webp', ''),
    '05': ('cena-jardim.webp', ''),
}
_OLD_ART = {
    '02': ('fontes/campus-auditorio.webp', 'Antes de desenhar, a gente olhou o lugar: fotos, satélite e a planta encontrada numa dissertação de 2012.'),
    '03': ('cena-campus.webp', 'O campus inteiro em 3D, desenhado no navegador: dá para girar, entrar nos andares e seguir uma rota.'),
    '04': ('cena-noite.webp', 'Por que um link em vez de uma loja de apps, e o que continua funcionando quando a rede cai.'),
    '05': ('cena-evento.webp', 'Cada toque vira um pedido para a API, e cada pedido deixa um registro no banco.'),
    '06': ('cena-jardim.webp', 'O Swagger, o painel da organização, a luz do horário e os testes: o que já está comprovado.'),
}


def add_dividers():
    if any(x['id'].startswith('cap-') for x in SLIDES):
        return
    out, seen = [], set()
    for item in SLIDES:
        num, _, name = item['chapter'].partition(' / ')
        if num in CHAPTER_ART and num not in seen:
            seen.add(num); img, kicker = CHAPTER_ART[num]
            inside = [x['title'] for x in SLIDES if x['chapter'].startswith(num + ' ')]
            body = f'''<img class="cap-photo" src="{{assets}}/{img}" alt="" data-depth="0.6"><div class="cap-shade"></div>
<div class="cap-content"><span class="cap-num reveal" data-depth="1.6">{num}</span><div class="cap-text"><p class="eyebrow reveal" style="--i:1">Capítulo {num}</p><h2 class="cap-title reveal" style="--i:2">{name}</h2><div class="cap-chips">{''.join(f'<span class="reveal" style="--i:{k+4}">{t}</span>' for k,t in enumerate(inside))}</div></div></div>'''
            out.append(dict(id=f'cap-{num}', title=name, chapter=item['chapter'], body=body, source='', tone='dark divider', cover=img))
        out.append(item)
    SLIDES[:] = out


def render(root):
    add_dividers()
    assets, demos = root+'docs/assets', root+'docs/demos'
    symbols = '<svg class="icons" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' + ''.join(f'<symbol id="i-{name}" viewBox="0 0 24 24"><path d="{path}"/></symbol>' for name,path in ICONS.items()) + '</svg>'
    sections, outline, dots = [], [], []
    for index,item in enumerate(SLIDES,1):
        sections.append(f'''<section class="slide {item['tone']} {'active' if index==1 else ''}" id="{item['id']}" data-title="{escape(item['title'])}" data-chapter="{escape(item['chapter'])}" aria-label="{index}. {escape(item['title'])}" aria-hidden="{'false' if index==1 else 'true'}" {'' if index==1 else 'inert'}><div class="slide-top"><b>{item['chapter']}</b><span>ETAL / Connect</span></div>{item['body']}<footer class="slide-footer"><span>{item['source']}</span><span class="page">{index:02d} / {len(SLIDES):02d}</span></footer></section>''')
        outline.append(f'<button class="outline-card" data-go="{index-1}"><img src="{assets}/{item["cover"]}" alt=""><span class="outline-label"><i>{index:02d}</i>{item["title"]}</span></button>')
        dots.append(f'<button data-go="{index-1}" aria-label="Slide {index}: {escape(item["title"])}" title="{escape(item["title"])}" {"aria-current=step" if index==1 else ""}></button>')
    refs = source_gallery() + reference(root)
    html = f'''<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="ETAL Connect: apresentação dinâmica do app, do campus real ao mapa, com fontes originais, plantas, demonstrações, arquitetura, banco e FastAPI."><title>ETAL Connect · O campus vira caminho</title><link rel="stylesheet" href="{assets}/apresentacao.css"><link rel="stylesheet" href="{assets}/apresentacao-movimento.css"></head><body>
+{symbols}<header class="topbar"><a class="brand" href="#visao"><img src="{root}prototipo/assets/icon.svg" alt=""><span>ETAL CONNECT<small>O CAMPUS VIRA CAMINHO</small></span></a><span class="breadcrumb" data-breadcrumb>01 / O encontro</span><div class="top-actions"><button class="ui-button" data-references>{icon('book')}<span>Fontes e detalhes</span></button><button class="ui-button" data-outline>{icon('grid')}<span>Slides</span></button><a class="ui-button" href="{root}docs/pdf/ETAL-Connect-apresentacao.pdf" target="_blank" rel="noopener">{icon('download')}<span>PDF</span></a><button class="ui-button highlight" data-fullscreen>{icon('expand')}<span>Tela cheia</span></button></div></header>
+<main class="deck-shell" aria-label="Apresentação de slides"><div class="stage">{''.join(sections)}</div></main>
+<footer class="bottom-bar"><span class="bottom-note">{icon('compass')}Setas para navegar · imagens para ampliar</span><div class="nav-control"><button data-prev aria-label="Slide anterior" disabled>{icon('arrow-left')}</button><output aria-live="polite">01 / {len(SLIDES):02d}</output><button data-next aria-label="Próximo slide">{icon('arrow-right')}</button></div><nav class="slide-dots" aria-label="Slides">{''.join(dots)}</nav></footer><div class="progress" aria-hidden="true"></div><div class="toast" role="status"></div>
+<dialog class="outline-dialog" id="outline"><header class="modal-head"><h2>Uma visita por dentro do projeto.</h2><button data-close aria-label="Fechar índice">{icon('close')}</button></header><div class="modal-body outline-grid">{''.join(outline)}</div></dialog>
+<dialog class="reference-dialog" id="references"><header class="modal-head"><h2>Fontes, documentos e detalhes.</h2><button data-close aria-label="Fechar referências">{icon('close')}</button></header><div class="modal-body">{refs}</div></dialog>
+<dialog class="lightbox" id="lightbox"><header class="modal-head"><span data-image-title></span><button data-close aria-label="Fechar imagem">{icon('close')}</button></header><img alt=""><p class="image-credit" data-image-credit></p></dialog>
+<script src="{assets}/apresentacao.js"></script><script src="{assets}/apresentacao-movimento.js"></script></body></html>'''.replace('\n+', '\n')
    return html.replace('{assets}',assets).replace('{demos}',demos).replace('{root}',root)


def gerar(saida=None):
    build_app_demo()
    build_plan_sources()
    if saida:
        path=Path(saida).resolve();root=os.path.relpath(ROOT,path.parent).replace(os.sep,'/')+'/'
        path.write_text(render(root));print(path)
    else:
        (ROOT/'DOCUMENTACAO.html').write_text(render(''))
        (ROOT/'docs/tecnico/documentacao-tecnica.html').write_text(render('../../'))
        print(f'Apresentação: {len(SLIDES)} slides + fontes + demonstrações isoladas do app e do mapa.')


if __name__=='__main__':
    gerar(sys.argv[1] if len(sys.argv)>1 else None)
