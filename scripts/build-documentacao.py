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


slide('visao','O campus vira caminho','01 / O encontro',f'''
<div class="hero-content"><div class="hero-text"><p class="eyebrow reveal">ETAL Connect / uma experiência de evento</p><h1 class="reveal" style="--i:1">O campus<br>vira <span class="accent">caminho.</span></h1>
<p class="lede reveal" style="--i:2">Da programação à porta da sala.<br>Um app para viver o encontro.</p><div class="pills reveal" style="--i:3">{badge('App + mapa + presença','spark','ghost')}{badge('IFRN · Pau dos Ferros',tone='ghost')}</div></div>
<div class="hero-scene reveal" style="--i:1"><div class="orbit"></div><img class="scene" data-depth="0.5" src="{{assets}}/cena-evento.webp" alt="Modelo atual do campus do IFRN Pau dos Ferros"><img class="phone" data-depth="1.4" src="{{assets}}/app-home.png" alt="Tela inicial atual do ETAL Connect, capturada novamente para a apresentação"><div class="float-note n1">{icon('calendar')}<div><b>O que acontece agora?</b><small>Programação na mão.</small></div></div><div class="float-note n2">{icon('route')}<div><b>Como eu chego lá?</b><small>Um caminho até a sala.</small></div></div></div>
<div class="hero-kicker"><img src="{{root}}prototipo/assets/nadic-logo.svg" alt="NADIC"><span>Proposta 2026 · implementação e referências reais do projeto</span></div></div>
''','Apresentação da implementação · capturas locais atualizadas · programação demonstrativa de referência: VII ETAL / 2025','dark', 'cena-evento.webp')

slide('proposito','Por que esse app?','01 / O encontro',f'''
<img class="full-photo" src="{{assets}}/fontes/campus-fachada.webp" alt="Fachada e entrada do campus, em fotografia usada no projeto"><div class="photo-shade"></div>
<div class="reveal" style="margin-top:35px"><p class="eyebrow">O problema aparece quando a gente chega</p><h2 class="big-question">Muita coisa<br>acontecendo.<br>Um lugar só<br>para se achar.</h2></div>
<div class="question-tags"><span class="reveal" style="--i:1">{icon('clock')}Já começou?</span><span class="reveal" style="--i:2">{icon('pin')}Onde é a sala?</span><span class="reveal" style="--i:3">{icon('qr')}Como confirmo a presença?</span></div>
''','Fotografia fornecida pelo usuário na sessão do projeto · a apresentação parte dos fluxos construídos, sem levantamento formal de requisitos','dark','fontes/campus-fachada.webp')

slide('app','O aplicativo, aqui dentro','01 / O encontro',f'''
<div class="app-layout"><div class="app-copy"><p class="eyebrow reveal">Demonstração interativa</p><h2 class="reveal" style="font-size:65px">Pode tocar.<br>É o <span class="accent">app.</span></h2><p class="body-copy reveal" style="--i:1">Os cards abrem. A agenda navega. O crachá vira. A experiência está dentro do slide.</p><div class="app-tabs reveal" style="--i:2"><button data-app-screen="home" aria-pressed="true">{icon('phone')}Início</button><button data-app-screen="agenda">{icon('calendar')}Agenda</button><button data-app-screen="credencial">{icon('user')}Crachá</button></div><p class="micro reveal" style="margin-top:22px;--i:3">Código atual de prototipo/ · sessão isolada e dados demonstrativos.</p></div>
<div class="reveal" style="--i:1">{demo('app','tela=home&tema=light&ceu=14','app-home.png',True)}</div>
<div class="feature-stack"><article class="feature reveal" style="--i:2"><h3>{icon('calendar')}Escolher</h3><p>Programação, detalhes e atividades salvas.</p></article><article class="feature reveal" style="--i:3"><h3>{icon('map')}Encontrar</h3><p>Campus, salas, andares e caminhos.</p></article><article class="feature reveal" style="--i:4"><h3>{icon('qr')}Participar</h3><p>Identificação primeiro. Credenciamento após QR válido.</p></article></div></div>
''','Demonstração executa os arquivos reais do app, com API desabilitada e armazenamento isolado','', 'app-home.png')

slide('processo','Como o projeto cresceu','01 / O encontro',f'''
<div class="process"><figure class="process-picture reveal"><img src="{{root}}docs/prints/15-propostas-de-entrada.png" alt="Registro histórico das propostas Cartaz, Crachá e Explorar"><figcaption>Exploração inicial de entrada · este é um registro histórico, não a tela atual.</figcaption></figure><article class="process-note reveal" style="--i:1"><p>Construir.<br>Experimentar.<br>Olhar de novo.<br>Ajustar.</p><small>O protótipo foi o espaço de decisão.</small></article><div class="process-loop reveal" style="--i:2"><span>Telas e navegação</span><span>Mapa e localização</span><span>API e persistência</span><span>Documentar o que existe</span></div></div>
<div class="note reveal" style="--i:3">Não houve uma etapa formal de reuniões de requisitos. A apresentação registra a implementação e as decisões observadas.</div>
''','Registro histórico preservado em docs/prints · sem atas ou prioridades formais reconstruídas depois do fato','', 'app-login.png', 'A gente começou pelo protótipo.', 'O produto foi tomando forma ao experimentar as telas e comparar o mapa com o lugar real.')

TIMELINE = [
    ('15 out', 'O campus em KML', 'Polígonos, caminhos e pontos marcados sobre o satélite.', 'globe', ''),
    ('06–07 nov', 'Primeiro protótipo', 'Telas, mapa 3D em Canvas, PWA e painel da organização.', 'spark', 'v0.1.0'),
    ('09 nov · madrugada', 'Entorno e planta de 2012', 'BR-405, vizinhos e o interior refeito pela dissertação.', 'file', ''),
    ('09 nov · manhã', 'O campus de hoje', 'Uso atual das salas, sol e sombras, noite e busca.', 'map', 'v0.2.0'),
    ('09 nov · tarde', 'O app ganha servidor', 'FastAPI, banco, QR assinado, homologação e Vercel.', 'layers', 'v0.3.0'),
    ('09 nov · noite', 'Teste como produção', 'SUAP, mapa para o polegar, busca colada no teclado.', 'shield', 'v0.4'),
]
slide('linha-do-tempo','Linha do tempo','01 / O encontro',f'''
<div class="timeline">{''.join(f'<article class="tl-item reveal" style="--i:{n+1}"><span class="tl-dot">{icon(ic)}</span><small class="tl-when">{w}</small><b>{t}</b><p>{d}</p>{f'<span class="tl-tag">{v}</span>' if v else ''}</article>' for n,(w,t,d,ic,v) in enumerate(TIMELINE))}<i class="tl-line"></i></div>
<div class="tl-stats"><div class="reveal" style="--i:7"><b data-count="25">25</b><small>dias do KML ao teste em produção</small></div><div class="reveal" style="--i:8"><b data-count="6">6</b><small>versões publicadas pelo git flow</small></div><div class="reveal" style="--i:9"><b data-count="3">3</b><small>pavimentos traçados da planta original</small></div><div class="reveal" style="--i:10"><b data-count="14">14</b><small>testes automáticos da API</small></div></div>
''','Datas do histórico do repositório (git flow: main, develop, feature/*, release/*) · versões v0.1.0 a v0.4.2','', 'cena-evento.webp', 'Do KML à produção.', 'Tudo começou com polígonos sobre o satélite. Vinte e cinco dias depois, o app falava com o servidor.')

slide('referencias-campus','O campus real','02 / Do lugar ao modelo',f'''
<div class="image-collage reveal"><img class="collage-main" src="{{assets}}/fontes/campus-auditorio.webp" alt="Auditório curvo com faixa azul e bloco amarelo ao fundo"><img class="collage-small s1" src="{{assets}}/fontes/campus-patio.webp" alt="Pátio interno e corredores"><img class="collage-small s2" src="{{assets}}/fontes/satelite-campus.webp" alt="Satélite com os polígonos usados no levantamento"><div class="collage-tag">{icon('camera')} Fotos, satélite e observação do campus.</div></div>
''','Imagens fornecidas pelo usuário e recuperadas da sessão do projeto · fotografias como referência visual; marcações sobre Google Maps / Earth','', 'fontes/campus-auditorio.webp', 'Primeiro, olhar para o lugar.', 'Fachada, pátio, auditório e entorno dão ao mapa uma identidade que a gente reconhece.')

slide('documento','Encontramos a planta','02 / Do lugar ao modelo',f'''
<div class="book-layout"><div class="book-stack reveal"><img class="book-cover" src="{{assets}}/fontes/souza-capa.webp" alt="Capa da dissertação Padronização e Flexibilidade, Larissa Leiros de Souza, UFRN, 2012"><img class="book-plan" src="{{assets}}/fontes/planta-2012-0.webp" alt="Planta original do pavimento térreo encontrada na dissertação"></div>
<div class="discovery-copy"><p class="eyebrow reveal">Uma referência que mudou o desenho</p><h3 class="reveal" style="--i:1">Padronização e flexibilidade:<br>proposta de um edifício tipo para<br>uma escola técnica profissionalizante.</h3><p class="body-copy reveal" style="--i:2">Na dissertação de Larissa Leiros de Souza, encontramos os três pavimentos do bloco principal. A planta passou a orientar a reconstrução do interior.</p><div class="discovery-meta reveal" style="--i:3"><div><b>2012</b><span>UFRN / dissertação</span></div><div><b>3</b><span>pavimentos documentados</span></div><div><b>9–11</b><span>figuras usadas</span></div></div><a class="button lime" href="{{assets}}/fontes/souza-2012.pdf" target="_blank" rel="noopener">Abrir documento original{icon('book')}</a></div></div>
''','Souza, Larissa Leiros de · UFRN, 2012 · figuras 9–11, páginas impressas 132–133 (PDF: páginas 134–135) · uso das salas pode ter mudado','dark','fontes/planta-2012-0.webp', 'E encontramos a planta.')

slide('planta','Do documento à planta','02 / Do lugar ao modelo',f'''
<div class="compare-layout"><div><div class="compare reveal" data-compare><img src="{{assets}}/fontes/planta-2012-0.webp" alt="Planta do térreo em 2012"><div class="after"><img src="{{assets}}/fontes/planta-atual-0.svg" alt="Planta atual gerada para o aplicativo"></div><div class="compare-line"><span>↔</span></div><span class="compare-label left">DOCUMENTO / 2012</span><span class="compare-label right">MODELO DO APP</span><input type="range" min="0" max="100" value="50" aria-label="Comparar planta original e modelo atual"></div><p class="micro">Arraste para comparar. Visualização das duas fontes; usos atuais foram ajustados com as informações do usuário.</p></div>
<aside class="compare-aside reveal" style="--i:1"><h3>Uma base.<br>Várias representações.</h3><div class="line-icon">{icon('file')}<div><strong>Fonte da geometria</strong><small>scripts/build-principal-plan.py</small></div></div><div class="line-icon">{icon('layers')}<div><strong>Mesmo conjunto de zonas</strong><small>JSON, SVG, planta e 3D.</small></div></div><div class="line-icon">{icon('shield')}<div><strong>Regras preservadas</strong><small>Corredor, escada, rampa e recepção.</small></div></div><div class="pills" style="margin-top:25px">{badge('Gerar + conferir: npm run planta','terminal')}</div></aside></div>
''','Comparação visual das fontes · planta traçada sobre as figuras de 2012; números e alocações do evento permanecem demonstrativos','', 'fontes/planta-2012-0.webp', 'Do documento ao mapa.', 'A mesma geometria sustenta a planta, os andares e a localização das atividades.')

slide('levantamento','Do satélite aos metros','02 / Do lugar ao modelo',f'''
<div class="data-pipeline"><figure class="satellite-frame reveal">{image('fontes/satelite-geral.webp','Levantamento do campus e vizinhança sobre imagem de satélite',credit='Imagem do usuário sobre Google Maps / Earth; marcações manuais do levantamento.')}<span class="floating-pill">35 marcações na base inicial · KML completo com 66 marcações</span></figure>
<div class="pipeline"><div class="pipeline-step reveal" style="--i:1"><span>01</span>{icon('globe')}<div><b>Marcar no Google Earth</b><small>Polígonos, caminhos e pontos → KML.</small></div></div><div class="pipeline-arrow">{icon('arrow-down')}</div><div class="pipeline-step reveal" style="--i:2"><span>02</span>{icon('compass')}<div><b>Converter para metros locais</b><small>WGS84 → origem no pátio → eixos alinhados.</small></div></div><div class="pipeline-arrow">{icon('arrow-down')}</div><div class="pipeline-step reveal" style="--i:3"><span>03</span>{icon('layers')}<div><b>Construir a cena</b><small>Contornos, alturas adotadas, caminhos e volumes.</small></div></div></div></div>
''','Fontes: referencias/*.kml · implantacao_kml.json · scripts/import-fundo-kml.py · marcações manuais não equivalem a levantamento topográfico','', 'fontes/satelite-geral.webp', 'De polígonos a metros.', 'O mapa preserva a base geográfica do levantamento e usa uma transformação local para desenhar o campus.')

slide('fotos-modelo','Google Maps como referência','02 / Do lugar ao modelo',f'''
<div class="split-photos"><figure class="split-photo reveal">{image('fontes/street-apartamentos.webp','Apartamentos vistos do Google Street View',credit='Google Maps / Street View. Captura do usuário de 09/11/2026; imagem do Street View de outubro de 2024.')}<figcaption><strong>Observar</strong><span>Volumes, cores, calçada e posição.</span></figcaption></figure><figure class="split-photo reveal" style="--i:1">{image('cena-entorno.webp','Apartamentos e entorno reconstruídos no motor atual do mapa',credit='Renderização atual do motor Campus3D, com as referências visuais usadas no projeto.')}<figcaption><strong>Reconstruir</strong><span>Uma cena própria, leve e navegável.</span></figcaption></figure></div><div class="note reveal" style="--i:2">Google Maps / Earth ajudaram a observar o lugar. O mapa do aplicativo é desenhado pelo próprio motor Canvas, sem carregar o Google Maps dentro dele.</div>
''','Street View: Google, imagem de out/2024, print de 09/11/2026 · render atual: prototipo/campus3d.js · fontes adicionais na biblioteca da apresentação','', 'fontes/street-apartamentos.webp', 'As fotos viraram detalhes.', 'O entorno também ajuda a reconhecer o caminho: apartamentos, rodovia, entrada, árvores e pontos de referência.')

slide('mapa','Explore o campus ao vivo','03 / Um mapa que responde',f'''
<div class="live-layout"><aside class="live-aside reveal"><p>Arraste a cena e experimente as vistas. O código aqui é o mesmo do mapa do aplicativo.</p><div class="seg"><button data-command="mode" data-value="evento" aria-pressed="true">Evento</button><button data-command="mode" data-value="campus">Campus</button><button data-command="floors">{icon('layers')}Andares</button></div><div class="seg"><button data-command="floor" data-value="0">Térreo</button><button data-command="floor" data-value="1">1º</button><button data-command="floor" data-value="2">2º</button></div><div class="seg"><button data-command="route" data-value="escada">{icon('route')}Via escada</button><button data-command="route" data-value="rampa">Via rampa</button></div><div class="live-controls"><button class="control-circle" data-command="zoom" data-value="in" aria-label="Aproximar">{icon('zoom-in')}</button><button class="control-circle" data-command="zoom" data-value="out" aria-label="Afastar">{icon('zoom-out')}</button><button class="control-circle" data-command="rotate" aria-label="Girar">{icon('rotate')}</button><button class="control-circle" data-command="fit" aria-label="Enquadrar">{icon('expand')}</button></div><p class="hint">{icon('mouse')}Você pode tocar nos prédios e abrir os pavimentos.</p><div class="map-state" data-map-state>Mapa do campus · demonstração interativa</div></aside><div class="reveal" style="--i:1">{demo('map','mode=evento','cena-evento.webp')}</div></div>
''','Motor real: prototipo/campus3d.js · a demonstração carrega sob demanda e é encerrada ao sair deste slide','', 'cena-evento.webp', 'Agora, o campus responde.', 'Gire, abra os pavimentos e veja uma rota atravessar o modelo.')

slide('gps','Rotas, localização e GPS','03 / Um mapa que responde',f'''
<div class="route-layout"><div class="route-art reveal" data-route-art><img class="plan-faded" src="{{assets}}/fontes/planta-atual-0.svg" alt="Planta atual como contexto da lógica de rotas"><span class="badge">Esquema da lógica / não é rastreamento de posição</span><svg class="route-schema" viewBox="0 0 620 390" aria-label="Portaria, entrada, corredor e sala ligados por uma rota"><path d="M80 305H235V235H340V125H500" stroke="#d6e4ce" stroke-width="15" stroke-linecap="round" fill="none"/><path class="route-path" d="M80 305H235V235H340V125H500" stroke="#649d42" stroke-width="5" stroke-linecap="round" fill="none"/><circle class="pulse-dot" cx="80" cy="305" r="11" fill="#3b7ac8" stroke="white" stroke-width="4"/><circle cx="235" cy="235" r="7" fill="#78a857" stroke="white" stroke-width="3"/><circle cx="340" cy="125" r="7" fill="#78a857" stroke="white" stroke-width="3"/><circle cx="500" cy="125" r="10" fill="#224875" stroke="white" stroke-width="4"/><text class="route-svg-label" x="42" y="340">Portaria</text><text class="route-svg-label" x="185" y="270">Entrada</text><text class="route-svg-label" x="280" y="95">Circulação</text><text class="route-svg-label" x="476" y="160">Sala</text></svg><div class="route-gps"><small>Raio de incerteza ilustrativo · GPS futuro</small></div></div>
<div class="route-copy reveal" style="--i:1"><h3>Hoje: a rota parte da portaria.</h3><p>O caminho usa corredores e acessos conhecidos. O Dijkstra busca uma passagem, considerando bordas, curvas, escada ou rampa.</p><div class="line-icon">{icon('compass')}<div><strong>Uma localização futura</strong><small>Permissão → latitude/longitude → metros locais.</small></div></div><div class="line-icon">{icon('qr')}<div><strong>Uma ideia para o interior</strong><small>QR da sala como origem conhecida, sem depender do GPS.</small></div></div><button class="button light" data-gps aria-pressed="false">Visualizar a hipótese de GPS{icon('pin')}</button><div class="note">GPS e origem a partir do QR ainda são propostas. O ponto azul atual não acompanha a posição real da pessoa.</div></div></div>
''','Implementado: gridPath / planFor em campus3d.js · localização futura: Geolocation API com permissão · esquema didático, sem coordenadas captadas','', 'cena-andares.webp', 'Um caminho calculado.', 'Desenhar uma rota e medir a posição da pessoa são problemas diferentes.')

slide('pwa','Por que PWA?','04 / Escolhas técnicas',f'''
<div class="pwa-layout"><div class="install-visual reveal"><div class="mini-phone"><img src="{{root}}prototipo/assets/pwa/icon-192.png" alt="Ícone do ETAL Connect"><strong>ETAL Connect</strong><small>Um link para abrir.</small><div class="install-bar"><span></span></div><div class="install-check">{icon('check')}Na tela inicial.</div></div></div>
<article class="card selected reveal" style="--i:1"><div class="decision-label">{icon('check')}Escolha atual deste projeto</div><h3>PWA</h3><p>Acesso por link, instalação pelo navegador e cache do app. Reaproveita o mapa Canvas e a base web que já construímos.</p><div class="pills" style="margin-top:25px">{badge('Distribuição simples','link')}{badge('Uma base web','browser')}</div><small>Instalação e recursos variam conforme o navegador.</small></article>
<article class="card reveal" style="--i:2">{icon('react')}<h3>React Native</h3><p>Seria uma alternativa para um aplicativo nativo. Acrescentaria o trabalho de build, distribuição e adaptação das partes que hoje dependem do navegador.</p><small>Não fizemos um benchmark entre stacks. Esta é a leitura técnica da implementação atual.</small></article></div>
''','Base: prototipo/manifest.webmanifest e sw.js · fontes técnicas: web.dev/learn/pwa/service-workers e reactnative.dev/docs/set-up-your-environment','', 'app-home.png', 'Um link. O campus inteiro.', 'Para um app de evento, o acesso imediato e o reaproveitamento da experiência web fazem sentido.')

slide('offline','O que funciona sem rede','04 / Escolhas técnicas',f'''
<div class="offline-layout"><div class="offline-flow" data-offline-flow><article class="offline-node reveal">{icon('phone')}<h3>Interface + mapa</h3><p>Arquivos e recursos usados no aparelho.</p></article><div class="offline-wire"></div><article class="offline-node reveal" style="--i:1">{icon('database')}<h3>Cache do PWA</h3><p>Service worker + Cache Storage.<br>Uma cópia para abrir depois.</p></article><div class="offline-wire network-wire"></div><article class="offline-node network reveal" style="--i:2">{icon('cloud')}<h3>API + banco</h3><p>Sessão, agenda e confirmação de presença no servidor.</p></article></div><div class="offline-foot"><span class="offline-status" data-offline-status>{icon('wifi')}Diagrama conectado</span><button class="button lime" data-offline aria-pressed="false">Desligar a rede do diagrama{icon('wifi-off')}</button></div><p class="micro" style="margin-top:25px">A simulação altera apenas a ilustração. No app atual, /api/ e /q/ ficam fora do cache. Não existe fila de presença offline; sem rede, pode aparecer a programação de exemplo embutida.</p></div>
''','Limite real do código: prototipo/sw.js · cache da interface não equivale à sincronização de operações','dark', 'cena-noite.webp', 'A rede cai.<br>O mapa continua com você.', 'O PWA guarda a experiência visual no aparelho. A confirmação de presença continua dependendo do servidor.')

slide('jornada','A jornada do participante','05 / Da ação ao registro',f'''
<div class="journey-phones">''' + ''.join(f'''<figure class="journey-phone reveal" style="--i:{i}"><button class="zoom-image" data-zoom aria-label="Ampliar tela {title}"><img src="{{assets}}/app-{screen}.png" alt="Tela atual: {title}"></button><figcaption><b>{icon(ic)}{i+1:02d} / {title}</b>{desc}</figcaption></figure>''' for i,(screen,title,ic,desc) in enumerate([('login','Entrar','user','Identificação pelo caminho disponível.'),('agenda','Escolher','calendar','Explorar e salvar atividades.'),('qr','Ler o QR','qr','Na recepção ou na atividade.'),('credencial','Participar','shield','Ver o credenciamento confirmado.')])) + '</div>',
'Capturas locais atualizadas do protótipo · no modo API, autenticar não credencia; a confirmação vem do servidor','', 'app-qr.png', 'Entrar é só o começo.', 'A participação no evento é confirmada depois, por um QR válido.')

slide('presenca','O que o QR confirma','05 / Da ação ao registro',f'''
<div class="qr-flow"><figure class="reveal"><img src="{{assets}}/app-qr.png" alt="Leitor de QR atual do aplicativo"></figure><div><div class="qr-steps"><article class="qr-step reveal" style="--i:1">{icon('camera')}<b>Ler</b><small>Câmera do app ou link aberto pelo celular.</small></article>{icon('arrow-right')}<article class="qr-step reveal" style="--i:2">{icon('shield')}<b>Validar</b><small>Sessão, assinatura e janela de horário.</small></article>{icon('arrow-right')}<article class="qr-step reveal" style="--i:3">{icon('database')}<b>Gravar</b><small>Somente após a validação da API.</small></article></div><div class="qr-results"><div class="qr-result reveal" style="--i:3">{icon('user')}<div><b>QR do evento</b><small>pessoas.credenciado_em</small></div></div><div class="qr-result reveal" style="--i:4">{icon('calendar')}<div><b>QR da atividade</b><small>Credenciamento + presencas.</small></div></div></div><div class="qr-limits"><span>{icon('check')}Repetir não duplica.</span><span>{icon('clock')}Fora da janela: 409.</span><span>{icon('shield')}QR inválido: 400.</span></div></div></div>
''','POST /api/presenca · regras em backend/app/rotas/eu.py · não registra presença automaticamente no SUAP','', 'app-qr.png', 'Um QR. Uma confirmação.', 'Identificação, credenciamento e presença em atividade têm papéis diferentes.')

slide('arquitetura','A arquitetura em movimento','05 / Da ação ao registro',f'''
<div class="seg reveal" data-action-options><button data-flow="agenda" aria-pressed="true">{icon('calendar')}Salvar atividade</button><button data-flow="presenca">{icon('qr')}Ler QR</button><button data-flow="aviso">{icon('bell')}Enviar aviso</button></div><div class="architecture"><article class="arch-card reveal">{icon('browser')}<h3>App / painel</h3><p>HTML, CSS e JavaScript.<br>O cliente envia a ação.</p></article><div class="arch-wire"><small>HTTP / JSON</small></div><article class="arch-card highlight reveal" style="--i:1">{icon('server')}<h3>FastAPI</h3><p>Sessão, permissão e regras.<br>A operação é validada.</p></article><div class="arch-wire"><small>SQLAlchemy</small></div><article class="arch-card reveal" style="--i:2">{icon('database')}<h3 data-flow-table>agenda</h3><p data-flow-description>Relaciona a pessoa à atividade salva, sem repetir o par.</p></article></div><div class="arch-request"><span class="request-method">POST</span><span data-flow-route>/api/eu/agenda/{'{atividade_id}'}</span></div><div class="arch-legend"><span>Caddy / entrega e proxy</span><span>SUAP / identidade</span><span>SMTP / visitante</span><span>SSE ou consulta / avisos</span></div>
''','Fluxo real de responsabilidade · API: backend/app/ · produto atual em prototipo/; a primeira versão React ficou como legado','', 'cena-campus.webp', 'Cada ação tem um caminho.', 'O navegador cuida da experiência. A API aplica as regras. O banco guarda o resultado.')


def table(name, fields):
    return '<button class="table-card" data-table="'+name+'"><header>'+icon('database')+name+'</header><div class="fields">'+''.join(f'<span><i>{key}</i>{field}</span>' for key,field in fields)+'</div></button>'

slide('banco','O banco da jornada','05 / Da ação ao registro',f'''
<div class="db-layout"><div class="db-graph"><svg class="db-wires" viewBox="0 0 950 370" preserveAspectRatio="none" aria-hidden="true"><path d="M279 157H298V70H322M298 157V246H322M671 157H650V70H628M650 157V246H628"/></svg><div class="db-column">{table('pessoas',[('PK','id'),('','nome · tipo · papel'),('','credenciado_em')])}</div><div class="db-column">{table('agenda',[('FK','pessoa_id'),('FK','atividade_id')])}{table('presencas',[('FK','pessoa_id'),('FK','atividade_id · em · via')])}</div><div class="db-column">{table('atividades',[('PK','id'),('','data · inicio · fim'),('','andar · zona · sala')])}</div><div class="db-support"><button data-table="links_acesso">links_acesso<small>1 pessoa → N links de entrada.</small></button><button data-table="avisos">avisos<small>Autor e atividade opcionais.</small></button><button data-table="numeros_sala">numeros_sala<small>Chave andar:zona · sem FK.</small></button></div></div><aside class="db-explain reveal" style="--i:1"><p class="eyebrow">Clique em uma tabela</p><h3 data-db-title>Uma pessoa.<br>Várias atividades.</h3><p data-db-description>Agenda e presença são relações separadas. Salvar demonstra interesse; presença registra a leitura válida.</p><div class="note" data-db-rule>Em agenda e presencas, o par pessoa + atividade é único.</div><button class="button light" data-schema="pessoas">Ver todos os campos{icon('arrow-right')}</button></aside></div>
''','Sete tabelas extraídas de backend/app/modelos.py · SQLite local / PostgreSQL configurado para implantação · PK: chave; FK: referência','', 'fontes/planta-atual-0.svg', 'O banco acompanha a jornada.', 'Pessoas e atividades se conectam pela agenda e pelas presenças. O restante apoia entrada, avisos e localização.')

slide('api','FastAPI e Swagger reais','06 / Evidências',f'''
<div class="api-layout"><div class="swagger-browser reveal"><div class="browser-chrome"><i></i><i></i><i></i><span data-swagger-label>API local / api/docs</span></div><button class="zoom-image" data-zoom aria-label="Ampliar Swagger local"><img data-swagger-image src="{{assets}}/swagger-visao-geral.png" alt="Swagger da API atual do ETAL Connect"></button></div><div class="api-copy reveal" style="--i:1">{badge('Captura autêntica da API local','server','lime')}<h3>O contrato vem<br>do código.</h3><p>As rotas geram o OpenAPI. No Swagger, executamos a verificação de saúde e recebemos uma resposta do servidor.</p><div class="code-snippet"><span class="dim">GET /api/saude</span><br><span class="green">200 OK</span><br>{{ "ok": true }}</div><div class="api-choices"><button data-swagger="swagger-visao-geral.png" aria-pressed="true">Visão geral</button><button data-swagger="swagger-saude.png">GET /saude</button><button data-swagger="swagger-presenca.png">POST /presenca</button></div></div></div>
''','FastAPI: backend/app/main.py · Swagger: /api/docs · OpenAPI: /api/openapi.json · captura local atualizada, sem dados de produção','', 'swagger-visao-geral.png', 'FastAPI, sem caixa-preta.', 'A documentação interativa da API também faz parte da demonstração.')

slide('organizacao','O outro lado do evento','06 / Evidências',f'''
<div class="org-layout"><div class="swagger-browser reveal"><div class="browser-chrome"><i></i><i></i><i></i><span>prototipo/admin.html / demonstração</span></div>{image('painel.png','Painel atual da organização com dados demonstrativos')}</div><aside class="org-status reveal" style="--i:1"><div class="line-icon">{icon('bell')}<div><strong>Avisar</strong><small>Avisos e mudanças de sala conectáveis à API.</small></div></div><div class="line-icon">{icon('layers')}<div><strong>Organizar o espaço</strong><small>Planta e numeração das salas.</small></div></div><div class="line-icon">{icon('users')}<div><strong>Ainda demonstrativo</strong><small>Participantes, gráficos e CSV do painel.</small></div></div><div class="note">A API já oferece registros e exportação reais. Conectar todas as partes do painel é uma etapa própria.</div></aside></div>
''','Painel desktop separado da experiência de participante · rotas /api/org exigem papel de organização','', 'painel.png', 'O evento também tem bastidores.', 'A organização acompanha a programação, publica avisos e ajusta os locais por outro espaço de trabalho.')

slide('luz','O mapa muda com o céu','06 / Evidências',f'''
<div class="light-layout"><aside class="light-controls reveal"><output data-hour-output>14:00</output><p>O horário muda a luz, as sombras e a noite do campus. Experimente no próprio motor.</p><label for="sky-demo">Horário do céu</label><input id="sky-demo" data-hour type="range" min="5" max="22" step="0.25" value="14"><div class="quality-buttons"><button data-command="quality" data-value="alta">Completo</button><button data-command="quality" data-value="media" aria-pressed="true">Médio</button><button data-command="quality" data-value="leve">Leve</button><button data-command="quality" data-value="simples">2D simples</button></div><p class="micro" style="margin-top:22px">Quatro níveis, um motor.<br>O app mede o aparelho para recomendar a versão.</p></aside><div class="reveal" style="--i:1">{demo('map','mode=campus&hour=14','cena-campus.webp')}</div></div>
''','Sol: sunAt em campus3d.js, referência de 26/11 em Pau dos Ferros · direção do levantamento e notas das cartas solares da dissertação','dark', 'cena-noite.webp', 'O mesmo lugar. Outra luz.', 'A identidade está nos detalhes — e a qualidade precisa caber no aparelho de quem vai usar.')

slide('verificacao','O que está comprovado','06 / Evidências',f'''
<div class="verification"><div class="test-metric reveal"><strong>14</strong><span>testes de API passaram.</span><p>Execução local na revisão de 09/11/2026. Um aviso de depreciação no cliente de testes.</p></div><div class="test-grid"><article class="card reveal" style="--i:1">{icon('check')}<h3>Regras exercitadas</h3><p>Agenda, QR, duplicidade, permissões, avisos e exportações.</p></article><article class="card reveal" style="--i:2">{icon('camera')}<h3>Imagens verificáveis</h3><p>App atual, Swagger local e referências usadas para o mapa.</p></article><article class="card reveal" style="--i:3">{icon('flask')}<h3>Homologação pendente</h3><p>SUAP, e-mail, câmera, acessibilidade e operação real do evento.</p></article><article class="card reveal" style="--i:4">{icon('file')}<h3>Escopo honesto</h3><p>Programação, materiais e partes do painel continuam exemplos.</p></article></div></div>
''','Teste SUAP usa resposta HTTP simulada · testes locais e capturas não constituem homologação oficial do IFRN ou do evento','lime', 'swagger-saude.png', 'Bonito também precisa funcionar.', 'A apresentação mostra o que foi verificado e os limites que ainda precisam de uso real.')

slide('continuidade','O próximo encontro','06 / Evidências',f'''
<div class="closing"><div><p class="eyebrow reveal">ETAL Connect</p><h2 class="reveal" style="--i:1">Do lugar real<br>ao <span class="accent">encontro<br>real.</span></h2><p class="lede reveal" style="--i:2">A base está construída. O próximo passo é ensaiar os fluxos com quem vai operar.</p><div class="row reveal" style="--i:3"><button class="button lime" data-references>Ver fontes e detalhes{icon('book')}</button><a class="button ghost" href="{{root}}index.html" target="_blank" rel="noopener">Abrir o app{icon('arrow-right')}</a></div></div><div class="closing-steps"><article class="closing-step reveal" style="--i:2"><span>01</span><div><h3>Validar o evento</h3><p>Programação, salas, vagas e regras de presença.</p></div></article><article class="closing-step reveal" style="--i:3"><span>02</span><div><h3>Fechar as conexões</h3><p>SUAP, e-mail, painel e operação do banco.</p></div></article><article class="closing-step reveal" style="--i:4"><span>03</span><div><h3>Testar com pessoas</h3><p>Celulares reais, acessibilidade e rede instável.</p></div></article></div></div>
''','Projeto independente · proposta 2026 · fontes e limites preservados nas referências · nenhuma publicação é feita ao gerar esta apresentação','dark', 'cena-noite.webp')


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
<div class="cap-content"><span class="cap-num reveal" data-depth="1.6">{num}</span><div class="cap-text"><p class="eyebrow reveal" style="--i:1">Capítulo {num}</p><h2 class="cap-title reveal" style="--i:2">{name}</h2><p class="cap-kicker reveal" style="--i:3">{kicker}</p>
<div class="cap-chips">{''.join(f'<span class="reveal" style="--i:{k+4}">{t}</span>' for k,t in enumerate(inside))}</div></div></div>'''
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
+{symbols}<header class="topbar"><a class="brand" href="#visao"><img src="{root}prototipo/assets/icon.svg" alt=""><span>ETAL CONNECT<small>O CAMPUS VIRA CAMINHO</small></span></a><span class="breadcrumb" data-breadcrumb>01 / O encontro</span><div class="top-actions"><button class="ui-button" data-references>{icon('book')}<span>Fontes e detalhes</span></button><button class="ui-button" data-outline>{icon('grid')}<span>Slides</span></button><a class="ui-button" href="{root}docs/ETAL-Connect-documentacao.pdf" target="_blank" rel="noopener">{icon('download')}<span>PDF</span></a><button class="ui-button highlight" data-fullscreen>{icon('expand')}<span>Tela cheia</span></button></div></header>
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
