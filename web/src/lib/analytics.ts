/**
 * ID público de Google Analytics 4. Se inyecta en el build desde
 * `NEXT_PUBLIC_GA_ID`; si falta o no tiene el formato esperado, GA4
 * queda desactivado por completo (sin peticiones a Google).
 */
export const GA_ID = (() => {
  const id = process.env.NEXT_PUBLIC_GA_ID;
  return id && /^G-[A-Z0-9]+$/i.test(id) ? id : null;
})();
