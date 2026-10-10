import type { Metadata } from 'next';
import { WhatsAppIcon } from '@/components/Icons';
import { Breadcrumbs } from '@/components/Seo';
import { ContactForm } from '@/components/client/ContactForm';
import { getSettings } from '@/lib/cms';
import { whatsappUrl } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Contacto',
  description: 'Escríbele a Stiven Laiton por WhatsApp o correo para conversar sobre un proyecto de software o una pregunta técnica.',
  alternates: { canonical: '/contacto' },
};

export default async function ContactPage() {
  const s = await getSettings();
  return (
    <>
      <header className="container page-head">
        <Breadcrumbs items={[{ name: 'Inicio', href: '/' }, { name: 'Contacto', href: '/contacto' }]} />
        <h1>Hablemos</h1>
        <p>Cuéntame tu proyecto o tu pregunta. El formulario abre WhatsApp con tu mensaje listo; no se guarda ningún dato en este sitio.</p>
      </header>
      <section className="container" style={{ paddingBottom: 96, display: 'flex', flexWrap: 'wrap', gap: 56 }}>
        <div style={{ flex: '999 1 480px', minWidth: 0 }}>
          <ContactForm whatsapp={s.whatsapp} />
        </div>
        <aside style={{ flex: '1 1 260px' }} aria-label="Otros canales">
          <h2 style={{ fontSize: 20 }}>Otros canales</h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: '16px 0 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <li>
              <a href={whatsappUrl(s.whatsapp)} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                <WhatsAppIcon /> WhatsApp
              </a>
            </li>
            <li><a href={`mailto:${s.email}`}>{s.email}</a></li>
            <li><a href={s.linkedinUrl} rel="me noopener">LinkedIn</a></li>
            <li><a href={s.githubUrl} rel="me noopener">GitHub</a></li>
          </ul>
        </aside>
      </section>
    </>
  );
}
