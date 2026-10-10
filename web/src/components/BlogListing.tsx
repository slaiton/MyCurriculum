import Link from 'next/link';
import type { ReactNode } from 'react';
import type { Category, Paginated, Post } from '@/lib/types';
import { SearchIcon } from './Icons';
import { Pagination } from './Pagination';
import { PostCard } from './PostCard';
import { EmptyState } from './Sections';
import { Breadcrumbs, type Crumb } from './Seo';

/** Página de listado compartida por blog, categoría, etiqueta y búsqueda. */
export function BlogListing({
  title,
  lead,
  crumbs,
  categories,
  activeCategory,
  result,
  basePath,
  query,
  search,
  empty,
}: {
  title: string;
  lead?: ReactNode;
  crumbs: Crumb[];
  categories: Category[];
  activeCategory?: string;
  result: Paginated<Post>;
  basePath: string;
  query?: Record<string, string | undefined>;
  search?: string;
  empty: { title: string; text: ReactNode };
}) {
  return (
    <>
      <header className="container page-head">
        <Breadcrumbs items={crumbs} />
        <h1>{title}</h1>
        {lead && <p>{lead}</p>}
      </header>

      <section className="container" style={{ paddingBottom: 96 }} aria-label="Publicaciones">
        <div className="filters">
          <ul className="pill-list" aria-label="Categorías">
            <li>
              <Link href="/blog" className="pill" aria-current={!activeCategory && !search ? 'page' : undefined}>Todas</Link>
            </li>
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={`/blog/categoria/${c.slug}`} className="pill" data-color={c.color} aria-current={activeCategory === c.slug ? 'page' : undefined}>
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
          <form role="search" action="/buscar" className="search">
            <SearchIcon />
            <label htmlFor="q" className="sr-only">Buscar artículos</label>
            <input id="q" name="q" type="search" placeholder="Buscar artículos" defaultValue={search} />
            <button type="submit">Buscar</button>
          </form>
        </div>

        {result.items.length ? (
          <div className="post-grid">
            {result.items.map((post, i) => (
              <PostCard key={post.slug} post={post} priority={i < 2} />
            ))}
          </div>
        ) : (
          <EmptyState
            title={empty.title}
            actions={
              <>
                <Link href="/blog" className="btn btn--outline">Ver todas las publicaciones</Link>
                <Link href="/contacto" className="more-link">Sugerir un tema</Link>
              </>
            }
          >
            {empty.text}
          </EmptyState>
        )}

        <Pagination page={result.page} pageCount={result.pageCount} basePath={basePath} query={query} />
      </section>
    </>
  );
}

export const pageFromParam = (value?: string | string[]) => {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) && n > 0 ? n : 1;
};
