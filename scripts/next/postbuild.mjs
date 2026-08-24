// Post-build fixups that replicate Jekyll plugin behavior in out/:
// 1. Extensionless copies of the well-known JSON files (_plugins/api_catalog_alias.rb).
// 2. Markdown twins next to every HTML page (_plugins/markdown_twin_generator.rb).
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { writeTwins } from "./markdown-twins.mjs";

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

console.log("postbuild: well-known aliases emitted");
console.log(`postbuild: ${writeTwins(out)} markdown twins emitted`);
