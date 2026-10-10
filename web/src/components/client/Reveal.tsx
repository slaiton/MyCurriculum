'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/**
 * Aparición al hacer scroll. Si el bloque contiene elementos con `data-reveal-item`
 * (tarjetas, filas, temas), entran escalonados; si no, entra el bloque completo.
 * Solo anima lo que empieza fuera de la vista: lo visible al cargar nunca parpadea.
 * Se revela al entrar en pantalla o si ya quedó por encima (saltos con anclas, tecla Fin,
 * volver atrás), así nunca queda contenido oculto. Sin JS o con movimiento reducido, todo se ve normal.
 */
export function Reveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const threshold = () => window.innerHeight * 0.88;
    if (el.getBoundingClientRect().top < threshold()) return;

    const items = el.querySelectorAll<HTMLElement>('[data-reveal-item]');
    // El retraso se reinicia cada 6 elementos para que las listas largas no tarden demasiado.
    items.forEach((item, i) => item.style.setProperty('--i', String(i % 6)));
    el.classList.add('reveal', items.length ? 'reveal--items' : 'reveal--block');

    let frame = 0;
    const check = () => {
      frame = 0;
      if (el.getBoundingClientRect().top < threshold()) {
        el.setAttribute('data-visible', 'true');
        cleanup();
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(check);
    };
    const cleanup = () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(frame);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return cleanup;
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
