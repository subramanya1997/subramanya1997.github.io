# DOM parity notes — Jekyll → Next.js (static pages)

Scope: `app/layout.tsx`, `app/page.tsx`, `app/not-found.tsx`, the static routes
(`/blog/ /books/ /contact/ /docs/ /docs/<slug>/ /privacy/ /publications/
/search/ /stats/ /tags/ /work/`) and everything under `components/` except
`components/ui` (shadcn).

## Verification

The port was verified against `_site/` (a local `jekyll build`) three ways:

1. **Component render** — each route rendered with `react-dom/server` and its
   `<main>` region diffed against `_site/<page>/index.html`.
2. **Full body** — same, over the entire `<body>` (header, footer, newsletter,
   popup, back-to-top, inline scripts).
3. **Real build** — `next build` in an isolated copy of the repo (separate
   `distDir`, so the shared `.next` was never touched), then `out/**` diffed
   against `_site/**` for both `<body>` and the set of `<head>` elements.

Result: **all 12 pages match `_site` exactly** once these are normalized:
attribute order, void-element `/>`, HTML-entity spelling, trailing `;` in
`style` attributes, and Liquid's stray indentation whitespace. The only
substantive differences are listed below.

## Intentional deviations

### Head

- **Order.** Jekyll's `<head>` order is: per-page tags → favicons → fonts →
  `main.css` → page stylesheets → Font Awesome → discovery links. React hoists
  metadata, so the built order is: charset/viewport (Next) → stylesheets by
  `precedence` (Google font, `main.css`, Font Awesome) → favicons/discovery
  links (layout) → per-page tags. Safe: `<head>` element order carries no
  semantics beyond stylesheet cascade.
- **No page stylesheets.** Jekyll linked a stylesheet per page from
  `assets/css/**`. Those sheets are now concatenated into `css/main.css`
  (section 8) in the exact order the links were emitted, so the cascade is
  unchanged and every page ships one stylesheet. The old `/assets/css/*` URLs
  are gone from the build and allowlisted in `scripts/parity/diff-allow.json`.
- **Font Awesome `onload`.** Jekyll emits
  `<link rel="stylesheet" media="print" onload="this.media='all'">`. JSX cannot
  express a string `onload`, so the link carries `id="font-awesome-css"` and a
  three-line inline script does the `media` swap. Same non-blocking behavior;
  the `<noscript>` fallback link is unchanged but now sits at the top of
  `<body>` instead of in `<head>` (a `<link>` in `<noscript>` works in both).
- **`charset` / `viewport` / `theme-color`** come from Next's `viewport` export
  in `app/layout.tsx`; the rendered tags are identical to Jekyll's (including
  `viewport-fit=cover`), only `charSet` casing in the source differs.
- **`app/favicon.ico` was deleted.** Next's file-convention favicon injected an
  extra `<link rel="icon" href="/favicon.ico?favicon.<hash>.ico">` that Jekyll
  never had. `/favicon.ico` is still served — `scripts/next/sync-public.mjs`
  copies the repo-root file into `public/`.
- **React image preloads.** `/work/` gains
  `<link rel="preload" as="image">` entries for the company logos, emitted by
  React 19 for non-lazy `<img>`. Perf hint only; no DOM/CSS impact.
- **JSON-LD lives in `<body>`.** `_includes/structured-data.html` sat in
  `<head>`; React does not hoist `<script>` with inline content, so the
  `application/ld+json` block renders where the page renders it. Google (and
  every other consumer) reads JSON-LD from anywhere in the document. Content is
  byte-identical apart from `JSON.stringify` indentation.
- **The `?lang=` bootstrap script** (`_includes/head.html`) now runs as the
  first element of `<body>` rather than in `<head>`. It still executes before
  any page content is parsed.

### Body

- **Whitespace.** Liquid `{% for %}` / `{% if %}` left large runs of blank lines
  and indentation inside the markup; JSX does not. No selector depends on it.
- **Entity spelling.** React escapes `'` as `&#x27;`; the 404's `&mdash;`
  stays an entity where Jekyll's Nokogiri pass had turned it into a literal
  `—`. Identical text content.
- **Attribute order.** React emits `action`/`method` after the other props on
  `<form>`; Nokogiri kept source order. Identical DOM.
- **`style="display:none"`** — React drops Jekyll's trailing semicolon.
- **Next runtime markup.** `<div hidden><!--$--><!--/$--></div>` and the
  `/_next/static/*` scripts plus the RSC payload are appended by Next. They do
  not touch the ported markup and the legacy vanilla JS is unaffected.
- **404 body is injected verbatim** (`SiteShell`'s `rawContent` prop) so the
  agent-recovery HTML comment and the `<script type="application/json"
  id="agent-error">` block survive exactly — JSX cannot render comments.

### Styling

- **`app/globals.css` is not imported.** Tailwind's preflight would reset the
  legacy stylesheet in `public/css`. The file is left
  intact so the shadcn setup keeps working for any future non-ported surface;
  it just is not pulled into the root layout.

### Data / ordering

- **`lib/content.ts#getAllPosts` needs a tiebreak.** Jekyll sorts documents by
  `(date, path)` ascending and reverses, so posts sharing a date come out
  filename-**descending**. `getAllPosts` sorts on date only, which flipped the
  three 2022-12-28 posts. `components/lib/site-data.ts#getPostsInJekyllOrder`
  applies the tiebreak locally; it should be folded into `getAllPosts` so the
  feed, sitemap, search index and post routes agree.
- **Analytics is always emitted.** The `JEKYLL_ENV=production` gate (mirroring
  `jekyll.environment == 'production'`) was dropped after the Vercel cut-over —
  the Vercel build never set it, so production shipped without GA. Every build
  now carries the GA tags; local HTML differs from a plain `jekyll build` by
  exactly those script tags.
- **Reading time** is computed by running the post's markdown through
  `renderMarkdown` and applying `_includes/reading_time.html`'s algorithm to the
  rendered HTML — the same input Jekyll used. Verified equal for all posts.
- **Float formatting on `/stats/`.** JSON floats lose Ruby's trailing `.0`, and
  Ruby rounds half-up against the shortest decimal representation
  (`4.05.round(1) == 4.1`). `floatText` and `jekyll.ts#rubyRound` restore both.

### Known upstream gap (not this workstream)

- `/docs/` and `/docs/<slug>/` inherit whatever `lib/markdown.ts` produces.
  Earlier runs showed `&lt;link>` where kramdown emits `&lt;link&gt;` inside
  `<code>`; re-check after the markdown-parity work lands.

## API for the other workstreams

Post routes (`/YYYY/MM/DD/slug/`) should compose the same shell:

```tsx
import SiteShell from "@/components/site/SiteShell";
import Newsletter from "@/components/site/Newsletter";
import { pageMeta } from "@/components/lib/page-meta";
import { readingTime } from "@/components/lib/jekyll";

<SiteShell meta={pageMeta({ title, url, description, image, scripts })} layout="post">
  {/* _layouts/post.html body */}
</SiteShell>
```

- `layout="post"` suppresses the footer newsletter (Jekyll's
  `{% unless page.layout == 'post' %}`); `_layouts/post.html` renders
  `<Newsletter />` itself further down.
- `SiteShell` also accepts `rawContent` (verbatim HTML for `.wrap`).
- `PageHead` currently emits the non-post half of `_includes/head.html`. The
  post-specific tags (`article:*`, `citation_*`, `DC.*`, `twitter:data1`, the
  generated `/assets/images/<slug>.png` social image, and the
  `ScholarlyArticle` JSON-LD) still need to be added there — extend `PageMeta`
  with the post fields rather than forking the component.
- `PageMeta.isPost` already switches `og:type` to `article` and selects the
  post branch of `components/site/StructuredData.tsx` (breadcrumbs only).
- Loop pages need `class="loop-shell"` on `<body>`, which only a root layout can
  set. Either add a route group with its own root layout, or make
  `app/layout.tsx` opt-in via a shared constant — it is not handled today.
