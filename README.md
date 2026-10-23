# slaiton.com

Sitio personal, blog y portafolio de Stiven Laiton.

| Carpeta | Qué es |
|---|---|
| `web/` | Sitio público (Next.js). |
| `cms/` | Panel de contenido (Strapi), con el **Estudio editorial** (temas, borradores y SEO con IA). |
| `infra/` | Docker Compose, Nginx y scripts de despliegue, backup y restauración. Guía completa: [infra/README.md](infra/README.md). |
| `descargas/` | Instaladores de las apps (solo la última versión). Se publican en `https://cms.slaiton.com/descargas/...`. |
| `docs/` | Documentación del proyecto y guías de contenido. |
| `src/`, `public/`, `build/` | Sitio anterior (Create React App). Se retirará después del corte a producción. |

## Despliegue después de hacer commit a `main`

**Un push a `main` no despliega el sitio nuevo por sí solo.** El despliegue se lanza a mano, de una de estas dos formas:

**Opción A: desde el servidor**

```bash
ssh root@TU_SERVIDOR
cd /var/www/slaiton.com && bash infra/scripts/deploy.sh
```

**Opción B: desde GitHub**

*Actions → **Deploy servidor** → Run workflow*. Hace lo mismo por SSH. Necesita los secrets descritos en
`.github/workflows/deploy-server.yml` (`SERVER_APP_DIR` debe ser `/var/www/slaiton.com`).

### Qué hace `deploy.sh`

1. `git pull` del código de `main`.
2. Reconstruye y reinicia **PostgreSQL y el CMS**, y espera a que el CMS responda. La compilación del panel de Strapi tarda unos minutos
   y durante el reinicio el panel no está disponible un momento.
3. Reconstruye y reinicia el **sitio** (lee el CMS para generar las páginas).
4. Refresca la caché del sitio y borra imágenes Docker viejas.
5. Muestra el estado de los contenedores. Los tres (`postgres`, `cms`, `web`) deben estar *running*.

### Según lo que cambiaste

| Cambio | Qué hacer |
|---|---|
| Contenido (artículos, proyectos, perfil, SEO) desde el panel | **Nada.** Se publica al instante. |
| Código de `web/` o `cms/`, campos nuevos del CMS, dependencias | `deploy.sh` (opción A o B). |
| Solo instaladores en `descargas/` | `cd /var/www/slaiton.com && git pull` basta: Nginx los sirve directamente, sin reconstruir. |
| Variables en `infra/.env` (en el servidor, no van en git) | `deploy.sh`. |
| Archivos de `infra/nginx/` | No se aplican solos: copia el cambio a `/etc/nginx/sites-available/` a mano (sin pisar lo que agregó certbot) y luego `nginx -t && systemctl reload nginx`. |

### Comprobar que quedó bien

```bash
cd /var/www/slaiton.com/infra && docker compose ps
```
```bash
curl -sI https://cms.slaiton.com/_health | head -1
```

Si algo falla, revisa los logs con `docker compose logs --tail=100 cms` o `docker compose logs --tail=100 web`.

### Avisos

- **Campos del CMS:** Strapi aplica los cambios de esquema al arrancar. Agregar campos es seguro; **quitar o renombrar uno borra sus datos**.
  Haz un backup antes: `bash infra/scripts/backup.sh`.
- **Otros procesos del push:** un push a `main` también dispara el flujo antiguo (`web.yml`, que copia `build/` del sitio anterior) y el
  build de Vercel. No afectan al sitio nuevo y se retiran en el corte a producción.
- **Instaladores:** cada reemplazo en `descargas/` agrega su peso al historial de git (GitHub rechaza archivos de más de 100 MB).

## Desarrollo local

```bash
npm --prefix cms run develop       # CMS en http://localhost:1337/admin
npm --prefix web run dev -- -p 3100   # sitio en http://localhost:3100
```

Configuración en `cms/.env` y `web/.env.local` (ver los `.env.example`). Detalle en [docs/fase-2-fundamentos.md](docs/fase-2-fundamentos.md).
