import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Body } from '@/components/Body';
import { Downloads } from '@/components/Downloads';
import { ExternalIcon } from '@/components/Icons';
import { ContactCTA } from '@/components/Sections';
import { Breadcrumbs, JsonLd } from '@/components/Seo';
import { getProjectBySlug, getProjects, getSettings } from '@/lib/cms';
import { mediaUrl, SITE_URL } from '@/lib/content';

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getProjects()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const project = await getProjectBySlug((await params).slug);
  if (!project) return {};
  return {
    title: project.seo?.metaTitle || project.title,
    description: project.seo?.metaDescription || project.summary,
    keywords: project.seo?.keywords?.length ? project.seo.keywords : undefined,
    alternates: { canonical: `/proyectos/${project.slug}` },
    openGraph: { type: 'article', title: project.title, description: project.summary, images: mediaUrl(project.cover) ? [mediaUrl(project.cover)!] : undefined },
  };
}

export default async function ProjectPage({ params }: Props) {
  const project = await getProjectBySlug((await params).slug);
  if (!project) notFound();
  const settings = await getSettings();
  const cover = mediaUrl(project.cover);
  const downloads = project.downloads ?? [];

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: project.title,
          description: project.seo?.metaDescription || project.summary,
          ...(project.seo?.keywords?.length && { keywords: project.seo.keywords.join(', ') }),
          url: project.url || `${SITE_URL}/proyectos/${project.slug}`,
          applicationCategory: downloads.length ? 'UtilitiesApplication' : 'WebApplication',
          ...(downloads.length && {
            operatingSystem: [...new Set(downloads.map((d) => (d.platform.startsWith('windows') ? 'Windows' : d.platform)))].join(', '),
            downloadUrl: downloads.map((d) => d.url),
            ...(project.version && { softwareVersion: project.version }),
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
          author: { '@type': 'Person', name: settings.name },
        }}
      />
      <header className="narrow article-head" data-color={project.color}>
        <Breadcrumbs
          items={[
            { name: 'Inicio', href: '/' },
            { name: 'Proyectos', href: '/proyectos' },
            { name: project.title, href: `/proyectos/${project.slug}` },
          ]}
        />
        <p className="meta" style={{ marginTop: 28 }}>
          <span className="badge">{downloads.length ? 'Aplicación' : 'Caso de estudio'}</span>
        </p>
        <h1>{project.title}</h1>
        <p className="lead">{project.summary}</p>
        {project.stack && project.stack.length > 0 && (
          <ul className="chip-list" aria-label="Tecnologías">
            {project.stack.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        )}
        <div className="hero__actions">
          {project.url && (
            <a href={project.url} className="btn btn--primary" target="_blank" rel="noopener noreferrer">
              Abrir la aplicación <ExternalIcon />
            </a>
          )}
          {downloads.length > 0 && (
            <a href="#descargas" className="btn btn--primary">
              Descargar{project.version ? ` v${project.version}` : ''}
            </a>
          )}
          {project.repoUrl && (
            <a href={project.repoUrl} className="btn btn--outline" target="_blank" rel="noopener noreferrer">
              Ver código
            </a>
          )}
        </div>
      </header>

      {cover && (
        <div className="article-cover">
          <div className="browser-frame">
            <div className="browser-frame__bar" aria-hidden><span /><span /><span /></div>
            <Image src={cover} alt={project.cover?.alternativeText ?? `Captura de ${project.title}`} width={project.cover?.width ?? 1600} height={project.cover?.height ?? 900} sizes="(max-width: 1100px) 100vw, 1080px" priority />
          </div>
        </div>
      )}

      <div className="narrow" style={{ paddingBlock: 56 }}>
        {downloads.length > 0 && <Downloads downloads={downloads} version={project.version} requirements={project.requirements} />}
        {project.body?.length ? <Body sections={project.body} /> : <p className="meta">El caso de estudio detallado se publicará pronto.</p>}
      </div>

      <ContactCTA settings={settings} />
    </>
  );
}
