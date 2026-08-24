// Port of the colocated content.md (layout: page).
import { loadMarkdownPage } from "@/components/lib/markdown-page";
import { pageMeta } from "@/components/lib/page-meta";
import PageLayout from "@/components/site/PageLayout";

const meta = pageMeta({
  title: "Privacy Policy",
  url: "/privacy/",
  description:
    "Privacy policy for subramanya.ai - what data is collected (Google Analytics, newsletter, comments), why, and your choices.",
});

export default async function Privacy() {
  const { html } = await loadMarkdownPage("app/privacy/content.md");
  return <PageLayout meta={meta} contentHtml={html} />;
}
