import Link from 'next/link';
import { formatDate } from '@/lib/content';
import type { Post } from '@/lib/types';
import { Cover } from './Cover';

export function CategoryBadge({ post }: { post: Pick<Post, 'category'> }) {
  if (!post.category) return null;
  return (
    <Link href={`/blog/categoria/${post.category.slug}`} className="badge" data-color={post.category.color}>
      {post.category.name}
    </Link>
  );
}

export function PostMeta({ post, withCategory = true }: { post: Post; withCategory?: boolean }) {
  return (
    <div className="post-card__meta">
      {withCategory && <CategoryBadge post={post} />}
      <span className="meta">
        <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
      </span>
    </div>
  );
}

/** Tarjeta estándar (grilla) o destacada (más grande, con extracto). */
export function PostCard({ post, variant = 'grid', priority = false }: { post: Post; variant?: 'grid' | 'featured'; priority?: boolean }) {
  const href = `/blog/${post.slug}`;
  const color = post.category?.color ?? 'teal';
  const Heading = variant === 'featured' ? 'h3' : 'h2';
  return (
    <article className={`post-card ${variant === 'featured' ? 'featured__main' : ''}`}>
      <Link href={href} tabIndex={-1} aria-hidden>
        <Cover media={post.cover} color={color} ratio={variant === 'featured' ? '16x9' : '3x2'} priority={priority} />
      </Link>
      <PostMeta post={post} />
      <Heading className="post-card__title">
        <Link href={href}>{post.title}</Link>
      </Heading>
      <p className="post-card__excerpt">{post.excerpt}</p>
    </article>
  );
}

/** Fila compacta para la columna lateral de destacados. */
export function PostRow({ post }: { post: Post }) {
  const href = `/blog/${post.slug}`;
  return (
    <article className="post-row">
      <Link href={href} tabIndex={-1} aria-hidden style={{ flex: '0 0 112px' }}>
        <Cover media={post.cover} color={post.category?.color ?? 'teal'} ratio="4x3" sizes="112px" />
      </Link>
      <div>
        <p className="meta" style={{ marginBottom: 6 }}>
          {post.category?.name}
        </p>
        <h3 className="post-card__title">
          <Link href={href}>{post.title}</Link>
        </h3>
      </div>
    </article>
  );
}
