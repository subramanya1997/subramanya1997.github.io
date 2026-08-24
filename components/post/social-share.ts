// The Facebook / Twitter / LinkedIn share links of `_includes/toc.html` and
// the mobile block of `_layouts/post.html`.
//
// These anchors carry an inline `onclick="window.open(...); return false;"`,
// which JSX cannot express, so they are emitted as raw HTML. Attribute values
// are escaped the way Nokogiri re-serialized them in the Jekyll output: `&`
// becomes `&amp;`, a literal apostrophe stays a literal apostrophe.
import { stripHtml } from "@/components/lib/jekyll";

const POPUP =
  "window.open(this.href, 'pop-up', 'left=20,top=20,width=500,height=500,toolbar=1,resizable=0'); return false;";

function attr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

export interface ShareTarget {
  /** Absolute page URL (`site.url + page.url`). */
  url: string;
  title: string;
  /** `page.excerpt | strip_html` — only the LinkedIn link uses it. */
  excerpt?: string;
}

interface Network {
  href: (target: ShareTarget) => string;
  label: string;
  icon: string;
  name: string;
}

const NETWORKS: Network[] = [
  {
    href: (t) => `https://www.facebook.com/sharer/sharer.php?u=${t.url}`,
    label: "Share on Facebook",
    icon: "fab fa-facebook-f",
    name: "Facebook",
  },
  {
    href: (t) => `https://twitter.com/intent/tweet?text=${t.title}&url=${t.url}`,
    label: "Share on Twitter",
    icon: "fab fa-twitter",
    name: "Twitter",
  },
  {
    href: (t) =>
      `https://www.linkedin.com/shareArticle?mini=true&url=${t.url}&title=${t.title}` +
      `&summary=${stripHtml(t.excerpt ?? "")}`,
    label: "Share on LinkedIn",
    icon: "fab fa-linkedin-in",
    name: "LinkedIn",
  },
];

/** `_includes/toc.html` — icon only. */
export function tocShareLinksHtml(target: ShareTarget): string {
  return NETWORKS.map(
    (network) =>
      `<a href="${attr(network.href(target))}" \n        onclick="${POPUP}"\n        target="_blank" rel="noopener noreferrer" class="toc-social-icon" aria-label="${network.label}" title="${network.label}">\n        <i class="${network.icon}"></i>\n      </a>`
  ).join("\n      ");
}

/** `_layouts/post.html` — icon plus the network name. */
export function mobileShareLinksHtml(target: ShareTarget): string {
  return NETWORKS.map(
    (network) =>
      `<a href="${attr(network.href(target))}" \n          onclick="${POPUP}"\n          target="_blank" rel="noopener noreferrer" class="mobile-social-icon" aria-label="${network.label}" title="${network.label}">\n          <i class="${network.icon}"></i>\n          <span>${network.name}</span>\n        </a>`
  ).join("\n        ");
}
