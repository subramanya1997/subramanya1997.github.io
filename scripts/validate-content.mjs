#!/usr/bin/env node
// Content validation — Node port of the retired scripts/validate_content.rb.
//
// Same checks, adapted to the Next.js layout in two places:
//   * the /api/v1/ endpoints documented in openapi.json are now implemented by
//     app/api/v1/<name>/route.ts routes, not Liquid templates;
//   * llms.txt is generated at build time by lib/nonhtml.ts, so its guidance
//     sections are validated against out/llms.txt when a build exists and
//     against the lib/nonhtml.ts source otherwise.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT_DIR = path.join(ROOT, "content");
const POSTS_DIR = path.join(CONTENT_DIR, "posts");
const BOOKS_DIR = path.join(CONTENT_DIR, "books");
const LOOPS_DIR = path.join(CONTENT_DIR, "loops");
const DATA_DIR = path.join(CONTENT_DIR, "data");
// Page sources colocated with their app/ route (see lib/page-sources.mjs).
const TOP_LEVEL_PAGES = [
  "app/content.html",
  "app/blog/content.md",
  "app/books/content.md",
  "app/work/content.md",
  "app/stats/content.md",
];
const NOT_FOUND_PAGE = "app/not-found.content.html";
const FRONT_MATTER_PATTERN = /^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;

const errors = [];
const addError = (message) => errors.push(message);
const relativePath = (p) => path.relative(ROOT, p).split(path.sep).join("/");

function present(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length !== 0;
  if (Array.isArray(value)) return value.length !== 0;
  if (value instanceof Date) return true;
  if (typeof value === "object") return Object.keys(value).length !== 0;
  return true;
}

const isNumeric = (value) => typeof value === "number" && Number.isFinite(value);

const isMapping = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date);

function parseFrontMatter(file) {
  const content = fs.readFileSync(file, "utf8");
  const match = content.match(FRONT_MATTER_PATTERN);
  if (!match) throw new Error(`${relativePath(file)}: missing or malformed front matter`);

  let frontMatter;
  try {
    frontMatter = yaml.load(match[1]);
  } catch (e) {
    throw new Error(`${relativePath(file)}: invalid YAML front matter (${e.message})`);
  }
  if (!isMapping(frontMatter)) throw new Error(`${relativePath(file)}: front matter must be a mapping`);

  return [frontMatter, content.slice(match.index + match[0].length)];
}

function loadYaml(file) {
  try {
    return yaml.load(fs.readFileSync(file, "utf8"));
  } catch (e) {
    throw new Error(`${relativePath(file)}: invalid YAML (${e.message})`);
  }
}

function markdownFiles(dir) {
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".md"))
    .sort()
    .map((name) => path.join(dir, name));
}

function validateFrontMatter(file, requiredKeys) {
  try {
    const [frontMatter] = parseFrontMatter(file);
    const missing = requiredKeys.filter((key) => !(key in frontMatter && present(frontMatter[key])));
    if (missing.length !== 0)
      addError(`${relativePath(file)}: missing required front matter keys: ${missing.join(", ")}`);
  } catch (e) {
    addError(e.message);
  }
}

function validatePosts() {
  for (const file of markdownFiles(POSTS_DIR)) {
    if (relativePath(file) === "content/posts/readme.md") continue;
    validateFrontMatter(file, ["layout", "title", "excerpt", "date", "tags"]);
  }
}

function validateBooks() {
  for (const file of markdownFiles(BOOKS_DIR)) {
    validateFrontMatter(file, ["title", "excerpt", "date", "tags", "web_url"]);
  }
}

function validateLoops() {
  for (const file of markdownFiles(LOOPS_DIR)) {
    validateFrontMatter(file, ["layout", "title", "excerpt"]);
    validateLoopBody(file);
    validateLoopLinks(file);
  }
}

function validateLoopBody(file) {
  try {
    const [, body] = parseFrontMatter(file);
    if (!present(body))
      addError(`${relativePath(file)}: loop body must contain the prompt or operating instructions`);
  } catch (e) {
    addError(e.message);
  }
}

function validateLoopLinks(file) {
  try {
    const [frontMatter] = parseFrontMatter(file);
    const links = frontMatter.links;
    if (links === undefined || links === null) return;

    if (!Array.isArray(links)) {
      addError(`${relativePath(file)}: links must be an array`);
      return;
    }

    links.forEach((link, index) => {
      if (!isMapping(link)) {
        addError(`${relativePath(file)}: links[${index}] must be a mapping`);
        return;
      }
      if (!present(link.url)) addError(`${relativePath(file)}: links[${index}] missing url`);
    });
  } catch (e) {
    addError(e.message);
  }
}

function validateAboutData() {
  const file = path.join(DATA_DIR, "about.yaml");
  try {
    const data = loadYaml(file);
    if (!isMapping(data)) {
      addError(`${relativePath(file)}: expected a mapping`);
      return;
    }
    for (const key of ["bio", "experience", "education"]) {
      if (!(key in data && present(data[key]))) addError(`${relativePath(file)}: missing required key ${key}`);
    }
  } catch (e) {
    addError(e.message);
  }
}

function validateViewCountData() {
  const file = path.join(DATA_DIR, "view_count.json");
  let data;
  try {
    data = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (e) {
    addError(`${relativePath(file)}: invalid JSON (${e.message})`);
    return;
  }

  try {
    if (!isMapping(data)) {
      addError(`${relativePath(file)}: expected a JSON object`);
      return;
    }

    if (!present(data.last_updated)) addError(`${relativePath(file)}: missing required key last_updated`);

    const viewCounts = data.view_counts;
    if (!Array.isArray(viewCounts)) {
      addError(`${relativePath(file)}: view_counts must be an array`);
      return;
    }

    viewCounts.forEach((entry, index) => {
      if (!isMapping(entry)) {
        addError(`${relativePath(file)}: view_counts[${index}] must be an object`);
        return;
      }
      for (const key of ["url", "views", "avg_duration_seconds", "engagement_rate"]) {
        if (!(key in entry)) addError(`${relativePath(file)}: view_counts[${index}] missing ${key}`);
      }
      if (typeof entry.url !== "string") addError(`${relativePath(file)}: view_counts[${index}].url must be a string`);
      if (!isNumeric(entry.views)) addError(`${relativePath(file)}: view_counts[${index}].views must be numeric`);
      if (!isNumeric(entry.avg_duration_seconds))
        addError(`${relativePath(file)}: view_counts[${index}].avg_duration_seconds must be numeric`);
      if (!isNumeric(entry.engagement_rate))
        addError(`${relativePath(file)}: view_counts[${index}].engagement_rate must be numeric`);
    });
  } catch (e) {
    addError(e.message);
  }
}

function validateTopLevelPageAssetGuard() {
  for (const relative of TOP_LEVEL_PAGES) {
    try {
      const [, body] = parseFrontMatter(path.join(ROOT, relative));
      if (/<style\b/i.test(body)) addError(`${relative}: inline <style> blocks are not allowed`);
      if (/<script\b(?![^>]*\bsrc=)/i.test(body)) addError(`${relative}: inline <script> blocks are not allowed`);
    } catch (e) {
      addError(e.message);
    }
  }
}

// The OpenAPI spec is a plain static file (no front matter), so it must parse
// as JSON straight from the repo and satisfy the invariants agents rely on:
// unique operationIds and a description + responses on every operation.
function validateOpenapiSpec() {
  let spec;
  try {
    spec = JSON.parse(fs.readFileSync(path.join(ROOT, "openapi.json"), "utf8"));
  } catch (e) {
    addError(`openapi.json: invalid JSON (${e.message})`);
    return;
  }

  try {
    if (!String(spec.openapi ?? "").startsWith("3.")) addError("openapi.json: openapi version must be 3.x");
    if (!present(spec.info?.title)) addError("openapi.json: missing info.title");
    if (!present(spec.info?.contact?.url)) addError("openapi.json: missing info.contact.url");
    const servers = Array.isArray(spec.servers) ? spec.servers : [];
    if (!servers.some((s) => s?.url === "https://subramanya.ai"))
      addError("openapi.json: servers must include https://subramanya.ai");

    const operationIds = [];
    const paths = isMapping(spec.paths) ? spec.paths : {};
    for (const [apiPath, methods] of Object.entries(paths)) {
      if (!isMapping(methods)) continue;
      for (const [verb, op] of Object.entries(methods)) {
        if (!["get", "post", "put", "patch", "delete"].includes(verb)) continue;
        const label = `openapi.json: ${verb.toUpperCase()} ${apiPath}`;
        if (!present(op?.operationId)) addError(`${label}: missing operationId`);
        if (!present(op?.description)) addError(`${label}: missing description`);
        if (!isMapping(op?.responses) || Object.keys(op.responses).length === 0)
          addError(`${label}: missing responses`);
        operationIds.push(op?.operationId);
      }
    }

    const counts = new Map();
    for (const id of operationIds) counts.set(id, (counts.get(id) ?? 0) + 1);
    const duplicates = [...counts.entries()].filter(([, n]) => n > 1).map(([id]) => id);
    if (duplicates.length !== 0) addError(`openapi.json: duplicate operationIds: ${duplicates.join(", ")}`);

    // Every /api/v1/ path in the spec must have a matching Next.js route
    // (app/api/v1/<name>/route.ts renders it from lib/nonhtml.ts).
    const apiPaths = Object.keys(paths).filter((p) => p.startsWith("/api/v1/"));
    for (const apiPath of apiPaths) {
      const route = path.join(ROOT, "app", apiPath.replace(/^\//, ""), "route.ts");
      if (!fs.existsSync(route))
        addError(`openapi.json: ${apiPath} documented but ${relativePath(route)} route is missing`);
    }
    if (apiPaths.length === 0) addError("openapi.json: must document the versioned /api/v1/ surface");
  } catch (e) {
    addError(`openapi.json: ${e.message}`);
  }
}

// Trust anchor pages (/contact/, /privacy/) must exist with substantial bodies;
// agents check these to verify the site is legitimate.
function validateTrustPages() {
  const pages = {
    "app/contact/content.md": "/contact/",
    "app/privacy/content.md": "/privacy/",
  };
  for (const [relative, expectedPermalink] of Object.entries(pages)) {
    const file = path.join(ROOT, relative);
    if (!fs.existsSync(file)) {
      addError(`${relative}: trust anchor page is missing`);
      continue;
    }
    try {
      const [frontMatter, body] = parseFrontMatter(file);
      if (frontMatter.permalink !== expectedPermalink)
        addError(`${relative}: permalink must be ${expectedPermalink}`);
      if (!present(frontMatter.title)) addError(`${relative}: missing title`);
      const length = body.trim().length;
      if (length < 500) addError(`${relative}: body must be at least 500 characters (currently ${length})`);
    } catch (e) {
      addError(e.message);
    }
  }
}

// llms.txt must keep the agent-guidance sections that tell agents when and how
// to use the site, and must point at the developer resources. It is generated
// by lib/nonhtml.ts, so check the built file when out/ exists, else the source.
function validateLlmsTxt() {
  const built = path.join(ROOT, "out", "llms.txt");
  const source = path.join(ROOT, "lib", "nonhtml.ts");
  const target = fs.existsSync(built) ? built : source;
  try {
    const content = fs.readFileSync(target, "utf8");
    const label = relativePath(target);

    if (!content.includes("## When to use this site"))
      addError(`${label}: missing '## When to use this site' section`);
    if (!content.includes("## Developer Resources"))
      addError(`${label}: missing '## Developer Resources' section`);
    if (!content.includes("/openapi.json")) addError(`${label}: must reference /openapi.json`);
    if (!content.includes("/docs/api-deprecation-policy/"))
      addError(`${label}: must reference the API deprecation policy`);

    if (!fs.existsSync(path.join(ROOT, "docs", "api-deprecation-policy.md")))
      addError("docs/api-deprecation-policy.md: deprecation policy page is missing");
  } catch (e) {
    addError(`llms.txt: ${e.message}`);
  }
}

// The 404 page must give agents recovery pointers (llms.txt, sitemap, search
// index) so a dead link is not a dead end.
function validate404RecoveryLinks() {
  try {
    const content = fs.readFileSync(path.join(ROOT, NOT_FOUND_PAGE), "utf8");
    for (const href of ["/llms.txt", "/sitemap.xml", "/search.json", "/openapi.json"]) {
      if (!content.includes(href)) addError(`${NOT_FOUND_PAGE}: missing recovery link to ${href}`);
    }
  } catch (e) {
    addError(`${NOT_FOUND_PAGE}: ${e.message}`);
  }
}

// The RFC 9727 api-catalog must advertise the OpenAPI service description.
function validateApiCatalog() {
  try {
    const content = fs.readFileSync(path.join(ROOT, "api-catalog.json"), "utf8");
    if (!content.includes("/openapi.json"))
      addError("api-catalog.json: missing service-desc link to /openapi.json");
  } catch (e) {
    addError(`api-catalog.json: ${e.message}`);
  }
}

validatePosts();
validateBooks();
validateLoops();
validateAboutData();
validateViewCountData();
validateTopLevelPageAssetGuard();
validateOpenapiSpec();
validateTrustPages();
validateLlmsTxt();
validate404RecoveryLinks();
validateApiCatalog();

if (errors.length === 0) {
  console.log("Content validation passed.");
  process.exit(0);
}

console.error("Content validation failed:");
for (const error of errors) console.error(`- ${error}`);
process.exit(1);
