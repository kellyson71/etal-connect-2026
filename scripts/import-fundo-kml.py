"""Importa do Google Earth (KML) o resto do campus para prototipo/campus-fundo.js.

Usa a mesma conversão do levantamento: origem no centro do pátio e eixos alinhados a ele.
Só entram as marcações novas; as do levantamento original continuam em campus-survey.json.
Alturas e aparência ficam em prototipo/campus3d.js, que encontra cada item pelo nome.
Uso: python3 scripts/import-fundo-kml.py arquivo.kml
     python3 scripts/import-fundo-kml.py --conferir   confere a conversão com o levantamento
"""
import json
import math
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REF = ROOT / 'referencias/referencia_campus.kml'
NS = {'k': 'http://www.opengis.net/kml/2.2'}


def marks(path):
    out = []
    for m in ET.parse(path).findall('.//k:Placemark', NS):
        name = (m.findtext('k:name', default='', namespaces=NS) or '').strip()
        for kind in ('Polygon', 'LineString', 'Point'):
            for g in m.findall(f'.//k:{kind}', NS):
                pts = []
                for item in g.find('.//k:coordinates', NS).text.split():
                    p = list(map(float, item.split(',')[:2]))
                    if not pts or p != pts[-1]:
                        pts.append(p)
                if len(pts) > 1 and pts[0] == pts[-1]:
                    pts.pop()
                out.append(dict(nome=name, tipo=kind, geo=pts))
    return out


def transform():
    patio = next(e for e in marks(REF) if e['nome'] == 'patio')
    lon = sum(p[0] for p in patio['geo']) / 4
    lat = sum(p[1] for p in patio['geo']) / 4
    rad = math.pi / 180
    s = math.sin(lat * rad)
    den = 1 - 0.00669437999014 * s * s
    east = 6378137 / math.sqrt(den) * math.cos(lat * rad) * rad
    south = 6378137 * (1 - 0.00669437999014) / den ** 1.5 * rad
    metres = lambda p: ((p[0] - lon) * east, -(p[1] - lat) * south)
    a, b = map(metres, patio['geo'][:2])
    ax = (b[0] - a[0], b[1] - a[1])
    n = math.hypot(*ax)
    ax = (ax[0] / n, ax[1] / n)

    def conv(p):
        l, q = metres(p)
        return [round(-ax[1] * l + ax[0] * q, 4), round(-ax[0] * l - ax[1] * q - 2, 4)]
    return conv


def conferir():
    conv = transform()
    survey = json.loads((ROOT / 'app/data/campus-survey.json').read_text())['elementos']
    worst = 0
    for e, s in zip(marks(REF), survey):
        for p, q in zip(e['geo'], s['pontos']):
            worst = max(worst, math.hypot(conv(p)[0] - q[0], conv(p)[1] - q[1]))
    print(f'Maior diferença para o levantamento: {worst:.4f} m')
    return worst < 0.01


def main(path):
    conv = transform()
    known = {(e['nome'], tuple(map(tuple, e['geo']))) for e in marks(REF)}
    out = []
    for e in marks(path):
        if (e['nome'], tuple(map(tuple, e['geo']))) in known or e['nome'] == 'Rio Grande do Norte':
            continue
        pts = [conv(p) for p in e['geo']]
        dup = e['tipo'] == 'Point' and any(o['nome'] == e['nome'] and math.hypot(o['pontos'][0][0] - pts[0][0], o['pontos'][0][1] - pts[0][1]) < 0.5 for o in out)
        if not dup:
            out.append(dict(nome=e['nome'], tipo=e['tipo'], pontos=pts))
    (ROOT / 'prototipo/campus-fundo.js').write_text('window.CAMPUS_FUNDO = ' + json.dumps(out, ensure_ascii=False) + ';\n')
    print(f'{len(out)} marcações em prototipo/campus-fundo.js')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    if sys.argv[1] == '--conferir':
        raise SystemExit(0 if conferir() else 1)
    main(sys.argv[1])
