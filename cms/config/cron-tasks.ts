import type { Core } from '@strapi/strapi';

// Publicación programada sin el plan de pago (Releases): cada minuto publica las entradas
// cuyo "scheduledAt" ya pasó. Se limpia el campo antes de publicar para no republicar en bucle.
const SCHEDULABLE = ['api::post.post', 'api::project.project'] as const;

export default {
  publishScheduled: {
    task: async ({ strapi }: { strapi: Core.Strapi }) => {
      const now = new Date().toISOString();
      for (const uid of SCHEDULABLE) {
        const docs = strapi.documents(uid as 'api::post.post');
        const due = await docs.findMany({
          status: 'draft',
          filters: { scheduledAt: { $notNull: true, $lte: now } } as never,
          fields: ['title', 'scheduledAt'] as never,
        });
        for (const doc of due) {
          try {
            await docs.update({ documentId: doc.documentId, data: { scheduledAt: null } as never });
            await docs.publish({ documentId: doc.documentId });
            strapi.log.info(`[cron] Publicado: ${uid} ${doc.documentId}`);
          } catch (error) {
            strapi.log.error(`[cron] No se pudo publicar ${uid} ${doc.documentId}: ${(error as Error).message}`);
          }
        }
      }
    },
    options: { rule: '*/1 * * * *', tz: 'America/Bogota' },
  },
};
