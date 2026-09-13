// Helpers that only the post / loop / tag-archive routes need: Jekyll date
// formats that were not already covered, the social-image cascade of
// `_includes/head.html`, the citation key of `_includes/citation.html`, and the
// per-post translation lookup that `_includes/language-switcher.html` did by
// walking `site.static_files`.
import fs from "node:fs";
import path from "node:path";
import { getAllPosts, getSiteConfig, type Post } from "@/lib/content";
import { dateToXmlschema, numberOfWords, wallClockFromYMD } from "@/lib/nonhtml";

const ROOT = process.cwd();

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Liquid `date: "%b %-d, %Y"` — "Dec 28, 2022". */
export function shortDate(date: Date): string {
  return `${MONTHS_SHORT[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

/** Liquid `date: "%B"` — "December". */
export function longMonth(date: Date): string {
  return MONTHS_LONG[date.getUTCMonth()];
}

/** Liquid `date: "%Y/%m/%d"` — the Google Scholar citation date format. */
export function slashDate(date: Date): string {
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${date.getUTCFullYear()}/${m}/${d}`;
}

/** Liquid `date: "%Y-%m-%d"`. */
export function isoDay(date: Date): string {
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${date.getUTCFullYear()}-${m}-${d}`;
}

/**
 * Liquid `date_to_xmlschema` for a date-only front-matter value. Jekyll reads
 * it as midnight in the build timezone, so the offset comes from lib/nonhtml.
 */
export function xmlSchemaDate(date: Date): string {
  return dateToXmlschema(
    wallClockFromYMD(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate())
  );
}

/** `date: '%Y-%m-%dT%H:%M:%S'` on a date-only value, as used by the post JSON-LD. */
export function jsonLdTimestamp(date: Date): string {
  return `${isoDay(date)}T00:00:00+00:00`;
}

/** Liquid `url_encode` — form encoding, so spaces become `+`. */
export function urlEncode(value: string): string {
  return encodeURIComponent(value).replace(/%20/g, "+");
}


// ---------------------------------------------------------------------------
// social images (`_includes/head.html`)
// ---------------------------------------------------------------------------

// Build-time only (all routes are prerendered); the `turbopackIgnore` hint
// keeps Turbopack from tracing the whole repo into the server bundle.
function staticFileExists(relativePath: string): boolean {
  return fs.existsSync(
    path.join(/* turbopackIgnore: true */ ROOT, relativePath.replace(/^\//, "")),
  );
}

/**
 * `page.layout == 'post'` branch: explicit `image`, else the generated
 * `/assets/images/<slug>.png` when that static file exists, else the site
 * default.
 */
export function postSocialImage(post: Post): string {
  const explicit = post.frontmatter.image;
  if (typeof explicit === "string" && explicit) return explicit;
  const generated = `/assets/images/${post.slug}.png`;
  if (staticFileExists(generated)) return generated;
  return String(getSiteConfig().default_social_image ?? "/assets/images/og/default.png");
}

/**
 * `page.collection == 'loops'` branch: explicit `image`, else
 * `/assets/images/og/loops/<slug>.png` when it exists, else the marketplace
 * fallback.
 */
export function loopSocialImage(slug: string, explicit?: unknown): string {
  if (typeof explicit === "string" && explicit) return explicit;
  const generated = `/assets/images/og/loops/${slug}.png`;
  if (staticFileExists(generated)) return generated;
  return "/assets/images/og/awesome-loops.png";
}

// ---------------------------------------------------------------------------
// citation key (`_includes/citation.html`)
// ---------------------------------------------------------------------------

/** `'nagabhushanaradhya' + %Y + first two hyphen-parts of the slug`. */
export function citationId(post: Post): string {
  const explicit = post.frontmatter.citation_key;
  if (typeof explicit === "string" && explicit) return explicit;
  const head = post.slug.split("-").slice(0, 2).join("");
  return `nagabhushanaradhya${post.date.getUTCFullYear()}${head}`;
}

// ---------------------------------------------------------------------------
// translations (`_includes/language-switcher.html`)
// ---------------------------------------------------------------------------

/**
 * The switcher lists the default language plus every language that has an
 * `/assets/translations/<code>/<slug>.json` static file for this post.
 */
export function availableLanguages(slug: string): { code: string; native: string }[] {
  const site = getSiteConfig();
  return site.languages.filter(
    (language) =>
      language.code === site.default_lang ||
      staticFileExists(`/assets/translations/${language.code}/${slug}.json`)
  );
}

// ---------------------------------------------------------------------------
// post navigation & related posts
// ---------------------------------------------------------------------------

/**
 * `page.previous` / `page.next`. Jekyll's `site.posts.docs` is chronologically
 * ascending, so `previous` is the older post and `next` the newer one;
 * `getAllPosts()` is that array reversed.
 */
export function postNeighbours(post: Post): { previous?: Post; next?: Post } {
  const posts = getAllPosts();
  const index = posts.findIndex((candidate) => candidate.url === post.url);
  if (index === -1) return {};
  return { previous: posts[index + 1], next: posts[index - 1] };
}

/**
 * `_includes/related-posts.html`: every other post sharing at least one tag
 * (categories are always empty here, so `sameCategory` is true for every post
 * — Jekyll compares `nil == nil`), capped at four. The Liquid pushes onto the
 * list in `site.posts` order, i.e. newest first.
 */
export function relatedPosts(post: Post): Post[] {
  // The Liquid also ORs in `post.categories.first == page.categories.first`,
  // and no document on this site has categories — `nil == nil` is true — so
  // every other post qualifies and the tag test never narrows anything.
  return getAllPosts()
    .filter((candidate) => candidate.url !== post.url)
    .slice(0, 4);
}

/**
 * `head.html`'s twitter:data1: `page.content | number_of_words` over the
 * *rendered* HTML, divided by 200, with a floor of one minute.
 */
export function readingMinutes(renderedHtml: string): number {
  return Math.max(1, Math.floor(numberOfWords(renderedHtml) / 200));
}
