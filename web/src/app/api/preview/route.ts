// Vista previa desde el panel de Strapi (config/admin.ts → preview.handler).
// Activa el draft mode de Next.js y redirige a la página del contenido. La ruta de destino se
// construye aquí a partir del tipo y del slug validado, nunca desde un parámetro libre (sin redirecciones abiertas).
import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';
import { secretMatches, SLUG_RE } from '@/lib/secret';

const PATH_BY_UID: Record<string, (slug: string) => string> = {
  'api::post.post': (slug) => `/blog/${slug}`,
  'api::project.project': (slug) => `/proyectos/${slug}`,
  'api::category.category': (slug) => `/blog/categoria/${slug}`,
};
const PROFILE_UIDS = new Set(['api::site-setting.site-setting', 'api::experience.experience', 'api::skill.skill']);

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  if (!secretMatches(params.get('secret'), process.env.PREVIEW_SECRET)) {
    return new Response('No autorizado', { status: 401 });
  }

  const uid = params.get('uid') ?? '';
  const slug = params.get('slug') ?? '';
  let path: string | null = null;
  if (PROFILE_UIDS.has(uid)) path = '/sobre-mi';
  else if (PATH_BY_UID[uid] && SLUG_RE.test(slug)) path = PATH_BY_UID[uid](slug);
  if (!path) return new Response('Contenido sin vista previa', { status: 400 });

  const draft = await draftMode();
  if (params.get('status') === 'published') draft.disable();
  else draft.enable();

  redirect(path);
}
