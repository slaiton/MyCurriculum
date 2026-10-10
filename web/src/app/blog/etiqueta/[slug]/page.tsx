import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BlogListing, pageFromParam } from '@/components/BlogListing';
import { getCategories, getPosts, getTag } from '@/lib/cms';

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> };

// Las etiquetas ayudan a navegar, pero no se indexan para evitar páginas delgadas o duplicadas.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tag = await getTag((await params).slug);
  return { title: tag ? `#${tag.name}` : 'Etiqueta', robots: { index: false, follow: true } };
}

export default async function TagPage({ params, searchParams }: Props) {
  const [{ slug }, { page: p }] = await Promise.all([params, searchParams]);
  const tag = await getTag(slug);
  if (!tag) notFound();
  const page = pageFromParam(p);
  const [categories, result] = await Promise.all([getCategories(), getPosts({ page, tag: slug })]);

  return (
    <BlogListing
      title={`#${tag.name}`}
      crumbs={[
        { name: 'Inicio', href: '/' },
        { name: 'Blog', href: '/blog' },
        { name: `#${tag.name}`, href: `/blog/etiqueta/${slug}` },
      ]}
      categories={categories}
      result={result}
      basePath={`/blog/etiqueta/${slug}`}
      empty={{ title: `No hay artículos con #${tag.name}`, text: 'Prueba con otra etiqueta o explora por tema.' }}
    />
  );
}
