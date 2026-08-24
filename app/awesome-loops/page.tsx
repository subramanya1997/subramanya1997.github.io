// Port of awesome-loops/index.md — the loop marketplace listing
// (layout: page, custom_layout: true).
//
// `<body class="loop-shell">` comes from SiteShell's bodyClass prop.
import { stripHtml } from "@/components/lib/jekyll";
import { pageMeta } from "@/components/lib/page-meta";
import { sortedLoops, type Loop } from "@/components/loops/loop-data";
import PageLayout from "@/components/site/PageLayout";
import { renderMarkdown } from "@/lib/markdown";

const REPO = "https://github.com/subramanya1997/subramanya1997.github.io";

const meta = pageMeta({
  title: "Loops",
  url: "/awesome-loops/",
  description: "Automation loops for Claude, Cursor, and Codex.",
  image: "/assets/images/og/awesome-loops.png",
  customLayout: true,
  scripts: ["/assets/js/pages/loop-marketplace.js"],
});

/**
 * `loop_search_text`: every searchable field concatenated, downcased, then
 * `strip_html`. Liquid's `append` stringifies the tag array with Ruby's
 * `Array#to_s`, and a nil `links` appends nothing.
 */
function searchText(loop: Loop, renderedContent: string): string {
  const tags = loop.tags.length > 0 ? `[${loop.tags.map((t) => `"${t}"`).join(", ")}]` : "";
  const parts = [
    loop.title,
    loop.excerpt,
    renderedContent,
    loop.category ?? "",
    loop.tooling ?? "",
    loop.proof ?? "",
    loop.stop ?? "",
    loop.attribution ?? "",
    tags,
    "",
  ];
  return stripHtml(parts.join(" ").toLowerCase());
}

export default async function AwesomeLoops() {
  const loops = sortedLoops();
  const rendered = await Promise.all(
    loops.map(async (loop) => (await renderMarkdown(loop.content)).html)
  );

  // `site.loops | where_exp: "loop", "loop.category" | map: "category" | uniq | sort`
  const categories = [...new Set(loops.map((loop) => loop.category).filter(Boolean))].sort(
    (a, b) => (a! < b! ? -1 : a! > b! ? 1 : 0)
  ) as string[];

  return (
    <PageLayout meta={meta} bodyClass="loop-shell">
      <div className="loop-marketplace" data-github-issue-url={`${REPO}/issues/new`}>
        <header className="loop-hero">
          <div className="loop-hero-copy">
            <p className="loop-eyebrow">awesome-loops</p>
            <h1>Automation loops for Claude, Cursor, and Codex</h1>
            <p>
              Open them in Claude, add them to Cursor, or launch them with Codex. Every
              submission is a Markdown automation reviewed through GitHub.
            </p>
          </div>
          <div className="loop-hero-panel">
            <div className="loop-platform-strip" aria-label="Supported platforms">
              <span>
                <img
                  src="/assets/images/logos/claude.svg"
                  alt=""
                  aria-hidden="true"
                  width="18"
                  height="18"
                />
                Claude
              </span>
              <span>
                <img
                  src="/assets/images/logos/cursor.svg"
                  alt=""
                  aria-hidden="true"
                  width="18"
                  height="18"
                />
                Cursor
              </span>
              <span>
                <img
                  src="/assets/images/logos/openai.svg"
                  alt=""
                  aria-hidden="true"
                  width="18"
                  height="18"
                />
                Codex
              </span>
            </div>
            <div className="loop-hero-actions">
              <a href="#submit-loop" className="loop-primary-action">
                Create automation
              </a>
              <a
                href={`${REPO}/tree/main/content/loops`}
                rel="noopener noreferrer"
                target="_blank"
                title="Browse Markdown"
              >
                Browse Markdown
              </a>
            </div>
          </div>
        </header>

        <section className="loop-toolbar" aria-label="Marketplace filters">
          <input
            id="loop-search"
            type="search"
            placeholder="Search automations"
            autoComplete="off"
            aria-label="Search automations"
          />

          {categories.length > 0 ? (
            <select id="loop-category" aria-label="Filter by category">
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category.toLowerCase()}>
                  {category}
                </option>
              ))}
            </select>
          ) : null}
        </section>

        <section className="loop-listings" aria-label="Automation loop listings">
          {loops.map((loop, index) => (
            <article
              className="loop-card"
              key={loop.url}
              data-category={(loop.category ?? "").toLowerCase()}
              data-search={searchText(loop, rendered[index])}
            >
              <div className="loop-card-top">
                {loop.category ? <span className="loop-card-pill">{loop.category}</span> : null}
              </div>

              <h2>
                <a href={loop.url} title={loop.title}>
                  {loop.title}
                </a>
              </h2>
              <p>{loop.excerpt}</p>

              {loop.tags.length > 0 ? (
                <div className="loop-tags" aria-label="Tags">
                  {loop.tags.slice(0, 3).map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              ) : null}

              <div className="loop-card-footer">
                <span>{loop.attribution ?? loop.category ?? "Markdown automation"}</span>
              </div>
            </article>
          ))}
        </section>

        <section className="loop-submit" id="submit-loop">
          <form className="loop-submit-form" id="loop-submit-form" noValidate>
            <div className="loop-submit-header">
              <div className="loop-submit-title">
                <h2>Create automation loop</h2>
              </div>
              <div className="loop-submit-tabs" role="tablist" aria-label="Submission view">
                <button
                  type="button"
                  id="loop-form-tab"
                  className="is-active"
                  role="tab"
                  aria-selected="true"
                  aria-controls="loop-form-panel"
                  data-loop-submit-tab="form"
                >
                  Form
                </button>
                <button
                  type="button"
                  id="loop-markdown-tab"
                  role="tab"
                  aria-selected="false"
                  aria-controls="loop-markdown-panel"
                  data-loop-submit-tab="markdown"
                >
                  Markdown
                </button>
              </div>
            </div>

            <input
              type="text"
              name="company"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="loop-honeypot"
            />

            <div
              className="loop-submit-pane"
              id="loop-form-panel"
              role="tabpanel"
              aria-labelledby="loop-form-tab"
            >
              <div className="loop-form-row">
                <label htmlFor="loop-title">Title *</label>
                <input
                  id="loop-title"
                  name="title"
                  required
                  maxLength={90}
                  placeholder="The production error sweep"
                />
              </div>

              <div className="loop-form-row">
                <label htmlFor="loop-excerpt">Description optional</label>
                <textarea
                  id="loop-excerpt"
                  name="excerpt"
                  rows={2}
                  maxLength={220}
                  placeholder="Leave blank to derive this from the instructions."
                ></textarea>
              </div>

              <div className="loop-form-row">
                <label htmlFor="loop-tags-input">Tags optional</label>
                <input
                  id="loop-tags-input"
                  name="tags"
                  placeholder="engineering, logs, pr-review"
                />
              </div>

              <div className="loop-form-row">
                <label htmlFor="loop-instructions">Loop instructions *</label>
                <textarea
                  id="loop-instructions"
                  name="instructions"
                  required
                  rows={9}
                  placeholder="Paste the prompt or operating instructions. Keep secrets, private code, and private customer data out."
                ></textarea>
              </div>

              <label className="loop-checkbox">
                <input type="checkbox" name="rights" required />
                <span>
                  I have the right to share this loop and understand it may be edited before
                  publication.
                </span>
              </label>
            </div>

            <pre
              className="loop-markdown-preview"
              id="loop-markdown-panel"
              role="tabpanel"
              aria-labelledby="loop-markdown-tab"
              hidden
            >
              <code id="loop-markdown-preview"></code>
            </pre>

            <div className="loop-form-actions">
              <button type="submit">Create submission issue</button>
            </div>
            <p className="loop-submit-note" id="loop-submit-note" aria-live="polite">
              Submit opens a GitHub issue. A repository workflow turns the issue into a PR.
            </p>
          </form>
        </section>
      </div>
    </PageLayout>
  );
}
