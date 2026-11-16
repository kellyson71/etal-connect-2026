# Imagem do app: o site montado (protótipo + mapa 3D + service worker) servido pelo Caddy.
# Build, na raiz do repositório:  docker build -f deploy/web.Dockerfile -t etal-web .
FROM node:22-bookworm-slim AS montar
RUN apt-get update && apt-get install -y --no-install-recommends python3 && rm -rf /var/lib/apt/lists/*
WORKDIR /src
COPY prototipo ./prototipo
COPY mapa3d ./mapa3d
COPY scripts/app ./scripts/app
# prototipo/mapa3d é gerado: uma cópia antiga no contexto deixaria arquivos que não existem mais.
RUN rm -rf prototipo/mapa3d && sh scripts/app/montar-site.sh

FROM caddy:2-alpine
LABEL org.opencontainers.image.source="https://github.com/kellyson71/etal-connect-2026" \
      org.opencontainers.image.description="ETAL Connect: app (PWA) servido pelo Caddy"
COPY deploy/Caddyfile /etc/caddy/Caddyfile
COPY --from=montar /src/publico /srv/app
