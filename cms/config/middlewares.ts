import type { Core } from '@strapi/strapi';

const MAX_UPLOAD = 100 * 1024 * 1024;

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Middlewares => [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  {
    name: 'strapi::cors',
    config: {
      // El sitio lee el CMS desde el servidor; solo el propio sitio y el panel necesitan CORS.
      origin: env.array('CORS_ORIGINS', ['http://localhost:1337', 'http://localhost:3100']),
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  {
    name: 'strapi::body',
    config: {
      formidable: { maxFileSize: MAX_UPLOAD },
    },
  },
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];

export default config;
