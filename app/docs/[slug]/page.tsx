// Ports docs/*.md (layout: page, permalink: /docs/<slug>/).
import fs from "node:fs";
import path from "node:path";
import { loadMarkdownPage } from "@/components/lib/markdown-page";
import { pageMeta } from "@/components/lib/page-meta";
import PageLayout from "@/components/site/PageLayout";

function docSlugs(): string[] {
  return fs
    .readdirSync(path.join(process.cwd(), "docs"))
    .filter((file) => file.endsWith(".md"))
    .map((file) => file.replace(/\.md$/, ""));
}

export function generateStaticParams() {
  return docSlugs().map((slug) => ({ slug }));
}

export default async function DocPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { frontmatter, html } = await loadMarkdownPage(`docs/${slug}.md`);

  const meta = pageMeta({
    title: String(frontmatter.title ?? ""),
    url: String(frontmatter.permalink ?? `/docs/${slug}/`),
    description: frontmatter.description ? String(frontmatter.description) : undefined,
    robots: frontmatter.robots ? String(frontmatter.robots) : undefined,
  });

  return <PageLayout meta={meta} contentHtml={html} />;
}
