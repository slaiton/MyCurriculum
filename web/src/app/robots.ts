import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/content';

export default function robots(): MetadataRoute.Robots {
  // Fuera de producción (p. ej. el subdominio de pruebas) no se indexa nada.
  const isProduction = SITE_URL === 'https://www.slaiton.com';
  return {
    rules: isProduction ? [{ userAgent: '*', allow: '/', disallow: ['/api/'] }] : [{ userAgent: '*', disallow: '/' }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
