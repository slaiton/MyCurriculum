import { useCallback, useEffect, useMemo, useState } from 'react';
import { Layouts, useFetchClient, useNotification } from '@strapi/strapi/admin';
import {
  Badge,
  Box,
  Button,
  Divider,
  Field,
  Flex,
  Grid,
  Loader,
  Main,
  SingleSelect,
  SingleSelectOption,
  TextInput,
  Textarea,
  Toggle,
  Typography,
} from '@strapi/design-system';
import { SeoProyectos } from './SeoProyectos';
import { ArrowClockwise, Check, Cross, Eye, PaperPlane, Pencil, Plus, Sparkle } from '@strapi/icons';

type Status = 'propuesto' | 'aprobado' | 'en_redaccion' | 'borrador_listo' | 'descartado' | 'error';

interface Topic {
  documentId: string;
  title: string;
  status: Status;
  keyword?: string | null;
  angle?: string | null;
  outline?: string | null;
  notes?: string | null;
  needsPersonalData?: boolean;
  errorMessage?: string | null;
  model?: string | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  category?: { documentId: string; name: string } | null;
  draft?: {
    documentId: string;
    title: string;
    slug: string;
    pending: string[];
    publishedAt: string | null;
    previewUrl: string | null;
    editUrl: string;
  } | null;
}

interface Summary {
  settings: {
    model: string;
    autoDraftOnApproval: boolean;
    weeklyProposals: boolean;
    topicsPerRun: number;
    proposalFocus?: string | null;
    proposeNow?: boolean;
    lastProposalAt?: string | null;
    lastProposalResult?: string | null;
    seoMonthly?: boolean;
    seoAutoApply?: boolean;
  };
  categories: { documentId: string; name: string }[];
  topics: Topic[];
  providers: { deepseek: boolean; anthropic: boolean };
  fakeMode: boolean;
}

const MODELS = [
  { value: 'deepseek-v4-pro', label: 'DeepSeek V4 Pro (≈0,03 USD por borrador)', provider: 'deepseek' },
  { value: 'deepseek-flash', label: 'DeepSeek Flash (≈0,01 USD por borrador)', provider: 'deepseek' },
  { value: 'claude-opus-5-5', label: 'Claude Opus 5.5 (≈0,10–0,20 USD)', provider: 'anthropic' },
  { value: 'claude-sonnet-5-5', label: 'Claude Sonnet 5.5 (≈0,05–0,10 USD)', provider: 'anthropic' },
] as const;

const dateTime = (iso?: string | null) =>
  iso ? new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso)) : '';

function Section({ title, count, children, hint }: { title: string; count?: number; children: React.ReactNode; hint?: string }) {
  return (
    <Box background="neutral0" hasRadius shadow="tableShadow" padding={6}>
      <Flex direction="column" alignItems="stretch" gap={4}>
        <Flex gap={2} alignItems="center">
          <Typography variant="delta" tag="h2">
            {title}
          </Typography>
          {typeof count === 'number' && <Badge>{count}</Badge>}
        </Flex>
        {hint && (
          <Typography variant="pi" textColor="neutral600">
            {hint}
          </Typography>
        )}
        {children}
      </Flex>
    </Box>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <Typography variant="omega" textColor="neutral500">
      {children}
    </Typography>
  );
}

const EstudioPage = () => {
  const { get, post, put } = useFetchClient();
  const { toggleNotification } = useNotification();
  const [data, setData] = useState<Summary | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [proposing, setProposing] = useState(false);
  const [focus, setFocus] = useState('');
  const [count, setCount] = useState('6');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [newTopic, setNewTopic] = useState({ title: '', notes: '', categoryId: '' });

  const notify = useCallback(
    (type: 'success' | 'danger' | 'warning' | 'info', message: string) => toggleNotification({ type, message }),
    [toggleNotification],
  );

  const load = useCallback(async () => {
    try {
      const res = await get('/estudio/resumen');
      setData(res.data as Summary);
      return res.data as Summary;
    } catch (error: any) {
      notify('danger', error?.response?.data?.error?.message || 'No se pudo cargar el estudio.');
      return null;
    }
  }, [get, notify]);

  useEffect(() => {
    load().then((d) => {
      if (d) {
        setFocus(d.settings.proposalFocus || '');
        setCount(String(d.settings.topicsPerRun || 6));
      }
    });
  }, [load]);

  const groups = useMemo(() => {
    const by = (s: Status) => (data?.topics ?? []).filter((t) => t.status === s);
    return {
      propuestos: by('propuesto'),
      enCurso: [...by('aprobado'), ...by('en_redaccion')],
      listos: by('borrador_listo').filter((t) => t.draft && !t.draft.publishedAt),
      publicados: by('borrador_listo').filter((t) => t.draft?.publishedAt),
      errores: by('error'),
      descartados: by('descartado'),
    };
  }, [data]);

  // Mientras algo se procesa en segundo plano, refresca cada 5 segundos.
  const working = proposing || groups.enCurso.length > 0 || Boolean(data?.settings.proposeNow);
  useEffect(() => {
    if (!working) return;
    const id = setInterval(async () => {
      const before = data?.settings.lastProposalAt;
      const d = await load();
      if (proposing && d && d.settings.lastProposalAt && d.settings.lastProposalAt !== before) {
        setProposing(false);
        const ok = (d.settings.lastProposalResult || '').startsWith('✅');
        notify(ok ? 'success' : 'danger', d.settings.lastProposalResult || 'Propuesta terminada.');
      }
    }, 5000);
    return () => clearInterval(id);
  }, [working, proposing, load, notify, data?.settings.lastProposalAt]);

  const run = async (key: string, fn: () => Promise<unknown>, success?: string) => {
    setBusy(key);
    try {
      await fn();
      if (success) notify('success', success);
      await load();
    } catch (error: any) {
      notify('danger', error?.response?.data?.error?.message || error?.message || 'No se pudo completar la acción.');
    } finally {
      setBusy(null);
    }
  };

  if (!data) {
    return (
      <Main>
        <Flex justifyContent="center" padding={10}>
          <Loader>Cargando estudio…</Loader>
        </Flex>
      </Main>
    );
  }

  const model = MODELS.find((m) => m.value === data.settings.model);
  const providerReady = data.fakeMode || (model ? data.providers[model.provider] : false);

  return (
    <Main>
      <Layouts.Header
        title="Estudio editorial"
        subtitle="Genera temas con IA, apruébalos y publica los borradores sin salir de Strapi. Nada se publica sin tu clic."
      />
      <Layouts.Content>
        <Flex direction="column" alignItems="stretch" gap={6}>
          {!providerReady && (
            <Box background="danger100" padding={4} hasRadius borderColor="danger200">
              <Typography textColor="danger700">
                El modelo elegido ({data.settings.model}) no tiene API key configurada en el servidor. Agrega{' '}
                {model?.provider === 'anthropic' ? 'ANTHROPIC_API_KEY' : 'DEEPSEEK_API_KEY'} a infra/.env o elige otro modelo abajo.
              </Typography>
            </Box>
          )}
          {data.fakeMode && (
            <Box background="warning100" padding={4} hasRadius>
              <Typography textColor="warning700">Modo de prueba local (EDITORIAL_FAKE): las respuestas son simuladas y no hay costo.</Typography>
            </Box>
          )}

          <Grid.Root gap={6}>
            <Grid.Item col={7} s={12} direction="column" alignItems="stretch">
              <Section
                title="Generar temas con IA"
                hint="Propone temas nuevos para tus categorías, sin repetir los que ya existen. Tarda uno o dos minutos."
              >
                <Field.Root name="focus" hint="Opcional. Ej.: Kotlin y apps para conductores; temas para líderes técnicos.">
                  <Field.Label>Enfoque de esta tanda</Field.Label>
                  <TextInput value={focus} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFocus(e.target.value)} placeholder="Temas variados" />
                  <Field.Hint />
                </Field.Root>
                <Flex gap={3} alignItems="flex-end" wrap="wrap">
                  <Box minWidth="160px">
                    <Field.Root name="count">
                      <Field.Label>Cantidad</Field.Label>
                      <SingleSelect value={count} onChange={(v: string | number) => setCount(String(v))}>
                        {['3', '6', '9', '12'].map((n) => (
                          <SingleSelectOption key={n} value={n}>
                            {n} temas
                          </SingleSelectOption>
                        ))}
                      </SingleSelect>
                    </Field.Root>
                  </Box>
                  <Button
                    startIcon={<Sparkle />}
                    loading={proposing || Boolean(data.settings.proposeNow)}
                    disabled={!providerReady}
                    onClick={() =>
                      run('proponer', async () => {
                        await post('/estudio/proponer', { focus, count: Number(count) });
                        setProposing(true);
                      }, 'Generando temas… aparecerán en "Temas propuestos".')
                    }
                  >
                    Generar temas
                  </Button>
                </Flex>
                {data.settings.lastProposalResult && (
                  <Typography variant="pi" textColor="neutral600">
                    Última propuesta ({dateTime(data.settings.lastProposalAt)}): {data.settings.lastProposalResult}
                  </Typography>
                )}
              </Section>
            </Grid.Item>

            <Grid.Item col={5} s={12} direction="column" alignItems="stretch">
              <Section title="Ajustes">
                <Field.Root name="model">
                  <Field.Label>Modelo de IA</Field.Label>
                  <SingleSelect
                    value={data.settings.model}
                    onChange={(v: string | number) => run('ajustes', () => put('/estudio/ajustes', { model: String(v) }), 'Modelo actualizado.')}
                  >
                    {MODELS.map((m) => (
                      <SingleSelectOption key={m.value} value={m.value}>
                        {m.label}
                        {data.providers[m.provider] ? '' : ' — sin API key'}
                      </SingleSelectOption>
                    ))}
                  </SingleSelect>
                </Field.Root>
                <Field.Root name="autoDraft" hint="Desactívalo para pausar la redacción automática.">
                  <Field.Label>Redactar automáticamente al aprobar</Field.Label>
                  <Toggle
                    onLabel="Sí"
                    offLabel="No"
                    checked={data.settings.autoDraftOnApproval}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      run('ajustes', () => put('/estudio/ajustes', { autoDraftOnApproval: e.target.checked }))
                    }
                  />
                  <Field.Hint />
                </Field.Root>
                <Field.Root name="weekly" hint="Cada lunes a las 7:00 (hora de Colombia).">
                  <Field.Label>Proponer temas cada semana</Field.Label>
                  <Toggle
                    onLabel="Sí"
                    offLabel="No"
                    checked={data.settings.weeklyProposals}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      run('ajustes', () => put('/estudio/ajustes', { weeklyProposals: e.target.checked }))
                    }
                  />
                  <Field.Hint />
                </Field.Root>
              </Section>
            </Grid.Item>
          </Grid.Root>

          <Section
            title="Temas propuestos"
            count={groups.propuestos.length}
            hint="Aprueba para que la IA redacte el artículo y lo suba como borrador. Puedes dejar indicaciones antes de aprobar."
          >
            {groups.propuestos.length === 0 && <Empty>No hay temas pendientes. Genera algunos o crea uno propio abajo.</Empty>}
            {groups.propuestos.map((t, i) => (
              <Box key={t.documentId}>
                {i > 0 && <Divider marginBottom={4} />}
                <Flex direction="column" alignItems="stretch" gap={2}>
                  <Flex gap={2} wrap="wrap" alignItems="center">
                    <Typography variant="epsilon" fontWeight="bold">
                      {t.title}
                    </Typography>
                    {t.category && <Badge>{t.category.name}</Badge>}
                    {t.needsPersonalData && <Badge backgroundColor="warning100" textColor="warning700">Requiere tu experiencia</Badge>}
                  </Flex>
                  {t.keyword && (
                    <Typography variant="pi" textColor="neutral600">
                      Búsqueda objetivo: {t.keyword}
                    </Typography>
                  )}
                  {t.angle && <Typography variant="omega">{t.angle}</Typography>}
                  {t.outline && (
                    <Typography variant="pi" textColor="neutral600" style={{ whiteSpace: 'pre-line' }}>
                      {t.outline}
                    </Typography>
                  )}
                  <Field.Root name={`notes-${t.documentId}`}>
                    <Field.Label>Indicaciones para la redacción (opcional)</Field.Label>
                    <TextInput
                      value={notes[t.documentId] ?? t.notes ?? ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNotes({ ...notes, [t.documentId]: e.target.value })}
                      placeholder="Ej.: usa el caso de las guías de transporte"
                    />
                  </Field.Root>
                  <Flex gap={2}>
                    <Button
                      startIcon={<Check />}
                      disabled={!providerReady || !data.settings.autoDraftOnApproval}
                      loading={busy === `ok-${t.documentId}`}
                      onClick={() =>
                        run(
                          `ok-${t.documentId}`,
                          () => post(`/estudio/temas/${t.documentId}/estado`, { status: 'aprobado', notes: notes[t.documentId] ?? t.notes ?? '' }),
                          'Aprobado: la IA está redactando el borrador.',
                        )
                      }
                    >
                      Aprobar y redactar
                    </Button>
                    <Button
                      variant="danger-light"
                      startIcon={<Cross />}
                      loading={busy === `no-${t.documentId}`}
                      onClick={() => run(`no-${t.documentId}`, () => post(`/estudio/temas/${t.documentId}/estado`, { status: 'descartado' }))}
                    >
                      Descartar
                    </Button>
                  </Flex>
                </Flex>
              </Box>
            ))}
          </Section>

          {groups.enCurso.length > 0 && (
            <Section title="Redactando" count={groups.enCurso.length} hint="Tarda entre uno y tres minutos por artículo. Esta página se actualiza sola.">
              {groups.enCurso.map((t) => (
                <Flex key={t.documentId} gap={3} alignItems="center">
                  <Loader small>Redactando</Loader>
                  <Typography>{t.title}</Typography>
                </Flex>
              ))}
            </Section>
          )}

          <Section
            title="Borradores listos para revisar"
            count={groups.listos.length}
            hint="Revisa en la vista previa, edita lo necesario y publica. Si quedan marcadores [COMPLETAR], el sistema no deja publicar."
          >
            {groups.listos.length === 0 && <Empty>Aún no hay borradores. Aprueba un tema para generar el primero.</Empty>}
            {groups.listos.map((t, i) => (
              <Box key={t.documentId}>
                {i > 0 && <Divider marginBottom={4} />}
                <Flex direction="column" alignItems="stretch" gap={2}>
                  <Flex gap={2} wrap="wrap" alignItems="center">
                    <Typography variant="epsilon" fontWeight="bold">
                      {t.draft!.title}
                    </Typography>
                    {t.category && <Badge>{t.category.name}</Badge>}
                    {t.draft!.pending.length > 0 ? (
                      <Badge backgroundColor="warning100" textColor="warning700">
                        {t.draft!.pending.length} [COMPLETAR] pendiente(s)
                      </Badge>
                    ) : (
                      <Badge backgroundColor="success100" textColor="success700">Listo para publicar</Badge>
                    )}
                  </Flex>
                  {t.draft!.pending.map((p) => (
                    <Typography key={p} variant="pi" textColor="warning700">
                      • Completa: {p}
                    </Typography>
                  ))}
                  <Typography variant="pi" textColor="neutral500">
                    /blog/{t.draft!.slug} · {t.model} · {t.inputTokens ?? 0}+{t.outputTokens ?? 0} tokens
                  </Typography>
                  <Flex gap={2} wrap="wrap">
                    {t.draft!.previewUrl && (
                      <Button variant="secondary" startIcon={<Eye />} onClick={() => window.open(t.draft!.previewUrl!, '_blank', 'noopener')}>
                        Vista previa
                      </Button>
                    )}
                    <Button variant="tertiary" startIcon={<Pencil />} onClick={() => (window.location.href = `/admin${t.draft!.editUrl}`)}>
                      Editar
                    </Button>
                    <Button
                      variant="success"
                      startIcon={<PaperPlane />}
                      disabled={t.draft!.pending.length > 0}
                      loading={busy === `pub-${t.documentId}`}
                      onClick={() => run(`pub-${t.documentId}`, () => post(`/estudio/borradores/${t.draft!.documentId}/publicar`), '¡Publicado! Ya está en el blog.')}
                    >
                      Publicar
                    </Button>
                  </Flex>
                </Flex>
              </Box>
            ))}
          </Section>

          {groups.errores.length > 0 && (
            <Section title="Con error" count={groups.errores.length}>
              {groups.errores.map((t) => (
                <Flex key={t.documentId} justifyContent="space-between" gap={4} wrap="wrap">
                  <Flex direction="column" alignItems="flex-start" gap={1}>
                    <Typography fontWeight="bold">{t.title}</Typography>
                    <Typography variant="pi" textColor="danger600">
                      {t.errorMessage}
                    </Typography>
                  </Flex>
                  <Button
                    variant="secondary"
                    startIcon={<ArrowClockwise />}
                    disabled={!providerReady}
                    loading={busy === `re-${t.documentId}`}
                    onClick={() => run(`re-${t.documentId}`, () => post(`/estudio/temas/${t.documentId}/estado`, { status: 'aprobado' }), 'Reintentando…')}
                  >
                    Reintentar
                  </Button>
                </Flex>
              ))}
            </Section>
          )}

          <Section title="Tema propio" hint="Escribe una idea tuya; puedes guardarla como propuesta o mandarla directo a redacción.">
            <Grid.Root gap={4}>
              <Grid.Item col={8} s={12} direction="column" alignItems="stretch">
                <Field.Root name="newTitle" required>
                  <Field.Label>Título</Field.Label>
                  <TextInput
                    value={newTopic.title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTopic({ ...newTopic, title: e.target.value })}
                    placeholder="Ej.: Colas en Laravel para integraciones lentas"
                  />
                </Field.Root>
              </Grid.Item>
              <Grid.Item col={4} s={12} direction="column" alignItems="stretch">
                <Field.Root name="newCategory">
                  <Field.Label>Categoría</Field.Label>
                  <SingleSelect
                    value={newTopic.categoryId}
                    placeholder="Elige una categoría"
                    onChange={(v: string | number) => setNewTopic({ ...newTopic, categoryId: String(v) })}
                  >
                    {data.categories.map((c) => (
                      <SingleSelectOption key={c.documentId} value={c.documentId}>
                        {c.name}
                      </SingleSelectOption>
                    ))}
                  </SingleSelect>
                </Field.Root>
              </Grid.Item>
              <Grid.Item col={12} direction="column" alignItems="stretch">
                <Field.Root name="newNotes">
                  <Field.Label>Indicaciones (opcional)</Field.Label>
                  <Textarea
                    value={newTopic.notes}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewTopic({ ...newTopic, notes: e.target.value })}
                    placeholder="Ángulo, ejemplos a usar, qué evitar…"
                  />
                </Field.Root>
              </Grid.Item>
            </Grid.Root>
            <Flex gap={2}>
              {[false, true].map((approve) => (
                <Button
                  key={String(approve)}
                  variant={approve ? 'default' : 'secondary'}
                  startIcon={approve ? <Sparkle /> : <Plus />}
                  disabled={!newTopic.title.trim() || (approve && !providerReady)}
                  loading={busy === `new-${approve}`}
                  onClick={() =>
                    run(
                      `new-${approve}`,
                      async () => {
                        await post('/estudio/temas', { ...newTopic, categoryId: newTopic.categoryId || null, approve });
                        setNewTopic({ title: '', notes: '', categoryId: '' });
                      },
                      approve ? 'Tema creado: la IA está redactando el borrador.' : 'Tema guardado en "Temas propuestos".',
                    )
                  }
                >
                  {approve ? 'Crear y redactar' : 'Guardar como propuesto'}
                </Button>
              ))}
            </Flex>
          </Section>

          <SeoProyectos
            settings={data.settings}
            providerReady={providerReady}
            onSettings={(d) => run('ajustes', () => put('/estudio/ajustes', d))}
          />

          {groups.publicados.length > 0 && (
            <Section title="Publicados desde el estudio" count={groups.publicados.length}>
              {groups.publicados.slice(0, 10).map((t) => (
                <Typography key={t.documentId} variant="omega">
                  ✓ {t.draft!.title} — {dateTime(t.draft!.publishedAt)}
                </Typography>
              ))}
            </Section>
          )}

          {groups.descartados.length > 0 && (
            <Typography variant="pi" textColor="neutral500">
              {groups.descartados.length} tema(s) descartado(s). No se volverán a proponer.
            </Typography>
          )}
        </Flex>
      </Layouts.Content>
    </Main>
  );
};

export default EstudioPage;
