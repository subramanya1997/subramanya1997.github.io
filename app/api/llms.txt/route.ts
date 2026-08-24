// Scoped llms.txt for the content API (llmstxt.org modular files).
import { getSiteConfig } from "@/lib/content";

export const dynamic = "force-static";

export async function GET() {
  const url = String(getSiteConfig().url).replace(/\/$/, "");
  const body = `# Subramanya N — Content API

> Scoped context for the read-only JSON API of subramanya.ai. Anonymous HTTPS
> GET only — no auth, no API keys, no write operations. Every endpoint returns
> its complete collection in a single response (no pagination). For the whole
> site see ${url}/llms.txt.

## Endpoints (v1)
- ${url}/api/v1/site.json: site metadata, author, languages, endpoint directory
- ${url}/api/v1/posts.json: every blog post with title, url, dates, tags, description
- ${url}/api/v1/books.json: published books/handbooks with metadata
- ${url}/api/v1/tags.json: every tag with its archive URL and tagged items

## Specification & discovery
- OpenAPI 3.1: ${url}/openapi.json
- API catalog (RFC 9727): ${url}/.well-known/api-catalog
- ARD catalog: ${url}/.well-known/ai-catalog.json
- Agent skills index: ${url}/.well-known/agent-skills/index.json
- Auth walkthrough (anonymous): ${url}/auth.md
- Versioning & deprecation policy: ${url}/docs/api-deprecation-policy/

## Conventions
- Markdown twins: append index.md to any page URL for a markdown version
  (homepage: ${url}/index.md).
- Search corpus: ${url}/search.json (full text of posts and books).
- Full content dump: ${url}/llms-full.txt.
- Errors: unknown paths return HTTP 404 with an HTML body embedding an
  agent-error JSON block and recovery links.
`;

  return new Response(body, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
