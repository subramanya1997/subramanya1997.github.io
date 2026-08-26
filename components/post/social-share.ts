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

// Inline SVG brand marks (Font Awesome 6 path data, CC BY 4.0). Replaces the
// site-wide cdnjs Font Awesome stylesheet, which was loaded on every page for
// just these three icons.
function svgIcon(viewBox: string, path: string): string {
  return (
    `<svg aria-hidden="true" focusable="false" width="1em" height="1em" ` +
    `viewBox="${viewBox}" fill="currentColor" xmlns="http://www.w3.org/2000/svg">` +
    `<path d="${path}"></path></svg>`
  );
}

const ICON_FACEBOOK = svgIcon(
  "0 0 320 512",
  "M80 299.3V512H196V299.3h86.5l18-97.8H196V166.9c0-51.7 20.3-71.5 72.7-71.5c16.3 0 29.4 .4 37 1.2V7.9C291.4 4 256.4 0 236.2 0C129.3 0 80 50.5 80 159.4v42.1H14v97.8H80z"
);
const ICON_TWITTER = svgIcon(
  "0 0 512 512",
  "M459.4 151.7c.3 4.5 .3 9.1 .3 13.6 0 138.7-105.6 298.6-298.6 298.6-59.5 0-114.7-17.2-161.1-47.1 8.4 1 16.6 1.3 25.3 1.3 49.1 0 94.2-16.6 130.3-44.8-46.1-1-84.8-31.2-98.1-72.8 6.5 1 13 1.6 19.8 1.6 9.4 0 18.8-1.3 27.6-3.6-48.1-9.7-84.1-52-84.1-103v-1.3c14 7.8 30.2 12.7 47.4 13.3-28.3-18.8-46.8-51-46.8-87.4 0-19.5 5.2-37.4 14.3-53 51.7 63.7 129.3 105.3 216.4 109.8-1.6-7.8-2.6-15.9-2.6-24 0-57.8 46.8-104.9 104.9-104.9 30.2 0 57.5 12.7 76.7 33.1 23.7-4.5 46.5-13.3 66.6-25.3-7.8 24.4-24.4 44.8-46.1 57.8 21.1-2.3 41.6-8.1 60.4-16.2-14.3 20.8-32.2 39.3-52.6 54.3z"
);
const ICON_LINKEDIN = svgIcon(
  "0 0 448 512",
  "M100.28 448H7.4V148.9h92.88zM53.79 108.1C24.09 108.1 0 83.5 0 53.8a53.79 53.79 0 0 1 107.58 0c0 29.7-24.1 54.3-53.79 54.3zM447.9 448h-92.68V302.4c0-34.7-.7-79.2-48.29-79.2-48.29 0-55.69 37.7-55.69 76.7V448h-92.78V148.9h89.08v40.8h1.3c12.4-23.5 42.69-48.3 87.88-48.3 94 0 111.28 61.9 111.28 142.3V448z"
);

const NETWORKS: Network[] = [
  {
    href: (t) => `https://www.facebook.com/sharer/sharer.php?u=${t.url}`,
    label: "Share on Facebook",
    icon: ICON_FACEBOOK,
    name: "Facebook",
  },
  {
    href: (t) => `https://twitter.com/intent/tweet?text=${t.title}&url=${t.url}`,
    label: "Share on Twitter",
    icon: ICON_TWITTER,
    name: "Twitter",
  },
  {
    href: (t) =>
      `https://www.linkedin.com/shareArticle?mini=true&url=${t.url}&title=${t.title}` +
      `&summary=${stripHtml(t.excerpt ?? "")}`,
    label: "Share on LinkedIn",
    icon: ICON_LINKEDIN,
    name: "LinkedIn",
  },
];

/** `_includes/toc.html` — icon only. */
export function tocShareLinksHtml(target: ShareTarget): string {
  return NETWORKS.map(
    (network) =>
      `<a href="${attr(network.href(target))}" \n        onclick="${POPUP}"\n        target="_blank" rel="noopener noreferrer" class="toc-social-icon" aria-label="${network.label}" title="${network.label}">\n        ${network.icon}\n      </a>`
  ).join("\n      ");
}

/** `_layouts/post.html` — icon plus the network name. */
export function mobileShareLinksHtml(target: ShareTarget): string {
  return NETWORKS.map(
    (network) =>
      `<a href="${attr(network.href(target))}" \n          onclick="${POPUP}"\n          target="_blank" rel="noopener noreferrer" class="mobile-social-icon" aria-label="${network.label}" title="${network.label}">\n          ${network.icon}\n          <span>${network.name}</span>\n        </a>`
  ).join("\n        ");
}
