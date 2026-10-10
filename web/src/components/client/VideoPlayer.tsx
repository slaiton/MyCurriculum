'use client';

import { useState } from 'react';
import { PlayIcon } from '../Icons';

/**
 * Video de YouTube con carga diferida: hasta que el lector pulsa reproducir solo se descarga
 * la miniatura, sin scripts de terceros (mejor rendimiento y privacidad).
 */
export function YouTubeLite({ id, title }: { id: string; title: string }) {
  const [active, setActive] = useState(false);
  return (
    <div className="video">
      {active ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1`}
          title={title}
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" />
          <button type="button" className="video__play" onClick={() => setActive(true)} aria-label={`Reproducir video: ${title}`}>
            <span><PlayIcon /></span>
          </button>
        </>
      )}
    </div>
  );
}
