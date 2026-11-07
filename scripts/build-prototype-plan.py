"""Gera prototipo/plan-data.js: SVG dos três andares (estilo 'clara') + zonas clicáveis."""
import json, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
import plan_styles as ps
plan = json.loads((ROOT / 'app/data/principal-plan.json').read_text())
floors = []
for f in plan['floors']:
    zones = [{k: z[k] for k in ('id', 'kind', 'label', 'roomNumber', 'useLabel', 'x', 'y', 'w', 'h', 'points', 'labelX', 'labelY') if k in z}
             for z in f['zones'] if z['kind'] != 'exit']
    floors.append(dict(level=f['level'], label=f['label'], svg=ps.floor_svg(f, 'clara'), svgDark=ps.floor_svg(f, 'noite'), zones=zones, outline=f['outline'], corridors=f['corridors'], doors=f['doors'], entryRoute=f['entryRoute'], passage=f.get('passage', []), audRoof=f.get('audRoof', '')))
out = 'window.PLAN = ' + json.dumps(dict(defs=ps.PATTERNS, floors=floors), ensure_ascii=False) + ';\n'
(ROOT / 'prototipo/plan-data.js').write_text(out)
survey = json.loads((ROOT / 'app/data/campus-survey.json').read_text())
(ROOT / 'prototipo/campus-data.js').write_text('window.CAMPUS = ' + json.dumps(survey, ensure_ascii=False) + ';\n')
print('prototipo/plan-data.js', len(out))
