# Despliegue en servidor propio

Sitio (Next.js) + CMS (Strapi 5) + PostgreSQL 17 en Docker, en un solo servidor.
Nada de esto toca el sitio actual de Vercel hasta el **corte de DNS** (paso 5).

```
Internet ──HTTPS──▶ Caddy (o Nginx del servidor)
                      ├─ www.slaiton.com  → web:3000   (Next.js)
                      └─ cms.slaiton.com  → cms:1337   (Strapi) ── PostgreSQL
                                                         └─ uploads/ (volumen)
```

## Requisitos del servidor

| | Mínimo | Recomendado (documentación oficial de Strapi) |
|---|---|---|
| CPU | 1 núcleo | 2+ |
| RAM | 2 GB (+2 GB de swap) | 4 GB+ |
| Disco | 8 GB | 32 GB+ |

- Linux con **Docker Engine** y el plugin **docker compose** (v2.23 o superior).
- Puertos 80 y 443 abiertos.
- Si el servidor ya tiene Nginx sirviendo otras apps en 80/443, usa la variante Nginx (paso 2.4).

## 1. DNS (antes del primer despliegue)

En tu proveedor de DNS crea registros **A** hacia la IP del servidor:

| Registro | Uso |
|---|---|
| `cms.slaiton.com` | Panel editorial |
| `nuevo.slaiton.com` | Sitio nuevo en pruebas (temporal) |

**No cambies** todavía `slaiton.com` ni `www.slaiton.com`: siguen en Vercel hasta el corte.

## 2. Primer despliegue (en pruebas)

```bash
# 2.1 Clonar el repositorio (si es privado, agrega antes una "deploy key" de solo lectura del servidor en GitHub)
sudo mkdir -p /opt/slaiton && sudo chown "$USER" /opt/slaiton
git clone git@github.com:slaiton/MyCurriculum.git /opt/slaiton
cd /opt/slaiton

# 2.2 Variables de entorno
cp infra/.env.example infra/.env
nano infra/.env
```

En `infra/.env`:

- Genera **cada** secreto con `openssl rand -base64 32` (para `APP_KEYS`, cuatro valores separados por comas).
- Mientras pruebas: `SITE_URL=https://nuevo.slaiton.com` y `SITE_DOMAIN=nuevo.slaiton.com`.
- Deja `CMS_TOKEN` vacío por ahora.

2.3 **Con Caddy (recomendado si 80/443 están libres).** Durante las pruebas comenta el bloque
`slaiton.com { ... }` de `infra/caddy/Caddyfile` (ese dominio aún apunta a Vercel).

2.4 **Con el Nginx que ya tenga el servidor.** Añade `USE_CADDY=false` a `infra/.env` y usa un archivo por dominio
de `infra/nginx/` (`cms.slaiton.com.conf`, `slaiton.com.conf` en modo transición y, opcional, `nuevo.slaiton.com.conf`).
Después obtén los certificados con `sudo certbot --nginx -d cms.slaiton.com -d slaiton.com`.

```bash
# 2.5 Desplegar
bash infra/scripts/deploy.sh
```

El primer arranque del CMS crea las tablas y carga el contenido actual (perfil, experiencia, habilidades,
categorías y proyectos).

## 3. Configurar el CMS (una sola vez)

1. Abre `https://cms.slaiton.com/admin` y **crea tu cuenta de administrador**. Es la única cuenta; no hay registro público.
2. **Token de lectura:** *Settings → API Tokens → Create new API Token*. Nombre `web`, tipo **Read-only**,
   duración **Unlimited**. Copia el valor en `CMS_TOKEN` de `infra/.env`.
3. **Webhook de actualización:** *Settings → Webhooks → Create new webhook*.
   - URL: `http://web:3000/api/revalidate` (red interna de Docker).
   - Header: `x-revalidate-secret` con el valor de `REVALIDATE_SECRET`.
   - Eventos: *Entry* → create, update, delete, publish, unpublish.
4. Vuelve a desplegar para que el sitio use el token: `bash infra/scripts/deploy.sh`.
5. Prueba: publica algo en el panel y recarga `https://nuevo.slaiton.com`. Debe verse en segundos.

## 4. Copias de seguridad

```bash
crontab -e
# Todos los días a las 3:00
0 3 * * * cd /opt/slaiton && bash infra/scripts/backup.sh >> /var/log/slaiton-backup.log 2>&1
```

Las copias quedan en `infra/backups/` (14 días). Se recomienda copiarlas fuera del servidor
(ver la línea de `rclone` en `backup.sh`). Restaurar: `bash infra/scripts/restore.sh backups/db-....dump backups/uploads-....tar.gz`.

## 5. Corte a producción (cuando apruebes el sitio en pruebas)

1. En `infra/.env`: `SITE_URL=https://www.slaiton.com`, `SITE_DOMAIN=www.slaiton.com`.
2. Descomenta el bloque `slaiton.com` del Caddyfile (o ajusta Nginx y ejecuta certbot para `slaiton.com` y `www.slaiton.com`).
3. En el DNS, apunta `slaiton.com` y `www.slaiton.com` a la IP del servidor (registros A; elimina los de Vercel).
4. `bash infra/scripts/deploy.sh`
5. Verifica `https://www.slaiton.com/robots.txt`: debe permitir la indexación. En pruebas lo bloquea a propósito.
6. Google Search Console: verifica el dominio (registro TXT en el DNS) y envía `https://www.slaiton.com/sitemap.xml`.
7. Deja Vercel unos días como respaldo y luego elimina el proyecto. Retira también `.github/workflows/web.yml`.

## Despliegues siguientes

- Desde el servidor: `cd /opt/slaiton && bash infra/scripts/deploy.sh`.
- O desde GitHub: *Actions → Deploy servidor → Run workflow*. Requiere los secrets descritos en
  `.github/workflows/deploy-server.yml`.

**El contenido no requiere despliegue:** se publica desde el panel.

## Comandos útiles

```bash
cd /opt/slaiton/infra
docker compose ps                 # estado
docker compose logs -f web        # logs del sitio
docker compose logs -f cms        # logs del CMS (incluye publicaciones programadas)
docker compose restart cms
```
