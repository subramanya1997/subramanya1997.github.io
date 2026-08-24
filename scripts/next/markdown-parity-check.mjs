#!/usr/bin/env bun
/**
 * Markdown parity check: render every post in `_posts/` through
 * `lib/markdown.ts` and diff the result against the article body that Jekyll
 * produced in `_site/`.
 *
 * Run with bun (it imports the TypeScript module directly):
 *
 *   bun scripts/next/markdown-parity-check.mjs
 *   bun scripts/next/markdown-parity-check.mjs --verbose
 *   bun scripts/next/markdown-parity-check.mjs 2026-04-23   # filter by substring
 *
 * Reports, per post:
 *   - heading id / level / text mismatches   (inbound anchors + TOC)
 *   - element tag-sequence mismatches        (overall structure)
 *   - code block class-structure differences (rouge markup)
 *   - anchor attribute differences           (link_attributes.rb)
 *   - normalized text differences            (kramdown typography)
 *
 * Exit code is non-zero when anything outside `KNOWN_DIFFS` shows up.
 */

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseFragment } from "parse5";
import matter from "gray-matter";
import yaml from "js-yaml";

import { renderMarkdown } from "../../lib/markdown.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const POSTS_DIR = path.join(ROOT, "_posts");
const SITE_DIR = path.join(ROOT, "_site");

/** `_data/*.yml`, so `{{ site.data.about.github_username }}` resolves. */
const SITE_DATA = Object.fromEntries(
  readdirSync(path.join(ROOT, "_data"))
    .filter((f) => /\.ya?ml$/.test(f))
    .map((f) => [
      f.replace(/\.ya?ml$/, ""),
      yaml.load(readFileSync(path.join(ROOT, "_data", f), "utf8")),
    ]),
);

const RENDER_OPTIONS = { site: { data: SITE_DATA } };

const argv = process.argv.slice(2);
const VERBOSE = argv.includes("--verbose");
const FILTER = argv.find((a) => !a.startsWith("--"));

/**
 * Differences that are known, understood and safe. Each entry documents why.
 */
const KNOWN_DIFFS = [
  {
    // rouge lexers this port does not implement tokenize their content; the
    // wrapper markup still matches so css/main.css applies unchanged.
    match: (d) => d.reason === "untokenized-known-language",
    why: "wrapper structure matches; token spans absent for a language not ported",
  },
  {
    // kramdown does not dedent a fenced block that is indented inside a list
    // item; CommonMark strips indentation up to the fence column. The rendered
    // code differs only by leading whitespace.
    match: (d) =>
      d.label === "code-text" &&
      JSON.parse(d.expected).replace(/^[ \t]+/gm, "") === JSON.parse(d.actual).replace(/^[ \t]+/gm, ""),
    why: "kramdown keeps list-item indentation inside fenced blocks; CommonMark dedents",
  },
  {
    // The whole document matches once nokogiri's `attr=""` expansion of boolean
    // attributes and pure whitespace are normalized away. Identical to a
    // browser.
    match: (d) => d.reason === "cosmetic-serialization",
    why: "boolean-attribute and whitespace-only serialization differences",
  },
];

// ---------------------------------------------------------------------------
// parse5 helpers
// ---------------------------------------------------------------------------

function attrs(node) {
  const out = {};
  for (const a of node.attrs ?? []) out[a.name] = a.value;
  return out;
}

function* walk(node) {
  for (const child of node.childNodes ?? []) {
    if (child.nodeName === "#text") continue;
    if (child.nodeName === "#comment") continue;
    yield child;
    yield* walk(child);
  }
}

function textOf(node) {
  if (node.nodeName === "#text") return node.value;
  let out = "";
  for (const child of node.childNodes ?? []) out += textOf(child);
  return out;
}

/**
 * Tag name plus the attributes the site's CSS/JS actually keys off, so a
 * regression like "code spans lost their rouge class" shows up here.
 */
function tagSequence(root) {
  const out = [];
  for (const el of walk(root)) {
    const a = attrs(el);
    let sig = el.nodeName;
    if (a.class) sig += `.${a.class.trim().split(/\s+/).join(".")}`;
    if (a.id) sig += `#${a.id}`;
    if (a.style) sig += `[style=${a.style}]`;
    out.push(sig);
  }
  return out;
}

function normalizeText(root) {
  // Join text nodes with a space so that kramdown's block indentation (which
  // remark does not emit) cannot masquerade as a content difference.
  const parts = [];
  const collect = (node) => {
    if (node.nodeName === "#text") {
      parts.push(node.value);
      return;
    }
    for (const child of node.childNodes ?? []) collect(child);
  };
  collect(root);
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

// ---------------------------------------------------------------------------
// extraction
// ---------------------------------------------------------------------------

/**
 * `_layouts/post.html` renders `{{ content }}` followed by the `post-faq` and
 * `citation` includes inside the same <article>. Only the first part comes from
 * markdown, so cut the body at whichever include starts first.
 */
const LAYOUT_TAIL_MARKERS = ['<section class="post-faq"', '<section class="citation-section"'];

function extractArticleBody(html) {
  const open = html.indexOf('<article class="post-content">');
  if (open === -1) return null;
  const start = html.indexOf(">", open) + 1;
  let end = html.indexOf("</article>", start);
  for (const marker of LAYOUT_TAIL_MARKERS) {
    const at = html.indexOf(marker, start);
    if (at !== -1 && at < end) end = at;
  }
  return html.slice(start, end);
}

function headings(root) {
  const out = [];
  for (const el of walk(root)) {
    if (!/^h[1-6]$/.test(el.nodeName)) continue;
    out.push({
      tag: el.nodeName,
      id: attrs(el).id ?? "",
      text: textOf(el).replace(/\s+/g, " ").trim(),
    });
  }
  return out;
}

function codeBlocks(root) {
  const out = [];
  for (const el of walk(root)) {
    const cls = attrs(el).class ?? "";
    if (el.nodeName === "div" && cls.includes("highlighter-rouge")) {
      const inner = (el.childNodes ?? []).find((c) => c.nodeName === "div");
      const pre = inner ? (inner.childNodes ?? []).find((c) => c.nodeName === "pre") : null;
      const code = pre ? (pre.childNodes ?? []).find((c) => c.nodeName === "code") : null;
      out.push({
        shape: "rouge",
        wrapper: cls,
        innerDiv: inner ? (attrs(inner).class ?? "") : null,
        pre: pre ? (attrs(pre).class ?? "") : null,
        codeClass: code ? (attrs(code).class ?? "") : null,
        spans: code
          ? [...walk(code)]
              .filter((n) => n.nodeName === "span")
              .map((n) => `${attrs(n).class}:${textOf(n)}`)
          : [],
        text: code ? textOf(code) : "",
      });
      continue;
    }
    if (el.nodeName === "pre" && !cls) {
      // bare fallback block (unknown lexer, e.g. mermaid)
      const parentCls = attrs(el.parentNode ?? {}).class ?? "";
      if (parentCls.includes("highlighter-rouge")) continue;
      const code = (el.childNodes ?? []).find((c) => c.nodeName === "code");
      out.push({
        shape: "plain",
        wrapper: null,
        codeClass: code ? (attrs(code).class ?? "") : null,
        spans: [],
        text: code ? textOf(code) : "",
      });
    }
  }
  return out;
}

function anchors(root) {
  const out = [];
  for (const el of walk(root)) {
    if (el.nodeName !== "a") continue;
    const a = attrs(el);
    out.push({
      href: a.href ?? "",
      target: a.target ?? "",
      rel: (a.rel ?? "").split(/\s+/).filter(Boolean).sort().join(" "),
      title: a.title ?? "",
    });
  }
  return out;
}

function images(root) {
  const out = [];
  for (const el of walk(root)) {
    if (el.nodeName !== "img") continue;
    const a = attrs(el);
    out.push({ src: a.src ?? "", alt: a.alt ?? "", class: a.class ?? "", width: a.width ?? "", height: a.height ?? "" });
  }
  return out;
}

// ---------------------------------------------------------------------------
// diffing
// ---------------------------------------------------------------------------

function diffLists(expected, actual, label, format) {
  const diffs = [];
  const len = Math.max(expected.length, actual.length);
  for (let i = 0; i < len; i += 1) {
    const e = expected[i];
    const a = actual[i];
    const es = e === undefined ? "<missing>" : format(e);
    const as = a === undefined ? "<missing>" : format(a);
    if (es !== as) diffs.push({ label, index: i, expected: es, actual: as });
  }
  return diffs;
}

function siteHtmlFor(slug, dateParts) {
  const [y, m, d] = dateParts;
  const p = path.join(SITE_DIR, y, m, d, slug, "index.html");
  return existsSync(p) ? p : null;
}

/** Front matter `date:` wins over the filename date for the permalink. */
function permalinkDate(data, fallback) {
  const raw = data?.date;
  if (!raw) return fallback;
  const iso = raw instanceof Date ? raw.toISOString().slice(0, 10) : String(raw).slice(0, 10);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? [m[1], m[2], m[3]] : fallback;
}

/**
 * Root-level markdown pages that are pure content (no `{% ... %}` Liquid tags -
 * those pages are rebuilt as React components, not through renderMarkdown).
 */
function contentPages() {
  return readdirSync(ROOT)
    .filter((f) => f.endsWith(".md") && !["README.md", "CONTRIBUTING.md"].includes(f))
    .map((f) => {
      const raw = readFileSync(path.join(ROOT, f), "utf8");
      const { data, content } = matter(raw);
      return { file: f, data, content };
    })
    .filter((p) => !p.content.includes("{%") && typeof p.data.permalink === "string")
    .map((p) => ({
      ...p,
      sitePath: path.join(SITE_DIR, p.data.permalink.replace(/^\/|\/$/g, ""), "index.html"),
    }))
    .filter((p) => existsSync(p.sitePath));
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

const targets = [];

for (const file of readdirSync(POSTS_DIR).filter((f) => f.endsWith(".md")).sort()) {
  const m = /^(\d{4})-(\d{2})-(\d{2})-(.+)\.md$/.exec(file);
  if (!m) continue;
  const [, y, mo, d, slug] = m;
  const raw = readFileSync(path.join(POSTS_DIR, file), "utf8");
  const { data, content } = matter(raw);
  targets.push({
    file,
    content,
    sitePath: siteHtmlFor(slug, permalinkDate(data, [y, mo, d])),
  });
}

for (const page of contentPages()) {
  targets.push({ file: page.file, content: page.content, sitePath: page.sitePath });
}

let clean = 0;
let justified = 0;
const failing = [];
let skipped = 0;

for (const { file, content, sitePath } of targets.filter((t) => !FILTER || t.file.includes(FILTER))) {
  if (!sitePath) {
    console.log(`SKIP  ${file}  (no _site build found)`);
    skipped += 1;
    continue;
  }

  const { html, toc, headings: allHeadings } = await renderMarkdown(content, RENDER_OPTIONS);

  const expectedBody = extractArticleBody(readFileSync(sitePath, "utf8"));
  if (expectedBody === null) {
    console.log(`SKIP  ${file}  (no article body in _site)`);
    skipped += 1;
    continue;
  }

  const expected = parseFragment(expectedBody);
  const actual = parseFragment(html);

  const diffs = [];

  diffs.push(
    ...diffLists(headings(expected), headings(actual), "heading", (h) => `${h.tag}#${h.id} "${h.text}"`),
  );

  const expTags = tagSequence(expected);
  const actTags = tagSequence(actual);
  if (expTags.join(",") !== actTags.join(",")) {
    // report the first divergence with a little context
    let i = 0;
    while (i < expTags.length && i < actTags.length && expTags[i] === actTags[i]) i += 1;
    diffs.push({
      label: "tag-sequence",
      index: i,
      expected: expTags.slice(Math.max(0, i - 3), i + 5).join(" "),
      actual: actTags.slice(Math.max(0, i - 3), i + 5).join(" "),
    });
  }

  const expCode = codeBlocks(expected);
  const actCode = codeBlocks(actual);
  for (let i = 0; i < Math.max(expCode.length, actCode.length); i += 1) {
    const e = expCode[i];
    const a = actCode[i];
    if (!e || !a) {
      diffs.push({ label: "code", index: i, expected: e ? e.shape : "<missing>", actual: a ? a.shape : "<missing>" });
      continue;
    }
    if (e.shape !== a.shape || e.wrapper !== a.wrapper || e.innerDiv !== a.innerDiv || e.pre !== a.pre || e.codeClass !== a.codeClass) {
      diffs.push({
        label: "code",
        index: i,
        expected: `${e.shape} ${e.wrapper} > ${e.innerDiv} > ${e.pre} > code.${e.codeClass}`,
        actual: `${a.shape} ${a.wrapper} > ${a.innerDiv} > ${a.pre} > code.${a.codeClass}`,
      });
      continue;
    }
    if (e.text !== a.text) {
      diffs.push({ label: "code-text", index: i, expected: JSON.stringify(e.text.slice(0, 90)), actual: JSON.stringify(a.text.slice(0, 90)) });
    }
    if (e.spans.join(" ") !== a.spans.join(" ")) {
      let k = 0;
      while (k < e.spans.length && k < a.spans.length && e.spans[k] === a.spans[k]) k += 1;
      diffs.push({
        label: "code-tokens",
        index: i,
        reason: a.spans.length === 0 && e.spans.length > 0 ? "untokenized-known-language" : undefined,
        expected: `[${k}] ${JSON.stringify(e.spans[k] ?? "<missing>")} (${e.spans.length} spans)`,
        actual: `[${k}] ${JSON.stringify(a.spans[k] ?? "<missing>")} (${a.spans.length} spans)`,
      });
    }
  }

  diffs.push(
    ...diffLists(anchors(expected), anchors(actual), "anchor", (x) =>
      `${x.href} target=${x.target} rel=${x.rel} title=${x.title}`),
  );

  diffs.push(
    ...diffLists(images(expected), images(actual), "img", (x) =>
      `${x.src} alt=${x.alt} class=${x.class} w=${x.width} h=${x.height}`),
  );

  const expText = normalizeText(expected);
  const actText = normalizeText(actual);
  if (expText !== actText) {
    let i = 0;
    while (i < expText.length && i < actText.length && expText[i] === actText[i]) i += 1;
    diffs.push({
      label: "text",
      index: i,
      expected: JSON.stringify(expText.slice(Math.max(0, i - 40), i + 40)),
      actual: JSON.stringify(actText.slice(Math.max(0, i - 40), i + 40)),
    });
  }

  // Strictest check: the serialized bytes, with inter-tag whitespace collapsed
  // (kramdown pretty-prints block elements; remark does not).
  const collapse = (s) => s.replace(/>\s+</g, "><").replace(/\s+/g, " ").trim();
  const expBytes = collapse(expectedBody);
  const actBytes = collapse(html);
  if (expBytes !== actBytes) {
    // `soften` removes the two known-cosmetic serialization differences:
    // nokogiri's `attr=""` expansion of boolean attributes, and whitespace
    // (kramdown keeps list indentation inside fenced blocks).
    const soften = (s) => s.replace(/(\s[\w-]+)=""/g, "$1").replace(/\s+/g, "");
    let i = 0;
    while (i < expBytes.length && i < actBytes.length && expBytes[i] === actBytes[i]) i += 1;
    diffs.push({
      label: "bytes",
      index: i,
      reason: soften(expBytes) === soften(actBytes) ? "cosmetic-serialization" : undefined,
      expected: JSON.stringify(expBytes.slice(Math.max(0, i - 50), i + 70)),
      actual: JSON.stringify(actBytes.slice(Math.max(0, i - 50), i + 70)),
    });
  }

  const real = diffs.filter((d) => !KNOWN_DIFFS.some((k) => k.match(d)));
  const waived = diffs.length - real.length;

  if (real.length === 0 && waived === 0) {
    clean += 1;
    if (VERBOSE) console.log(`OK    ${file}  (${allHeadings.length} headings, ${toc.length} in toc)`);
  } else if (real.length === 0) {
    justified += 1;
    console.log(`OK*   ${file}  (${waived} justified diff${waived === 1 ? "" : "s"})`);
  } else {
    failing.push(file);
    console.log(`FAIL  ${file}  (${real.length} diff${real.length === 1 ? "" : "s"})`);
    for (const d of real.slice(0, VERBOSE ? 100 : 6)) {
      console.log(`        ${d.label}[${d.index}]`);
      console.log(`          jekyll: ${d.expected}`);
      console.log(`          next:   ${d.actual}`);
    }
    if (real.length > (VERBOSE ? 100 : 6)) {
      console.log(`        ... ${real.length - (VERBOSE ? 100 : 6)} more`);
    }
  }
}

console.log("");
console.log(`clean: ${clean}   justified-diffs: ${justified}   failing: ${failing.length}   skipped: ${skipped}`);
if (failing.length) {
  console.log(`failing posts:\n  ${failing.join("\n  ")}`);
  process.exit(1);
}
