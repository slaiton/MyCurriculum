'use client';

import Script from 'next/script';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Etiqueta de Google Analytics 4, cargada directamente y sin aviso de consentimiento.
 *
 * MEDIDA TEMPORAL: el código de consentimiento sigue en `web/src/lib/consent.ts`,
 * `CookieConsent.tsx` y `CookieSettingsButton.tsx`, pero no se monta. Para volver
 * al Consent Mode v2 + banner basta con restaurar esas piezas en el layout y el pie.
 *
 * Las navegaciones entre rutas las mide la "medición mejorada" de GA4
 * (cambios en el historial del navegador), por eso NO se envían pageviews
 * manuales: hacerlo duplicaría las visitas.
 */
export function Analytics({ gaId }: { gaId: string }) {
  const id = JSON.stringify(gaId);

  return (
    <>
      <Script
        id="ga4-src"
        src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
window.dataLayer = window.dataLayer || [];
function gtag(){window.dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', ${id});
        `}
      </Script>
    </>
  );
}
