import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Stiven Laiton — Desarrollador de software',
    short_name: 'Stiven Laiton',
    description: 'Blog y portafolio de desarrollo de software.',
    lang: 'es',
    start_url: '/',
    display: 'standalone',
    background_color: '#faf8f4',
    theme_color: '#0b1f3a',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
  };
}
