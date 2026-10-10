import Link from 'next/link';
import { EmptyState } from '@/components/Sections';

export default function NotFound() {
  return (
    <section className="container section">
      <EmptyState
        title="No encontré esta página"
        actions={
          <>
            <Link href="/blog" className="btn btn--outline">Ir al blog</Link>
            <Link href="/" className="more-link">Volver al inicio</Link>
          </>
        }
      >
        Puede que el enlace haya cambiado o que el contenido ya no esté disponible.
      </EmptyState>
    </section>
  );
}
