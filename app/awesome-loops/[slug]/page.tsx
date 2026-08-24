// Loop detail pages — the `_loops` collection under
// `permalink: /awesome-loops/:path/`, rendered by `_layouts/loop.html`.
//
// `<body class="loop-shell">` comes from SiteShell's bodyClass prop.
import { notFound } from "next/navigation";
import { linkTitle } from "@/components/lib/jekyll";
import { pageMeta } from "@/components/lib/page-meta";
import { loopSocialImage } from "@/components/lib/post-extras";
import { relatedLoops, sortedLoops, type Loop } from "@/components/loops/loop-data";
import SiteShell from "@/components/site/SiteShell";
import { renderMarkdown } from "@/lib/markdown";

const REPO = "https://github.com/subramanya1997/subramanya1997.github.io";

export function generateStaticParams() {
  return sortedLoops().map((loop) => ({ slug: loop.slug }));
}

/**
 * The `<script type="application/json" id="loop-export-data">` payload, laid
 * out exactly as the Liquid wrote it (`{{ … | jsonify }}` per line).
 */
function exportData(loop: Loop, instructions: string): string {
  const fields: [string, unknown][] = [
    ["slug", loop.slug],
    ["title", loop.title],
    ["excerpt", loop.excerpt],
    ["category", loop.category ?? null],
    ["trigger", loop.trigger ?? null],
    ["cadence", loop.cadence ?? null],
    ["tooling", loop.tooling ?? null],
    ["proof", loop.proof ?? null],
    ["stop", loop.stop ?? null],
    ["memory", loop.memory ?? null],
    ["attribution", loop.attribution ?? null],
    ["tags", loop.tags.length > 0 ? loop.tags : null],
    ["links", loop.links],
    ["instructions", instructions],
  ];
  const body = fields
    .map(([key, value]) => `          ${JSON.stringify(key)}: ${JSON.stringify(value)}`)
    .join(",\n");
  return `\n        {\n${body}\n        }\n      `;
}

export default async function LoopPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const loop = sortedLoops().find((candidate) => candidate.slug === slug);
  if (!loop) notFound();

  const { html } = await renderMarkdown(loop.content);
  // `content | replace_first: '<h2 id="loop">Loop</h2>', ''`
  const body = html.replace('<h2 id="loop">Loop</h2>', "");

  const meta = pageMeta({
    title: loop.title,
    url: loop.url,
    description: loop.excerpt,
    image: loopSocialImage(loop.slug),
    stylesheets: ["/assets/css/pages/loop-marketplace.css"],
    scripts: ["/assets/js/pages/loop-marketplace.js"],
  });

  const metaTags = [
    loop.category,
    loop.attribution,
    ...loop.tags.slice(0, 3),
  ].filter((value): value is string => Boolean(value));

  return (
    <SiteShell meta={meta} layout="default" bodyClass="loop-shell">
      <article className="loop-detail">
        <div className="loop-detail-topbar">
          <nav className="loop-breadcrumbs" aria-label="Breadcrumb">
            <ol>
              <li>
                <a href="/awesome-loops/" data-preserve-lang="" title="Loops">
                  Loops
                </a>
              </li>
              <li aria-current="page">{loop.title}</li>
            </ol>
          </nav>
          <div className="loop-detail-actions">
            <details className="loop-add-menu">
              <summary>
                <span className="loop-action-icon-stack" aria-hidden="true">
                  <img src="/assets/images/logos/cursor.svg" alt="" width="16" height="16" />
                  <img src="/assets/images/logos/claude.svg" alt="" width="16" height="16" />
                  <img src="/assets/images/logos/openai.svg" alt="" width="16" height="16" />
                </span>
                <strong>Try now</strong>
              </summary>
              <div className="loop-add-menu-popover">
                <button
                  type="button"
                  className="loop-platform-card loop-platform-card-cursor"
                  data-loop-open="cursor-rule"
                >
                  <img
                    src="/assets/images/logos/cursor.svg"
                    alt=""
                    aria-hidden="true"
                    width="20"
                    height="20"
                  />
                  <span>
                    <strong>Cursor</strong>
                  </span>
                </button>
                <button type="button" className="loop-platform-card" data-loop-open="claude">
                  <img
                    src="/assets/images/logos/claude.svg"
                    alt=""
                    aria-hidden="true"
                    width="20"
                    height="20"
                  />
                  <span>
                    <strong>Claude</strong>
                  </span>
                </button>
                <button type="button" className="loop-platform-card" data-loop-open="codex">
                  <img
                    src="/assets/images/logos/openai.svg"
                    alt=""
                    aria-hidden="true"
                    width="20"
                    height="20"
                  />
                  <span>
                    <strong>Codex</strong>
                  </span>
                </button>
              </div>
            </details>
            <button type="button" className="loop-copy-action" data-loop-copy="">
              Copy
            </button>
            <a
              className="loop-edit-action"
              href={`${REPO}/edit/main/${loop.sourcePath}`}
              rel="noopener noreferrer"
              target="_blank"
              title="Edit"
            >
              Edit
            </a>
          </div>
        </div>

        <section className="loop-detail-layout">
          <div className="post loop-main-panel">
            <header className="loop-detail-header">
              <h1>{loop.title}</h1>
              <p>{loop.excerpt}</p>
              <div className="loop-detail-tags" aria-label="Loop metadata">
                {metaTags.map((value) => (
                  <span key={value}>{value}</span>
                ))}
                {(loop.links ?? []).slice(0, 2).map((link) => (
                  <a key={link.url} href={link.url} rel="noopener noreferrer">
                    {link.title ?? "Resource"}
                  </a>
                ))}
              </div>
              <p className="loop-export-status" id="loop-export-status" aria-live="polite"></p>
            </header>

            <script
              type="application/json"
              id="loop-export-data"
              dangerouslySetInnerHTML={{ __html: exportData(loop, html.trim()) }}
            />

            <article
              className="post-content loop-body"
              dangerouslySetInnerHTML={{ __html: `\n        ${body}\n      ` }}
            />
          </div>

          <aside className="loop-related" aria-label="Related automation loops">
            <div className="loop-related-header">
              <span>Related loops</span>
            </div>
            {relatedLoops(loop).map((related) => (
              <a
                className="loop-related-item"
                href={related.url}
                key={related.url}
                title={linkTitle(`${related.title} ${related.excerpt}`)}
              >
                <strong>{related.title}</strong>
                <span>{related.excerpt}</span>
              </a>
            ))}
          </aside>
        </section>
      </article>
    </SiteShell>
  );
}
