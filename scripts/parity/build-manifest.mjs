#!/usr/bin/env node
// URL-parity manifest builder.
//
// Walks a static build directory and records every URL the site serves, plus
// the SEO-critical fields of each HTML page. The resulting manifest is the
// baseline that a Next.js `out/` build must match.
//
// Usage:
//   node scripts/parity/build-manifest.mjs [buildDir] [options]
//
// Options:
//   --out <file>        Output path (default: scripts/parity/manifest.json)
//   --timestamp <str>   Value stored as meta.timestamp. Omit to store null.
//                       (Deliberately never Date.now() -- manifests must be
//                       byte-reproducible so diffs stay meaningful.)
//   --source <str>      Free-text note about how the build dir was produced.
//   --include-ignored   Do not apply the default ignore list.
//   --stdout            Print the manifest instead of writing a file.
//
// No dependencies: node built-ins only.

import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, relative, sep, extname, dirname, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "..", "..");

// Paths (relative to the build dir, POSIX-style) that are build artifacts of
// the parity tooling itself rather than site content. `_config.yml` has no
// `exclude:` key, so Jekyll copies the whole `scripts/` tree -- including this
// directory and any manifest.json written into it -- straight into `_site/`.
// Those would otherwise show up as "extra" URLs in every Next.js diff.
const DEFAULT_IGNORE = [
  "scripts/parity/",
  ".git/",
  ".DS_Store",
];

const CONTENT_TYPES = {
  ".html": "text/html",
  ".htm": "text/html",
  ".md": "text/markdown",
  ".json": "application/json",
  ".xml": "application/xml",
  ".txt": "text/plain",
  ".css": "text/css",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".map": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".pdf": "application/pdf",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".webmanifest": "application/manifest+json",
  ".py": "text/x-python",
  ".rb": "text/x-ruby",
  ".log": "text/plain",
  ".yml": "text/yaml",
  ".yaml": "text/yaml",
};

// ---------------------------------------------------------------------------
// tiny HTML field extraction
// ---------------------------------------------------------------------------

function decodeEntities(s) {
  if (s == null) return s;
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

function normalizeWhitespace(s) {
  return s == null ? s : s.replace(/\s+/g, " ").trim();
}

// Pull the value of `attr` out of a single tag's attribute soup.
function attrValue(tagSource, attr) {
  const re = new RegExp(`\\b${attr}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s"'>]+))`, "i");
  const m = tagSource.match(re);
  if (!m) return null;
  return decodeEntities(m[2] ?? m[3] ?? m[4] ?? "");
}

// All <meta> tags, as raw tag strings.
function eachTag(html, tagName) {
  const re = new RegExp(`<${tagName}\\b[^>]*>`, "gi");
  return html.match(re) || [];
}

function metaContent(html, { name, property }) {
  for (const tag of eachTag(html, "meta")) {
    if (name != null) {
      const n = attrValue(tag, "name");
      if (n && n.toLowerCase() === name.toLowerCase()) return attrValue(tag, "content");
    }
    if (property != null) {
      const p = attrValue(tag, "property");
      if (p && p.toLowerCase() === property.toLowerCase()) return attrValue(tag, "content");
    }
  }
  return null;
}

function linkHref(html, rel) {
  for (const tag of eachTag(html, "link")) {
    const r = attrValue(tag, "rel");
    if (r && r.toLowerCase().split(/\s+/).includes(rel)) return attrValue(tag, "href");
  }
  return null;
}

// Every @type found anywhere inside the JSON-LD blocks, deduped and sorted.
// Nested graphs (@graph, arrays, nested objects) all count -- migrations tend
// to lose the nested BreadcrumbList / Person nodes first.
function jsonLdTypes(html) {
  const types = new Set();
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const type = attrValue(`<script ${m[1]}>`, "type");
    if (!type || !/ld\+json/i.test(type)) continue;
    let data;
    try {
      data = JSON.parse(decodeEntities(m[2]).trim());
    } catch {
      types.add("<unparseable>");
      continue;
    }
    collectTypes(data, types);
  }
  return [...types].sort();
}

function collectTypes(node, out) {
  if (Array.isArray(node)) {
    for (const item of node) collectTypes(item, out);
    return;
  }
  if (!node || typeof node !== "object") return;
  const t = node["@type"];
  if (typeof t === "string") out.add(t);
  else if (Array.isArray(t)) for (const x of t) if (typeof x === "string") out.add(x);
  for (const [k, v] of Object.entries(node)) {
    if (k === "@type") continue;
    if (v && typeof v === "object") collectTypes(v, out);
  }
}

// h2/h3 ids in document order. These back every in-page anchor link, both
// from the site's own TOC and from external inbound links.
function headingIds(html) {
  const ids = [];
  const re = /<h([23])\b([^>]*)>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const id = attrValue(`<h${m[1]} ${m[2]}>`, "id");
    if (id) ids.push(id);
  }
  return ids;
}

function analyzeHtml(html) {
  const titleMatch = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  return {
    title: titleMatch ? normalizeWhitespace(decodeEntities(titleMatch[1])) : null,
    canonical: linkHref(html, "canonical"),
    description: normalizeWhitespace(metaContent(html, { name: "description" })),
    ogImage: metaContent(html, { property: "og:image" }),
    ogUrl: metaContent(html, { property: "og:url" }),
    robots: metaContent(html, { name: "robots" }),
    jsonLdTypes: jsonLdTypes(html),
    h1Count: (html.match(/<h1\b[^>]*>/gi) || []).length,
    headingIds: headingIds(html),
  };
}

// ---------------------------------------------------------------------------
// walking + URL normalization
// ---------------------------------------------------------------------------

function walk(dir, base = dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
    a.name < b.name ? -1 : a.name > b.name ? 1 : 0
  )) {
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) walk(abs, base, acc);
    else if (entry.isFile()) acc.push(relative(base, abs).split(sep).join("/"));
  }
  return acc;
}

// `about/index.html` -> `/about/`; root `index.html` -> `/`; everything else
// keeps its literal path (404.html stays /404.html, index.md twins stay
// /about/index.md -- they are fetched by that exact URL by agents).
export function toUrl(relPath) {
  if (relPath === "index.html") return "/";
  if (relPath.endsWith("/index.html")) return "/" + relPath.slice(0, -"index.html".length);
  return "/" + relPath;
}

function guessContentType(relPath, buf) {
  const ext = extname(relPath).toLowerCase();
  if (CONTENT_TYPES[ext]) return CONTENT_TYPES[ext];
  if (ext === "") {
    // Extensionless well-known URIs (RFC 9727 api-catalog, OIDC discovery,
    // oauth-noop) are JSON on disk with no extension.
    const head = buf.subarray(0, 64).toString("utf8").trimStart();
    if (head.startsWith("{") || head.startsWith("[")) return "application/json";
  }
  return "application/octet-stream";
}

function jsonTopLevelKeys(buf) {
  try {
    const data = JSON.parse(buf.toString("utf8"));
    if (Array.isArray(data)) return { jsonShape: "array", jsonLength: data.length, jsonKeys: null };
    if (data && typeof data === "object")
      return { jsonShape: "object", jsonLength: null, jsonKeys: Object.keys(data).sort() };
    return { jsonShape: typeof data, jsonLength: null, jsonKeys: null };
  } catch {
    return { jsonShape: "<unparseable>", jsonLength: null, jsonKeys: null };
  }
}

function isIgnored(relPath, ignore) {
  return ignore.some((p) => (p.endsWith("/") ? relPath.startsWith(p) : relPath === p || relPath.endsWith("/" + p)));
}

// ---------------------------------------------------------------------------
// manifest
// ---------------------------------------------------------------------------

export function buildManifest(buildDir, opts = {}) {
  const { timestamp = null, source = null, ignore = DEFAULT_IGNORE } = opts;
  const root = resolve(buildDir);
  const files = walk(root).filter((f) => !isIgnored(f, ignore));

  const pages = {};
  const assets = {};

  for (const relPath of files) {
    const abs = join(root, relPath);
    const buf = readFileSync(abs);
    const url = toUrl(relPath);
    const contentType = guessContentType(relPath, buf);

    if (contentType === "text/html") {
      pages[url] = { file: relPath, bytes: buf.length, ...analyzeHtml(buf.toString("utf8")) };
    } else {
      const record = {
        file: relPath,
        contentType,
        bytes: buf.length,
        sha256: createHash("sha256").update(buf).digest("hex").slice(0, 16),
      };
      if (contentType === "application/json" || contentType === "application/manifest+json") {
        Object.assign(record, jsonTopLevelKeys(buf));
      }
      assets[url] = record;
    }
  }

  const urls = [...Object.keys(pages), ...Object.keys(assets)].sort();

  return {
    meta: {
      buildDir: relative(REPO_ROOT, root) || ".",
      buildSource: source,
      gitCommit: gitInfo("rev-parse HEAD"),
      gitBranch: gitInfo("rev-parse --abbrev-ref HEAD"),
      gitDirty: gitInfo("status --porcelain") ? true : false,
      timestamp,
      generator: "scripts/parity/build-manifest.mjs",
      manifestVersion: 1,
      ignored: ignore,
      counts: {
        urls: urls.length,
        htmlPages: Object.keys(pages).length,
        nonHtmlFiles: Object.keys(assets).length,
      },
    },
    urls,
    pages: sortKeys(pages),
    assets: sortKeys(assets),
  };
}

function sortKeys(obj) {
  return Object.fromEntries(Object.keys(obj).sort().map((k) => [k, obj[k]]));
}

function gitInfo(args) {
  try {
    return execFileSync("git", args.split(" "), { cwd: REPO_ROOT, encoding: "utf8" }).trim() || null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const out = { positional: [], flags: {} };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const [k, inlineV] = a.slice(2).split(/=(.*)/s);
      if (inlineV !== undefined) out.flags[k] = inlineV;
      else if (argv[i + 1] && !argv[i + 1].startsWith("--")) out.flags[k] = argv[++i];
      else out.flags[k] = true;
    } else out.positional.push(a);
  }
  return out;
}

function main() {
  const { positional, flags } = parseArgs(process.argv.slice(2));
  const buildDir = positional[0] || join(REPO_ROOT, "_site");
  try {
    if (!statSync(buildDir).isDirectory()) throw new Error("not a directory");
  } catch {
    console.error(`build-manifest: build directory not found: ${buildDir}`);
    process.exit(2);
  }

  const manifest = buildManifest(buildDir, {
    timestamp: typeof flags.timestamp === "string" ? flags.timestamp : null,
    source: typeof flags.source === "string" ? flags.source : null,
    ignore: flags["include-ignored"] ? [] : DEFAULT_IGNORE,
  });

  const json = JSON.stringify(manifest, null, 2) + "\n";
  if (flags.stdout) {
    process.stdout.write(json);
    return;
  }
  const outPath = typeof flags.out === "string" ? resolve(flags.out) : join(HERE, "manifest.json");
  writeFileSync(outPath, json);
  const c = manifest.meta.counts;
  console.error(
    `build-manifest: ${c.urls} URLs (${c.htmlPages} HTML pages, ${c.nonHtmlFiles} other files) from ${buildDir}`
  );
  console.error(`build-manifest: wrote ${relative(REPO_ROOT, outPath)}`);
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) main();
