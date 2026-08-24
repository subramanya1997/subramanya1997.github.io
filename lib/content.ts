// Content loaders over the Jekyll source directories (_posts, _books, _loops,
// _data, _config.yml). These directories remain the single source of truth so
// the existing translation / OG-image / analytics scripts keep working.
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import yaml from "js-yaml";

export const ROOT = process.cwd();

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

let _site: SiteConfig | null = null;
export function getSiteConfig(): SiteConfig {
  if (!_site) {
    _site = yaml.load(
      fs.readFileSync(path.join(ROOT, "_config.yml"), "utf8")
    ) as SiteConfig;
  }
  return _site;
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
  sourcePath: string; // absolute path to the _posts file
}

const POST_FILE = /^(\d{4})-(\d{2})-(\d{2})-(.+)\.(md|markdown)$/;

let _posts: Post[] | null = null;
/** All posts, newest first. Matches Jekyll: no draft filtering beyond file presence. */
export function getAllPosts(): Post[] {
  if (_posts) return _posts;
  const dir = path.join(ROOT, "_posts");
  _posts = fs
    .readdirSync(dir)
    .map((file) => {
      const m = file.match(POST_FILE);
      if (!m) return null;
      const [, year, month, day, slug] = m;
      const sourcePath = path.join(dir, file);
      const { data, content } = matter(fs.readFileSync(sourcePath, "utf8"));
      return {
        slug,
        year,
        month,
        day,
        url: `/${year}/${month}/${day}/${slug}/`,
        date: new Date(`${year}-${month}-${day}T00:00:00Z`),
        frontmatter: data as PostFrontmatter,
        content,
        sourcePath,
      } satisfies Post;
    })
    .filter((p): p is Post => p !== null)
    .sort((a, b) => b.date.getTime() - a.date.getTime());
  return _posts;
}

export function getPost(year: string, month: string, day: string, slug: string) {
  return getAllPosts().find(
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

function loadCollection(dirName: string, urlFor: (slug: string, fm: Record<string, unknown>) => string): CollectionDoc[] {
  const dir = path.join(ROOT, dirName);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => /\.(md|markdown|html)$/.test(f))
    .map((file) => {
      const sourcePath = path.join(dir, file);
      const { data, content } = matter(fs.readFileSync(sourcePath, "utf8"));
      const slug = file.replace(/\.(md|markdown|html)$/, "");
      return { slug, url: urlFor(slug, data), frontmatter: data, content, sourcePath };
    });
}

/** _loops collection — permalink: /awesome-loops/:path/ */
export function getAllLoops(): CollectionDoc[] {
  return loadCollection("_loops", (slug) => `/awesome-loops/${slug}/`);
}

/** _books collection — output: true, default permalink (/books/slug.html → check frontmatter). */
export function getAllBooks(): CollectionDoc[] {
  return loadCollection("_books", (slug, fm) =>
    typeof fm.permalink === "string" ? (fm.permalink as string) : `/books/${slug}/`
  );
}

// ---------- tags ----------

export interface TagRecord {
  name: string; // display name, first-seen casing
  slug: string; // url slug used by /tags/{slug}/ and /tags-{slug}/
  posts: Post[];
  books: CollectionDoc[];
}

/** Jekyll's tag slugify (mode: default): lowercase, spaces/special chars → hyphen. */
export function slugifyTag(tag: string): string {
  return tag
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

let _tags: TagRecord[] | null = null;
export function getAllTags(): TagRecord[] {
  if (_tags) return _tags;
  const map = new Map<string, TagRecord>();
  for (const post of getAllPosts()) {
    for (const tag of post.frontmatter.tags ?? []) {
      const slug = slugifyTag(tag);
      if (!map.has(slug)) map.set(slug, { name: tag, slug, posts: [], books: [] });
      map.get(slug)!.posts.push(post);
    }
  }
  for (const book of getAllBooks()) {
    const tags = (book.frontmatter.tags as string[] | undefined) ?? [];
    for (const tag of tags) {
      const slug = slugifyTag(tag);
      if (!map.has(slug)) map.set(slug, { name: tag, slug, posts: [], books: [] });
      map.get(slug)!.books.push(book);
    }
  }
  _tags = [...map.values()].sort((a, b) => a.slug.localeCompare(b.slug));
  return _tags;
}

// ---------- data files ----------

export function getDataFile<T = unknown>(name: string): T {
  const dir = path.join(ROOT, "_data");
  for (const ext of [".yml", ".yaml", ".json"]) {
    const p = path.join(dir, name + ext);
    if (fs.existsSync(p)) {
      const raw = fs.readFileSync(p, "utf8");
      return (ext === ".json" ? JSON.parse(raw) : yaml.load(raw)) as T;
    }
  }
  throw new Error(`data file not found: _data/${name}`);
}
