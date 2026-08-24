// `_layouts/book-redirect.html` — the books collection renders a bare
// redirect document with no site chrome at all (no <header>, no stylesheets,
// no JSON-LD). The App Router always wraps a page in the shared root layout,
// so the file is written directly instead.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { siteConfig, books } from "./lib/jekyll-content.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

function stripHtml(value) {
  return String(value ?? "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[\s\S]*?>/g, "");
}

/** Liquid `truncate: 160` — the ellipsis counts toward the length. */
function truncate(value, length) {
  return value.length <= length ? value : `${value.slice(0, length - 3)}...`;
}

/** Nokogiri re-serialization: `&`, `<` and `>` escaped, quotes left alone. */
function attr(value) {
  return String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function text(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** `_plugins/link_attributes.rb#derive_title`. */
function linkTitle(value) {
  const collapsed = String(value).replace(/\s+/g, " ").trim();
  return collapsed.length > 120 ? `${collapsed.slice(0, 119).replace(/\s+$/, "")}…` : collapsed;
}

function socialImageUrl(site, image) {
  const path = image || site.default_social_image || "/assets/images/og/default.png";
  let url = path.includes("://")
    ? path.replace(/ /g, "%20")
    : `${site.url}${path.replace(/ /g, "%20")}`;
  if (site.social_image_version) {
    url += `${url.includes("?") ? "&" : "?"}v=${site.social_image_version}`;
  }
  return url;
}

export function writeBookRedirects(outDir) {
  const site = siteConfig();
  let count = 0;

  for (const book of books()) {
    const fm = book.data;
    if (fm.layout !== "book-redirect") continue;

    const target = fm.web_url || `${site.baseurl ?? ""}${book.url}`;
    const description = truncate(
      stripHtml(fm.description ?? fm.excerpt ?? site.description).replace(/\r?\n/g, ""),
      160
    );
    const title = fm.title ?? site.title;
    const image = socialImageUrl(site, fm.image);
    const canonical = `${site.url}${fm.web_url ?? ""}`;
    const lang = site.default_lang || "en";

    const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <title>${text(`${title} | ${site.title}`)}</title>
  <meta name="description" content="${attr(description)}">
  <meta property="og:title" content="${attr(title)}">
  <meta property="og:description" content="${attr(description)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${attr(canonical)}">
  <meta property="og:site_name" content="${attr(site.title)}">
  <meta property="og:image" content="${attr(image)}">
  <meta property="og:image:secure_url" content="${attr(image)}">
  <meta property="og:image:alt" content="${attr(title)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${attr(title)}">
  <meta name="twitter:description" content="${attr(description)}">
  <meta name="twitter:image" content="${attr(image)}">
  <meta name="twitter:image:src" content="${attr(image)}">
  <meta name="twitter:image:alt" content="${attr(title)}">
  <link rel="canonical" href="${attr(canonical)}">
  <meta name="robots" content="noindex, follow">
  <meta http-equiv="refresh" content="0; url=${attr(target)}">
  <script>location.replace("${target}");</script>
</head>
<body>
  <p>This handbook has moved. Redirecting to <a href="${attr(target)}" title="${attr(
    linkTitle(title)
  )}">${text(title)}</a>.</p>
</body>
</html>`;

    const dir = join(outDir, book.url.replace(/^\/|\/$/g, ""));
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "index.html"), html);
    count += 1;
  }

  return count;
}

/**
 * `_layouts/default.html`: `<body class="loop-shell">` on the loop marketplace
 * and every loop document. A body class can only come from a root layout in
 * the App Router, and the site has a single shared one, so it is stamped here.
 */
export function stampLoopShell(outDir, urls) {
  let count = 0;
  for (const url of urls) {
    const file = join(outDir, url.replace(/^\//, ""), "index.html");
    let html;
    try {
      html = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    if (html.includes('<body class="loop-shell">')) continue;
    const stamped = html.replace("<body>", '<body class="loop-shell">');
    if (stamped === html) continue;
    writeFileSync(file, stamped);
    count += 1;
  }
  return count;
}

export { ROOT };
