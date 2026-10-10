import type { Core } from '@strapi/strapi';
import { errors } from '@strapi/utils';
import { seedIfEmpty } from './seed';

// Tipos con página pública propia: prefijo de su URL en el sitio.
const PUBLIC_PATHS: Record<string, string> = {
  'api::post.post': '/blog/',
  'api::project.project': '/proyectos/',
};

/** Al publicar con un slug nuevo, registra una redirección 301 desde la URL anterior. */
async function registerSlugRedirect(strapi: Core.Strapi, uid: string, oldSlug: string, newSlug: string) {
  const prefix = PUBLIC_PATHS[uid];
  const from = `${prefix}${oldSlug}`;
  const to = `${prefix}${newSlug}`;
  const redirects = strapi.documents('api::redirect.redirect');

  // Evita cadenas: las redirecciones que apuntaban a la URL vieja ahora apuntan a la nueva.
  const pointingToOld = await redirects.findMany({ filters: { to: from } });
  for (const r of pointingToOld) await redirects.update({ documentId: r.documentId, data: { to } as never });

  // Si alguien vuelve a usar el slug nuevo como origen, esa redirección ya no aplica.
  const loops = await redirects.findMany({ filters: { from: to } });
  for (const r of loops) await redirects.delete({ documentId: r.documentId });

  const existing = await redirects.findFirst({ filters: { from } });
  if (existing) await redirects.update({ documentId: existing.documentId, data: { to } as never });
  else await redirects.create({ data: { from, to } as never });
  strapi.log.info(`[redirect] ${from} → ${to}`);
}

export default {
  register({ strapi }: { strapi: Core.Strapi }) {
    strapi.documents.use(async (context, next) => {
      if (context.action !== 'publish' || !(context.uid in PUBLIC_PATHS)) return next();

      const { documentId } = context.params as { documentId: string };
      const docs = strapi.documents(context.uid as 'api::post.post');

      // Validación editorial antes de publicar: la portada necesita texto alternativo.
      const draft = await docs.findOne({ documentId, status: 'draft', populate: ['cover'] });
      const cover = (draft as { cover?: { alternativeText?: string | null } | null } | null)?.cover;
      if (cover && !cover.alternativeText?.trim()) {
        throw new errors.ValidationError(
          'La imagen de portada necesita texto alternativo. Edítalo en la biblioteca de medios antes de publicar.',
        );
      }

      const before = await docs.findOne({ documentId, status: 'published', fields: ['slug'] });
      const result = await next();
      const after = await docs.findOne({ documentId, status: 'published', fields: ['slug'] });

      const oldSlug = (before as { slug?: string } | null)?.slug;
      const newSlug = (after as { slug?: string } | null)?.slug;
      if (oldSlug && newSlug && oldSlug !== newSlug) await registerSlugRedirect(strapi, context.uid, oldSlug, newSlug);
      return result;
    });
  },

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await seedIfEmpty(strapi);
  },
};
