# Cómo cargar artículos

Los artículos se escriben en **Markdown** (`docs/contenido/articulos/*.md`): un encabezado con los datos del
formulario y debajo el cuerpo. Hay dos formas de subirlos y las dos dejan el artículo como **borrador**.

> **Por qué no se veía bien al pegarlo:** la sección *Texto* es un editor visual que no interpreta Markdown;
> guarda `## Título` o los bloques de código con ``` como texto literal. Para pegar Markdown usa la sección **Markdown**.

## Opción A: pegar en el panel (manual)

1. *Content Manager → Publicación → **Create new entry***.
2. Copia del encabezado del archivo (entre las líneas `---`): **title**, **slug**, **excerpt**, **featured** y, en el componente **seo**,
   *metaTitle* y *metaDescription*.
3. **category**: la del encabezado (`arquitectura` → *Arquitectura*, `devops` → *DevOps y herramientas*). **tags**: créalas en *Etiqueta* si no existen.
4. En **body** → **+ Add a component to body** → **Markdown**. Pega **todo lo que está debajo del encabezado**, tal cual.
5. Opcional: agrega secciones **Video** o **Imagen destacada en el cuerpo** antes o después, y arrástralas para ordenarlas.
6. **Save** guarda el borrador. **Preview** muestra la vista previa (aviso amarillo). **Publish** publica.

## Opción B: importar con un comando (recomendada)

Crea los borradores con todos los campos de una vez: categoría, etiquetas (las crea si faltan), SEO y cuerpo.

**Una sola vez:** crea un token en *Settings → API Tokens → Create new API Token*.
- Nombre `importador`, tipo **Custom**, duración *Unlimited*.
- Permisos: *Publicación* → find, findOne, create, update · *Etiqueta* → find, create · *Categoría* → find.
- Guárdalo en tu gestor de contraseñas. No lo subas a git.

**Importar** (desde la raíz del repo):

```bash
CMS_URL=https://cms.slaiton.com CMS_WRITE_TOKEN=<token> node cms/scripts/importar-articulo.mjs docs/contenido/articulos/*.md
```

- Valida antes de subir: campos obligatorios, slug válido, extracto ≤200, título SEO ≤60, descripción ≤160.
- Si el slug ya existe, **actualiza el borrador**. Lo publicado no cambia hasta que pulses *Publish*.
- **No puede publicar:** el CMS rechaza cualquier publicación que llegue por la API, aunque el token tenga permisos.
  Publicar solo es posible desde el panel o con *scheduledAt*.

Después, en el panel: abre el borrador → **Preview** → ajusta lo que quieras → **Publish** (o programa con *scheduledAt*).

## Programar la publicación

En el borrador, llena **scheduledAt** con fecha y hora (hora de Colombia) y pulsa solo **Save**. La tarea programada
lo publica al minuto siguiente de esa hora. Si tiene portada, edita antes su **texto alternativo** o no se publicará.

## Markdown soportado

`##` y `###` para títulos (aparecen en la tabla de contenido), **negrita**, *cursiva*, `código en línea`, listas,
enlaces, citas `>`, tablas, `---` como separador y bloques de código con lenguaje (``` php). Cada bloque muestra un botón *Copiar*.
Un `#` en el cuerpo se muestra como `##`, porque el título del artículo ya es el H1. El HTML pegado se muestra como texto, no se ejecuta.

## Qué comprobar después de publicar

| Dónde | Qué debe pasar |
|---|---|
| `/` | El artículo en *Destacados* (si *featured*) y el contador de su tema sube |
| `/blog` y `/blog/categoria/...` | Aparece con el color de su categoría |
| Artículo | Tabla de contenido, bloques de código copiables y fecha correcta |
| `/sitemap.xml` | Incluye la URL |
| `/buscar?q=...` | Lo encuentra por título o extracto |
| Cambiar el slug y volver a publicar | La URL vieja redirige a la nueva |
| *Unpublish* | La página da 404 y sale del sitemap |
