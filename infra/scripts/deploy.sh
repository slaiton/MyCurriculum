#!/usr/bin/env bash
# Despliegue en el servidor. Ejecutar desde la raíz del repo clonado: ./infra/scripts/deploy.sh
# Orden: base de datos y CMS primero (el build del sitio lee el CMS para pre-generar páginas).
set -euo pipefail
cd "$(dirname "$0")/.."            # carpeta infra/
[ -f .env ] || { echo "Falta infra/.env (copia .env.example y complétalo)"; exit 1; }
set -a; . ./.env; set +a

PROFILE_ARGS=()
if [ "${USE_CADDY:-true}" = "true" ]; then
  # Caddy necesita los puertos 80 y 443. Si otro servidor web (Nginx, Apache) ya los usa, se detiene con instrucciones.
  caddy_running="$(docker compose --profile proxy ps -q caddy 2>/dev/null || true)"
  if [ -z "$caddy_running" ] && ss -tlnH 2>/dev/null | awk '{print $4}' | grep -qE '(^|:)(80|443)$'; then
    echo "Los puertos 80/443 ya están en uso por otro servidor web:"
    ss -tlnp 2>/dev/null | grep -E ':(80|443) ' || true
    echo
    echo "Usa ese servidor como proxy en lugar de Caddy:"
    echo "  1. Agrega USE_CADDY=false a infra/.env"
    echo "  2. Configura los sitios con los archivos de infra/nginx/ (ver infra/README.md, paso 2.4)"
    exit 1
  fi
  PROFILE_ARGS=(--profile proxy)
fi

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
