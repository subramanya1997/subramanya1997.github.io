// Port of _includes/mermaid.html — pulled in by `_layouts/post.html` when the
// post sets `mermaid: true` in front matter (the fenced ```mermaid blocks
// themselves are rendered by lib/markdown.ts as `.language-mermaid`).
import { includeScript, includeStyle } from "@/components/lib/includes";

export default function Mermaid() {
  return (
    <>
      <script src="https://unpkg.com/mermaid@10.9.0/dist/mermaid.min.js"></script>
      <script dangerouslySetInnerHTML={{ __html: includeScript("mermaid.html") }} />
      <style dangerouslySetInnerHTML={{ __html: includeStyle("mermaid.html") }} />
    </>
  );
}
