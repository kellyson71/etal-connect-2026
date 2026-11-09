"""Estilos visuais da planta do bloco principal (v2).

Lê a geometria gerada por build-principal-plan.py (principal-plan.json) e só pinta:
nenhuma coordenada é alterada. Três estilos: 'clara', 'relevo' e 'noite'.
"""
import math
from xml.sax.saxutils import escape

# Ambientes com atividade demonstrativa vinculada (ver app/data/event-data.ts).
EVENT_ZONES = {0: {'auditorio', 'sala-estudos-informatica', 'recepcao'}, 1: {'sala-interna-norte-1', 'sala-norte-1', 'sala-norte-2', 'sala-interna-sul-0', 'salas-sul-0'}, 2: {'labs-norte-2', 'labs-norte'}}  # 2º andar: parte de cima pelo usuário, de baixo pela planta de 2012
MINE = {2: 'labs-norte-2'}  # atividade em que a pessoa demonstrativa está inscrita

BASE_FILLS = dict(classroom='#ffffff', laboratory='#e4ecfb', staff='#f0f2f7', auditorium='#22386f', stairs='#ffffff',
                  restroom='#e4ecfb', accessible='#e4ecfb', reception='#4f9e22', ramp='#f3f6fb', office='#fbf1df', lounge='#e6f2dc')
STYLES = {
 'clara': dict(name='Planta clara', bg='#f4f6fa', plate='#e8edf5', ink='#1f2f57', soft='#8593ad', fills=BASE_FILLS,
   onDark={'auditorium', 'reception'}, light='#ffffff', mineFill='#22386f', accent='#e0312b', route='#3f8f1a',
   gap=3, rx=7, shadow=True, font="'Onest',system-ui,sans-serif", numFont="'Geologica','Onest',system-ui,sans-serif",
   garden=('#d6ebc6', '#9ccf7c', '#79b858'), path='#e6f3dc', corridor='#a3afc4', pins=False),
 'relevo': dict(name='Relevo', bg='#eef2f8', plate='#e6ecf5', ink='#1f2f57', soft='#8593ad', fills=BASE_FILLS,
   onDark={'auditorium', 'reception'}, light='#ffffff', mineFill='#22386f', accent='#e0312b', route='#3f8f1a',
   gap=3, rx=5, shadow=False, font="'Figtree',system-ui,sans-serif", numFont="'Figtree',system-ui,sans-serif",
   garden=('#cfe8bc', '#94cb73', '#6fb04f'), path='#e2f1d6', corridor='#a3afc4', pins=False, extrude=9, slab='#cfd8e6'),
 'noite': dict(name='Noite', bg='#0e1932', plate='#16244a', ink='#e8eefb', soft='#7f90b8',
   fills=dict(classroom='#213665', laboratory='#28457f', staff='#213665', auditorium='#e8eefb', stairs='#213665',
              restroom='#28457f', accessible='#28457f', reception='#7dd14a', ramp='#1a2a52', office='#3b3a63', lounge='#24433a'),
   onDark=set(), light='#ffffff', darkText='#14224a', mineFill='#2f5bb0', accent='#ff5a4f', route='#7dd14a',
   gap=4, rx=8, shadow=False, font="'Hanken Grotesk',system-ui,sans-serif", numFont="'Hanken Grotesk',system-ui,sans-serif",
   garden=('#1c4128', '#3b7d3a', '#57a24a'), path='#2a5636', corridor='#4b5d8c', pins=True, sheen=True),
}

PATTERNS = '''<defs>
<filter id="ps-room" x="-10%" y="-10%" width="120%" height="140%"><feDropShadow dx="0" dy="1.5" stdDeviation="1.4" flood-color="#1f2f57" flood-opacity=".16"/></filter>
<filter id="ps-plate" x="-5%" y="-5%" width="110%" height="120%"><feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#1f2f57" flood-opacity=".14"/></filter>
<filter id="ps-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<linearGradient id="ps-sheen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".10"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient>
<pattern id="ps-hex" width="17.32" height="30" patternUnits="userSpaceOnUse"><path d="M8.66 0L17.32 5V15L8.66 20 0 15V5Z M8.66 20V30" fill="none" stroke="#ffffff" stroke-opacity=".07" stroke-width="1"/></pattern>
</defs>'''

FONTS = ("@import url('https://fonts.googleapis.com/css2?family=Geologica:wght@500;700&family=Onest:wght@500;700"
         "&family=Figtree:wght@600;800&family=Hanken+Grotesk:wght@600;800&display=swap');")

KIND_WORD = {'classroom': 'SALA', 'laboratory': 'LAB', 'staff': 'PROF.', 'office': 'SETOR'}


def _shade(hex_, f):
    h = hex_.lstrip('#')
    r, g, b = (int(h[i:i + 2], 16) for i in (0, 2, 4))
    return '#%02x%02x%02x' % tuple(max(0, min(255, int(c * f))) for c in (r, g, b))


def _icon(kind, x, y, c, s=1.0):
    t = f'transform="translate({x:.1f} {y:.1f}) scale({s})"'
    if kind == 'stairs':
        return f'<path {t} d="M-12 8H-6V3H0V-2H6V-7H12" fill="none" stroke="{c}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>'
    if kind == 'accessible':
        return (f'<g {t} fill="none" stroke="{c}" stroke-width="2" stroke-linecap="round"><circle cx="-1" cy="-10" r="2.1" fill="{c}" stroke="none"/>'
                f'<path d="M-2-6V1H6L9 8"/><path d="M-6-1A7 7 0 1 0 5 7"/></g>')
    if kind == 'restroom':
        return (f'<g {t} fill="{c}"><circle cx="-6" cy="-9" r="2.5"/><rect x="-9" y="-5" width="6" height="14" rx="2"/>'
                f'<circle cx="6" cy="-9" r="2.5"/><path d="M6-5L11 6H1Z"/><rect x="4" y="5" width="4" height="5" rx="1"/></g>')
    if kind == 'water':
        return f'<path {t} d="M0-9C4-3 6 0 6 3A6 6 0 0 1-6 3C-6 0-4-3 0-9Z" fill="{c}"/>'
    if kind == 'reception':
        return (f'<g {t} fill="none" stroke="{c}" stroke-width="1.9" stroke-linecap="round"><path d="M-8 4H8"/>'
                f'<path d="M-6 4A6 6 0 0 1 6 4"/><circle cx="0" cy="-4" r="1.2" fill="{c}"/></g>')
    if kind == 'sun':
        rays = ''.join(f'M{7*math.cos(a*0.7854):.1f} {7*math.sin(a*0.7854):.1f}L{10*math.cos(a*0.7854):.1f} {10*math.sin(a*0.7854):.1f}' for a in range(8))
        return f'<g {t}><circle r="4.2" fill="{c}"/><path d="{rays}" stroke="{c}" stroke-width="1.8" stroke-linecap="round"/></g>'
    return ''


def _t(x, y, s, size, st, color, weight=700, font=None, anchor='middle', spacing=0, extra=''):
    ls = f' letter-spacing="{spacing}"' if spacing else ''
    return (f'<text x="{x:.1f}" y="{y:.1f}" font-family="{font or st["font"]}" font-size="{size}" font-weight="{weight}"'
            f' fill="{color}" text-anchor="{anchor}"{ls}{extra}>{escape(s)}</text>')


def _garden(x, y, w, h, st):
    """Pátio interno: piso amarelo com o riacho pintado no chão e algumas plantas em vaso."""
    dark = st is STYLES['noite']
    ground, edge, water = ('#6b5a2e', '#2f5a34', '#2f6fb0') if dark else ('#e8c866', '#7fb35a', '#3f8fd6')
    rx = min(st['rx'] + 4, h / 2)
    n = 30
    top, low = [], []
    for i in range(n + 1):
        u = i / n
        cy = y + h * (0.5 + 0.2 * math.sin(u * math.pi * 3.2))
        hw = h * (0.13 + 0.05 * math.sin(u * math.pi * 7))
        top.append(f'{x + w * u:.1f},{cy - hw:.1f}')
        low.append(f'{x + w * u:.1f},{cy + hw:.1f}')
    pts = ' '.join(top + low[::-1])
    out = [f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{ground}"/>',
           f'<polygon points="{pts}" fill="{water}" stroke="{edge}" stroke-width="2.5" stroke-linejoin="round"/>']
    for u, v in ((0.08, 0.26), (0.3, 0.76), (0.62, 0.24), (0.92, 0.72)):
        out.append(f'<circle cx="{x + w * u:.1f}" cy="{y + h * v:.1f}" r="5" fill="{edge}"/>')
    return ''.join(out)


def _fit(text, size, width, k=0.62):
    """Tamanho de fonte que cabe na largura (estimativa por caractere)."""
    return round(max(4.5, min(size, (width - 8) / max(1, k * len(text)))), 1)


def _box(z):
    if 'points' in z:
        return z['bx'], z['by'], z['bw'], z['bh']
    return z['x'], z['y'], z['w'], z['h']


def floor_parts(f, key, mine=True):
    """Formas (coordenadas da planta), rótulos (ponto + função de desenho), extrusão e rota.
    A planta segue as figuras de 2012: salas retangulares ou em polígono (ala inclinada), rampa inclinada."""
    st = STYLES[key]
    level = f['level']
    ev = EVENT_ZONES.get(level, set())
    my = MINE.get(level) if mine else None
    fills = st['fills']
    shapes, labels, ext = [], [], []
    dark_text = st.get('darkText', st['ink'])
    g = st['gap']
    plate_extra = ' filter="url(#ps-plate)"' if st['shadow'] else ''
    shapes.append(f'<path d="{f["outline"]}" fill="{st["plate"]}"{plate_extra}/>')
    if key == 'relevo':
        ext.append(f'<path d="{f["outline"]}" fill="{st["slab"]}"/>')
    roof_c = '#c9d3e3' if key != 'noite' else '#22325c'
    for r in f.get('roofs', []):
        # Telhados vistos do andar: fora do piso, sem salas.
        shapes.append(f'<polygon points="{r["points"]}" fill="{roof_c}" opacity=".55"/>'
                      f'<polygon points="{r["points"]}" fill="none" stroke="{st["soft"]}" stroke-opacity=".5" stroke-width="1.2" stroke-dasharray="5 4"/>')
        if r.get('label'):
            p = [tuple(map(float, q.split(','))) for q in r['points'].split()]
            xs, ys = [q[0] for q in p], [q[1] for q in p]
            cx, cy = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2
            words = r['label'].split(' ', 2)
            a, b = ' '.join(words[:2]), ' '.join(words[2:])
            labels.append((cx, cy, lambda X, Y, a=a, b=b: _t(X, Y - 4, a, 9, st, st['soft'], 700) + (_t(X, Y + 9, b, 9, st, st['soft'], 700) if b else '')))

    for z in f['zones']:
        k = z['kind']
        if k in ('exit', 'water'):
            continue
        is_mine = z['id'] == my
        fill = st['mineFill'] if is_mine else fills.get(k, st['plate'])
        lc = st['light'] if (k in st['onDark'] or is_mine) else (dark_text if fill in ('#e8eefb', '#7dd14a') else st['ink'])
        bx, by, bw, bh = _box(z)
        if k == 'wall':
            shapes.append(f'<rect x="{z["x"]}" y="{z["y"]}" width="{z["w"]}" height="{z["h"]}" fill="{st["soft"]}"/>')
            continue
        if k == 'courtyard':
            cid = f'ps-{key}-{level}-{z["id"]}'
            shapes.append(f'<clipPath id="{cid}"><polygon points="{z["points"]}"/></clipPath><g clip-path="url(#{cid})">'
                          + _garden(bx + g, by + g, bw - 2 * g, bh - 2 * g, st) + '</g>')
            t = z['label']
            labels.append((bx + bw * 0.45, by + bh / 2, lambda X, Y, t=t: _t(
                X, Y + 3.5, t, 9.5, st, '#3f3206' if key != 'noite' else '#f4e7bd', 800, spacing=.4,
                extra=f' paint-order="stroke" stroke="{"#e8c866" if key != "noite" else "#6b5a2e"}" stroke-width="5" stroke-linejoin="round"')))
            continue
        filt = ' filter="url(#ps-room)"' if st['shadow'] and k not in ('ramp', 'lounge') else ''
        if 'points' in z:
            cid = f'ps-{key}-{level}-{z["id"]}'
            shapes.append(f'<clipPath id="{cid}"><polygon points="{z["points"]}"/></clipPath>'
                          f'<g{filt}><g clip-path="url(#{cid})"><polygon points="{z["points"]}" fill="{fill}" stroke="{st["plate"]}" stroke-width="{2*g}"/></g></g>')
            x, y = z['labelX'], z['labelY']
        else:
            rx, ry, rw, rh = z['x'] + g, z['y'] + g, z['w'] - 2 * g, z['h'] - 2 * g
            shapes.append(f'<rect x="{rx}" y="{ry}" width="{rw}" height="{rh}" rx="{st["rx"]}" fill="{fill}"{filt}/>')
            if st.get('sheen') and k != 'ramp':
                shapes.append(f'<rect x="{rx}" y="{ry}" width="{rw}" height="{rh}" rx="{st["rx"]}" fill="url(#ps-sheen)" stroke="#ffffff" stroke-opacity=".10"/>')
            if is_mine and key == 'noite':
                shapes.append(f'<rect x="{rx}" y="{ry}" width="{rw}" height="{rh}" rx="{st["rx"]}" fill="none" stroke="{st["route"]}" stroke-width="2" filter="url(#ps-glow)"/>')
            x, y = z['x'] + z['w'] / 2, z['y'] + z['h'] / 2
        # largura útil no ponto do rótulo (polígonos: a menor largura da caixa)
        lw = min(bw, 110) if 'points' in z else bw

        if k in KIND_WORD:
            num, word = z['roomNumber'], z.get('word') or KIND_WORD[k]
            tag = f' data-num="{f["level"]}:{z["id"]}"'  # o app troca o número sem regerar a planta
            soft = st['soft'] if lc == st['ink'] else lc
            ws, ns = _fit(word, 8, lw, 0.7), _fit(num, 20, lw, 0.62)
            labels.append((x, y, lambda X, Y, num=num, lc=lc, soft=soft, word=word, tag=tag, ws=ws, ns=ns:
                           _t(X, Y - 11, word, ws, st, soft, 800, spacing=.6 if ws > 6 else 0, extra=' opacity=".85"') + _t(X, Y + 10, num, ns, st, lc, 700, st['numFont'], extra=tag)))
            if is_mine:
                labels.append((bx + g + 10, by + g + 14, lambda X, Y: f'<g transform="translate({X:.1f} {Y:.1f})"><rect x="0" y="-8" width="72" height="16" rx="8" fill="#ffffff"/>'
                               + _t(36, 3, 'SUA ATIVIDADE', 7, st, '#22386f', 800, spacing=.5) + '</g>'))
            elif z['id'] in ev:
                labels.append((bx + bw - g - 9, by + g + 9, lambda X, Y: f'<circle cx="{X:.1f}" cy="{Y:.1f}" r="4.5" fill="{st["accent"]}"/>'))
        elif k == 'auditorium':
            c = st['light'] if k in st['onDark'] else dark_text
            labels.append((x, y, lambda X, Y, c=c: _t(X, Y + 2, 'Auditório', 16, st, c, 700, st['numFont'])
                           + f'<circle cx="{X-34:.1f}" cy="{Y+19:.1f}" r="4" fill="{st["accent"]}"/>'
                           + _t(X + 5, Y + 22.5, '2 palestras', 9, st, c, 600, extra=' opacity=".8"')))
        elif k == 'stairs':
            labels.append((x, y, lambda X, Y, lc=lc: _icon('stairs', X, Y - 5, lc, .8) + _t(X, Y + 17, 'ESCADA', 6.5, st, st['soft'], 800, spacing=.6)))
        elif k in ('restroom', 'accessible'):
            c = st['ink'] if key != 'noite' else '#ffffff'
            labels.append((x, y, lambda X, Y, k=k, c=c: _icon(k, X, Y + 1, c, .9)))
        elif k == 'reception':
            c = st['light'] if k in st['onDark'] else dark_text
            labels.append((x, y, lambda X, Y, c=c: _icon('reception', X, Y - 6, c, .75) + _t(X, Y + 11, 'Recepção', 7.5, st, c, 800)))
        elif k == 'lounge':
            # Área de descanso: piso marcado, sem paredes, com os móveis.
            t = z.get('word') or 'DESCANSO'
            labels.append((x, y + (14 if bh > 60 else 0), lambda X, Y, t=t, w=lw: _t(X, Y + 3, t, _fit(t, 6.5, w, 0.7), st, '#3f6b30' if key != 'noite' else '#bfe3b0', 800, spacing=.5)))
        elif k == 'ramp':
            labels.append((x, y, lambda X, Y: _t(X, Y, 'RAMPA', 7.5, st, st['soft'], 800, spacing=2, extra=f' transform="rotate(68.2 {X:.1f} {Y-3:.1f})"')))

    for d in f['doors']:
        x, y = d['x'], d['y']
        if st['pins']:
            yy = y + 9 if d['axis'] == 'h' else y
            xx = x + 9 if d['axis'] == 'v' else x
            shapes.append(f'<path d="M{x} {y}L{xx} {yy}" stroke="#5f7cc0" stroke-width="1.2"/><circle cx="{xx}" cy="{yy}" r="2.3" fill="{st["plate"]}" stroke="#5f7cc0" stroke-width="1.2"/>')
        else:
            p = f'M{x-7} {y}H{x+7}' if d['axis'] == 'h' else f'M{x} {y-7}V{y+7}'
            shapes.append(f'<path d="{p}" stroke="{st["plate"]}" stroke-width="{g*2+3}"/>')

    for w in f.get('walls', []):
        d = 'M' + ' L'.join(f'{x} {y}' for x, y in w)
        shapes.append(f'<path d="{d}" stroke="{st["soft"]}" stroke-width="3" stroke-linecap="round"/>')
    shapes.append(f'<path d="{f["rampRails"]}" fill="none" stroke="{st["soft"]}" stroke-opacity=".7" stroke-width="1.6" stroke-linecap="round"/>')
    shapes.append(f'<path d="{f["rampArrows"]}" fill="none" stroke="{st["soft"]}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>')

    # Corredores: rótulo discreto no meio de cada um.
    for c in f['corridors']:
        cx, cy = c['x'] + c['w'] / 2, c['y'] + c['h'] / 2
        if c['id'] in ('patamar', 'hall-entrada', 'hall-auditorio'):
            continue
        if c['id'] == 'circulacao-leste':
            cx, cy = 742, 360
            labels.append((cx, cy, lambda X, Y: _t(X, Y, 'CIRCULAÇÃO', 6.5, st, st['corridor'], 800, spacing=2, extra=f' transform="rotate(68.2 {X:.1f} {Y-3:.1f})"')))
            continue
        vert = c['h'] > c['w']
        t = 'CORREDOR DO ANEXO' if c['id'] == 'passagem-anexo' else ('CIRCULAÇÃO' if vert else 'CORREDOR')
        labels.append((cx, cy + 3, lambda X, Y, t=t, vert=vert: _t(X, Y, t, 6.5, st, st['corridor'], 800, spacing=2.2,
                       extra=f' transform="rotate(-90 {X:.1f} {Y-3:.1f})"' if vert else '')))
    for m in f.get('marks', []):
        labels.append((m['x'], m['y'], lambda X, Y, t=m['text']: _t(X, Y, t, 9, st, st['soft'], 700)))

    route = ''
    if f['entryRoute']:
        pts = ' '.join(f'{x},{y}' for x, y in f['entryRoute'])
        glow = ' filter="url(#ps-glow)"' if key == 'noite' else ''
        (ex, ey), (tx, ty) = f['entryRoute'][0], f['entryRoute'][-1]
        route = (f'<polyline points="{pts}" fill="none" stroke="{st["route"]}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="0.1 7"{glow}/>'
                 f'<path d="M{tx-4} {ty+7}l4 -6 4 6" fill="none" stroke="{st["route"]}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>')
        labels.append((ex, ey, lambda X, Y: f'<circle cx="{X:.1f}" cy="{Y:.1f}" r="13" fill="#2f7de1" opacity=".2"/><circle cx="{X:.1f}" cy="{Y:.1f}" r="6.5" fill="#2f7de1" stroke="#ffffff" stroke-width="2.5"/>'
                       + _t(X - 20, Y + 3.5, 'Você está aqui', 9.5, st, st['ink'], 800, anchor='end')))
    return shapes, labels, ext, route


# Projeção oblíqua do estilo relevo: X = x - 0.3y + 140, Y = 0.62y + 40
REL = (1, 0, -0.3, 0.62, 118, 30)


def floor_svg(f, key, mine=True):
    shapes, labels, ext, route = floor_parts(f, key, mine)
    if key != 'relevo':
        return ''.join(shapes) + route + ''.join(fn(x, y) for x, y, fn in labels)
    a, b, c, d, e, ff = REL
    m = f'matrix({a} {b} {c} {d} {e} {ff})'
    h = STYLES['relevo']['extrude']
    return (f'<g transform="translate(0 {h+5})"><g transform="{m}" filter="url(#ps-plate)">{ext[0]}</g></g>'
            f'<g transform="translate(0 {h})"><g transform="{m}">{"".join(ext[1:])}</g></g>'
            f'<g transform="{m}">{"".join(shapes)}{route}</g>'
            + ''.join(fn(a * x + c * y + e, b * x + d * y + ff) for x, y, fn in labels))


def viewbox(key):
    return '0 0 960 660' if key != 'relevo' else '0 10 1100 460'


def standalone_floor(f, key, w=None, vb=None):
    st = STYLES[key]
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb or viewbox(key)}"' + (f' width="{w}"' if w else '')
            + f'><style>{FONTS.replace("&", "&amp;")}</style>{PATTERNS}<rect x="-100" y="-100" width="1200" height="700" fill="{st["bg"]}"/>'
            + floor_svg(f, key) + '</svg>')


def sheet(plan, key='clara'):
    """Prancha com os três andares, para public/maps/bloco-principal.svg."""
    st = STYLES[key]
    H = 130 + 3 * 700 + 50
    p = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 {H}"><style>{FONTS.replace("&", "&amp;")}</style>{PATTERNS}<rect width="1000" height="{H}" fill="{st["bg"]}"/>']
    p.append(_t(30, 58, 'Bloco principal', 30, st, st['ink'], 700, st['numFont'], anchor='start'))
    p.append(_t(30, 84, 'Plantas de 2012 · uso de 2012 · números demonstrativos', 12, st, st['soft'], 600, anchor='start'))
    gx = 600
    p.append(f'<rect x="{gx}" y="44" width="14" height="14" rx="4" fill="{st["mineFill"]}"/>' + _t(gx + 22, 55, 'Sua atividade', 11, st, st['ink'], 600, anchor='start'))
    p.append(f'<circle cx="{gx+7}" cy="76" r="4.5" fill="{st["accent"]}"/>' + _t(gx + 22, 80, 'Outras atividades', 11, st, st['ink'], 600, anchor='start'))
    p.append(f'<rect x="{gx+150}" y="44" width="14" height="14" rx="4" fill="{st["fills"]["laboratory"]}"/>' + _t(gx + 172, 55, 'Laboratório', 11, st, st['ink'], 600, anchor='start'))
    p.append(f'<path d="M{gx+150} 76H{gx+164}" stroke="{st["route"]}" stroke-width="3" stroke-linecap="round" stroke-dasharray="0.1 6"/>' + _t(gx + 172, 80, 'Rota da entrada', 11, st, st['ink'], 600, anchor='start'))
    for f in plan['floors']:
        dy = 110 + f['level'] * 700
        p.append(_t(30, dy + 34, f['label'], 20, st, st['ink'], 700, st['numFont'], anchor='start'))
        p.append(f'<g transform="translate(30 {dy+50})">{floor_svg(f, key)}</g>')
    p.append(_t(30, H - 22, 'Fonte: Larissa Leiros de Souza, dissertação de mestrado (UFRN, 2012), figuras 9 a 11 · não é levantamento arquitetônico oficial', 10, st, st['soft'], 500, anchor='start'))
    p.append('</svg>')
    return ''.join(p)
