'use client';

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
