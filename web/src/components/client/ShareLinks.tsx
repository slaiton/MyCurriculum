'use client';

import { useState } from 'react';

/** Compartir con enlaces convencionales (sin scripts de redes sociales). */
export function ShareLinks({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* el navegador no permite portapapeles: no hacemos nada */
    }
  };

  return (
    <div className="share">
      <span className="meta" style={{ marginRight: 6 }}>Compartir:</span>
      <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${u}`} target="_blank" rel="noopener noreferrer">LinkedIn</a>
      <a href={`https://twitter.com/intent/tweet?url=${u}&text=${t}`} target="_blank" rel="noopener noreferrer">X</a>
      <a href={`https://wa.me/?text=${t}%20${u}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
      <button type="button" onClick={copy}>
        <span aria-live="polite">{copied ? 'Enlace copiado' : 'Copiar enlace'}</span>
      </button>
    </div>
  );
}
