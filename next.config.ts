import type { NextConfig } from "next";

// Standard Vercel deployment: every route is statically prerendered
// (generateStaticParams / force-static route handlers), and next.config
// headers are applied by Vercel's Next builder.
//
// EXPORT_PARITY=1 switches to `output: "export"` for the local URL-parity
// harness (scripts/parity/), which diffs the exported `out/` directory against
// the frozen Jekyll baseline. headers() is unsupported under export, so it is
// gated off there — Vercel never uses that mode.
const isExport = process.env.EXPORT_PARITY === "1";

const nextConfig: NextConfig = {
  ...(isExport ? { output: "export" as const } : {}),
  // Jekyll used pretty permalinks (/path/ -> path/index.html); trailing
  // slashes keep every indexed URL identical.
  trailingSlash: true,
  images: { unoptimized: true },
  ...(isExport
    ? {}
    : {
        async rewrites() {
          return {
            beforeFiles: [
              {
                // ?mode=agent on the homepage returns the machine-readable
                // site summary instead of the marketing HTML.
                source: "/",
                has: [{ type: "query", key: "mode", value: "agent" }],
                destination: "/llms.txt",
              },
              {
                // Accept: text/markdown on the homepage serves the markdown
                // twin (acceptmarkdown.com-style content negotiation).
                // Homepage-only: a generic /:path* rule would shadow real
                // .md/.txt/.json paths and risk rewrite loops.
                source: "/",
                has: [{ type: "header", key: "accept", value: "(.*text/markdown.*)" }],
                destination: "/index.md",
              },
            ],
            afterFiles: [],
            fallback: [],
          };
        },
        async headers() {
          return [
            {
              // RFC 8288 web linking + cache-variance for the Accept-based
              // markdown negotiation above.
              source: "/",
              headers: [
                { key: "Vary", value: "Accept" },
                {
                  key: "Link",
                  value:
                    '</sitemap.xml>; rel="sitemap"; type="application/xml", ' +
                    '</index.md>; rel="alternate"; type="text/markdown", ' +
                    '</llms.txt>; rel="describedby"; type="text/plain", ' +
                    '</openapi.json>; rel="service-desc"; type="application/json", ' +
                    '</.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json", ' +
                    '</auth.md>; rel="describedby"; type="text/markdown"',
                },
              ],
            },
            {
              // RFC 9727 requires the linkset media type on the extensionless
              // canonical path.
              source: "/.well-known/api-catalog",
              headers: [
                {
                  key: "Content-Type",
                  value:
                    'application/linkset+json;profile="https://www.rfc-editor.org/info/rfc9727"',
                },
              ],
            },
            {
              source: "/.well-known/:name(openid-configuration|oauth-noop)",
              headers: [
                { key: "Content-Type", value: "application/json; charset=utf-8" },
              ],
            },
          ];
        },
      }),
};

export default nextConfig;
