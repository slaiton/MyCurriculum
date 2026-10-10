import type { Metadata } from 'next';
import { BlogListing, pageFromParam } from '@/components/BlogListing';
import { getCategories, getPosts } from '@/lib/cms';

type Props = { searchParams: Promise<{ q?: string; page?: string }> };

export const metadata: Metadata = { title: 'Buscar', robots: { index: false, follow: true } };

export default async function SearchPage({ searchParams }: Props) {
  const { q: raw, page: p } = await searchParams;
  const q = (raw ?? '').trim().slice(0, 80);
  const page = pageFromParam(p);
  const [categories, result] = await Promise.all([
    getCategories(),
    q ? getPosts({ page, search: q }) : Promise.resolve({ items: [], page: 1, pageCount: 1, total: 0 }),
  ]);

  return (
    <BlogListing
      title={q ? `Resultados para “${q}”` : 'Buscar'}
      lead={q ? `${result.total} ${result.total === 1 ? 'artículo encontrado' : 'artículos encontrados'}.` : 'Escribe una palabra clave para buscar en el blog.'}
      crumbs={[
        { name: 'Inicio', href: '/' },
        { name: 'Blog', href: '/blog' },
        { name: 'Buscar', href: '/buscar' },
      ]}
      categories={categories}
      result={result}
      basePath="/buscar"
      query={{ q }}
      search={q}
      empty={{
        title: q ? `No encontré artículos para “${q}”` : 'Empieza una búsqueda',
        text: q ? 'Prueba con otra palabra o explora por tema. Si te interesa este tema, cuéntame y lo tengo en cuenta.' : 'Busca por título o resumen del artículo.',
      }}
    />
  );
}
