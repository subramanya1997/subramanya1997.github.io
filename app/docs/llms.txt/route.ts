// Scoped llms.txt for the developer-docs section (llmstxt.org modular files).
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { getSiteConfig, ROOT } from "@/lib/content";

export const dynamic = "force-static";

export async function GET() {
  const url = String(getSiteConfig().url).replace(/\/$/, "");
  const lines: string[] = [
    "# Subramanya N — Developer Documentation",
    "",
    "> Scoped context for the /docs/ section of subramanya.ai: how the site is",
    "> built, its content model, and its read-only JSON API. For the whole site",
    `> see ${url}/llms.txt.`,
    "",
    "## Docs",
    `- [Documentation index](${url}/docs/) (md: ${url}/docs/index.md)`,
  ];

  const dir = path.join(ROOT, "docs");
  for (const file of fs.readdirSync(dir).sort()) {
    if (!file.endsWith(".md")) continue;
    const slug = file.replace(/\.md$/, "");
    const { data } = matter(fs.readFileSync(path.join(dir, file), "utf8"));
    const title = typeof data.title === "string" ? data.title : slug;
    const description = typeof data.description === "string" ? `: ${data.description}` : "";
    lines.push(`- [${title}](${url}/docs/${slug}/) (md: ${url}/docs/${slug}/index.md)${description}`);
  }

  lines.push(
    "",
    "## Related",
    `- OpenAPI 3.1 spec: ${url}/openapi.json`,
    `- API llms.txt: ${url}/api/llms.txt`,
    `- Auth (anonymous): ${url}/auth.md`,
    "- Source: https://github.com/subramanya1997/subramanya1997.github.io",
    ""
  );

  return new Response(lines.join("\n"), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
