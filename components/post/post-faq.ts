// Port of _includes/post-faq.html: the visible "Quick Answers" block plus the
// matching schema.org FAQPage JSON-LD.
//
// Emitted as an HTML string rather than JSX: in `_layouts/post.html` this
// include is a sibling of `{{ content }}` inside <article class="post-content">,
// and JSX cannot interleave raw HTML with elements without inserting a wrapper
// node that the CSS would see.
import { includeStyle } from "@/components/lib/includes";
import { escapeText } from "@/components/lib/html";
import { stripHtml, stripNewlines } from "@/components/lib/jekyll";

export interface FaqItem {
  q: string;
  /** `item.a | markdownify` — rendered by lib/markdown.ts. */
  answerHtml: string;
}

export function postFaqHtml(canonical: string, items: FaqItem[]): string {
  if (items.length === 0) return "";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${canonical}#faq`,
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: stripNewlines(stripHtml(item.answerHtml)),
      },
    })),
  };

  const details = items
    .map(
      (item) =>
        `  <details class="post-faq-item">\n` +
        `    <summary class="post-faq-question">${escapeText(item.q)}</summary>\n` +
        `    <div class="post-faq-answer">${item.answerHtml}</div>\n` +
        `  </details>`
    )
    .join("\n");

  return (
    `<section class="post-faq" aria-labelledby="post-faq-title">\n` +
    `  <h2 id="post-faq-title">Quick Answers</h2>\n` +
    `${details}\n` +
    `</section>\n\n` +
    `<script type="application/ld+json">\n${JSON.stringify(jsonLd, null, 2)}\n</script>\n\n` +
    `<style>${includeStyle("post-faq.html")}</style>`
  );
}
