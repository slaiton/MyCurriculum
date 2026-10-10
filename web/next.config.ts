import type { NextConfig } from 'next';

const cmsPublicUrl = process.env.CMS_PUBLIC_URL;

const remotePatterns: NonNullable<NextConfig['images']>['remotePatterns'] = [];
if (cmsPublicUrl) {
  const { protocol, hostname, port } = new URL(cmsPublicUrl);
  remotePatterns.push({
    protocol: protocol.replace(':', '') as 'http' | 'https',
    hostname,
    port,
    pathname: '/uploads/**',
  });
}

// El panel de Strapi carga la vista previa en un iframe: solo ese origen puede enmarcar el sitio.
const frameAncestors = ["'self'", cmsPublicUrl].filter(Boolean).join(' ');

const nextConfig: NextConfig = {
  output: 'standalone',
  // Monorepo: la raíz de este proyecto es /web (hay otro package-lock en la raíz del repo).
  turbopack: { root: process.cwd() },
  poweredByHeader: false,
  images: { remotePatterns },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: `frame-ancestors ${frameAncestors}` },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
