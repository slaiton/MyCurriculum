'use strict';

const controller = require('./controller');

module.exports = {
  register() {},
  bootstrap({ strapi }) {
    strapi.log.info('[estudio] Estudio editorial cargado');
  },
  controllers: { estudio: controller },
  routes: {
    // Rutas de administración: Strapi exige sesión de administrador por defecto; además se declara la política.
    admin: {
      type: 'admin',
      routes: [
        ['GET', '/resumen', 'resumen'],
        ['POST', '/proponer', 'proponer'],
        ['POST', '/temas', 'crearTema'],
        ['POST', '/temas/:documentId/estado', 'cambiarEstado'],
        ['POST', '/borradores/:documentId/publicar', 'publicar'],
        ['PUT', '/ajustes', 'ajustes'],
        ['GET', '/seo', 'seoListar'],
        ['POST', '/seo/generar', 'seoGenerar'],
        ['POST', '/seo/:documentId/aplicar', 'seoAplicar'],
        ['PUT', '/seo/:documentId/objetivo', 'seoObjetivo'],
      ].map(([method, path, action]) => ({
        method,
        path,
        handler: `estudio.${action}`,
        config: { policies: ['admin::isAuthenticatedAdmin'] },
      })),
    },
  },
};
