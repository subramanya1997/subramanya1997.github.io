// Escaping helpers for the few places where markup has to be built as a string
// (see components/post/post-faq.ts and components/post/social-share.ts).
//
// The Jekyll output was re-serialized by Nokogiri, which escapes `&`, `<` and
// `>` in text and leaves apostrophes and quotes alone — unlike React, which
// also emits `&#x27;` / `&quot;`. Matching Nokogiri keeps these fragments
// byte-identical to `_site`.

/** Escape a text node. */
export function escapeText(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

