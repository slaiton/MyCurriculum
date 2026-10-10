#!/usr/bin/env bash
# Restaura una copia: ./infra/scripts/restore.sh backups/db-AAAAMMDD-HHMMSS.dump [backups/uploads-....tar.gz]
# ATENCIÓN: reemplaza el contenido actual de la base de datos.
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; . ./.env; set +a
DB_FILE="${1:?Indica el archivo .dump}"
UPLOADS_FILE="${2:-}"

read -r -p "Esto reemplaza la base de datos actual. Escribe RESTAURAR para continuar: " ok
[ "$ok" = "RESTAURAR" ] || exit 1

docker compose stop cms web
docker compose exec -T postgres pg_restore -U "$DATABASE_USERNAME" -d "$DATABASE_NAME" --clean --if-exists < "$DB_FILE"
if [ -n "$UPLOADS_FILE" ]; then
  docker compose run --rm --no-deps -v "$(cd "$(dirname "$UPLOADS_FILE")" && pwd):/backup" --entrypoint sh cms \
    -c "rm -rf /opt/app/public/uploads/* && tar xzf /backup/$(basename "$UPLOADS_FILE") -C /opt/app/public"
fi
docker compose up -d cms web
