// Datos de respaldo: el contenido real del sitio actual (src/components/* de la app CRA).
// Se usan cuando el CMS no está configurado o no responde, para que el sitio nunca quede vacío.
import type { Category, Experience, Post, Project, SiteSettings, Skill } from './types';

export const fallbackSettings: SiteSettings = {
  name: 'Stiven Laiton',
  role: 'desarrollador de software',
  bio:
    'Ingeniero de Sistemas con experiencia como desarrollador full stack, enfocado en crear soluciones tecnológicas a medida, ' +
    'optimizar procesos y construir aplicaciones robustas y eficientes. ' +
    'Proactivo, creativo y orientado a cumplir objetivos, me adapto rápido a los cambios y disfruto aprender nuevas tecnologías ' +
    'y enfrentar desafíos técnicos con iniciativa.',
  careerStartDate: '2018-02-18',
  whatsapp: '573046415909',
  email: 'jstivenlaiton@gmail.com',
  linkedinUrl: 'https://www.linkedin.com/in/stiven-laiton-3020a615a/',
  githubUrl: 'https://github.com/slaiton',
  cv: { url: '/assets/files/HV.pdf' },
};

export const fallbackCategories: Category[] = [
  { name: 'Arquitectura', slug: 'arquitectura', color: 'violet', description: 'Diseño de software, patrones y decisiones técnicas.' },
  { name: 'Bases de datos', slug: 'bases-de-datos', color: 'amber', description: 'Modelado, consultas y rendimiento en SQL y PostgreSQL.' },
  { name: 'Desarrollo web', slug: 'desarrollo-web', color: 'coral', description: 'Frontend y backend: Laravel, Angular, React y APIs.' },
  { name: 'Apps móviles', slug: 'apps-moviles', color: 'green', description: 'Desarrollo Android con Kotlin.' },
  { name: 'DevOps y herramientas', slug: 'devops', color: 'teal', description: 'Docker, servidores, despliegues y herramientas del día a día.' },
  { name: 'Experiencias', slug: 'experiencias', color: 'blue', description: 'Lecciones de proyectos reales.' },
];

export const fallbackExperiences: Experience[] = [
  {
    jobTitle: 'Desarrollador full stack líder',
    company: 'Aldia Logística',
    startDate: '2026-05-01',
    endDate: null,
    description:
      'Lidero el equipo de desarrollo y el ciclo completo de los proyectos full stack: Kotlin, Laravel, Angular, React, Express y PHP. ' +
      'Auditoría de código, prácticas DevOps y despliegues automatizados en AWS y Docker. Bases de datos SQL y PostgreSQL, ' +
      'arquitectura hexagonal y Clean Architecture, e integración de servicios REST y SOAP con clientes y proveedores.',
  },
  {
    jobTitle: 'Analista de software',
    company: 'Aldia Logística',
    startDate: '2020-03-20',
    endDate: '2026-05-01',
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

export const fallbackSkills: Skill[] = [
  { name: 'PHP', level: 95 },
  { name: 'Laravel', level: 95 },
  { name: 'SQL', level: 95 },
  { name: 'JavaScript', level: 90 },
  { name: 'Angular', level: 85 },
  { name: 'Kotlin', level: 80 },
  { name: 'Git', level: 80 },
  { name: 'Consola', level: 80 },
  { name: 'TypeScript', level: 75 },
  { name: 'C#', level: 65 },
  { name: 'React', level: 60 },
  { name: 'Docker', level: 60 },
  { name: 'AWS', level: 50 },
];

export const fallbackProjects: Project[] = [
  {
    documentId: 'fallback-market',
    title: 'Print3D Market',
    slug: 'print3d-market',
    summary: 'Marketplace de impresión 3D con catálogo, búsqueda, filtros y cotización.',
    url: 'https://market.slaiton.com',
    color: 'coral',
    stack: [],
    order: 1,
  },
  {
    documentId: 'fallback-cargo',
    title: 'CargoApp',
    slug: 'cargoapp',
    summary: 'Gestión logística de cargas, rutas y seguimiento de envíos.',
    url: 'https://cargo.slaiton.com',
    color: 'blue',
    stack: [],
    order: 2,
  },
  {
    documentId: 'fallback-scraptools',
    title: 'ScrapTools',
    slug: 'scraptools',
    summary: 'Suite de herramientas de scraping y automatización de datos.',
    url: 'https://scraptool.slaiton.com/',
    color: 'green',
    stack: [],
    order: 3,
  },
];

// Artículos de EJEMPLO. Solo se muestran con DEMO_CONTENT=true y sin CMS, para revisar el diseño en local.
const p = (text: string) => ({ type: 'paragraph' as const, children: [{ type: 'text' as const, text }] });
const h = (level: 2 | 3, text: string) => ({ type: 'heading' as const, level, children: [{ type: 'text' as const, text }] });

export const demoPosts: Post[] = [
  {
    documentId: 'demo-1',
    title: 'Arquitectura hexagonal en Laravel: cuándo vale la pena',
    slug: 'ejemplo-arquitectura-hexagonal-laravel',
    excerpt: 'Contenido de ejemplo para revisar el diseño: separar el dominio del framework en un sistema logístico.',
    category: fallbackCategories[0],
    tags: [{ name: 'laravel', slug: 'laravel' }, { name: 'arquitectura', slug: 'arquitectura' }],
    featured: true,
    publishedAt: '2026-10-08T12:00:00.000Z',
    contentUpdatedAt: '2026-10-10T12:00:00.000Z',
    body: [
      {
        __component: 'content.rich-text',
        id: 1,
        content: [
          h(2, 'El problema'),
          p('Cuando la lógica de negocio vive dentro de los controladores, cada cambio de proveedor obliga a tocar reglas que no deberían cambiar.'),
          h(2, 'Puertos y adaptadores'),
          p('El dominio define interfaces; la infraestructura las implementa.'),
          {
            type: 'code',
            language: 'php',
            children: [{ type: 'text', text: 'interface ShipmentRepository\n{\n    public function findByTracking(string $code): ?Shipment;\n}' }],
          },
          { type: 'quote', children: [{ type: 'text', text: 'Si para probar una regla necesitas la base de datos, la regla está en el lugar equivocado.' }] },
          {
            type: 'list',
            format: 'unordered',
            children: [
              { type: 'list-item', children: [{ type: 'text', text: 'El dominio no importa nada del framework.' }] },
              { type: 'list-item', children: [{ type: 'text', text: 'Los adaptadores se reemplazan sin tocar reglas.' }] },
            ],
          },
          h(2, 'Cuándo no usarla'),
          p('En un CRUD sin reglas propias, la capa extra no paga su costo.'),
        ],
      },
    ],
  },
  {
    documentId: 'demo-2',
    title: 'Índices en PostgreSQL que sí aceleran tus consultas',
    slug: 'ejemplo-indices-postgresql',
    excerpt: 'Contenido de ejemplo: leer EXPLAIN antes de crear índices al azar.',
    category: fallbackCategories[1],
    tags: [{ name: 'postgresql', slug: 'postgresql' }],
    publishedAt: '2026-09-24T12:00:00.000Z',
    body: [{ __component: 'content.rich-text', id: 1, content: [h(2, 'Empieza por EXPLAIN'), p('Texto de ejemplo.')] }],
  },
  {
    documentId: 'demo-3',
    title: 'Desplegar con Docker en un servidor propio, paso a paso',
    slug: 'ejemplo-docker-servidor-propio',
    excerpt: 'Contenido de ejemplo: Nginx, certificados y copias de seguridad sin servicios de pago.',
    category: fallbackCategories[4],
    tags: [{ name: 'docker', slug: 'docker' }],
    publishedAt: '2026-09-15T12:00:00.000Z',
    body: [{ __component: 'content.rich-text', id: 1, content: [h(2, 'Requisitos'), p('Texto de ejemplo.')] }],
  },
];
