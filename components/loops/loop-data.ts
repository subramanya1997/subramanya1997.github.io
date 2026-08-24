// Shared shape/ordering helpers for the `_loops` collection.
import { getAllLoops, type CollectionDoc } from "@/lib/content";

export interface Loop {
  slug: string;
  url: string;
  title: string;
  excerpt: string;
  category?: string;
  attribution?: string;
  tags: string[];
  links: { url: string; title?: string }[] | null;
  trigger?: string;
  cadence?: string;
  tooling?: string;
  proof?: string;
  stop?: string;
  memory?: string;
  content: string;
  /** `page.path` — used by the "Edit" link on the detail page. */
  sourcePath: string;
}

function optional(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function toLoop(doc: CollectionDoc): Loop {
  const fm = doc.frontmatter;
  return {
    slug: doc.slug,
    url: doc.url,
    title: String(fm.title ?? ""),
    excerpt: String(fm.excerpt ?? ""),
    category: optional(fm.category),
    attribution: optional(fm.attribution),
    tags: (fm.tags as string[] | undefined) ?? [],
    links: (fm.links as Loop["links"]) ?? null,
    trigger: optional(fm.trigger),
    cadence: optional(fm.cadence),
    tooling: optional(fm.tooling),
    proof: optional(fm.proof),
    stop: optional(fm.stop),
    memory: optional(fm.memory),
    content: doc.content,
    sourcePath: `_loops/${doc.sourcePath.split("/").pop()}`,
  };
}

/** `site.loops | sort: "title"` — Ruby's `<=>` on the title strings. */
export function sortedLoops(): Loop[] {
  return getAllLoops()
    .map(toLoop)
    .sort((a, b) => (a.title < b.title ? -1 : a.title > b.title ? 1 : 0));
}

/**
 * `_layouts/loop.html`: up to four loops in the same category, in title order;
 * if the category matches nothing, the first four other loops instead.
 */
export function relatedLoops(current: Loop): Loop[] {
  const all = sortedLoops();
  const sameCategory = all.filter(
    (loop) => loop.url !== current.url && current.category && loop.category === current.category
  );
  if (sameCategory.length > 0) return sameCategory.slice(0, 4);
  return all.filter((loop) => loop.url !== current.url).slice(0, 4);
}
