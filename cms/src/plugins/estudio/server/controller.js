'use strict';

// Controlador del Estudio editorial. Todo pasa por el Document Service de Strapi, así que se aplican las
// mismas reglas que en el panel: la redacción se dispara al aprobar (src/index.ts) y al publicar se validan
// los marcadores [COMPLETAR] y el texto alternativo de la portada.

const TOPIC = 'api::topic.topic';
const POST = 'api::post.post';
const SETTINGS = 'api::editorial-setting.editorial-setting';
const MODELS = ['deepseek-v4-pro', 'deepseek-flash', 'claude-opus-5-5', 'claude-sonnet-5-5'];

const pendingPlaceholders = (body) =>
  [...JSON.stringify(body ?? '').matchAll(/\[COMPLETAR:?([^\]]{0,120})\]/g)].map((m) => m[1].trim());

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

module.exports = ({ strapi }) => {
  const settingsDoc = () => strapi.documents(SETTINGS).findFirst();

  const previewUrl = (slug) => {
    const client = process.env.CLIENT_URL;
    if (!client || !slug) return null;
    const params = new URLSearchParams({ secret: process.env.PREVIEW_SECRET || '', uid: POST, slug, status: 'draft' });
    return `${client.replace(/\/$/, '')}/api/preview?${params}`;
  };

  const fail = (ctx, error) => ctx.badRequest(error?.message || 'No se pudo completar la acción.');

  return {
    /** Todo lo que necesita el tablero en una sola llamada. */
    async resumen(ctx) {
      const [settings, categories, topics] = await Promise.all([
        settingsDoc(),
        strapi.documents('api::category.category').findMany({ fields: ['name', 'slug', 'color'], sort: 'name:asc' }),
        strapi.documents(TOPIC).findMany({
          sort: 'updatedAt:desc',
          limit: 200,
          populate: { category: { fields: ['name', 'slug', 'color'] } },
        }),
      ]);

      const withDrafts = await Promise.all(
        topics.map(async (t) => {
          if (!t.draftDocumentId) return { ...t, draft: null };
          const draft = await strapi.documents(POST).findOne({
            documentId: t.draftDocumentId,
            status: 'draft',
            fields: ['title', 'slug', 'updatedAt'],
            populate: ['body'],
          });
          if (!draft) return { ...t, draft: null };
          const published = await strapi.documents(POST).findOne({ documentId: t.draftDocumentId, status: 'published', fields: ['publishedAt'] });
          return {
            ...t,
            draft: {
              documentId: t.draftDocumentId,
              title: draft.title,
              slug: draft.slug,
              pending: pendingPlaceholders(draft.body),
              publishedAt: published?.publishedAt ?? null,
              previewUrl: previewUrl(draft.slug),
              editUrl: `/content-manager/collection-types/${POST}/${t.draftDocumentId}`,
            },
          };
        }),
      );

      ctx.body = {
        settings,
        categories,
        topics: withDrafts,
        providers: { deepseek: Boolean(process.env.DEEPSEEK_API_KEY), anthropic: Boolean(process.env.ANTHROPIC_API_KEY) },
        fakeMode: process.env.EDITORIAL_FAKE === 'true' && process.env.NODE_ENV !== 'production',
      };
    },

    /** Lanza una propuesta de temas (el middleware de "proposeNow" la ejecuta en segundo plano). */
    async proponer(ctx) {
      try {
        const settings = await settingsDoc();
        const count = Math.min(12, Math.max(1, Number(ctx.request.body?.count) || settings.topicsPerRun || 6));
        await strapi.documents(SETTINGS).update({
          documentId: settings.documentId,
          data: { proposalFocus: str(ctx.request.body?.focus, 500) || null, topicsPerRun: count, proposeNow: true },
        });
        ctx.body = { ok: true };
      } catch (error) {
        fail(ctx, error);
      }
    },

    /** Tema escrito por el autor; con approve=true se redacta de inmediato. */
    async crearTema(ctx) {
      try {
        const { title, notes, categoryId, approve } = ctx.request.body ?? {};
        if (!str(title, 140)) return ctx.badRequest('Escribe un título para el tema.');
        const topic = await strapi.documents(TOPIC).create({
          data: {
            title: str(title, 140),
            notes: str(notes, 2000) || null,
            category: categoryId || null,
            status: approve ? 'aprobado' : 'propuesto',
          },
        });
        ctx.body = { ok: true, documentId: topic.documentId };
      } catch (error) {
        fail(ctx, error);
      }
    },

    /** Aprobar (redacta y sube el borrador), descartar o reintentar un tema. */
    async cambiarEstado(ctx) {
      try {
        const { documentId } = ctx.params;
        const { status, notes } = ctx.request.body ?? {};
        if (!['aprobado', 'descartado', 'propuesto'].includes(status)) return ctx.badRequest('Estado no permitido.');
        const topic = await strapi.documents(TOPIC).findOne({ documentId });
        if (!topic) return ctx.notFound('El tema no existe.');
        if (topic.status === 'en_redaccion') return ctx.badRequest('Este tema se está redactando; espera a que termine.');
        if (status === 'aprobado' && topic.status === 'borrador_listo') return ctx.badRequest('Este tema ya tiene un borrador.');

        const data = { status, errorMessage: null };
        if (typeof notes === 'string') data.notes = str(notes, 2000) || null;
        await strapi.documents(TOPIC).update({ documentId, data });
        ctx.body = { ok: true };
      } catch (error) {
        fail(ctx, error);
      }
    },

    /** Publica el borrador. Las validaciones del CMS ([COMPLETAR], texto alternativo) se aplican igual. */
    async publicar(ctx) {
      try {
        const { documentId } = ctx.params;
        const draft = await strapi.documents(POST).findOne({ documentId, status: 'draft', fields: ['title'] });
        if (!draft) return ctx.notFound('El borrador no existe.');
        await strapi.documents(POST).publish({ documentId });
        ctx.body = { ok: true };
      } catch (error) {
        fail(ctx, error);
      }
    },

    async ajustes(ctx) {
      try {
        const settings = await settingsDoc();
        const body = ctx.request.body ?? {};
        const data = {};
        if (MODELS.includes(body.model)) data.model = body.model;
        if (typeof body.autoDraftOnApproval === 'boolean') data.autoDraftOnApproval = body.autoDraftOnApproval;
        if (typeof body.weeklyProposals === 'boolean') data.weeklyProposals = body.weeklyProposals;
        if (typeof body.seoMonthly === 'boolean') data.seoMonthly = body.seoMonthly;
        if (typeof body.seoAutoApply === 'boolean') data.seoAutoApply = body.seoAutoApply;
        await strapi.documents(SETTINGS).update({ documentId: settings.documentId, data });
        ctx.body = { ok: true };
      } catch (error) {
        fail(ctx, error);
      }
    },

    /** Proyectos con su SEO actual, palabras objetivo y la última sugerencia de la IA. */
    async seoListar(ctx) {
      const projects = await strapi.documents('api::project.project').findMany({
        status: 'draft',
        sort: 'order:asc',
        fields: ['title', 'slug', 'summary', 'targetKeywords', 'seoSuggestion'],
        populate: { seo: { fields: ['metaTitle', 'metaDescription', 'keywords'] } },
        limit: 100,
      });
      const withState = await Promise.all(
        projects.map(async (p) => {
          const pub = await strapi.documents('api::project.project').findOne({ documentId: p.documentId, status: 'published', fields: ['publishedAt'] });
          return { ...p, publishedAt: pub?.publishedAt ?? null };
        }),
      );
      ctx.body = { projects: withState };
    },

    async seoGenerar(ctx) {
      try {
        const results = await strapi.estudioSeo.run(strapi, ctx.request.body?.documentId || undefined);
        ctx.body = { results };
      } catch (error) {
        fail(ctx, error);
      }
    },

    async seoAplicar(ctx) {
      try {
        await strapi.estudioSeo.apply(strapi, ctx.params.documentId);
        ctx.body = { ok: true };
      } catch (error) {
        fail(ctx, error);
      }
    },

    async seoObjetivo(ctx) {
      try {
        await strapi.documents('api::project.project').update({
          documentId: ctx.params.documentId,
          data: { targetKeywords: str(ctx.request.body?.targetKeywords, 2000) || null },
        });
        ctx.body = { ok: true };
      } catch (error) {
        fail(ctx, error);
      }
    },
  };
};
