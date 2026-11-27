#!/bin/sh
# Monta o site estático da Vercel a partir do protótipo. A API vem de api/index.py.
set -e
sh scripts/app/montar-site.sh
# Na Vercel a API fica na mesma origem e os avisos chegam por consulta periódica.
echo "window.ETAL_CONFIG = { api: '', vivo: 'consulta' }; document.documentElement.classList.add('prod');" > publico/config.js
