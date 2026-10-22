import type { Core } from '@strapi/strapi';
import { errors } from '@strapi/utils';
import { ensureSettings, pendingPlaceholders, runPendingDrafts, runProposals } from './editorial/service';
import { seedIfEmpty } from './seed';
import { notifySite } from './revalidate';
import { applySeo, runSeoSuggestions } from './editorial/seo';

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
    // Funciones de SEO para el plugin Estudio editorial (que está en JavaScript y no importa TypeScript).
    (strapi as unknown as { estudioSeo: unknown }).estudioSeo = { run: runSeoSuggestions, apply: applySeo };

    // Avisa al sitio para que muestre los cambios al instante (sin depender de configurar un webhook en el panel).
    strapi.documents.use(async (context, next) => {
      const result = await next();
      notifySite(strapi, context.uid, context.action, result);
      return result;
    });

    // Redacción asistida: al aprobar un tema se redacta y se sube como borrador (en segundo plano,
    // para no bloquear el panel). La tarea programada reintenta lo que quede pendiente.
    strapi.documents.use(async (context, next) => {
      const result = await next();
      const doc = result as { status?: string; proposeNow?: boolean; documentId?: string } | null;
      const isWrite = context.action === 'create' || context.action === 'update';
      if (isWrite && context.uid === 'api::topic.topic' && doc?.status === 'aprobado') {
        setImmediate(() => void runPendingDrafts(strapi));
      }
      if (isWrite && context.uid === 'api::editorial-setting.editorial-setting' && doc?.proposeNow && doc.documentId) {
        // "Proponer temas ahora": se desmarca solo y lanza la propuesta.
        await strapi.documents('api::editorial-setting.editorial-setting' as never).update({
          documentId: doc.documentId,
          data: { proposeNow: false } as never,
        });
        setImmediate(() => void runProposals(strapi));
      }
      return result;
    });

    // Aprobación humana obligatoria: lo que llega por la API pública (importador, automatizaciones)
    // solo crea o edita BORRADORES. Publicar queda para el panel y para la tarea programada.
    strapi.documents.use(async (context, next) => {
      const ctx = strapi.requestContext.get() as { state?: { route?: { info?: { type?: string } } } } | undefined;
      if (ctx?.state?.route?.info?.type !== 'content-api') return next();
      const params = context.params as { status?: string };
      if (context.action === 'publish' || context.action === 'unpublish') {
        throw new errors.ForbiddenError('Publicar o retirar contenido solo se permite desde el panel.');
      }
      if ((context.action === 'create' || context.action === 'update') && params.status === 'published') {
        delete params.status;
      }
      return next();
    });

    strapi.documents.use(async (context, next) => {
      if (context.action !== 'publish' || !(context.uid in PUBLIC_PATHS)) return next();

      const { documentId } = context.params as { documentId: string };
      const docs = strapi.documents(context.uid as 'api::post.post');

      // Validación editorial antes de publicar: la portada necesita texto alternativo.
      const draft = await docs.findOne({ documentId, status: 'draft', populate: ['cover', 'body'] });
      const pending = pendingPlaceholders((draft as { body?: unknown } | null)?.body);
      if (pending.length) {
        throw new errors.ValidationError(
          `El artículo tiene ${pending.length} marcador(es) [COMPLETAR] sin reemplazar: ${pending.map((p) => `"${p}"`).join(', ')}.`,
        );
      }
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
    await ensureSettings(strapi);

  },
};
