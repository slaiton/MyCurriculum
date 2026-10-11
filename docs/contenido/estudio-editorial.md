# Estudio editorial (panel de Strapi)

Tablero propio dentro de Strapi para alimentar el blog con IA (DeepSeek o Claude): **generar temas → aprobar → revisar → publicar**,
todo en una sola pantalla. Todo se guarda en Strapi y el sitio se actualiza solo al publicar.

**Dónde está:** panel de Strapi → menú lateral → **Estudio editorial** (`/admin/plugins/estudio`).
Usa tu sesión de administrador; no expone nada nuevo a internet.

## Cómo se usa

| Bloque | Qué haces |
|---|---|
| **Generar temas con IA** | Escribe un enfoque opcional ("Kotlin y logística"), elige la cantidad (3–12) y pulsa **Generar temas**. En uno o dos minutos aparecen en *Temas propuestos* y verás el resultado ("✅ 6 temas nuevos…" o el motivo del error). |
| **Ajustes** | Modelo de IA (cada opción indica su costo aproximado y si falta su API key), redacción automática al aprobar y propuesta semanal (lunes 7:00). |
| **Temas propuestos** | Cada tema muestra categoría, búsqueda objetivo, ángulo, esquema y si *requiere tu experiencia*. Escribe indicaciones opcionales y pulsa **Aprobar y redactar**, o **Descartar**. |
| **Redactando** | Temas en proceso (1–3 minutos cada uno). La página se actualiza sola. |
| **Borradores listos** | **Vista previa** (abre el artículo en el sitio con el aviso de borrador), **Editar** (abre el editor de Strapi) y **Publicar**. Si quedan marcadores `[COMPLETAR]`, se listan y *Publicar* queda deshabilitado hasta que los reemplaces en el editor. |
| **Con error** | Muestra el motivo (saldo, key, respuesta cortada…) y un botón **Reintentar**. |
| **Tema propio** | Escribe tu idea: **Guardar como propuesto** o **Crear y redactar** de inmediato. |
| **Publicados desde el estudio** | Historial de lo que ya salió al blog. |

## Reglas que se mantienen

- La IA **solo crea borradores**. Publicar requiere tu clic en el estudio o en el editor.
- No se publica con marcadores `[COMPLETAR]` pendientes ni con una portada sin texto alternativo.
- La API pública del CMS sigue sin poder publicar; el estudio usa rutas de administración protegidas por tu sesión.
- Un tema que ya tiene borrador no se puede volver a redactar por error.

## Técnico

- Plugin local en `cms/src/plugins/estudio/`: servidor en JavaScript (`server/`) y página en React/TypeScript (`admin/`) con el sistema de diseño
  de Strapi (`@strapi/design-system` y `@strapi/icons` 2.2.4, la misma versión que usa el panel).
- Rutas (prefijo `/estudio`, tipo admin, política `admin::isAuthenticatedAdmin`): `GET /resumen`, `POST /proponer`, `POST /temas`,
  `POST /temas/:id/estado`, `POST /borradores/:id/publicar`, `PUT /ajustes`.
- Reutiliza la lógica existente: la redacción se dispara al aprobar (`cms/src/index.ts`) y las validaciones de publicación son las mismas del panel.
- Se registra en `cms/config/plugins.ts` y se compila con el panel de Strapi (`npm run build`), sin pasos adicionales en el despliegue.
