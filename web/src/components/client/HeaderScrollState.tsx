'use client';

import { useEffect } from 'react';

/** Marca el header cuando la página se desplaza (borde y sombra). No re-renderiza nada. */
export function HeaderScrollState({ targetId }: { targetId: string }) {
  useEffect(() => {
    const el = document.getElementById(targetId);
    if (!el) return;
    const update = () => el.setAttribute('data-scrolled', String(window.scrollY > 8));
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, [targetId]);
  return null;
}
