import type { Block, BodySection, InlineNode, Media } from './types';

export const SITE_URL = (process.env.SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
const CMS_PUBLIC_URL = process.env.CMS_PUBLIC_URL?.replace(/\/$/, '');

/** Convierte la URL relativa que entrega Strapi (/uploads/...) en absoluta. */
export function mediaUrl(media?: Media | null): string | null {
  if (!media?.url) return null;
  if (/^https?:\/\//.test(media.url) || !media.url.startsWith('/uploads/')) return media.url;
  return CMS_PUBLIC_URL ? `${CMS_PUBLIC_URL}${media.url}` : media.url;
}

export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const inlineText = (nodes: InlineNode[] = []): string =>
  nodes.map((n) => (n.type === 'link' ? inlineText(n.children) : n.text)).join('');

function blockText(block: Block): string {
  switch (block.type) {
    case 'list':
      return block.children.map((c) => (c.type === 'list-item' ? inlineText(c.children) : blockText(c))).join(' ');
    case 'code':
      return block.children.map((c) => c.text).join(' ');
    case 'image':
      return '';
    default:
      return inlineText(block.children);
  }
}

const richBlocks = (body: BodySection[] = []): Block[] =>
  body.flatMap((s) => (s.__component === 'content.rich-text' ? s.content ?? [] : []));

/** Minutos de lectura estimados (200 palabras por minuto, mínimo 1). */
export function readingMinutes(body: BodySection[] = []): number {
  const words = richBlocks(body)
    .map(blockText)
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export interface Heading {
  id: string;
  text: string;
  level: 2 | 3;
}

/** Encabezados H2/H3 del cuerpo, con ids estables y únicos, para la tabla de contenido. */
export function extractHeadings(body: BodySection[] = []): Heading[] {
  const seen = new Map<string, number>();
  const headings: Heading[] = [];
  for (const block of richBlocks(body)) {
    if (block.type !== 'heading' || (block.level !== 2 && block.level !== 3)) continue;
    const text = inlineText(block.children);
    const base = slugify(text) || 'seccion';
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    headings.push({ id: count ? `${base}-${count + 1}` : base, text, level: block.level });
  }
  return headings;
}

/** Años completos desde una fecha ISO; se recalcula solo con cada revalidación. */
export function yearsSince(isoDate: string, now = new Date()): number {
  const start = new Date(isoDate);
  let years = now.getFullYear() - start.getFullYear();
  const beforeAnniversary =
    now.getMonth() < start.getMonth() || (now.getMonth() === start.getMonth() && now.getDate() < start.getDate());
  if (beforeAnniversary) years -= 1;
  return Math.max(0, years);
}

const dateFormatter = new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'America/Bogota' });
export const formatDate = (iso?: string | null) => (iso ? dateFormatter.format(new Date(iso)) : '');

const monthYear = new Intl.DateTimeFormat('es-CO', { month: 'short', year: 'numeric', timeZone: 'America/Bogota' });
export const formatMonthYear = (iso?: string | null) => (iso ? monthYear.format(new Date(iso)) : 'Actualidad');

export const whatsappUrl = (number: string, text?: string) =>
  `https://wa.me/${number.replace(/\D/g, '')}${text ? `?text=${encodeURIComponent(text)}` : ''}`;

/** Acepta URLs de YouTube (watch, youtu.be, shorts) y devuelve el id del video. */
export function youtubeId(url?: string | null): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return match ? match[1] : null;
}
