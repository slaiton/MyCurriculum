# Fase 1 — Propuesta UX/UI y técnica

> Fecha: 2026-10-10 · Estado: **pendiente de aprobación**. No se ha implementado nada de esta fase.
> Mockups: canvas privado "slaiton.com — Mockups Fase 1" (inicio, blog, artículo, panel, editor).

## 1. Decisiones del propietario (2026-10-10)

| # | Decisión |
|---|---|
| 1 | Todo (sitio + Strapi) se aloja en **servidor propio**. Vercel queda fuera. |
| 2 | Medios: opción casi gratuita y mantenible. |
| 3 | Sin logo por ahora; se conserva lo existente (firma "Stiven Laiton" en Caveat, turquesa). La identidad de marca se define después. |
| 4 | Nombre público: **Stiven Laiton, desarrollador de software**. |
| 5 | Años de experiencia: 8 hoy y **calculados automáticamente**. |
| 6 | **Sí** se requiere publicación programada. |
| 7 | Solo **español**. |
| 8 | SEO basado en las **entradas del blog**; se descarta el plan anterior de páginas de servicios. |
| 9 | Los **proyectos** pasan al CMS. |
| 10 | Vercel se omite. |

## 2. Arquitectura propuesta (ajustada a servidor propio)

```
                    Internet
                       │  HTTPS (Let's Encrypt)
                ┌──────▼───────┐
                │   Nginx      │  www.slaiton.com  → web:3000
                │ (proxy)      │  cms.slaiton.com  → cms:1337
                └──┬────────┬──┘
          ┌────────▼──┐  ┌──▼──────────┐
          │ web       │  │ cms         │──── uploads/ (disco, volumen)
          │ Next.js 16│◀─│ Strapi 5    │
          │ next start│  │ + cron      │
          └───────────┘  └──┬──────────┘
            caché ISR        │
            en disco    ┌────▼──────┐
                        │PostgreSQL │ (volumen)
                        └───────────┘
```

- **Orquestación:** Docker Compose en el servidor (4 servicios: nginx, web, cms, postgres). Alternativa sin Docker: PM2 + Postgres del sistema; se decide según lo que ya tenga el servidor.
- **Next.js con `next start`** (no exportación estática): la documentación oficial de self-hosting confirma que ISR, revalidación bajo demanda, *draft mode* y optimización de imágenes funcionan con un solo servidor y disco persistente. Recomienda un proxy inverso delante (Nginx).
- **Medios (decisión 2):** proveedor de subida por defecto de Strapi (disco local del servidor, en un volumen), con `next/image` optimizando en el propio servidor y copia de seguridad diaria junto con la base de datos. Costo: $0 adicional. Alternativa si el disco es pequeño: plan gratuito de Cloudinary (proveedor oficial de Strapi).
- **Base de datos:** PostgreSQL en contenedor (gratuito y robusto). SQLite solo en local.
- **Copias de seguridad:** `pg_dump` + carpeta `uploads/` cada día, con rotación. El destino externo (otro disco, almacenamiento de objetos) está por definir.
- **Publicación programada (decisión 6):** *Releases* de Strapi es de pago, así que se implementa un campo `scheduledAt` más una tarea cron de Strapi (`config/cron-tasks.ts` con `server.cron.enabled`) que cada minuto publica los borradores vencidos usando `strapi.documents(uid).publish({ documentId })`. Ambas APIs están confirmadas en la documentación oficial de Strapi 5.
- **Actualización sin despliegue:** webhook de Strapi al publicar o retirar → `POST /api/revalidate` (con secreto) → `revalidateTag` de las páginas afectadas.
- **Años de experiencia (decisión 5):** `careerStartDate = 2018-02-18` (primer cargo registrado) en el CMS; se calcula al renderizar y las páginas de perfil se revalidan cada 24 h.
- **Despliegue:** GitHub Actions al hacer push a `main` → SSH al servidor → `git pull` + `docker compose up -d --build`. Reemplaza el workflow actual de `scp`. **Nada se despliega sin aprobación.**

### Estructura del repositorio propuesta

```
/web     ← nuevo frontend Next.js
/cms     ← Strapi existente (se completa)
/infra   ← docker-compose.yml, nginx.conf, scripts de backup (sin secretos)
/docs    ← documentación por fase
/ (raíz) ← la app CRA actual se conserva intacta hasta el corte final
```

La app actual **no se toca** hasta el lanzamiento; se retira en una fase posterior y solo con aprobación.

### Corte de DNS

Hoy `slaiton.com` apunta a Vercel. Plan: publicar primero en un subdominio de prueba (p. ej. `nuevo.slaiton.com`) → validar → cambiar los registros DNS de `slaiton.com`/`www` al servidor → mantener Vercel unos días como respaldo → dar de baja Vercel.

## 3. Mapa del sitio

**Público**
```
/                               Inicio
/blog                           Listado (paginado: /blog?page=2)
/blog/categoria/[slug]          Categoría (indexable, con texto introductorio)
/blog/etiqueta/[slug]           Etiqueta (noindex, follow)
/blog/[slug]                    Artículo
/buscar?q=                      Búsqueda (noindex)
/proyectos                      Proyectos (desde CMS)
/proyectos/[slug]               Caso de estudio
/sobre-mi                       Perfil + experiencia + habilidades + CV
/contacto                       WhatsApp + correo
/assets/files/HV.pdf            CV (ruta conservada)
/sitemap.xml  /robots.txt  404
```
**Interno:** `/api/preview`, `/api/revalidate` (protegidos por secreto).
**Administración:** `https://cms.slaiton.com/admin`.

## 4. Flujos principales

1. **Lector desde Google:** artículo → tabla de contenido → relacionados / categoría → perfil o contacto.
2. **Visitante en la portada:** hero → "Leer el blog" o destacados → artículo; o "Ver proyectos" → caso → WhatsApp.
3. **Publicar:** Panel → Nueva publicación → título (el slug se genera solo) → extracto → contenido → categoría → imagen + texto alternativo → Guardar borrador → Vista previa → Publicar o Programar → el sitio se actualiza en segundos.
4. **Corregir un artículo publicado:** editar → guardar (el público sigue viendo la versión publicada) → vista previa → publicar cambios.
5. **Cambiar un slug:** se crea una redirección 301 automática.

## 5. Sistema visual

| Token | Valor | Uso |
|---|---|---|
| Marino | `#0B1F3A` | Texto principal, bandas oscuras, botones secundarios |
| Marino profundo | `#071629` | Pie de página |
| Turquesa texto | `#0E7C86` | Enlaces y botón primario sobre claro (contraste AA) |
| Turquesa brillante | `#2DD4BF` | Acentos sobre marino, foco visible |
| Blanco cálido | `#FAF8F4` | Fondo general |
| Texto secundario | `#3B475A` / `#5B6576` | Cuerpo y metadatos |
| Línea | `#E4DFD5` | Separadores |

- **Tipografía:** Sora (títulos), Figtree (interfaz y lectura), Fira Code (código; ya se usaba), Caveat (firma; se conserva). Las fuentes se sirven localmente con `next/font` (sin peticiones a Google en producción).
- **Composición:** hero abierto sobre claro, banda marina con destacados asimétricos (1 grande + 3 en lista), temas como lista tipográfica, recientes como lista editorial, banda de perfil con foto real, tarjetas solo para proyectos, CTA en marino.
- **Movimiento:** aparición suave al entrar en pantalla, header compacto al hacer scroll, barra de progreso en artículos. Se eliminan la navegación por rueda, el cursor seguidor y el fondo de partículas a pantalla completa. Todo respeta `prefers-reduced-motion`.
- **Componentes base:** Header, Footer, Breadcrumbs, Button/Link, PostCard (3 variantes: destacada, lista y grilla), CategoryList, Pagination, SearchBox, EmptyState, ProseRenderer (Blocks → HTML semántico), CodeBlock (con botón copiar), TableOfContents, ReadingProgress, ShareLinks, ProjectCard, ContactCTA.

## 6. Modelo de contenido (actualizado)

Se mantiene el de la Fase 0, §6.4, con estos cambios:
- `Post` añade `scheduledAt` (datetime, opcional).
- `site-settings` incluye `careerStartDate`, `whatsapp`, `email`, redes, CV y SEO por defecto.
- `Project`: `title`, `slug` (uid), `summary`, `content` (Blocks), `cover` + alt, `url` de la app, `repoUrl` opcional, `stack` (tags), `order`, `seo`.

## 7. SEO basado en las entradas

- Una entrada = una intención de búsqueda; título SEO ≤ 60 caracteres y descripción ≤ 160, con contadores en el editor.
- Las categorías son los "pilares": cada una con texto introductorio y enlaces a sus artículos. Las etiquetas no se indexan.
- Enlazado interno: relacionados por categoría y etiquetas, breadcrumbs y enlaces en el cuerpo.
- JSON‑LD: `BlogPosting` en artículos, `BreadcrumbList`, `Person` en `/sobre-mi`, `WebSite` en inicio.
- `sitemap.xml` dinámico (solo contenido publicado e indexable), canonical en `https://www.slaiton.com`, 404 real para contenido retirado y 301 automáticas por cambio de slug.
- Search Console: guía para verificar el dominio por DNS y enviar el sitemap (sin asumir que la cuenta existe).

## 8. Fases siguientes (sin iniciar)

| Fase | Entregable | Requiere |
|---|---|---|
| 2 Fundamentos | `/web` con Next.js, tokens, layout, componentes base, `/infra` local con Docker Compose | Aprobación de esta propuesta + datos del servidor |
| 3 Público | Blog, categorías, artículo, proyectos, perfil, estados vacíos y 404 | Fase 2 |
| 4 Administración | Content types de Strapi, roles, preview, webhook, cron de programación, redirecciones, tema del panel | Fase 2 |
| 5 SEO y rendimiento | Metadatos, JSON‑LD, sitemap, accesibilidad, imágenes, fuentes | Fases 3–4 |
| 6 Validación y despliegue | Pruebas, revisión responsive, despliegue en subdominio de prueba, corte de DNS | Autorización explícita |
