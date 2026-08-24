// Markdown → HTML pipeline replacing kramdown (GFM input, auto_ids, rouge).
// NOTE: baseline implementation — the markdown-parity workstream hardens this
// to match Jekyll's output (kramdown heading-id algorithm, rouge-compatible
// highlight markup, toc_filter.rb and link_attributes.rb behavior).
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";

export interface TocEntry {
  id: string;
  text: string;
  level: number; // 2 or 3
}

export interface RenderedMarkdown {
  html: string;
  toc: TocEntry[];
}

export async function renderMarkdown(md: string): Promise<RenderedMarkdown> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeStringify)
    .process(md);
  return { html: String(file), toc: [] };
}
