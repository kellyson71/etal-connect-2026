#!/bin/sh
# Monta o site estático da Vercel a partir do protótipo. A API vem de api/index.py.
set -e
rm -rf publico && mkdir -p publico
cd prototipo
for f in *.html *.js *.css manifest.webmanifest; do
  case "$f" in server.py|propostas-*) continue ;; esac
  cp "$f" ../publico/
done
cp -r assets vendor ../publico/
cd ..
# Na Vercel a API fica na mesma origem e os avisos chegam por consulta periódica.
echo "window.ETAL_CONFIG = { api: '', vivo: 'consulta' };" > publico/config.js
echo "site em publico/: $(ls publico | wc -l) itens"
