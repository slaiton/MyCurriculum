// Aviso al sitio (Next.js) cuando cambia contenido visible, para invalidar su caché al instante.
// Reemplaza al webhook manual del panel; si el aviso falla, el sitio se refresca solo en máximo 5 minutos.
import type { Core } from '@strapi/strapi';

// Modelos que el sitio muestra → nombre que entiende /api/revalidate.
const MODELS: Record<string, string> = {
  'api::post.post': 'post',
  'api::project.project': 'project',
  'api::category.category': 'category',
  'api::tag.tag': 'tag',
  'api::site-setting.site-setting': 'site-setting',
  'api::experience.experience': 'experience',
  'api::skill.skill': 'skill',
  'api::redirect.redirect': 'redirect',
};

// Con borrador/publicado solo importan publicar, retirar y borrar; el resto cambia en vivo al guardar.
const DRAFT_TYPES = new Set(['api::post.post', 'api::project.project']);
const LIVE_ACTIONS = new Set(['create', 'update', 'delete', 'publish', 'unpublish']);
const DRAFT_ACTIONS = new Set(['publish', 'unpublish', 'delete']);

const pending = new Map<string, { model: string; slug?: string }>();
let timer: NodeJS.Timeout | null = null;

export function notifySite(strapi: Core.Strapi, uid: string, action: string, result: unknown) {
  const model = MODELS[uid];
  const url = process.env.WEB_REVALIDATE_URL;
  const secret = process.env.REVALIDATE_SECRET;
  if (!model || !url || !secret) return;
  if (!(DRAFT_TYPES.has(uid) ? DRAFT_ACTIONS : LIVE_ACTIONS).has(action)) return;

  const doc = (Array.isArray((result as { entries?: unknown[] })?.entries) ? (result as { entries: unknown[] }).entries[0] : result) as
    | { slug?: string }
    | null;
  const slug = typeof doc?.slug === 'string' ? doc.slug : undefined;
  pending.set(`${model}:${slug ?? ''}`, { model, slug });

  // Agrupa cambios seguidos (p. ej. publicar varias entradas) en un solo lote.
  if (timer) return;
  timer = setTimeout(async () => {
    timer = null;
    const batch = [...pending.values()];
    pending.clear();
    for (const { model, slug } of batch) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-revalidate-secret': secret },
          body: JSON.stringify({ model, entry: slug ? { slug } : {} }),
          signal: AbortSignal.timeout(10_000),
        });
        if (!res.ok) strapi.log.warn(`[revalidate] El sitio respondió ${res.status} para ${model}`);
      } catch (error) {
        strapi.log.warn(`[revalidate] No se pudo avisar al sitio (${model}): ${(error as Error).message}`);
      }
    }
  }, 1500);
}
