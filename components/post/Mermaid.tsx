// Mermaid runtime — pulled in by PostLayout when the post sets `mermaid: true`
// in front matter (the fenced ```mermaid blocks themselves are rendered by
// lib/markdown.ts as `.language-mermaid`).
import { mermaidCss, mermaidJs } from "./assets";

export default function Mermaid() {
  return (
    <>
      {/* `defer` keeps it off the render path; the inline runtime below only
          touches `mermaid` inside its DOMContentLoaded handler, which fires
          after every deferred script has executed. */}
      <script defer src="https://unpkg.com/mermaid@10.9.0/dist/mermaid.min.js"></script>
      <script dangerouslySetInnerHTML={{ __html: mermaidJs() }} />
      <style dangerouslySetInnerHTML={{ __html: mermaidCss() }} />
    </>
  );
}
