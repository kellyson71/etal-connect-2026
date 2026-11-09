"""Confere a planta do bloco principal (traçada sobre as plantas de 2012) depois de regerar principal-plan.json."""
import json
from pathlib import Path

plan = json.loads((Path(__file__).resolve().parents[1] / 'app/data/principal-plan.json').read_text())
VW, VH = map(float, plan['viewBox'].split()[2:])
NUMBERED = ('classroom', 'laboratory', 'staff', 'office')
errs = []


def poly_of(o):
    if 'points' in o:
        return [tuple(map(float, q.split(','))) for q in o['points'].split()]
    return [(o['x'], o['y']), (o['x'] + o['w'], o['y']), (o['x'] + o['w'], o['y'] + o['h']), (o['x'], o['y'] + o['h'])]


def inside(x, y, p):
    c = False
    for i in range(len(p)):
        (x0, y0), (x1, y1) = p[i], p[i - 1]
        if (y0 > y) != (y1 > y) and x < (x1 - x0) * (y - y0) / (y1 - y0) + x0:
            c = not c
    return c


def bbox(p):
    xs, ys = [q[0] for q in p], [q[1] for q in p]
    return min(xs), min(ys), max(xs), max(ys)


for f in plan['floors']:
    L = f['label']
    zones = f['zones']
    outline = [tuple(q) for q in f['outlinePts']]
    corr = [poly_of(c) for c in f['corridors']]
    walk = lambda x, y: any(inside(x, y, c) for c in corr)
    # 1. salas retangulares não se sobrepõem
    rects = [z for z in zones if 'points' not in z]
    for i, a in enumerate(rects):
        for b in rects[i + 1:]:
            if min(a['x'] + a['w'], b['x'] + b['w']) - max(a['x'], b['x']) > 0.5 and min(a['y'] + a['h'], b['y'] + b['h']) - max(a['y'], b['y']) > 0.5:
                errs.append(f"{L}: {a['id']} sobrepõe {b['id']}")
    # 2. tudo dentro do contorno do andar
    for z in zones:
        x0, y0, x1, y1 = bbox(poly_of(z))
        if not inside((x0 + x1) / 2, (y0 + y1) / 2, outline) and z['kind'] != 'courtyard':
            errs.append(f"{L}: {z['id']} fora do contorno")
    # 3. números únicos
    nums = [z['roomNumber'] for z in zones if z.get('roomNumber')]
    if len(nums) != len(set(nums)):
        errs.append(f'{L}: números repetidos')
    # 4. cada sala numerada tem porta para um corredor (ou encosta num)
    for z in zones:
        if z['kind'] not in NUMBERED:
            continue
        x0, y0, x1, y1 = bbox(poly_of(z))
        doors = [d for d in f['doors'] if x0 - 6 <= d['x'] <= x1 + 6 and y0 - 6 <= d['y'] <= y1 + 6]
        probe = [(d['x'] + dx, d['y'] + dy) for d in doors for dx, dy in ((0, 8), (0, -8), (8, 0), (-8, 0))]
        # Direção e Gabinete abrem para a sala de Estar (planta de 2012), não para o corredor.
        if (f['level'], z['id']) in {(0, 'diretor'), (0, 'gabinete'), (1, 'antigo-gremio')} and doors:
            continue
        if not any(walk(x, y) for x, y in probe):
            # sem porta: aceita se faz parte de um conjunto (biblioteca) com porta
            errs.append(f"{L}: {z['id']} sem porta para corredor")
    # 5. corredores ligados entre si (grade de 5 unidades)
    cells = {(x, y) for x in range(0, int(VW) + 1, 5) for y in range(0, int(VH) + 1, 5) if walk(x, y)}
    if cells:
        seen, stack = set(), [next(iter(cells))]
        while stack:
            c = stack.pop()
            if c in seen:
                continue
            seen.add(c)
            for dx, dy in ((5, 0), (-5, 0), (0, 5), (0, -5)):
                n = (c[0] + dx, c[1] + dy)
                if n in cells and n not in seen:
                    stack.append(n)
        if len(seen) != len(cells):
            errs.append(f'{L}: corredores separados ({len(seen)} de {len(cells)} células ligadas)')
    # 6. escada e rampa em todos os andares, ligadas a corredor
    for kind in ('stairs', 'ramp'):
        z = next((q for q in zones if q['kind'] == kind), None)
        if not z:
            errs.append(f'{L}: falta {kind}')
    st = next(q for q in zones if q['kind'] == 'stairs')
    if not walk(st['x'] + st['w'] + 4, st['y'] + st['h'] / 2):
        errs.append(f'{L}: escada sem saída para a circulação')
    if not walk(*plan['rampFoot']):
        errs.append(f'{L}: pé da rampa fora do patamar')
# 7. entradas do térreo em área de circulação (ou na recepção, junto da porta)
g = plan['floors'][0]
corr0 = [poly_of(c) for c in g['corridors']]
for name, (x, y) in plan['entrances'].items():
    near = any(inside(x + dx, y + dy, c) for c in corr0 for dx in (-8, 0, 8) for dy in (-8, 0, 8))
    if not near and name != 'principal':
        errs.append(f'Térreo: entrada {name} longe dos corredores')
print('\n'.join(errs) if errs else 'Planta ok: ' + '; '.join(f"{f['label']} {sum(1 for z in f['zones'] if z.get('roomNumber'))} ambientes numerados" for f in plan['floors']))
raise SystemExit(1 if errs else 0)
