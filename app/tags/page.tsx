// Port of tags.md (layout: page, custom_layout: true) — the tag directory.
// Individual tag archives (/tags/<slug>/) come from _includes/tag-archive.html
// and are not part of this route.
import { linkTitle } from "@/components/lib/jekyll";
import { pageMeta } from "@/components/lib/page-meta";
import { getTagArchives } from "@/components/lib/site-data";
import PageLayout from "@/components/site/PageLayout";

const meta = pageMeta({
  title: "Tags",
  url: "/tags/",
  description: "Browse posts and books by topic.",
  customLayout: true,
});

/** The `.tag-directory-meta` text, mirroring the Liquid branch-by-branch. */
function metaText(tag: { total_count: number; post_count: number; book_count: number }): string {
  const items = `${tag.total_count} item${tag.total_count !== 1 ? "s" : ""}`;
  if (tag.post_count > 0 && tag.book_count > 0) {
    return `${items} · ${tag.post_count} posts · ${tag.book_count} books`;
  }
  if (tag.post_count > 0) return `${items} · ${tag.post_count} posts`;
  if (tag.book_count > 0) return `${items} · ${tag.book_count} books`;
  return items;
}

export default function Tags() {
  const tags = getTagArchives();

  return (
    <PageLayout meta={meta}>
      <div className="tags-page">
        <div className="tags-shell">
          <header className="tags-hero">
            <p className="tags-overline">Topic archive</p>
            <h1>Browse by tag</h1>
            <p className="tags-summary">
              Explore recurring topics across essays, notes, and book writeups.
            </p>
            <a
              className="tags-secondary-link"
              href="/search/"
              data-preserve-lang=""
              title="Search the archive"
            >
              Search the archive
            </a>
          </header>

          {tags.length > 0 ? (
            <div className="tag-directory">
              {tags.map((tag) => (
                <a
                  key={tag.slug}
                  className="tag-directory-card"
                  href={`/tags/${tag.slug}/`}
                  data-preserve-lang=""
                  title={linkTitle(`${tag.name} ${metaText(tag)}`)}
                >
                  <span className="tag-directory-name">{tag.name}</span>
                  <span className="tag-directory-meta">{metaText(tag)}</span>
                </a>
              ))}
            </div>
          ) : (
            <div className="tags-empty-state">
              <h2>No tags yet</h2>
              <p>Publish content with tags to build the archive.</p>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
