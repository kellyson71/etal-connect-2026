"""Confere as regras da planta depois de regenerar principal-plan.json."""
import json
from pathlib import Path
plan = json.loads((Path(__file__).resolve().parents[1] / 'app/data/principal-plan.json').read_text())
ROOMS = ('classroom', 'laboratory', 'staff', 'reception')
errs = []
def box(z):
    if 'points' not in z:
        return z['x'], z['y'], z['x'] + z['w'], z['y'] + z['h']
    pts = [tuple(map(float, q.split(','))) for q in z['points'].split()]
    return min(p[0] for p in pts), min(p[1] for p in pts), max(p[0] for p in pts), max(p[1] for p in pts)
def overlap(a, b):
    return min(a[2], b[2]) - max(a[0], b[0]) > 0.01 and min(a[3], b[3]) - max(a[1], b[1]) > 0.01
for f in plan['floors']:
    L = f['label']; Z = {z['id']: z for z in f['zones']}
    rects = [z for z in f['zones'] if z['kind'] in ROOMS and 'points' not in z]
    sizes = {(round(z['w'], 3), z['h']) for z in rects}
    if len(sizes) != 1: errs.append(f'{L}: salas de tamanhos diferentes {sizes}')
    rows = {}
    for z in rects:
        if z['x'] >= 260: rows.setdefault(z['y'], []).append(z)
    if len(rows) != 4 or any(len(r) != 4 for r in rows.values()): errs.append(f'{L}: esperadas 4 faixas com 4 salas: { {k: len(v) for k, v in rows.items()} }')
    for r in rows.values():
        r.sort(key=lambda z: z['x'])
        if abs(r[0]['x'] - 260) > .01 or abs(r[-1]['x'] + r[-1]['w'] - 770) > .01: errs.append(f'{L}: faixa y={r[0]["y"]} fora do alinhamento')
    C = {c['id']: c for c in f['corridors']}
    ys = sorted(rows)
    for name, above, below in (('corredor-superior', ys[0], ys[1]), ('corredor-inferior', ys[2], ys[3])):
        c = C[name]
        if abs(above + rects[0]['h'] - c['y']) > .01 or abs(c['y'] + c['h'] - below) > .01: errs.append(f'{L}: {name} sem salas encostadas nos dois lados')
    solids = [z for z in f['zones'] if z['kind'] not in ('water',)]
    for i, a in enumerate(solids):
        for b in solids[i + 1:]:
            if 'points' in a or 'points' in b: continue
            if overlap(box(a), box(b)): errs.append(f"{L}: {a['id']} sobrepõe {b['id']}")
    for z in solids:
        if 'points' in z or z['kind'] == 'exit': continue
        for c in f['corridors']:
            if overlap(box(z), (c['x'], c['y'], c['x'] + c['w'], c['y'] + c['h'])): errs.append(f"{L}: {z['id']} invade {c['id']}")
    st = Z['escada']
    if st['w'] != st['h'] or st['x'] + st['w'] != 230: errs.append(f'{L}: escada deve ser quadrada na ala oeste')
    if any(overlap(box(st), (c['x'], c['y'], c['x'] + c['w'], c['y'] + c['h'])) for c in f['corridors']): errs.append(f'{L}: escada dentro do corredor')
    ramp = Z['rampa']
    if (ramp['x'], ramp['w']) != (800, 80): errs.append(f'{L}: rampa deve ocupar toda a largura')
    if abs(ramp['y'] + ramp['h'] - (ys[3] + rects[0]['h'] / 2)) > .01: errs.append(f'{L}: rampa deve terminar no meio da linha da recepção')
    land = C['patamar']
    if land['y'] != ramp['y'] + ramp['h'] or land['y'] + land['h'] != 390: errs.append(f'{L}: falta o patamar abaixo da rampa')
    if overlap(box(ramp), (land['x'], land['y'], land['x'] + land['w'], land['y'] + land['h'])): errs.append(f'{L}: rampa invade o patamar')
    if 'bebedouro' in Z:
        w = Z['bebedouro']
        if not (land['x'] <= w['x'] < land['x'] + land['w'] / 2 and w['y'] > land['y'] + land['h'] / 2): errs.append('1º andar: bebedouro deve ficar no canto inferior esquerdo do patamar')
    if ('bebedouro' in Z) != (f['level'] == 1): errs.append(f'{L}: bebedouro só no 1º andar')
    if f['level'] == 0:
        r = Z['recepcao']
        if r['y'] != ys[3] or abs(r['x'] + r['w'] - 770) > .01: errs.append('Térreo: recepção deve ser o fim da faixa inferior')
        for q in f['entryRoute']:
            if 800 <= q[0] <= 880 and ramp['y'] <= q[1] <= ramp['y'] + ramp['h']: errs.append('Térreo: rota da entrada atravessa a rampa')
    if f['level'] == 0 and not {'patamar', 'saida-auditorio', 'acesso-anexo'} <= set(C): errs.append('Térreo: faltam as três entradas')
    if f['level'] == 0:
        ps = f.get('passage') or []
        cov = lambda y: any(c['x'] <= 245 <= c['x'] + c['w'] and c['y'] <= y <= c['y'] + c['h'] for c in f['corridors'])
        if len(ps) != 2 or ps[0][1] != 20 or not all(cov(y) for y in range(21, int(ps[1][1]))): errs.append('Térreo: o corredor da esquerda deve ir livre do Anexo até a saída do auditório')
    sun = C.get('area-sol')
    if not sun or sun['x'] != 800 or sun['x'] + sun['w'] >= 880: errs.append(f'{L}: o corredor de cima avança só um pouco, até a área aberta, sem chegar à parede leste')
    if f['level'] > 0:
        west = [z['id'] for z in f['zones'] if box(z)[0] < 230 and z['kind'] != 'stairs']
        if west: errs.append(f'{L}: acima do auditório não há andar, mas há {west}')
    numbers = [z['roomNumber'] for z in f['zones'] if z['roomNumber']]
    if len(set(numbers)) != len(numbers): errs.append(f'{L}: números repetidos')
print('\n'.join(errs) if errs else 'Planta ok: ' + '; '.join(f"{f['label']} {sum(1 for z in f['zones'] if z['roomNumber'])} salas" for f in plan['floors']))
raise SystemExit(1 if errs else 0)
