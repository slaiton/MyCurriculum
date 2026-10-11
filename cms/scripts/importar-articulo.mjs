#!/usr/bin/env node
// Importa artículos en Markdown al CMS como BORRADORES (nunca publica).
//
// Uso:
//   CMS_URL=https://cms.slaiton.com CMS_WRITE_TOKEN=xxxx node cms/scripts/importar-articulo.mjs docs/contenido/articulos/*.md
//
// Cada archivo lleva un encabezado (front matter) y el cuerpo en Markdown:
//   ---
//   title: Título del artículo
//   slug: titulo-del-articulo
//   excerpt: Resumen de máximo 200 caracteres
//   category: arquitectura            (slug de la categoría)
//   tags: [laravel, php]              (se crean si no existen)
//   featured: true
//   metaTitle: Título SEO (≤60)
//   metaDescription: Descripción SEO (≤160)
//   ---
//   ## Primer título
//   Texto...
//
// Si ya existe un artículo con el mismo slug, actualiza su borrador (lo publicado no cambia hasta que pulses Publish).
// El token se crea en Strapi > Settings > API Tokens, tipo "Custom", con permisos:
//   Publicación: find, findOne, create, update · Etiqueta: find, create · Categoría: find
import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';

const CMS_URL = (process.env.CMS_URL || 'http://localhost:1337').replace(/\/$/, '');
const TOKEN = process.env.CMS_WRITE_TOKEN;
const files = process.argv.slice(2);

if (!TOKEN || files.length === 0) {
  console.error('Uso: CMS_URL=... CMS_WRITE_TOKEN=... node cms/scripts/importar-articulo.mjs archivo.md [...]');
  process.exit(1);
}

const slugify = (text) =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/** Front matter simple: "clave: valor", listas "[a, b]" y booleanos. */
function parse(raw) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw);
  if (!match) throw new Error('Falta el encabezado --- ... ---');
  const meta = {};
  for (const line of match[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z]+):\s*(.*)$/.exec(line);
    if (!kv) continue;
    let value = kv[2].trim();
    if (/^\[.*\]$/.test(value)) value = value.slice(1, -1).split(',').map((v) => v.trim()).filter(Boolean);
    else if (value === 'true' || value === 'false') value = value === 'true';
    meta[kv[1]] = value;
  }
  return { meta, body: match[2].trim() + '\n' };
}

async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${CMS_URL}/api/${path}`, {
    method,
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = json?.error?.details?.errors?.map((e) => `${e.path?.join('.')}: ${e.message}`).join('; ');
    throw new Error(`${method} ${path} → ${res.status} ${json?.error?.message ?? ''}${detail ? ` (${detail})` : ''}`);
  }
  return json;
}

const findOne = async (collection, slug, status) =>
  (await api(`${collection}?filters[slug][$eq]=${encodeURIComponent(slug)}${status ? `&status=${status}` : ''}`)).data?.[0] ?? null;

async function tagIds(names = []) {
  const ids = [];
  for (const name of names) {
    const slug = slugify(name);
    const existing = await findOne('tags', slug);
    ids.push(existing ? existing.documentId : (await api('tags', { method: 'POST', body: { data: { name, slug } } })).data.documentId);
  }
  return ids;
}

function validate(meta) {
  const errors = [];
  for (const field of ['title', 'slug', 'excerpt', 'category']) if (!meta[field]) errors.push(`falta "${field}"`);
  if (meta.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(meta.slug)) errors.push('slug inválido (solo minúsculas, números y guiones)');
  if (meta.excerpt?.length > 200) errors.push(`excerpt de ${meta.excerpt.length} caracteres (máx. 200)`);
  if (meta.metaTitle?.length > 60) errors.push(`metaTitle de ${meta.metaTitle.length} caracteres (máx. 60)`);
  if (meta.metaDescription?.length > 160) errors.push(`metaDescription de ${meta.metaDescription.length} caracteres (máx. 160)`);
  return errors;
}

let failed = 0;
for (const file of files) {
  try {
    const { meta, body } = parse(await readFile(file, 'utf8'));
    const errors = validate(meta);
    if (errors.length) throw new Error(errors.join(', '));

    const category = await findOne('categories', meta.category);
    if (!category) throw new Error(`no existe la categoría "${meta.category}"`);

    const data = {
      title: meta.title,
      slug: meta.slug,
      excerpt: meta.excerpt,
      featured: Boolean(meta.featured),
      category: category.documentId,
      tags: await tagIds(meta.tags),
      body: [{ __component: 'content.markdown', body }],
      seo: meta.metaTitle || meta.metaDescription ? { metaTitle: meta.metaTitle, metaDescription: meta.metaDescription } : null,
    };

    const existing = await findOne('posts', meta.slug, 'draft');
    if (existing) {
      await api(`posts/${existing.documentId}`, { method: 'PUT', body: { data } });
      console.log(`✓ ${basename(file)} → borrador actualizado (/blog/${meta.slug})`);
    } else {
      await api('posts', { method: 'POST', body: { data } });
      console.log(`✓ ${basename(file)} → borrador creado (/blog/${meta.slug})`);
    }
  } catch (error) {
    failed++;
    console.error(`✗ ${basename(file)}: ${error.message}`);
  }
}
console.log(failed ? `\n${failed} archivo(s) con error.` : '\nListo. Revisa los borradores en el panel, usa Preview y publica cuando quieras.');
process.exit(failed ? 1 : 0);
