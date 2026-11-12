#!/bin/sh
# Prepara o ambiente (só na primeira vez) e abre o servidor do protótipo em http://127.0.0.1:8770
#   REDE=192.168.0.10 sh prototipo/rodar.sh           → pelo Wi-Fi, em HTTP (sem câmera no leitor do app)
#   REDE=192.168.0.10 HTTPS=1 sh prototipo/rodar.sh   → pelo Wi-Fi, em HTTPS: a câmera do leitor funciona
cd "$(dirname "$0")" || exit 1
[ -x .venv/bin/python ] || { python3 -m venv .venv && .venv/bin/pip install -q -r requirements.txt; } || exit 1
if [ "$HTTPS" = 1 ]; then
  [ -n "$REDE" ] || { echo "HTTPS=1 precisa de REDE=<IP do computador>"; exit 1; }
  mkdir -p .certs
  # certificado local para o IP da rede (refeito se o IP mudar)
  if [ ! -f .certs/rede.pem ] || [ "$(cat .certs/ip 2>/dev/null)" != "$REDE" ]; then
    if command -v mkcert >/dev/null; then mkcert -cert-file .certs/rede.pem -key-file .certs/rede-key.pem "$REDE" localhost 127.0.0.1 >/dev/null 2>&1
    else openssl req -x509 -newkey rsa:2048 -nodes -days 365 -subj "/CN=ETAL Connect local" -addext "subjectAltName=IP:$REDE,IP:127.0.0.1,DNS:localhost" -keyout .certs/rede-key.pem -out .certs/rede.pem 2>/dev/null
    fi || exit 1
    echo "$REDE" > .certs/ip
  fi
fi
exec .venv/bin/python server.py
