import type { Download } from '@/lib/types';

const PLATFORM: Record<Download['platform'], string> = {
  'windows-x64': 'Windows · Intel / AMD (x64)',
  'windows-arm64': 'Windows · ARM64 (Snapdragon)',
  macos: 'macOS',
  linux: 'Linux',
  android: 'Android',
  ios: 'iOS',
  otro: 'Descarga',
};

/** Bloque de instaladores de un proyecto: botón por plataforma, tamaño y huella SHA-256 para verificar. */
export function Downloads({ downloads, version, requirements }: { downloads: Download[]; version?: string | null; requirements?: string | null }) {
  const hasWindows = downloads.some((d) => d.platform.startsWith('windows'));
  return (
    <section className="downloads" aria-labelledby="descargas">
      <h2 id="descargas">Descargar{version ? ` · versión ${version}` : ''}</h2>
      <ul className="downloads__list">
        {downloads.map((d) => (
          <li key={d.url}>
            <a href={d.url} className="btn btn--primary" download>
              {d.label}
            </a>
            <span className="meta">
              {PLATFORM[d.platform]}
              {d.sizeMb ? ` · ${Number(d.sizeMb).toLocaleString('es-CO', { maximumFractionDigits: 1 })} MB` : ''}
            </span>
            {d.sha256 && (
              <details className="downloads__hash">
                <summary>Verificar archivo (SHA-256)</summary>
                <code>{d.sha256}</code>
              </details>
            )}
          </li>
        ))}
      </ul>
      {hasWindows && (
        <p className="meta">
          ¿Cuál elijo? La mayoría de PCs usan <strong>x64</strong>. Elige <strong>ARM64</strong> solo si tu equipo tiene procesador
          Snapdragon (Configuración → Sistema → Información → Tipo de sistema).
        </p>
      )}
      {requirements && <p className="meta">Requisitos: {requirements}</p>}
    </section>
  );
}
