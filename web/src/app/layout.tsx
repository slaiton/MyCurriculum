import type { Metadata, Viewport } from 'next';
import { Caveat, Figtree, Fira_Code, Sora } from 'next/font/google';
import { Analytics } from '@/components/client/Analytics';
import { CookieConsent } from '@/components/client/CookieConsent';
import { PreviewBanner } from '@/components/PreviewBanner';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { GA_ID } from '@/lib/analytics';
import { getSettings } from '@/lib/cms';
import { SITE_URL } from '@/lib/content';
import './globals.css';

// next/font descarga las fuentes en el build y las sirve desde el propio sitio (sin peticiones a Google).
const display = Sora({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-display', display: 'swap' });
const body = Figtree({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-body', display: 'swap' });
const mono = Fira_Code({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono', display: 'swap' });
const signature = Caveat({ subsets: ['latin'], weight: ['600'], variable: '--font-signature', display: 'swap' });

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const title = `${s.name} — ${s.role.charAt(0).toUpperCase()}${s.role.slice(1)}`;
  const description =
    s.seo?.metaDescription ||
    'Blog y portafolio de Stiven Laiton, desarrollador de software: arquitectura, bases de datos, desarrollo web y móvil, DevOps y proyectos reales.';
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s · ${s.name}` },
    description,
    applicationName: s.name,
    authors: [{ name: s.name, url: SITE_URL }],
    openGraph: { type: 'website', locale: 'es_CO', siteName: s.name, title, description, url: '/' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export const viewport: Viewport = { themeColor: '#0b1f3a', width: 'device-width', initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  return (
    <html lang="es" className={`${display.variable} ${body.variable} ${mono.variable} ${signature.variable}`}>
      <body>
        <a href="#contenido" className="skip-link">Saltar al contenido</a>
        <PreviewBanner />
        <SiteHeader name={settings.name} role={settings.role} />
        <main id="contenido">{children}</main>
        <SiteFooter settings={settings} />
        {GA_ID && (
          <>
            <Analytics gaId={GA_ID} />
            <CookieConsent />
          </>
        )}
      </body>
    </html>
  );
}
