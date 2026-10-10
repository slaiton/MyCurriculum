import Link from 'next/link';
import { SITE_URL } from '@/lib/content';

/** Datos estructurados JSON-LD. El contenido se serializa escapando "<" para evitar inyección. */
export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />;
}

export interface Crumb {
  name: string;
  href: string;
}

/** Migas de pan visibles + BreadcrumbList. El último elemento es la página actual. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <>
      <nav className="breadcrumbs" aria-label="Ruta">
        <ol>
          {items.map((c, i) =>
            i === items.length - 1 ? (
              <li key={c.href} aria-current="page">{c.name}</li>
            ) : (
              <li key={c.href}><Link href={c.href}>{c.name}</Link></li>
            ),
          )}
        </ol>
      </nav>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: items.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: `${SITE_URL}${c.href}` })),
        }}
      />
    </>
  );
}
