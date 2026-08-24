---
layout: page
title: API Versioning & Deprecation Policy
description: Subramanya N (subramanya.ai) API versioning and deprecation policy - URL path versioning, additive-only changes, sunset timeline, and how deprecations are announced.
permalink: /docs/api-deprecation-policy/
---

This page is the deprecation policy for the read-only content API of
**subramanya.ai**, described in [`/openapi.json`](/openapi.json). It exists so
agents and integrators can rely on the surface without watching for silent
changes.

## Versioning scheme

Structured JSON resources are versioned in the URL path under `/api/v1/`
(currently [`/api/v1/posts.json`](/api/v1/posts.json),
[`/api/v1/books.json`](/api/v1/books.json),
[`/api/v1/tags.json`](/api/v1/tags.json), and
[`/api/v1/site.json`](/api/v1/site.json)). Root-level discovery files
([`/llms.txt`](/llms.txt), [`/search.json`](/search.json),
[`/sitemap.xml`](/sitemap.xml), [`/feed.xml`](/feed.xml),
[`/openapi.json`](/openapi.json)) follow their respective public standards
(llmstxt.org, Sitemaps 0.9, RSS 2.0, OpenAPI 3.1) and are not path-versioned.

## Stability guarantees

- **Additive-only within a version.** Within `/api/v1/`, fields may be added,
  but existing fields, paths, types, and semantics will not change or be
  removed.
- **Breaking changes get a new prefix.** Any breaking change ships as
  `/api/v2/` while `/api/v1/` keeps working in parallel.
- **Minimum 6-month sunset.** A deprecated version keeps being served for at
  least 6 months after its replacement is announced. After sunset, retired
  paths return HTTP 404 (the static host cannot emit `Sunset` or `Deprecation`
  response headers, so this page and the spec are the authoritative signal).

## How deprecations are announced

A deprecation is announced, with its sunset date, in all of these places:

1. This page, with the affected paths and dates.
2. The `description` of the affected operations in
   [`/openapi.json`](/openapi.json), marked with `"deprecated": true`.
3. [`/llms.txt`](/llms.txt), so agents reading the site summary see it.

## Currently deprecated endpoints

None. Every endpoint documented in [`/openapi.json`](/openapi.json) is
current, and `/api/v1/` is the only structured-JSON version that has ever
existed.

Questions about the policy: see [contact](/contact/).
