// Heading-id generation and table-of-contents helpers that mirror the Jekyll
// build byte-for-byte.
//
// Two things live here:
//
//   1. `createHeadingIdGenerator` - a port of `generate_gfm_header_id` from
//      kramdown-parser-gfm (which is what `input: GFM` + `auto_ids: true`
//      actually uses; the plain-kramdown `basic_generate_id` algorithm is NOT
//      the one that ran on this site). Inbound anchor links depend on it.
//
//   2. `buildTocHtml` - a port of `_plugins/toc_filter.rb` (`toc_only`), so a
//      component can render the exact same nested `<ul>` markup the Liquid
//      filter produced.

export interface TocEntry {
  id: string;
  text: string;
  /** Heading level: 2 for `<h2>`, 3 for `<h3>`, etc. */
  level: number;
}

/**
 * kramdown-parser-gfm 1.1.0, `Kramdown::Parser::GFM#generate_gfm_header_id`:
 *
 *   result = text.downcase
 *   result.gsub!(/[^\p{Word}\- \t]/, '')
 *   result.tr!(" \t", '-')
 *   result << "-#{n}" if n > 0     # n counts *previous* occurrences
 *
 * `\p{Word}` in Ruby is `[[:alnum:]_]` over Unicode, i.e. letters, marks,
 * numbers and connector punctuation.
 */
const NON_WORD_RE = /[^\p{L}\p{M}\p{N}\p{Pc}\- \t]/gu;

export function slugifyHeading(text: string): string {
  return text.toLowerCase().replace(NON_WORD_RE, "").replace(/[ \t]/g, "-");
}

/**
 * Returns a stateful generator that reproduces kramdown's per-document
 * duplicate handling: the first occurrence keeps the bare slug, the second
 * gets `-1`, the third `-2`, and so on.
 */
export function createHeadingIdGenerator(): (text: string) => string {
  const counter = new Map<string, number>();
  return (text: string): string => {
    const base = slugifyHeading(text);
    const seen = counter.get(base);
    const next = seen === undefined ? 0 : seen + 1;
    counter.set(base, next);
    return next > 0 ? `${base}-${next}` : base;
  };
}

function escapeHtmlText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Port of `_plugins/toc_filter.rb#toc_only`.
 *
 * The Ruby filter walks every heading in document order, skips `<h1>`, and
 * opens/closes nested `<ul>` elements as the level changes - starting from an
 * assumed current level of 2. Its quirks (unbalanced lists when a document
 * starts at `<h3>`, no `<li>` wrapper around nested lists) are reproduced
 * faithfully so the markup is identical.
 */
export function buildTocHtml(entries: readonly TocEntry[]): string {
  if (entries.length === 0) return "";

  let currentLevel = 2;
  let toc = "<ul>";

  for (const entry of entries) {
    const level = entry.level;
    if (level === 1) continue;

    if (level > currentLevel) {
      toc += "<ul>".repeat(level - currentLevel);
    } else if (level < currentLevel) {
      toc += "</ul>".repeat(currentLevel - level);
    }
    currentLevel = level;
    toc += `<li><a href="#${entry.id}">${escapeHtmlText(entry.text)}</a></li>`;
  }

  if (currentLevel > 2) toc += "</ul>".repeat(currentLevel - 2);
  toc += "</ul>";
  return toc;
}
