// Loader for the markdown-bodied pages: the `content.md` colocated with each
// route (app/contact/content.md, app/privacy/content.md, app/docs/content.md)
// plus docs/*.md. Their bodies contain a handful of Liquid expressions, which
// are resolved here before the markdown is handed to lib/markdown.ts.
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { getAbout, getSiteConfig } from "./site-data";
import { renderMarkdown } from "@/lib/markdown";

/**
 * Resolves the Liquid expressions that actually appear in the page bodies:
 * `{{ site.email }}`, `{{ site.data.about.<key> }}` and
 * `{{ '<literal>' | prepend: site.baseurl }}` (baseurl is "").
 */
export function resolveLiquid(source: string): string {
  const site = getSiteConfig();
  const about = getAbout() as unknown as Record<string, unknown>;

  return source.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (match, expression: string) => {
    const literal = expression.match(/^'([^']*)'(?:\s*\|\s*prepend:\s*site\.baseurl\s*)?$/);
    if (literal) return literal[1];

    const [pathExpression] = expression.split("|").map((part) => part.trim());
    if (pathExpression === "site.email") return String(site.email);
    if (pathExpression.startsWith("site.data.about.")) {
      const key = pathExpression.slice("site.data.about.".length);
      const value = about[key];
      return value === undefined ? match : String(value);
    }
    if (pathExpression.startsWith("site.")) {
      const value = (site as Record<string, unknown>)[pathExpression.slice(5)];
      return value === undefined ? match : String(value);
    }
    return match;
  });
}

export interface MarkdownPage {
  frontmatter: Record<string, unknown>;
  html: string;
}

/** Reads a repo-relative markdown page and renders it the way Jekyll would. */
export async function loadMarkdownPage(relativePath: string): Promise<MarkdownPage> {
  const source = fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
  const { data, content } = matter(source);
  const { html } = await renderMarkdown(resolveLiquid(content));
  return { frontmatter: data, html };
}
