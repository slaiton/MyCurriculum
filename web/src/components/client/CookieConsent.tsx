'use client';

import { useEffect, useState } from 'react';
import { closeConsentBanner, setConsent, useConsent, useConsentBannerOpen } from '@/lib/consent';

/**
 * Aviso de cookies con dos opciones equivalentes (aceptar / rechazar).
 * No se muestra si el sitio no tiene GA4 configurado.
 */
export function CookieConsent() {
  const consent = useConsent();
  const open = useConsentBannerOpen();
  const [mounted, setMounted] = useState(false);

  // Evita diferencias entre el HTML del servidor y el primer render del cliente.
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;
  if (!open && consent !== null) return null;

  return (
    <div
      className="cookie-banner"
      role="dialog"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-description"
    >
      <div className="cookie-banner__text">
        <p id="cookie-banner-title" className="cookie-banner__title">Cookies y analítica</p>
        <p id="cookie-banner-description">
          Uso Google Analytics 4 para medir visitas y saber qué contenidos son útiles. No se activa hasta que
          aceptes; puedes cambiar tu decisión cuando quieras desde «Preferencias de cookies».{' '}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
            Política de privacidad de Google
          </a>
          .
        </p>
      </div>
      <div className="cookie-banner__actions">
        <button type="button" className="btn btn--outline" onClick={() => setConsent('denied')}>
          Rechazar
        </button>
        <button type="button" className="btn btn--primary" onClick={() => setConsent('granted')}>
          Aceptar
        </button>
      </div>
      {consent !== null && (
        <button
          type="button"
          className="cookie-banner__close"
          onClick={closeConsentBanner}
          aria-label="Cerrar aviso de cookies"
        >
          ×
        </button>
      )}
    </div>
  );
}
