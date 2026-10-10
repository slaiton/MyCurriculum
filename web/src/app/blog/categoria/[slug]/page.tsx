import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BlogListing, pageFromParam } from '@/components/BlogListing';
import { getCategories, getCategory, getPosts } from '@/lib/cms';

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> };

export async function generateStaticParams() {
  return (await getCategories()).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ slug }, { page: p }] = await Promise.all([params, searchParams]);
  const category = await getCategory(slug);
  if (!category) return {};
  const page = pageFromParam(p);
  const base = `/blog/categoria/${slug}`;
  return {
    title: category.seo?.metaTitle || (page > 1 ? `${category.name} — página ${page}` : category.name),
    description: category.seo?.metaDescription || category.description || `Artículos sobre ${category.name.toLowerCase()}.`,
    alternates: { canonical: page > 1 ? `${base}?page=${page}` : base },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const [{ slug }, { page: p }] = await Promise.all([params, searchParams]);
  const category = await getCategory(slug);
  if (!category) notFound();
  const page = pageFromParam(p);
  const [categories, result] = await Promise.all([getCategories(), getPosts({ page, category: slug })]);

  return (
    <BlogListing
      title={category.name}
      lead={category.description}
      crumbs={[
        { name: 'Inicio', href: '/' },
        { name: 'Blog', href: '/blog' },
        { name: category.name, href: `/blog/categoria/${slug}` },
      ]}
      categories={categories}
      activeCategory={slug}
      result={result}
      basePath={`/blog/categoria/${slug}`}
      empty={{ title: `Aún no hay artículos en ${category.name}`, text: 'Explora otros temas o vuelve pronto.' }}
    />
  );
}
