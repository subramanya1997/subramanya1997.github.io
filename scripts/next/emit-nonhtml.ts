// Renders every non-HTML surface straight from lib/nonhtml.ts into a target
// directory, without going through `next build`. Used by
// scripts/next/nonhtml-parity-check.mjs when out/ has not been built yet (the
// HTML routes are owned by other workstreams and may not compile), and handy
// for eyeballing a single endpoint:
//
//   bun scripts/next/emit-nonhtml.ts .tmp/nonhtml
import fs from "node:fs";
import path from "node:path";
import {
  buildFeedXml,
  buildSearchJson,
  buildSitemapXml,
  buildSitemapIndexXml,
  buildLlmsTxt,
  buildLlmsFullTxt,
  buildApiPosts,
  buildApiBooks,
  buildApiTags,
  buildApiSite,
} from "../../lib/nonhtml";

const target = path.resolve(process.argv[2] ?? ".tmp/nonhtml");

const files: Record<string, string | Promise<string>> = {
  "feed.xml": buildFeedXml(),
  "search.json": buildSearchJson(),
  "sitemap.xml": buildSitemapXml(),
  "sitemapindex.xml": buildSitemapIndexXml(),
  "llms.txt": buildLlmsTxt(),
  "llms-full.txt": buildLlmsFullTxt(),
  "api/v1/posts.json": buildApiPosts(),
  "api/v1/books.json": buildApiBooks(),
  "api/v1/tags.json": buildApiTags(),
  "api/v1/site.json": buildApiSite(),
};

for (const [relative, value] of Object.entries(files)) {
  const destination = path.join(target, relative);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, await value, "utf8");
  console.log(`emitted ${relative}`);
}
