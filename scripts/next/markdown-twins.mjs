// Markdown twins: a `.md` mirror of every HTML page, published at
// `<page-url>index.md`. This is a port of _plugins/markdown_twin_generator.rb
// (Jekyll) to the Next.js static export — same URL set, same front matter, same
// bodies — so agents that prefer markdown keep the URLs they already know.
//
// GitHub Pages serves .md as `text/markdown; charset=utf-8`, and each HTML page
// advertises its twin with <link rel="alternate" type="text/markdown">.
import fs from "node:fs";
import path from "node:path";
import { toFrontMatter } from "./lib/psych-yaml.mjs";
import { renderLiquid } from "./lib/liquid.mjs";
import {
  siteConfig,
  dataFile,
  posts,
  books,
  loops,
  pages,
  tagArchives,
  tagsOf,
} from "./lib/jekyll-content.mjs";

// ---------------------------------------------------------------------------
// helpers (mirrors of the plugin's private methods)
// ---------------------------------------------------------------------------

const site = siteConfig();
const about = dataFile("about") ?? {};

function absoluteUrl(pathname) {
  return `${String(site.url).replace(/\/$/, "")}${pathname ?? ""}`;
}

function stripHtml(text) {
  return String(text ?? "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function shortText(value, words = 40) {
  const text = stripHtml(value ?? "");
  const tokens = text.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return "";
  if (tokens.length <= words) return text;
  return `${tokens.slice(0, words).join(" ")}…`;
}

function htmlToMarkdownFallback(body) {
  return String(body ?? "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<svg[\s\S]*?<\/svg>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** The plugin renders page/document bodies through Liquid, falling back to the raw template. */
function render(template, scope) {
  try {
    return renderLiquid(String(template ?? ""), scope);
  } catch {
    return String(template ?? "");
  }
}

/**
 * Liquid sees a Jekyll document as its front matter plus url/content/date, so
 * `{{ loop.category }}` and friends resolve against the flattened shape.
 */
function liquidDocument(document) {
  return {
    ...document.data,
    url: document.url,
    content: document.content,
    date: document.date ?? null,
    slug: document.slug ?? null,
  };
}

function liquidScope(document) {
  return {
    site: {
      ...site,
      posts: postList.map(liquidDocument),
      books: bookList.map(liquidDocument),
      loops: loopList.map(liquidDocument),
      data: { about, tag_archives: tagArchiveList },
      baseurl: site.baseurl ?? "",
    },
    page: document?.data ?? {},
  };
}

function compact(hash) {
  const result = {};
  for (const [key, value] of Object.entries(hash)) {
    if (value === null || value === undefined) continue;
    if (typeof value === "string" && value === "") continue;
    if (Array.isArray(value) && value.length === 0) continue;
    result[key] = value;
  }
  return result;
}

// ---------------------------------------------------------------------------
// content
// ---------------------------------------------------------------------------

const postList = posts();
const bookList = books();
const loopList = loops();
const pageList = pages();
const tagArchiveList = tagArchives(postList, bookList);

// ---------------------------------------------------------------------------
// document twins (posts, books, loops)
// ---------------------------------------------------------------------------

function faqSection(document) {
  const faq = document.data.faq;
  if (!Array.isArray(faq) || faq.length === 0) return "";
  const lines = ["", "", "## Quick Answers", ""];
  for (const item of faq) {
    if (!item || !item.q || !item.a) continue;
    lines.push(`### ${item.q}`);
    lines.push("");
    lines.push(String(item.a).trim());
    lines.push("");
  }
  return lines.join("\n").replace(/\s+$/, "");
}

function documentTwin(document, includeDate) {
  const front = compact({
    title: document.data.title ?? null,
    description: shortText(document.data.excerpt ?? document.data.description ?? ""),
    url: absoluteUrl(document.url),
    tags: tagsOf(document.data),
  });
  if (includeDate && document.date) front.date = document.date;
  if (document.data.author) front.author = document.data.author;

  const body = render(document.content, liquidScope(document));
  return `${toFrontMatter(front)}\n# ${document.data.title}\n\n${body.trim()}${faqSection(document)}\n`;
}

// ---------------------------------------------------------------------------
// page twins
// ---------------------------------------------------------------------------

function renderHome() {
  const bio = [about.bio, about.research_interest, about.history]
    .filter((value) => value !== null && value !== undefined)
    .map(stripHtml)
    .filter((value) => value !== "");
  const lines = [`# ${site.title}`, ""];
  if (String(site.description ?? "") !== "") lines.push(String(site.description));
  if (bio.length > 0) lines.push("");
  lines.push(...bio);
  lines.push("");

  if (bookList.length > 0) {
    lines.push("## Books", "");
    for (const book of bookList) lines.push(`- [${book.data.title}](${absoluteUrl(book.url)})`);
    lines.push("");
  }
  if (postList.length > 0) {
    lines.push("## Blog", "");
    for (const post of postList) {
      lines.push(
        `- [${post.data.title}](${absoluteUrl(post.url)}) — ${shortText(post.data.excerpt, 25)}`
      );
    }
    lines.push("");
  }
  return lines.join("\n");
}

function renderBlog() {
  const lines = ["# Blog", "", "All posts, newest first.", ""];
  for (const post of postList) {
    lines.push(
      `- ${post.date} — [${post.data.title}](${absoluteUrl(post.url)}) — ${shortText(post.data.excerpt, 25)}`
    );
  }
  return lines.join("\n");
}

function renderBooksIndex() {
  const lines = ["# Books", ""];
  if (bookList.length === 0) {
    lines.push("_No books yet._");
  } else {
    for (const book of bookList) {
      lines.push(
        `- [${book.data.title}](${absoluteUrl(book.url)}) — ${shortText(book.data.excerpt, 30)}`
      );
    }
  }
  return lines.join("\n");
}

function renderTagsIndex() {
  const lines = ["# Tags", "", "Browse posts and books by topic.", ""];
  for (const tag of tagArchiveList) {
    lines.push(
      `- [${tag.name}](${absoluteUrl(`/tags/${tag.slug}/`)}) — ${tag.totalCount} item${
        tag.totalCount === 1 ? "" : "s"
      }`
    );
  }
  return lines.join("\n");
}

function renderTagDetail(tag) {
  const lines = [`# Tag: ${tag.name}`, "", `Posts and books tagged ${tag.name}.`, ""];
  if (tag.posts.length > 0) {
    lines.push("## Posts", "");
    for (const post of tag.posts) {
      const prefix = post.date ? `${post.date} — ` : "";
      lines.push(`- ${prefix}[${post.data.title}](${absoluteUrl(post.url)})`);
    }
    lines.push("");
  }
  if (tag.books.length > 0) {
    lines.push("## Books", "");
    for (const book of tag.books) {
      lines.push(`- [${book.data.title}](${absoluteUrl(book.url)})`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

function renderWork() {
  const lines = ["# Work", ""];
  if (String(about.bio ?? "") !== "") {
    lines.push(stripHtml(about.bio));
    lines.push("");
  }

  const experience = about.experience ?? [];
  if (experience.length > 0) {
    lines.push("## Experience", "");
    for (const entry of experience) {
      lines.push(`### ${[entry.position, entry.company].filter(Boolean).join(" — ")}`);
      const meta = [entry.location, entry.period].filter((value) => value).join(" · ");
      if (meta !== "") lines.push(`_${meta}_`);
      lines.push("");
      if (String(entry.description ?? "") !== "") lines.push(stripHtml(entry.description));
      const achievements = entry.achievements ?? [];
      if (achievements.length > 0) {
        lines.push("");
        for (const achievement of achievements) lines.push(`- ${stripHtml(achievement)}`);
      }
      lines.push("");
    }
  }

  const education = about.education ?? [];
  if (education.length > 0) {
    lines.push("## Education", "");
    for (const entry of education) {
      lines.push(`### ${[entry.degree, entry.institution].filter(Boolean).join(" — ")}`);
      const meta = [entry.location, entry.period].filter((value) => value).join(" · ");
      if (meta !== "") lines.push(`_${meta}_`);
      lines.push("");
      if (String(entry.description ?? "") !== "") lines.push(stripHtml(entry.description));
      const details = entry.details ?? [];
      if (details.length > 0) {
        lines.push("");
        for (const detail of details) {
          const text =
            detail && typeof detail === "object"
              ? Object.entries(detail)
                  .map(([key, value]) => `**${key}:** ${value}`)
                  .join(" ")
              : String(detail);
          lines.push(`- ${stripHtml(text)}`);
        }
      }
      lines.push("");
    }
  }

  if (String(about.cv_file ?? "") !== "") lines.push(`Résumé: ${absoluteUrl(about.cv_file)}`);
  return lines.join("\n");
}

function renderStats(title, description) {
  const lines = [`# ${title || "Stats"}`, ""];
  if (String(description ?? "") !== "") lines.push(String(description));
  lines.push("");
  lines.push(`Live analytics dashboard: ${absoluteUrl("/stats/")}.`);
  return lines.join("\n");
}

function renderSearch(title, description) {
  const lines = [`# ${title || "Search"}`, ""];
  if (String(description ?? "") !== "") lines.push(String(description));
  lines.push("");
  lines.push(`Interactive search UI: ${absoluteUrl("/search/")}.`);
  lines.push("");
  lines.push(`Machine-readable index: ${absoluteUrl("/search.json")}.`);
  return lines.join("\n");
}

function renderGenericPage(page, title, description) {
  const lines = [`# ${title}`, ""];
  if (String(description ?? "") !== "") lines.push(stripHtml(description));
  lines.push("");
  const markdown = htmlToMarkdownFallback(render(page.content, liquidScope(page)));
  if (markdown.trim() !== "") lines.push(markdown);
  return lines.join("\n");
}

function pageTwin(page, tag) {
  const title = page.data.title ?? String(site.title ?? "");
  const description = String(page.data.description ?? "");

  let body;
  if (tag) body = renderTagDetail(tag);
  else if (page.url === "/") body = renderHome();
  else if (page.url === "/blog/") body = renderBlog();
  else if (page.url === "/books/") body = renderBooksIndex();
  else if (page.url === "/tags/") body = renderTagsIndex();
  else if (page.url === "/work/") body = renderWork();
  else if (page.url === "/stats/") body = renderStats(title, description);
  else if (page.url === "/search/") body = renderSearch(title, description);
  else body = renderGenericPage(page, title, description);

  const front = compact({
    title,
    description: shortText(description),
    url: absoluteUrl(page.url),
  });
  return `${toFrontMatter(front)}\n${body.trim()}\n`;
}

// ---------------------------------------------------------------------------
// twin set
// ---------------------------------------------------------------------------

const SKIP_EXACT = new Set([
  "/feed.xml",
  "/sitemap.xml",
  "/sitemapindex.xml",
  "/sitemap-media.xml",
  "/llms.txt",
  "/llms-full.txt",
  "/robots.txt",
  "/search.json",
  "/404.html",
  "/CNAME",
]);
const SKIP_EXTENSIONS = new Set([
  ".xml", ".json", ".txt", ".ico", ".pdf", ".png", ".jpg",
  ".jpeg", ".webp", ".gif", ".svg", ".css", ".js",
]);
const SKIP_PREFIXES = ["/assets/", "/css/", "/scripts/", "/docs/"];

function skip(url, data) {
  if (data?.markdown_twin === false) return true;
  if (data?.legacy_tag_target) return true;
  if (!url) return true;
  if (SKIP_EXACT.has(url)) return true;
  if (SKIP_PREFIXES.some((prefix) => url.startsWith(prefix))) return true;
  if (/^\/tags-[^/]+\/$/.test(url)) return true;
  const extension = path.extname(url);
  if (extension && SKIP_EXTENSIONS.has(extension.toLowerCase()) && !url.endsWith("/")) return true;
  return false;
}

/** Every twin as `{ "<url>index.md": "<content>" }`. */
export function buildTwins() {
  const twins = {};
  const emit = (url, content) => {
    twins[`${url.replace(/^\//, "")}index.md`] = content;
  };

  for (const post of postList) {
    if (skip(post.url, post.data)) continue;
    emit(post.url, documentTwin(post, true));
  }
  for (const book of bookList) {
    if (skip(book.url, book.data)) continue;
    emit(book.url, documentTwin(book, false));
  }
  for (const loop of loopList) {
    if (skip(loop.url, loop.data)) continue;
    emit(loop.url, documentTwin(loop, false));
  }
  for (const page of pageList) {
    if (!page.url.endsWith("/")) continue;
    if (skip(page.url, page.data)) continue;
    emit(page.url, pageTwin(page, null));
  }
  // Tag archive pages come from _plugins/tag_pages_generator.rb, not from a
  // file on disk, so they are synthesized here the same way.
  for (const tag of tagArchiveList) {
    const url = `/tags/${tag.slug}/`;
    const page = {
      url,
      data: {
        title: tag.name,
        description: `Posts and books tagged ${tag.name}.`,
        tag_slug: tag.slug,
      },
      content: "",
    };
    emit(url, pageTwin(page, tag));
  }

  return twins;
}

/** Write the twins into `outDir` (usually out/). Returns the file count. */
export function writeTwins(outDir) {
  const twins = buildTwins();
  for (const [relative, content] of Object.entries(twins)) {
    const destination = path.join(outDir, relative);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, content, "utf8");
  }
  return Object.keys(twins).length;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const target = process.argv[2] ?? path.join(process.cwd(), "out");
  console.log(`markdown twins: wrote ${writeTwins(target)} files into ${target}`);
}
