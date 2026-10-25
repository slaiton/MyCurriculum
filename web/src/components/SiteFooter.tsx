import Link from 'next/link';
import { CookieSettingsButton } from '@/components/client/CookieSettingsButton';
import type { SiteSettings } from '@/lib/types';
import { mediaUrl } from '@/lib/content';

const COLORS = ['violet', 'amber', 'coral', 'green', 'teal', 'blue'] as const;

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  return (
    <footer className="site-footer">
      <div className="container site-footer__top">
        <div>
          <p className="brand__name">{settings.name}</p>
          <p style={{ marginTop: 6, fontSize: 14 }}>{settings.role}</p>
          <div className="palette-strip" aria-hidden>
            {COLORS.map((c) => (
              <span key={c} data-color={c} />
            ))}
          </div>
        </div>
        <nav className="footer-nav" aria-label="Pie de página">
          <ul>
            <li><Link href="/blog">Blog</Link></li>
            <li><Link href="/proyectos">Proyectos</Link></li>
            <li><Link href="/sobre-mi">Sobre mí</Link></li>
            <li><Link href="/contacto">Contacto</Link></li>
          </ul>
          <ul>
            <li><a href={settings.linkedinUrl} rel="me noopener">LinkedIn</a></li>
            <li><a href={settings.githubUrl} rel="me noopener">GitHub</a></li>
            <li><a href={mediaUrl(settings.cv) ?? '/assets/files/HV.pdf'} download>Descargar CV</a></li>
          </ul>
        </nav>
      </div>
      <div className="container site-footer__bottom">
        <span>© {new Date().getFullYear()} {settings.name}</span>
        <CookieSettingsButton />
      </div>
    </footer>
  );
}
