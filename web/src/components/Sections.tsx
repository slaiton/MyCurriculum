// Bloques de página reutilizables: proyectos, CTA de contacto, estado vacío, tabla de contenido.
import Link from 'next/link';
import Image from 'next/image';
import type { ReactNode } from 'react';
import type { Heading } from '@/lib/content';
import { mediaUrl, whatsappUrl } from '@/lib/content';
import type { Project, SiteSettings } from '@/lib/types';
import { CategoryIcon, ExternalIcon, WhatsAppIcon } from './Icons';

export function ProjectCard({ project, headingLevel = 3 }: { project: Project; headingLevel?: 2 | 3 }) {
  const cover = mediaUrl(project.cover);
  const H = `h${headingLevel}` as const;
  return (
    <article className="project-card" data-color={project.color} data-reveal-item>
      <div className="project-card__media">
        {cover ? (
          <Image src={cover} alt={project.cover?.alternativeText ?? `Captura de ${project.title}`} fill sizes="(max-width: 900px) 100vw, 400px" />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-on)' }} aria-hidden>
            <CategoryIcon color={project.color} size={64} />
          </div>
        )}
      </div>
      <div className="project-card__body">
        <H>{project.title}</H>
        <p>{project.summary}</p>
        <div className="project-card__links">
          <Link href={`/proyectos/${project.slug}`}>Caso de estudio</Link>
          {project.url && (
            <a href={project.url} target="_blank" rel="noopener noreferrer">
              Abrir app <ExternalIcon size={14} />
              <span className="sr-only"> (abre en otra pestaña)</span>
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

export function ContactCTA({ settings }: { settings: SiteSettings }) {
  return (
    <section className="band-navy cta section" aria-labelledby="cta-title">
      <svg className="cta__deco" viewBox="0 0 420 420" aria-hidden>
        <circle cx="210" cy="210" r="200" fill="#102a4c" />
        <circle cx="210" cy="210" r="120" fill="#7c5cd6" opacity="0.35" />
        <circle cx="300" cy="300" r="60" fill="#f0465b" opacity="0.5" />
      </svg>
      <div className="container cta__inner">
        <div>
          <h2 id="cta-title">¿Tienes un proyecto o una pregunta técnica?</h2>
          <p>Escríbeme y conversamos. Respondo por WhatsApp o por correo.</p>
        </div>
        <div className="cta__actions">
          <a className="btn btn--whatsapp" href={whatsappUrl(settings.whatsapp, 'Hola Stiven, vi tu sitio y quiero conversar.')} target="_blank" rel="noopener noreferrer">
            <WhatsAppIcon /> Escríbeme por WhatsApp
          </a>
          <a href={`mailto:${settings.email}`}>{settings.email}</a>
        </div>
      </div>
    </section>
  );
}

export function EmptyState({ title, children, actions }: { title: string; children?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="empty">
      <h2>{title}</h2>
      {children && <p>{children}</p>}
      {actions && <div className="empty__actions">{actions}</div>}
    </div>
  );
}

export function TableOfContents({ headings }: { headings: Heading[] }) {
  if (headings.length < 3) return null;
  return (
    <nav className="toc" aria-labelledby="toc-title">
      <h2 id="toc-title">En este artículo</h2>
      <ol>
        {headings.map((h) => (
          <li key={h.id} className={h.level === 3 ? 'toc__sub' : undefined}>
            <a href={`#${h.id}`}>{h.text}</a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
