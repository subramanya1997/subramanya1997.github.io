import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Verbatim inline payloads injected into the post HTML byte for byte; they
    // are data, not modules, and must not be "fixed" by a linter.
    "components/post/assets/*.client.js",
    // Static files copied verbatim into public/ by scripts/next/sync-public.mjs:
    // legacy Jekyll-era browser scripts and the vendored pre-built book sites.
    // They are shipped as-is, not bundled, so linting them is noise.
    "assets/**",
    "content/books-static/**",
    "public/**",
    // Stale Jekyll build output that may exist locally.
    "_site/**",
    ".claude/**",
  ]),
  {
    // This site is a byte-compatible port of the Jekyll output: pages are
    // fully static, internal navigation is plain `<a>` (the vendored page
    // scripts initialise on full page loads, not client-side transitions),
    // images are served as-is (`images.unoptimized`), and main.css is a
    // hand-maintained stylesheet linked exactly as Jekyll did. The Next
    // heuristics below assume the opposite, so they only produce noise here.
    rules: {
      "@next/next/no-html-link-for-pages": "off",
      "@next/next/no-img-element": "off",
      "@next/next/no-css-tags": "off",
    },
  },
]);

export default eslintConfig;
