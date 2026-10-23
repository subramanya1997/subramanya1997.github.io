// Source model for the UMass handbook (content/handbook/<slug>/), ported from
// its HonKit build. SUMMARY.md is the table of contents, exactly as HonKit read
// it, and every page keeps its published `.html` URL.
//
// Plain JS so the bare-node prebuild (scripts/next/handbook-public.mjs) and the
// Next routes (lib/handbook.ts) share one reading of the sources.
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export const HANDBOOK_SLUG = "navigating-umass-amherst-a-handbook-for-international-students";
export const HANDBOOK_BASE = `/${HANDBOOK_SLUG}/`;
export const HANDBOOK_TITLE = "Navigating UMass Amherst: A Handbook for International Students";
/** Short name used in breadcrumbs (matches the HonKit-era BreadcrumbList). */
export const HANDBOOK_SHORT_TITLE = "UMass Amherst Student Guide";
export const HANDBOOK_AUTHOR = "Subramanya Nagabhushanaradhya";
export const HANDBOOK_DIR = path.join(
  /* turbopackIgnore: true */ process.cwd(),
  "content",
  "handbook",
  HANDBOOK_SLUG,
);

/**
 * @typedef {object} HandbookPage
 * @property {string} file Source file relative to the handbook root, e.g. "off-campus-housing/the-boulders.md".
 * @property {string} route Published path relative to the handbook root ("" for the landing page).
 * @property {string} url Site-relative URL, e.g. "/<slug>/off-campus-housing/the-boulders.html".
 * @property {string} navTitle Label from SUMMARY.md.
 * @property {string} title Full `<title>` (front matter), kept from the HonKit build.
 * @property {string} description Meta description (front matter), kept from the HonKit build.
 * @property {number} chapter Index of the SUMMARY.md chapter this page belongs to.
 * @property {boolean} isChapter True for a chapter's own page (as opposed to one of its articles).
 */

/**
 * @typedef {object} HandbookChapter
 * @property {HandbookPage} page
 * @property {HandbookPage[]} articles
 */

/** @param {string} file */
function routeFor(file) {
  return file === "README.md" ? "" : file.replace(/\.md$/, ".html");
}

/** @type {HandbookChapter[] | null} */
let chaptersCache = null;

/**
 * SUMMARY.md: top-level bullets are chapters, indented bullets their articles.
 * @returns {HandbookChapter[]}
 */
export function handbookChapters() {
  if (chaptersCache && process.env.NODE_ENV === "production") return chaptersCache;
  const summary = fs.readFileSync(path.join(HANDBOOK_DIR, "SUMMARY.md"), "utf8");
  /** @type {HandbookChapter[]} */
  const chapters = [];

  for (const line of summary.split("\n")) {
    const match = /^(\s*)\*\s+\[([^\]]+)\]\(([^)]+)\)/.exec(line);
    if (!match) continue;
    const [, indent, navTitle, file] = match;
    const isChapter = indent.length === 0;
    const { data } = readHandbookFile(file);
    const route = routeFor(file);
    /** @type {HandbookPage} */
    const page = {
      file,
      route,
      url: `${HANDBOOK_BASE}${route}`,
      navTitle,
      title: String(data.title ?? navTitle),
      description: String(data.description ?? ""),
      chapter: isChapter ? chapters.length : chapters.length - 1,
      isChapter,
    };
    if (isChapter) chapters.push({ page, articles: [] });
    else chapters[chapters.length - 1].articles.push(page);
  }

  chaptersCache = chapters;
  return chapters;
}

/**
 * Every page in reading order (the order HonKit's prev/next arrows used).
 * @returns {HandbookPage[]}
 */
export function handbookPages() {
  return handbookChapters().flatMap((chapter) => [chapter.page, ...chapter.articles]);
}

/**
 * @param {string} file
 * @returns {{ data: Record<string, unknown>, content: string }}
 */
export function readHandbookFile(file) {
  const { data, content } = matter(fs.readFileSync(path.join(HANDBOOK_DIR, file), "utf8"));
  return { data, content };
}

/**
 * Resolves a relative `.md` link in `fromFile` to the page's published URL.
 * @param {string} fromFile
 * @param {string} href
 */
function resolveLink(fromFile, href) {
  const [target, hash] = href.split("#");
  const file = path.posix.normalize(path.posix.join(path.posix.dirname(fromFile), target));
  const url = `${HANDBOOK_BASE}${routeFor(file)}`;
  return hash ? `${url}#${hash}` : url;
}

/**
 * Prepares a HonKit page body for lib/markdown.ts:
 * - the first heading becomes the page h1 and is lifted out of the body
 *   (except on the landing page, whose h1 is the book title);
 * - the remaining headings are shifted so the shallowest is an h2 (the source
 *   pages start anywhere from `#` to `###`, which left the outline ragged);
 * - `.md` links point at the published `.html` URLs and `/assets/` images at
 *   the handbook's own asset folder.
 *
 * @param {HandbookPage} page
 * @returns {{ heading: string, body: string }}
 */
export function prepareHandbookMarkdown(page) {
  let body = readHandbookFile(page.file).content;
  let heading = page.navTitle;

  const first = /^(#{1,6})\s+(.+?)\s*#*\s*$/m.exec(body);
  if (page.route !== "" && first && body.slice(0, first.index).trim() === "") {
    heading = first[2];
    body = body.slice(first.index + first[0].length);
  }

  const levels = [...body.matchAll(/^(#{1,6})\s/gm)].map((m) => m[1].length);
  const shift = levels.length ? 2 - Math.min(...levels) : 0;
  if (shift !== 0) {
    body = body.replace(/^(#{1,6})(\s)/gm, (_, hashes, space) => {
      const level = Math.min(6, Math.max(2, hashes.length + shift));
      return `${"#".repeat(level)}${space}`;
    });
  }

  // HonKit's markdown-it let a table start straight after a paragraph line;
  // GFM needs a blank line first or the rows render as literal pipes.
  body = body.replace(/^([^|\n][^\n]*)\n(\|[^\n]*\|[ \t]*\n\|[ \t:|-]+\|)/gm, "$1\n\n$2");

  // markdown-it also accepted a delimiter row with more cells than the
  // header (the housing overview has one); GFM rejects the whole table.
  body = body.replace(/^(\|[^\n]*\|)[ \t]*\n(\|[ \t:|-]+\|)[ \t]*$/gm, (match, header, delimiter) => {
    const cells = (row) => row.trim().replace(/^\||\|$/g, "").split("|");
    const width = cells(header).length;
    const align = cells(delimiter).map((cell) => cell.trim());
    if (align.length === width) return match;
    const fixed = Array.from({ length: width }, (_, i) => align[i] ?? align[0]);
    return `${header}\n| ${fixed.join(" | ")} |`;
  });

  body = body
    .replace(/\]\((?!https?:|tel:|mailto:|#|\/)([^)\s]+\.md(?:#[^)\s]*)?)\)/g, (_, href) =>
      `](${resolveLink(page.file, href)})`,
    )
    .replace(/\]\(\/assets\//g, `](${HANDBOOK_BASE}assets/`);

  // Several pages end with a `---` that used to separate the body from the
  // HonKit footer include; without the footer it is a stray rule.
  body = body.trim().replace(/\n+-{3,}\s*$/, "");

  return { heading, body };
}

/**
 * Markdown twin URL for a page: `<slug>/index.md` for the landing page,
 * `<page>.md` beside each `.html` page.
 * @param {HandbookPage} page
 */
export function handbookTwinUrl(page) {
  return page.route === "" ? `${HANDBOOK_BASE}index.md` : page.url.replace(/\.html$/, ".md");
}
