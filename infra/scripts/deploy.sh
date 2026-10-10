#!/usr/bin/env bash
# Despliegue en el servidor. Ejecutar desde la raíz del repo clonado: ./infra/scripts/deploy.sh
# Orden: base de datos y CMS primero (el build del sitio lee el CMS para pre-generar páginas).
set -euo pipefail
cd "$(dirname "$0")/.."            # carpeta infra/
[ -f .env ] || { echo "Falta infra/.env (copia .env.example y complétalo)"; exit 1; }
set -a; . ./.env; set +a

PROFILE_ARGS=()
[ "${USE_CADDY:-true}" = "true" ] && PROFILE_ARGS=(--profile proxy)

echo "==> Actualizando código"
git -C .. pull --ff-only

echo "==> Base de datos y CMS"
docker compose "${PROFILE_ARGS[@]}" up -d --build postgres cms

echo "==> Esperando a que el CMS responda"
for i in $(seq 1 60); do
  if curl -fsS "http://127.0.0.1:${CMS_PORT:-1337}/_health" >/dev/null 2>&1; then break; fi
  sleep 5
  [ "$i" = 60 ] && { echo "El CMS no respondió a tiempo"; docker compose logs --tail=80 cms; exit 1; }
done

echo "==> Sitio"
docker compose "${PROFILE_ARGS[@]}" up -d --build web
[ "${USE_CADDY:-true}" = "true" ] && docker compose --profile proxy up -d caddy

echo "==> Refrescando contenido en caché"
sleep 5
curl -fsS -X POST "http://127.0.0.1:${WEB_PORT:-3000}/api/revalidate" -H "x-revalidate-secret: ${REVALIDATE_SECRET}" >/dev/null && echo "ok"

docker image prune -f >/dev/null
docker compose ps
