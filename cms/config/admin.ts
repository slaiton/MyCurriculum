import type { Core } from '@strapi/strapi';

// Rutas públicas de cada tipo, para el botón "Vista previa" del panel.
const PREVIEW_TYPES = new Set(['api::post.post', 'api::project.project', 'api::category.category']);
const PROFILE_TYPES = new Set(['api::site-setting.site-setting', 'api::experience.experience', 'api::skill.skill']);

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Admin => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET'),
  },
  apiToken: {
    salt: env('API_TOKEN_SALT'),
  },
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT'),
    },
  },
  secrets: {
    encryptionKey: env('ENCRYPTION_KEY'),
  },
  flags: {
    nps: env.bool('FLAG_NPS', false),
    promoteEE: env.bool('FLAG_PROMOTE_EE', false),
    docLinks: env.bool('FLAG_DOC_LINKS', true),
  },
  preview: {
    enabled: Boolean(env('CLIENT_URL')),
    config: {
      allowedOrigins: [env('CLIENT_URL', '')].filter(Boolean),
      async handler(uid: string, { documentId, status }: { documentId: string; locale?: string; status: string }) {
        const isProfile = PROFILE_TYPES.has(uid);
        if (!isProfile && !PREVIEW_TYPES.has(uid)) return null;

        let slug = '';
        if (!isProfile) {
          const doc = await strapi.documents(uid as 'api::post.post').findOne({ documentId, status: 'draft', fields: ['slug'] });
          slug = (doc as { slug?: string } | null)?.slug ?? '';
          if (!slug) return null;
        }
        const params = new URLSearchParams({ secret: env('PREVIEW_SECRET', ''), uid, slug, status });
        return `${env('CLIENT_URL')}/api/preview?${params}`;
      },
    },
  },
});

export default config;
