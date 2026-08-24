// Port of search.md (layout: page, custom_layout: true). The behavior lives in
// public/assets/js/pages/search.js + components/discovery.js, loaded verbatim.
import { pageMeta } from "@/components/lib/page-meta";
import PageLayout from "@/components/site/PageLayout";

const meta = pageMeta({
  title: "Search",
  url: "/search/",
  description: "Search posts and books across the archive.",
  robots: "noindex, follow",
  customLayout: true,
  scripts: ["/assets/js/components/discovery.js", "/assets/js/pages/search.js"],
});

export default function Search() {
  return (
    <PageLayout meta={meta}>
      <div className="search-page" data-search-page="">
        <div className="search-shell">
          <header className="search-hero">
            <p className="search-overline">Archive search</p>
            <h1>Search posts and books</h1>
            <p className="search-intro">
              Search across essays, notes, and book writeups by title, excerpt, tag, or full text.
            </p>
          </header>

          <form
            id="search-page-form"
            className="search-form"
            action="/search/"
            method="get"
            role="search"
            data-preserve-lang=""
          >
            <div className="search-input-row">
              <label className="sr-only" htmlFor="search-page-input">
                Search query
              </label>
              <input
                id="search-page-input"
                className="search-input"
                type="search"
                name="q"
                placeholder="Try: AI agents, OIDC, auth, or a tag name"
              />
              <input id="search-kind-input" type="hidden" name="kind" defaultValue="" />
              <button className="search-submit" type="submit">
                Search
              </button>
            </div>

            <div className="search-filters" role="group" aria-label="Filter results by type">
              <button className="search-filter" type="button" data-search-kind="" aria-pressed="true">
                All
              </button>
              <button
                className="search-filter"
                type="button"
                data-search-kind="post"
                aria-pressed="false"
              >
                Posts
              </button>
              <button
                className="search-filter"
                type="button"
                data-search-kind="book"
                aria-pressed="false"
              >
                Books
              </button>
            </div>
          </form>

          <div className="search-meta">
            <p id="search-status" className="search-status">
              Loading search index…
            </p>
            <a className="search-meta-link" href="/tags/" data-preserve-lang="" title="Browse tags">
              Browse tags
            </a>
          </div>

          <div id="search-results" className="search-results" aria-live="polite"></div>
        </div>
      </div>
    </PageLayout>
  );
}
