// Registry of the site's page sources — the files that used to sit at the repo
// root as Jekyll pages and now live beside the route that renders them
// (`app/<route>/content.md`, or `app/content.html` for the home page and
// `app/not-found.content.html` for the 404).
//
// Next.js only routes `page.tsx` / `route.ts` / `layout.tsx` files, so these
// colocated `content.*` files are inert as far as routing is concerned; they
// are read as data by lib/nonhtml.ts (sitemap), scripts/next/markdown-twins.mjs
// (markdown twins) and, for the markdown-bodied pages, by the route itself.
//
// Plain JS so the bare-node build scripts and the TypeScript app share one
// list. Each entry pins the page's URL explicitly: the URL surface is frozen,
// so it must never be inferred from where a file happens to live. Files that
// declare `permalink:` in their front matter keep using it (identical values —
// the explicit `url` here is the same string), which preserves the previous
// behaviour byte for byte.

/**
 * @typedef {Object} PageSource
 * @property {string} source Repo-relative path of the page's source file.
 * @property {string} url Published URL. Frozen — never derive it from `source`.
 */

/** @type {PageSource[]} */
export const PAGE_FILES = [
  { source: "app/content.html", url: "/" },
  { source: "app/not-found.content.html", url: "/404.html" },
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
