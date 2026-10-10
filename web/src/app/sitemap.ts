import type { MetadataRoute } from 'next';
import { getAllPostSlugs, getCategories, getProjects } from '@/lib/cms';
import { SITE_URL } from '@/lib/content';

// Solo páginas indexables: sin etiquetas, búsqueda ni páginas de paginación.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, categories, projects] = await Promise.all([getAllPostSlugs(), getCategories(), getProjects()]);
  const now = new Date();
  return [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/blog`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/proyectos`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/sobre-mi`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/contacto`, changeFrequency: 'yearly', priority: 0.4 },
    ...categories.map((c) => ({ url: `${SITE_URL}/blog/categoria/${c.slug}`, changeFrequency: 'weekly' as const, priority: 0.6 })),
    ...projects.map((p) => ({ url: `${SITE_URL}/proyectos/${p.slug}`, changeFrequency: 'monthly' as const, priority: 0.6 })),
    ...posts.map((p) => ({
      url: `${SITE_URL}/blog/${p.slug}`,
      lastModified: new Date(p.contentUpdatedAt || p.publishedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  ];
}
