import type { Metadata } from 'next';
import { BlogListing, pageFromParam } from '@/components/BlogListing';
import { getCategories, getPosts } from '@/lib/cms';

type Props = { searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const page = pageFromParam((await searchParams).page);
  return {
    title: page > 1 ? `Blog — página ${page}` : 'Blog',
    description: 'Artículos sobre desarrollo de software, arquitectura, bases de datos, desarrollo web y móvil, y DevOps, escritos desde proyectos reales.',
    alternates: { canonical: page > 1 ? `/blog?page=${page}` : '/blog' },
  };
}

export default async function BlogPage({ searchParams }: Props) {
  const page = pageFromParam((await searchParams).page);
  const [categories, result] = await Promise.all([getCategories(), getPosts({ page })]);
  return (
    <BlogListing
      title="Blog"
      lead="Artículos sobre desarrollo de software, arquitectura, bases de datos y herramientas, escritos desde proyectos reales."
      crumbs={[{ name: 'Inicio', href: '/' }, { name: 'Blog', href: '/blog' }]}
      categories={categories}
      result={result}
      basePath="/blog"
      empty={{ title: 'Todavía no hay artículos publicados', text: 'Los primeros artículos están en preparación. Mientras tanto, puedes ver mis proyectos.' }}
    />
  );
}
