import type { Metadata } from 'next';
import { ContactCTA, ProjectCard } from '@/components/Sections';
import { Breadcrumbs } from '@/components/Seo';
import { Reveal } from '@/components/client/Reveal';
import { getProjects, getSettings } from '@/lib/cms';

export const metadata: Metadata = {
  title: 'Proyectos',
  description: 'Aplicaciones en producción desarrolladas por Stiven Laiton: logística, comercio electrónico y automatización de datos.',
  alternates: { canonical: '/proyectos' },
};

export default async function ProjectsPage() {
  const [projects, settings] = await Promise.all([getProjects(), getSettings()]);
  return (
    <>
      <header className="container page-head">
        <Breadcrumbs items={[{ name: 'Inicio', href: '/' }, { name: 'Proyectos', href: '/proyectos' }]} />
        <h1>Proyectos</h1>
        <p>Aplicaciones que diseñé, construí y mantengo en producción.</p>
      </header>
      <section className="container" style={{ paddingBottom: 96 }}>
        <Reveal className="project-grid">
          {projects.map((p) => (
            <ProjectCard key={p.slug} project={p} headingLevel={2} />
          ))}
        </Reveal>
      </section>
      <ContactCTA settings={settings} />
    </>
  );
}
