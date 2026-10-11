# Redacción asistida: aprobar un tema → borrador automático en Strapi

Al **aprobar** un tema, el CMS redacta el artículo con IA y lo sube a *Publicación* como **borrador**.
Tú lo revisas, completas y publicas. **Nada se publica solo.**

## Proveedores de IA

| Modelo (Guía editorial → model) | Proveedor | Variable en `infra/.env` | Costo aprox. por borrador |
|---|---|---|---|
| `deepseek-v4-pro` *(por defecto)* | DeepSeek | `DEEPSEEK_API_KEY` | ~0,03 USD (hasta ~0,06 en hora pico) |
| `deepseek-flash` | DeepSeek | `DEEPSEEK_API_KEY` | ~0,01 USD |
| `claude-opus-5-5` | Anthropic | `ANTHROPIC_API_KEY` | 0,10–0,20 USD |
| `claude-sonnet-5-5` | Anthropic | `ANTHROPIC_API_KEY` | 0,05–0,10 USD |

Precios de referencia según la documentación oficial de cada proveedor (octubre de 2026). Medición real con `deepseek-v4-pro`:
847 tokens de entrada y 15.205 de salida (incluye el razonamiento del modelo) para un artículo de unas 1.300 palabras, en 105 segundos.
DeepSeek cobra el doble en hora pico (lunes a viernes, 01:00–04:00 y 06:00–10:00 UTC).
Cambiar de proveedor es solo cambiar el modelo en el panel; no hay que desplegar.

**Diferencias:** con Claude, el formato JSON lo valida la API contra un esquema. Con DeepSeek se usa su modo JSON con un ejemplo de estructura,
y el CMS valida la respuesta (descarta temas incompletos y reintenta si llega vacía). La calidad de redacción puede variar: revisa siempre.

**Privacidad:** a la IA solo se envía tu perfil público, la guía de estilo y el tema. No pongas información confidencial de clientes en las *notes*.

## Activarlo en el servidor (una vez)

1. Crea la API key del proveedor que vayas a usar:
   - **DeepSeek:** [platform.deepseek.com](https://platform.deepseek.com) → API keys. Funciona con saldo prepagado (recarga unos pocos dólares).
   - **Anthropic:** [console.anthropic.com](https://console.anthropic.com) → API keys, y configura un **límite de gasto mensual**.
2. Agrégala a `infra/.env` (basta con una):
   ```
   DEEPSEEK_API_KEY=sk-...
   ANTHROPIC_API_KEY=sk-ant-...
   ```
3. Despliega: `bash infra/scripts/deploy.sh`.
4. En el panel, *Guía editorial → model*: elige un modelo del proveedor que configuraste.

Si falta la key del modelo elegido, los temas aprobados quedan en **error** con un mensaje que dice qué variable falta.

## Guía editorial (panel → Content Manager → *Guía editorial*)

| Opción | Qué hace |
|---|---|
| **autoDraftOnApproval** | La opción principal: **activada**, cada tema aprobado se redacta y se sube como borrador. **Desactivada**, funciona como pausa: los temas aprobados esperan y se redactan cuando la vuelvas a activar. |
| **proposeNow** | Márcala y guarda: la IA propone temas nuevos en ese momento. Se desmarca sola. |
| **weeklyProposals** | Propuesta automática de temas cada lunes a las 7:00 (hora de Colombia). |
| **topicsPerRun** | Cuántos temas proponer cada vez (1–12, por defecto 6). |
| **maxDraftsPerDay** | Tope de borradores por día, para controlar el gasto (por defecto 5). |
| **model** | `deepseek-v4-pro` (por defecto), `deepseek-flash`, `claude-opus-5-5` o `claude-sonnet-5-5` (ver tabla de proveedores). |
| **authorProfile** | Tu perfil profesional. Si está vacío, se usa uno basado en tu experiencia real. |
| **styleGuide** | Tono, público y reglas de estilo. Si está vacío, se usa una guía por defecto. |

## Uso diario

1. **Temas** (*Content Manager → Tema propuesto*). Llegan de la propuesta automática o los creas tú: escribe un título y, opcionalmente,
   categoría, palabra clave, ángulo, esquema y **notes**, tus indicaciones para la redacción ("usa el caso de las guías de transporte").
2. **Aprueba:** cambia **status** a `aprobado` y guarda. Para descartar, usa `descartado`.
3. En 1–3 minutos el tema pasa a `borrador_listo` y muestra el título del borrador en **draftTitle**.
   Si algo falla, queda en `error` con el motivo en **errorMessage**. Para reintentar, vuelve a ponerlo en `aprobado`.
4. **Revisa el borrador** en *Publicación*: lee, corrige y reemplaza cada `[COMPLETAR: …]` con tu experiencia real.
   Mientras quede alguno, el panel **no deja publicar** y te dice cuáles faltan.
5. **Preview** → **Publish**, o programa con **scheduledAt**.

## Estados de un tema

`propuesto` → (tú) `aprobado` → `en_redaccion` → `borrador_listo` · o `error` · o (tú) `descartado`

Si el servidor se reinicia a mitad de una redacción, el tema vuelve solo a `aprobado` a los 30 minutos y se reintenta.

## Costos y control

- Cada tema guarda el **modelo** y los **tokens** usados (`inputTokens`, `outputTokens`), así sabes cuánto costó.
- Estimaciones por borrador: ver la tabla de proveedores. Una propuesta de temas cuesta aún menos.
- Topes: `maxDraftsPerDay` en el CMS, más el saldo prepagado (DeepSeek) o el límite mensual (Anthropic).

## Qué hace (y qué no) la IA

- Redacta en Markdown, con títulos, código y un resumen final, siguiendo tu guía de estilo.
- **No inventa** experiencias, clientes ni cifras: deja `[COMPLETAR: …]` para que tú lo cuentes.
- **No publica, no programa y no edita lo ya publicado.** Solo crea borradores nuevos.
- Revisa siempre el código y los datos técnicos antes de publicar.

## Probar sin gastar (desarrollo local)

En `cms/.env` pon `EDITORIAL_FAKE=true`. Las respuestas se simulan sin llamar a la API. En producción esta opción se ignora.
