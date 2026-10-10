// Cliente de lectura del CMS (Strapi 5, API REST). Solo se ejecuta en el servidor.
// Cada consulta lleva etiquetas de caché; /api/revalidate las invalida cuando Strapi publica cambios.
import { draftMode } from 'next/headers';
import {
  demoPosts,
  fallbackCategories,
  fallbackExperiences,
  fallbackProjects,
  fallbackSettings,
  fallbackSkills,
} from './fallback';
import type { Category, Experience, Paginated, Post, Project, SiteSettings, Skill, Tag } from './types';

const CMS_URL = process.env.CMS_URL?.replace(/\/$/, '');
const CMS_TOKEN = process.env.CMS_TOKEN;
const DEMO = process.env.DEMO_CONTENT === 'true' && process.env.NODE_ENV !== 'production';

// Red de seguridad: aunque falle un webhook, el contenido se refresca al menos cada hora.
const SAFETY_REVALIDATE = 3600;

export const isCmsEnabled = () => Boolean(CMS_URL);

type Query = Record<string, string | number | boolean | undefined>;

const toQueryString = (query: Query) =>
  Object.entries(query)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k).replace(/%5B/g, '[').replace(/%5D/g, ']')}=${encodeURIComponent(String(v))}`)
    .join('&');

interface StrapiList<T> {
  data: T[];
  meta?: { pagination?: { page: number; pageCount: number; total: number } };
}

// draftMode() solo existe dentro de una petición; en el build (generateStaticParams) se asume publicado.
async function isDraftRequest() {
  try {
    return (await draftMode()).isEnabled;
  } catch {
    return false;
  }
}

async function cmsGet<T>(path: string, query: Query, tags: string[]): Promise<T | null> {
  if (!CMS_URL) return null;
  const isDraft = await isDraftRequest();
  const qs = toQueryString({ ...query, status: isDraft ? 'draft' : undefined });
  try {
    const res = await fetch(`${CMS_URL}/api/${path}${qs ? `?${qs}` : ''}`, {
      headers: CMS_TOKEN ? { Authorization: `Bearer ${CMS_TOKEN}` } : undefined,
      cache: 'force-cache',
      next: { tags: ['cms', ...tags], revalidate: SAFETY_REVALIDATE },
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`CMS ${res.status} en ${path}`);
    return (await res.json()) as T;
  } catch (error) {
    // El sitio sigue funcionando con los datos de respaldo; el error queda en el log del servidor.
    console.error('[cms]', error);
    return null;
  }
}

const POST_LIST_POPULATE: Query = {
  'populate[cover]': true,
  'populate[category]': true,
  'fields[0]': 'title',
  'fields[1]': 'slug',
  'fields[2]': 'excerpt',
  'fields[3]': 'publishedAt',
  'fields[4]': 'featured',
  'fields[5]': 'contentUpdatedAt',
};

const POST_FULL_POPULATE: Query = {
  'populate[cover]': true,
  'populate[category]': true,
  'populate[tags]': true,
  'populate[seo][populate]': '*',
  'populate[body][on][content.rich-text]': true,
  'populate[body][on][content.video][populate]': '*',
  'populate[body][on][content.image][populate]': '*',
};

const paginate = <T,>(res: StrapiList<T> | null, fallback: T[], page: number, pageSize: number): Paginated<T> => {
  if (res) {
    const p = res.meta?.pagination;
    return { items: res.data, page: p?.page ?? page, pageCount: p?.pageCount ?? 1, total: p?.total ?? res.data.length };
  }
  const start = (page - 1) * pageSize;
  return {
    items: fallback.slice(start, start + pageSize),
    page,
    pageCount: Math.max(1, Math.ceil(fallback.length / pageSize)),
    total: fallback.length,
  };
};

const fallbackPosts = () => (CMS_URL ? [] : DEMO ? demoPosts : []);

// ---------------- Publicaciones ----------------

export async function getPosts(opts: { page?: number; pageSize?: number; category?: string; tag?: string; search?: string } = {}) {
  const { page = 1, pageSize = 9, category, tag, search } = opts;
  const res = await cmsGet<StrapiList<Post>>(
    'posts',
    {
      ...POST_LIST_POPULATE,
      'sort[0]': 'publishedAt:desc',
      'pagination[page]': page,
      'pagination[pageSize]': pageSize,
      'filters[category][slug][$eq]': category,
      'filters[tags][slug][$eq]': tag,
      'filters[$or][0][title][$containsi]': search,
      'filters[$or][1][excerpt][$containsi]': search,
    },
    ['posts'],
  );
  let local = fallbackPosts();
  if (category) local = local.filter((p) => p.category?.slug === category);
  if (tag) local = local.filter((p) => p.tags?.some((t) => t.slug === tag));
  if (search) {
    const q = search.toLowerCase();
    local = local.filter((p) => `${p.title} ${p.excerpt}`.toLowerCase().includes(q));
  }
  return paginate(res, local, page, pageSize);
}

export async function getFeaturedPosts(limit = 4): Promise<Post[]> {
  const res = await cmsGet<StrapiList<Post>>(
    'posts',
    { ...POST_LIST_POPULATE, 'filters[featured][$eq]': true, 'sort[0]': 'publishedAt:desc', 'pagination[pageSize]': limit },
    ['posts'],
  );
  return res ? res.data : fallbackPosts().filter((p) => p.featured).slice(0, limit);
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const res = await cmsGet<StrapiList<Post>>('posts', { ...POST_FULL_POPULATE, 'filters[slug][$eq]': slug }, ['posts', `post:${slug}`]);
  if (res) return res.data[0] ?? null;
  return fallbackPosts().find((p) => p.slug === slug) ?? null;
}

export async function getRelatedPosts(post: Post, limit = 3): Promise<Post[]> {
  if (!post.category) return [];
  const res = await cmsGet<StrapiList<Post>>(
    'posts',
    {
      ...POST_LIST_POPULATE,
      'filters[category][slug][$eq]': post.category.slug,
      'filters[slug][$ne]': post.slug,
      'sort[0]': 'publishedAt:desc',
      'pagination[pageSize]': limit,
    },
    ['posts'],
  );
  if (res) return res.data;
  return fallbackPosts()
    .filter((p) => p.slug !== post.slug && p.category?.slug === post.category?.slug)
    .slice(0, limit);
}

/** Todas las publicaciones (solo slug y fechas) para el sitemap. */
export async function getAllPostSlugs(): Promise<Pick<Post, 'slug' | 'publishedAt' | 'contentUpdatedAt'>[]> {
  const res = await cmsGet<StrapiList<Post>>(
    'posts',
    { 'fields[0]': 'slug', 'fields[1]': 'publishedAt', 'fields[2]': 'contentUpdatedAt', 'pagination[pageSize]': 1000 },
    ['posts'],
  );
  return res ? res.data : fallbackPosts();
}

// ---------------- Taxonomías ----------------

export async function getCategories(): Promise<Category[]> {
  const res = await cmsGet<StrapiList<Category>>('categories', { 'sort[0]': 'name:asc', 'populate[seo]': true }, ['categories']);
  return res?.data.length ? res.data : fallbackCategories;
}

export async function getCategory(slug: string): Promise<Category | null> {
  return (await getCategories()).find((c) => c.slug === slug) ?? null;
}

export async function getTag(slug: string): Promise<Tag | null> {
  const res = await cmsGet<StrapiList<Tag>>('tags', { 'filters[slug][$eq]': slug }, ['tags']);
  if (res) return res.data[0] ?? null;
  for (const post of fallbackPosts()) {
    const found = post.tags?.find((t) => t.slug === slug);
    if (found) return found;
  }
  return null;
}

/** Busca una redirección registrada (p. ej. tras cambiar un slug). */
export async function findRedirect(fromPath: string): Promise<string | null> {
  const res = await cmsGet<StrapiList<{ from: string; to: string }>>('redirects', { 'filters[from][$eq]': fromPath }, ['redirects']);
  return res?.data[0]?.to ?? null;
}

// ---------------- Proyectos y perfil ----------------

export async function getProjects(): Promise<Project[]> {
  const res = await cmsGet<StrapiList<Project>>(
    'projects',
    { 'populate[cover]': true, 'sort[0]': 'order:asc', 'pagination[pageSize]': 50 },
    ['projects'],
  );
  return res?.data.length ? res.data : fallbackProjects;
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const res = await cmsGet<StrapiList<Project>>(
    'projects',
    {
      'filters[slug][$eq]': slug,
      'populate[cover]': true,
      'populate[seo][populate]': '*',
      'populate[body][on][content.rich-text]': true,
      'populate[body][on][content.video][populate]': '*',
      'populate[body][on][content.image][populate]': '*',
    },
    ['projects'],
  );
  if (res?.data.length) return res.data[0];
  return fallbackProjects.find((p) => p.slug === slug) ?? null;
}

export async function getSettings(): Promise<SiteSettings> {
  const res = await cmsGet<{ data: SiteSettings | null }>(
    'site-setting',
    { 'populate[cv]': true, 'populate[heroVideo]': true, 'populate[seo][populate]': '*' },
    ['profile'],
  );
  return res?.data ? { ...fallbackSettings, ...res.data } : fallbackSettings;
}

export async function getExperiences(): Promise<Experience[]> {
  const res = await cmsGet<StrapiList<Experience>>('experiences', { 'sort[0]': 'startDate:desc', 'pagination[pageSize]': 50 }, ['profile']);
  return res?.data.length ? res.data : fallbackExperiences;
}

export async function getSkills(): Promise<Skill[]> {
  const res = await cmsGet<StrapiList<Skill>>('skills', { 'sort[0]': 'level:desc', 'pagination[pageSize]': 100 }, ['profile']);
  return res?.data.length ? res.data : fallbackSkills;
}
