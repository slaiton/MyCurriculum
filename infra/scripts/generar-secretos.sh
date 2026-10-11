#!/usr/bin/env bash
# Completa en infra/.env los secretos que estén vacíos o con valores de ejemplo, con valores aleatorios.
# No toca los que ya tienen un valor real, ni CMS_TOKEN (se crea en el panel de Strapi), ni las API keys.
# Uso (desde la raíz del repo): bash infra/scripts/generar-secretos.sh
set -euo pipefail
cd "$(dirname "$0")/.."
[ -f .env ] || cp .env.example .env

rand() { openssl rand -hex 32; }

set_if_missing() {
  local key="$1" value="$2" current
  current="$(grep -E "^${key}=" .env | tail -1 | cut -d= -f2- | tr -d '\r"' || true)"
  if [ -z "$current" ] || printf '%s' "$current" | grep -qiE 'tobemodified|clave[0-9]|change-me'; then
    if grep -qE "^${key}=" .env; then
      awk -v k="$key" -v v="$value" 'BEGIN{FS=OFS="="} $1==k {print k"="v; next} {print}' .env > .env.tmp && mv .env.tmp .env
    else
      printf '%s=%s\n' "$key" "$value" >> .env
    fi
    echo "  generado: $key"
  else
    echo "  ya tenía valor: $key"
  fi
}

echo "Secretos en infra/.env:"
set_if_missing DATABASE_PASSWORD "$(rand)"
set_if_missing APP_KEYS "$(rand),$(rand),$(rand),$(rand)"
for key in API_TOKEN_SALT ADMIN_JWT_SECRET TRANSFER_TOKEN_SALT JWT_SECRET ENCRYPTION_KEY REVALIDATE_SECRET PREVIEW_SECRET; do
  set_if_missing "$key" "$(rand)"
done
chmod 600 .env 2>/dev/null || true
echo "Listo. Guarda una copia de infra/.env en tu gestor de contraseñas: sin él no se puede recuperar la base de datos ni el panel."
