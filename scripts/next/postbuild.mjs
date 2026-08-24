// Post-build fixups that replicate Jekyll plugin behavior in out/:
// 1. Extensionless copies of well-known JSON files (see _plugins/api_catalog_alias.rb).
// 2. Placeholder for markdown-twin emission if the twins agent chooses this path.
import { copyFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const out = join(root, "out");

// RFC 9727 / RFC 8414 / OIDC discovery paths have no file extension. We ship
// the .json variant (correct Content-Type on GitHub Pages) plus an
// extensionless canonical copy, exactly as the Jekyll plugin did.
const ALIASES = ["api-catalog", "openid-configuration", "oauth-noop"];
for (const name of ALIASES) {
  const src = join(out, `${name}.json`);
  if (existsSync(src)) copyFileSync(src, join(out, name));
}

console.log("postbuild: well-known aliases emitted");
