// Iconos de trazo inline (sin librería). Decorativos por defecto: aria-hidden.
import type { CategoryColor } from '@/lib/types';

type P = { size?: number };
const base = (size = 18) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
});

export const ArrowRight = ({ size }: P) => (
  <svg {...base(size)}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
export const ExternalIcon = ({ size }: P) => (
  <svg {...base(size)}><path d="M7 17 17 7M9 7h8v8" /></svg>
);
export const WhatsAppIcon = ({ size }: P) => (
  <svg {...base(size)}><path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.5L3 21l2-5.6A8.4 8.4 0 1 1 21 11.5z" /></svg>
);
export const SearchIcon = ({ size }: P) => (
  <svg {...base(size)}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
);
export const CopyIcon = ({ size }: P) => (
  <svg {...base(size)}><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>
);
export const PlayIcon = ({ size = 30 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M8 5v14l11-7z" /></svg>
);
export const MenuIcon = ({ size }: P) => (
  <svg {...base(size)}><path d="M4 7h16M4 12h16M4 17h16" /></svg>
);

/** Ícono asociado a cada color de categoría (coincide con los mockups). */
export function CategoryIcon({ color, size = 30 }: { color: CategoryColor; size?: number }) {
  const props = { ...base(size), strokeWidth: 1.6 };
  switch (color) {
    case 'violet':
      return <svg {...props}><polygon points="12,2 21,7 21,17 12,22 3,17 3,7" /></svg>;
    case 'amber':
      return <svg {...props}><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5" /><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" /></svg>;
    case 'coral':
      return <svg {...props}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M2 9h20" /></svg>;
    case 'green':
      return <svg {...props}><rect x="6" y="2" width="12" height="20" rx="2.5" /><path d="M11 18h2" /></svg>;
    case 'teal':
      return <svg {...props}><path d="m5 8 4 4-4 4M12 16h7" /></svg>;
    default:
      return <svg {...props}><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /></svg>;
  }
}
