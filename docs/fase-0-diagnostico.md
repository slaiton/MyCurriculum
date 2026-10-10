# Fase 0 — Diagnóstico de slaiton.com

> Fecha: 2026-10-10 · Alcance: solo inspección y comprobaciones seguras. No se modificaron servicios productivos.
> Todo lo marcado como **[verificado]** se comprobó en código, comandos o en el sitio en vivo. Lo marcado como **[por confirmar]** requiere información del propietario.

---

## 1. Arquitectura actual

| Aspecto | Estado | Evidencia |
|---|---|---|
| Frontend | SPA con Create React App (`react-scripts` 5.0.1), React 18.3.1, JavaScript (sin TS) | `package.json` **[verificado]** |
| Rutas | No hay router. Una sola URL (`/`); las "secciones" se intercambian con estado React (`currentSection`) y solo una existe en el DOM a la vez | `src/App.js` **[verificado]** |
| Navegación | Rueda del mouse (`wheel`) + menú inferior. Sin soporte táctil por gesto | `src/hooks/useScrollDetection.js`, `src/components/Header/Header.js` **[verificado]** |
| Estilos | CSS plano por componente, sin tokens/variables; 3 definiciones de `body` en conflicto | `src/App.css`, `src/styles/global.css`, `src/index.css` **[verificado]** |
| Animación | framer-motion 11 + @react-spring/web 9 (dos librerías para lo mismo) | `package.json` **[verificado]** |
| Contenido | Hardcodeado en componentes, con intento de lectura desde Strapi en el navegador (`useStrapi`) | `src/hooks/useStrapi.js` **[verificado]** |
| CMS | Strapi 5.47.1 scaffold en `cms/`, SQLite local. **Sin ningún content type** (`cms/src/api/` vacío). `cms.slaiton.com` no resuelve | `cms/`, prueba HTTP **[verificado]** |
| Autenticación | No existe en el frontend. Strapi trae su admin con auth propia | **[verificado]** |
| Persistencia | Ninguna propia; solo SQLite local del CMS (`cms/.tmp/data.db`, sin esquemas de contenido) | **[verificado]** |
| Contacto | Antes: POST a `https://api.tuproyecto.com/api/mail` (placeholder, no existe). Ahora (cambio pendiente de aprobación): redirección a WhatsApp | ver §7 **[verificado]** |
| Analítica | GA4 vía `react-ga4` (`G-M37SMVCR2B`) | `src/utils/analytics.js` **[verificado]** |
| Despliegue real | **Vercel**, auto‑deploy al hacer push a `main` (respuesta `Server: Vercel`, apex → `www` con 308) | headers HTTP + confirmación del propietario **[verificado]** |
| Despliegue legado | `.github/workflows/web.yml` copia `build/` por `scp` a un servidor propio. `build/` está versionado en git | **[verificado]** — no es lo que sirve el sitio |
| Node local | v20.20.0 / npm 11.16.0 | **[verificado]** |

## 2. Línea base de calidad

| Comprobación | Resultado |
|---|---|
| `react-scripts build` | Compila sin warnings. JS principal **355 kB gzip**, CSS 5.4 kB |
| `react-scripts test` | **Falla**: falta `@testing-library/jest-dom`; el único test es el de plantilla CRA ("learn react") |
| Sitio en vivo (medición de laboratorio, 1 muestra, navegador local) | TTFB ≈ 0.8 s, DOMContentLoaded ≈ 2.2 s, CLS 0, ~570 kB transferidos. **No es dato de campo**; PageSpeed API devolvió cuota excedida y no hay datos CrUX conocidos |
| Producción vs repo | El sitio en vivo sirve `main.d43982c8.js` y título "Portfolio de Desarrollo"; el build de `HEAD` genera `main.97ae8623.js` con título vía Helmet. **Producción no corresponde a HEAD** **[por confirmar en el panel de Vercel]** |
| Peticiones fallidas en producción | `cms.slaiton.com/api/apps` (DNS no resuelve) en cada visita |
| Indexación | Búsqueda `site:slaiton.com` sin resultados. Indicio de que el sitio prácticamente no está indexado **[por confirmar en Search Console]** |

## 3. Qué funciona y conviene conservar

- Dominio, Vercel y redirección apex → `www`.
- Contenido profesional real: bio, experiencia, skills, apps en producción (Tienda 3D, ScrapTools, CargoApp), enlaces a LinkedIn/GitHub, CV en `/assets/files/HV.pdf`.
- `ParticleCanvas` del Home: bien implementado (pausa en pestaña oculta, respeta `prefers-reduced-motion`); puede reutilizarse como acento, no como fondo global.
- `AppCard` del Home: accesible por teclado (`role="link"`, Enter/Espacio).
- Validación del formulario de contacto.
- GA4.

## 4. Bugs y deuda identificados

**Críticos**
1. Contenido invisible para buscadores: una sola URL y secciones montadas por estado.
2. Scroll interno bloqueado en Proyectos y Contacto: cualquier `wheel` cambia de sección.
3. Sin navegación por gesto en móvil.
4. CMS sin modelo de contenido y sin hosting; el token `REACT_APP_STRAPI_TOKEN` quedaría expuesto en el bundle si se usara.
5. Producción desalineada con `main` (ver §2).

**Funcionales**
- Hash de URL inconsistente; botón "atrás" no funciona; no se lee el hash al cargar.
- `exit` de framer-motion nunca corre (falta `AnimatePresence`).
- Cursor seguidor re-renderiza toda la App en cada `mousemove`; también se pinta en táctil.
- `Header` re-renderiza cada segundo por un `setInterval` de un ícono que nunca se muestra.
- `strapiData || FALLBACK` en Experience/Skills: un `[]` deja la sección vacía.
- Proyectos: API GitHub sin `per_page` (máx. 30), banner solo de rama `main`, sin fallback, falta `id`.
- Íconos sociales de Contacto sin estilos (las reglas viven solo bajo `.home-footer`).

**SEO/contenido**
- `index.html`: dos `<title>`, dos `description` (una de plantilla CRA), `charset` no es lo primero, `lang="en"` en sitio en español, sin `canonical`, `og:url` apunta al apex que redirige.
- Nombre inconsistente (Stiven / Jhoan / Jhoan Stiven Laiton); "+6 años" vs experiencia desde 2018; fechas solapadas; mezcla ES/EN ("My Skills", "Prev/Next").
- `manifest.json` con valores de plantilla.
- Íconos y menú son `<span onClick>` (no accesibles por teclado, no rastreables).

**Deuda técnica**
- CRA está deprecado y sin mantenimiento.
- Dependencias sin uso: `aos`, `cra-template`, `typescript`, `@fortawesome/fontawesome-free`. `react-helmet` abandonado.
- `library.add(fab)` importa todos los íconos de marcas (solo se usan 3).
- Código muerto: `Header_old.js`, `Footer.js`, `helpers.js` (vacío), `useScroll.js`; estilos de plantilla CRA en `App.css`.
- Assets pesados sin referencia: `public/assets/video/code.mp4` (9.7 MB), `giphy.mp4` (12 MB), `src/assets/images/fondo1.jpeg` (6.6 MB); fuentes StarJedi sin uso.
- `build/` versionado; workflow `scp` obsoleto (`actions/*@v2`, `StrictHostKeyChecking=no`).

## 5. Inventario de URLs existentes

| URL | Estado | Acción propuesta |
|---|---|---|
| `https://www.slaiton.com/` | 200 | Conservar (nueva portada) |
| `https://slaiton.com/*` | 308 → www | Conservar (lo maneja Vercel) |
| `/#home`, `/#aboutMe`, … | Fragmentos, no son URLs indexables | Sin redirección necesaria (los fragmentos no llegan al servidor) |
| `/assets/files/HV.pdf` | 200 | Conservar ruta exacta |
| `/manifest.json`, `/robots.txt`, íconos | 200 | Conservar/actualizar |
| Subdominios `market.`, `scraptool.`, `cargo.` | Apps independientes | Fuera de alcance |

**Conclusión:** el riesgo de migración de URLs es mínimo; no existen páginas internas indexadas que redirigir.

---

## 6. Propuesta técnica

### 6.1 Frontend público — recomendación: Next.js (App Router) en Vercel

Justificación basada en lo encontrado:
- El SEO pedido (URLs estables, metadatos por página, sitemap, JSON‑LD, artículos rastreables) exige HTML renderizado por URL. CRA solo produce una SPA cliente.
- CRA está deprecado; hay que migrar de herramienta de todas formas.
- El despliegue ya es Vercel, que soporta Next.js de forma nativa (ISR, revalidación bajo demanda, optimización de imágenes).
- La vista previa de borradores de Strapi tiene integración documentada con el *draft mode* de Next.js (documentación oficial de Strapi, sección Preview).
- Se reutiliza React y gran parte de los componentes actuales.

Versión vigente verificada en npm: `next@16.4.0` (requiere Node ≥ 20.9, compatible con el Node 20.20 local).

**Alternativa evaluada:** Astro 7.3.8. Envía menos JavaScript y es muy bueno para blogs, pero la vista previa de borradores y la revalidación bajo demanda requieren más trabajo propio. Es viable si se prioriza el peso mínimo sobre la integración de preview.

**Descartado:** mantener CRA y prerenderizar (herramientas como `react-snap` están abandonadas) o crear un backend Laravel nuevo (añade un stack que hoy no existe).

### 6.2 Módulo editorial — recomendación: Strapi 5 (ya presente en el repo)

"Propio" en el sentido de **autohospedado, con datos y panel bajo tu control**, sin construir un admin desde cero. Cubre los requisitos así:

| Requisito | Cobertura en Strapi 5 |
|---|---|
| Auth/autorización del admin, sin registro público | Admin con usuarios y roles; API pública solo lectura (`find`/`findOne`) |
| Borradores, publicar y retirar | *Draft & Publish* (función gratuita según la documentación oficial) |
| Previsualizar | *Preview* básico (gratuito) + *draft mode* de Next.js. El *Live Preview* lado a lado es de pago |
| Slug único | Campo tipo `uid` (único, generado desde el título) |
| Editor estructurado (títulos, listas, enlaces, imágenes, citas, código) | Campo *Blocks* (JSON estructurado; se renderiza sin HTML crudo → menor superficie XSS) |
| Medios, texto alternativo, límites de tamaño/tipo | Media Library con `alternativeText`; límites configurables en el plugin de upload |
| SEO por publicación | Componente reutilizable `seo` |
| Identidad visual del panel | Personalización de logo y tema en `cms/src/admin/app.tsx` |
| Programar publicación | *Releases* es de pago → alternativa: publicar manualmente o tarea cron propia (decisión pendiente) |
| Advertir cambios sin guardar | **[a verificar en Fase 2 sobre la versión instalada]** |

Versión vigente verificada: `@strapi/strapi@5.57.0` (instalada: 5.47.1). Producción con **PostgreSQL**; SQLite solo local.

**Alternativa evaluada:** admin propio dentro de Next.js (Auth + editor TipTap + DB + subida de archivos). Da control total del diseño, pero implica construir y mantener auth, sanitización, medios, borradores y preview. Es mucho más código y más superficie de seguridad para un solo autor.

### 6.3 Flujo editorial propuesto

```
Escribes en cms.slaiton.com/admin ──guardar──▶ Borrador
        │ Preview ─▶ www.slaiton.com/api/preview?secret… (draft mode) ─▶ ves el borrador real
        │ Publicar
        ▼
Strapi webhook ─▶ www.slaiton.com/api/revalidate (secreto) ─▶ Next regenera solo las páginas afectadas
```
Si Strapi cae, el sitio sigue sirviendo la última versión generada.

### 6.4 Modelo de contenido (borrador)

- **Post**: `title`*, `slug` (uid, único)*, `excerpt`* (≤160), `content` (Blocks)*, `cover` (media, opcional), `category` (N:1)*, `tags` (N:M), `featured` (bool), `contentUpdatedAt` (fecha visible de actualización), `seo` (componente). El estado, `publishedAt`, `createdAt` y `updatedAt` son nativos. El tiempo de lectura se calcula en el frontend. El autor es único y sale de `site-settings` (sin entidad Autor).
- **Category**: `name`*, `slug`* (uid), `description`, `seo`. Indexable.
- **Tag**: `name`*, `slug`*. Páginas de etiqueta con `noindex` (para evitar páginas delgadas).
- **Redirect**: `from`* (único), `to`*, `permanent` (bool). Un *lifecycle hook* crea una redirección automáticamente cuando cambia el slug de un post publicado.
- **Site settings** (single type, reemplaza a `contact-info`): nombre, cargo, WhatsApp, email, redes, CV (media), SEO por defecto, imagen OG por defecto.
- **Contenido profesional existente** (para no perder nada): `about` (single), `experience`, `skill`, `app`, `project` (casos curados, en vez de leer GitHub en crudo).
- **Componente `seo`**: `metaTitle`, `metaDescription`, `canonicalUrl`, `ogImage`, `noindex`.

Migraciones: Strapi sincroniza el esquema desde los JSON de content types versionados en `cms/src/api/**`. La base actual no tiene datos de contenido, así que **no hay riesgo de pérdida**. La reversión consiste en revertir los archivos de esquema; un campo eliminado borra sus datos, por lo que en producción solo se harán cambios aditivos.

Eliminación: retirar (*unpublish*) → la URL responde 404 y sale del sitemap. Cambio de slug → 308 automático vía `Redirect`.

### 6.5 Rutas propuestas

**Públicas:** `/`, `/blog`, `/blog?page=N`, `/blog/categoria/[slug]`, `/blog/[slug]`, `/blog/etiqueta/[slug]` (noindex), `/buscar?q=` (noindex), `/proyectos`, `/proyectos/[slug]`, `/sobre-mi` (perfil + experiencia + skills), `/contacto`, `/assets/files/HV.pdf`, `/sitemap.xml`, `/robots.txt`, 404 propia.
**Internas:** `/api/preview`, `/api/revalidate` (protegidas por secreto).
**Administración:** `https://cms.slaiton.com/admin` (Strapi).

## 7. Propuesta visual (resumen para validar)

- **Paleta:** azul marino profundo (texto y bloques de contraste), turquesa (acento, enlaces, foco), blanco cálido de fondo y un gris cálido para metadatos. Se mantiene el turquesa/cian actual como hilo de continuidad de marca.
- **Tipografía:** una sans moderna de alta legibilidad para interfaz y lectura (p. ej. Inter o Geist) y una monoespaciada para código y detalles técnicos (Fira Code ya se usa hoy). La firma manuscrita "Stiven Laiton" (Caveat) podría conservarse como logotipo **[decisión]**.
- **Ritmo de la portada:** hero abierto sobre fondo claro → banda marina con destacados en grilla asimétrica (1 grande + 2 medianos) → temas como lista tipográfica, no como tarjetas → recientes en lista editorial → banda de perfil y proyectos con las apps reales → CTA de contacto (WhatsApp) → footer.
- **Movimiento:** aparición al entrar en pantalla (opacidad/desplazamiento corto), header compacto al hacer scroll, barra de progreso de lectura en artículos. Sin scroll secuestrado; todo desactivado con `prefers-reduced-motion`. Se eliminan el cursor seguidor y la navegación por rueda.
- **Mockups** (inicio, listado, artículo, panel, editor): se entregan en la Fase 1.

## 8. Riesgos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Hosting de Strapi aún no definido | Bloquea el CMS | Decidir en esta fase (ver preguntas) |
| Plan Vercel Hobby limitado a uso no comercial según sus términos **[por confirmar con Vercel]** | Legal/operativo si el sitio vende servicios | Revisar el plan antes del lanzamiento |
| Cuotas de optimización de imágenes en Vercel según el plan | Costo | Imágenes de tamaño moderado; evaluar CDN del proveedor de medios |
| Funciones de Strapi de pago (Releases, Live Preview) | Sin publicación programada nativa | Cron propio o publicación manual |
| Reescritura completa del frontend | Regresiones | Fases acotadas; la rama nueva se despliega en preview de Vercel antes de `main` |
| Producción desalineada con `main` | Comportamiento inesperado | Revisar el último deploy en Vercel |
| Datos personales en formularios (Ley 1581 de 2012, Colombia) **[por confirmar]** | Cumplimiento | WhatsApp no guarda datos en el sitio; aviso de privacidad básico y GA4 con consentimiento |

## 9. Cambios ya presentes en el árbol de trabajo (sin commit)

Realizados antes de definirse las reglas de trabajo:
- `src/components/Contact/Contact.js` / `.css`: formulario → redirección a WhatsApp (verificado en navegador local).
- `.env.development`, `.env.production`: eliminada `REACT_APP_API_URL`.
- `src/api/api.js`, `src/config.js`: eliminados **y quitados del índice con `git rm`** (operación git que contradice las reglas actuales; queda a decisión del propietario mantenerla o revertirla).

Fuentes consultadas: documentación oficial de Strapi — [Preview](https://docs.strapi.io/cms/features/preview) y [Draft & Publish](https://docs.strapi.io/cms/features/draft-and-publish); versiones vía `npm view`.
