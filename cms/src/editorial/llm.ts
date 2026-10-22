// Llamadas a los modelos de IA para la redacción asistida (Claude de Anthropic o DeepSeek).
// Devuelve datos validados; nunca escribe en la base de datos.
import Anthropic from '@anthropic-ai/sdk';

export type EditorialModel = 'claude-opus-5-5' | 'claude-sonnet-5-5' | 'deepseek-v4-pro' | 'deepseek-flash';
const isDeepSeek = (model: EditorialModel) => model.startsWith('deepseek');

export interface DraftInput {
  title: string;
  keyword?: string | null;
  angle?: string | null;
  outline?: string | null;
  notes?: string | null;
  categoryName?: string | null;
  needsPersonalData?: boolean | null;
}

export interface Draft {
  title: string;
  slug: string;
  excerpt: string;
  metaTitle: string;
  metaDescription: string;
  tags: string[];
  body: string;
}

export interface TopicProposal {
  title: string;
  keyword: string;
  categorySlug: string;
  angle: string;
  outline: string;
  needsPersonalData: boolean;
}

export interface Usage {
  model: string;
  inputTokens: number;
  outputTokens: number;
}

export class EditorialError extends Error {}

const DEFAULT_PROFILE =
  'Stiven Laiton, Ingeniero de Sistemas y desarrollador full stack líder en Aldia Logística (Colombia). ' +
  'Experiencia desde 2018 con Laravel, PHP, Kotlin (Android), Angular, React, Express, SQL y PostgreSQL, AWS y Docker, ' +
  'arquitectura hexagonal y Clean Architecture, integraciones REST y SOAP con clientes y proveedores, auditoría de código, ' +
  'DevOps, despliegues automatizados y liderazgo de equipos de desarrollo.';

const DEFAULT_STYLE =
  'Español neutro (Colombia), tono cercano y profesional, en primera persona cuando aporte. ' +
  'Público: desarrolladores y líderes técnicos de Latinoamérica. Prioriza lo práctico: problema real, solución paso a paso, ' +
  'código funcional y cuándo NO aplicar la técnica. Párrafos cortos, títulos claros, sin relleno ni frases genéricas.';

const slugify = (text: string) =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/** Recorta en el último espacio antes del límite, sin cortar palabras. */
const clip = (text: string, max: number) => {
  const t = text.trim().replace(/\s+/g, ' ');
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), max - 20)).trim()}…`;
};

const DRAFT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'slug', 'excerpt', 'metaTitle', 'metaDescription', 'tags', 'body'],
  properties: {
    title: { type: 'string', description: 'Título del artículo (máx. 110 caracteres)' },
    slug: { type: 'string', description: 'URL en minúsculas, sin tildes, palabras separadas por guiones' },
    excerpt: { type: 'string', description: 'Resumen de 1-2 frases, máx. 190 caracteres' },
    metaTitle: { type: 'string', description: 'Título SEO, máx. 60 caracteres, incluye la palabra clave' },
    metaDescription: { type: 'string', description: 'Descripción SEO, máx. 155 caracteres' },
    tags: { type: 'array', items: { type: 'string' }, description: '3 a 5 etiquetas en minúsculas' },
    body: { type: 'string', description: 'Cuerpo completo en Markdown, sin el título principal' },
  },
};

// Ejemplos de estructura para proveedores sin validación de esquema (DeepSeek).
const DRAFT_EXAMPLE = {
  title: 'Título claro del artículo',
  slug: 'titulo-claro-del-articulo',
  excerpt: 'Resumen de una o dos frases.',
  metaTitle: 'Título SEO de máximo 60 caracteres',
  metaDescription: 'Descripción SEO de máximo 155 caracteres.',
  tags: ['laravel', 'arquitectura', 'php'],
  body: '## Primer título\n\nTexto en Markdown...\n\n```php\n// código\n```',
};

const proposalsExample = (categorySlugs: string[]) => ({
  topics: [
    {
      title: 'Título del tema',
      keyword: 'búsqueda en google',
      categorySlug: categorySlugs[0] ?? 'arquitectura',
      angle: 'Qué lo hace útil y diferente.',
      outline: '- Sección 1\n- Sección 2\n- Sección 3',
      needsPersonalData: false,
    },
  ],
});

const proposalsSchema = (categorySlugs: string[]) => ({
  type: 'object',
  additionalProperties: false,
  required: ['topics'],
  properties: {
    topics: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'keyword', 'categorySlug', 'angle', 'outline', 'needsPersonalData'],
        properties: {
          title: { type: 'string' },
          keyword: { type: 'string', description: 'Búsqueda en Google que este artículo responde' },
          categorySlug: { type: 'string', enum: categorySlugs },
          angle: { type: 'string', description: 'Qué lo hace útil y diferente, 1-2 frases' },
          outline: { type: 'string', description: 'Esquema: una línea por sección, empezando con "- "' },
          needsPersonalData: { type: 'boolean', description: 'true si requiere experiencias, cifras o casos reales del autor' },
        },
      },
    },
  },
});

const RULES = `Reglas obligatorias:
- NUNCA inventes experiencias personales, clientes, empresas, cifras, resultados ni anécdotas del autor. Donde un dato personal haga falta o aporte, escribe un marcador exacto: [COMPLETAR: qué debe contar el autor]. El artículo no podrá publicarse hasta que el autor lo reemplace.
- Tampoco afirmes hábitos o prácticas del autor ("lo aplico en mis proyectos", "en mi equipo hacemos..."): usa un [COMPLETAR: …] o redacta en impersonal.
- No presentes umbrales numéricos inventados como reglas ("menos del 5 %", "más de 15 consultas"). Si das una referencia, aclara que es orientativa y depende del caso.
- Antes de cerrar, relee cada sección: elimina contradicciones y frases que no aporten.
- No inventes URLs. Enlaza solo a documentación oficial cuya dirección conozcas con certeza; si dudas, no enlaces.
- El código debe ser correcto y actual. Si una API cambió entre versiones, indica la versión que asumes.
- Markdown: usa ## y ### para títulos (nunca # porque el título ya existe), listas, \`código en línea\` y bloques con lenguaje (\`\`\`php). Sin HTML.
- Extensión del cuerpo: entre 1.100 y 1.800 palabras.
- Cierra con una sección breve de resumen y una invitación natural a escribirle al autor, sin sonar a publicidad.`;

const FAKE = () => process.env.EDITORIAL_FAKE === 'true' && process.env.NODE_ENV !== 'production';

interface JsonCall {
  model: EditorialModel;
  system: string;
  prompt: string;
  schema: Record<string, unknown>;
  /** Ejemplo de la estructura esperada (DeepSeek no valida esquemas: se le muestra un ejemplo). */
  example: unknown;
  effort: 'medium' | 'high';
}

/** Despacha al proveedor según el modelo elegido en la Guía editorial. */
function callJson<T>(params: JsonCall): Promise<{ data: T; usage: Usage }> {
  if (FAKE()) throw new EditorialError('modo de prueba sin API');
  return isDeepSeek(params.model) ? callDeepSeek<T>(params) : callAnthropic<T>(params);
}

/** Claude: streaming con salida JSON validada por esquema en el servidor. */
async function callAnthropic<T>(params: JsonCall): Promise<{ data: T; usage: Usage }> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new EditorialError('Falta ANTHROPIC_API_KEY en el servidor del CMS (o elige un modelo de DeepSeek en la Guía editorial).');
  }
  const anthropic = new Anthropic();
  const stream = anthropic.beta.messages.stream({
    model: params.model,
    max_tokens: 32000,
    system: params.system,
    messages: [{ role: 'user', content: params.prompt }],
    output_config: { effort: params.effort, format: { type: 'json_schema', schema: params.schema } },
    // Si un clasificador de seguridad rechaza la petición, la API reintenta con otro modelo automáticamente.
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
  });
  const message = await stream.finalMessage();

  if (message.stop_reason === 'refusal') throw new EditorialError('El modelo rechazó la solicitud. Ajusta el tema o las notas.');
  if (message.stop_reason === 'max_tokens') throw new EditorialError('La respuesta se cortó por longitud. Intenta de nuevo.');

  const text = message.content.map((b) => (b.type === 'text' ? b.text : '')).join('');
  return {
    data: parseJson<T>(text),
    usage: { model: message.model, inputTokens: message.usage.input_tokens, outputTokens: message.usage.output_tokens },
  };
}

/**
 * DeepSeek: API compatible con OpenAI en modo JSON (response_format json_object).
 * Su documentación advierte que a veces devuelve contenido vacío: se reintenta una vez.
 */
async function callDeepSeek<T>(params: JsonCall): Promise<{ data: T; usage: Usage }> {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) throw new EditorialError('Falta DEEPSEEK_API_KEY en el servidor del CMS (o elige un modelo de Claude en la Guía editorial).');

  const system = `${params.system}

Responde ÚNICAMENTE con un objeto JSON válido, sin texto antes ni después, con exactamente esta estructura (ejemplo):
${JSON.stringify(params.example, null, 2)}`;

  // DEEPSEEK_BASE_URL es opcional (proxy o pruebas locales con un servidor simulado).
  const base = (process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com').replace(/\/$/, '');
  for (let attempt = 1; attempt <= 2; attempt++) {
    const res = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: params.model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: params.prompt },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 16000,
        stream: false,
      }),
      signal: AbortSignal.timeout(10 * 60_000),
    });
    const json = (await res.json().catch(() => ({}))) as {
      model?: string;
      choices?: { message?: { content?: string | null }; finish_reason?: string }[];
      usage?: { prompt_tokens?: number; completion_tokens?: number };
      error?: { message?: string };
    };
    if (!res.ok) {
      if (res.status === 401) throw new EditorialError('DEEPSEEK_API_KEY inválida.');
      if (res.status === 402) throw new EditorialError('Saldo insuficiente en la cuenta de DeepSeek.');
      throw new EditorialError(`DeepSeek respondió ${res.status}: ${json.error?.message ?? 'error desconocido'}`);
    }
    const choice = json.choices?.[0];
    if (choice?.finish_reason === 'length') throw new EditorialError('La respuesta se cortó por longitud. Intenta de nuevo.');
    const content = choice?.message?.content?.trim();
    if (!content) {
      if (attempt === 1) continue;
      throw new EditorialError('DeepSeek devolvió una respuesta vacía. Intenta de nuevo.');
    }
    return {
      data: parseJson<T>(content),
      usage: { model: json.model ?? params.model, inputTokens: json.usage?.prompt_tokens ?? 0, outputTokens: json.usage?.completion_tokens ?? 0 },
    };
  }
  throw new EditorialError('DeepSeek no respondió.');
}

function parseJson<T>(text: string): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new EditorialError('La respuesta no fue JSON válido.');
  }
}

/** Normaliza y valida un borrador para que cumpla los límites del CMS. */
function sanitizeDraft(raw: Draft, fallbackTitle: string): Draft {
  if (!raw || typeof raw !== 'object' || typeof raw.body !== 'string') throw new EditorialError('La respuesta no trae el cuerpo del artículo.');
  if (!Array.isArray(raw.tags)) raw.tags = [];
  const body = (raw.body ?? '').trim();
  if (body.split(/\s+/).length < 300) throw new EditorialError('El borrador generado es demasiado corto.');
  const title = clip(raw.title || fallbackTitle, 120);
  return {
    title,
    slug: slugify(raw.slug || title).slice(0, 80).replace(/-+$/g, ''),
    excerpt: clip(raw.excerpt || '', 200),
    metaTitle: clip(raw.metaTitle || title, 60),
    metaDescription: clip(raw.metaDescription || raw.excerpt || '', 160),
    tags: [...new Set((raw.tags ?? []).map((t) => t.toLowerCase().trim()).filter(Boolean))].slice(0, 5),
    body: body.replace(/^#\s+.*\n+/, ''), // por si incluyó el título como H1
  };
}

export async function generateDraft(input: DraftInput, opts: { model: EditorialModel; profile?: string | null; style?: string | null }) {
  if (FAKE()) return fakeDraft(input, opts.model);

  const system = `Eres el editor técnico del blog de este autor y redactas borradores que él revisará antes de publicar.

Perfil del autor:
${opts.profile?.trim() || DEFAULT_PROFILE}

Guía de estilo:
${opts.style?.trim() || DEFAULT_STYLE}

${RULES}`;

  const prompt = `Redacta el borrador completo de este artículo.

Tema: ${input.title}
Categoría: ${input.categoryName ?? 'sin categoría'}
Palabra clave objetivo: ${input.keyword || 'elige la más natural para el tema'}
Ángulo: ${input.angle || 'el más útil para el público'}
Esquema sugerido:
${input.outline || '(propón tú la estructura)'}
${input.needsPersonalData ? '\nEste tema depende de la experiencia del autor: deja marcadores [COMPLETAR: …] donde corresponda.' : ''}
${input.notes ? `\nIndicaciones del autor (prioritarias):\n${input.notes}` : ''}`;

  const { data, usage } = await callJson<Draft>({ model: opts.model, system, prompt, schema: DRAFT_SCHEMA, example: DRAFT_EXAMPLE, effort: 'high' });
  return { draft: sanitizeDraft(data, input.title), usage };
}

export async function proposeTopics(opts: {
  model: EditorialModel;
  count: number;
  categories: { name: string; slug: string; description?: string | null }[];
  existingTitles: string[];
  profile?: string | null;
  focus?: string | null;
}) {
  if (FAKE()) return fakeProposals(opts);

  const system = `Eres estratega de contenido de un blog técnico personal. Propones temas que el autor pueda escribir con autoridad,
que respondan búsquedas reales y que no repitan lo ya cubierto.

Perfil del autor:
${opts.profile?.trim() || DEFAULT_PROFILE}`;

  const prompt = `Propón ${opts.count} temas nuevos y variados entre estas categorías:
${opts.categories.map((c) => `- ${c.slug}: ${c.name}${c.description ? ` (${c.description})` : ''}`).join('\n')}

Ya existen (no repetir ni hacer variaciones mínimas):
${opts.existingTitles.length ? opts.existingTitles.map((t) => `- ${t}`).join('\n') : '- (ninguno)'}

${opts.focus?.trim() ? `Enfoque pedido por el autor para esta tanda (prioritario): ${opts.focus.trim()}

` : ''}Mezcla tutoriales prácticos, guías de decisión y checklists. Marca needsPersonalData=true cuando el valor del artículo dependa de experiencias reales del autor.`;

  const { data, usage } = await callJson<{ topics: TopicProposal[] }>({
    model: opts.model,
    system,
    prompt,
    schema: proposalsSchema(opts.categories.map((c) => c.slug)),
    example: proposalsExample(opts.categories.map((c) => c.slug)),
    effort: 'medium',
  });
  // Filtra propuestas incompletas o con una categoría inexistente (DeepSeek no valida esquema).
  const valid = new Set(opts.categories.map((c) => c.slug));
  const topics = (Array.isArray(data?.topics) ? data.topics : [])
    .filter((t) => t && typeof t.title === 'string' && t.title.trim() && valid.has(t.categorySlug))
    .map((t) => ({
      title: t.title.trim(),
      keyword: String(t.keyword ?? ''),
      categorySlug: t.categorySlug,
      angle: String(t.angle ?? ''),
      outline: String(t.outline ?? ''),
      needsPersonalData: Boolean(t.needsPersonalData),
    }));
  if (!topics.length) throw new EditorialError('La respuesta no trajo temas válidos.');
  return { topics: topics.slice(0, opts.count), usage };
}

// ---------------- Modo de prueba local (EDITORIAL_FAKE=true): sin llamadas ni costo ----------------

function fakeDraft(input: DraftInput, model: string) {
  const paragraph =
    'Este es un párrafo de prueba generado sin llamar a la API, para validar el flujo de aprobación, creación del borrador y vista previa. ';
  const body = [
    '## Contexto',
    paragraph.repeat(20),
    '## Paso a paso',
    paragraph.repeat(20),
    '```bash\necho "borrador de prueba"\n```',
    '## Experiencia del autor',
    '[COMPLETAR: cuenta un caso real donde aplicaste esto]',
    '## Resumen',
    paragraph.repeat(10),
  ].join('\n\n');
  return {
    draft: sanitizeDraft(
      { title: input.title, slug: input.title, excerpt: `Borrador de prueba sobre ${input.title}.`, metaTitle: input.title, metaDescription: `Prueba: ${input.title}`, tags: ['prueba'], body },
      input.title,
    ),
    usage: { model: `${model} (prueba local)`, inputTokens: 0, outputTokens: 0 },
  };
}

function fakeProposals(opts: { count: number; categories: { slug: string; name: string }[] }) {
  return {
    topics: Array.from({ length: opts.count }, (_, i) => {
      const c = opts.categories[i % opts.categories.length];
      return {
        title: `Tema de prueba ${i + 1} sobre ${c.name} (${new Date().toISOString().slice(0, 16)})`,
        keyword: `prueba ${c.slug}`,
        categorySlug: c.slug,
        angle: 'Propuesta generada en modo de prueba local.',
        outline: '- Introducción\n- Desarrollo\n- Resumen',
        needsPersonalData: i % 3 === 0,
      };
    }),
    usage: { model: 'prueba local', inputTokens: 0, outputTokens: 0 },
  };
}

// ---------------- SEO de proyectos: palabras clave y metadatos ----------------

export interface SeoKeyword {
  term: string;
  /** principal = el término que la página debe ganar; secundaria = variantes y sinónimos; long-tail = búsquedas específicas. */
  type: 'principal' | 'secundaria' | 'long-tail';
  intent: 'comercial' | 'informativa' | 'navegacional';
  language: 'es' | 'en';
}

export interface SeoSuggestion {
  keywords: SeoKeyword[];
  metaTitle: string;
  metaDescription: string;
  /** Secciones o frases que conviene agregar al contenido para posicionar esas búsquedas. */
  contentTips: string[];
  rationale: string;
}

export interface SeoInput {
  title: string;
  summary: string;
  body: string;
  targetKeywords: string[];
  previousKeywords: string[];
  url?: string | null;
}

const SEO_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['keywords', 'metaTitle', 'metaDescription', 'contentTips', 'rationale'],
  properties: {
    keywords: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['term', 'type', 'intent', 'language'],
        properties: {
          term: { type: 'string' },
          type: { type: 'string', enum: ['principal', 'secundaria', 'long-tail'] },
          intent: { type: 'string', enum: ['comercial', 'informativa', 'navegacional'] },
          language: { type: 'string', enum: ['es', 'en'] },
        },
      },
    },
    metaTitle: { type: 'string' },
    metaDescription: { type: 'string' },
    contentTips: { type: 'array', items: { type: 'string' } },
    rationale: { type: 'string' },
  },
};

const SEO_EXAMPLE: SeoSuggestion = {
  keywords: [
    { term: 'software de transporte', type: 'principal', intent: 'comercial', language: 'es' },
    { term: 'tms', type: 'secundaria', intent: 'comercial', language: 'es' },
    { term: 'software para gestionar flota de camiones', type: 'long-tail', intent: 'comercial', language: 'es' },
  ],
  metaTitle: 'CargoApp: software de transporte y TMS en la nube',
  metaDescription: 'Software de transporte (TMS) para planificar cargas, rutas y seguimiento de envíos en tiempo real. Carga masiva de guías y reportes.',
  contentTips: ['Agregar una sección "Carga masiva de guías desde Excel" con un H2 que use esa frase.'],
  rationale: 'La búsqueda principal tiene intención comercial y coincide con la función central del producto.',
};

const SEO_RULES = `Eres especialista en SEO para software en Latinoamérica (español) y conoces cómo busca la gente en Google.
Analiza el producto y propone las palabras clave por las que debería posicionar su página, y los metadatos.
Reglas:
- Usa SOLO funciones que el texto del producto confirma. No prometas lo que no hace (ni plataformas, ni integraciones, ni precios).
- Incluye y respeta las palabras clave objetivo del autor; complétalas con sinónimos, términos del sector (incluido el inglés si la gente lo busca así, p. ej. "TMS" o "keyboard and mouse sharing") y búsquedas long-tail.
- Entre 10 y 20 palabras clave, en minúsculas, sin duplicados. Exactamente una de tipo "principal".
- No inventes volúmenes de búsqueda ni cifras; si estimas popularidad, dilo en "rationale" como estimación.
- metaTitle: máximo 60 caracteres; empieza por el nombre del producto o la palabra clave principal.
- metaDescription: entre 140 y 160 caracteres, en español, natural (no una lista de palabras), con la palabra clave principal al inicio, 1-2 secundarias y un beneficio o llamada a la acción.
- contentTips: 3 a 6 recomendaciones concretas para el contenido de la página (títulos H2, preguntas frecuentes, frases), porque Google posiciona por el contenido visible, no por la meta.`;

function sanitizeSeo(raw: SeoSuggestion, targets: string[]): SeoSuggestion {
  if (!raw || !Array.isArray(raw.keywords)) throw new EditorialError('La respuesta no trae palabras clave.');
  const seen = new Set<string>();
  const valid = { type: ['principal', 'secundaria', 'long-tail'], intent: ['comercial', 'informativa', 'navegacional'], language: ['es', 'en'] };
  const keywords = raw.keywords
    .filter((k) => k && typeof k.term === 'string' && k.term.trim())
    .map((k) => ({
      term: k.term.trim().toLowerCase().slice(0, 80),
      type: valid.type.includes(k.type) ? k.type : 'secundaria',
      intent: valid.intent.includes(k.intent) ? k.intent : 'comercial',
      language: valid.language.includes(k.language) ? k.language : 'es',
    }) as SeoKeyword)
    .filter((k) => !seen.has(k.term) && seen.add(k.term));
  // Las palabras objetivo del autor nunca se pierden.
  for (const t of targets) if (!seen.has(t)) { keywords.push({ term: t, type: 'secundaria', intent: 'comercial', language: 'es' }); seen.add(t); }
  if (!keywords.some((k) => k.type === 'principal') && keywords[0]) keywords[0].type = 'principal';
  return {
    keywords: keywords.slice(0, 25),
    metaTitle: clip(String(raw.metaTitle ?? ''), 60),
    metaDescription: clip(String(raw.metaDescription ?? ''), 160),
    contentTips: (Array.isArray(raw.contentTips) ? raw.contentTips : []).map(String).filter(Boolean).slice(0, 6),
    rationale: String(raw.rationale ?? '').slice(0, 1000),
  };
}

export async function suggestProjectSeo(input: SeoInput, opts: { model: EditorialModel }) {
  const targets = input.targetKeywords.map((t) => t.trim().toLowerCase()).filter(Boolean);
  if (FAKE()) {
    return {
      suggestion: sanitizeSeo({ ...SEO_EXAMPLE, metaTitle: `${input.title}: prueba local`, rationale: 'Respuesta simulada (EDITORIAL_FAKE).' }, targets),
      usage: { model: `${opts.model} (prueba local)`, inputTokens: 0, outputTokens: 0 },
    };
  }
  const prompt = `Producto: ${input.title}
Resumen: ${input.summary}
${input.url ? `URL del producto: ${input.url}\n` : ''}Palabras clave objetivo del autor (prioritarias):
${targets.length ? targets.map((t) => `- ${t}`).join('\n') : '- (ninguna: propón tú)'}
${input.previousKeywords.length ? `\nPalabras clave de la revisión anterior (mantén las que sigan siendo buenas, cambia las débiles):\n${input.previousKeywords.map((t) => `- ${t}`).join('\n')}\n` : ''}
Contenido de la página:
${input.body.slice(0, 12000) || '(sin contenido todavía)'}`;
  const { data, usage } = await callJson<SeoSuggestion>({
    model: opts.model,
    system: SEO_RULES,
    prompt,
    schema: SEO_SCHEMA,
    example: SEO_EXAMPLE,
    effort: 'medium',
  });
  return { suggestion: sanitizeSeo(data, targets), usage };
}
