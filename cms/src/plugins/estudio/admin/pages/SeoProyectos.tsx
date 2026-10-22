import { useCallback, useEffect, useState } from 'react';
import { useFetchClient, useNotification } from '@strapi/strapi/admin';
import { Badge, Box, Button, Divider, Field, Flex, Textarea, Toggle, Typography } from '@strapi/design-system';
import { Check, Magic } from '@strapi/icons';

interface Keyword {
  term: string;
  type: 'principal' | 'secundaria' | 'long-tail';
  intent: string;
  language: 'es' | 'en';
}

interface SeoProject {
  documentId: string;
  title: string;
  slug: string;
  targetKeywords?: string | null;
  publishedAt: string | null;
  seo?: { metaTitle?: string | null; metaDescription?: string | null; keywords?: string[] | null } | null;
  seoSuggestion?: {
    keywords: Keyword[];
    metaTitle: string;
    metaDescription: string;
    contentTips: string[];
    rationale: string;
    model?: string;
    generatedAt?: string;
    appliedAt?: string | null;
  } | null;
}

const TYPE_COLOR: Record<Keyword['type'], [string, string]> = {
  principal: ['success100', 'success700'],
  secundaria: ['primary100', 'primary700'],
  'long-tail': ['neutral150', 'neutral700'],
};

const date = (iso?: string | null) => (iso ? new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso)) : '');

/** SEO de proyectos: palabras clave objetivo, sugerencias de la IA y aplicación con un clic. */
export function SeoProyectos({
  settings,
  onSettings,
  providerReady,
}: {
  settings: { seoMonthly?: boolean; seoAutoApply?: boolean };
  onSettings: (data: Record<string, boolean>) => void;
  providerReady: boolean;
}) {
  const { get, post, put } = useFetchClient();
  const { toggleNotification } = useNotification();
  const [projects, setProjects] = useState<SeoProject[]>([]);
  const [targets, setTargets] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await get('/estudio/seo');
    setProjects((res.data as { projects: SeoProject[] }).projects);
  }, [get]);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  const run = async (key: string, fn: () => Promise<unknown>, success?: string) => {
    setBusy(key);
    try {
      await fn();
      if (success) toggleNotification({ type: 'success', message: success });
      await load();
    } catch (error: any) {
      toggleNotification({ type: 'danger', message: error?.response?.data?.error?.message || 'No se pudo completar la acción.' });
    } finally {
      setBusy(null);
    }
  };

  const generate = (documentId?: string) =>
    run(documentId ?? 'all', async () => {
      if (documentId && targets[documentId] !== undefined) await put(`/estudio/seo/${documentId}/objetivo`, { targetKeywords: targets[documentId] });
      const res = await post('/estudio/seo/generar', documentId ? { documentId } : {});
      const failed = (res.data as { results: { ok: boolean; title: string; message?: string }[] }).results.filter((r) => !r.ok);
      if (failed.length) throw { response: { data: { error: { message: failed.map((f) => `${f.title}: ${f.message}`).join(' · ') } } } };
    }, 'Sugerencias listas. Revísalas y aplica las que te convenzan.');

  return (
    <Box background="neutral0" hasRadius shadow="tableShadow" padding={6}>
      <Flex direction="column" alignItems="stretch" gap={4}>
        <Flex justifyContent="space-between" wrap="wrap" gap={3}>
          <Flex direction="column" alignItems="flex-start" gap={1}>
            <Typography variant="delta" tag="h2">SEO de proyectos</Typography>
            <Typography variant="pi" textColor="neutral600">
              Escribe las búsquedas que te importan; la IA las amplía y redacta el título y la descripción para Google.
            </Typography>
          </Flex>
          <Button startIcon={<Magic />} disabled={!providerReady || !projects.length} loading={busy === 'all'} onClick={() => generate()}>
            Revisar todos los proyectos
          </Button>
        </Flex>

        <Flex gap={6} wrap="wrap">
          <Field.Root name="seoMonthly" hint="El día 1 de cada mes a las 6:00.">
            <Field.Label>Revisar el SEO cada mes</Field.Label>
            <Toggle onLabel="Sí" offLabel="No" checked={settings.seoMonthly !== false}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSettings({ seoMonthly: e.target.checked })} />
            <Field.Hint />
          </Field.Root>
          <Field.Root name="seoAutoApply" hint="Si está apagado, cada sugerencia espera tu aprobación.">
            <Field.Label>Aplicar sugerencias automáticamente</Field.Label>
            <Toggle onLabel="Sí" offLabel="No" checked={Boolean(settings.seoAutoApply)}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSettings({ seoAutoApply: e.target.checked })} />
            <Field.Hint />
          </Field.Root>
        </Flex>

        {projects.map((p) => {
          const s = p.seoSuggestion;
          const pending = s && !s.appliedAt;
          return (
            <Box key={p.documentId}>
              <Divider marginBottom={4} />
              <Flex direction="column" alignItems="stretch" gap={3}>
                <Flex gap={2} alignItems="center" wrap="wrap">
                  <Typography variant="epsilon" fontWeight="bold">{p.title}</Typography>
                  <Typography variant="pi" textColor="neutral500">/proyectos/{p.slug}</Typography>
                  {!p.publishedAt && <Badge>Sin publicar</Badge>}
                  {pending && <Badge backgroundColor="warning100" textColor="warning700">Sugerencia por aplicar</Badge>}
                </Flex>

                <Box background="neutral100" padding={3} hasRadius>
                  <Typography variant="sigma" textColor="neutral600">En Google hoy</Typography>
                  <Typography tag="p" fontWeight="semiBold">{p.seo?.metaTitle || `${p.title} (título por defecto)`}</Typography>
                  <Typography tag="p" variant="pi">{p.seo?.metaDescription || 'Sin descripción: Google usará el resumen del proyecto.'}</Typography>
                </Box>

                <Field.Root name={`targets-${p.documentId}`} hint="Una por línea o separadas por comas. Ej.: software de transporte, tms, aplicación de transporte">
                  <Field.Label>Búsquedas objetivo</Field.Label>
                  <Textarea
                    value={targets[p.documentId] ?? p.targetKeywords ?? ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTargets({ ...targets, [p.documentId]: e.target.value })}
                  />
                  <Field.Hint />
                </Field.Root>

                {s && (
                  <Box borderColor={pending ? 'warning200' : 'neutral200'} padding={4} hasRadius>
                    <Flex direction="column" alignItems="stretch" gap={3}>
                      <Typography variant="sigma" textColor="neutral600">
                        Sugerencia de la IA · {s.model} · {date(s.generatedAt)}{s.appliedAt ? ` · aplicada ${date(s.appliedAt)}` : ''}
                      </Typography>
                      <Box>
                        <Typography tag="p" fontWeight="semiBold">{s.metaTitle} <Typography variant="pi" textColor="neutral500">({s.metaTitle.length}/60)</Typography></Typography>
                        <Typography tag="p" variant="pi">{s.metaDescription} <Typography variant="pi" textColor="neutral500">({s.metaDescription.length}/160)</Typography></Typography>
                      </Box>
                      <Flex gap={2} wrap="wrap">
                        {s.keywords.map((k) => (
                          <Badge key={k.term} backgroundColor={TYPE_COLOR[k.type][0]} textColor={TYPE_COLOR[k.type][1]}>
                            {k.term}{k.language === 'en' ? ' · EN' : ''}
                          </Badge>
                        ))}
                      </Flex>
                      {s.contentTips.length > 0 && (
                        <Box>
                          <Typography variant="pi" fontWeight="bold">Para mejorar el contenido de la página:</Typography>
                          {s.contentTips.map((t) => <Typography key={t} tag="p" variant="pi">• {t}</Typography>)}
                        </Box>
                      )}
                      {s.rationale && <Typography variant="pi" textColor="neutral600">{s.rationale}</Typography>}
                    </Flex>
                  </Box>
                )}

                <Flex gap={2}>
                  <Button variant="secondary" startIcon={<Magic />} disabled={!providerReady} loading={busy === p.documentId} onClick={() => generate(p.documentId)}>
                    {s ? 'Regenerar sugerencia' : 'Generar sugerencia'}
                  </Button>
                  {pending && (
                    <Button variant="success" startIcon={<Check />} loading={busy === `apply-${p.documentId}`}
                      onClick={() => run(`apply-${p.documentId}`, () => post(`/estudio/seo/${p.documentId}/aplicar`), p.publishedAt ? 'Aplicado y publicado.' : 'Aplicado al borrador.')}>
                      Aplicar
                    </Button>
                  )}
                </Flex>
              </Flex>
            </Box>
          );
        })}
      </Flex>
    </Box>
  );
}
