#!/bin/sh
# Backup do banco e dos arquivos (materiais e fotos). Rodar na pasta do docker-compose.yml. Guarda 14 dias.
#   sh backup.sh                         # cria backups/etal-AAAAMMDD-HHMM.sql.gz e .arquivos.tar.gz
# No cron, de hora em hora durante o evento:
#   0 * * * * cd /home/USUARIO/etal && sh backup.sh >> backups/backup.log 2>&1
# Voltar um backup do banco:
#   gunzip -c backups/etal-....sql.gz | docker compose exec -T db psql -U etal -d etal
set -e
mkdir -p backups
QUANDO=$(date +%Y%m%d-%H%M)
docker compose exec -T db pg_dump -U etal -d etal --clean --if-exists | gzip > "backups/etal-$QUANDO.sql.gz"
docker compose exec -T api tar -czf - -C /srv arquivos > "backups/etal-$QUANDO.arquivos.tar.gz"
find backups -name 'etal-*' -mtime +14 -delete
echo "$(date '+%d/%m %H:%M') backup ok: $(du -ch backups/etal-$QUANDO.* | tail -1 | cut -f1)"
