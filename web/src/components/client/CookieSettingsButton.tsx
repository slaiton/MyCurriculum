'use client';

// NOTA: no está montado (medida temporal, GA4 se carga sin consentimiento).
// Se conserva para reactivar «Preferencias de cookies» más adelante.

import { GA_ID } from '@/lib/analytics';
import { openConsentBanner } from '@/lib/consent';

/** Enlace del pie para volver a abrir el aviso y cambiar la decisión. */
export function CookieSettingsButton() {
  if (!GA_ID) return null;
  return (
    <button type="button" className="footer-link-btn" onClick={openConsentBanner}>
      Preferencias de cookies
    </button>
  );
}
