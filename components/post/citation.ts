// The BibTeX block at the foot of a post.
// Emitted as an HTML string for the same reason as post-faq.ts.
import { citationCss } from "./assets";
import { escapeText } from "@/components/lib/html";
import { stripHtml } from "@/components/lib/jekyll";
import { citationId, longMonth } from "@/components/lib/post-extras";
import type { Post } from "@/lib/content";

export function citationHtml(post: Post, canonical: string): string {
  if (post.frontmatter.citation === false) return "";

  const bibtex =
    `@article{${citationId(post)},\n` +
    `  author  = {Nagabhushanaradhya, Subramanya},\n` +
    `  title   = {${stripHtml(post.frontmatter.title)}},\n` +
    `  journal = {subramanya.ai},\n` +
    `  year    = {${post.date.getUTCFullYear()}},\n` +
    `  month   = {${longMonth(post.date)}},\n` +
    `  url     = {${canonical}}\n` +
    `}`;

  return (
    `<section class="citation-section" id="citation">\n` +
    `  <h4 class="citation-title">Cite this post</h4>\n` +
    `  <p class="citation-hint">If you reference this post in your work, please cite it as:</p>\n` +
    `  <pre class="citation-bibtex"><code>${escapeText(bibtex)}</code></pre>\n` +
    `</section>\n\n` +
    `<style>${citationCss()}</style>`
  );
}
