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

/** Quita la sintaxis inline de Markdown (énfasis, código, enlaces) para obtener texto plano. */
export const plainMarkdown = (text: string) =>
  text
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[`*_~]/g, '')
    .trim();

/** Líneas de Markdown fuera de los bloques de código ``` o ~~~. */
function markdownProseLines(md: string): string[] {
  const lines: string[] = [];
  let inFence = false;
  for (const line of md.split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (!inFence) lines.push(line);
  }
  return lines;
}

/** Títulos de una sección Markdown. "#" y "##" cuentan como H2 (el H1 es el título del artículo); "###" como H3. */
export function markdownHeadings(md: string): { level: 2 | 3; text: string }[] {
  const out: { level: 2 | 3; text: string }[] = [];
  for (const line of markdownProseLines(md)) {
    const m = /^(#{1,3})\s+(.+?)\s*#*\s*$/.exec(line);
    if (m) out.push({ level: m[1].length === 3 ? 3 : 2, text: plainMarkdown(m[2]) });
  }
  return out;
}

/** Minutos de lectura estimados (200 palabras por minuto, mínimo 1). */
export function readingMinutes(body: BodySection[] = []): number {
  const text = body
    .map((s) => {
      if (s.__component === 'content.rich-text') return (s.content ?? []).map(blockText).join(' ');
      if (s.__component === 'content.markdown') return s.body ?? '';
      return '';
    })
    .join(' ');
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export interface Heading {
  id: string;
  text: string;
  level: 2 | 3;
}

/**
 * Títulos H2/H3 de todo el cuerpo, en orden y con ids únicos, para la tabla de contenido.
 * Body.tsx asigna los mismos ids, en el mismo orden, al renderizar.
 */
export function extractHeadings(body: BodySection[] = []): Heading[] {
  const raw: { level: 2 | 3; text: string }[] = [];
  for (const s of body) {
    if (s.__component === 'content.rich-text') {
      for (const block of s.content ?? []) {
        if (block.type === 'heading' && (block.level === 2 || block.level === 3)) raw.push({ level: block.level, text: inlineText(block.children) });
      }
    } else if (s.__component === 'content.markdown') {
      raw.push(...markdownHeadings(s.body ?? ''));
    }
  }
  const seen = new Map<string, number>();
  return raw.map(({ level, text }) => {
    const base = slugify(text) || 'seccion';
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return { id: count ? `${base}-${count + 1}` : base, text, level };
  });
}

/** Años completos desde una fecha ISO; se recalcula solo con cada revalidación. */
export function yearsSince(isoDate: string, now = new Date()): number {
  // Se leen año/mes/día del texto para no depender de la zona horaria del servidor.
  const [y, m, d] = isoDate.slice(0, 10).split('-').map(Number);
  let years = now.getFullYear() - y;
  const beforeAnniversary = now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d);
  if (beforeAnniversary) years -= 1;
  return Math.max(0, years);
}

// Las fechas sin hora ("2026-05-01") se formatean en UTC para no correr un día en Colombia (UTC-5);
// las fechas con hora (publishedAt) se muestran en hora de Bogotá.
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const fmt = (options: Intl.DateTimeFormatOptions) => ({
  local: new Intl.DateTimeFormat('es-CO', { ...options, timeZone: 'America/Bogota' }),
  utc: new Intl.DateTimeFormat('es-CO', { ...options, timeZone: 'UTC' }),
});
const formatWith = (f: ReturnType<typeof fmt>, iso: string) => (DATE_ONLY.test(iso) ? f.utc : f.local).format(new Date(iso));

const dayMonthYear = fmt({ day: '2-digit', month: 'short', year: 'numeric' });
export const formatDate = (iso?: string | null) => (iso ? formatWith(dayMonthYear, iso) : '');

const monthYear = fmt({ month: 'short', year: 'numeric' });
export const formatMonthYear = (iso?: string | null) => (iso ? formatWith(monthYear, iso) : 'Actualidad');

export const whatsappUrl = (number: string, text?: string) =>
  `https://wa.me/${number.replace(/\D/g, '')}${text ? `?text=${encodeURIComponent(text)}` : ''}`;

/** Acepta URLs de YouTube (watch, youtu.be, shorts) y devuelve el id del video. */
export function youtubeId(url?: string | null): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return match ? match[1] : null;
}
