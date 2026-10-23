// Build-time rendering for the UMass handbook. The source model (SUMMARY.md,
// page metadata, markdown prep) lives in lib/handbook-source.mjs so the
// prebuild script can share it; this adds HTML rendering and the search index.
import { renderMarkdown } from "@/lib/markdown";
import {
  handbookChapters,
  handbookPages,
  prepareHandbookMarkdown,
  type HandbookChapter,
  type HandbookPage,
} from "@/lib/handbook-source.mjs";

export {
  HANDBOOK_AUTHOR,
  HANDBOOK_BASE,
  HANDBOOK_SHORT_TITLE,
  HANDBOOK_SLUG,
  HANDBOOK_TITLE,
  handbookChapters,
  handbookPages,
  handbookTwinUrl,
} from "@/lib/handbook-source.mjs";
export type { HandbookChapter, HandbookPage };

export interface RenderedHandbookPage {
  /** Heading shown as the page's h1 (the source's first heading). */
  heading: string;
  html: string;
  /** h2 sections, for the chapter overview cards. */
  sections: { id: string; text: string }[];
  /** Plain-text word count, for the reading-time label. */
  words: number;
}

export function handbookPage(route: string): HandbookPage | undefined {
  return handbookPages().find((page) => page.route === route);
}

export function handbookChapterOf(page: HandbookPage): HandbookChapter {
  return handbookChapters()[page.chapter];
}

export function handbookNeighbours(page: HandbookPage): {
  previous?: HandbookPage;
  next?: HandbookPage;
} {
  const pages = handbookPages();
  const index = pages.findIndex((candidate) => candidate.route === page.route);
  return { previous: pages[index - 1], next: pages[index + 1] };
}

/** 1-based position of `page` in reading order. */
export function handbookPosition(page: HandbookPage): number {
  return handbookPages().findIndex((candidate) => candidate.route === page.route) + 1;
}

/** Lazy-loads the embedded Google Maps and gives each frame an accessible name. */
function enhanceHtml(html: string, heading: string): string {
  const label = heading.replace(/"/g, "&quot;");
  return html
    .replace(/<iframe\b([^>]*)>/g, (_, attrs: string) => {
      let next = attrs;
      if (!/\sloading=/.test(next)) next += ' loading="lazy"';
      if (!/\stitle=/.test(next)) next += ` title="Map of ${label}"`;
      if (!/\sallowfullscreen/.test(next)) next += " allowfullscreen";
      return `<iframe${next}>`;
    })
    .replace(/<table>/g, '<div class="table-wrapper"><table>')
    .replace(/<\/table>/g, "</table></div>");
}

export function htmlToText(html: string): string {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;|&rsquo;|&lsquo;/g, "'")
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—")
    .replace(/&hellip;/g, "…")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/\s+/g, " ")
    .trim();
}

const renderCache = new Map<string, RenderedHandbookPage>();

export async function renderHandbookPage(page: HandbookPage): Promise<RenderedHandbookPage> {
  const cached = process.env.NODE_ENV === "production" ? renderCache.get(page.file) : undefined;
  if (cached) return cached;

  const { heading, body } = prepareHandbookMarkdown(page);
  const { html, headings } = await renderMarkdown(body);
  const text = htmlToText(html);
  const rendered: RenderedHandbookPage = {
    heading,
    html: enhanceHtml(html, heading),
    sections: headings.filter((h) => h.level === 2).map((h) => ({ id: h.id, text: h.text })),
    words: text ? text.split(/\s+/).length : 0,
  };
  renderCache.set(page.file, rendered);
  return rendered;
}

export interface HandbookSearchEntry {
  /** URL with the section anchor, if the hit sits below a heading. */
  url: string;
  /** Page heading. */
  page: string;
  /** Chapter label from SUMMARY.md. */
  chapter: string;
  /** Section heading the text sits under ("" for the page intro). */
  section: string;
  text: string;
}

/**
 * Section-level search index: one entry per h2/h3 block of every page, so a
 * hit links straight to the matching section instead of the top of the page.
 */
export async function buildHandbookSearchIndex(): Promise<HandbookSearchEntry[]> {
  const chapters = handbookChapters();
  const entries: HandbookSearchEntry[] = [];

  for (const page of handbookPages()) {
    const { heading, html } = await renderHandbookPage(page);
    const chapter = chapters[page.chapter].page.navTitle;

    for (const part of html.split(/(?=<h[23]\b)/)) {
      const match = /^<h[23][^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/h[23]>/.exec(part);
      const section = match ? htmlToText(match[2]) : "";
      const text = htmlToText(match ? part.slice(match[0].length) : part);
      if (!section && !text) continue;
      entries.push({
        url: match ? `${page.url}#${match[1]}` : page.url,
        page: heading,
        chapter,
        section,
        text,
      });
    }
  }

  return entries;
}
