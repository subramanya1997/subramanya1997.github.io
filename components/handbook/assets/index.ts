// Inline `<style>` / `<script>` payloads for the handbook chrome, read at build
// time the same way components/post/assets/index.ts serves the post chrome.
import fs from "node:fs";
import path from "node:path";

const DIR = path.join(process.cwd(), "components/handbook/assets");
const cache = new Map<string, string>();
// Re-read on every request in `next dev` so edits show up without a restart.
const CACHE = process.env.NODE_ENV === "production";

function asset(file: string): string {
  let text = CACHE ? cache.get(file) : undefined;
  if (text === undefined) {
    text = fs.readFileSync(path.join(DIR, file), "utf8");
    cache.set(file, text);
  }
  return text;
}

export const handbookCss = () => asset("handbook.css");
export const handbookJs = () => asset("handbook.client.js");
