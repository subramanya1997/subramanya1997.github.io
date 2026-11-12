// Prebuild (run with bun): writes the section-level search index that
// app/api/search/ bundles. Generated, not committed — see .gitignore.
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { buildSearchDocs } from "../../lib/nonhtml";

const target = path.join(process.cwd(), "lib/generated/search-index.json");
const docs = await buildSearchDocs();
mkdirSync(path.dirname(target), { recursive: true });
writeFileSync(target, JSON.stringify(docs));

const sections = docs.reduce((count, doc) => count + doc.sections.length, 0);
console.log(`search index: ${docs.length} documents, ${sections} sections -> ${path.relative(process.cwd(), target)}`);
