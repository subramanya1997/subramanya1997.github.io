// Syncs static Jekyll-era directories into public/ so Next.js serves them
// verbatim. The originals at the repo root stay the source of truth (the
// translation / OG-image / analytics scripts keep writing there).
import { cpSync, mkdirSync, rmSync, existsSync, copyFileSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const pub = join(root, "public");
const site = yaml.load(readFileSync(join(root, "_config.yml"), "utf8"));
const siteUrl = String(site.url).replace(/\/$/, "");

const DIRS = ["assets", "css", "docs"];
const FILES = [
  "favicon.ico",
  "CNAME",
  "robots.txt",
  "sitemap-media.xml", // maintained by hand (Jekyll keep_files); served as-is
  "openapi.json",
];

// Discovery documents whose Jekyll front matter pins them under /.well-known/.
// They carry `{{ site.url }}` placeholders, so front matter is stripped and the
// one Liquid variable they use is substituted here.
const WELL_KNOWN = [
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

mkdirSync(join(pub, ".well-known"), { recursive: true });
for (const file of WELL_KNOWN) {
  const src = join(root, file);
  if (!existsSync(src)) continue;
  const raw = readFileSync(src, "utf8");
  const body = raw
    .replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "")
    .replace(/\{\{\s*site\.(\w+)\s*\}\}/g, (match, key) => {
      if (key === "url") return siteUrl;
      const value = site[key];
      return value === undefined ? match : String(value);
    });
  writeFileSync(join(pub, ".well-known", file), body);
}

console.log("public/ synced from repo root");
