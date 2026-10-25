'use client';

import Script from 'next/script';
import { useEffect } from 'react';
import { useConsent } from '@/lib/consent';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function clearAnalyticsCookies() {
  const names = document.cookie
    .split(';')
    .map((cookie) => cookie.split('=')[0]?.trim())
    .filter((name): name is string => Boolean(name))
    .filter((name) => name === '_ga' || name === '_gid' || name.startsWith('_ga_') || name.startsWith('_gat'));

  for (const name of names) {
    document.cookie = `${name}=; Max-Age=0; path=/`;
    document.cookie = `${name}=; Max-Age=0; path=/; domain=${window.location.hostname}`;
    document.cookie = `${name}=; Max-Age=0; path=/; domain=.${window.location.hostname}`;
  }
}

/**
 * Carga GA4 solo después de que la persona acepta el consentimiento.
 * Las navegaciones entre rutas las mide la "medición mejorada" de GA4
 * (cambios en el historial del navegador), por eso NO se envían pageviews
 * manuales: hacerlo duplicaría las visitas.
 */
export function Analytics({ gaId }: { gaId: string }) {
  const consent = useConsent();

  // Si se retira el consentimiento, se deja de medir y se borran las cookies.
  useEffect(() => {
    if (consent !== 'denied') return;
    window.gtag?.('consent', 'update', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });
    clearAnalyticsCookies();
  }, [consent]);

  if (consent !== 'granted') return null;

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
gtag('consent', 'default', {
  analytics_storage: 'denied',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied'
});
gtag('consent', 'update', { analytics_storage: 'granted' });
gtag('js', new Date());
gtag('config', ${id}, {
  allow_google_signals: false,
  allow_ad_personalization_signals: false
});
        `}
      </Script>
    </>
  );
}
