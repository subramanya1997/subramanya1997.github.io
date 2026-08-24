// Ports of the Liquid filters / Jekyll plugin behaviors the HTML templates
// relied on. Keeping them here (rather than in lib/) avoids colliding with the
// markdown-parity and non-HTML-routes workstreams.

/** Liquid's `strip_html`: drops <script>/<style>/comment blocks, then all tags. */
export function stripHtml(input: string): string {
  return input
    .replace(/<script[\s\S]*?<\/script>/g, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<style[\s\S]*?<\/style>/g, "")
    .replace(/<[\s\S]*?>/g, "");
}

/** Liquid's `strip_newlines`. */
export function stripNewlines(input: string): string {
  return input.replace(/\r?\n/g, "");
}

/** Liquid's `truncate` (default ellipsis "..."; the ellipsis counts toward len). */
export function truncate(input: string, length: number, ellipsis = "..."): string {
  if (input.length <= length) return input;
  const cut = Math.max(0, length - ellipsis.length);
  return input.slice(0, cut) + ellipsis;
}

/**
 * `_includes/reading_time.html`, verbatim: paragraph tags are preserved,
 * <pre>/<code> contents removed, HTML stripped, words / 200.
 * Input is the *rendered* HTML of the document (as in Jekyll).
 */
export function readingTime(renderedHtml: string): string {
  let c = renderedHtml
    .replace(/<p>/g, "__p__")
    .replace(/<\/p>/g, "__/p__")
    .replace(/<pre/g, "__CODEBLOCK_START__")
    .replace(/<\/pre>/g, "__CODEBLOCK_END__")
    .replace(/<code/g, "__CODE_START__")
    .replace(/<\/code>/g, "__CODE_END__");
  c = stripHtml(c);
  c = removeBetween(c, "__CODEBLOCK_START__", "__CODEBLOCK_END__");
  c = removeBetween(c, "__CODE_START__", "__CODE_END__");
  const words = c.split(/\s+/).filter(Boolean).length;
  const minutes = Math.floor(words / 200);
  const remainder = words % 200;
  if (minutes > 0) return minutes === 1 ? "1 min" : `${minutes} mins`;
  return remainder < 50 ? "< 1 min" : "1 min";
}

function removeBetween(input: string, start: string, end: string): string {
  const parts = input.split(start);
  let out = parts[0];
  for (const part of parts.slice(1)) {
    const tail = part.split(end);
    if (tail.length > 1) out += tail[1];
  }
  return out;
}

/**
 * `_plugins/link_attributes.rb#derive_title`: collapse whitespace, cap at 120
 * chars with a trailing ellipsis. Every anchor in the Jekyll output carries the
 * resulting `title`, so the ported components have to emit it too.
 */
const TITLE_MAX_LENGTH = 120;
export function linkTitle(text: string): string | undefined {
  const collapsed = text.replace(/\s+/g, " ").trim();
  if (!collapsed) return undefined;
  if (collapsed.length > TITLE_MAX_LENGTH) {
    return collapsed.slice(0, TITLE_MAX_LENGTH - 1).replace(/\s+$/, "") + "…";
  }
  return collapsed;
}

/** `_plugins/link_attributes.rb#external?` — off-site http(s) links open in a new tab. */
export function isExternal(href: string, siteUrl: string): boolean {
  if (!/^https?:\/\//i.test(href)) return false;
  try {
    return new URL(href).host !== new URL(siteUrl).host;
  } catch {
    return false;
  }
}

/**
 * `_plugins/link_attributes.rb` applied to an HTML fragment. Jekyll runs this
 * over the whole rendered page, so HTML that the templates inject verbatim
 * (`about.history`, excerpts, publication authors) picks the attributes up too.
 */
export function applyLinkAttributes(html: string, siteUrl: string): string {
  return html.replace(/<a\b([^>]*)>([\s\S]*?)<\/a>/g, (full, rawAttrs: string, inner: string) => {
    const href = attributeOf(rawAttrs, "href")?.trim();
    if (!href || href.startsWith("#") || href.startsWith("javascript:")) return full;

    // Nokogiri re-serializes every attribute with double quotes.
    let attrs = rawAttrs.replace(/([-:\w]+)='([^']*)'/g, (_m, name: string, value: string) => `${name}="${value.replace(/"/g, "&quot;")}"`);
    if (isExternal(href, siteUrl)) {
      if (attributeOf(attrs, "target") === undefined) attrs += ' target="_blank"';
      const rel = (attributeOf(attrs, "rel") ?? "").split(/\s+/).filter(Boolean);
      if (!rel.includes("noopener")) {
        const next = [...rel, "noopener"].join(" ");
        attrs = attributeOf(attrs, "rel") === undefined
          ? `${attrs} rel="${next}"`
          : attrs.replace(/\srel="[^"]*"/, ` rel="${next}"`);
      }
    }

    if (!attributeOf(attrs, "title")?.trim()) {
      const source =
        attributeOf(attrs, "aria-label")?.trim() ||
        stripHtml(inner) ||
        attributeOf(inner, "alt") ||
        "";
      const title = linkTitle(source);
      if (title) attrs += ` title="${title.replace(/"/g, "&quot;")}"`;
    }

    return `<a${attrs}>${inner}</a>`;
  });
}

function attributeOf(attrs: string, name: string): string | undefined {
  const match = attrs.match(new RegExp(`\\b${name}=("([^"]*)"|'([^']*)')`, "i"));
  if (!match) return undefined;
  return match[2] ?? match[3];
}

/**
 * Ruby's `Float#round`, which rounds half-up against the shortest decimal
 * representation (`4.05.round(1) == 4.1`), unlike JS's binary rounding.
 */
export function rubyRound(value: number, digits = 0): number {
  if (!Number.isFinite(value)) return value;
  const negative = value < 0;
  const text = Math.abs(value).toString();
  if (text.includes("e")) return Number(value.toFixed(digits));
  const [intPart, fracPart = ""] = text.split(".");
  if (fracPart.length <= digits) return value;
  const scaled = Number(intPart + fracPart.slice(0, digits));
  const rounded = Number(fracPart[digits]) >= 5 ? scaled + 1 : scaled;
  const result = rounded / 10 ** digits;
  return negative ? -result : result;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** `date: "%Y-%m-%d"` on a post date (dates are UTC-anchored by lib/content). */
export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** post-card / book-card `date_mode: "human"` → "August 17th, 2026". */
export function humanDate(date: Date): string {
  const day = date.getUTCDate();
  const month = MONTHS[date.getUTCMonth()];
  const year = date.getUTCFullYear();
  let suffix = "th";
  if (day === 1 || day === 21 || day === 31) suffix = "st";
  else if (day === 2 || day === 22) suffix = "nd";
  else if (day === 3 || day === 23) suffix = "rd";
  return `${month} ${day}${suffix}, ${year}`;
}

/**
 * `date: "%B %d, %Y at %I:%M %p"` used by the stats page for
 * `content/data/view_count.json`'s `last_updated`. The stored timestamp has no zone,
 * so — like Jekyll — the wall-clock fields are used as-is.
 */
export function longDateTime(timestamp: string): string {
  const m = timestamp.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
  if (!m) return timestamp;
  const [, y, mo, d, hh, mm] = m;
  const hour24 = Number(hh);
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${MONTHS[Number(mo) - 1]} ${d}, ${y} at ${String(hour12).padStart(2, "0")}:${mm} ${period}`;
}
