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
        async headers() {
          return [
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
