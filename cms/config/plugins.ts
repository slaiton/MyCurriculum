import type { Core } from '@strapi/strapi';

const MAX_UPLOAD = 100 * 1024 * 1024; // 100 MB (videos cortos). Debe coincidir con middlewares.ts y el proxy.

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Plugin => ({
  upload: {
    config: {
      sizeLimit: MAX_UPLOAD,
      // Se valida el tipo MIME real del archivo, no la extensión.
      security: {
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'video/mp4', 'video/webm', 'application/pdf'],
        deniedTypes: ['image/svg+xml', 'text/html', 'application/x-msdownload'],
      },
    },
  },
});

export default config;
