---
layout: page
title: Documentation
description: Developer documentation for this site - architecture, content model, and contributor workflow.
permalink: /docs/
robots: noindex, follow
---

This section is the human-readable counterpart to the machine-readable
[`/.well-known/api-catalog`](/.well-known/api-catalog) and
[`/llms.txt`](/llms.txt) endpoints. It describes how the site is built,
what data it depends on, and how to contribute.

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
| [`/.well-known/api-catalog`](/.well-known/api-catalog) | RFC 9727 catalog of all machine-readable endpoints | `application/linkset+json` |
| [`/llms.txt`](/llms.txt) | Short site summary for LLM ingestion | `text/plain` |
| [`/llms-full.txt`](/llms-full.txt) | Full site content for LLM ingestion | `text/plain` |
| [`/search.json`](/search.json) | Search index (posts and books) | `application/json` |
| [`/feed.xml`](/feed.xml) | Blog RSS 2.0 feed | `application/rss+xml` |
| [`/sitemap.xml`](/sitemap.xml) | Sitemaps 0.9 | `application/xml` |
| [`/sitemapindex.xml`](/sitemapindex.xml) | Sitemap index | `application/xml` |
| [`/robots.txt`](/robots.txt) | Crawler policy with AI content signals | `text/plain` |

## RFC References

- [RFC 8288](https://www.rfc-editor.org/rfc/rfc8288) - Web Linking (the `Link` header and `<link>` element).
- [RFC 9264](https://www.rfc-editor.org/rfc/rfc9264) - Linkset format (`application/linkset+json`).
- [RFC 9727](https://www.rfc-editor.org/rfc/rfc9727) - API catalog well-known URI.
- [RFC 8615](https://www.rfc-editor.org/rfc/rfc8615) - Well-known URIs.
