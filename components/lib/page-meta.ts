// The subset of Jekyll front matter that `_includes/head.html` and
// `_includes/structured-data.html` read. One object per route.
export interface PageMeta {
  /** `page.title` — absent on the homepage and the 404 page. */
  title?: string;
  /** `page.description` (falls back to `page.excerpt`, then `site.description`). */
  description?: string;
  /** `page.url`, e.g. "/blog/" (the homepage is "/"). */
  url: string;
  /** `page.robots`, e.g. "noindex, follow". */
  robots?: string;
  /** `page.image` — overrides the default social image. */
  image?: string;
  /** `page.markdown_url` from `_plugins/markdown_twin_generator.rb`. */
  markdownUrl?: string;
  /** `page.page_stylesheets`. */
  stylesheets?: string[];
  /** `page.page_scripts`. */
  scripts?: string[];
  /** `page.custom_layout` — bypasses the `.post` wrapper in `_layouts/page.html`. */
  customLayout?: boolean;
  /** `page.layout == 'post'` — changes og:type and the structured-data branch. */
  isPost?: boolean;
  /**
   * The post-only half of `_includes/head.html` (`article:*`, `citation_*`,
   * `DC.*`, `twitter:data1`). Present iff `isPost` is set.
   */
  article?: ArticleMeta;
}

/** Everything `_includes/head.html` needs for a `layout: post` page. */
export interface ArticleMeta {
  /** `page.date | date_to_xmlschema` — both article:published_time and :modified_time. */
  publishedTime: string;
  /** `page.author | default: site.title`. */
  author: string;
  /** `page.tags`. */
  tags: string[];
  /** `page.content | number_of_words | divided_by: 200`, floored at 1. */
  readingMinutes: number;
  /** `page.date | date: '%Y/%m/%d'`. */
  citationDate: string;
  /** `page.excerpt | strip_html | strip_newlines`. */
  abstract: string;
  /** `page.date | date: '%Y-%m-%d'`. */
  isoDate: string;
  /** `page.date | date: '%Y'` — used by DC.rights. */
  year: string;
}

const MARKDOWN_TWIN_SKIP_PREFIXES = ["/assets/", "/css/", "/scripts/", "/docs/"];

/** `_plugins/markdown_twin_generator.rb`: `<page-url>index.md` for real pages. */
export function markdownTwinUrl(url: string): string | undefined {
  if (!url.endsWith("/")) return undefined;
  if (MARKDOWN_TWIN_SKIP_PREFIXES.some((prefix) => url.startsWith(prefix))) return undefined;
  if (/^\/tags-[^/]+\/$/.test(url)) return undefined;
  return `${url}index.md`;
}

/** Convenience builder that fills in the markdown twin like the plugin does. */
export function pageMeta(meta: PageMeta): PageMeta {
  return { markdownUrl: markdownTwinUrl(meta.url), ...meta };
}
