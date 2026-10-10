// Contenido inicial: se carga UNA sola vez, solo si la base de datos está vacía (sin "Ajustes del sitio").
// Es el contenido real del sitio actual; después todo se edita desde el panel.
import type { Core } from '@strapi/strapi';

const settings = {
  name: 'Stiven Laiton',
  role: 'desarrollador de software',
  bio:
    'Ingeniero de Software Full Stack con habilidades para desarrollar soluciones tecnológicas innovadoras y a medida, ' +
    'con un enfoque en la optimización de procesos y la creación de aplicaciones robustas y eficientes. ' +
    'Proactivo, creativo y orientado a cumplir objetivos, me adapto rápido a los cambios y disfruto aprender nuevas tecnologías ' +
    'y enfrentar desafíos técnicos con iniciativa.',
  careerStartDate: '2018-02-18',
  whatsapp: '573046415909',
  email: 'jstivenlaiton@gmail.com',
  linkedinUrl: 'https://www.linkedin.com/in/stiven-laiton-3020a615a/',
  githubUrl: 'https://github.com/slaiton',
};

const categories = [
  { name: 'Arquitectura', slug: 'arquitectura', color: 'violet', description: 'Diseño de software, patrones y decisiones técnicas.' },
  { name: 'Bases de datos', slug: 'bases-de-datos', color: 'amber', description: 'Modelado, consultas y rendimiento en SQL y PostgreSQL.' },
  { name: 'Desarrollo web', slug: 'desarrollo-web', color: 'coral', description: 'Frontend y backend: Laravel, Angular, React y APIs.' },
  { name: 'Apps móviles', slug: 'apps-moviles', color: 'green', description: 'Desarrollo Android con Kotlin.' },
  { name: 'DevOps y herramientas', slug: 'devops', color: 'teal', description: 'Docker, servidores, despliegues y herramientas del día a día.' },
  { name: 'Experiencias', slug: 'experiencias', color: 'blue', description: 'Lecciones de proyectos reales.' },
];

const experiences = [
  {
    jobTitle: 'Analista de software',
    company: 'Aldia Logística',
    startDate: '2020-03-20',
    endDate: null,
    description:
      'Responsable del ciclo completo de desarrollo como Full Stack Developer. Proyectos en Kotlin, Laravel, Angular, React, Express, PHP y JavaScript. ' +
      'Despliegues en AWS y Docker. Bases de datos SQL y PostgreSQL. Arquitectura hexagonal y Clean Architecture. ' +
      'Integración de servicios REST y SOAP con clientes y proveedores. Aplicaciones Android y mantenimiento de soluciones web.',
  },
  {
    jobTitle: 'Desarrollador freelance',
    company: null,
    startDate: '2019-01-20',
    endDate: null,
    description:
      'Soluciones a medida para clientes independientes con Laravel, Angular y Kotlin, entre otros. Diseño y despliegue de APIs, ' +
      'integración de servicios web, administración de servidores y soporte.',
  },
  {
    jobTitle: 'Gestor de desarrollo',
    company: 'Aldia Logística',
    startDate: '2018-02-18',
    endDate: '2020-03-20',
    description:
      'Creación e integración de APIs para procesos logísticos. Desarrollo y administración del sitio corporativo en WordPress. ' +
      'Soluciones puntuales con Laravel y definición de objetivos técnicos del equipo.',
  },
  {
    jobTitle: 'Auxiliar de sistemas',
    company: 'Konecta',
    startDate: '2018-09-20',
    endDate: '2019-02-01',
    description: 'Soporte de primer nivel, mantenimiento preventivo y correctivo de equipos, diagnóstico de hardware y software.',
  },
];

const skills = [
  ['PHP', 95], ['Laravel', 95], ['SQL', 95], ['JavaScript', 90], ['Angular', 85], ['Kotlin', 80], ['Git', 80],
  ['Consola', 80], ['TypeScript', 75], ['C#', 65], ['React', 60], ['Docker', 60], ['AWS', 50],
] as const;

const projects = [
  { title: 'Print3D Market', slug: 'print3d-market', summary: 'Marketplace de impresión 3D con catálogo, búsqueda, filtros y cotización.', url: 'https://market.slaiton.com', color: 'coral', order: 1 },
  { title: 'CargoApp', slug: 'cargoapp', summary: 'Gestión logística de cargas, rutas y seguimiento de envíos.', url: 'https://cargo.slaiton.com', color: 'blue', order: 2 },
  { title: 'ScrapTools', slug: 'scraptools', summary: 'Suite de herramientas de scraping y automatización de datos.', url: 'https://scraptool.slaiton.com/', color: 'green', order: 3 },
];

export async function seedIfEmpty(strapi: Core.Strapi) {
  const existing = await strapi.documents('api::site-setting.site-setting').findFirst();
  if (existing) return;

  strapi.log.info('[seed] Base de datos vacía: cargando contenido inicial');
  await strapi.documents('api::site-setting.site-setting').create({ data: settings as never });
  for (const data of categories) await strapi.documents('api::category.category').create({ data: data as never });
  for (const data of experiences) await strapi.documents('api::experience.experience').create({ data: data as never });
  for (const [name, level] of skills) await strapi.documents('api::skill.skill').create({ data: { name, level } as never });
  for (const data of projects) {
    const doc = await strapi.documents('api::project.project').create({ data: data as never });
    await strapi.documents('api::project.project').publish({ documentId: doc.documentId });
  }
  strapi.log.info('[seed] Contenido inicial cargado');
}
