"""Reproduz o Dijkstra do app (campus3d.js, gridPath) no térreo e salva a ordem de visita para a animação da apresentação.

Mesma regra do app: grade de 5 px da planta só nos corredores, custo 1 no meio do corredor e 1,8 perto da parede,
mais 3 a cada curva. Saída: docs/assets/rota-dijkstra.json
"""
import heapq, json, math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
plan = json.loads((ROOT / 'app/data/principal-plan.json').read_text())
f = plan['floors'][0]
STEP = 5
polys = []
for c in f['corridors']:
    if 'points' in c:
        polys.append(('p', [tuple(map(float, q.split(','))) for q in c['points'].split()]))
    else:
        polys.append(('r', (c['x'], c['y'], c['w'], c['h'])))

def inpoly(x, y, p):
    inside = False
    for i in range(len(p)):
        (x0, y0), (x1, y1) = p[i], p[i - 1]
        if (y0 > y) != (y1 > y) and x < (x1 - x0) * (y - y0) / (y1 - y0) + x0:
            inside = not inside
    return inside

def inC(x, y):
    return any(inpoly(x, y, v) if k == 'p' else (v[0] <= x <= v[0] + v[2] and v[1] <= y <= v[1] + v[3]) for k, v in polys)

def snap(p):
    return (round(p[0] / STEP) * STEP, round(p[1] / STEP) * STEP)

def nearest(p):
    best, bd = None, 1e9
    for x in range(0, 961, STEP):
        for y in range(0, 661, STEP):
            if inC(x, y):
                d = math.hypot(x - p[0], y - p[1])
                if d < bd: best, bd = (x, y), d
    return best

zone = next(z for z in f['zones'] if z['id'] == 'rh')
bb = (zone['x'], zone['y'], zone['x'] + zone['w'], zone['y'] + zone['h'])
dist = lambda d: math.hypot(max(bb[0] - d['x'], 0, d['x'] - bb[2]), max(bb[1] - d['y'], 0, d['y'] - bb[3]))
door = min(f['doors'], key=dist)
start_pt = tuple(plan['entrances']['principal']); goal_pt = (door['x'], door['y'])
s = snap(start_pt) if inC(*snap(start_pt)) else nearest(start_pt)
g = snap(goal_pt) if inC(*snap(goal_pt)) else nearest(goal_pt)

cost = {s: 0}; prev = {}; seen = set(); order = []; heap = [(0, s)]
while heap:
    c, u = heapq.heappop(heap)
    if u in seen: continue
    seen.add(u); order.append(u)
    if u == g: break
    for dx, dy in ((STEP, 0), (-STEP, 0), (0, STEP), (0, -STEP)):
        v = (u[0] + dx, u[1] + dy)
        if not inC(*v): continue
        edge = 1 if all(inC(v[0] + a, v[1] + b) for a, b in ((-10, 0), (10, 0), (0, -10), (0, 10))) else 1.8
        turn = 0 if u not in prev or prev[u] == (u[0] - dx, u[1] - dy) else 3
        nc = cost[u] + edge * STEP + turn
        if nc < cost.get(v, 1e18):
            cost[v] = nc; prev[v] = u; heapq.heappush(heap, (nc, v))
path = [g]
while path[-1] in prev: path.append(prev[path[-1]])
path.reverse()
full = [start_pt, *path, goal_pt]
simple = [q for i, q in enumerate(full) if i in (0, len(full) - 1) or not ((full[i-1][0] == q[0] == full[i+1][0]) or (full[i-1][1] == q[1] == full[i+1][1]))]
sx, sy = plan['world']['sx'], plan['world']['sy']
metros = sum(math.hypot((b[0] - a[0]) * sx, (b[1] - a[1]) * sy) for a, b in zip(simple, simple[1:]))
out = {'viewBox': plan['viewBox'], 'visitadas': order, 'caminho': simple, 'inicio': start_pt, 'fim': goal_pt,
       'metros': round(metros), 'minutos': max(1, round(metros / 75)), 'destino': 'Sala 001 · RH', 'celulas': len(order)}
(ROOT / 'docs/assets/rota-dijkstra.json').write_text(json.dumps(out, separators=(',', ':')))
print(f'{len(order)} células visitadas, caminho de {len(simple)} pontos, {out["metros"]} m, {out["minutos"]} min')
