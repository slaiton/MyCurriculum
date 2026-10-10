import type { Metadata } from 'next';
import Image from 'next/image';
import { ContactCTA } from '@/components/Sections';
import { Breadcrumbs, JsonLd } from '@/components/Seo';
import { Reveal } from '@/components/client/Reveal';
import { getExperiences, getSettings, getSkills } from '@/lib/cms';
import { formatMonthYear, mediaUrl, SITE_URL, yearsSince } from '@/lib/content';

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    title: 'Sobre mí',
    description: `${s.name}, ${s.role} con ${yearsSince(s.careerStartDate)} años de experiencia en Laravel, Kotlin, Angular, React, bases de datos y DevOps.`,
    alternates: { canonical: '/sobre-mi' },
    openGraph: { type: 'profile' },
  };
}

export default async function AboutPage() {
  const [settings, experiences, skills] = await Promise.all([getSettings(), getExperiences(), getSkills()]);
  const years = yearsSince(settings.careerStartDate);

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: settings.name,
          jobTitle: settings.role,
          url: `${SITE_URL}/sobre-mi`,
          image: `${SITE_URL}/perfil.jpg`,
          email: `mailto:${settings.email}`,
          sameAs: [settings.linkedinUrl, settings.githubUrl],
          knowsAbout: skills.map((s) => s.name),
        }}
      />
      <header className="container page-head">
        <Breadcrumbs items={[{ name: 'Inicio', href: '/' }, { name: 'Sobre mí', href: '/sobre-mi' }]} />
      </header>

      <section className="container profile" style={{ paddingBottom: 72 }}>
        <div className="profile__photo">
          <Image src="/perfil.jpg" alt={`Retrato de ${settings.name}`} width={300} height={360} priority />
        </div>
        <div className="profile__text">
          <h1 style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 700 }}>{settings.name}</h1>
          <p style={{ marginTop: 8, fontSize: 20, color: 'var(--teal-ink)', fontWeight: 600 }}>
            {settings.role.charAt(0).toUpperCase() + settings.role.slice(1)} · {years} años de experiencia
          </p>
          <p>{settings.bio}</p>
          <div className="link-row">
            <a href={mediaUrl(settings.cv) ?? '/assets/files/HV.pdf'} className="btn btn--primary" download>Descargar CV (PDF)</a>
            <a href={settings.linkedinUrl} className="btn btn--outline" rel="me noopener">LinkedIn</a>
            <a href={settings.githubUrl} className="btn btn--outline" rel="me noopener">GitHub</a>
          </div>
        </div>
      </section>

      <section className="band-white section" aria-labelledby="experiencia">
        <div className="container">
          <h2 id="experiencia" className="section-title" style={{ marginBottom: 24 }}>Experiencia</h2>
          <Reveal>
          <ol className="timeline">
            {experiences.map((e) => (
              <li key={`${e.jobTitle}-${e.startDate}`} data-reveal-item>
                <p className="timeline__date">
                  {formatMonthYear(e.startDate)} — {formatMonthYear(e.endDate)}
                </p>
                <div className="timeline__body">
                  <h3>{e.jobTitle}</h3>
                  {e.company && <p className="meta" style={{ marginTop: 2 }}>{e.company}</p>}
                  <p>{e.description}</p>
                </div>
              </li>
            ))}
          </ol>
          </Reveal>
        </div>
      </section>

      <section className="container section" aria-labelledby="habilidades">
        <h2 id="habilidades" className="section-title" style={{ marginBottom: 28 }}>Habilidades</h2>
        <Reveal>
        <ul className="skill-list">
          {skills.map((s) => (
            <li key={s.name} className="skill" data-reveal-item>
              <span>{s.name}</span>
              <span className="meta">{s.level}%</span>
              <span className="skill__bar" role="presentation"><span style={{ width: `${s.level}%` }} /></span>
            </li>
          ))}
        </ul>
        </Reveal>
      </section>

      <ContactCTA settings={settings} />
    </>
  );
}
