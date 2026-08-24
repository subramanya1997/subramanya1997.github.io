// Builders for every non-HTML surface of the site: feed.xml, search.json,
// sitemap.xml, sitemapindex.xml, llms.txt, llms-full.txt and the versioned
// /api/v1/*.json endpoints.
//
// Ground truth is the final Jekyll build in _site/ and its Liquid sources
// (feed.xml, search.json, sitemap.xml, sitemapindex.xml, llms.txt,
// llms-full.txt, api/v1/*.json). Everything here reproduces the Liquid filters
// those templates rely on (xml_escape, strip_html, strip_newlines,
// truncatewords, number_of_words, date_to_rfc822, date_to_xmlschema, slugify)
// so the emitted payloads match field for field.
//
// This module owns only machine-readable output; HTML routes live elsewhere.
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import {
  ROOT,
  getSiteConfig,
  getAllPosts,
  getAllBooks,
  getAllLoops,
  getDataFile,
  slugifyTag,
  type Post,
  type CollectionDoc,
} from "./content";
import { PAGE_ENTRIES, PAGE_FILES, PAGE_DIRS } from "./page-sources.mjs";
import { renderMarkdown } from "./markdown";

// ---------------------------------------------------------------------------
// site basics
// ---------------------------------------------------------------------------

/** Jekyll builds in the repo's local timezone; the site has always built in PT. */
const SITE_TZ = "America/Los_Angeles";

export function siteUrl(): string {
  return String(getSiteConfig().url).replace(/\/$/, "");
}

export function baseUrl(): string {
  return String(getSiteConfig().baseurl ?? "");
}

/** Absolute URL for a site-root-relative path, matching Jekyll's `site.url` + path. */
export function absoluteUrl(pathname: string): string {
  return `${siteUrl()}${pathname}`;
}

// ---------------------------------------------------------------------------
// Liquid filter equivalents
// ---------------------------------------------------------------------------

/** Liquid `xml_escape` == Ruby CGI.escapeHTML: & " ' < > */
export function xmlEscape(input: unknown): string {
  return String(input ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Liquid `strip_html`: drop script/style blocks and comments, then all tags. */
export function stripHtml(input: unknown): string {
  return String(input ?? "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[\s\S]*?>/g, "");
}

/** Liquid `strip_newlines`. */
export function stripNewlines(input: unknown): string {
  return String(input ?? "").replace(/\r?\n/g, "");
}

/** Liquid `truncatewords: n` (default ellipsis "..."). */
export function truncateWords(input: unknown, words: number): string {
  const tokens = String(input ?? "")
    .split(/\s+/)
    .filter(Boolean);
  if (tokens.length <= words) return tokens.join(" ");
  return `${tokens.slice(0, words).join(" ")}...`;
}

/** Jekyll `number_of_words` (default mode) == Ruby String#split.length. */
export function numberOfWords(input: unknown): number {
  return String(input ?? "")
    .split(/\s+/)
    .filter(Boolean).length;
}

/** Ruby `sort_natural` on strings == case-insensitive sort. */
function sortNatural(values: string[]): string[] {
  return [...values].sort((a, b) => {
    const la = a.toLowerCase();
    const lb = b.toLowerCase();
    return la < lb ? -1 : la > lb ? 1 : 0;
  });
}

// ---------------------------------------------------------------------------
// dates — Jekyll formats every date in the build timezone (America/Los_Angeles)
// ---------------------------------------------------------------------------

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface WallClock {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
  second: number;
  offsetMinutes: number; // e.g. -420 for PDT
}

/** UTC offset of SITE_TZ at a given instant, in minutes. */
function tzOffsetMinutes(instant: Date): number {
  const label = new Intl.DateTimeFormat("en-US", {
    timeZone: SITE_TZ,
    timeZoneName: "longOffset",
  })
    .formatToParts(instant)
    .find((part) => part.type === "timeZoneName")?.value;
  const match = /GMT([+-])(\d{2}):(\d{2})/.exec(label ?? "");
  if (!match) return 0;
  const sign = match[1] === "-" ? -1 : 1;
  return sign * (Number(match[2]) * 60 + Number(match[3]));
}

/**
 * A date-only value (post/book front matter) is midnight *local* time in
 * Jekyll. Probing the offset at 00:00 UTC of the same day lands on the
 * previous local evening, which always carries the same offset as local
 * midnight (DST changes happen at 02:00 local).
 */
export function wallClockFromYMD(year: number, month: number, day: number): WallClock {
  const probe = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  return {
    year,
    month,
    day,
    hour: 0,
    minute: 0,
    second: 0,
    offsetMinutes: tzOffsetMinutes(probe),
  };
}

/** The current instant expressed as SITE_TZ wall clock — Jekyll's `site.time`. */
export function nowWallClock(now: Date = new Date()): WallClock {
  const offsetMinutes = tzOffsetMinutes(now);
  const shifted = new Date(now.getTime() + offsetMinutes * 60_000);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
    second: shifted.getUTCSeconds(),
    offsetMinutes,
  };
}

function pad(value: number, width = 2): string {
  return String(Math.abs(value)).padStart(width, "0");
}

function offsetString(minutes: number, separator: string): string {
  const sign = minutes < 0 ? "-" : "+";
  return `${sign}${pad(Math.floor(Math.abs(minutes) / 60))}${separator}${pad(Math.abs(minutes) % 60)}`;
}

/** Liquid `date_to_rfc822` — "Mon, 17 Aug 2026 00:00:00 -0700". */
export function dateToRfc822(wall: WallClock): string {
  const weekday =
    DAYS[new Date(Date.UTC(wall.year, wall.month - 1, wall.day)).getUTCDay()];
  return (
    `${weekday}, ${pad(wall.day)} ${MONTHS_SHORT[wall.month - 1]} ${wall.year} ` +
    `${pad(wall.hour)}:${pad(wall.minute)}:${pad(wall.second)} ${offsetString(wall.offsetMinutes, "")}`
  );
}

/** Liquid `date_to_xmlschema` — "2026-08-23T20:38:47-07:00". */
export function dateToXmlschema(wall: WallClock): string {
  return (
    `${wall.year}-${pad(wall.month)}-${pad(wall.day)}T` +
    `${pad(wall.hour)}:${pad(wall.minute)}:${pad(wall.second)}${offsetString(wall.offsetMinutes, ":")}`
  );
}

/** Liquid `date: "%Y-%m-%d"`. */
export function dateIso(wall: WallClock): string {
  return `${wall.year}-${pad(wall.month)}-${pad(wall.day)}`;
}

/** Liquid `date: "%B %-d, %Y"`. */
export function dateDisplay(wall: WallClock): string {
  return `${MONTHS_LONG[wall.month - 1]} ${wall.day}, ${wall.year}`;
}

/**
 * Jekyll builds a post's pretty permalink from its *effective* date: the
 * front matter `date:` when present, falling back to the filename date.
 * Three posts in content/posts/ have a front matter date that disagrees with
 * their filename (e.g. content/posts/2023-12-28-demystifying-the-shell-scripting-a-
 * beginners-guide.md has `date: 2022-12-28` and is published at
 * /2022/12/28/...). lib/content.ts derives Post.url from the filename only, so
 * every URL emitted here is normalized against the front matter first.
 */
export interface OutputPost {
  post: Post;
  url: string;
  year: number;
  month: number;
  day: number;
}

function effectiveDateParts(post: Post): { year: number; month: number; day: number } {
  const declared = docWallClock(post.frontmatter.date);
  if (declared) return { year: declared.year, month: declared.month, day: declared.day };
  return { year: Number(post.year), month: Number(post.month), day: Number(post.day) };
}

let _outputPosts: OutputPost[] | null = null;

/** Posts newest first, matching Jekyll's `site.posts` (date, then path). */
export function getOutputPosts(): OutputPost[] {
  if (_outputPosts) return _outputPosts;
  _outputPosts = getAllPosts()
    .map((post) => {
      const { year, month, day } = effectiveDateParts(post);
      return {
        post,
        year,
        month,
        day,
        url: `/${year}/${pad(month)}/${pad(day)}/${post.slug}/`,
      };
    })
    // Jekyll orders documents by [date, path] ascending, then reverses.
    .sort((a, b) => {
      const da = `${a.year}-${pad(a.month)}-${pad(a.day)}`;
      const db = `${b.year}-${pad(b.month)}-${pad(b.day)}`;
      if (da !== db) return da < db ? -1 : 1;
      return a.post.sourcePath < b.post.sourcePath ? -1 : 1;
    })
    .reverse();
  return _outputPosts;
}

function postWallClock(entry: OutputPost): WallClock {
  return wallClockFromYMD(entry.year, entry.month, entry.day);
}

/** Front matter `date:` values arrive as Date (YAML timestamp) or string. */
export function docWallClock(value: unknown): WallClock | null {
  if (value instanceof Date) {
    return wallClockFromYMD(
      value.getUTCFullYear(),
      value.getUTCMonth() + 1,
      value.getUTCDate()
    );
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value ?? ""));
  if (!match) return null;
  return wallClockFromYMD(Number(match[1]), Number(match[2]), Number(match[3]));
}

// ---------------------------------------------------------------------------
// document helpers
// ---------------------------------------------------------------------------

const htmlCache = new Map<string, string>();

/** Rendered HTML for a markdown body, memoized per build. */
async function html(key: string, markdown: string): Promise<string> {
  const cached = htmlCache.get(key);
  if (cached !== undefined) return cached;
  const { html: rendered } = await renderMarkdown(markdown);
  htmlCache.set(key, rendered);
  return rendered;
}

/**
 * Jekyll's `doc.excerpt`: the front matter value when present, otherwise the
 * first paragraph of the body.
 */
export function excerptOf(frontmatter: Record<string, unknown>, content: string): string {
  const declared = frontmatter.excerpt;
  if (typeof declared === "string" && declared.trim()) return declared;
  const firstParagraph = content.trim().split(/\r?\n\s*\r?\n/)[0] ?? "";
  return firstParagraph;
}

function tagsOf(frontmatter: Record<string, unknown>): string[] {
  const tags = frontmatter.tags;
  if (Array.isArray(tags)) return tags.map((tag) => String(tag));
  if (typeof tags === "string" && tags.trim()) return [tags];
  return [];
}

/** `book.web_url | default: book.url` — the reader-facing URL of a book. */
function bookLink(book: CollectionDoc): string {
  const webUrl = book.frontmatter.web_url;
  return typeof webUrl === "string" && webUrl ? webUrl : book.url;
}

/** Jekyll sorts a dateless collection by path; books/loops both read that way. */
function byUrl(a: CollectionDoc, b: CollectionDoc): number {
  return a.url < b.url ? -1 : a.url > b.url ? 1 : 0;
}

export function sortedBooks(): CollectionDoc[] {
  return [...getAllBooks()].sort(byUrl);
}

export function sortedLoops(): CollectionDoc[] {
  return [...getAllLoops()].sort(byUrl);
}

// ---------------------------------------------------------------------------
// pages (for sitemap.xml) — mirrors Jekyll's `site.pages`
// ---------------------------------------------------------------------------

export interface SitePage {
  url: string;
  frontmatter: Record<string, unknown>;
  content: string;
  /** null for the metadata-only pages declared in PAGE_ENTRIES. */
  sourcePath: string | null;
}

let _pages: SitePage[] | null = null;

/**
 * Every page: the metadata-only entries (home, 404), the `content.md` files
 * colocated with their app/ route, and the flat docs/ directory — all from
 * lib/page-sources.mjs. Each page's URL is pinned by its own `permalink:` front
 * matter where it has one, otherwise by the registry; never derived from where
 * a file sits on disk.
 */
export function getSitePages(): SitePage[] {
  if (_pages) return _pages;
  const pages: SitePage[] = [];

  for (const entry of PAGE_ENTRIES) {
    pages.push({
      url: entry.url,
      frontmatter: entry.frontmatter,
      content: "",
      sourcePath: null,
    });
  }

  const read = (sourcePath: string, fallbackUrl: string | null) => {
    const raw = fs.readFileSync(sourcePath, "utf8");
    if (!raw.startsWith("---")) return; // no front matter → not a page
    const { data, content } = matter(raw);
    const permalink = typeof data.permalink === "string" ? data.permalink : null;
    const url = permalink ?? fallbackUrl;
    if (!url) return;
    pages.push({ url, frontmatter: data, content, sourcePath });
  };

  for (const page of PAGE_FILES) {
    const sourcePath = path.join(ROOT, page.source);
    if (!fs.existsSync(sourcePath)) continue;
    read(sourcePath, page.url);
  }
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

  _pages = pages.sort((a, b) => (a.url < b.url ? -1 : a.url > b.url ? 1 : 0));
  return _pages;
}

/** The sitemap's `unless` clause from sitemap.xml. */
function pageIsIndexable(page: SitePage): boolean {
  if (page.frontmatter.sitemap === false) return false;
  if (page.frontmatter.layout === "null" || page.frontmatter.layout === null) return false;
  if (page.url.includes("sitemap")) return false;
  if (String(page.frontmatter.robots ?? "").includes("noindex")) return false;
  return true;
}

// ---------------------------------------------------------------------------
// tags
// ---------------------------------------------------------------------------

export interface TagArchive {
  name: string;
  slug: string;
  postCount: number;
  bookCount: number;
  totalCount: number;
}

/**
 * Tag archives in the same order as _plugins/tag_pages_generator.rb:
 * most items first, ties broken by lowercased display name.
 */
export function getTagArchives(): TagArchive[] {
  const records = new Map<string, { name: string; slug: string; posts: number; books: number }>();
  const add = (tags: string[], bucket: "posts" | "books") => {
    for (const raw of tags) {
      const tag = String(raw).trim();
      if (!tag) continue;
      const slug = slugifyTag(tag);
      if (!records.has(slug)) records.set(slug, { name: tag, slug, posts: 0, books: 0 });
      records.get(slug)![bucket] += 1;
    }
  };
  for (const { post } of getOutputPosts()) add(tagsOf(post.frontmatter), "posts");
  for (const book of sortedBooks()) add(tagsOf(book.frontmatter), "books");

  return [...records.values()]
    .map((record) => ({
      name: record.name,
      slug: record.slug,
      postCount: record.posts,
      bookCount: record.books,
      totalCount: record.posts + record.books,
    }))
    .sort((a, b) => {
      if (a.totalCount !== b.totalCount) return b.totalCount - a.totalCount;
      const la = a.name.toLowerCase();
      const lb = b.name.toLowerCase();
      return la < lb ? -1 : la > lb ? 1 : 0;
    });
}

// ---------------------------------------------------------------------------
// feed.xml
// ---------------------------------------------------------------------------

export async function buildFeedXml(now: Date = new Date()): Promise<string> {
  const site = getSiteConfig();
  const buildTime = dateToRfc822(nowWallClock(now));
  const lines: string[] = [];

  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push('<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">');
  lines.push("  <channel>");
  lines.push(`    <title>${xmlEscape(site.title)}</title>`);
  lines.push(`    <description>${xmlEscape(site.description)}</description>`);
  lines.push(`    <link>${siteUrl()}${baseUrl()}/</link>`);
  lines.push(
    `    <atom:link href="${siteUrl()}${baseUrl()}/feed.xml" rel="self" type="application/rss+xml" />`
  );
  lines.push(`    <pubDate>${buildTime}</pubDate>`);
  lines.push(`    <lastBuildDate>${buildTime}</lastBuildDate>`);
  lines.push("    <generator>Next.js</generator>");

  for (const entry of getOutputPosts().slice(0, 20)) {
    const post = entry.post;
    const link = `${siteUrl()}${baseUrl()}${entry.url}`;
    lines.push("    <item>");
    lines.push(`      <title>${xmlEscape(post.frontmatter.title)}</title>`);
    lines.push(
      `      <description>${xmlEscape(await html(post.sourcePath, post.content))}</description>`
    );
    lines.push(`      <pubDate>${dateToRfc822(postWallClock(entry))}</pubDate>`);
    lines.push(`      <link>${link}</link>`);
    lines.push(`      <guid isPermaLink="true">${link}</guid>`);
    for (const tag of tagsOf(post.frontmatter)) {
      lines.push(`      <category>${xmlEscape(tag)}</category>`);
    }
    lines.push("    </item>");
  }

  for (const book of sortedBooks().slice(0, 5)) {
    const link = `${siteUrl()}${baseUrl()}${bookLink(book)}`;
    const wall = docWallClock(book.frontmatter.date);
    lines.push("    <item>");
    lines.push(`      <title>${xmlEscape(book.frontmatter.title)}</title>`);
    lines.push(
      `      <description>${xmlEscape(await html(book.sourcePath, book.content))}</description>`
    );
    lines.push(`      <pubDate>${wall ? dateToRfc822(wall) : ""}</pubDate>`);
    lines.push(`      <link>${link}</link>`);
    lines.push(`      <guid isPermaLink="true">${link}</guid>`);
    for (const tag of tagsOf(book.frontmatter)) {
      lines.push(`      <category>${xmlEscape(tag)}</category>`);
    }
    lines.push("    </item>");
  }

  lines.push("  </channel>");
  lines.push("</rss>");
  return `${lines.join("\n")}\n`;
}

// ---------------------------------------------------------------------------
// search.json
// ---------------------------------------------------------------------------

export interface SearchTag {
  name: string;
  slug: string;
  url: string;
}

export interface SearchItem {
  kind: "post" | "book" | "loop";
  title: string;
  url: string;
  date_display: string | null;
  date_iso: string | null;
  excerpt: string;
  content: string;
  views: number | null;
  reading_minutes: number | null;
  tags: SearchTag[];
}

interface ViewCountData {
  view_counts?: { url: string; views: number }[];
}

function viewCounts(): Map<string, number> {
  const map = new Map<string, number>();
  try {
    const data = getDataFile<ViewCountData>("view_count");
    for (const entry of data.view_counts ?? []) {
      map.set(entry.url, Number(entry.views));
    }
  } catch {
    // view counts are optional; Jekyll renders 0 when the data file is absent
  }
  return map;
}

export async function buildSearchItems(): Promise<SearchItem[]> {
  const views = viewCounts();
  const items: SearchItem[] = [];

  for (const entry of getOutputPosts()) {
    const post = entry.post;
    const rendered = await html(post.sourcePath, post.content);
    const wall = postWallClock(entry);
    const minutes = Math.max(1, Math.floor(numberOfWords(rendered) / 200));
    items.push({
      kind: "post",
      title: String(post.frontmatter.title ?? ""),
      url: `${baseUrl()}${entry.url}`,
      date_display: dateDisplay(wall),
      date_iso: dateIso(wall),
      excerpt: stripNewlines(stripHtml(excerptOf(post.frontmatter, post.content))).trim(),
      content: stripNewlines(stripHtml(rendered)),
      views: views.get(entry.url) ?? 0,
      reading_minutes: minutes,
      tags: tagsOf(post.frontmatter).map((tag) => ({
        name: tag,
        slug: slugifyTag(tag),
        url: `${baseUrl()}/tags/${slugifyTag(tag)}/#posts`,
      })),
    });
  }

  for (const book of sortedBooks()) {
    const rendered = await html(book.sourcePath, book.content);
    const wall = docWallClock(book.frontmatter.date);
    items.push({
      kind: "book",
      title: String(book.frontmatter.title ?? ""),
      url: `${baseUrl()}${bookLink(book)}`,
      date_display: wall ? dateDisplay(wall) : null,
      date_iso: wall ? dateIso(wall) : null,
      excerpt: stripNewlines(stripHtml(excerptOf(book.frontmatter, book.content))).trim(),
      content: stripNewlines(stripHtml(rendered)),
      views: null,
      reading_minutes: null,
      tags: tagsOf(book.frontmatter).map((tag) => ({
        name: tag,
        slug: slugifyTag(tag),
        url: `${baseUrl()}/tags/${slugifyTag(tag)}/#books`,
      })),
    });
  }

  for (const loop of sortedLoops()) {
    const rendered = await html(loop.sourcePath, loop.content);
    items.push({
      kind: "loop",
      title: String(loop.frontmatter.title ?? ""),
      url: `${baseUrl()}${loop.url}`,
      date_display: null,
      date_iso: null,
      excerpt: stripNewlines(stripHtml(excerptOf(loop.frontmatter, loop.content))).trim(),
      content: stripNewlines(stripHtml(rendered)),
      views: null,
      reading_minutes: null,
      tags: tagsOf(loop.frontmatter).map((tag) => ({
        name: tag,
        slug: slugifyTag(tag),
        url: `${baseUrl()}${loop.url}`,
      })),
    });
  }

  return items;
}

export async function buildSearchJson(): Promise<string> {
  return `${JSON.stringify(await buildSearchItems(), null, 2)}\n`;
}

// ---------------------------------------------------------------------------
// sitemap.xml / sitemapindex.xml
// ---------------------------------------------------------------------------

export function buildSitemapXml(): string {
  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push(
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ' +
      'xmlns:news="http://www.google.com/schemas/sitemap-news/0.9" ' +
      'xmlns:xhtml="http://www.w3.org/1999/xhtml" ' +
      'xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0" ' +
      'xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">'
  );

  const url = (loc: string, lastmod?: string) => {
    lines.push("  <url>");
    lines.push(`    <loc>${loc}</loc>`);
    if (lastmod) lines.push(`    <lastmod>${lastmod}</lastmod>`);
    lines.push("    <changefreq>weekly</changefreq>");
    lines.push("    <priority>0.5</priority>");
    lines.push("  </url>");
  };

  // lastmod is only emitted where a truthful date exists: posts carry their
  // own dates; tag archives and post-listing pages change when their newest
  // post does; loops have no dated front matter and stay bare.
  const wallKey = (w: WallClock) =>
    Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute - w.offsetMinutes, w.second);
  const postModified = (entry: OutputPost) =>
    docWallClock(entry.post.frontmatter.last_modified_at) ?? postWallClock(entry);
  const newestPerTag = new Map<string, WallClock>();
  let newestOverall: WallClock | null = null;
  for (const entry of getOutputPosts()) {
    const wall = postModified(entry);
    if (!newestOverall || wallKey(wall) > wallKey(newestOverall)) newestOverall = wall;
    for (const raw of tagsOf(entry.post.frontmatter)) {
      const slug = slugifyTag(String(raw).trim());
      const seen = newestPerTag.get(slug);
      if (!seen || wallKey(wall) > wallKey(seen)) newestPerTag.set(slug, wall);
    }
  }
  // Pages whose content is driven by the post list.
  const POST_DRIVEN_PAGES = new Set(["/", "/blog/", "/tags/"]);

  for (const page of getSitePages()) {
    if (!pageIsIndexable(page)) continue;
    const loc = page.url.replace("index.html", "");
    const wall = POST_DRIVEN_PAGES.has(loc) && newestOverall ? newestOverall : null;
    url(absoluteUrl(loc), wall ? dateToXmlschema(wall) : undefined);
  }

  // Tag archive pages (_plugins/tag_pages_generator.rb). The /tags-<slug>/
  // legacy redirect stubs carry robots: noindex and stay out of the sitemap.
  for (const tag of getTagArchives()) {
    const wall = newestPerTag.get(tag.slug);
    url(absoluteUrl(`/tags/${tag.slug}/`), wall ? dateToXmlschema(wall) : undefined);
  }

  // ?lang= variants are client-side translations of the same HTML and must not
  // appear in the sitemap — they canonicalize to the clean post URL.
  for (const entry of getOutputPosts()) {
    const modified =
      docWallClock(entry.post.frontmatter.last_modified_at) ?? postWallClock(entry);
    url(absoluteUrl(entry.url), dateToXmlschema(modified));
  }

  for (const book of sortedBooks()) {
    const wall = docWallClock(book.frontmatter.last_modified_at ?? book.frontmatter.date);
    url(absoluteUrl(`${baseUrl()}${bookLink(book)}/`), wall ? dateToXmlschema(wall) : undefined);
  }

  for (const loop of sortedLoops()) {
    url(absoluteUrl(loop.url));
  }

  lines.push("</urlset>");
  return `${lines.join("\n")}\n`;
}

export function buildSitemapIndexXml(now: Date = new Date()): string {
  const buildTime = dateToXmlschema(nowWallClock(now));
  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');

  const entry = (loc: string, lastmod: string) => {
    lines.push("  <sitemap>");
    lines.push(`    <loc>${loc}</loc>`);
    lines.push(`    <lastmod>${lastmod}</lastmod>`);
    lines.push("  </sitemap>");
  };

  entry(absoluteUrl("/sitemap.xml"), buildTime);
  // sitemap-media.xml is hand-maintained and copied verbatim into out/ by
  // scripts/next/sync-public.mjs (Jekyll kept it via `keep_files`).
  entry(absoluteUrl("/sitemap-media.xml"), buildTime);

  for (const book of sortedBooks()) {
    const wall = docWallClock(book.frontmatter.date);
    entry(
      absoluteUrl(`${baseUrl()}${bookLink(book)}/sitemap.xml`),
      wall ? dateToXmlschema(wall) : buildTime
    );
  }

  lines.push("</sitemapindex>");
  return `${lines.join("\n")}\n`;
}

// ---------------------------------------------------------------------------
// llms.txt / llms-full.txt
// ---------------------------------------------------------------------------

export function buildLlmsTxt(): string {
  const site = getSiteConfig();
  const url = siteUrl();
  const lines: string[] = [];

  lines.push(`# ${site.title}`);
  lines.push("");
  lines.push(`> ${site.description}`);
  lines.push("");
  lines.push(
    "Every HTML page below has a parallel markdown representation at `<page-url>index.md`,"
  );
  lines.push("served by GitHub Pages with `Content-Type: text/markdown; charset=utf-8`. Agents");
  lines.push("that prefer markdown can fetch those URLs directly or follow the");
  lines.push('`<link rel="alternate" type="text/markdown">` advertised in each page\'s `<head>`.');
  lines.push("");
  lines.push("## When to use this site");
  lines.push("");
  lines.push("Use subramanya.ai when you need:");
  lines.push("");
  lines.push("- Writing and first-hand analysis by Subramanya N on AI agents, agent security,");
  lines.push("  agentic identity/authorization, LLM tooling, and SaaS strategy - fetch the");
  lines.push(`  markdown twin of the relevant post below, or ${url}/llms-full.txt for`);
  lines.push("  everything at once.");
  lines.push("- Biographical or professional facts about Subramanya N (roles, employers,");
  lines.push(`  education, publications) - use ${url}/work/index.md and`);
  lines.push(`  ${url}/publications/.`);
  lines.push("- Search across this site's posts and book notes - fetch");
  lines.push(`  ${url}/search.json (full JSON index; filter client-side).`);
  lines.push("- Reusable automation-loop prompts for coding agents -");
  lines.push(`  ${url}/awesome-loops/index.md.`);
  lines.push("");
  lines.push("Do not use this site for: real-time data, an official employer position (posts");
  lines.push("are personal opinion), or transactional services - it is a read-only personal");
  lines.push("site with no accounts and no write API.");
  lines.push("");
  lines.push("How to call it: anonymous HTTPS GET only, no auth or API key. The machine");
  lines.push(`endpoints are catalogued in ${url}/openapi.json (OpenAPI 3.1) and`);
  lines.push(`${url}/.well-known/api-catalog (RFC 9727). Unknown paths return a real`);
  lines.push("HTTP 404 whose body links back here.");
  lines.push("");
  lines.push("## Developer Resources");
  lines.push(`- OpenAPI 3.1 spec: ${url}/openapi.json`);
  lines.push(`- Site info + endpoint directory (v1): ${url}/api/v1/site.json`);
  lines.push(`- Posts API (v1, typed JSON): ${url}/api/v1/posts.json`);
  lines.push(`- Books API (v1, typed JSON): ${url}/api/v1/books.json`);
  lines.push(`- Tags API (v1, typed JSON): ${url}/api/v1/tags.json`);
  lines.push(`- API versioning & deprecation policy: ${url}/docs/api-deprecation-policy/`);
  lines.push(`- API catalog (RFC 9727): ${url}/.well-known/api-catalog`);
  lines.push(`- ARD catalog: ${url}/.well-known/ai-catalog.json`);
  lines.push(`- Agent skills index: ${url}/.well-known/agent-skills/index.json`);
  lines.push(`- Auth walkthrough (anonymous, no credentials): ${url}/auth.md`);
  lines.push(`- Scoped llms.txt: ${url}/docs/llms.txt (docs), ${url}/api/llms.txt (API)`);
  lines.push(`- Source repository: https://github.com/subramanya1997/subramanya1997.github.io`);
  lines.push(`- Developer docs index: ${url}/docs/ (md: ${url}/docs/index.md)`);
  lines.push(`- Search index (JSON): ${url}/search.json`);
  lines.push(`- Blog RSS feed: ${url}/feed.xml`);
  lines.push(`- Sitemap: ${url}/sitemap.xml`);
  lines.push(`- Contact: ${url}/contact/ (md: ${url}/contact/index.md)`);
  lines.push(`- Privacy policy: ${url}/privacy/ (md: ${url}/privacy/index.md)`);
  lines.push("");
  lines.push("## About");
  lines.push(`- [Home](${url}/) (md: ${url}/index.md)`);
  lines.push(`- [Work Experience](${url}/work/) (md: ${url}/work/index.md)`);
  lines.push(`- [Blog](${url}/blog/) (md: ${url}/blog/index.md)`);
  lines.push(`- [Books](${url}/books/) (md: ${url}/books/index.md)`);
  lines.push(`- [Tags](${url}/tags/) (md: ${url}/tags/index.md)`);
  lines.push(`- [Resume/CV](${url}/assets/resume/CV.pdf)`);
  lines.push("");
  lines.push("## Blog Posts");
  lines.push("");
  for (const { post, url: postUrl } of getOutputPosts()) {
    const excerpt = truncateWords(
      stripHtml(excerptOf(post.frontmatter, post.content)),
      20
    );
    lines.push(
      `- [${post.frontmatter.title}](${url}${postUrl}) (md: ${url}${postUrl}index.md): ${excerpt}`
    );
    lines.push("");
  }
  lines.push("## Books");
  lines.push("");
  for (const book of sortedBooks()) {
    lines.push(
      `- [${book.frontmatter.title}](${url}${bookLink(book)}) (md: ${url}${book.url}index.md)`
    );
    lines.push("");
  }
  lines.push("## Automation Loop Marketplace");
  lines.push(`- [Awesome Automation Loops](${url}/awesome-loops/) (md: ${url}/awesome-loops/index.md)`);
  lines.push("");
  for (const loop of sortedLoops()) {
    const excerpt = truncateWords(stripHtml(excerptOf(loop.frontmatter, loop.content)), 20);
    lines.push(
      `- [${loop.frontmatter.title}](${url}${loop.url}) (md: ${url}${loop.url}index.md): ${excerpt}`
    );
    lines.push("");
  }
  return `${lines.join("\n")}`;
}

export async function buildLlmsFullTxt(): Promise<string> {
  const site = getSiteConfig();
  const url = siteUrl();
  const lines: string[] = [];

  lines.push(`# ${site.title} - Full Content`);
  lines.push("");
  lines.push(
    "Every post below has a machine-consumable markdown twin at `<post-url>index.md`,"
  );
  lines.push("served by GitHub Pages with `Content-Type: text/markdown; charset=utf-8`.");
  lines.push("");

  for (const entry of getOutputPosts()) {
    const post = entry.post;
    const wall = postWallClock(entry);
    lines.push(`## ${post.frontmatter.title}`);
    lines.push(`URL: ${url}${entry.url}`);
    lines.push(`Markdown: ${url}${entry.url}index.md`);
    lines.push(`Date: ${dateIso(wall)}`);
    lines.push(`Tags: ${tagsOf(post.frontmatter).join(", ")}`);
    lines.push("");
    lines.push(await html(post.sourcePath, post.content));
    const faq = post.frontmatter.faq;
    if (Array.isArray(faq) && faq.length > 0) {
      lines.push("### Quick Answers");
      for (const item of faq) {
        lines.push(`Q: ${item.q}`);
        lines.push(`A: ${item.a}`);
      }
    }
    lines.push("---");
  }

  return `${lines.join("\n")}\n`;
}

// ---------------------------------------------------------------------------
// /api/v1/*.json
// ---------------------------------------------------------------------------

const API_VERSION = "v1";

function generatedFrom(): string {
  return `${siteUrl()}/openapi.json`;
}

export function buildApiPosts(): string {
  const posts = getOutputPosts().map((entry) => {
    const post = entry.post;
    const wall = postWallClock(entry);
    return {
      title: String(post.frontmatter.title ?? ""),
      url: `${siteUrl()}${baseUrl()}${entry.url}`,
      markdown_url: `${siteUrl()}${baseUrl()}${entry.url}index.md`,
      date: dateIso(wall),
      excerpt: stripNewlines(stripHtml(excerptOf(post.frontmatter, post.content))).trim(),
      tags: tagsOf(post.frontmatter),
    };
  });
  return `${JSON.stringify(
    {
      api_version: API_VERSION,
      kind: "post_list",
      generated_from: generatedFrom(),
      count: posts.length,
      posts,
    },
    null,
    2
  )}\n`;
}

export function buildApiBooks(): string {
  const books = sortedBooks().map((book) => {
    const wall = docWallClock(book.frontmatter.date);
    return {
      title: String(book.frontmatter.title ?? ""),
      url: `${siteUrl()}${baseUrl()}${bookLink(book)}`,
      markdown_url: `${siteUrl()}${baseUrl()}${book.url}index.md`,
      date: wall ? dateIso(wall) : "",
      excerpt: stripNewlines(stripHtml(excerptOf(book.frontmatter, book.content))).trim(),
      tags: tagsOf(book.frontmatter),
    };
  });
  return `${JSON.stringify(
    {
      api_version: API_VERSION,
      kind: "book_list",
      generated_from: generatedFrom(),
      count: books.length,
      books,
    },
    null,
    2
  )}\n`;
}

export function buildApiTags(): string {
  // Only post tags, matching api/v1/tags.json (`site.posts` → uniq → sort_natural).
  const posts = getOutputPosts().map((entry) => entry.post);
  const names = new Map<string, string>(); // first-seen display name per raw tag
  for (const post of posts) {
    for (const tag of tagsOf(post.frontmatter)) {
      if (!names.has(tag)) names.set(tag, tag);
    }
  }
  const tags = sortNatural([...names.keys()]).map((name) => ({
    name,
    slug: slugifyTag(name),
    post_count: posts.filter((post) => tagsOf(post.frontmatter).includes(name)).length,
    archive_url: `${siteUrl()}${baseUrl()}/tags/${slugifyTag(name)}/`,
  }));
  return `${JSON.stringify(
    {
      api_version: API_VERSION,
      kind: "tag_list",
      generated_from: generatedFrom(),
      count: tags.length,
      tags,
    },
    null,
    2
  )}\n`;
}

interface AboutData {
  github_username?: string;
  linkedin_username?: string;
}

export function buildApiSite(): string {
  const site = getSiteConfig();
  const url = siteUrl();
  let about: AboutData = {};
  try {
    about = getDataFile<AboutData>("about");
  } catch {
    about = {};
  }
  return `${JSON.stringify(
    {
      api_version: API_VERSION,
      kind: "site_info",
      generated_from: generatedFrom(),
      name: site.title,
      description: site.description,
      url,
      author: {
        name: site.title,
        email: site.email,
        github: `https://github.com/${about.github_username ?? ""}`,
        linkedin: `https://www.linkedin.com/in/${about.linkedin_username ?? ""}`,
      },
      counts: {
        posts: getOutputPosts().length,
        books: sortedBooks().length,
        loops: sortedLoops().length,
      },
      endpoints: {
        openapi: `${url}/openapi.json`,
        posts: `${url}/api/v1/posts.json`,
        books: `${url}/api/v1/books.json`,
        tags: `${url}/api/v1/tags.json`,
        search_index: `${url}/search.json`,
        llms_txt: `${url}/llms.txt`,
        sitemap: `${url}/sitemap.xml`,
        feed: `${url}/feed.xml`,
        api_catalog: `${url}/.well-known/api-catalog`,
      },
      policies: {
        deprecation_policy: `${url}/docs/api-deprecation-policy/`,
        privacy: `${url}/privacy/`,
        contact: `${url}/contact/`,
      },
    },
    null,
    2
  )}\n`;
}
