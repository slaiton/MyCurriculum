# Sitio público (Next.js, salida standalone). Se construye desde infra/docker-compose.yml.
FROM node:22-alpine AS deps
WORKDIR /app
# Misma versión de npm que generó package-lock.json
RUN npm install -g npm@11.16.0
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Valores necesarios al construir: URLs canónicas de las páginas estáticas y origen de las imágenes del CMS.
# CMS_URL aquí es la URL PÚBLICA del CMS (el contenedor de build no ve la red interna de Docker).
ARG SITE_URL
ARG CMS_URL
ARG CMS_PUBLIC_URL
ARG NEXT_PUBLIC_GA_ID
ENV SITE_URL=$SITE_URL CMS_URL=$CMS_URL CMS_PUBLIC_URL=$CMS_PUBLIC_URL NEXT_PUBLIC_GA_ID=$NEXT_PUBLIC_GA_ID NEXT_TELEMETRY_DISABLED=1
# El token de lectura solo se usa durante el build para pre-generar páginas; no queda en la imagen final.
RUN --mount=type=secret,id=cms_token,required=false \
    CMS_TOKEN="$(cat /run/secrets/cms_token 2>/dev/null || true)" npm run build

FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s CMD wget -qO- http://127.0.0.1:3000/robots.txt >/dev/null || exit 1
CMD ["node", "server.js"]
