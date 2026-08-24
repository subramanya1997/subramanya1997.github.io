// Port of docs.md (layout: page). Note: no markdown twin — the twin generator
// skips the /docs/ prefix.
import { loadMarkdownPage } from "@/components/lib/markdown-page";
import { pageMeta } from "@/components/lib/page-meta";
import PageLayout from "@/components/site/PageLayout";

const meta = pageMeta({
  title: "Developer Documentation",
  url: "/docs/",
  description:
    "Subramanya N (subramanya.ai) developer resources - OpenAPI spec, agent endpoints, architecture, content model, and contributor workflow.",
});

export default async function Docs() {
  const { html } = await loadMarkdownPage("docs.md");
  return <PageLayout meta={meta} contentHtml={html} />;
}
