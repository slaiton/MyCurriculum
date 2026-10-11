// Sección Markdown del cuerpo. react-markdown no interpreta HTML incrustado (lo muestra como texto)
// y filtra URLs peligrosas (javascript:), así que el contenido pegado no puede inyectar scripts.
import type { ComponentProps, ReactElement, ReactNode } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { mediaUrl } from '@/lib/content';
import { CopyButton } from './client/CopyButton';

const textOf = (node: ReactNode): string => {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (node && typeof node === 'object' && 'props' in node) return textOf((node as ReactElement<{ children?: ReactNode }>).props.children);
  return '';
};

/** `headingIds`: ids de la tabla de contenido para los H1–H3 de esta sección, en orden. */
export function Markdown({ source, headingIds }: { source: string; headingIds: string[] }) {
  let next = 0;
  const heading = (Tag: 'h2' | 'h3') =>
    function MdHeading({ children }: ComponentProps<'h2'>) {
      return <Tag id={headingIds[next++]}>{children}</Tag>;
    };

  const components: Components = {
    // El H1 es el título del artículo: un "#" en el cuerpo se muestra como H2.
    h1: heading('h2'),
    h2: heading('h2'),
    h3: heading('h3'),
    h4: ({ children }) => <h4>{children}</h4>,
    h5: ({ children }) => <h4>{children}</h4>,
    h6: ({ children }) => <h4>{children}</h4>,
    pre({ children }) {
      const code = (Array.isArray(children) ? children[0] : children) as ReactElement<{ className?: string; children?: ReactNode }>;
      const language = /language-([\w+-]+)/.exec(code?.props?.className ?? '')?.[1];
      const text = textOf(code?.props?.children).replace(/\n$/, '');
      return (
        <figure className="code-block">
          <div className="code-block__bar">
            <span>{language || 'código'}</span>
            <CopyButton text={text} />
          </div>
          <pre><code>{text}</code></pre>
        </figure>
      );
    },
    a({ href = '', children }) {
      const external = /^https?:/i.test(href);
      return (
        <a href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
          {children}
          {external && <span className="sr-only"> (abre en otra pestaña)</span>}
        </a>
      );
    },
    img({ src, alt }) {
      const url = typeof src === 'string' ? mediaUrl({ url: src }) : null;
      // eslint-disable-next-line @next/next/no-img-element
      return url ? <img src={url} alt={alt ?? ''} loading="lazy" /> : null;
    },
    table({ children }) {
      return (
        <div className="table-wrap">
          <table>{children}</table>
        </div>
      );
    },
  };

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {source}
    </ReactMarkdown>
  );
}
