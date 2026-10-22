import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { Body } from '@/components/Body';
import { Cover } from '@/components/Cover';
import { PostCard } from '@/components/PostCard';
import { TableOfContents } from '@/components/Sections';
import { Breadcrumbs, JsonLd } from '@/components/Seo';
import { ReadingProgress } from '@/components/client/ReadingProgress';
import { Reveal } from '@/components/client/Reveal';
import { ShareLinks } from '@/components/client/ShareLinks';
import { findRedirect, getAllPostSlugs, getPostBySlug, getRelatedPosts, getSettings } from '@/lib/cms';
import { extractHeadings, formatDate, mediaUrl, readingMinutes, SITE_URL, whatsappUrl } from '@/lib/content';

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getAllPostSlugs()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPostBySlug((await params).slug);
  if (!post) return {};
  const title = post.seo?.metaTitle || post.title;
  const description = post.seo?.metaDescription || post.excerpt;
  const image = mediaUrl(post.seo?.ogImage) || mediaUrl(post.cover);
  return {
    title,
    description,
    keywords: post.seo?.keywords?.length ? post.seo.keywords : undefined,
    alternates: { canonical: post.seo?.canonicalUrl || `/blog/${post.slug}` },
    robots: post.seo?.noIndex ? { index: false, follow: true } : undefined,
    openGraph: {
      type: 'article',
      title,
      description,
      url: `/blog/${post.slug}`,
      publishedTime: post.publishedAt,
      modifiedTime: post.contentUpdatedAt || undefined,
      section: post.category?.name,
      tags: post.tags?.map((t) => t.name),
      images: image ? [{ url: image, alt: post.cover?.alternativeText ?? '' }] : undefined,
    },
    twitter: { card: image ? 'summary_large_image' : 'summary', title, description },
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) {
    // Si el slug cambió, el CMS guarda la redirección: respondemos 308 permanente.
    const target = await findRedirect(`/blog/${slug}`);
    if (target && target.startsWith('/') && !target.startsWith('//')) permanentRedirect(target);
    notFound();
  }

  const [settings, related] = await Promise.all([getSettings(), getRelatedPosts(post)]);
  const headings = extractHeadings(post.body);
  const minutes = readingMinutes(post.body);
  const url = `${SITE_URL}/blog/${post.slug}`;
  const color = post.category?.color ?? 'teal';
  const crumbs = [
    { name: 'Inicio', href: '/' },
    { name: 'Blog', href: '/blog' },
    ...(post.category ? [{ name: post.category.name, href: `/blog/categoria/${post.category.slug}` }] : []),
    { name: post.title, href: `/blog/${post.slug}` },
  ];

  return (
    <>
      <ReadingProgress targetId="articulo" />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: post.title,
          description: post.excerpt,
          datePublished: post.publishedAt,
          dateModified: post.contentUpdatedAt || post.publishedAt,
          inLanguage: 'es',
          mainEntityOfPage: url,
          url,
          image: mediaUrl(post.cover) || undefined,
          articleSection: post.category?.name,
          keywords: post.tags?.map((t) => t.name).join(', ') || undefined,
          author: { '@type': 'Person', name: settings.name, url: `${SITE_URL}/sobre-mi` },
          publisher: { '@type': 'Person', name: settings.name },
        }}
      />

      <article id="articulo">
        <header className="narrow article-head">
          <Breadcrumbs items={crumbs} />
          <p className="meta" style={{ marginTop: 28 }}>
            {post.category && (
              <Link href={`/blog/categoria/${post.category.slug}`} className="badge" data-color={color}>
                {post.category.name}
              </Link>
            )}{' '}
            · {minutes} min de lectura
          </p>
          <h1>{post.title}</h1>
          <p className="lead">{post.excerpt}</p>
          <div className="byline">
            <Image src="/perfil.jpg" alt="" width={44} height={44} />
            <div>
              <strong>{settings.name}</strong>
              <span className="meta">
                {post.publishedAt ? (
                  <>Publicado el <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time></>
                ) : (
                  'Borrador sin publicar'
                )}
                {post.contentUpdatedAt && (
                  <>
                    {' '}· Actualizado el <time dateTime={post.contentUpdatedAt}>{formatDate(post.contentUpdatedAt)}</time>
                  </>
                )}
              </span>
            </div>
          </div>
        </header>

        {post.cover && (
          <figure className="article-cover" style={{ margin: '0 auto' }}>
            <Cover media={post.cover} color={color} ratio="21x9" sizes="(max-width: 1100px) 100vw, 1080px" priority />
          </figure>
        )}

        <div className="container article-layout">
          <aside className="article-layout__aside">
            <TableOfContents headings={headings} />
          </aside>
          <div className="article-layout__body">
            <Body sections={post.body} />

            <div className="article-foot">
              {post.tags && post.tags.length > 0 && (
                <ul className="tag-list" aria-label="Etiquetas">
                  {post.tags.map((t) => (
                    <li key={t.slug}>
                      <Link href={`/blog/etiqueta/${t.slug}`}>#{t.name}</Link>
                    </li>
                  ))}
                </ul>
              )}
              <ShareLinks url={url} title={post.title} />
            </div>

            <div className="author-box">
              <Image src="/perfil.jpg" alt="" width={64} height={64} />
              <div>
                <strong>{settings.name}</strong>
                <p style={{ marginTop: 4, color: 'var(--ink-2)' }}>
                  {settings.role.charAt(0).toUpperCase() + settings.role.slice(1)}. ¿Te sirvió o tienes un caso parecido?{' '}
                  <a href={whatsappUrl(settings.whatsapp, `Hola Stiven, leí "${post.title}".`)} target="_blank" rel="noopener noreferrer">Escríbeme</a>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </article>

      <section className="container section" aria-labelledby="relacionados">
        <div className="section-head">
          <h2 id="relacionados" className="section-title">{related.length ? 'Artículos relacionados' : 'Sigue explorando'}</h2>
          <Link href="/blog" className="more-link">← Volver al blog</Link>
        </div>
        {related.length > 0 && (
          <Reveal className="post-grid">
            {related.map((p) => (
              <PostCard key={p.slug} post={p} />
            ))}
          </Reveal>
        )}
      </section>
    </>
  );
}
