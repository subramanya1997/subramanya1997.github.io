// Syncs static Jekyll-era directories into public/ so Next.js serves them
// verbatim. The originals at the repo root stay the source of truth (the
// translation / OG-image / analytics scripts keep writing there).
import { cpSync, mkdirSync, rmSync, existsSync, copyFileSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";
import { writeTwins } from "./markdown-twins.mjs";
import { writeBookRedirects } from "./book-redirects.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const pub = join(root, "public");
const site = yaml.load(readFileSync(join(root, "_config.yml"), "utf8"));
const siteUrl = String(site.url).replace(/\/$/, "");

// NOTE: docs/ is NOT synced — those are markdown sources rendered by the
// app/docs routes; Jekyll never served the raw .md files either.
const DIRS = ["assets", "css"];
const FILES = [
  "favicon.ico",
  "robots.txt",
  "sitemap-media.xml", // maintained by hand (Jekyll keep_files); served as-is
  "openapi.json",
  "auth.md", // agent access walkthrough (workos.com/auth-md convention)
  "schema-map.xml", // NLWeb Schema Feeds map, referenced from robots.txt
];

// Discovery documents whose Jekyll front matter pins them under /.well-known/.
// They carry `{{ site.url }}` placeholders, so front matter is stripped and the
// one Liquid variable they use is substituted here.
const WELL_KNOWN = [
  "jwks.json",
  "openid-configuration.json",
  "oauth-noop.json",
  "api-catalog.json",
  "ai-catalog.json", // Agentic Resource Discovery catalog
];

rmSync(pub, { recursive: true, force: true });
mkdirSync(pub, { recursive: true });

for (const dir of DIRS) {
  const src = join(root, dir);
  if (existsSync(src))
    cpSync(src, join(pub, dir), {
      recursive: true,
      // Jekyll skips dotfiles (.gitkeep etc.); mirror that.
      filter: (p) => !p.split("/").pop().startsWith("."),
    });
}
for (const file of FILES) {
  const src = join(root, file);
  if (existsSync(src)) copyFileSync(src, join(pub, file));
}

// Pre-built book sites (HonKit output vendored in _books_static/<slug>/) are
// served verbatim at /<slug>/ — formerly separate GitHub Pages project sites.
const booksStatic = join(root, "_books_static");
if (existsSync(booksStatic)) {
  for (const entry of readdirSync(booksStatic, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
    cpSync(join(booksStatic, entry.name), join(pub, entry.name), {
      recursive: true,
      filter: (p) => !p.split("/").pop().startsWith("."),
    });
  }
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

// Agent skills index (source: agent-skills.json at the repo root, same
// front-matter + {{ site.url }} conventions as the WELL_KNOWN files). The
// SKILL.md it references is served alongside it, and the index carries the
// file's sha256 digest per the agentskills.io v0.2.0 discovery schema.
{
  const src = join(root, "agent-skills.json");
  if (existsSync(src)) {
    const skillSrc = join(root, "skills", "subramanya-ai-content", "SKILL.md");
    let digest = "";
    if (existsSync(skillSrc)) {
      const skill = readFileSync(skillSrc);
      digest = createHash("sha256").update(skill).digest("hex");
      mkdirSync(join(pub, ".well-known", "agent-skills", "subramanya-ai-content"), {
        recursive: true,
      });
      writeFileSync(
        join(pub, ".well-known", "agent-skills", "subramanya-ai-content", "SKILL.md"),
        skill
      );
    }
    const body = readFileSync(src, "utf8")
      .replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "")
      .replace(/\{\{\s*site\.url\s*\}\}/g, siteUrl)
      .replace(/\{\{\s*skill_digest\s*\}\}/g, digest);
    mkdirSync(join(pub, ".well-known", "agent-skills"), { recursive: true });
    writeFileSync(join(pub, ".well-known", "agent-skills", "index.json"), body);
  }
}

// Extensionless canonical copies (RFC 9727 / RFC 8414 / OIDC discovery paths
// have no file extension) — formerly done post-build; Vercel's standard Next
// deployment only serves what the build itself contains, so they live in
// public/ now. vercel.json sets their Content-Type.
for (const name of ["api-catalog", "openid-configuration", "oauth-noop"]) {
  const src = join(pub, ".well-known", `${name}.json`);
  if (existsSync(src)) copyFileSync(src, join(pub, ".well-known", name));
}

// Markdown twins (an index.md beside every HTML page) and the bare book
// redirect documents are generated purely from the Jekyll sources, so they can
// be emitted pre-build into public/ and ride through the standard build.
console.log(`sync-public: ${writeTwins(pub)} markdown twins emitted`);
console.log(`sync-public: ${writeBookRedirects(pub)} book redirect pages emitted`);

console.log("public/ synced from repo root");
