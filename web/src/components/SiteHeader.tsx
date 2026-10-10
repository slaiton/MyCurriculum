import Link from 'next/link';
import { HeaderScrollState } from './client/HeaderScrollState';
import { NavLinks } from './client/NavLinks';
import { MenuIcon } from './Icons';

export function SiteHeader({ name, role }: { name: string; role: string }) {
  return (
    <header className="site-header" id="site-header">
      <HeaderScrollState targetId="site-header" />
      <div className="container site-header__inner">
        <Link href="/" className="brand" aria-label={`${name}, inicio`}>
          <span className="brand__name">{name}</span>
          <span className="brand__role">{role}</span>
        </Link>
        <NavLinks />
        {/* Menú móvil sin JavaScript: <details> es accesible por teclado y lector de pantalla. */}
        <details className="menu-toggle">
          <summary>
            <MenuIcon /> Menú
          </summary>
          <NavLinks />
        </details>
      </div>
    </header>
  );
}
