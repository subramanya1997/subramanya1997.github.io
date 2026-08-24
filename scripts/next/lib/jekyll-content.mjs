// Filesystem view of the content/ tree for the build scripts.
//
// lib/content.ts is the TypeScript equivalent used by the Next routes; this is
// the plain-JS twin so scripts/next/postbuild.mjs can run under bare node
// without a TS toolchain. Keep the two in agreement.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import yaml from "js-yaml";
import { site } from "../../../site.config.mjs";
import { PAGE_FILES, PAGE_DIRS } from "../../../lib/page-sources.mjs";

export const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

/** Root of the content collections (posts, books, loops, data). */
const CONTENT = path.join(ROOT, "content");

export function siteConfig() {
  return site;
}

export function dataFile(name) {
  for (const extension of [".yml", ".yaml", ".json"]) {
    const file = path.join(CONTENT, "data", name + extension);
    if (fs.existsSync(file)) {
      const raw = fs.readFileSync(file, "utf8");
      return extension === ".json" ? JSON.parse(raw) : yaml.load(raw);
    }
  }
  return null;
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function frontMatterDate(value) {
  if (value instanceof Date) {
    return {
      year: value.getUTCFullYear(),
      month: value.getUTCMonth() + 1,
      day: value.getUTCDate(),
    };
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value ?? ""));
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

const POST_FILE = /^(\d{4})-(\d{2})-(\d{2})-(.+)\.(md|markdown)$/;

/**
 * Posts newest first. The permalink comes from the front matter `date:` when
 * it disagrees with the filename, exactly as Jekyll resolves it.
 */
export function posts() {
  const dir = path.join(CONTENT, "posts");
  return fs
    .readdirSync(dir)
    .map((file) => {
      const match = POST_FILE.exec(file);
      if (!match) return null;
      const sourcePath = path.join(dir, file);
      const { data, content } = matter(fs.readFileSync(sourcePath, "utf8"));
      const parts =
        frontMatterDate(data.date) ?? {
          year: Number(match[1]),
          month: Number(match[2]),
          day: Number(match[3]),
        };
      return {
        kind: "post",
        slug: match[4],
        ...parts,
        url: `/${parts.year}/${pad(parts.month)}/${pad(parts.day)}/${match[4]}/`,
        date: `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`,
        data,
        content,
        sourcePath,
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? -1 : 1;
      return a.sourcePath < b.sourcePath ? -1 : 1;
    })
    .reverse();
}

function collection(dirName, kind, urlFor) {
  const dir = path.join(CONTENT, dirName);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((file) => /\.(md|markdown|html)$/.test(file))
    .map((file) => {
      const sourcePath = path.join(dir, file);
      const { data, content } = matter(fs.readFileSync(sourcePath, "utf8"));
      const slug = file.replace(/\.(md|markdown|html)$/, "");
      const parts = frontMatterDate(data.date);
      return {
        kind,
        slug,
        url: urlFor(slug, data),
        date: parts ? `${parts.year}-${pad(parts.month)}-${pad(parts.day)}` : null,
        data,
        content,
        sourcePath,
      };
    })
    .sort((a, b) => (a.url < b.url ? -1 : 1));
}

export function books() {
  return collection("books", "book", (slug, data) =>
    typeof data.permalink === "string" ? data.permalink : `/books/${slug}/`
  );
}

export function loops() {
  return collection("loops", "loop", (slug) => `/awesome-loops/${slug}/`);
}

/**
 * Page sources: the `content.*` files colocated with their app/ route
 * (lib/page-sources.mjs) plus the flat docs/ directory. Every URL is pinned —
 * by the file's own `permalink:` front matter, else by the registry — and is
 * never derived from where the file sits on disk.
 */
export function pages() {
  const found = [];
  const read = (sourcePath, fallbackUrl) => {
    if (!fs.existsSync(sourcePath)) return;
    const raw = fs.readFileSync(sourcePath, "utf8");
    if (!raw.startsWith("---")) return;
    const { data, content } = matter(raw);
    const url = typeof data.permalink === "string" ? data.permalink : fallbackUrl;
    if (!url) return;
    found.push({ kind: "page", url, data, content, sourcePath });
  };

  for (const page of PAGE_FILES) read(path.join(ROOT, page.source), page.url);
  for (const dirName of PAGE_DIRS) {
    const dir = path.join(ROOT, dirName);
    if (!fs.existsSync(dir)) continue;
    for (const entry of fs.readdirSync(dir)) {
      if (!/\.(md|markdown|html)$/.test(entry)) continue;
      const sourcePath = path.join(dir, entry);
      if (!fs.statSync(sourcePath).isFile()) continue;
      read(sourcePath, `/${dirName}/${entry.replace(/\.(md|markdown|html)$/, "")}/`);
    }
  }
  return found.sort((a, b) => (a.url < b.url ? -1 : 1));
}

function tagsOf(data) {
  const tags = data?.tags;
  if (Array.isArray(tags)) return tags.map(String);
  if (typeof tags === "string" && tags.trim()) return [tags];
  return [];
}

/** Jekyll::Utils.slugify (default mode). */
export function slugify(tag) {
  return String(tag)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Tag archives in _plugins/tag_pages_generator.rb order: most items first,
 * ties broken by lowercased name. Documents inside each record are newest
 * first.
 */
export function tagArchives(postList, bookList) {
  const records = new Map();
  const add = (documents, bucket) => {
    for (const document of documents) {
      for (const tag of tagsOf(document.data)) {
        if (!tag.trim()) continue;
        const slug = slugify(tag);
        if (!records.has(slug)) records.set(slug, { name: tag, slug, posts: [], books: [] });
        records.get(slug)[bucket].push(document);
      }
    }
  };
  add(postList, "posts");
  add(bookList, "books");

  // Ruby's `sort_by { |d| d.date }.reverse` is not a stable sort, and the
  // Jekyll build resolves same-date ties back to `site.posts` order (newest
  // first). A stable descending sort reproduces that.
  const byDateDescStable = (documents) =>
    documents
      .map((document, index) => ({ document, index }))
      .sort((a, b) => {
        const left = a.document.date ?? "";
        const right = b.document.date ?? "";
        if (left !== right) return left < right ? 1 : -1;
        return a.index - b.index;
      })
      .map((entry) => entry.document);

  return [...records.values()]
    .map((record) => ({
      ...record,
      posts: byDateDescStable(record.posts),
      books: byDateDescStable(record.books),
      postCount: record.posts.length,
      bookCount: record.books.length,
      totalCount: record.posts.length + record.books.length,
    }))
    .sort((a, b) => {
      if (a.totalCount !== b.totalCount) return b.totalCount - a.totalCount;
      return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1;
    });
}

export { tagsOf };
