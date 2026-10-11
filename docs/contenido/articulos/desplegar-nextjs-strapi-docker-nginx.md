---
title: Desplegar Next.js y Strapi en tu propio servidor con Docker y Nginx
slug: desplegar-nextjs-strapi-docker-nginx
excerpt: Paso a paso para publicar un sitio Next.js con Strapi y PostgreSQL en un solo servidor: Docker Compose, Nginx, HTTPS, actualizaciones sin despliegue y copias de seguridad.
category: devops
tags: [docker, nextjs, strapi, nginx, postgresql]
featured: true
metaTitle: Next.js + Strapi con Docker y Nginx en tu servidor
metaDescription: Publica Next.js con Strapi y PostgreSQL en un solo servidor: Docker Compose, Nginx, HTTPS, revalidación por webhook y backups.
---

Este blog corre en un solo servidor: el sitio en Next.js, el panel editorial en Strapi y la base de datos en PostgreSQL, cada uno en su contenedor Docker y con Nginx al frente. Publicar un artículo no requiere desplegar nada, y todo el stack cuesta lo mismo que el servidor. Aquí explico cómo está armado, paso a paso, para que puedas replicarlo.

## La arquitectura

- **Next.js** genera las páginas y las guarda en caché. Cuando publico en el CMS, un webhook invalida solo las páginas afectadas.
- **Strapi** es el panel donde escribo: borradores, vista previa, publicación programada y biblioteca de medios.
- **PostgreSQL** guarda el contenido; las imágenes van a un volumen Docker.
- **Nginx** recibe el tráfico HTTPS y lo reparte: `www` hacia Next.js y `cms` hacia Strapi. Los contenedores solo escuchan en `127.0.0.1`.

## Requisitos

- Un servidor Linux con 2 GB de RAM como mínimo (Strapi recomienda 4 GB) y Docker con el plugin `docker compose`.
- Dos registros DNS tipo A apuntando a la IP del servidor: el dominio del sitio y el del CMS.
- Nginx y Certbot instalados (o Caddy, que gestiona los certificados solo).

## Paso 1: el docker-compose

Un solo archivo describe los tres servicios. Lo importante es que cada contenedor publique su puerto **solo en localhost**, para que el único punto de entrada sea Nginx:

```yaml
services:
  postgres:
    image: postgres:17-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${DATABASE_NAME}
      POSTGRES_USER: ${DATABASE_USERNAME}
      POSTGRES_PASSWORD: ${DATABASE_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DATABASE_USERNAME} -d ${DATABASE_NAME}"]
      interval: 10s

  cms:
    build: ../cms
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      DATABASE_CLIENT: postgres
      DATABASE_HOST: postgres
      # ...secretos de Strapi desde .env
    volumes:
      - uploads:/opt/app/public/uploads
    ports:
      - "127.0.0.1:1337:1337"

  web:
    build: ../web
    restart: unless-stopped
    environment:
      CMS_URL: http://cms:1337        # red interna de Docker
      CMS_TOKEN: ${CMS_TOKEN}          # token de solo lectura
    ports:
      - "127.0.0.1:3000:3000"

volumes:
  pgdata:
  uploads:
```

Los secretos viven en un archivo `.env` que **nunca** se sube a git. Cada uno se genera con:

```bash
openssl rand -base64 32
```

## Paso 2: imágenes pequeñas con salida standalone

Next.js puede generar una carpeta `standalone` con solo lo necesario para ejecutar el servidor. Con un Dockerfile de varias etapas, la imagen final no lleva el código fuente ni las dependencias de desarrollo:

```dockerfile
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
USER node
CMD ["node", "server.js"]
```

Para activarlo, en `next.config.ts`:

```ts
const nextConfig = {
  output: 'standalone',
};
export default nextConfig;
```

## Paso 3: Nginx como puerta de entrada

Un archivo por dominio en `/etc/nginx/sites-available/`. El del CMS sube el límite de tamaño para poder cargar videos:

```nginx
server {
    listen 80;
    server_name cms.tudominio.com;
    client_max_body_size 100m;

    location / {
        proxy_pass http://127.0.0.1:1337;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

El del sitio desactiva el buffering, porque Next.js puede enviar las respuestas por partes:

```nginx
server {
    listen 80;
    server_name www.tudominio.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
    }
}
```

## Paso 4: HTTPS con Certbot

```bash
sudo ln -s /etc/nginx/sites-available/cms.tudominio.com /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d www.tudominio.com -d cms.tudominio.com
```

Certbot edita los archivos de Nginx para redirigir a HTTPS y renueva los certificados automáticamente.

## Paso 5: publicar sin desplegar

La parte que más me gusta: el contenido se actualiza solo. En Strapi se configura un webhook que, al publicar, llama a una ruta de Next.js con un secreto compartido:

```ts
// app/api/revalidate/route.ts
import { revalidateTag } from 'next/cache';

export async function POST(request: Request) {
  if (request.headers.get('x-revalidate-secret') !== process.env.REVALIDATE_SECRET) {
    return Response.json({ message: 'No autorizado' }, { status: 401 });
  }
  const { model } = await request.json();
  revalidateTag(model === 'post' ? 'posts' : 'cms', { expire: 0 });
  return Response.json({ revalidated: true });
}
```

Cada consulta al CMS lleva sus etiquetas de caché (`next: { tags: ['posts'] }`), así que solo se regeneran las páginas que dependen de lo que cambió. Como el webhook viaja por la red interna de Docker (`http://web:3000/api/revalidate`), nunca sale a internet.

En producción conviene comparar el secreto en tiempo constante (`crypto.timingSafeEqual`) en lugar de usar `!==`.

## Paso 6: copias de seguridad que se pueden restaurar

Una copia que nunca probaste restaurar no es una copia. Un script diario guarda la base de datos y los archivos subidos:

```bash
STAMP=$(date +%Y%m%d-%H%M%S)
docker compose exec -T postgres pg_dump -U strapi -d strapi --format=custom > backups/db-$STAMP.dump
docker compose run --rm --no-deps -v "$PWD/backups:/backup" --entrypoint sh cms \
  -c "tar czf /backup/uploads-$STAMP.tar.gz -C /opt/app/public uploads"
find backups -type f -mtime +14 -delete
```

Y se programa con cron:

```bash
0 3 * * * cd /var/www/tudominio && bash infra/scripts/backup.sh >> /var/log/backup.log 2>&1
```

Una vez al mes, restaura una copia en un ambiente de prueba. Es la única forma de saber que funciona.

## Lo que aprendí en el camino

- **Construye primero el CMS y después el sitio.** Si las páginas se pre-generan en el build, el CMS tiene que estar respondiendo; si no, el sitio sale con datos de respaldo.
- **La API del CMS no tiene por qué ser pública.** Next.js lee desde el servidor con un token de solo lectura, que nunca llega al navegador.
- **Mantén la misma versión de npm** en tu máquina y en Docker. Un `package-lock.json` generado con otra versión puede hacer fallar `npm ci`.
- **Prueba en un subdominio antes de mover el DNS principal.** Y bloquea la indexación ahí (`robots.txt` con `Disallow: /`) para que Google no indexe el sitio de pruebas.

## Resumen

Con un servidor, Docker Compose y Nginx tienes un blog con panel editorial propio, publicación sin despliegues, HTTPS y copias de seguridad, sin pagar servicios aparte. Si quieres el código completo de este sitio o tienes dudas con tu despliegue, escríbeme.
