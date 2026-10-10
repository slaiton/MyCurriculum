import Link from 'next/link';

/** Paginación con enlaces reales (rastreables), nunca carga infinita. */
export function Pagination({ page, pageCount, basePath, query = {} }: { page: number; pageCount: number; basePath: string; query?: Record<string, string | undefined> }) {
  if (pageCount <= 1) return null;
  const href = (n: number) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) if (v) params.set(k, v);
    if (n > 1) params.set('page', String(n));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);

  return (
    <nav className="pagination" aria-label="Paginación">
      {page > 1 ? <Link href={href(page - 1)} rel="prev">← Anteriores</Link> : <span className="disabled">← Anteriores</span>}
      <ol>
        {pages.map((n) => (
          <li key={n}>
            <Link href={href(n)} aria-current={n === page ? 'page' : undefined} aria-label={`Página ${n}`}>
              {n}
            </Link>
          </li>
        ))}
      </ol>
      {page < pageCount ? <Link href={href(page + 1)} rel="next" className="more-link">Siguientes →</Link> : <span className="disabled">Siguientes →</span>}
    </nav>
  );
}
