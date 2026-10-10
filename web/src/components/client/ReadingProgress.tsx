'use client';

import { useEffect, useRef } from 'react';

/** Barra de progreso de lectura del artículo. Escribe el estilo directamente (sin re-render por scroll). */
export function ReadingProgress({ targetId }: { targetId: string }) {
  const bar = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target || !bar.current) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = target.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const progress = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 1;
      if (bar.current) bar.current.style.transform = `scaleX(${progress})`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(frame);
    };
  }, [targetId]);

  return (
    <div className="reading-progress" aria-hidden>
      <span ref={bar} />
    </div>
  );
}
