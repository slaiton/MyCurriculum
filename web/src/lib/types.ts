// Modelos que el sitio consume. Reflejan los content types de cms/src/api (Strapi 5, respuesta REST plana).

export type CategoryColor = 'violet' | 'amber' | 'coral' | 'green' | 'teal' | 'blue';

export interface Media {
  url: string;
  alternativeText?: string | null;
  width?: number | null;
  height?: number | null;
  mime?: string | null;
}

export interface Seo {
  metaTitle?: string | null;
  metaDescription?: string | null;
  canonicalUrl?: string | null;
  noIndex?: boolean | null;
  ogImage?: Media | null;
}

// --- Formato Blocks de Strapi (campo "blocks") ---
export interface TextNode {
  type: 'text';
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
}
export interface LinkNode {
  type: 'link';
  url: string;
  children: TextNode[];
}
export type InlineNode = TextNode | LinkNode;
export interface ListItemNode {
  type: 'list-item';
  children: InlineNode[];
}
export type Block =
  | { type: 'paragraph'; children: InlineNode[] }
  | { type: 'heading'; level: 1 | 2 | 3 | 4 | 5 | 6; children: InlineNode[] }
  | { type: 'list'; format: 'ordered' | 'unordered'; children: (ListItemNode | Extract<Block, { type: 'list' }>)[] }
  | { type: 'quote'; children: InlineNode[] }
  | { type: 'code'; language?: string; children: TextNode[] }
  | { type: 'image'; image: Media; children?: InlineNode[] };

// --- Secciones del cuerpo (dynamic zone "body") ---
export type BodySection =
  | { __component: 'content.rich-text'; id: number; content: Block[] }
  | { __component: 'content.video'; id: number; file?: Media | null; youtubeUrl?: string | null; caption?: string | null }
  | { __component: 'content.image'; id: number; image: Media; caption?: string | null; browserFrame?: boolean | null };

export interface Category {
  name: string;
  slug: string;
  description?: string | null;
  color: CategoryColor;
  seo?: Seo | null;
}

export interface Tag {
  name: string;
  slug: string;
}

export interface Post {
  documentId: string;
  title: string;
  slug: string;
  excerpt: string;
  body: BodySection[];
  cover?: Media | null;
  category?: Category | null;
  tags?: Tag[];
  featured?: boolean | null;
  contentUpdatedAt?: string | null;
  publishedAt: string;
  seo?: Seo | null;
}

export interface Project {
  documentId: string;
  title: string;
  slug: string;
  summary: string;
  body?: BodySection[];
  cover?: Media | null;
  url?: string | null;
  repoUrl?: string | null;
  stack?: string[] | null;
  color: CategoryColor;
  order?: number | null;
  seo?: Seo | null;
}

export interface Experience {
  jobTitle: string;
  company?: string | null;
  startDate: string;
  endDate?: string | null;
  description: string;
}

export interface Skill {
  name: string;
  level: number;
}

export interface SiteSettings {
  name: string;
  role: string;
  bio: string;
  careerStartDate: string;
  whatsapp: string;
  email: string;
  linkedinUrl: string;
  githubUrl: string;
  cv?: Media | null;
  heroVideo?: Media | null;
  seo?: Seo | null;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageCount: number;
  total: number;
}
