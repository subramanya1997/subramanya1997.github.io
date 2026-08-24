---
name: subramanya-ai-content
description: Read and query subramanya.ai — fetch posts, books, and tags from its read-only JSON API, read any page as markdown, and search full content. Use when a task needs Subramanya N's articles on AI agents, MCP, agentic security, or SaaS strategy.
---

# Consuming subramanya.ai

subramanya.ai is fully agent-readable: anonymous HTTPS GET, no keys, no rate
gymnastics. Everything below returns its complete collection in one response.

## Entry points

| Resource | URL |
|---|---|
| Site map for agents | https://subramanya.ai/llms.txt |
| Full content dump | https://subramanya.ai/llms-full.txt |
| OpenAPI 3.1 spec | https://subramanya.ai/openapi.json |
| Auth (spoiler: anonymous) | https://subramanya.ai/auth.md |

## JSON API (v1)

- `GET https://subramanya.ai/api/v1/posts.json` — every post:
  `{title, url, markdown_url, date, excerpt, tags[]}` under `posts[]`.
- `GET https://subramanya.ai/api/v1/books.json` — published books, same shape.
- `GET https://subramanya.ai/api/v1/tags.json` — tags:
  `{name, slug, post_count, archive_url}` under `tags[]`.
- `GET https://subramanya.ai/api/v1/site.json` — site metadata plus an
  `endpoints{}` directory of every machine endpoint.

## Reading pages as markdown

Append `index.md` to any page URL:
`https://subramanya.ai/2025/10/30/claude-skills-vs-mcp-a-tale-of-two-ai-customization-philosophies/index.md`.
The homepage twin is `https://subramanya.ai/index.md`. Twins serve
`text/markdown` with front matter carrying the canonical URL.

## Searching

`GET https://subramanya.ai/search.json` returns the full corpus (posts and
books) with plain-text `content` — filter client-side. For discovery by
topic, use tags.json and follow `archive_url`.

## Errors

Unknown paths return HTTP 404 whose HTML body embeds
`<script type="application/json" id="agent-error">` with resolution hints —
check status codes, then re-orient via /llms.txt.
