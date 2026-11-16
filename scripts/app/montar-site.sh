#!/bin/sh
# Monta o site estático em publico/ a partir do protótipo: junta as partes do app, empacota o mapa 3D e atualiza o
# service worker. Usado pela Vercel (vercel-build.sh) e pela imagem Docker do app (deploy/web.Dockerfile).
# Precisa de Node 22 e Python 3, sem dependências instaladas.
set -e
node scripts/app/montar-app.mjs
python3 scripts/app/build-pwa.py
rm -rf publico && mkdir -p publico
cd prototipo
for f in *.html *.js *.css manifest.webmanifest; do
  case "$f" in server.py|propostas-*) continue ;; esac
  cp "$f" ../publico/
done
cp -r assets vendor mapa3d ../publico/
cd ..
echo "site em publico/: $(ls publico | wc -l) itens"
