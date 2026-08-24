// Verbatim `<style>` / inline `<script>` payloads lifted out of `_includes/*.html`.
//
// The post, loop and tag templates ship several hundred lines of hand-written
// CSS and vanilla JS inside their Liquid includes. Re-typing those into JSX
// would guarantee drift; instead the include files stay the single source of
// truth (exactly as `_posts`, `_data` and `_config.yml` do for content) and the
// blocks are read at build time and injected with `dangerouslySetInnerHTML`.
//
// Only the *markup* of each include is hand-ported to JSX — the asset blocks
// below are byte-identical to what Jekyll emitted.
import fs from "node:fs";
import path from "node:path";
import { getSiteConfig } from "@/lib/content";

const cache = new Map<string, string>();

function readInclude(name: string): string {
  let source = cache.get(name);
  if (source === undefined) {
    const relative = name.includes("/") ? name : `_includes/${name}`;
    source = fs.readFileSync(path.join(process.cwd(), relative), "utf8");
    cache.set(name, source);
  }
  return source;
}

/**
 * The only Liquid expressions that appear *inside* the style/script blocks are
 * `{{ site.default_lang }}` (language switcher, translation toast).
 */
function resolve(block: string): string {
  return block.replace(/\{\{\s*site\.default_lang\s*\}\}/g, getSiteConfig().default_lang);
}

function blocks(name: string, tag: "style" | "script"): string[] {
  const source = readInclude(name);
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "g");
  const out: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = re.exec(source)) !== null) {
    // `<script src=...>` blocks are rendered as real elements, not inlined.
    if (tag === "script" && /<script[^>]*\ssrc=/.test(match[0])) continue;
    out.push(resolve(match[1]));
  }
  return out;
}

/** All `<style>` bodies of an include, in source order. */
export function includeStyles(name: string): string[] {
  return blocks(name, "style");
}

/** All inline `<script>` bodies of an include, in source order. */
export function includeScripts(name: string): string[] {
  return blocks(name, "script");
}

/** Convenience for includes that carry exactly one block of each kind. */
export function includeStyle(name: string, index = 0): string {
  return includeStyles(name)[index] ?? "";
}

export function includeScript(name: string, index = 0): string {
  return includeScripts(name)[index] ?? "";
}
