// Webhook de Strapi: al publicar, retirar o editar contenido, invalida solo las páginas afectadas.
// Strapi > Settings > Webhooks: URL https://www.slaiton.com/api/revalidate, header x-revalidate-secret.
import { revalidateTag } from 'next/cache';
import { secretMatches, SLUG_RE } from '@/lib/secret';

const TAGS_BY_MODEL: Record<string, string[]> = {
  post: ['posts'],
  category: ['categories', 'posts'],
  tag: ['tags', 'posts'],
  project: ['projects'],
  'site-setting': ['profile'],
  experience: ['profile'],
  skill: ['profile'],
  redirect: ['redirects'],
};

export async function POST(request: Request) {
  if (!secretMatches(request.headers.get('x-revalidate-secret'), process.env.REVALIDATE_SECRET)) {
    return Response.json({ revalidated: false, message: 'No autorizado' }, { status: 401 });
  }

  let payload: { model?: string; entry?: { slug?: string } } = {};
  try {
    payload = await request.json();
  } catch {
    /* sin cuerpo: se invalida todo el contenido del CMS */
  }

  const tags = new Set(payload.model ? TAGS_BY_MODEL[payload.model] ?? ['cms'] : ['cms']);
  const slug = payload.entry?.slug;
  if (payload.model === 'post' && slug && SLUG_RE.test(slug)) tags.add(`post:${slug}`);

  // Viene de un webhook (no de un Server Action): expira de inmediato para que el cambio se vea al recargar.
  for (const tag of tags) revalidateTag(tag, { expire: 0 });
  return Response.json({ revalidated: true, tags: [...tags] });
}
