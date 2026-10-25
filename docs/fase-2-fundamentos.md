# Fase 2: fundamentos (implementado)

> Fecha: 2026-10-10 · Estado: **listo para revisión. Nada desplegado; sin commits.**
> La app CRA actual (raíz del repo) sigue intacta, salvo el cambio pendiente de WhatsApp (ver §7).

## 1. Qué se construyó

| Carpeta | Contenido |
|---|---|
| `web/` | Sitio nuevo: Next.js 16.4 (App Router, TypeScript), React 19.3. Sin librerías de UI ni de animación. |
| `cms/` | Strapi actualizado de 5.47.1 a **5.57.0**, con 8 tipos de contenido, 4 componentes, publicación programada, redirecciones automáticas, vista previa y contenido inicial. |
| `infra/` | Docker Compose (PostgreSQL 17 + CMS + sitio + Caddy opcional), configuración de Nginx alternativa, scripts de despliegue, backup y restauración, y guía de despliegue. |
| `.github/workflows/deploy-web.yml` | CI + despliegue automático del sitio (`web/`) por SSH al hacer push a `main`. |
| `.github/workflows/deploy-server.yml` | Despliegue manual por SSH del conjunto completo (`deploy.sh` sin argumentos = `all`). |
| `docs/` | Esta fase, la guía de publicación y las fases anteriores. |

## 2. Decisiones técnicas tomadas durante la implementación

| Decisión | Motivo |
|---|---|
| **Renderizador propio del formato Blocks** (`web/src/components/Body.tsx`) en lugar de `@strapi/blocks-react-renderer` | La versión 1.0.2 de ese paquete tiene un `postinstall` roto (`husky install`). El formato es JSON simple, y hacía falta controlar los `id` de los títulos (tabla de contenido) y el bloque de código con botón de copiar. Nunca inserta HTML crudo, lo que elimina el XSS por contenido. |
| **Cuerpo como "dynamic zone"** con *Texto* (Blocks), *Video* e *Imagen* | El editor Blocks no admite video; así el autor puede intercalar videos (archivo o YouTube con carga diferida) y capturas con marco de navegador. |
| **API del CMS privada + token de solo lectura** | Next lee el CMS desde el servidor; el token nunca llega al navegador. Sin permisos públicos en Strapi. |
| **Datos de respaldo** (`web/src/lib/fallback.ts`) | Si el CMS no responde, el sitio muestra el contenido real actual; nunca queda en blanco. |
| **Publicación programada con cron propio** (`cms/config/cron-tasks.ts`) | *Releases* de Strapi es de pago. Cada minuto publica los borradores con `scheduledAt` vencido. |
| **Redirección automática al cambiar el slug** (`cms/src/index.ts`) | Un middleware del Document Service crea la redirección y evita cadenas. Next responde 308 permanente. |
| **Validación al publicar**: la portada exige texto alternativo | Accesibilidad y SEO de imágenes. |
| **Colores por categoría** (6) desde el CMS | Amplía la paleta (heredada de los colores de sección del sitio actual) y da identidad a cada tema. |
| **npm fijado en 11.16.0 dentro de Docker** y `allowScripts` en `cms/package.json` | Los lockfiles se generaron con npm 11, que además bloquea los scripts de instalación por defecto. Solo se aprobaron los necesarios: `@swc/core`, `esbuild` y `better-sqlite3`. |
| **PostgreSQL 17 y Node 22** en Docker | Recomendación vigente de la documentación de Strapi (soporta Node 22/24/26). |

## 3. Rutas

**Públicas**

| Ruta | Render | Indexable |
|---|---|---|
| `/` | Estática + revalidación | Sí |
| `/blog`, `/blog?page=N` | Por petición (con caché de datos) | Sí (canonical propio por página) |
| `/blog/[slug]` | Pre-generada (SSG) + revalidación | Sí, salvo `noIndex` |
| `/blog/categoria/[slug]` | Por petición | Sí |
| `/blog/etiqueta/[slug]` | Por petición | No (`noindex, follow`) |
| `/buscar?q=` | Por petición | No |
| `/proyectos`, `/proyectos/[slug]` | Estática / SSG | Sí |
| `/sobre-mi`, `/contacto` | Estática | Sí |
| `/assets/files/HV.pdf` | Archivo (ruta conservada) | — |
| `/sitemap.xml`, `/robots.txt` | Generados | — |
| 404 | Página propia | — |

**Internas:** `POST /api/revalidate` (header `x-revalidate-secret`) y `GET /api/preview` (parámetro `secret`). Ambas validan el secreto en tiempo constante.
**Administración:** `https://cms.slaiton.com/admin`.

## 4. Modelo de datos (Strapi)

| Tipo | Clase | Borradores | Campos clave |
|---|---|---|---|
| Publicación (`post`) | colección | Sí | title, slug (uid), excerpt, body (dynamic zone), cover, category, tags, featured, scheduledAt, contentUpdatedAt, seo |
| Categoría | colección | No | name (único), slug, description, color (enum de 6), seo |
| Etiqueta | colección | No | name (único), slug |
| Proyecto | colección | Sí | title, slug, summary, body, cover, url, repoUrl, stack (JSON), color, order, seo |
| Experiencia | colección | No | jobTitle, company, startDate, endDate (vacío = actual), description |
| Habilidad | colección | No | name (único), level 0–100 |
| Ajustes del sitio | single | No | name, role, bio, careerStartDate, whatsapp, email, redes, cv, heroVideo, seo |
| Redirección | colección | No | from (único), to |

Componentes: `shared.seo`, `content.rich-text`, `content.video`, `content.image`.

**Migraciones:** Strapi sincroniza el esquema desde los JSON de `cms/src/api/**` al arrancar. La base de producción
empezará vacía, así que no hay riesgo de pérdida. Para revertir se revierten esos archivos. En producción solo se harán cambios **aditivos**,
porque quitar un campo borra sus datos.

## 5. Pruebas ejecutadas (2026-10-10, en local)

| Prueba | Resultado |
|---|---|
| `next build` (tipos + build de producción) | ✅ Sin errores. |
| Rutas con datos de respaldo (16 rutas, 404 y archivos) | ✅ Códigos correctos (200 / 404). |
| Strapi 5.57 arranca con los esquemas y siembra el contenido inicial | ✅ |
| API del CMS sin token / con token de solo lectura | ✅ 403 / 200 |
| Sitio leyendo del CMS real: inicio, blog, artículo, categoría, proyectos, perfil | ✅ 200 con datos del CMS |
| Artículo: ids de títulos, tabla de contenido con subniveles, bloque de código, video, BlogPosting + BreadcrumbList, canonical, Open Graph | ✅ |
| Cambio de slug → redirección creada en el CMS → 308 en el sitio | ✅ `/blog/prueba-flujo` → `/blog/prueba-flujo-editorial` |
| Publicación programada (cron cada minuto) | ✅ Publicó el borrador vencido en el siguiente minuto. |
| `POST /api/revalidate` sin secreto / con secreto | ✅ 401 / 200 (invalida `posts` y `post:<slug>`) |
| `GET /api/preview` con secreto / slug manipulado / tipo desconocido | ✅ 307 + cookie de borrador / 400 / 400 |
| `robots.txt` fuera de producción | ✅ `Disallow: /` (el subdominio de pruebas no se indexa) |
| Móvil 375 px: desbordamiento horizontal en 6 páginas | ✅ Ninguno; el menú móvil aparece. |
| Aparición progresiva: el contenido termina visible | ✅ |
| Build de imágenes Docker `web` y `cms` | ✅ |
| `docker compose config` y sintaxis de los scripts | ✅ |
| Stack completo en Docker (PostgreSQL + CMS + sitio) | ⚠️ **No completado**: Docker Desktop local dejó de responder (error 500 del motor) tras los builds. Se valida en el subdominio de pruebas del servidor. |

**No medido todavía:** Core Web Vitals (LCP, INP, CLS) con datos reales. Se medirán en el subdominio de pruebas
con PageSpeed Insights y, tras el lanzamiento, con los datos de campo de Search Console. No hay pruebas automatizadas
(unitarias o e2e): está pendiente para la Fase 6.

Los datos de prueba (artículos "Prueba local…") existen solo en la base SQLite local (`cms/.tmp/`, ignorada por git).

## 6. Desarrollo local

```bash
# CMS (http://localhost:1337/admin)
cd cms && cp .env.example .env   # completa los secretos
npm install && npm run develop

# Sitio (http://localhost:3100)
cd web && cp .env.example .env.local   # CMS_URL=http://localhost:1337, CMS_TOKEN=<token de solo lectura>
npm install && npm run dev -- -p 3100
```

- Sin CMS, el sitio funciona con los datos de respaldo; con `DEMO_CONTENT=true` muestra artículos de ejemplo.
- En Windows, si Strapi muestra `ERR_SWC_NATIVE_CACHE`, define `SWC_NATIVE_BINDING_CACHE=<ruta>/cms/.swc-cache`.
- Usa **Node 22 LTS** en local. Strapi ya no da soporte oficial a Node 20, aunque arranca.

## 7. Pendiente y riesgos

| Tema | Estado |
|---|---|
| Cambio de WhatsApp en la app CRA y `git rm` de `src/api/api.js` y `src/config.js` en el stage | **Decisión tuya** (ver la guía de git). |
| Datos del servidor (SO, RAM, ¿Nginx existente?) | Requeridos antes de desplegar (ver `infra/README.md`). |
| Tema visual del panel de Strapi (logo y colores) | Fase 4. |
| Video de fondo del inicio | Hay que comprimirlo (el actual pesa 9.7 MB) y subirlo en *Ajustes del sitio → heroVideo*. Sin video, se muestra una ilustración de código. |
| Analítica (GA4) | ⚠️ **Medida temporal:** etiqueta directa de GA4 (`gtag.js`), sin aviso de consentimiento. Solo se carga si existe `NEXT_PUBLIC_GA_ID`; la navegación SPA la mide la medición mejorada. El código de Consent Mode v2 + banner se conserva sin montar para reactivarlo luego. |
| Resaltado de sintaxis en bloques de código | Opcional (Fase 5). |
| Retiro de la app CRA, de `build/` versionado y de `web.yml` | `web.yml` ya está desactivado (solo manual). El retiro definitivo, después del corte y con tu aprobación. |
| Datos de experiencia con fechas solapadas | Contenido; se corrige desde el panel. |

## 8. Ajustes posteriores (2026-10-10)

- **Contenido:** la bio ahora presenta a Stiven como *Ingeniero de Sistemas*. Nueva experiencia *Desarrollador full stack líder* (Aldia Logística, desde mayo de 2026), que suma auditoría de código, DevOps, despliegues automatizados y liderazgo del equipo. *Analista de software* cierra en mayo de 2026. Actualizado en `web/src/lib/fallback.ts` y en `cms/src/seed.ts`.
  - El contenido inicial solo se carga en una base vacía. La base SQLite local ya existía, así que ahí se edita desde el panel. La de producción se creará con el contenido nuevo.
  - **Día exacto del cambio de cargo:** se usó el 1 de mayo; se ajusta desde el panel.
- **Animaciones** (todas desactivadas con `prefers-reduced-motion`):
  - **Al cargar:** el header baja, el hero entra escalonado (el H1 solo se desplaza, para no retrasar el LCP), las cifras cuentan desde 0, el código del hero se escribe línea a línea con cursor y los chips flotan suavemente. Las cabeceras de página y artículo también entran escalonadas.
  - **Al hacer scroll:** las secciones aparecen; tarjetas, temas, filas de experiencia y habilidades entran escalonadas (90 ms entre elementos); las barras de habilidades se llenan; los títulos de sección se subrayan; el header se compacta.
  - **Hover:** las tarjetas se elevan, las imágenes hacen zoom y la flecha de los botones se desplaza.
  - **Robustez:** una sección que queda por encima tras un salto (anclas, tecla Fin, volver atrás) se revela igual; nunca queda contenido oculto.
- **Corrección de zona horaria:** las fechas sin hora (`2026-05-01`) se mostraban un día antes en Colombia ("abr" en lugar de "may"). Ahora se formatean en UTC, y el cálculo de años lee la fecha sin depender de la zona horaria del servidor.
- **Sección Markdown en el cuerpo** (`content.markdown`, campo *richtext* de Strapi): se pega Markdown tal cual. Se renderiza con
  `react-markdown` 10.1 + `remark-gfm` 4.0.1 (tablas). No ejecuta HTML incrustado. Los títulos `##`/`###` entran en la tabla de contenido
  y los bloques de código tienen botón *Copiar*. Motivo: el editor *Texto* (Blocks) guardaba el Markdown pegado como texto literal.
- **Importador** `cms/scripts/importar-articulo.mjs`: sube archivos `.md` con encabezado (front matter) como **borradores**, valida longitudes,
  crea etiquetas y actualiza el borrador si el slug ya existe. Probado en local con los dos artículos de `docs/contenido/articulos/`.
- **Regla de aprobación en el CMS:** la API pública ya no puede publicar ni retirar contenido (antes un token con permiso *create*
  podía publicar con `?status=published`; verificado y corregido). Solo se publica desde el panel o con *scheduledAt*.
- En la vista previa, un borrador muestra "Borrador sin publicar" en lugar de una fecha vacía.
- **Redacción asistida** (`cms/src/editorial/`): nuevas colecciones *Tema propuesto* y *Guía editorial*. Al aprobar un tema, Claude redacta
  el artículo (salida JSON validada por esquema, `@anthropic-ai/sdk` 0.133.0, `claude-opus-5-5` por defecto, con *fallbacks* de servidor
  activados) y se crea como **borrador** con sección Markdown. Incluye propuesta de temas (manual o semanal), tope diario, recuperación
  de temas atascados y bloqueo de publicación mientras haya marcadores `[COMPLETAR]`. Probado en local en modo simulado (`EDITORIAL_FAKE`),
  sin llamadas reales a la API.
- **Corregido:** la tarea de publicación programada fallaba cada minuto con "Invalid key scheduledAt" porque *Proyecto* no tenía el campo
  (las publicaciones sí se programaban). Se agregó `scheduledAt` a *Proyecto*.
- **DeepSeek como proveedor alternativo** (`cms/src/editorial/llm.ts`): modelos `deepseek-v4-pro` (por defecto) y `deepseek-flash`, vía su API
  compatible con OpenAI y modo JSON (`fetch` nativo, sin dependencias nuevas). Reintenta si la respuesta llega vacía (comportamiento
  documentado por DeepSeek) y valida la estructura en el CMS. Se elige en *Guía editorial → model*. Variable `DEEPSEEK_API_KEY`;
  `DEEPSEEK_BASE_URL` es opcional (proxy o pruebas). Probado con 11 casos contra un servidor simulado, sin llamadas reales.
- **Estudio editorial** (`cms/src/plugins/estudio/`): plugin local con una página propia en el panel de Strapi para generar temas con IA,
  aprobar, revisar y publicar en una sola pantalla. Rutas de administración protegidas por sesión. Probado en local: 11 casos de la API
  con sesión de administrador (generar, aprobar, bloqueo por `[COMPLETAR]`, descartar, validaciones, tema propio, ajustes, publicación real
  y 401 sin sesión) y verificación de la página en el navegador (carga sin errores, clic en "Generar temas", acceso desde el menú).
  Guía: `docs/contenido/estudio-editorial.md`.
- **Cambios del CMS al instante** (2026-10-20): el CMS avisa al sitio al publicar o editar (`cms/src/revalidate.ts`), sin depender del
  webhook manual. La red de seguridad bajó de 1 hora a 5 minutos. Causa del retraso anterior: si el webhook no estaba configurado o fallaba,
  el sitio solo se refrescaba cada hora.
- **Descargas en proyectos:** campos `version`, `requirements` y `downloads` (componente *Descarga*: etiqueta, plataforma, URL, tamaño y SHA-256).
  La página del proyecto muestra los instaladores, ayuda para elegir x64/ARM64 y datos estructurados `SoftwareApplication`. Los instaladores
  se sirven desde `/var/www/descargas` vía Nginx (Strapi bloquea ejecutables a propósito). Primer proyecto: ShareTo 0.2.0
  (`docs/contenido/proyectos/shareto.md`).
- **SEO de proyectos con IA** (2026-10-21): campos `targetKeywords` y `seoSuggestion` (privado) en *Proyecto*, `keywords` en el componente SEO
  y ajustes `seoMonthly`/`seoAutoApply`. Sección "SEO de proyectos" en el Estudio editorial: generar, revisar y aplicar título, descripción
  y palabras clave; revisión mensual (día 1, 6:00). Lógica en `cms/src/editorial/seo.ts`. Probado con DeepSeek real en CargoApp y ShareTo.
  Guía: `docs/contenido/seo-proyectos.md`.
- **ShareTo sin versiones en el repo:** `descargas/shareto/` guarda solo la última versión con nombres fijos (`ShareTo-win-x64-instalador.exe`,
  `ShareTo-win-arm64-instalador.exe`); Nginx responde con `Cache-Control: no-cache` para no servir instaladores viejos.

## 9. Despliegue web y GA4 temporal (2026-10-25)

- **Sitio (`web/`) desplegado por GitHub Actions:** `.github/workflows/deploy-web.yml` ejecuta CI (`npm ci`, `npm run typecheck`,
  `npm run build` con `CMS_URL` vacío y datos de respaldo) y, si pasa, `bash infra/scripts/deploy.sh web` por SSH. Se dispara con
  push a `main` que toque `web/**` o los archivos de infra del sitio, y también a mano (`workflow_dispatch`). El build real sigue
  haciéndose en el servidor con Docker (CMS + `NEXT_PUBLIC_GA_ID`).
- **CMS sin cambios:** `.github/workflows/deploy-server.yml` sigue siendo manual y ejecuta `deploy.sh` sin argumentos (`all`).
  `deploy.sh` ahora acepta `web`, `cms` o `all`, y añade espera/smoke test del sitio (`/robots.txt`) antes de revalidar.
- **`web.yml` desactivado:** el workflow antiguo de la CRA queda solo con `workflow_dispatch` y marcado como obsoleto.
- **GA4 temporal sin consentimiento:** medida solicitada mientras se define el aviso legal. `Analytics.tsx` carga la etiqueta
  directa de GA4 (`gtag.js` + `gtag('config', …)`) sin banner. El Consent Mode v2, el banner y las preferencias siguen en
  `web/src/lib/consent.ts`, `CookieConsent.tsx` y `CookieSettingsButton.tsx`, sin montar, para reactivarlos después.
