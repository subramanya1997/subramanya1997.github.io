// Verbatim `<style>` / inline `<script>` payloads for the post chrome.
//
// The post page ships several hundred lines of hand-written CSS and vanilla JS
// that predate the React port. Re-typing them into JSX would guarantee drift,
// so they live on as plain `.css` / `.client.js` files in this directory and
// are read at build time and injected with `dangerouslySetInnerHTML`, inline,
// exactly where the markup expects them. They are deliberately *not* served as
// `<link>` / `<script src>` assets: these bytes are part of the prerendered
// HTML and every published URL is byte-compared against the parity baseline.
//
// Only the *markup* around them is real JSX.
import fs from "node:fs";
import path from "node:path";
import { getSiteConfig } from "@/lib/content";

const DIR = path.join(process.cwd(), "components/post/assets");
const cache = new Map<string, string>();

/**
 * The only site-config value interpolated into these payloads is the default
 * language, marked `__DEFAULT_LANG__` (language switcher, translation toast).
 */
function asset(file: string): string {
  let text = cache.get(file);
  if (text === undefined) {
    text = fs
      .readFileSync(path.join(DIR, file), "utf8")
      .replaceAll("__DEFAULT_LANG__", getSiteConfig().default_lang);
    cache.set(file, text);
  }
  return text;
}

/** Reading-progress bar and code-block copy button. */
export const postChromeCss = () => asset("post-chrome.css");
/** Post container, header, navigation, references, lightbox. */
export const postLayoutCss = () => asset("post-layout.css");

export const citationCss = () => asset("citation.css");
export const languageSwitcherCss = () => asset("language-switcher.css");
export const languageSwitcherJs = () => asset("language-switcher.client.js");
export const mermaidCss = () => asset("mermaid.css");
export const mermaidJs = () => asset("mermaid.client.js");
export const postFaqCss = () => asset("post-faq.css");
export const relatedPostsCss = () => asset("related-posts.css");
export const tocCss = () => asset("toc.css");
export const tocJs = () => asset("toc.client.js");
export const translationToastCss = () => asset("translation-toast.css");
export const translationToastJs = () => asset("translation-toast.client.js");
