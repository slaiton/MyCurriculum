import { timingSafeEqual } from 'node:crypto';

/** Compara secretos en tiempo constante. Falla cerrado si el secreto esperado no está configurado. */
export function secretMatches(received: string | null, expected: string | undefined): boolean {
  if (!expected || !received) return false;
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
