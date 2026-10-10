# Guía rápida: publicar tu primer artículo

Panel: `https://cms.slaiton.com/admin` (en local: `http://localhost:1337/admin`).

1. **Content Manager → Publicación → Create new entry.**
2. **Título.** El **slug** (la URL) se genera solo; revísalo: corto, en minúsculas y sin tildes.
3. **Extracto** (máx. 200 caracteres). Se usa en tarjetas y, si no defines otra, como descripción en Google.
4. **Cuerpo.** Añade secciones con **+**:
   - **Texto:** títulos (empieza en *Heading 2*), párrafos, listas, enlaces, citas, código e imágenes.
     Con tres o más títulos el artículo muestra tabla de contenido.
   - **Video:** sube un MP4/WebM (máx. 100 MB) o pega un enlace de YouTube. YouTube se carga solo al pulsar reproducir.
   - **Imagen destacada en el cuerpo:** imagen grande con pie de foto y marco de navegador opcional (ideal para capturas).
5. **Categoría** (obligatoria): define el color del artículo. **Etiquetas** opcionales.
6. **Portada** (opcional). Si no la pones, el sitio genera una con el color de la categoría.
   **Antes de publicar, edita el texto alternativo de la imagen** en la biblioteca de medios; si falta, el sistema no te deja publicar.
7. **SEO** (opcional): título (≤60), descripción (≤160), URL canónica y *noindex*. Si lo dejas vacío se usan el título y el extracto.
8. **Destacar en la portada:** activa *featured*.
9. **Save** guarda un borrador; el público no lo ve.
10. **Preview** abre el borrador tal como se verá en el sitio, con un aviso amarillo de vista previa.
11. **Publish** lo publica. El sitio se actualiza en segundos.

**Programar:** llena **scheduledAt** con fecha y hora y guarda, sin publicar. Una tarea revisa cada minuto
y lo publica a esa hora (hora de Colombia).

**Corregir algo publicado:** edita y guarda (el público sigue viendo la versión anterior), revisa con *Preview* y vuelve a pulsar **Publish**.
Si el cambio es importante para el lector, llena **contentUpdatedAt** para mostrar “Actualizado el …”.

**Cambiar la URL:** cambia el slug y publica. La URL anterior redirige sola a la nueva (redirección permanente).

**Retirar:** *Unpublish*. La página deja de existir (404) y sale del sitemap.

**Perfil, experiencia, habilidades, proyectos y datos de contacto** (WhatsApp, correo, CV) también se editan desde el panel,
en *Ajustes del sitio*, *Experiencia*, *Habilidad* y *Proyecto*. Los años de experiencia se calculan solos.
