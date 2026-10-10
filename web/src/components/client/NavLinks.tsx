'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/', label: 'Inicio' },
  { href: '/blog', label: 'Blog' },
  { href: '/proyectos', label: 'Proyectos' },
  { href: '/sobre-mi', label: 'Sobre mí' },
];

/** Enlaces del menú principal con la sección actual marcada (aria-current). */
export function NavLinks() {
  const pathname = usePathname() || '/';
  const isCurrent = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <nav className="nav" aria-label="Principal">
      {NAV.map((item) => (
        <Link key={item.href} href={item.href} aria-current={isCurrent(item.href) ? 'page' : undefined}>
          {item.label}
        </Link>
      ))}
      <Link href="/contacto" className="btn btn--dark">
        Escríbeme
      </Link>
    </nav>
  );
}
