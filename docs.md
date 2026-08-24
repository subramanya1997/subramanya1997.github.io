---
layout: page
title: Developer Documentation
description: Subramanya N (subramanya.ai) developer resources - OpenAPI spec, agent endpoints, architecture, content model, and contributor workflow.
permalink: /docs/
---

These are the developer resources for **subramanya.ai**, the personal site of
**Subramanya N**. This section is the human-readable counterpart to the
machine-readable [`/openapi.json`](/openapi.json),
[`/.well-known/api-catalog`](/.well-known/api-catalog), and
[`/llms.txt`](/llms.txt) endpoints. It describes how the site is built,
what data it depends on, how agents can consume it programmatically, and how
to contribute.

## Pages

- [Architecture]({{ '/docs/architecture/' | prepend: site.baseurl }}) - system overview, build flow, rendering model, and where to change things.
- [Content Model]({{ '/docs/content-model/' | prepend: site.baseurl }}) - front-matter and data contracts for posts, books, data files, and top-level pages.
- [Development]({{ '/docs/development/' | prepend: site.baseurl }}) - local setup, validation commands, content update workflow, and Python maintenance scripts.

## Agent-Readable Endpoints

For automated consumption, the site exposes several machine-readable endpoints.
These are also advertised via RFC 8288 `<link>` elements on every page and via
an RFC 9727 api-catalog Linkset.

| Endpoint | Purpose | Content Type |
| --- | --- | --- |
| [`/openapi.json`](/openapi.json) | OpenAPI 3.1 spec of the read-only content API | `application/json` |
| [`/api/v1/posts.json`](/api/v1/posts.json) | All blog posts (versioned, typed JSON) | `application/json` |
| [`/api/v1/books.json`](/api/v1/books.json) | All book notes (versioned, typed JSON) | `application/json` |
| [`/.well-known/api-catalog`](/.well-known/api-catalog) | RFC 9727 catalog of all machine-readable endpoints | `application/linkset+json` |
| [`/llms.txt`](/llms.txt) | Short site summary for LLM ingestion | `text/plain` |
| [`/llms-full.txt`](/llms-full.txt) | Full site content for LLM ingestion | `text/plain` |
| [`/search.json`](/search.json) | Search index (posts and books) | `application/json` |
| [`/feed.xml`](/feed.xml) | Blog RSS 2.0 feed | `application/rss+xml` |
| [`/sitemap.xml`](/sitemap.xml) | Sitemaps 0.9 | `application/xml` |
| [`/sitemapindex.xml`](/sitemapindex.xml) | Sitemap index | `application/xml` |
| [`/robots.txt`](/robots.txt) | Crawler policy with AI content signals | `text/plain` |

All endpoints are read-only, served over anonymous HTTPS `GET` - no API key,
no sign-up, no rate-limit registration. Every operation in
[`/openapi.json`](/openapi.json) has a unique `operationId`, a description,
and typed response schemas, so it can be loaded directly into LLM
function-calling or tool-use frameworks. Nonexistent paths return a real
HTTP 404 whose body links to `/llms.txt`, `/sitemap.xml`, and `/search.json`
for recovery.

## RFC References

- [RFC 8288](https://www.rfc-editor.org/rfc/rfc8288) - Web Linking (the `Link` header and `<link>` element).
- [RFC 9264](https://www.rfc-editor.org/rfc/rfc9264) - Linkset format (`application/linkset+json`).
- [RFC 9727](https://www.rfc-editor.org/rfc/rfc9727) - API catalog well-known URI.
- [RFC 8615](https://www.rfc-editor.org/rfc/rfc8615) - Well-known URIs.
