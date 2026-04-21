---
layout: page
title: Architecture
description: "System overview of the Jekyll-based subramanya.ai site: build flow, rendering model, data contracts, and where to change things."
permalink: /docs/architecture/
robots: noindex, follow
---

## Overview

This repository is a Jekyll-based personal site hosted on GitHub Pages. The site is generated from Markdown, YAML/JSON data, Liquid templates, generated pages, and static assets. Runtime behavior is added with browser-side JavaScript for search, analytics, translation, TOC behavior, newsletter UI, and post interactions.

## Build Flow

1. Jekyll reads `_config.yml` to configure collections, URLs, markdown, and site-level metadata.
2. Content is loaded from `_posts/`, `_books/`, top-level pages such as `index.html` and `blog.md`, and data files in `_data/`.
3. Layouts in `_layouts/` wrap page content and compose shared includes from `_includes/`.
4. Static assets are served from `assets/`, `css/`, and top-level generated endpoints such as `feed.xml`, `search.json`, `llms.txt`, `llms-full.txt`, `/.well-known/api-catalog` (RFC 9727 API catalog, RFC 9264 Linkset), and `/.well-known/openid-configuration` (OIDC Discovery 1.0).
5. Jekyll outputs the generated site to `_site/`.

## Repository Structure

- `_config.yml`: Site configuration, collections, i18n settings, newsletter settings, and analytics IDs.
- `_layouts/`: Page shells. `default.html` is the global shell, `page.html` handles generic pages, and `post.html` handles blog posts.
- `_includes/`: Shared partials such as head metadata, header/footer, header search form, TOC, analytics, newsletter UI, language switcher, translation toast, related posts, and generated tag archive markup.
- `_posts/`: Blog posts in dated Markdown files.
- `_books/`: The custom `books` collection.
- `_data/`: Structured data for the homepage, work page, i18n labels, and analytics-derived view counts.
- `assets/`: Images, JavaScript, translation JSON, video, resume files, and page/component CSS introduced by the current refactor.
- `css/main.css`: Global site styles shared across the whole site.
- `scripts/`: Maintenance scripts for analytics fetching, OG image generation, translation generation, and content validation.
- `.github/workflows/`: CI and scheduled automation.

## Rendering Model

### Layouts

- `_layouts/default.html` provides the document shell, site header, site footer, global utility scripts, and per-page script loading.
- `_layouts/page.html` renders generic top-level pages and defers to `custom_layout: true` pages when the page provides its own body markup.
- `_layouts/post.html` is the rich article layout. It adds reading progress, TOC, language switching, copy-page actions, related posts, comments, lightbox markup, translation support, and post-specific JavaScript.

### Shared Includes

- `_includes/head.html`: metadata, canonical/hreflang tags, CSS loading, analytics inclusion, and page-specific stylesheet loading.
- `_includes/header.html`: skip links, site title, header search form, and navigation links.
- `_includes/footer.html`: social links, quote, copyright, and newsletter inclusion on non-post pages.
- `_includes/search.html`: the header search form that routes to `/search/`.
- `_includes/toc.html`: article TOC generation and share UI.
- `_includes/language-switcher.html` and `_includes/translation-toast.html`: translation UX for post pages.
- `_includes/analytics.html`: Google Analytics and enhanced analytics script loading.
- `_includes/components/`: reusable card/row components introduced for top-level pages.
- `_includes/tag-archive.html`: server-rendered tag archive body used by generated tag pages.

## Data and Content

- `_data/about.yaml` powers the homepage biography, work history, education, and social links.
- `_data/view_count.json` stores analytics-derived view counts and per-post engagement metadata used on the homepage, blog index, and stats page.
- `_data/i18n.yml` stores UI strings for translation-related interfaces.
- `_posts/` uses front matter plus Markdown body content for posts.
- `_books/` uses front matter plus Markdown body content for the books collection.
- `search.json` is the structured discovery index consumed by the search page.

## Runtime JavaScript Responsibilities

- `assets/js/post-scripts.js`: post page interactions such as reading progress, image lightbox, code copy, copy-page-as-Markdown, and references.
- `assets/js/analytics-enhanced.js`: scroll depth, reading progress, media interaction, and outbound link analytics.
- `assets/js/i18n.js`: translation loading, content replacement, URL language state, and translation event dispatch.
- `assets/js/components/site-language.js`: shared language preservation for internal links and forms.
- `assets/js/components/discovery.js`: search-index loading, ranking, and result rendering helpers.
- `assets/js/pages/*.js`: page behavior such as homepage formatting, search rendering, and stats formatting/animation.

## Automation and Maintenance Scripts

- `scripts/fetch_analytics.py`: fetches Google Analytics data and writes `_data/view_count.json`.
- `scripts/generate_og_images.py`: generates fallback OG images for posts.
- `scripts/translate_posts.py`: generates translation JSON files in `assets/translations/`.
- `scripts/validate_content.rb`: validates front matter, data file structure, and top-level page asset guardrails.
- `_plugins/tag_pages_generator.rb`: generates `/tags/<tag>/` archive pages and the tag index data.
- `.github/workflows/update-analytics.yml`: scheduled workflow that updates analytics data.
- `.github/workflows/code_quality.yml`: build, link checking, and content validation workflow.

## Where To Change Things

- Homepage content and structure: `index.html`
- Homepage bio/work data: `_data/about.yaml`
- Blog listing page: `blog.md`
- Books listing page: `books.md`
- Work page: `work.md`
- Stats page: `stats.md`
- Post page layout and post-only UX: `_layouts/post.html`
- Global shell behavior and per-page script loading: `_layouts/default.html`
- Global metadata and per-page stylesheet loading: `_includes/head.html`
- Search behavior: `_includes/search.html`, `search.md`, `search.json`, `assets/js/components/discovery.js`, and `assets/js/pages/search.js`
- Tag archives and topic browsing: `tags.md`, `_plugins/tag_pages_generator.rb`, `_includes/tag-archive.html`, and `assets/css/pages/tags.css`
- Agent discovery (RFC 8288 / RFC 9727): `api-catalog.json` emits `/.well-known/api-catalog.json`, and `_plugins/api_catalog_alias.rb` copies that output to the canonical extensionless `/.well-known/api-catalog` path so both URLs work. The catalog is a Linkset per RFC 9264 and enumerates every machine-readable endpoint on the site. `_includes/head.html` advertises the same endpoints via RFC 8288 `<link>` elements on every page (`api-catalog`, `describedby`, `service-doc`, `sitemap`, `search`, `author`, `alternate`). GitHub Pages cannot emit HTTP `Link` response headers directly, so HTML `<link>` elements are the RFC 8288 HTML-equivalent path.
- OpenID Connect discovery (OIDC Discovery 1.0): `openid-configuration.json` emits `/.well-known/openid-configuration.json`, and `_plugins/api_catalog_alias.rb` copies it to the canonical extensionless `/.well-known/openid-configuration`. The document is an intentionally inert stub: the site exposes no protected APIs, so `grant_types_supported` and `scopes_supported` are empty and `response_types_supported` / `id_token_signing_alg_values_supported` are `["none"]`. `jwks.json` emits `/.well-known/jwks.json` as an empty keyset, and `oauth-noop.json` emits `/.well-known/oauth-noop.json` (also aliased to `/.well-known/oauth-noop`) returning an RFC 6749 §5.2 `invalid_client` error for any agent that follows the authorization/token endpoints. Extend the `ALIASES` list in `_plugins/api_catalog_alias.rb` to add more extensionless well-known URIs.
- Developer documentation hub: `docs.md` emits `/docs/` as the landing page; each `docs/*.md` file is a Jekyll page served at `/docs/<name>/`. The `/docs/` URL is also the target of the `service-doc` link relation.
- Analytics configuration: `_includes/analytics.html`
- Analytics-derived stats data: `_data/view_count.json` and `scripts/fetch_analytics.py`
- Translation loading and UI: `assets/js/i18n.js`, `assets/js/components/site-language.js`, `_includes/language-switcher.html`, `_includes/translation-toast.html`, and `assets/translations/`
- Shared card UI for top-level pages: `_includes/components/` and `assets/css/components/`

## Constraints

- The site intentionally stays Jekyll-first. Do not add a frontend build tool, CSS framework, or client-side application framework unless there is a separate migration plan.
- Top-level pages can load page-specific static CSS/JS through front matter, but global behavior should remain centralized in the existing layouts/includes.
- Search, newsletter, TOC, translation toast, language switcher, and the post layout remain feature-rich and tightly coupled; refactor them only with a dedicated change plan.
