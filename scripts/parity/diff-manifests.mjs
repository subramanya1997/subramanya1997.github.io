#!/usr/bin/env node
// URL-parity diff.
//
// Compares a baseline manifest (the Jekyll build) against a candidate
// (the Next.js `out/` build) and fails the run if the migration dropped URLs
// or changed canonical tags.
//
// Usage:
//   node scripts/parity/diff-manifests.mjs <baseline> <candidate> [options]
//
// <baseline> and <candidate> may each be either a manifest .json file or a
// build directory (a directory is manifested on the fly, in memory).
//
// Options:
//   --allow <file>   Allowlist (default: scripts/parity/diff-allow.json if it exists)
//   --json           Emit machine-readable JSON instead of the text report
//   --max <n>        Max items listed per section in the text report (default 40)
//   --strict         Also fail on extra URLs and on non-canonical field drift
//
// Exit codes: 0 = parity holds, 1 = parity broken, 2 = usage/IO error.
//
// No dependencies: node built-ins only.

import { readFileSync, existsSync, statSync } from "node:fs";
import { resolve, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { buildManifest } from "./build-manifest.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "..", "..");

// Fields compared on every HTML page. `canonical` is the only one that is
// fatal by default -- a wrong canonical actively de-indexes a page, whereas a
// reworded description is usually an intentional content change.
const PAGE_FIELDS = [
  "title",
  "canonical",
  "description",
  "ogImage",
  "ogUrl",
  "robots",
  "jsonLdTypes",
  "h1Count",
  "headingIds",
];
const FATAL_FIELDS = new Set(["canonical"]);

// ---------------------------------------------------------------------------
// allowlist
// ---------------------------------------------------------------------------
//
// scripts/parity/diff-allow.json shape (every key optional):
// {
//   "ignoreMissing":  ["/legacy/*"],          // URL globs allowed to disappear
//   "ignoreExtra":    ["/_next/*"],           // URL globs allowed to be new
//   "ignoreFields":   ["ogImage"],            // fields to skip on every page
//   "ignorePageFields": { "/about/": ["title"] },  // per-URL field skips
//   "renames":        { "/old/": "/new/" }    // baseline URL -> candidate URL
// }

function globToRe(glob) {
  const escaped = glob.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".");
  return new RegExp(`^${escaped}$`);
}

function loadAllowlist(explicitPath) {
  const path = explicitPath ? resolve(explicitPath) : resolve(HERE, "diff-allow.json");
  if (!existsSync(path)) {
    if (explicitPath) fail(`allowlist not found: ${path}`);
    return { path: null, ignoreMissing: [], ignoreExtra: [], ignoreFields: new Set(), ignorePageFields: {}, renames: {} };
  }
  let raw;
  try {
    raw = JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    fail(`allowlist is not valid JSON (${path}): ${e.message}`);
  }
  return {
    path,
    ignoreMissing: (raw.ignoreMissing || []).map(globToRe),
    ignoreExtra: (raw.ignoreExtra || []).map(globToRe),
    ignoreFields: new Set(raw.ignoreFields || []),
    ignorePageFields: raw.ignorePageFields || {},
    renames: raw.renames || {},
  };
}

const matchesAny = (url, res) => res.some((re) => re.test(url));

function fieldAllowed(allow, url, field) {
  if (allow.ignoreFields.has(field)) return true;
  const perPage = allow.ignorePageFields[url];
  return Array.isArray(perPage) && (perPage.includes(field) || perPage.includes("*"));
}

// ---------------------------------------------------------------------------
// loading
// ---------------------------------------------------------------------------

function loadManifest(target, label) {
  const path = resolve(target);
  let st;
  try {
    st = statSync(path);
  } catch {
    fail(`${label} not found: ${path}`);
  }
  if (st.isDirectory()) {
    return { manifest: buildManifest(path, { source: `live scan of ${path}` }), origin: `${relative(REPO_ROOT, path) || "."} (scanned)` };
  }
  try {
    return { manifest: JSON.parse(readFileSync(path, "utf8")), origin: relative(REPO_ROOT, path) };
  } catch (e) {
    fail(`${label} is not a readable manifest (${path}): ${e.message}`);
  }
}

// A manifest entry for a URL, whether it lives in pages or assets.
const entryFor = (m, url) => (m.pages && m.pages[url]) || (m.assets && m.assets[url]) || null;
const isPage = (m, url) => Boolean(m.pages && m.pages[url]);

// ---------------------------------------------------------------------------
// diffing
// ---------------------------------------------------------------------------

function sameValue(a, b) {
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every((v, i) => v === b[i]);
  }
  return (a ?? null) === (b ?? null);
}

function diff(baseline, candidate, allow, { strict }) {
  const baseUrls = baseline.urls || [];
  const candSet = new Set(candidate.urls || []);
  const baseSet = new Set(baseUrls);

  const missing = [];
  const extra = [];
  const typeChanged = [];
  const fieldMismatches = [];
  const allowedMissing = [];
  const allowedExtra = [];
  const renamed = [];

  for (const url of baseUrls) {
    const target = allow.renames[url] || url;
    if (!candSet.has(target)) {
      (matchesAny(url, allow.ignoreMissing) ? allowedMissing : missing).push(
        target === url ? url : `${url} -> ${target} (renamed, target absent)`
      );
      continue;
    }
    if (target !== url) renamed.push(`${url} -> ${target}`);

    const b = entryFor(baseline, url);
    const c = entryFor(candidate, target);
    const bIsPage = isPage(baseline, url);
    const cIsPage = isPage(candidate, target);

    if (bIsPage !== cIsPage) {
      typeChanged.push(`${url}: ${bIsPage ? "HTML page" : "file"} -> ${cIsPage ? "HTML page" : "file"}`);
      continue;
    }
    if (!bIsPage) continue; // non-HTML files: presence is the contract

    const fields = [];
    for (const field of PAGE_FIELDS) {
      if (fieldAllowed(allow, url, field)) continue;
      if (sameValue(b[field], c[field])) continue;
      fields.push({ field, fatal: FATAL_FIELDS.has(field) || strict, baseline: b[field], candidate: c[field] });
    }
    if (fields.length) fieldMismatches.push({ url: target, fields });
  }

  const renameTargets = new Set(Object.values(allow.renames));
  for (const url of candidate.urls || []) {
    if (baseSet.has(url) || renameTargets.has(url)) continue;
    (matchesAny(url, allow.ignoreExtra) ? allowedExtra : extra).push(url);
  }

  return { missing, extra, typeChanged, fieldMismatches, allowedMissing, allowedExtra, renamed };
}

// ---------------------------------------------------------------------------
// reporting
// ---------------------------------------------------------------------------

const preview = (v) => {
  if (Array.isArray(v)) return v.length ? `[${v.length}] ${JSON.stringify(v).slice(0, 200)}` : "[]";
  if (v === null || v === undefined) return "(absent)";
  const s = String(v);
  return s.length > 200 ? JSON.stringify(s.slice(0, 200)) + "…" : JSON.stringify(s);
};

function section(lines, title, items, max, render = (x) => x) {
  if (!items.length) return;
  lines.push(`${title} (${items.length})`);
  lines.push("-".repeat(72));
  for (const item of items.slice(0, max)) lines.push(render(item));
  if (items.length > max) lines.push(`  … and ${items.length - max} more`);
  lines.push("");
}

function report(result, baseline, candidate, origins, allow, max) {
  const L = [];
  L.push("=".repeat(72));
  L.push("URL PARITY REPORT");
  L.push("=".repeat(72));
  L.push(`baseline : ${origins.baseline}  (${(baseline.urls || []).length} URLs, commit ${baseline.meta?.gitCommit?.slice(0, 8) || "?"})`);
  L.push(`candidate: ${origins.candidate}  (${(candidate.urls || []).length} URLs, commit ${candidate.meta?.gitCommit?.slice(0, 8) || "?"})`);
  if (allow.path) L.push(`allowlist: ${relative(REPO_ROOT, allow.path)}`);
  L.push("");

  section(L, "MISSING URLs -- served by baseline, absent from candidate", result.missing, max, (u) => `  ${u}`);
  section(L, "TYPE CHANGES -- HTML page became a file or vice versa", result.typeChanged, max, (u) => `  ${u}`);
  section(L, "EXTRA URLs -- new in candidate, not in baseline", result.extra, max, (u) => `  ${u}`);

  if (result.fieldMismatches.length) {
    const fatalPages = result.fieldMismatches.filter((m) => m.fields.some((f) => f.fatal)).length;
    L.push(`FIELD MISMATCHES (${result.fieldMismatches.length} pages, ${fatalPages} with fatal fields)`);
    L.push("-".repeat(72));
    for (const m of result.fieldMismatches.slice(0, max)) {
      L.push(`  ${m.url}`);
      for (const f of m.fields) {
        L.push(`    ${f.fatal ? "FATAL" : "warn "} ${f.field}`);
        L.push(`        baseline : ${preview(f.baseline)}`);
        L.push(`        candidate: ${preview(f.candidate)}`);
      }
    }
    if (result.fieldMismatches.length > max) L.push(`  … and ${result.fieldMismatches.length - max} more pages`);
    L.push("");
  }

  section(L, "RENAMED (per allowlist)", result.renamed, max, (u) => `  ${u}`);
  section(L, "ALLOWED MISSING (per allowlist)", result.allowedMissing, max, (u) => `  ${u}`);
  section(L, "ALLOWED EXTRA (per allowlist)", result.allowedExtra, max, (u) => `  ${u}`);

  return L.join("\n");
}

function fail(msg) {
  console.error(`diff-manifests: ${msg}`);
  process.exit(2);
}

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
  if (positional.length !== 2) {
    console.error("usage: node scripts/parity/diff-manifests.mjs <baseline> <candidate> [--allow f] [--json] [--max n] [--strict]");
    process.exit(2);
  }

  const allow = loadAllowlist(typeof flags.allow === "string" ? flags.allow : null);
  const { manifest: baseline, origin: bo } = loadManifest(positional[0], "baseline");
  const { manifest: candidate, origin: co } = loadManifest(positional[1], "candidate");
  const strict = Boolean(flags.strict);
  const max = flags.max ? Number(flags.max) : 40;

  const result = diff(baseline, candidate, allow, { strict });

  const fatalFieldPages = result.fieldMismatches.filter((m) => m.fields.some((f) => f.fatal));
  const broken =
    result.missing.length > 0 ||
    result.typeChanged.length > 0 ||
    fatalFieldPages.length > 0 ||
    (strict && result.extra.length > 0);

  if (flags.json) {
    process.stdout.write(JSON.stringify({ ok: !broken, strict, ...result }, null, 2) + "\n");
  } else {
    console.log(report(result, baseline, candidate, { baseline: bo, candidate: co }, allow, max));
    console.log("=".repeat(72));
    console.log(
      broken
        ? `PARITY BROKEN: ${result.missing.length} missing, ${result.typeChanged.length} type changes, ` +
            `${fatalFieldPages.length} pages with fatal field drift` +
            (strict ? `, ${result.extra.length} extra` : "")
        : `PARITY OK: no missing URLs, no canonical drift` +
            (result.fieldMismatches.length ? ` (${result.fieldMismatches.length} pages with non-fatal drift)` : "") +
            (result.extra.length ? `, ${result.extra.length} extra URLs` : "")
    );
    console.log("=".repeat(72));
  }

  process.exit(broken ? 1 : 0);
}

main();
