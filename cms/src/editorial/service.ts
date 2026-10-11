// Orquesta la redacción asistida dentro de Strapi: aprobar un tema → borrador en "Publicación".
// Todo lo que crea queda como BORRADOR; publicar sigue siendo decisión del autor en el panel.
import type { Core } from '@strapi/strapi';
import { EditorialError, generateDraft, proposeTopics, type EditorialModel } from './llm';

const TOPIC = 'api::topic.topic';
const POST = 'api::post.post';
const SETTINGS = 'api::editorial-setting.editorial-setting';

interface Settings {
  autoDraftOnApproval: boolean;
  weeklyProposals: boolean;
  proposeNow: boolean;
  topicsPerRun: number;
  maxDraftsPerDay: number;
  model: EditorialModel;
  authorProfile?: string | null;
  styleGuide?: string | null;
}

const DEFAULTS: Settings = {
  autoDraftOnApproval: true,
  weeklyProposals: false,
  proposeNow: false,
  topicsPerRun: 6,
  maxDraftsPerDay: 5,
  model: 'deepseek-v4-pro',
};

const slugify = (text: string) =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// Evita ejecuciones simultáneas dentro del mismo proceso (aprobaciones seguidas + cron).
let draftingRun: Promise<void> | null = null;
let proposing = false;

export async function getSettings(strapi: Core.Strapi): Promise<Settings> {
  const s = (await strapi.documents(SETTINGS as never).findFirst()) as Partial<Settings> | null;
  return { ...DEFAULTS, ...(s ?? {}) } as Settings;
}

/** Crea la "Guía editorial" con valores por defecto si aún no existe. */
export async function ensureSettings(strapi: Core.Strapi) {
  const existing = await strapi.documents(SETTINGS as never).findFirst();
  if (!existing) await strapi.documents(SETTINGS as never).create({ data: DEFAULTS as never });
}

async function uniqueSlug(strapi: Core.Strapi, base: string) {
  let slug = base || 'articulo';
  for (let i = 2; i < 50; i++) {
    const taken = await strapi.documents(POST as never).findFirst({ filters: { slug }, status: 'draft' } as never);
    if (!taken) return slug;
    slug = `${base}-${i}`;
  }
  return `${base}-${Date.now()}`;
}

async function tagIds(strapi: Core.Strapi, names: string[]) {
  const ids: string[] = [];
  for (const name of names) {
    const slug = slugify(name);
    if (!slug) continue;
    const found = (await strapi.documents('api::tag.tag' as never).findFirst({ filters: { slug } } as never)) as { documentId: string } | null;
    const tag = found ?? ((await strapi.documents('api::tag.tag' as never).create({ data: { name, slug } as never })) as { documentId: string });
    ids.push(tag.documentId);
  }
  return ids;
}

async function draftsToday(strapi: Core.Strapi) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return strapi.documents(TOPIC as never).count({ filters: { generatedAt: { $gte: start.toISOString() } } } as never);
}

/** Redacta un tema aprobado y lo sube como borrador. Deja el tema en "borrador_listo" o en "error". */
async function draftTopic(strapi: Core.Strapi, documentId: string, settings: Settings) {
  const topics = strapi.documents(TOPIC as never);
  const topic = (await topics.findOne({ documentId, populate: ['category'] } as never)) as {
    title: string; status: string; keyword?: string; angle?: string; outline?: string; notes?: string;
    needsPersonalData?: boolean; category?: { documentId: string; name: string } | null;
  } | null;
  if (!topic || topic.status !== 'aprobado') return;

  await topics.update({ documentId, data: { status: 'en_redaccion', errorMessage: null } as never });
  try {
    const { draft, usage } = await generateDraft(
      { ...topic, categoryName: topic.category?.name },
      { model: settings.model, profile: settings.authorProfile, style: settings.styleGuide },
    );
    const post = (await strapi.documents(POST as never).create({
      data: {
        title: draft.title,
        slug: await uniqueSlug(strapi, draft.slug),
        excerpt: draft.excerpt,
        category: topic.category?.documentId ?? null,
        tags: await tagIds(strapi, draft.tags),
        body: [{ __component: 'content.markdown', body: draft.body }],
        seo: { metaTitle: draft.metaTitle, metaDescription: draft.metaDescription },
      } as never,
    })) as { documentId: string };

    await topics.update({
      documentId,
      data: {
        status: 'borrador_listo',
        // Texto plano: una relación desde un tipo sin borradores solo vería la versión publicada del artículo.
        draftTitle: draft.title,
        draftDocumentId: post.documentId,
        model: usage.model,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        generatedAt: new Date().toISOString(),
      } as never,
    });
    strapi.log.info(`[editorial] Borrador listo: "${draft.title}" (${usage.inputTokens}+${usage.outputTokens} tokens)`);
  } catch (error) {
    const message = error instanceof EditorialError ? error.message : `Error inesperado: ${(error as Error).message}`;
    await topics.update({ documentId, data: { status: 'error', errorMessage: message, generatedAt: new Date().toISOString() } as never });
    strapi.log.error(`[editorial] No se pudo redactar "${topic.title}": ${message}`);
  }
}

/** Redacta todos los temas aprobados pendientes, uno a uno, respetando el límite diario. */
export function runPendingDrafts(strapi: Core.Strapi): Promise<void> {
  if (draftingRun) return draftingRun;
  draftingRun = (async () => {
    try {
      const settings = await getSettings(strapi);
      if (!settings.autoDraftOnApproval) return;

      // Recupera temas que quedaron "en_redaccion" por un reinicio del servidor (más de 30 min).
      const stale = (await strapi.documents(TOPIC as never).findMany({
        filters: { status: 'en_redaccion', updatedAt: { $lt: new Date(Date.now() - 30 * 60_000).toISOString() } },
        fields: ['title'],
      } as never)) as { documentId: string }[];
      for (const t of stale) await strapi.documents(TOPIC as never).update({ documentId: t.documentId, data: { status: 'aprobado' } as never });

      const pending = (await strapi.documents(TOPIC as never).findMany({
        filters: { status: 'aprobado' },
        sort: 'updatedAt:asc',
        fields: ['title'],
      } as never)) as { documentId: string }[];
      for (const t of pending) {
        if ((await draftsToday(strapi)) >= settings.maxDraftsPerDay) {
          strapi.log.warn(`[editorial] Límite diario de ${settings.maxDraftsPerDay} borradores alcanzado; el resto queda para mañana.`);
          break;
        }
        await draftTopic(strapi, t.documentId, settings);
      }
    } finally {
      draftingRun = null;
    }
  })();
  return draftingRun;
}

/** Pide nuevos temas y los guarda como "propuesto" para que el autor los apruebe o descarte. */
export async function runProposals(strapi: Core.Strapi) {
  if (proposing) return;
  proposing = true;
  try {
    const settings = await getSettings(strapi);
    const categories = (await strapi.documents('api::category.category' as never).findMany({
      fields: ['name', 'slug', 'description'],
    } as never)) as { documentId: string; name: string; slug: string; description?: string }[];
    if (!categories.length) throw new EditorialError('No hay categorías creadas.');

    const posts = (await strapi.documents(POST as never).findMany({ status: 'draft', fields: ['title'], limit: 500 } as never)) as { title: string }[];
    const topics = (await strapi.documents(TOPIC as never).findMany({ fields: ['title'], limit: 500 } as never)) as { title: string }[];
    const existingTitles = [...posts, ...topics].map((x) => x.title);
    const existingSlugs = new Set(existingTitles.map(slugify));

    const { topics: proposals, usage } = await proposeTopics({
      model: settings.model,
      count: settings.topicsPerRun,
      categories,
      existingTitles,
      profile: settings.authorProfile,
    });

    let created = 0;
    for (const p of proposals) {
      if (existingSlugs.has(slugify(p.title))) continue;
      const category = categories.find((c) => c.slug === p.categorySlug);
      await strapi.documents(TOPIC as never).create({
        data: {
          title: p.title.slice(0, 140),
          keyword: p.keyword.slice(0, 100),
          angle: p.angle.slice(0, 600),
          outline: p.outline,
          needsPersonalData: p.needsPersonalData,
          category: category?.documentId ?? null,
          status: 'propuesto',
          model: usage.model,
        } as never,
      });
      existingSlugs.add(slugify(p.title));
      created++;
    }
    strapi.log.info(`[editorial] ${created} temas propuestos (${usage.inputTokens}+${usage.outputTokens} tokens)`);
  } catch (error) {
    strapi.log.error(`[editorial] No se pudieron proponer temas: ${(error as Error).message}`);
  } finally {
    proposing = false;
  }
}

/** Marcadores que el autor debe completar antes de publicar. */
export function pendingPlaceholders(body: unknown): string[] {
  const text = JSON.stringify(body ?? '');
  return [...text.matchAll(/\[COMPLETAR:?([^\]]{0,120})\]/g)].map((m) => m[1].trim()).slice(0, 5);
}
