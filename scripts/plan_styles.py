"""Estilos visuais da planta do bloco principal (v2).

Lê a geometria gerada por build-principal-plan.py (principal-plan.json) e só pinta:
nenhuma coordenada é alterada. Três estilos: 'clara', 'relevo' e 'noite'.
"""
import math
from xml.sax.saxutils import escape

# Ambientes com atividade demonstrativa vinculada (ver app/data/event-data.ts).
EVENT_ZONES = {0: {'sala-norte-0', 'auditorio'}, 1: {'sala-interna-norte-1'}, 2: {'labs-norte-2', 'labs-norte'}}
MINE = {2: 'labs-norte-2'}  # atividade em que a pessoa demonstrativa está inscrita

BASE_FILLS = dict(classroom='#ffffff', laboratory='#e4ecfb', staff='#f0f2f7', auditorium='#22386f', stairs='#ffffff',
                  restroom='#e4ecfb', accessible='#e4ecfb', reception='#4f9e22', ramp='#f3f6fb')
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
              restroom='#28457f', accessible='#28457f', reception='#7dd14a', ramp='#1a2a52'),
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

KIND_WORD = {'classroom': 'SALA', 'laboratory': 'LAB', 'staff': 'PROF.'}


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


def floor_parts(f, key, mine=True):
    """Formas (coordenadas da planta), rótulos (ponto + função de desenho), extrusão e rota."""
    st = STYLES[key]
    level = f['level']
    ev = EVENT_ZONES.get(level, set())
    my = MINE.get(level) if mine else None
    fills = st['fills']
    shapes, labels, ext = [], [], []
    dark_text = st.get('darkText', st['ink'])
    g = st['gap']

    plate_extra = ' filter="url(#ps-plate)"' if st['shadow'] else ''
    if f.get('audRoof'):
        # Telhado do auditório, visto dos andares de cima: fora do piso, mais baixo e sem salas.
        roof_c = '#c9d3e3' if key != 'noite' else '#22325c'
        shapes.append(f'<polygon points="{f["audRoof"]}" fill="{roof_c}" opacity=".55"/>'
                      f'<polygon points="{f["audRoof"]}" fill="none" stroke="{st["soft"]}" stroke-opacity=".5" stroke-width="1.2" stroke-dasharray="5 4"/>')
        labels.append((112, 140, lambda X, Y: _t(X, Y - 4, 'Telhado do', 9, st, st['soft'], 700) + _t(X, Y + 9, 'auditório', 9, st, st['soft'], 700)))
    shapes.append(f'<path d="{f["outline"]}" fill="{st["plate"]}"{plate_extra}/>')
    for c in f['corridors']:
        if c['id'] == 'area-sol':
            sun = '#f6e3a3' if key != 'noite' else '#5a4a22'
            shapes.append(f'<rect x="{c["x"]+g}" y="{c["y"]+g}" width="{c["w"]-2*g}" height="{c["h"]-2*g}" rx="4" fill="{sun}"/>')
            labels.append((c['x'] + c['w'] / 2, c['y'] + c['h'] / 2, lambda X, Y: _icon('sun', X, Y, '#c98a12', .75)))
    if st.get('sheen'):
        shapes.append(f'<path d="{f["outline"]}" fill="url(#ps-hex)"/>')
    if key == 'relevo':
        ext.append(f'<path d="{f["outline"]}" fill="{st["slab"]}"/>')

    for z in f['zones']:
        k = z['kind']
        if k in ('exit', 'water'):
            continue
        is_mine = z['id'] == my
        fill = st['mineFill'] if is_mine else fills.get(k, st['plate'])
        lc = st['light'] if (k in st['onDark'] or is_mine) else (dark_text if fill in ('#e8eefb', '#7dd14a') else st['ink'])
        if k == 'courtyard':
            shapes.append(_garden(z['x'] + g, z['y'] + g, z['w'] - 2 * g, z['h'] - 2 * g, st))
            if key == 'relevo':
                ext.append(f'<rect x="{z["x"]+g}" y="{z["y"]+g}" width="{z["w"]-2*g}" height="{z["h"]-2*g}" rx="8" fill="{_shade(st["garden"][0], .8)}"/>')
            t = 'Pátio interno' if level == 0 else 'Vão do pátio'
            labels.append((z['x'] + z['w'] / 2, z['y'] + z['h'] / 2, lambda X, Y, t=t: _t(
                X, Y + 3.5, t, 9.5, st, '#3f3206' if key != 'noite' else '#f4e7bd', 800, spacing=.4,
                extra=f' paint-order="stroke" stroke="{"#e8c866" if key != "noite" else "#6b5a2e"}" stroke-width="5" stroke-linejoin="round"')))
            continue
        filt = ' filter="url(#ps-room)"' if st['shadow'] and k != 'ramp' else ''
        if 'points' in z:
            cid = f'ps-{key}-{level}-{z["id"]}'
            shapes.append(f'<clipPath id="{cid}"><polygon points="{z["points"]}"/></clipPath>'
                          f'<g{filt}><g clip-path="url(#{cid})"><polygon points="{z["points"]}" fill="{fill}" stroke="{st["plate"]}" stroke-width="{2*g}"/></g></g>')
            if key == 'relevo':
                ext.append(f'<polygon points="{z["points"]}" fill="{_shade(fill, .78) if fill != "#ffffff" else "#d5dceb"}"/>')
            x, y = z['labelX'], z['labelY']
        else:
            rx, ry, rw, rh = z['x'] + g, z['y'] + g, z['w'] - 2 * g, z['h'] - 2 * g
            shapes.append(f'<rect x="{rx}" y="{ry}" width="{rw}" height="{rh}" rx="{st["rx"]}" fill="{fill}"{filt}/>')
            if st.get('sheen') and k != 'ramp':
                shapes.append(f'<rect x="{rx}" y="{ry}" width="{rw}" height="{rh}" rx="{st["rx"]}" fill="url(#ps-sheen)" stroke="#ffffff" stroke-opacity=".10"/>')
            if key == 'relevo' and k != 'ramp':
                ext.append(f'<rect x="{rx}" y="{ry}" width="{rw}" height="{rh}" rx="{st["rx"]}" fill="{_shade(fill, .78) if fill != "#ffffff" else "#d5dceb"}"/>')
            if is_mine and key == 'noite':
                shapes.append(f'<rect x="{rx}" y="{ry}" width="{rw}" height="{rh}" rx="{st["rx"]}" fill="none" stroke="{st["route"]}" stroke-width="2" filter="url(#ps-glow)"/>')
            x, y = z['x'] + z['w'] / 2, z['y'] + z['h'] / 2

        if k in KIND_WORD:
            num, word = z['roomNumber'], KIND_WORD[k]
            soft = st['soft'] if lc == st['ink'] else lc
            if z.get('h', 0) < 46:
                labels.append((x, y, lambda X, Y, num=num, lc=lc, soft=soft, word=word:
                               _t(X, Y - 5, word, 6.5, st, soft, 800, spacing=1.2, extra=' opacity=".85"') + _t(X, Y + 10, num, 14, st, lc, 700, st['numFont'])))
            else:
                labels.append((x, y, lambda X, Y, num=num, lc=lc, soft=soft, word=word:
                               _t(X, Y - 11, word, 8, st, soft, 800, spacing=1.4, extra=' opacity=".85"') + _t(X, Y + 10, num, 20, st, lc, 700, st['numFont'])))
            if is_mine:
                labels.append((z.get('x', 20) + g + 10, z.get('y', 20) + g + 14, lambda X, Y: f'<g transform="translate({X:.1f} {Y:.1f})"><rect x="0" y="-8" width="72" height="16" rx="8" fill="#ffffff"/>'
                               + _t(36, 3, 'SUA ATIVIDADE', 7, st, '#22386f', 800, spacing=.5) + '</g>'))
            elif z['id'] in ev:
                labels.append((z['x'] + z['w'] - g - 9, z['y'] + g + 9, lambda X, Y: f'<circle cx="{X:.1f}" cy="{Y:.1f}" r="4.5" fill="{st["accent"]}"/>'))
        elif k == 'auditorium':
            c = st['light'] if k in st['onDark'] else dark_text
            labels.append((x, y, lambda X, Y, c=c: _t(X, Y + 2, 'Auditório', 16, st, c, 700, st['numFont'])
                           + f'<circle cx="{X-34:.1f}" cy="{Y+19:.1f}" r="4" fill="{st["accent"]}"/>'
                           + _t(X + 5, Y + 22.5, '2 palestras', 9, st, c, 600, extra=' opacity=".8"')))
        elif k == 'stairs':
            labels.append((x, y, lambda X, Y, lc=lc: _icon('stairs', X, Y - 5, lc) + _t(X, Y + 17, 'ESCADA', 7, st, st['soft'], 800, spacing=1)))
        elif k in ('restroom', 'accessible'):
            c = st['ink'] if key != 'noite' else '#ffffff'
            labels.append((x, y, lambda X, Y, k=k, c=c: _icon(k, X, Y + 1, c, .9)))
        elif k == 'reception':
            c = st['light'] if k in st['onDark'] else dark_text
            labels.append((x, y, lambda X, Y, c=c: _icon('reception', X, Y - 6, c, .85) + _t(X, Y + 12, 'Recepção', 8.5, st, c, 800)))

    for d in f['doors']:
        x, y = d['x'], d['y']
        if st['pins']:
            if d['axis'] == 'h':
                yy = y + (9 if y in (78, 252) else -9)
                shapes.append(f'<path d="M{x} {y}V{yy}" stroke="#5f7cc0" stroke-width="1.2"/><circle cx="{x}" cy="{yy}" r="2.3" fill="{st["plate"]}" stroke="#5f7cc0" stroke-width="1.2"/>')
            else:
                shapes.append(f'<path d="M{x} {y}H{x+9}" stroke="#5f7cc0" stroke-width="1.2"/><circle cx="{x+9}" cy="{y}" r="2.3" fill="{st["plate"]}" stroke="#5f7cc0" stroke-width="1.2"/>')
        else:
            p = f'M{x-7} {y}H{x+7}' if d['axis'] == 'h' else f'M{x} {y-7}V{y+7}'
            shapes.append(f'<path d="{p}" stroke="{st["plate"]}" stroke-width="{g*2+3}"/>')

    shapes.append(f'<path d="{f["rampRails"]}" fill="none" stroke="{st["soft"]}" stroke-opacity=".7" stroke-width="1.6" stroke-linecap="round"/>')
    shapes.append(f'<path d="{f["rampArrows"]}" fill="none" stroke="{st["soft"]}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>')
    ramp = next(z for z in f['zones'] if z['kind'] == 'ramp')
    labels.append((ramp['x'] + ramp['w'] / 2, 200, lambda X, Y: _t(X, Y, 'RAMPA', 7.5, st, st['soft'], 800, spacing=2, extra=f' transform="rotate(-90 {X:.1f} {Y-3:.1f})"')))

    labels.append((245, 200 if level == 0 else 190, lambda X, Y: _t(X, Y, 'CORREDOR DO ANEXO' if level == 0 else 'CORREDOR', 7, st, st['corridor'], 800, spacing=2, extra=f' transform="rotate(-90 {X:.1f} {Y-3:.1f})"')))
    for cx, cy in [(515, 96), (515, 270)]:
        labels.append((cx, cy, lambda X, Y: _t(X, Y, 'CORREDOR', 7.5, st, st['corridor'], 800, spacing=3)))
    if level == 0:
        labels.append((173, 356, lambda X, Y: _t(X, Y, 'Entrada do auditório', 9, st, st['soft'], 700)))
        labels.append((245, 14, lambda X, Y: _t(X, Y, 'Entrada do Anexo', 9, st, st['soft'], 700)))
    if level == 1:
        labels.append((814, 376, lambda X, Y: _icon('water', X, Y, '#2f8fd0', .85)))
        labels.append((806, 404, lambda X, Y: _t(X, Y, 'Bebedouro', 8.5, st, st['soft'], 700, anchor='start')))

    route = ''
    if f['entryRoute']:
        pts = ' '.join(f'{x},{y}' for x, y in f['entryRoute'])
        glow = ' filter="url(#ps-glow)"' if key == 'noite' else ''
        route = (f'<polyline points="{pts}" fill="none" stroke="{st["route"]}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="0.1 7"{glow}/>'
                 f'<path d="{f["entryArrow"]}" fill="none" stroke="{st["route"]}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>')
        labels.append((820, 398, lambda X, Y: f'<circle cx="{X:.1f}" cy="{Y:.1f}" r="13" fill="#2f7de1" opacity=".2"/><circle cx="{X:.1f}" cy="{Y:.1f}" r="6.5" fill="#2f7de1" stroke="#ffffff" stroke-width="2.5"/>'
                       + _t(X - 20, Y + 3.5, 'Você está aqui', 9.5, st, st['ink'], 800, anchor='end')))
        labels.append((820, 425, lambda X, Y: _t(X, Y, 'Entrada', 8.5, st, st['soft'], 700)))
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
    return '0 0 900 430' if key != 'relevo' else '0 10 1000 300'


def standalone_floor(f, key, w=None, vb=None):
    st = STYLES[key]
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb or viewbox(key)}"' + (f' width="{w}"' if w else '')
            + f'><style>{FONTS.replace("&", "&amp;")}</style>{PATTERNS}<rect x="-100" y="-100" width="1200" height="700" fill="{st["bg"]}"/>'
            + floor_svg(f, key) + '</svg>')


def sheet(plan, key='clara'):
    """Prancha com os três andares, para public/maps/bloco-principal.svg."""
    st = STYLES[key]
    H = 150 + 3 * 500 + 50
    p = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 {H}"><style>{FONTS.replace("&", "&amp;")}</style>{PATTERNS}<rect width="960" height="{H}" fill="{st["bg"]}"/>']
    p.append(_t(30, 58, 'Bloco principal', 30, st, st['ink'], 700, st['numFont'], anchor='start'))
    p.append(_t(30, 84, 'Planta esquemática · sem escala · numeração demonstrativa', 12, st, st['soft'], 600, anchor='start'))
    gx = 600
    p.append(f'<rect x="{gx}" y="44" width="14" height="14" rx="4" fill="{st["mineFill"]}"/>' + _t(gx + 22, 55, 'Sua atividade', 11, st, st['ink'], 600, anchor='start'))
    p.append(f'<circle cx="{gx+7}" cy="76" r="4.5" fill="{st["accent"]}"/>' + _t(gx + 22, 80, 'Outras atividades', 11, st, st['ink'], 600, anchor='start'))
    p.append(f'<rect x="{gx+150}" y="44" width="14" height="14" rx="4" fill="{st["fills"]["laboratory"]}"/>' + _t(gx + 172, 55, 'Laboratório', 11, st, st['ink'], 600, anchor='start'))
    p.append(f'<path d="M{gx+150} 76H{gx+164}" stroke="{st["route"]}" stroke-width="3" stroke-linecap="round" stroke-dasharray="0.1 6"/>' + _t(gx + 172, 80, 'Rota até a recepção', 11, st, st['ink'], 600, anchor='start'))
    for f in plan['floors']:
        dy = 130 + f['level'] * 500
        p.append(_t(30, dy + 34, f['label'], 20, st, st['ink'], 700, st['numFont'], anchor='start'))
        p.append(f'<g transform="translate(30 {dy+50})">{floor_svg(f, key)}</g>')
    p.append(_t(30, H - 22, 'Rampa até o meio da linha da recepção, com patamar abaixo · bebedouro somente no 1º andar · não é levantamento arquitetônico oficial', 10, st, st['soft'], 500, anchor='start'))
    p.append('</svg>')
    return ''.join(p)
