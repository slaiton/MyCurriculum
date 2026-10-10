// Renderiza el cuerpo de una publicación: secciones del dynamic zone y bloques del editor (formato Blocks de Strapi).
// Todo se convierte a JSX: nunca se inserta HTML crudo, así el contenido no puede inyectar scripts.
import type { ReactNode } from 'react';
import { extractHeadings, inlineText, mediaUrl, youtubeId } from '@/lib/content';
import type { Block, BodySection, InlineNode, ListItemNode } from '@/lib/types';
import { CopyButton } from './client/CopyButton';
import { YouTubeLite } from './client/VideoPlayer';

const SAFE_URL = /^(https?:|mailto:|tel:|\/|#)/i;

function Inline({ nodes }: { nodes: InlineNode[] }) {
  return (
    <>
      {nodes.map((node, i) => {
        if (node.type === 'link') {
          const external = /^https?:/i.test(node.url);
          if (!SAFE_URL.test(node.url)) return <Inline key={i} nodes={node.children} />;
          return (
            <a key={i} href={node.url} {...(external ? { rel: 'noopener noreferrer', target: '_blank' } : {})}>
              <Inline nodes={node.children} />
              {external && <span className="sr-only"> (abre en otra pestaña)</span>}
            </a>
          );
        }
        let content: ReactNode = node.text;
        if (node.code) content = <code>{content}</code>;
        if (node.bold) content = <strong>{content}</strong>;
        if (node.italic) content = <em>{content}</em>;
        if (node.underline) content = <u>{content}</u>;
        if (node.strikethrough) content = <s>{content}</s>;
        return <span key={i}>{content}</span>;
      })}
    </>
  );
}

function List({ block }: { block: Extract<Block, { type: 'list' }> }) {
  const Tag = block.format === 'ordered' ? 'ol' : 'ul';
  return (
    <Tag>
      {block.children.map((item, i) =>
        item.type === 'list' ? (
          <li key={i}><List block={item} /></li>
        ) : (
          <li key={i}><Inline nodes={(item as ListItemNode).children} /></li>
        ),
      )}
    </Tag>
  );
}

function Blocks({ blocks, headingIds }: { blocks: Block[]; headingIds: Map<Block, string> }) {
  return (
    <>
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'paragraph':
            if (!inlineText(block.children).trim()) return null;
            return <p key={i}><Inline nodes={block.children} /></p>;
          case 'heading': {
            // El H1 es el título del artículo: los encabezados del cuerpo empiezan en H2.
            const level = Math.min(Math.max(block.level, 2), 4) as 2 | 3 | 4;
            const Tag = `h${level}` as const;
            return <Tag key={i} id={headingIds.get(block)}><Inline nodes={block.children} /></Tag>;
          }
          case 'list':
            return <List key={i} block={block} />;
          case 'quote':
            return <blockquote key={i}><Inline nodes={block.children} /></blockquote>;
          case 'code': {
            const code = block.children.map((c) => c.text).join('');
            return (
              <figure key={i} className="code-block">
                <div className="code-block__bar">
                  <span>{block.language || 'código'}</span>
                  <CopyButton text={code} />
                </div>
                <pre><code>{code}</code></pre>
              </figure>
            );
          }
          case 'image': {
            const src = mediaUrl(block.image);
            if (!src) return null;
            return (
              <figure key={i}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={block.image.alternativeText ?? ''} width={block.image.width ?? undefined} height={block.image.height ?? undefined} loading="lazy" />
              </figure>
            );
          }
          default:
            return null;
        }
      })}
    </>
  );
}

export function Body({ sections }: { sections: BodySection[] }) {
  // Asigna a cada encabezado el mismo id que usa la tabla de contenido.
  const headings = extractHeadings(sections);
  const headingIds = new Map<Block, string>();
  let h = 0;
  for (const s of sections) {
    if (s.__component !== 'content.rich-text') continue;
    for (const b of s.content ?? []) {
      if (b.type === 'heading' && (b.level === 2 || b.level === 3)) headingIds.set(b, headings[h++]?.id ?? '');
    }
  }

  return (
    <div className="prose">
      {sections.map((section) => {
        switch (section.__component) {
          case 'content.rich-text':
            return <Blocks key={`rt-${section.id}`} blocks={section.content ?? []} headingIds={headingIds} />;
          case 'content.video': {
            const yt = youtubeId(section.youtubeUrl);
            const file = mediaUrl(section.file);
            if (!yt && !file) return null;
            return (
              <figure key={`v-${section.id}`}>
                {yt ? (
                  <YouTubeLite id={yt} title={section.caption || 'Video'} />
                ) : (
                  <div className="video">
                    <video src={file!} controls preload="none" playsInline />
                  </div>
                )}
                {section.caption && <figcaption>{section.caption}</figcaption>}
              </figure>
            );
          }
          case 'content.image': {
            const src = mediaUrl(section.image);
            if (!src) return null;
            const img = (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src} alt={section.image.alternativeText ?? ''} width={section.image.width ?? undefined} height={section.image.height ?? undefined} loading="lazy" />
            );
            return (
              <figure key={`i-${section.id}`}>
                {section.browserFrame ? (
                  <div className="browser-frame">
                    <div className="browser-frame__bar" aria-hidden><span /><span /><span /></div>
                    {img}
                  </div>
                ) : (
                  img
                )}
                {section.caption && <figcaption>{section.caption}</figcaption>}
              </figure>
            );
          }
          default:
            return null;
        }
      })}
    </div>
  );
}
