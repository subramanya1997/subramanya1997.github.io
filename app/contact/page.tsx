// Port of contact.md (layout: page).
import { pageMeta } from "@/components/lib/page-meta";
import { loadMarkdownPage } from "@/components/lib/markdown-page";
import PageLayout from "@/components/site/PageLayout";

const meta = pageMeta({
  title: "Contact",
  url: "/contact/",
  description: "How to reach Subramanya N - email, GitHub, LinkedIn, X, and Google Scholar.",
});

export default async function Contact() {
  const { html } = await loadMarkdownPage("contact.md");
  return <PageLayout meta={meta} contentHtml={html} />;
}
