# Plan: generación asistida de contenido con aprobación humana

> Estado: **fases A–C implementadas** (2026-10-10); falta el aviso por correo (fase D). Guía de uso: `docs/contenido/redaccion-asistida.md`.
> Objetivo: alimentar el blog de forma constante sin perder calidad ni control. La IA **propone y redacta borradores**;
> tú **apruebas temas, revisas, completas y publicas**. Nada se publica solo.

## 1. Flujo

```
 (lunes 7:00)            (tú, en el panel)           (cada hora)                 (tú, en el panel)
 Generar temas  ──▶  Temas "propuesto"  ──▶  apruebas / descartas  ──▶  Redactar borrador  ──▶  Revisar · completar · Preview
 con Claude          (con palabra clave,       + notas opcionales         con Claude              Publish o programar (scheduledAt)
                      ángulo y esquema)        ("incluye mi caso X")      → Publicación borrador
```

1. **Propuesta semanal de temas.** Una tarea programada en Strapi pide a Claude N temas nuevos (p. ej. 6). Le pasa como contexto tu perfil
   y stack, las categorías, los títulos ya publicados o propuestos (para no repetir) y el banco de ideas. Cada tema llega con título, palabra
   clave objetivo, categoría, ángulo, esquema de secciones y si **necesita datos tuyos** (⭐).
2. **Aprobación.** En el panel, colección *Tema propuesto*: cambias el estado a **aprobado** o **descartado**. Puedes añadir notas para la
   redacción ("usa el ejemplo de guías de transporte", "menciona que lo apliqué en CargoApp").
3. **Redacción del borrador.** Otra tarea toma los temas aprobados y pide a Claude el artículo completo en **Markdown** (título, slug,
   extracto, SEO, etiquetas y cuerpo). Lo crea como **Publicación en borrador** con la sección Markdown, lo enlaza al tema y lo marca
   *borrador listo*. Opcional: te avisa por correo.
4. **Revisión humana.** Lees, corriges, completas los marcadores `[COMPLETAR: …]` con tu experiencia real, revisas el código y,
   con *Preview*, ves el resultado. Luego **Publish** o programas con *scheduledAt*.

## 2. Garantías de calidad y control

| Garantía | Cómo se implementa |
|---|---|
| Nunca se publica sin ti | El generador solo crea borradores. Además, desde hoy el CMS rechaza cualquier publicación que llegue por la API. |
| Sin experiencias ni cifras inventadas | Instrucción explícita en el prompt: donde haga falta algo personal, Claude escribe `[COMPLETAR: …]`. |
| No se publica con huecos | Validación al publicar: si el cuerpo contiene `[COMPLETAR`, el panel no deja publicar y te dice qué falta. |
| Sin temas repetidos | Se envían los títulos existentes y se descarta una propuesta si su slug ya existe. |
| Ritmo sano para SEO | 1–2 artículos por semana. Las guías de Google penalizan el contenido masivo de poco valor, no el uso de IA: lo que cuenta es que sea útil, original y revisado por alguien con experiencia (E-E-A-T). |
| Control de gasto | Tope de temas por semana y de borradores por día, y registro de tokens usados por cada generación. |
| Errores visibles | Si una generación falla, el tema queda en estado *error* con el mensaje, y se reintenta al volver a aprobarlo. |

## 3. Arquitectura propuesta

**Dentro de Strapi** (sin servicios nuevos): reutiliza la base de datos, el cron que ya existe para la publicación programada, el panel
para aprobar y el despliegue actual.

| Pieza | Detalle |
|---|---|
| Nueva colección *Tema propuesto* | title, keyword, category (relación), angle, outline, needsPersonalData, notes (tuyas), status (`propuesto` · `aprobado` · `descartado` · `en_redaccion` · `borrador_listo` · `error`), post (relación), errorMessage, usage (tokens) |
| Tarea semanal `proponerTemas` | Lunes 7:00 (America/Bogota). Respuesta en JSON validado con *structured outputs*. |
| Tarea `redactarBorradores` | Cada hora. Procesa los temas *aprobados* de uno en uno. |
| Guía de estilo editable | Single type *Guía editorial*: tono, público, extensión, reglas. La editas desde el panel sin desplegar. |
| SDK | `@anthropic-ai/sdk` (oficial), con llamadas en *streaming* para textos largos. |
| Secreto | `ANTHROPIC_API_KEY` en `infra/.env`, solo en el contenedor del CMS. |
| Validación de publicación | Ampliar el middleware actual: bloquear si hay `[COMPLETAR`. |

**Alternativas evaluadas:** un servicio aparte o n8n (otra pieza que mantener); GitHub Actions con cron (necesitaría escribir en el CMS desde
fuera, con un token de escritura expuesto en CI). Dentro de Strapi es lo más simple y seguro para un solo autor.

## 4. Modelo y costos (precios oficiales vigentes, API de Anthropic)

| Modelo | Uso propuesto | Entrada / 1M tokens | Salida / 1M tokens |
|---|---|---|---|
| **Claude Opus 5.5** (`claude-opus-5-5`) | Temas y borradores (recomendado: mejor redacción técnica en español) | $4 | $20 |
| Claude Sonnet 5.5 (`claude-sonnet-5-5`) | Alternativa más barata, si la calidad te convence en pruebas | $2 | $10 |

**Estimación por artículo con Opus 5.5:** unos 5.000 tokens de entrada (guía, perfil, esquema) y entre 4.000 y 8.000 de salida, contando el razonamiento
del modelo. Eso da **entre 0,10 y 0,20 USD por borrador**. Una propuesta semanal de temas cuesta unos **0,05–0,10 USD**.
→ Con 2 artículos por semana: **menos de 2 USD al mes**. Son estimaciones: el gasto real queda registrado en cada tema.

- **Batch API (50 % más barato, asíncrono, hasta 24 h):** encaja con contenido no urgente, pero a este volumen el ahorro es de centavos
  y añade complejidad (encolar, consultar, recuperar). Recomendación: llamadas directas al inicio y Batch si algún día el volumen crece.
- **Prompt caching:** la guía de estilo y el perfil son estables, así que son buenos candidatos. Pero con pocas llamadas espaciadas en el tiempo
  la caché (5 min o 1 h) casi nunca se reutiliza. Solo aporta si se redactan varios borradores en la misma ejecución. Se activa sin costo extra de código.
- **Búsqueda web (opcional):** permite verificar versiones vigentes de librerías antes de escribir código de ejemplo. Mejora la precisión,
  pero tiene costo adicional por búsqueda. Se decide después de las primeras pruebas.

## 5. Fases de implementación

| Fase | Entregable | Validación |
|---|---|---|
| A | Colección *Tema propuesto*, *Guía editorial* y validación `[COMPLETAR` | Crear un tema manual y probar los estados |
| B | Tarea `proponerTemas` + botón "Proponer temas ahora" para pruebas | Revisas 6 temas reales y ajustamos el prompt |
| C | Tarea `redactarBorradores` | 2 borradores de prueba revisados por ti; ajustamos tono y extensión |
| D | Aviso por correo (opcional), registro de gasto y topes | Una semana en modo real |

**Antes de cualquier llamada real a la API** se te pide aprobación del presupuesto de pruebas (unos pocos dólares).

## 6. Decisiones pendientes

1. **Frecuencia:** ¿cuántos temas propuestos por semana (sugerido 6) y cuántos artículos publicados (sugerido 1–2)?
2. **Modelo:** Opus 5.5 (recomendado) o Sonnet 5.5 (la mitad de precio).
3. **Aviso:** ¿correo cuando hay borradores listos, o te basta con revisar el panel?
4. **Cuenta de API:** necesitas una API key de Anthropic con un límite de gasto mensual configurado en la consola.
5. **Búsqueda web** para verificar datos técnicos: ¿sí o no por ahora?
