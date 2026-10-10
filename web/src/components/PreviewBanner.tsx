import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';

async function exitPreview() {
  'use server';
  (await draftMode()).disable();
  redirect('/');
}

/** Aviso visible solo cuando se está viendo un borrador desde el CMS. */
export async function PreviewBanner() {
  const { isEnabled } = await draftMode();
  if (!isEnabled) return null;
  return (
    <aside className="preview-banner" role="status">
      Vista previa: estás viendo contenido sin publicar.
      <form action={exitPreview}>
        <button type="submit">Salir de la vista previa</button>
      </form>
    </aside>
  );
}
