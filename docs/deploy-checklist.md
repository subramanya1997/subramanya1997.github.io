---
layout: page
title: Deploy Checklist
description: Pre-deploy verification checklist for subramanya.ai - build, content, API surface, and post-deploy live checks.
permalink: /docs/deploy-checklist/
---

Run through this before pushing to `main` (a push deploys production
automatically — the Vercel project is git-connected). Steps 1-3 are enforced
by CI (`code_quality.yml`), but running them locally first keeps broken
commits off `main`.

## 1. Production build

```bash
bun run build
```

Must finish without errors. The build syncs the static content directories
into `public/` and writes the full static export to `out/`.

## 2. Content and URL validation

```bash
node scripts/validate-content.mjs
```

```bash
bun run parity
```

Front matter contracts, trust pages (`/contact/`, `/privacy/`), llms.txt
sections, 404 recovery links, and the OpenAPI source are all checked by
`validate-content.mjs`; the parity diff verifies every published URL in the
frozen manifest (`scripts/parity/manifest.json`) still resolves with no
canonical drift.

## 3. API surface validation (spec vs. built output)

```bash
python3 scripts/validate_api_output.py out
```

This validates the **built** `out/` output, and fails on drift between
`openapi.json` and reality:

- `openapi.json`, `search.json`, `/api/v1/posts.json`, `/api/v1/books.json`,
  and `/.well-known/api-catalog` parse as JSON.
- Every concrete path documented in the OpenAPI spec exists in the build, and
  every operation has a unique `operationId`, a description, and responses.
- `search.json` items match the spec's `SearchItem` schema: `kind` is in the
  spec's enum (`post`/`book`/`loop`), tags are `{name, slug}` objects,
  `views`/`reading_minutes` are integer-or-null, no duplicate URLs, and every
  post URL has a built page.
- `/api/v1/*` envelopes are correct (`api_version`, `kind`, `count` matches),
  URLs are absolute, dates are ISO, posts are newest-first, and every
  `markdown_url` twin actually exists in the build.
- `llms.txt` keeps its "When to use this site" guidance and the 404 page keeps
  its agent recovery links.

If you change the shape of any JSON endpoint, update `openapi.json` in the
same commit - this script is what makes that contract binding.

## 4. Post-deploy live checks

After the Vercel deployment finishes (~1-2 min after the push):

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://subramanya.ai/some-path-that-does-not-exist
```

Must print `404`.

```bash
for u in /openapi.json /api/v1/site.json /api/v1/posts.json /api/v1/books.json /api/v1/tags.json /search.json /llms.txt /contact/ /privacy/ /docs/api-deprecation-policy/ /.well-known/api-catalog /sitemap.xml /feed.xml; do printf "%-30s %s\n" "$u" "$(curl -s -o /dev/null -w '%{http_code} %{content_type}' https://subramanya.ai$u)"; done
```

Every row must be `200` with the right content type (`application/json` for
the JSON endpoints, `text/markdown` for any `index.md` twin you spot-check).

Optionally, re-run the agent-readiness audit:

```bash
npx is-agentic subramanya.ai
```

Note: the audit service caches reports and throttles rescans, so a fresh score
can lag a deploy by a while.
