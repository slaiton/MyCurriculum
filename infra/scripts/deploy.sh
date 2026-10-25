#!/usr/bin/env bash
# Despliegue en el servidor. Ejecutar desde la raíz del repo clonado:
#   ./infra/scripts/deploy.sh [web|cms|all]
#
#   web  → solo el sitio (Next.js). No reconstruye base de datos ni CMS.
#   cms  → PostgreSQL + CMS (Strapi).
#   all  → todo, en orden: base de datos y CMS primero (el build del sitio lee el CMS
#          para pre-generar páginas). Es el comportamiento por defecto.
set -euo pipefail
cd "$(dirname "$0")/.."            # carpeta infra/
[ -f .env ] || { echo "Falta infra/.env (copia .env.example y complétalo)"; exit 1; }
set -a; . ./.env; set +a

TARGET="${1:-all}"
case "$TARGET" in
  web|cms|all) ;;
  *) echo "Objetivo no válido: '$TARGET'. Usa: web, cms o all"; exit 1 ;;
esac

PROFILE_ARGS=()
if [ "$TARGET" != "cms" ] && [ "${USE_CADDY:-true}" = "true" ]; then
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

# Espera a que un servicio responda por HTTP; si no lo hace, muestra sus logs y falla.
wait_for() {
  local name="$1" url="$2" service="$3"
  echo "==> Esperando a que ${name} responda"
  for i in $(seq 1 60); do
    if curl -fsS "$url" >/dev/null 2>&1; then return 0; fi
    if [ "$i" = 60 ]; then
      echo "${name} no respondió a tiempo"
      docker compose logs --tail=80 "$service"
      return 1
    fi
    sleep 5
  done
}

echo "==> Actualizando código"
git -C .. pull --ff-only

if [ "$TARGET" = "cms" ] || [ "$TARGET" = "all" ]; then
  echo "==> Base de datos y CMS"
  docker compose "${PROFILE_ARGS[@]}" up -d --build postgres cms
  wait_for "el CMS" "http://127.0.0.1:${CMS_PORT:-1337}/_health" cms
fi

if [ "$TARGET" = "web" ] || [ "$TARGET" = "all" ]; then
  echo "==> Sitio"
  docker compose "${PROFILE_ARGS[@]}" up -d --build web
  if [ "${USE_CADDY:-true}" = "true" ]; then
    docker compose --profile proxy up -d caddy
  fi
  wait_for "el sitio" "http://127.0.0.1:${WEB_PORT:-3000}/robots.txt" web

  echo "==> Refrescando contenido en caché"
  sleep 5
  curl -fsS -X POST "http://127.0.0.1:${WEB_PORT:-3000}/api/revalidate" -H "x-revalidate-secret: ${REVALIDATE_SECRET}" >/dev/null && echo "ok"
fi

docker image prune -f >/dev/null
docker compose ps
