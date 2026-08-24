# AGENTS.md — working on subramanya.ai

Instructions for AI coding agents contributing to this repository
(github.com/subramanya1997/subramanya1997.github.io — source of
https://subramanya.ai).

## What this is

A personal site built with Next.js 16 (App Router), deployed on Vercel.
Content lives in `content/posts/`, `content/books/`, `content/loops/`,
`content/data/` and `assets/`; site-wide settings are in `site.config.mjs`.
Those are the single source of truth; the Python scripts in `scripts/`
(translations, OG images, analytics) write there. Page sources sit next to the
route that renders them (`app/<route>/content.md`), registered in
`lib/page-sources.mjs`.

## Commands

- Build: `bun run build` (runs `scripts/next/sync-public.mjs`, then `next build`)
- Typecheck: `bunx tsc --noEmit`
- Parity check (required before shipping routing/build changes):
  `bun run build:export && node scripts/parity/diff-manifests.mjs scripts/parity/manifest.json out`
  — must report **no missing URLs and no canonical drift** against the frozen
  1,059-URL Jekyll baseline.
- API output validation: `python3 scripts/validate_api_output.py out` (after a
  `build:export`).

## Hard constraints

1. **Never change a published URL.** Posts (`/YYYY/MM/DD/slug/`), tag archives
   (both `/tags/{slug}/` and legacy `/tags-{slug}/`), loops, feeds, sitemaps,
   `api/v1/*.json`, and the markdown twins (`<url>index.md`) are all indexed.
2. **Do not replace `lib/markdown.ts` with a stock renderer.** It is a
   byte-parity port of kramdown + rouge (heading-id algorithm, token classes,
   smart quotes). Swapping it breaks anchors, CSS, and content parity.
3. **Truthful agent surfaces only.** `auth.md`, `openapi.json`, the
   `.well-known` catalogs, and `llms.txt` must describe what actually exists —
   never advertise endpoints, auth flows, or capabilities the site doesn't have.

## Deployment

Push to `main` → Vercel deploys automatically (project `subramanya-ai`).
Never deploy manually. GitHub Pages is retired.

## Agent-facing site surfaces (keep them in sync when content model changes)

`/llms.txt`, `/llms-full.txt`, `/openapi.json`, `/auth.md`,
`/.well-known/api-catalog`, `/.well-known/ai-catalog.json`,
`/.well-known/agent-skills/index.json`, `/api/v1/*.json`, `/search.json`,
markdown twins, `/schema-map.xml`, `robots.txt`.
