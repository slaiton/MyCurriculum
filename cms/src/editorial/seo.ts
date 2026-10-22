// SEO de proyectos: la IA propone palabras clave, título y descripción; se aplican con un clic o automáticamente.
import type { Core } from '@strapi/strapi';
import { EditorialError, suggestProjectSeo, type SeoSuggestion } from './llm';
import { getSettings } from './service';

const PROJECT = 'api::project.project';
const SETTINGS = 'api::editorial-setting.editorial-setting';

type Section = { __component: string; body?: string; content?: unknown };
interface ProjectDoc {
  documentId: string;
  title: string;
  summary: string;
  url?: string | null;
  body?: Section[];
  targetKeywords?: string | null;
  seo?: { metaTitle?: string | null; metaDescription?: string | null; keywords?: string[] | null } | null;
  seoSuggestion?: (SeoSuggestion & { model?: string; generatedAt?: string; appliedAt?: string | null; error?: string }) | null;
}

/** Texto plano del cuerpo (Markdown y bloques), para que la IA conozca lo que la página realmente dice. */
function bodyText(body: Section[] = []): string {
  const walk = (node: unknown): string =>
    Array.isArray(node) ? node.map(walk).join(' ') : node && typeof node === 'object'
      ? [(node as { text?: string }).text ?? '', walk((node as { children?: unknown }).children)].join(' ')
      : '';
  return body.map((s) => (s.__component === 'content.markdown' ? s.body ?? '' : s.__component === 'content.rich-text' ? walk(s.content) : '')).join('\n\n');
}

const splitKeywords = (text?: string | null) =>
  (text ?? '').split(/[\n,;]+/).map((t) => t.trim().toLowerCase()).filter(Boolean);

let running = false;

/** Genera sugerencias para un proyecto o para todos. Con "seoAutoApply" se aplican de inmediato. */
export async function runSeoSuggestions(strapi: Core.Strapi, documentId?: string) {
  if (running) throw new EditorialError('Ya hay una revisión de SEO en curso.');
  running = true;
  const results: { title: string; ok: boolean; message?: string }[] = [];
  try {
    const settings = await getSettings(strapi);
    const projects = (await strapi.documents(PROJECT as never).findMany({
      status: 'draft',
      filters: documentId ? { documentId } : {},
      populate: ['seo', 'body'],
      limit: 100,
    } as never)) as ProjectDoc[];

    for (const p of projects) {
      try {
        const { suggestion, usage } = await suggestProjectSeo(
          {
            title: p.title,
            summary: p.summary,
            url: p.url,
            body: bodyText(p.body),
            targetKeywords: splitKeywords(p.targetKeywords),
            previousKeywords: p.seo?.keywords ?? p.seoSuggestion?.keywords?.map((k) => k.term) ?? [],
          },
          { model: settings.model },
        );
        await strapi.documents(PROJECT as never).update({
          documentId: p.documentId,
          data: { seoSuggestion: { ...suggestion, model: usage.model, generatedAt: new Date().toISOString(), appliedAt: null } } as never,
        });
        if ((settings as { seoAutoApply?: boolean }).seoAutoApply) await applySeo(strapi, p.documentId);
        results.push({ title: p.title, ok: true });
      } catch (error) {
        const message = error instanceof EditorialError ? error.message : (error as Error).message;
        strapi.log.error(`[seo] ${p.title}: ${message}`);
        results.push({ title: p.title, ok: false, message });
      }
    }
    strapi.log.info(`[seo] Sugerencias: ${results.filter((r) => r.ok).length}/${results.length} proyectos`);
    return results;
  } finally {
    running = false;
  }
}

/**
 * Copia la sugerencia al SEO del proyecto. Si el proyecto está publicado, lo vuelve a publicar
 * (ojo: también publica otros cambios pendientes del borrador de ese proyecto).
 */
export async function applySeo(strapi: Core.Strapi, documentId: string) {
  const docs = strapi.documents(PROJECT as never);
  const draft = (await docs.findOne({ documentId, status: 'draft', populate: ['seo'] } as never)) as ProjectDoc | null;
  const s = draft?.seoSuggestion;
  if (!draft || !s?.metaDescription) throw new EditorialError('Este proyecto no tiene una sugerencia de SEO para aplicar.');

  const seo = { ...(draft.seo ?? {}), metaTitle: s.metaTitle, metaDescription: s.metaDescription, keywords: s.keywords.map((k) => k.term) };
  delete (seo as { id?: number }).id;
  await docs.update({ documentId, data: { seo, seoSuggestion: { ...s, appliedAt: new Date().toISOString() } } as never });
  const published = await docs.findOne({ documentId, status: 'published', fields: ['title'] } as never);
  if (published) await docs.publish({ documentId } as never);
}

export async function shouldRunMonthly(strapi: Core.Strapi) {
  const s = (await strapi.documents(SETTINGS as never).findFirst()) as { seoMonthly?: boolean } | null;
  return s?.seoMonthly !== false;
}
