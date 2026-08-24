# subramanya.ai

Personal site of Subramanya N — Next.js 16 (App Router, static export) built
from the original Jekyll content sources, served on Vercel.

## Deployment

**Pushing to `main` on GitHub deploys to production automatically** — the
Vercel project `subramanya-ai` is git-connected. Do not deploy manually with
`vercel --prod`; commit, push, and the deployment goes out on its own.

- Build: `bun run build` (runs `scripts/next/sync-public.mjs`, then `next build`);
  `bun run build:export` (`EXPORT_PARITY=1`) writes the static export to `out/`
  for the parity harness — Vercel never uses export mode.
- Vercel config: `vercel.json` (trailing slashes, `.well-known` content types)
- Domain: subramanya.ai (+ www). GitHub Pages is retired; DNS points at Vercel.

## Layout

- Content collections live under `content/`: `content/posts/`,
  `content/books/`, `content/loops/`, `content/data/`, plus the vendored
  pre-built book sites in `content/books-static/`. Together with `assets/` they
  are the single source of truth — the Python scripts in `scripts/`
  (translations, OG images, analytics) write there.
- Site-wide settings live in `site.config.mjs` (plain JS, JSDoc-typed) — it
  replaced `_config.yml` and is imported by both `lib/content.ts` and the
  bare-node build scripts.
- Page sources are colocated with their route: `app/<route>/content.md`.
  `lib/page-sources.mjs` is the registry that pins each one's URL; `docs/*.md`
  remain a flat directory of pages pinned by their own `permalink:`. Next
  ignores non-route files inside `app/`, so these are inert as far as routing
  goes. The home page and 404 have no source file — they are pure TSX
  (`app/page.tsx`, `app/not-found.tsx`) and their metadata is declared inline
  in the registry's `PAGE_ENTRIES`.
- `lib/content.ts` loads that content; `lib/markdown.ts` renders markdown with
  byte-level kramdown/rouge parity (do not swap in a stock renderer — heading
  ids, rouge token classes, and smart quotes are all matched to the old Jekyll
  output).
- `components/post/assets/` holds the post chrome's hand-written CSS and vanilla
  JS as plain `.css`/`.client.js` files; `components/post/assets/index.ts` reads
  them at build time and the post components inject them **inline** via
  `dangerouslySetInnerHTML`. Do not convert them to `<link>`/`<script src>` — the
  bytes are part of the prerendered HTML the parity harness compares.
- Validation: `node scripts/validate-content.mjs` (content/front-matter
  contracts) and `python3 scripts/validate_api_output.py out` (built API
  surface vs `openapi.json`). CI (`code_quality.yml`) runs build + parity +
  both validators.
- `scripts/next/sync-public.mjs` (prebuild) fills `public/`: assets, css,
  `.well-known` discovery docs (+ extensionless aliases), markdown twins
  (`<url>index.md` beside every page), and book redirect pages.
- `scripts/parity/` holds the URL-parity harness: `manifest.json` is the
  1,059-URL baseline from the final Jekyll build; run `bun run build:export`,
  then `node scripts/parity/diff-manifests.mjs scripts/parity/manifest.json out`
  must report no missing URLs and no canonical drift before shipping changes.

## Hard constraint

**Never change a URL.** Every published URL (posts at `/YYYY/MM/DD/slug/`,
tag archives at both `/tags/{slug}/` and legacy `/tags-{slug}/`, loops, feeds,
sitemaps, `api/v1/*.json`, markdown twins) is indexed and must keep resolving
byte-compatibly. Run the parity diff after any routing or build change.
