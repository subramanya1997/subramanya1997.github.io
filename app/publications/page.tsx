// Port of publications.md (layout: page, custom_layout: true). Books are
// folded into the same list as the papers, one entry format for everything —
// /books/ still resolves on its own, but the nav points here.
import { Fragment } from "react";
import { applyLinkAttributes, linkTitle } from "@/components/lib/jekyll";
import { pageMeta } from "@/components/lib/page-meta";
import { getAbout, getSiteConfig } from "@/components/lib/site-data";
import PageLayout from "@/components/site/PageLayout";
import { getAllBooks } from "@/lib/content";

const meta = pageMeta({
  title: "Publications",
  url: "/publications/",
  description:
    "Papers, standards proposals, and books by Subramanya N on agentic AI identity, authorization, and security.",
  customLayout: true,
});

interface Entry {
  year: number;
  venue: string;
  title: string;
  url: string;
  /** Author line (papers) or excerpt (books); rendered as the excerpt block. */
  bodyHtml: string;
  external: boolean;
}

export default function Publications() {
  const siteUrl = getSiteConfig().url;

  const entries: Entry[] = [
    ...getAbout().publications.map((pub) => ({
      year: Number(pub.year),
      venue: String(pub.venue),
      title: String(pub.title),
      url: String(pub.url),
      bodyHtml: applyLinkAttributes(pub.authors, siteUrl),
      external: true,
    })),
    ...getAllBooks().map((book) => {
      const fm = book.frontmatter as { title: string; excerpt?: string; web_url?: string };
      return {
        year: new Date(String(book.frontmatter.date)).getUTCFullYear(),
        venue: "Book",
        title: fm.title,
        url: fm.web_url ?? book.url,
        bodyHtml: String(fm.excerpt ?? ""),
        external: false,
      };
    }),
  ].sort((a, b) => b.year - a.year);

  return (
    <PageLayout meta={meta}>
      <div className="blog-container">
        <div className="blog-posts">
          {entries.map((entry, index) => {
            const linkProps = entry.external
              ? { target: "_blank", rel: "noopener" }
              : {};
            return (
              <Fragment key={entry.url}>
                <article className="blog-post">
                  <div className="post-meta">
                    <span className="post-date">{`${entry.year} · ${entry.venue}`}</span>
                  </div>

                  <h2 className="post-title">
                    <a href={entry.url} {...linkProps} title={linkTitle(entry.title)}>
                      {entry.title}
                    </a>
                  </h2>

                  <div className="post-excerpt" dangerouslySetInnerHTML={{ __html: entry.bodyHtml }} />

                  <a
                    href={entry.url}
                    className="continue-reading"
                    {...linkProps}
                    title="Continue reading"
                  >
                    Continue reading
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                  </a>
                </article>

                {index < entries.length - 1 ? <hr className="post-divider" /> : null}
              </Fragment>
            );
          })}
        </div>
      </div>
    </PageLayout>
  );
}
