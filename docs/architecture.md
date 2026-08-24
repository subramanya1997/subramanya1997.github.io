---
layout: page
title: Architecture
description: "System overview of the subramanya.ai site: build flow, rendering model, data contracts, and where to change things."
permalink: /docs/architecture/
robots: noindex, follow
---

## Overview

This repository is a Next.js (App Router, static export) personal site
deployed on Vercel. It was migrated from Jekyll with a hard URL-compatibility
guarantee: content still lives in the original Jekyll-era source directories,
and the build reproduces the original published output — URLs, heading ids,
code-highlighting markup, and machine-readable endpoints included. Runtime
behavior is added with browser-side JavaScript for search, analytics,
translation, TOC behavior, newsletter UI, and post interactions.

## Build Flow

1. `scripts/next/sync-public.mjs` (prebuild) reads `site.config.mjs` and fills
   `public/`: static assets (`assets/`, `css/`), the `.well-known` discovery
   documents (plus extensionless aliases), markdown twins (an `index.md`
   beside every HTML page), book redirect pages, and the vendored static book
   sites in `content/books-static/`.
2. `lib/content.ts` loads content from `content/posts/`, `content/books/`,
   `content/loops/` and `content/data/`; the page sources colocated with each
   route (`app/blog/content.md`, `app/work/content.md`, …) are registered in
   `lib/page-sources.mjs`.
3. `lib/markdown.ts` renders markdown with byte-level parity to the original
   kramdown/rouge output (heading ids, token classes, smart quotes).
4. The App Router routes in `app/` render every page and generate the
   non-HTML surfaces (`feed.xml`, `search.json`, `sitemap.xml`,
   `sitemapindex.xml`, `llms.txt`, `llms-full.txt`, `/api/v1/*.json`) from
   `lib/nonhtml.ts`.
5. `next build` prerenders every route statically; Vercel runs the standard
   build and applies the `next.config.ts` headers/rewrites. `bun run
   build:export` (`EXPORT_PARITY=1`) switches to `output: "export"` and writes
   `out/` for the local URL-parity harness.

`scripts/parity/` holds the URL-parity harness: `manifest.json` is the frozen
baseline of every URL the site has ever served, and
`diff-manifests.mjs` fails the build in CI if a URL disappears or a canonical
tag drifts.

## Repository Structure

- `site.config.mjs`: Site configuration — title, description, URL, i18n settings, newsletter settings, and analytics IDs.
- `content/posts/`: Blog posts in dated Markdown files.
- `content/books/`: The `books` collection.
- `content/loops/`: Curated automation-loop marketplace listings.
- `content/data/`: Structured data for the homepage, work page, i18n labels, and analytics-derived view counts.
- `content/books-static/`: Pre-built static book sites served verbatim at their original URLs.
- `app/<route>/content.md`: Each page's own source (front matter plus body), colocated with the route that renders it; `lib/page-sources.mjs` is the registry that pins their URLs, and declares the home page and 404 inline since those are rendered entirely in TSX.
- `assets/`: Images, JavaScript, translation JSON, video, resume files, and page/component CSS.
- `css/main.css`: Global site styles shared across the whole site.
- `app/`: Next.js App Router routes — one route per page type, plus the non-HTML endpoints.
- `components/`: React ports of the original site chrome and page templates (header, footer, post layout, cards, search form, structured data).
- `lib/`: Content loading (`content.ts`), the parity markdown renderer (`markdown.ts`), TOC building (`toc.ts`), and the non-HTML surface builders (`nonhtml.ts`).
- `components/post/assets/`: the post chrome's hand-written CSS and vanilla JS, kept as plain `.css`/`.client.js` files (post layout, citation, language switcher, mermaid, post FAQ, related posts, TOC, translation toast). `components/post/assets/index.ts` reads them at build time and the post components inject them inline, byte for byte, where the markup expects them.
- `scripts/`: Maintenance scripts for analytics fetching, OG image generation, translation generation, and content validation, plus the build tooling in `scripts/next/` and the URL-parity harness in `scripts/parity/`.
- `.github/workflows/`: CI and scheduled automation.

## Rendering Model

### Layouts

- `components/site/SiteShell.tsx` provides the document shell, site header, site footer, global utility scripts, and per-page script loading.
- `components/site/PageLayout.tsx` renders generic top-level pages and defers to `custom_layout: true` pages when the page provides its own body markup.
- `components/post/PostLayout.tsx` is the rich article layout. It adds reading progress, TOC, language switching, copy-page actions, related posts, comments, lightbox markup, translation support, and post-specific JavaScript. Its inline style/script payloads are read verbatim from `components/post/assets/` at build time.

### Shared Components

- `components/site/PageHead.tsx` and `app/layout.tsx`: metadata, canonical/hreflang tags, CSS loading, analytics inclusion, and page-specific stylesheet loading.
- `components/site/Header.tsx`: skip links, site title, header search form, and navigation links.
- `components/site/Footer.tsx`: social links, quote, copyright, and newsletter inclusion on non-post pages.
- `components/site/SearchForm.tsx`: the header search form that routes to `/search/`.
- `components/post/Toc.tsx`: article TOC generation and share UI.
- `components/post/LanguageSwitcher.tsx` and `components/post/TranslationToast.tsx`: translation UX for post pages.
- `components/site/Analytics.tsx`: Google Analytics and enhanced analytics script loading.
- `components/cards/`: shared card/row components used by the top-level pages.
- `app/tags/[tag]/page.tsx`: server-rendered tag archive pages.

## Data and Content

- `content/data/about.yaml` powers the homepage biography, work history, education, and social links.
- `content/data/view_count.json` stores analytics-derived view counts and per-post engagement metadata used on the homepage, blog index, and stats page.
- `content/data/i18n.yml` stores UI strings for translation-related interfaces.
- `content/posts/` uses front matter plus Markdown body content for posts.
- `content/books/` uses front matter plus Markdown body content for the books collection.
- `content/loops/` uses front matter plus Markdown body content for automation-loop marketplace listings. Loop detail pages derive prompt, Agent Skill, Codex/Cursor `AGENTS.md`, Cursor `.mdc`, Claude deep-link, and Cursor deep-link exports from that source content.
- `search.json` is the structured discovery index consumed by the search page, generated at build time by `lib/nonhtml.ts`.

## Runtime JavaScript Responsibilities

- `assets/js/post-scripts.js`: post page interactions such as reading progress, image lightbox, code copy, copy-page-as-Markdown, and references.
- `assets/js/analytics-enhanced.js`: scroll depth, reading progress, media interaction, and outbound link analytics.
- `assets/js/i18n.js`: translation loading, content replacement, URL language state, and translation event dispatch.
- `assets/js/components/site-language.js`: shared language preservation for internal links and forms.
- `assets/js/components/discovery.js`: search-index loading, ranking, and result rendering helpers.
- `assets/js/pages/*.js`: page behavior such as homepage formatting, search rendering, and stats formatting/animation.

## Automation and Maintenance Scripts

- `scripts/fetch_analytics.py`: fetches Google Analytics data and writes `content/data/view_count.json`.
- `scripts/generate_og_images.py`: generates fallback OG images for posts.
- `scripts/translate_posts.py`: generates translation JSON files in `assets/translations/`.
- `scripts/validate-content.mjs`: validates front matter, data file structure, and top-level page asset guardrails.
- `scripts/validate_api_output.py`: validates the built `out/` API surface against `openapi.json`.
- `.github/workflows/update-analytics.yml`: scheduled workflow that updates analytics data.
- `.github/workflows/code_quality.yml`: build, URL parity, and content/API validation workflow.

## Where To Change Things

- Homepage content and structure: `app/page.tsx` (no separate source file; its page metadata is a `PAGE_ENTRIES` entry in `lib/page-sources.mjs`)
- Homepage bio/work data: `content/data/about.yaml`
- Blog listing page: `app/blog/content.md` and `app/blog/page.tsx`
- Books listing page: `app/books/content.md` and `app/books/page.tsx`
- Loop marketplace page: `app/awesome-loops/content.md`, `content/loops/*.md`, and `app/awesome-loops/`
- Work page: `app/work/content.md` and `app/work/page.tsx`
- Stats page: `app/stats/content.md` and `app/stats/page.tsx`
- Post page layout and post-only UX: `components/post/PostLayout.tsx` (inline assets sourced from `components/post/assets/`)
- Global shell behavior and per-page script loading: `components/site/SiteShell.tsx`
- Global metadata and per-page stylesheet loading: `components/site/PageHead.tsx` and `app/layout.tsx`
- Search behavior: `components/site/SearchForm.tsx`, `app/search/content.md`, the `search.json` builder in `lib/nonhtml.ts`, `assets/js/components/discovery.js`, and `assets/js/pages/search.js`
- Tag archives and topic browsing: `app/tags/content.md`, `app/tags/`, and `assets/css/pages/tags.css`
- Agent discovery (RFC 8288 / RFC 9727): `api-catalog.json` is published at `/.well-known/api-catalog.json`, and `scripts/next/sync-public.mjs` copies that output to the canonical extensionless `/.well-known/api-catalog` path so both URLs work (`vercel.json` sets the content type). The catalog is a Linkset per RFC 9264 and enumerates every machine-readable endpoint on the site. The site advertises the same endpoints via RFC 8288 `<link>` elements on every page (`api-catalog`, `describedby`, `service-doc`, `sitemap`, `search`, `author`, `alternate`).
- OpenID Connect discovery (OIDC Discovery 1.0): `openid-configuration.json` is published at `/.well-known/openid-configuration.json` and copied to the canonical extensionless `/.well-known/openid-configuration`. The document is an intentionally inert stub: the site exposes no protected APIs, so `grant_types_supported` and `scopes_supported` are empty and `response_types_supported` / `id_token_signing_alg_values_supported` are `["none"]`. `jwks.json` is published at `/.well-known/jwks.json` as an empty keyset, and `oauth-noop.json` at `/.well-known/oauth-noop.json` (also aliased to `/.well-known/oauth-noop`) returning an RFC 6749 §5.2 `invalid_client` error for any agent that follows the authorization/token endpoints. Extend the alias list in `scripts/next/sync-public.mjs` to add more extensionless well-known URIs.
- Developer documentation hub: `app/docs/content.md` emits `/docs/` as the landing page; each `docs/*.md` file is rendered by the `app/docs/` routes at `/docs/<name>/`. The `/docs/` URL is also the target of the `service-doc` link relation.
- Analytics configuration: `components/site/Analytics.tsx`
- Analytics-derived stats data: `content/data/view_count.json` and `scripts/fetch_analytics.py`
- Translation loading and UI: `assets/js/i18n.js`, `assets/js/components/site-language.js`, `components/post/LanguageSwitcher.tsx`, `components/post/TranslationToast.tsx`, and `assets/translations/`
- Shared card UI for top-level pages: `components/cards/` and `assets/css/components/`

## Constraints

- **Never change a URL.** Every published URL is indexed and must keep
  resolving byte-compatibly. Run `bun run parity` after any routing or build
  change.
- Do not swap `lib/markdown.ts` for a stock markdown renderer — heading ids,
  rouge token classes, and smart quotes are matched to the original published
  output.
- The Jekyll-era content directories are the single source of truth; the
  Python maintenance scripts write there, and the build reads them. Do not
  duplicate content into `app/` or `public/`.
- Top-level pages can load page-specific static CSS/JS through front matter,
  but global behavior should remain centralized in the shared components.
- Search, newsletter, TOC, translation toast, language switcher, and the post
  layout remain feature-rich and tightly coupled; refactor them only with a
  dedicated change plan.
