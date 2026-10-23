// Typed, cached access to the content/ tree for the Next routes. The reading
// itself lives in lib/content-source.mjs, shared with the bare-node prebuild
// scripts, so both see the same posts, permalinks and ordering. Site-wide
// settings come from site.config.mjs.
import { site } from "@/site.config.mjs";
import { ROOT, books, dataFile, loops, posts, slugify } from "@/lib/content-source.mjs";

export { ROOT };

// ---------- site config ----------

export interface SiteConfig {
  title: string;
  email: string;
  description: string;
  url: string;
  default_social_image: string;
  social_image_version: string | number;
  default_lang: string;
  languages: { code: string; name: string; native: string }[];
  newsletter: Record<string, unknown>;
  [key: string]: unknown;
}

export function getSiteConfig(): SiteConfig {
  return site as unknown as SiteConfig;
}

// ---------- posts ----------

export interface PostFrontmatter {
  title: string;
  description?: string;
  excerpt?: string;
  author?: string;
  date?: string | Date;
  last_modified_at?: string | Date;
  image?: string;
  tags?: string[];
  ready?: boolean;
  schema_type?: string;
  faq?: { q: string; a: string }[];
  [key: string]: unknown;
}

export interface Post {
  slug: string; // url slug, e.g. "claude-skills-vs-mcp-..."
  year: string; // "2025"
  month: string; // "10" (zero-padded)
  day: string; // "30"
  url: string; // "/2025/10/30/slug/" — MUST match Jekyll pretty permalink
  date: Date;
  frontmatter: PostFrontmatter;
  content: string; // raw markdown body
  sourcePath: string; // absolute path to the content/posts file
}

let _posts: Post[] | null = null;
/** Active posts, newest first. Retired documents remain available at their indexed URLs. */
export function getAllPosts(includeRetired = false): Post[] {
  _posts ??= posts().map((post) => {
    const month = String(post.month).padStart(2, "0");
    const day = String(post.day).padStart(2, "0");
    return {
      slug: post.slug,
      year: String(post.year),
      month,
      day,
      url: post.url,
      date: new Date(`${post.date}T00:00:00Z`),
      frontmatter: post.data as PostFrontmatter,
      content: post.content,
      sourcePath: post.sourcePath,
    };
  });
  return includeRetired ? _posts : _posts.filter((post) => !post.frontmatter.retired);
}

export function getPost(year: string, month: string, day: string, slug: string) {
  return getAllPosts(true).find(
    (p) => p.year === year && p.month === month && p.day === day && p.slug === slug
  );
}

// ---------- collections: books & loops ----------

export interface CollectionDoc {
  slug: string;
  url: string;
  frontmatter: Record<string, unknown>;
  content: string;
  sourcePath: string;
}

function toDoc(doc: ReturnType<typeof books>[number]): CollectionDoc {
  return {
    slug: doc.slug,
    url: doc.url,
    frontmatter: doc.data,
    content: doc.content,
    sourcePath: doc.sourcePath,
  };
}

/** content/loops collection — permalink: /awesome-loops/:path/ */
export function getAllLoops(): CollectionDoc[] {
  return loops().map(toDoc);
}

/** content/books collection — URL from front matter `permalink:`, else /books/<slug>/. */
export function getAllBooks(): CollectionDoc[] {
  return books().map(toDoc);
}

// ---------- tags ----------

/** Jekyll's tag slugify (mode: default): lowercase, spaces/special chars → hyphen. */
export const slugifyTag: (tag: string) => string = slugify;

// ---------- data files ----------

export function getDataFile<T = unknown>(name: string): T {
  const data = dataFile(name);
  if (data === null) throw new Error(`data file not found: content/data/${name}`);
  return data as T;
}
