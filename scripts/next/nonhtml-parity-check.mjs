// Parity report for every non-HTML surface: compares what the Next.js build
// produces against the Jekyll build in _site/.
//
//   node scripts/next/nonhtml-parity-check.mjs            # diff out/ vs _site/
//   node scripts/next/nonhtml-parity-check.mjs --emit     # render surfaces first
//
// With --emit (or when out/ is missing the endpoints because the HTML routes of
// another workstream do not compile yet) the endpoints are rendered straight
// from lib/nonhtml.ts via `bun scripts/next/emit-nonhtml.ts`, and the markdown
// twins from scripts/next/markdown-twins.mjs.
//
// Exit code is 1 when a structural difference is found. Content differences
// that come from the markdown renderer (smart quotes, whitespace) are reported
// but do not fail the run — markdown parity is a separate workstream.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { writeTwins } from "./markdown-twins.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const SITE = path.join(ROOT, "_site");
const ENDPOINTS = [
  "feed.xml",
  "search.json",
  "sitemap.xml",
  "sitemapindex.xml",
  "llms.txt",
  "llms-full.txt",
  "api/v1/posts.json",
  "api/v1/books.json",
  "api/v1/tags.json",
  "api/v1/site.json",
];

let failures = 0;
let warnings = 0;

function fail(message) {
  failures += 1;
  console.log(`  FAIL ${message}`);
}

function warn(message) {
  warnings += 1;
  console.log(`  WARN ${message}`);
}

function pass(message) {
  console.log(`  ok   ${message}`);
}

function readIfExists(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
}

// ---------------------------------------------------------------------------
// where to read the Next output from
// ---------------------------------------------------------------------------

function resolveBuildDir() {
  const out = path.join(ROOT, "out");
  const wantEmit = process.argv.includes("--emit");
  const complete =
    fs.existsSync(out) && ENDPOINTS.every((name) => fs.existsSync(path.join(out, name)));
  if (!wantEmit && complete) return { dir: out, emitted: false };

  const target = fs.mkdtempSync(path.join(os.tmpdir(), "nonhtml-parity-"));
  execFileSync("bun", [path.join("scripts", "next", "emit-nonhtml.ts"), target], {
    cwd: ROOT,
    stdio: "pipe",
  });
  writeTwins(target);
  return { dir: target, emitted: true };
}

// ---------------------------------------------------------------------------
// comparisons
// ---------------------------------------------------------------------------

function compareJsonKeys(name, mine, theirs) {
  const keysOf = (value) => {
    if (Array.isArray(value)) return new Set(value.flatMap((item) => [...keysOf(item)]));
    if (value && typeof value === "object") {
      return new Set(
        Object.entries(value).flatMap(([key, nested]) => [
          key,
          ...[...keysOf(nested)].map((child) => `${key}.${child}`),
        ])
      );
    }
    return new Set();
  };
  const a = keysOf(mine);
  const b = keysOf(theirs);
  const missing = [...b].filter((key) => !a.has(key));
  const extra = [...a].filter((key) => !b.has(key));
  if (missing.length) fail(`${name}: keys missing vs _site: ${missing.join(", ")}`);
  if (extra.length) fail(`${name}: keys not in _site: ${extra.join(", ")}`);
  if (!missing.length && !extra.length) pass(`${name}: JSON key set matches`);
}

function urlsOf(items) {
  return new Set(items.map((item) => item.url));
}

function compareUrlSet(name, mine, theirs) {
  const onlyMine = [...mine].filter((url) => !theirs.has(url));
  const onlyTheirs = [...theirs].filter((url) => !mine.has(url));
  if (onlyMine.length) fail(`${name}: ${onlyMine.length} URL(s) not in _site, e.g. ${onlyMine[0]}`);
  if (onlyTheirs.length)
    fail(`${name}: ${onlyTheirs.length} URL(s) missing vs _site, e.g. ${onlyTheirs[0]}`);
  if (!onlyMine.length && !onlyTheirs.length)
    pass(`${name}: ${mine.size} URLs match _site exactly`);
}

function elementCounts(xml) {
  const counts = {};
  for (const match of xml.matchAll(/<([a-z][\w:.-]*)(\s|>|\/)/gi)) {
    counts[match[1]] = (counts[match[1]] ?? 0) + 1;
  }
  return counts;
}

function compareElementCounts(name, mine, theirs) {
  const a = elementCounts(mine);
  const b = elementCounts(theirs);
  const tags = new Set([...Object.keys(a), ...Object.keys(b)]);
  const differences = [...tags]
    .filter((tag) => (a[tag] ?? 0) !== (b[tag] ?? 0))
    .map((tag) => `${tag} ${a[tag] ?? 0} vs ${b[tag] ?? 0}`);
  if (differences.length) fail(`${name}: element counts differ — ${differences.join("; ")}`);
  else pass(`${name}: element counts match (${Object.keys(a).length} distinct elements)`);
}

function checkFeed(build) {
  const mine = readIfExists(path.join(build, "feed.xml"));
  const theirs = readIfExists(path.join(SITE, "feed.xml"));
  if (!mine || !theirs) return fail("feed.xml: missing from one of the builds");
  compareElementCounts("feed.xml", mine, theirs);
  const links = (xml) => new Set([...xml.matchAll(/<link>([^<]+)<\/link>/g)].map((m) => m[1]));
  compareUrlSet("feed.xml items", links(mine), links(theirs));
}

function checkSitemaps(build) {
  for (const name of ["sitemap.xml", "sitemapindex.xml"]) {
    const mine = readIfExists(path.join(build, name));
    const theirs = readIfExists(path.join(SITE, name));
    if (!mine || !theirs) {
      fail(`${name}: missing from one of the builds`);
      continue;
    }
    compareElementCounts(name, mine, theirs);
    const locs = (xml) => new Set([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
    compareUrlSet(name, locs(mine), locs(theirs));
  }
}

function checkSearch(build) {
  const mine = readIfExists(path.join(build, "search.json"));
  const theirs = readIfExists(path.join(SITE, "search.json"));
  if (!mine || !theirs) return fail("search.json: missing from one of the builds");
  const a = JSON.parse(mine);
  const b = JSON.parse(theirs);
  if (a.length !== b.length) fail(`search.json: ${a.length} items vs ${b.length} in _site`);
  else pass(`search.json: ${a.length} items`);
  compareJsonKeys("search.json", a, b);
  compareUrlSet("search.json", urlsOf(a), urlsOf(b));

  const theirsByUrl = new Map(b.map((item) => [item.url, item]));
  const drift = {};
  for (const item of a) {
    const other = theirsByUrl.get(item.url);
    if (!other) continue;
    for (const key of Object.keys(item)) {
      if (JSON.stringify(item[key]) !== JSON.stringify(other[key])) {
        drift[key] = (drift[key] ?? 0) + 1;
      }
    }
  }
  for (const [key, count] of Object.entries(drift)) {
    // `content` and `reading_minutes` are derived from rendered HTML, so they
    // move with lib/markdown.ts rather than with this workstream.
    if (key === "content" || key === "reading_minutes") warn(`search.json: ${key} differs on ${count} item(s) (markdown renderer)`);
    else fail(`search.json: ${key} differs on ${count} item(s)`);
  }
}

function checkApi(build) {
  for (const name of ENDPOINTS.filter((endpoint) => endpoint.startsWith("api/"))) {
    const mine = readIfExists(path.join(build, name));
    const theirs = readIfExists(path.join(SITE, name));
    if (!mine || !theirs) {
      fail(`${name}: missing from one of the builds`);
      continue;
    }
    const a = JSON.parse(mine);
    const b = JSON.parse(theirs);
    compareJsonKeys(name, a, b);
    if (JSON.stringify(a) === JSON.stringify(b)) pass(`${name}: payload identical to _site`);
    else {
      const list = ["posts", "books", "tags"].find((key) => Array.isArray(a[key]));
      if (list && a.count !== b.count) fail(`${name}: count ${a.count} vs ${b.count}`);
      else warn(`${name}: same shape, different values`);
    }
  }
}

function checkLlms(build) {
  for (const name of ["llms.txt", "llms-full.txt"]) {
    const mine = readIfExists(path.join(build, name));
    const theirs = readIfExists(path.join(SITE, name));
    if (!mine || !theirs) {
      fail(`${name}: missing from one of the builds`);
      continue;
    }
    const meaningful = (text) => text.split("\n").map((line) => line.trim()).filter(Boolean);
    const a = meaningful(mine);
    const b = meaningful(theirs);
    if (name === "llms.txt") {
      const missing = b.filter((line) => !a.includes(line));
      const extra = a.filter((line) => !b.includes(line));
      if (missing.length) fail(`${name}: ${missing.length} line(s) missing, e.g. ${missing[0].slice(0, 80)}`);
      if (extra.length) fail(`${name}: ${extra.length} extra line(s), e.g. ${extra[0].slice(0, 80)}`);
      if (!missing.length && !extra.length) pass(`${name}: all ${a.length} lines match`);
    } else {
      const headings = (lines) => lines.filter((line) => line.startsWith("## ") || line.startsWith("URL: "));
      const ha = headings(a);
      const hb = headings(b);
      if (JSON.stringify(ha) !== JSON.stringify(hb))
        fail(`${name}: post headings/URLs differ (${ha.length} vs ${hb.length})`);
      else pass(`${name}: ${ha.length / 2} posts, headings and URLs match`);
    }
  }
}

function checkTwins(build) {
  const list = (dir) => {
    const found = [];
    const walk = (current) => {
      for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
        const full = path.join(current, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (entry.name === "index.md") found.push(path.relative(dir, full));
      }
    };
    if (fs.existsSync(dir)) walk(dir);
    return found.sort();
  };
  const mine = list(build);
  const theirs = list(SITE);
  const mineSet = new Set(mine);
  const theirsSet = new Set(theirs);
  const missing = theirs.filter((file) => !mineSet.has(file));
  const extra = mine.filter((file) => !theirsSet.has(file));
  if (missing.length) fail(`markdown twins: ${missing.length} missing, e.g. ${missing[0]}`);
  if (extra.length) fail(`markdown twins: ${extra.length} extra, e.g. ${extra[0]}`);
  if (!missing.length && !extra.length) pass(`markdown twins: ${mine.length} files, same set as _site`);

  let identical = 0;
  const different = [];
  for (const file of theirs) {
    if (!mineSet.has(file)) continue;
    if (fs.readFileSync(path.join(build, file), "utf8") === fs.readFileSync(path.join(SITE, file), "utf8"))
      identical += 1;
    else different.push(file);
  }
  if (different.length) fail(`markdown twins: ${different.length} differ byte-for-byte, e.g. ${different[0]}`);
  else pass(`markdown twins: all ${identical} files byte-identical`);
}

// ---------------------------------------------------------------------------

const { dir, emitted } = resolveBuildDir();
console.log(`non-HTML parity report`);
console.log(`  next output: ${dir}${emitted ? " (rendered on demand)" : ""}`);
console.log(`  jekyll:      ${SITE}\n`);

console.log("feed");
checkFeed(dir);
console.log("sitemaps");
checkSitemaps(dir);
console.log("search index");
checkSearch(dir);
console.log("api/v1");
checkApi(dir);
console.log("llms");
checkLlms(dir);
console.log("markdown twins");
checkTwins(dir);

console.log(`\n${failures} failure(s), ${warnings} warning(s)`);
process.exit(failures > 0 ? 1 : 0);
