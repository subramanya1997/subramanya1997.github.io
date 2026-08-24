// Registry of the site's page sources — the files that used to sit at the repo
// root as Jekyll pages and now live beside the route that renders them
// (`app/<route>/content.md`).
//
// Next.js only routes `page.tsx` / `route.ts` / `layout.tsx` files, so these
// colocated `content.md` files are inert as far as routing is concerned; they
// are read as data by lib/nonhtml.ts (sitemap), scripts/next/markdown-twins.mjs
// (markdown twins) and, for the markdown-bodied pages, by the route itself.
//
// Plain JS so the bare-node build scripts and the TypeScript app share one
// list. Each entry pins the page's URL explicitly: the URL surface is frozen,
// so it must never be inferred from where a file happens to live. Files that
// declare `permalink:` in their front matter keep using it (identical values —
// the explicit `url` here is the same string), which preserves the previous
// behaviour byte for byte.
//
// Two pages have no source file at all (PAGE_ENTRIES below): the home page and
// the 404 are rendered entirely by `app/page.tsx` and `app/not-found.tsx`, so
// all that ever survived of their Jekyll `.html` sources was a front matter
// block. That metadata is declared inline here instead of in a vestigial file.

/**
 * @typedef {Object} PageSource
 * @property {string} source Repo-relative path of the page's source file.
 * @property {string} url Published URL. Frozen — never derive it from `source`.
 */

/**
 * @typedef {Object} PageEntry
 * @property {string} url Published URL. Frozen.
 * @property {Record<string, unknown>} frontmatter Page metadata, carrying
 *   exactly the keys the retired front matter block declared.
 */

/**
 * Pages that are pure metadata — no source file, no body.
 *
 * - `/` is rendered by `app/page.tsx`. Its markdown twin (`/index.md`) is
 *   synthesized from the site config, `content/data/about.yaml`, the book list
 *   and the post list — never from a page body — so the only front matter the
 *   twin generator reads here is `title`/`description`, both absent, which fall
 *   back to the site title and an empty description.
 * - `/404.html` is rendered by `app/not-found.tsx`. It gets no markdown twin
 *   (twins are emitted only for URLs ending in `/`); its front matter exists
 *   solely to keep the page out of the sitemap.
 *
 * The stylesheet/script lists the old files carried are deliberately not
 * repeated: `app/page.tsx` declares its own through `pageMeta`, and a copy here
 * would be a second source of truth.
 *
 * @type {PageEntry[]}
 */
export const PAGE_ENTRIES = [
  { url: "/", frontmatter: { layout: "default" } },
  {
    url: "/404.html",
    frontmatter: {
      layout: "default",
      permalink: "/404.html",
      sitemap: false,
      robots: "noindex, follow",
    },
  },
];

/** @type {PageSource[]} */
export const PAGE_FILES = [
  { source: "app/awesome-loops/content.md", url: "/awesome-loops/" },
  { source: "app/blog/content.md", url: "/blog/" },
  { source: "app/books/content.md", url: "/books/" },
  { source: "app/contact/content.md", url: "/contact/" },
  { source: "app/docs/content.md", url: "/docs/" },
  { source: "app/privacy/content.md", url: "/privacy/" },
  { source: "app/publications/content.md", url: "/publications/" },
  { source: "app/search/content.md", url: "/search/" },
  { source: "app/stats/content.md", url: "/stats/" },
  { source: "app/tags/content.md", url: "/tags/" },
  { source: "app/work/content.md", url: "/work/" },
];

/**
 * Directories scanned (non-recursively) for additional page sources. docs/*.md
 * are still a flat directory of markdown pages, each pinned by its own
 * `permalink:`. Non-recursive by design: docs/internal/ holds repo notes that
 * are never published.
 */
export const PAGE_DIRS = ["docs"];
