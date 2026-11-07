"""Gera prototipo/campus-limpo.js: o campus endireitado a partir das marcações feitas à mão.

As marcações são base, não medida: quadriláteros viram retângulos, lados próximos ficam alinhados
e o que deveria se encostar passa a se encostar. Os dados originais não mudam
(app/data/campus-survey.json, prototipo/campus-fundo.js e o KML em referencias/).
O relatório no fim mostra quanto cada item se moveu.
"""
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sv = json.loads((ROOT / 'app/data/campus-survey.json').read_text())['elementos']
raw = (ROOT / 'prototipo/campus-fundo.js').read_text()
fu = json.loads(raw[raw.index('['):raw.rindex(']') + 1])
FU = {e['nome']: e['pontos'] for e in fu if e['tipo'] != 'Point'}
A, B, C = 0.0, 59.5, 64.5  # as três direções do campus: núcleo, fundo e ala oeste


class Frame:
    def __init__(self, deg):
        r = math.radians(deg)
        self.u = (math.cos(r), math.sin(r))
        self.v = (-math.sin(r), math.cos(r))

    def to(self, p):
        return (p[0] * self.u[0] + p[1] * self.u[1], p[0] * self.v[0] + p[1] * self.v[1])

    def back(self, a, b):
        return [round(a * self.u[0] + b * self.v[0], 3), round(a * self.u[1] + b * self.v[1], 3)]

    def poly(self, box):
        u0, u1, v0, v1 = box
        return [self.back(u0, v0), self.back(u1, v0), self.back(u1, v1), self.back(u0, v1)]


FA, FB, FC = Frame(A), Frame(B), Frame(C)


def box_of(p, f):
    """Limites do retângulo. Em quadriláteros, a média dos lados opostos, para não inflar pelo erro de marcação."""
    q = [f.to(x) for x in p]
    us = sorted(x[0] for x in q)
    vs = sorted(x[1] for x in q)
    if len(p) == 4:
        return [(us[0] + us[1]) / 2, (us[2] + us[3]) / 2, (vs[0] + vs[1]) / 2, (vs[2] + vs[3]) / 2]
    return [us[0], us[-1], vs[0], vs[-1]]


def intersect(a, da, b, db):
    den = da[0] * db[1] - da[1] * db[0]
    if abs(den) < 1e-6:
        return None
    t = ((b[0] - a[0]) * db[1] - (b[1] - a[1]) * db[0]) / den
    return [a[0] + da[0] * t, a[1] + da[1] * t]


def orth(p, grids, tol):
    """Encaixa cada lado na direção mais próxima, une lados seguidos paralelos e recalcula os cantos."""
    lines = []
    for i, a in enumerate(p):
        b = p[(i + 1) % len(p)]
        dx, dy = b[0] - a[0], b[1] - a[1]
        L = math.hypot(dx, dy)
        ang = math.degrees(math.atan2(dy, dx))
        snap = None
        for g in grids:
            d = (ang - g + 45) % 90 - 45
            if abs(d) <= tol and (snap is None or abs(d) < abs(snap)):
                snap = d
        final = ang - snap if snap is not None else ang
        r = math.radians(final)
        lines.append(dict(mid=[(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], d=(math.cos(r), math.sin(r)), L=L, ang=final % 180))
    merged = []
    for ln in lines:
        if merged and abs(merged[-1]['ang'] - ln['ang']) < 0.01:
            m = merged[-1]
            T = m['L'] + ln['L']
            m['mid'] = [(m['mid'][k] * m['L'] + ln['mid'][k] * ln['L']) / T for k in (0, 1)]
            m['L'] = T
        else:
            merged.append(dict(ln))
    if len(merged) > 2 and abs(merged[0]['ang'] - merged[-1]['ang']) < 0.01:
        m, ln = merged[0], merged.pop()
        T = m['L'] + ln['L']
        m['mid'] = [(m['mid'][k] * m['L'] + ln['mid'][k] * ln['L']) / T for k in (0, 1)]
        m['L'] = T
    out = []
    for i, ln in enumerate(merged):
        nx = merged[(i + 1) % len(merged)]
        q = intersect(ln['mid'], ln['d'], nx['mid'], nx['d'])
        out.append([round(q[0], 3), round(q[1], 3)] if q else [round(c, 3) for c in ln['mid']])
    return out


def cluster(boxes, keys, tol):
    """Lados quase na mesma linha passam a ficar exatamente na mesma linha."""
    for side in (0, 1):
        edges = sorted(((boxes[k][side * 2 + j], k, side * 2 + j) for k in keys for j in (0, 1)))
        group = []
        for e in edges + [(1e9, None, None)]:
            if group and e[0] - group[-1][0] > tol:
                if len(group) > 1:
                    m = sum(g[0] for g in group) / len(group)
                    for g in group:
                        boxes[g[1]][g[2]] = m
                group = []
            group.append(e)


# ---- fundo do campus e prédios na mesma direção ----
Bx = {
    'anexo': box_of(sv[1]['pontos'], FB), 'biblioteca': box_of(sv[7]['pontos'], FB),
    'ginasio': box_of(FU['quadra'], FB), 'nadic': box_of(FU['predio nadic 2 andares'], FB),
    'academia': box_of(FU['Polígono sem título'], FB), 'area': box_of(FU['area da piscina'], FB),
    'volei': box_of(FU['quadra de volei'], FB), 'campo': box_of(FU['campo de futeboll'], FB),
    'estufa': box_of(FU['jardim (estufa simples)'], FB),
}
cluster(Bx, list(Bx), 1.6)
pool_raw = box_of(FU['piscina'], FB)
pw, ph = pool_raw[1] - pool_raw[0], pool_raw[3] - pool_raw[2]
a = Bx['area']
cu, cv = (a[0] + a[1]) / 2, (a[2] + a[3]) / 2
pool = [cu - pw / 2, cu + pw / 2, cv - ph / 2, cv + ph / 2]

# ---- ala oeste ----
Cx = {'lab': box_of(sv[3]['pontos'], FC), 'med': box_of(FU['centro medico'], FC), 'vest': box_of(FU['vestiario'], FC), 'quarto': box_of(FU['quartinho de manutencao'], FC)}
# centro médico e vestiário dividem uma parede
shared = (Cx['med'][0] + Cx['vest'][1]) / 2
Cx['med'][0] = Cx['vest'][1] = shared
cluster(Cx, ['med', 'vest'], 1.6)

# ---- núcleo ----
Principal = orth(sv[0]['pontos'], [A], 12)
south = max(p[1] for p in Principal)
west = min(p[0] for p in Principal)
Ax = {k: box_of(sv[i]['pontos'], FA) for k, i in dict(patio=5, diretoria=6, portao=8, passarela=9, cantina=4, coberta=18, arv1=10, arv2=11, arb1=12, arb2=13, poli=23, meio=25).items()}
Ax['aux'] = box_of(FU['predio auxiliar'], FA)
Ax['patio'][2] = south                                 # o pátio encosta no bloco principal
Ax['passarela'][3] = Ax['portao'][2]                   # a passarela chega ao portão
Ax['passarela'][2] = Ax['patio'][3]                    # e sai do pátio
Ax['diretoria'][3] = Ax['patio'][3]
Ax['coberta'][0] = Ax['cantina'][1]                    # a coberta liga a cantina ao bloco
Ax['coberta'][1] = west

# ---- muro: lados longos retos, nas mesmas direções ----
Muro = orth(sv[22]['pontos'], [A, B, C], 4)

# ---- caminho entre o bloco e o anexo ----
Plaza = orth(FU['caminho entre bloco e anexo'], [A, B], 9)
Bed = orth([[-41.1, -63.7], [-43.4, -67.2], [-41.3, -70.6], [-28.0, -78.3], [-25.0, -72.6], [-29.3, -63.5], [-32.5, -62.6]], [A, B], 9)

# ---- Coliseu: hexágono regular ----
h = FU['colisel']
hc = [sum(p[0] for p in h) / 6, sum(p[1] for p in h) / 6]
hr = sum(math.hypot(p[0] - hc[0], p[1] - hc[1]) for p in h) / 6
h0 = math.atan2(h[0][1] - hc[1], h[0][0] - hc[0])
Hex = [[round(hc[0] + hr * math.cos(h0 + i * math.pi / 3), 3), round(hc[1] + hr * math.sin(h0 + i * math.pi / 3), 3)] for i in range(6)]

# ---- caixas d'água: fileiras ----
tq = sorted((FB.to(e['pontos'][0]) for e in fu if e['nome'] == 'caixa dagua'), key=lambda q: q[1])
rows, cur = [], [tq[0]]
for q in tq[1:]:
    if q[1] - cur[-1][1] > 1.9:
        rows.append(cur)
        cur = []
    cur.append(q)
rows.append(cur)
Tanks = []
for row in rows:
    mv = sum(q[1] for q in row) / len(row)
    mu = sum(q[0] for q in row) / len(row)
    for i in range(len(row)):
        Tanks.append(FB.back(mu + (i - (len(row) - 1) / 2) * 3.4, mv))

# ---- áreas de piso e árvores ligadas à geometria limpa ----
g, ac, nd, an = Bx['ginasio'], Bx['academia'], Bx['nadic'], Bx['anexo']
Forecourt = FB.poly([a[1], g[0], ac[2], a[3]])
Yard = FB.poly([nd[1], an[0], nd[2], g[2]])
Pad = FA.poly([Ax['aux'][0] - 1, Ax['aux'][1] + 1.5, Ax['aux'][2] - 1.5, Ax['aux'][3] + 1.5])
PoolTrees = [FB.back(a[1] + 3, a[2] + (a[3] - a[2]) * t) for t in (0.12, 0.38, 0.62, 0.88)]
sk = box_of([[-48.4, -96.2], [-43.8, -99.0], [-35.1, -86.4], [-39.8, -83.5]], FB)
Skylight = FB.poly(sk)

survey = {0: Principal, 1: FB.poly(Bx['anexo']), 3: FC.poly(Cx['lab']), 4: FA.poly(Ax['cantina']), 5: FA.poly(Ax['patio']),
          6: FA.poly(Ax['diretoria']), 7: FB.poly(Bx['biblioteca']), 8: FA.poly(Ax['portao']), 9: FA.poly(Ax['passarela']),
          10: FA.poly(Ax['arv1']), 11: FA.poly(Ax['arv2']), 12: FA.poly(Ax['arb1']), 13: FA.poly(Ax['arb2']), 18: FA.poly(Ax['coberta']),
          19: orth(sv[19]['pontos'], [A], 10), 21: orth(sv[21]['pontos'], [A], 10), 22: Muro, 23: FA.poly(Ax['poli']),
          24: orth(sv[24]['pontos'], [A], 6), 25: FA.poly(Ax['meio']), 20: [sv[20]['pontos'][0], sv[20]['pontos'][-1]]}
for i in (26, 28, 29, 30, 31, 32, 33, 34):  # fileira de árvores em frente ao muro
    survey[i] = [[sv[i]['pontos'][0][0], 52.2]]
fundo = {'quadra': FB.poly(g), 'predio nadic 2 andares': FB.poly(nd), 'caminho entre bloco e anexo': Plaza, 'colisel': Hex,
         'predio auxiliar': FA.poly(Ax['aux']), 'Polígono sem título': FB.poly(ac), 'area da piscina': FB.poly(a), 'piscina': FB.poly(pool),
         'quadra de volei': FB.poly(Bx['volei']), 'jardim (estufa simples)': FB.poly(Bx['estufa']), 'campo de futeboll': FB.poly(Bx['campo']),
         'casa do mel': orth(FU['casa do mel'], [B], 6), 'quartinho de manutencao': FC.poly(Cx['quarto']),
         'centro medico': FC.poly(Cx['med']), 'vestiario': FC.poly(Cx['vest']),
         'seu assis (restaurante famioliar ao lado)': FC.poly(box_of(FU['seu assis (restaurante famioliar ao lado)'], FC))}
data = dict(survey={str(k): v for k, v in survey.items()}, fundo=fundo, tanks=Tanks,
            extras=dict(forecourt=Forecourt, yard=Yard, pad=Pad, poolTrees=PoolTrees, bed=Bed, skylight=Skylight))
(ROOT / 'prototipo/campus-limpo.js').write_text('window.CAMPUS_LIMPO = ' + json.dumps(data, ensure_ascii=False) + ';\n')


def seg_dist(p, a, b):
    dx, dy = b[0] - a[0], b[1] - a[1]
    t = max(0, min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy or 1)))
    return math.hypot(p[0] - a[0] - dx * t, p[1] - a[1] - dy * t)


def moved(a, b):
    """Maior distância de um ponto marcado até o novo contorno."""
    return max(min(seg_dist(p, b[i], b[(i + 1) % len(b)]) for i in range(len(b))) for p in a)


rep = [(sv[k]['nome'] or f'item {k}', moved(sv[k]['pontos'], v)) for k, v in survey.items() if len(sv[k]['pontos']) > 2 and k != 20]
rep += [(k, moved(FU[k], v)) for k, v in fundo.items()]
print('prototipo/campus-limpo.js gerado. Maior deslocamento por item (m):')
for n, d in sorted(rep, key=lambda x: -x[1]):
    print(f'  {d:5.1f}  {n[:44]}')
