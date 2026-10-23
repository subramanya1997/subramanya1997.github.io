// UMass handbook markdown twins. Its static files (floor-plan images, LICENSE,
// robots.txt) are committed under public/<slug>/ and served as-is; every page
// gets a markdown twin (`<slug>/index.md` for the landing page, `<page>.md`
// beside each `.html` page). The pages themselves are Next routes under
// app/<slug>/.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { site } from "../../site.config.mjs";
import {
  HANDBOOK_TITLE,
  handbookPages,
  handbookTwinUrl,
  prepareHandbookMarkdown,
} from "../../lib/handbook-source.mjs";

/** @param {string} value */
function yamlString(value) {
  return JSON.stringify(String(value));
}

export function writeHandbookPublic(pub) {
  const siteUrl = String(site.url).replace(/\/$/, "");
  let count = 0;
  for (const page of handbookPages()) {
    const { heading, body } = prepareHandbookMarkdown(page);
    const front = [
      "---",
      `title: ${yamlString(page.route === "" ? HANDBOOK_TITLE : heading)}`,
      `description: ${yamlString(page.description)}`,
      `url: ${siteUrl}${page.url}`,
      `book: ${yamlString(HANDBOOK_TITLE)}`,
      "---",
      "",
    ].join("\n");
    const twin = join(pub, handbookTwinUrl(page).slice(1));
    mkdirSync(dirname(twin), { recursive: true });
    writeFileSync(twin, `${front}# ${page.route === "" ? HANDBOOK_TITLE : heading}\n\n${body}\n`);
    count += 1;
  }
  return count;
}
