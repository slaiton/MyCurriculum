import Image from 'next/image';
import { mediaUrl } from '@/lib/content';
import type { CategoryColor, Media } from '@/lib/types';
import { CategoryIcon } from './Icons';

/**
 * Portada de una publicación. Usa la imagen del CMS si existe; si no, una portada
 * ilustrada con el color e ícono de la categoría, para que el listado nunca se vea vacío.
 */
export function Cover({
  media,
  color = 'teal',
  ratio = '16x9',
  sizes = '(max-width: 900px) 100vw, 600px',
  priority = false,
  className = '',
}: {
  media?: Media | null;
  color?: CategoryColor;
  ratio?: '16x9' | '3x2' | '21x9' | '4x3';
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  const src = mediaUrl(media);
  const ratioClass = `cover--${ratio}`;

  return (
    <div className={`cover ${ratioClass} ${className}`} data-color={color} aria-hidden={src ? undefined : true}>
      {src ? (
        <Image src={src} alt={media?.alternativeText ?? ''} fill sizes={sizes} priority={priority} style={{ objectFit: 'cover' }} />
      ) : (
        <svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" aria-hidden>
          <rect width="320" height="180" fill="var(--c)" />
          <circle cx="285" cy="20" r="80" fill="#ffffff" opacity="0.14" />
          <circle cx="30" cy="170" r="60" fill="#0b1f3a" opacity="0.10" />
          <g transform="translate(130 60)" color="var(--c-on)" opacity="0.92">
            <CategoryIcon color={color} size={60} />
          </g>
        </svg>
      )}
    </div>
  );
}
