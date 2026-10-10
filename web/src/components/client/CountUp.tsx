'use client';

import { useEffect, useRef } from 'react';

/**
 * Cifra que cuenta desde 0 al cargar. El HTML ya trae el valor final (SEO y sin JS);
 * la animación solo ocurre si el usuario no pidió movimiento reducido.
 */
export function CountUp({ value, duration = 1400 }: { value: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || value <= 0 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = String(Math.round(eased * value));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    el.textContent = '0';
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      el.textContent = String(value);
    };
  }, [value, duration]);

  return <span ref={ref}>{value}</span>;
}
