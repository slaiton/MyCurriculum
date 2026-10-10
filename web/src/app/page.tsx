import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { CategoryIcon, ArrowRight } from '@/components/Icons';
import { PostCard, PostRow } from '@/components/PostCard';
import { ContactCTA, EmptyState, ProjectCard } from '@/components/Sections';
import { JsonLd } from '@/components/Seo';
import { CountUp } from '@/components/client/CountUp';
import { Reveal } from '@/components/client/Reveal';
import { getCategories, getFeaturedPosts, getPosts, getProjects, getSettings, getSkills } from '@/lib/cms';
import { mediaUrl, SITE_URL, yearsSince } from '@/lib/content';

export const metadata: Metadata = { alternates: { canonical: '/' } };

export default async function HomePage() {
  const [settings, categories, featuredRaw, latest, projects, skills] = await Promise.all([
    getSettings(),
    getCategories(),
    getFeaturedPosts(4),
    getPosts({ pageSize: 6 }),
    getProjects(),
    getSkills(),
  ]);
  const counts = await Promise.all(categories.map((c) => getPosts({ category: c.slug, pageSize: 1 }).then((r) => r.total)));

  // Destacados: primero los marcados en el CMS y se completa con los más recientes hasta 4.
  const featured = [...featuredRaw, ...latest.items.filter((p) => !featuredRaw.some((f) => f.slug === p.slug))].slice(0, 4);
  const [mainPost, ...sidePosts] = featured;
  const featuredSlugs = new Set(featured.map((p) => p.slug));
  const recent = latest.items.filter((p) => !featuredSlugs.has(p.slug)).slice(0, 3);
  const years = yearsSince(settings.careerStartDate);
  const heroVideo = mediaUrl(settings.heroVideo);
  const topSkills = skills.slice(0, 8);
  const COLORS = ['coral', 'violet', 'green', 'blue', 'amber', 'teal'] as const;

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: settings.name,
          url: SITE_URL,
          inLanguage: 'es',
          author: { '@type': 'Person', name: settings.name, url: `${SITE_URL}/sobre-mi` },
          potentialAction: { '@type': 'SearchAction', target: `${SITE_URL}/buscar?q={q}`, 'query-input': 'required name=q' },
        }}
      />

      <section className="container hero">
        <div className="hero__text">
          <p className="eyebrow">{'// blog y portafolio de desarrollo de software'}</p>
          <h1 className="hero__title">Software que resuelve, explicado desde la práctica.</h1>
          <p className="hero__lead">
            Soy {settings.name}, {settings.role}. Construyo aplicaciones web, móviles e integraciones, y escribo sobre arquitectura, bases de datos y
            herramientas que uso en proyectos reales.
          </p>
          <div className="hero__actions">
            <Link href="/blog" className="btn btn--primary">
              Leer el blog <ArrowRight />
            </Link>
            <Link href="/proyectos" className="btn btn--outline">
              Ver proyectos
            </Link>
          </div>
          <dl className="stats">
            <div className="stat" data-color="blue">
              <dt><CountUp value={years} /></dt>
              <dd>años de experiencia</dd>
            </div>
            <div className="stat" data-color="green">
              <dt><CountUp value={projects.length} /></dt>
              <dd>proyectos en producción</dd>
            </div>
            {latest.total > 0 && (
              <div className="stat" data-color="amber">
                <dt><CountUp value={latest.total} /></dt>
                <dd>artículos</dd>
              </div>
            )}
          </dl>
        </div>
        <figure className="hero__visual">
          <div className="hero__frame">
            {heroVideo ? (
              <video src={heroVideo} autoPlay muted loop playsInline preload="metadata" aria-hidden />
            ) : (
              <div className="hero__art" aria-hidden>
                <span><span className="k">const</span> perfil = {'{'}</span>
                <span>&nbsp;&nbsp;nombre: <span className="s">&apos;{settings.name}&apos;</span>,</span>
                <span>&nbsp;&nbsp;experiencia: <span className="n">{years}</span>,</span>
                <span>&nbsp;&nbsp;stack: [<span className="s">&apos;Laravel&apos;</span>, <span className="s">&apos;Kotlin&apos;</span>, <span className="s">&apos;Angular&apos;</span>],</span>
                <span>{'}'}</span>
                <span className="c">{'// escribo sobre lo que construyo'}</span>
              </div>
            )}
          </div>
          <div className="chip-float chip-float--bl" aria-hidden>
            <span style={{ color: 'var(--violet-ink)' }}>git</span> commit -m <span style={{ color: 'var(--coral-ink)' }}>&quot;nuevo artículo&quot;</span>
          </div>
        </figure>
      </section>

      <section className="band-navy section" aria-labelledby="destacados">
        <Reveal className="container">
          <div className="section-head">
            <h2 id="destacados" className="section-title">Destacados</h2>
            <Link href="/blog" className="more-link">Todas las publicaciones →</Link>
          </div>
          {mainPost ? (
            <div className="featured">
              <PostCard post={mainPost} variant="featured" priority />
              {sidePosts.length > 0 && (
                <div className="featured__side">
                  {sidePosts.map((p) => (
                    <PostRow key={p.slug} post={p} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="section-lead">Muy pronto: los primeros artículos están en preparación.</p>
          )}
        </Reveal>
      </section>

      <Reveal>
        <section className="container section" aria-labelledby="temas">
          <div className="section-head">
            <div>
              <h2 id="temas" className="section-title">Explora por tema</h2>
              <p className="section-lead">Cada tema tiene su color, que lo acompaña en etiquetas y portadas.</p>
            </div>
          </div>
          <ul className="topic-grid">
            {categories.map((c, i) => (
              <li key={c.slug} data-reveal-item>
                <Link href={`/blog/categoria/${c.slug}`} className="topic" data-color={c.color}>
                  <CategoryIcon color={c.color} />
                  <span>
                    <span className="topic__name">{c.name}</span>
                    <span className="topic__count">{counts[i] === 1 ? '1 artículo' : `${counts[i]} artículos`}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </Reveal>

      {recent.length > 0 && (
        <Reveal>
          <section className="container section" style={{ paddingTop: 0 }} aria-labelledby="recientes">
            <div className="section-head">
              <h2 id="recientes" className="section-title">Recientes</h2>
              <Link href="/blog" className="more-link">Ver todo el blog →</Link>
            </div>
            <div className="post-grid">
              {recent.map((p) => (
                <PostCard key={p.slug} post={p} />
              ))}
            </div>
          </section>
        </Reveal>
      )}

      <section className="band-white section" aria-labelledby="sobre">
        <Reveal className="container profile">
          <div className="profile__photo">
            <Image src="/perfil.jpg" alt={`Retrato de ${settings.name}`} width={300} height={360} />
          </div>
          <div className="profile__text">
            <h2 id="sobre" className="section-title">Sobre mí</h2>
            <p>{settings.bio}</p>
            <ul className="chip-list" aria-label="Tecnologías principales">
              {topSkills.map((s, i) => (
                <li key={s.name} data-color={COLORS[i % COLORS.length]}>{s.name}</li>
              ))}
            </ul>
            <div className="link-row">
              <Link href="/sobre-mi" className="more-link">Experiencia completa →</Link>
              <a href={mediaUrl(settings.cv) ?? '/assets/files/HV.pdf'} className="more-link" download>Descargar CV (PDF)</a>
            </div>
          </div>
        </Reveal>
      </section>

      <Reveal>
        <section className="container section" aria-labelledby="proyectos">
          <div className="section-head">
            <h2 id="proyectos" className="section-title">Proyectos en producción</h2>
            <Link href="/proyectos" className="more-link">Todos los proyectos →</Link>
          </div>
          {projects.length ? (
            <div className="project-grid">
              {projects.slice(0, 3).map((p) => (
                <ProjectCard key={p.slug} project={p} />
              ))}
            </div>
          ) : (
            <EmptyState title="Proyectos en preparación" />
          )}
        </section>
      </Reveal>

      <ContactCTA settings={settings} />
    </>
  );
}
