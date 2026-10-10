# CMS (Strapi 5). Se construye desde infra/docker-compose.yml.
# Debian slim (glibc): los binarios nativos (sharp, better-sqlite3, swc) traen precompilados.
FROM node:22-bookworm-slim AS build
WORKDIR /opt/app
# Misma versión de npm que generó package-lock.json; respeta "allowScripts" del package.json.
RUN npm install -g npm@11.16.0
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV NODE_ENV=production
RUN npm run build && npm prune --omit=dev

FROM node:22-bookworm-slim AS run
WORKDIR /opt/app
ENV NODE_ENV=production
COPY --from=build --chown=node:node /opt/app ./
RUN mkdir -p public/uploads && chown -R node:node public/uploads
USER node
EXPOSE 1337
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s CMD node -e "fetch('http://127.0.0.1:1337/_health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["npm", "run", "start"]
