// Port of 404.html (layout: default, permalink: /404.html). Next's static
// export writes this route to out/404.html, which is what GitHub Pages serves
// for unknown paths.
//
// The body is injected verbatim because it contains an HTML comment (the agent
// recovery hints) and a JSON <script> that JSX cannot reproduce exactly.
import { pageMeta } from "@/components/lib/page-meta";
import { getSiteConfig } from "@/components/lib/site-data";
import SiteShell from "@/components/site/SiteShell";

// Next injects its own <meta name="robots" content="noindex"> on not-found
// routes; override it through the metadata API so the page carries the exact
// Jekyll directive instead of a duplicate pair.
export const metadata = {
  robots: { index: false, follow: true },
};

const meta = pageMeta({
  url: "/404.html",
});

function body(siteUrl: string): string {
  return `<style>
  .error-container {
    max-width: 600px;
    margin: 80px auto;
    text-align: center;
    padding: 40px 20px;
  }

  .error-code {
    font-size: 96px;
    font-weight: 700;
    letter-spacing: -0.04em;
    color: var(--line-strong, #d2d6dc);
    line-height: 1;
    margin-bottom: 16px;
  }

  .error-message {
    font-size: var(--text-2xl, 27px);
    font-weight: 600;
    margin-bottom: 15px;
    color: var(--text-primary, #111);
  }

  .error-description {
    font-size: var(--text-md, 17px);
    color: var(--ink-muted, #666);
    margin-bottom: 40px;
    line-height: 1.6;
  }

  .error-actions {
    display: flex;
    flex-direction: column;
    gap: 15px;
    align-items: center;
  }

  .error-button {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    background-color: var(--ink, #111111);
    color: var(--paper, #ffffff);
    border-radius: var(--radius-md, 8px);
    text-decoration: none;
    font-weight: 500;
    transition: opacity 0.2s ease;
  }

  .error-button:hover {
    color: var(--paper, #ffffff);
    opacity: 0.85;
  }

  .error-links {
    margin-top: 30px;
  }

  .error-links a {
    color: var(--accent, #555555);
    text-decoration: none;
    margin: 0 15px;
    font-size: 14px;
  }

  .error-links a:hover {
    text-decoration: underline;
  }

  .error-agent-help {
    margin-top: 50px;
    padding-top: 30px;
    border-top: 1px solid var(--border-color, #e5e5e5);
    text-align: left;
  }

  .error-agent-help h2 {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary, #111);
    margin-bottom: 10px;
  }

  .error-agent-help p,
  .error-agent-help li {
    font-size: 14px;
    color: var(--text-secondary, #666);
    line-height: 1.6;
  }

  .error-agent-help ul {
    margin: 10px 0;
    padding-left: 20px;
  }

  .error-agent-help a {
    color: var(--accent, #555555);
  }

  @media screen and (max-width: 600px) {
    .error-code {
      font-size: 80px;
    }

    .error-message {
      font-size: 24px;
    }
  }
</style>

<!--
# 404 - Not Found

This path does not exist on subramanya.ai. Where to look next:

- Site map for agents: /llms.txt
- Sitemap (XML): /sitemap.xml
- Search index (JSON): /search.json
- API spec: /openapi.json
- Docs index: /docs/

Every HTML page has a markdown twin at <page-url>index.md.
-->
<script type="application/json" id="agent-error">
{
  "error": {
    "code": "not_found",
    "status": 404,
    "message": "The requested path does not exist on subramanya.ai.",
    "resolution": "Look the URL up in /llms.txt (agent site map), /sitemap.xml (canonical URL list), or /search.json (full-text index). Machine endpoints are described in /openapi.json.",
    "links": {
      "llms_txt": "${siteUrl}/llms.txt",
      "sitemap": "${siteUrl}/sitemap.xml",
      "search_index": "${siteUrl}/search.json",
      "openapi": "${siteUrl}/openapi.json",
      "docs": "${siteUrl}/docs/"
    }
  }
}
</script>
<div class="error-container">
  <div class="error-code">404</div>
  <h1 class="error-message">Page Not Found</h1>
  <p class="error-description">
    Oops! The page you're looking for doesn't exist. It might have been moved or deleted.
  </p>

  <div class="error-actions">
    <a href="/" class="error-button" title="Go Home">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
      </svg>
      Go Home
    </a>
  </div>

  <div class="error-links">
    <a href="/blog/" title="Browse Blog">Browse Blog</a>
    <a href="/books/" title="View Books">View Books</a>
    <a href="/work/" title="See Work">See Work</a>
  </div>

  <div class="error-agent-help">
    <h2>Looking for something? (Agents welcome)</h2>
    <p>
      This is a real HTTP 404 &mdash; the path you requested does not exist on
      subramanya.ai. To find the right URL:
    </p>
    <ul>
      <li><a href="/llms.txt" title="/llms.txt">/llms.txt</a> &mdash; site map with markdown links for every page</li>
      <li><a href="/sitemap.xml" title="/sitemap.xml">/sitemap.xml</a> &mdash; canonical URL list (Sitemaps 0.9)</li>
      <li><a href="/search.json" title="/search.json">/search.json</a> &mdash; full-text search index (JSON)</li>
      <li><a href="/openapi.json" title="/openapi.json">/openapi.json</a> &mdash; OpenAPI 3.1 spec of all machine endpoints</li>
      <li><a href="/.well-known/api-catalog" title="/.well-known/api-catalog">/.well-known/api-catalog</a> &mdash; RFC 9727 endpoint catalog</li>
    </ul>
    <p>
      Every HTML page has a markdown twin at <code>&lt;page-url&gt;index.md</code>,
      e.g. <a href="/work/index.md" title="/work/index.md">/work/index.md</a>.
      A machine-readable copy of this error is embedded above in
      <code>&lt;script type="application/json" id="agent-error"&gt;</code>.
    </p>
  </div>
</div>`;
}

export default function NotFound() {
  return <SiteShell meta={meta} layout="default" rawContent={body(getSiteConfig().url)} />;
}
