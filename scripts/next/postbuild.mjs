// Post-build fixups that replicate Jekyll plugin behavior in out/:
// 1. Extensionless copies of the well-known JSON files (_plugins/api_catalog_alias.rb).
// 2. Markdown twins next to every HTML page (_plugins/markdown_twin_generator.rb).
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { writeTwins } from "./markdown-twins.mjs";
import { writeBookRedirects, stampLoopShell } from "./book-redirects.mjs";
import { loops } from "./lib/jekyll-content.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const out = join(root, "out");

// RFC 9727 / RFC 8414 / OIDC discovery paths have no file extension. We ship
// the .json variant (correct Content-Type on GitHub Pages) plus an
// extensionless canonical copy under /.well-known/, exactly as the Jekyll
// plugin did.
const ALIASES = ["api-catalog", "openid-configuration", "oauth-noop"];
mkdirSync(join(out, ".well-known"), { recursive: true });
for (const name of ALIASES) {
  const src = join(out, ".well-known", `${name}.json`);
  if (existsSync(src)) copyFileSync(src, join(out, ".well-known", name));
}

// De-hydrate every page: this site has zero interactive React components —
// all client behavior is the original vanilla JS under /assets/js — so the
// React runtime is pure overhead, and worse: hydration MISMATCHES (the vanilla
// scripts mutate the DOM before React hydrates) make React 19 re-render and
// clobber those mutations (minified error #418 in the console). Stripping the
// runtime makes every page plain static HTML, exactly like the Jekyll build.
// It also keeps the agent-facing 404 under the 100KB budget enforced by
// scripts/validate_api_output.py. If a page ever needs real React
// interactivity, exempt it here instead of removing the pass.
import { readFileSync, writeFileSync, readdirSync, statSync, rmSync, unlinkSync } from "node:fs";

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, files);
    else files.push(p);
  }
  return files;
}

{
  let pages = 0;
  let rscFiles = 0;
  for (const p of walk(out)) {
    if (p.endsWith(".html")) {
      let html = readFileSync(p, "utf8");
      const slimmed = html
        .replace(/<script>\(self\.__next_f[^<]*<\/script>/g, "")
        .replace(/<script>self\.__next_f[^<]*<\/script>/g, "")
        .replace(/<script src="\/_next\/[^"]*"[^>]*><\/script>/g, "")
        .replace(/<link rel="preload" as="script"[^>]*href="\/_next\/[^>]*>/g, "");
      if (slimmed !== html) pages += 1;
      html = slimmed;
      if (p === join(out, "404.html")) {
        // Next hardcodes a duplicate <meta name="robots" content="noindex">
        // on not-found routes; the page's own tag carries "noindex, follow".
        html = html.replace(/<meta name="robots" content="noindex"\/>/g, "");
      }
      writeFileSync(p, html);
    } else if (/(?:^|\/)(?:__next\.[^/]*|index)\.txt$/.test(p)) {
      // RSC payload files only serve client-side navigation, which is gone.
      unlinkSync(p);
      rscFiles += 1;
    }
  }
  rmSync(join(out, "_next"), { recursive: true, force: true });
  // Next artifacts Jekyll never served: GitHub Pages only uses 404.html.
  rmSync(join(out, "404"), { recursive: true, force: true });
  rmSync(join(out, "_not-found"), { recursive: true, force: true });
  console.log(`postbuild: React runtime stripped (${pages} pages de-hydrated, ${rscFiles} RSC payload files removed, _next/ deleted)`);
}

console.log("postbuild: well-known aliases emitted");
console.log(`postbuild: ${writeBookRedirects(out)} book redirect pages emitted`);

// 3. `<body class="loop-shell">` on the loop marketplace and every loop page.
const loopShellUrls = ["/awesome-loops/", ...loops().map((loop) => loop.url)];
console.log(`postbuild: loop-shell body class stamped on ${stampLoopShell(out, loopShellUrls)} pages`);

console.log(`postbuild: ${writeTwins(out)} markdown twins emitted`);
