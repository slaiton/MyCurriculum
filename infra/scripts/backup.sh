#!/usr/bin/env bash
# Copia de seguridad diaria: base de datos + archivos subidos. Conserva 14 días.
# Programar con cron:  0 3 * * *  /ruta/al/repo/infra/scripts/backup.sh >> /var/log/slaiton-backup.log 2>&1
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; . ./.env; set +a

DEST="${BACKUP_DIR:-$(pwd)/backups}"
STAMP="$(date +%Y%m%d-%H%M%S)"
mkdir -p "$DEST"

docker compose exec -T postgres pg_dump -U "$DATABASE_USERNAME" -d "$DATABASE_NAME" --format=custom > "$DEST/db-$STAMP.dump"
docker compose run --rm --no-deps -v "$DEST:/backup" --entrypoint sh cms -c "tar czf /backup/uploads-$STAMP.tar.gz -C /opt/app/public uploads"

find "$DEST" -type f -mtime +14 -delete
echo "$(date -Is) backup ok: $DEST/*-$STAMP.*"

# Copia fuera del servidor (recomendado). Ejemplo con rclone ya configurado:
# rclone copy "$DEST" remoto:slaiton-backups --max-age 25h
