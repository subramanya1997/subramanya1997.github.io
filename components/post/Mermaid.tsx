// Mermaid runtime — pulled in by PostLayout when the post sets `mermaid: true`
// in front matter (the fenced ```mermaid blocks themselves are rendered by
// lib/markdown.ts as `.language-mermaid`).
import { mermaidCss, mermaidJs } from "./assets";

export default function Mermaid() {
  return (
    <>
      <script src="https://unpkg.com/mermaid@10.9.0/dist/mermaid.min.js"></script>
      <script dangerouslySetInnerHTML={{ __html: mermaidJs() }} />
      <style dangerouslySetInnerHTML={{ __html: mermaidCss() }} />
    </>
  );
}
