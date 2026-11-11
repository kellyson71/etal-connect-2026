"""Copia o mapa novo para dentro do app estático. Rodado por npm run pwa.

A versão embutida é a realista (mapa3d/), com o destaque do evento e o interior em maquete ao abrir o bloco."""
from pathlib import Path
import shutil
root = Path(__file__).resolve().parents[1]
source = root / 'mapa3d'
target = root / 'prototipo/mapa3d'
target.mkdir(exist_ok=True)
for name in ('src', 'assets', 'vendor'):
    shutil.copytree(source / name, target / name, dirs_exist_ok=True)
(target / 'index.html').write_text((source / 'index.html').read_text().replace('../prototipo/', '../'))
# O fallback também volta ao app empacotado.
for name in ('interface.js',):
    file = target / 'src' / name
    file.write_text(file.read_text().replace('../prototipo/', '../'))
print('Mapa 3D empacotado em prototipo/mapa3d')
