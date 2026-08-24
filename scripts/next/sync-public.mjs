// Syncs static Jekyll-era directories into public/ so Next.js serves them
// verbatim. The originals at the repo root stay the source of truth (the
// translation / OG-image / analytics scripts keep writing there).
import { cpSync, mkdirSync, rmSync, existsSync, copyFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const pub = join(root, "public");

const DIRS = ["assets", "css", "docs"];
const FILES = [
  "favicon.ico",
  "CNAME",
  "robots.txt",
  "sitemap-media.xml", // maintained by hand (Jekyll keep_files); served as-is
  "openapi.json",
  "jwks.json",
  "openid-configuration.json",
  "oauth-noop.json",
  "api-catalog.json",
];

rmSync(pub, { recursive: true, force: true });
mkdirSync(pub, { recursive: true });

for (const dir of DIRS) {
  const src = join(root, dir);
  if (existsSync(src)) cpSync(src, join(pub, dir), { recursive: true });
}
for (const file of FILES) {
  const src = join(root, file);
  if (existsSync(src)) copyFileSync(src, join(pub, file));
}

console.log("public/ synced from repo root");
