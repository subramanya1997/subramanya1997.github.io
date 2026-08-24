// Port of publications.md (layout: page, custom_layout: true), extended with
// the books list — /books/ still resolves on its own, but the nav points here.
import { Fragment } from "react";
import BookCard from "@/components/cards/BookCard";
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
  stylesheets: [
    "/assets/css/components/content-cards.css",
    "/assets/css/pages/blog-index.css",
    "/assets/css/pages/books-index.css",
  ],
});

export default function Publications() {
  const publications = getAbout().publications;
  const books = getAllBooks();
  const siteUrl = getSiteConfig().url;

  return (
    <PageLayout meta={meta}>
      <div className="blog-container">
        <div className="blog-posts">
          {publications.map((pub, index) => (
            <Fragment key={pub.url}>
              <article className="blog-post">
                <div className="post-meta">
                  <span className="post-date">{`${pub.year} · ${pub.venue}`}</span>
                </div>

                <h2 className="post-title">
                  <a href={pub.url} target="_blank" rel="noopener" title={linkTitle(pub.title)}>
                    {pub.title}
                  </a>
                </h2>

                <div className="post-excerpt" dangerouslySetInnerHTML={{ __html: applyLinkAttributes(pub.authors, siteUrl) }} />

                <a
                  href={pub.url}
                  className="continue-reading"
                  target="_blank"
                  rel="noopener"
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

              {index < publications.length - 1 ? <hr className="post-divider" /> : null}
            </Fragment>
          ))}
        </div>

        <section className="books-container" aria-labelledby="books-heading">
          <header className="index-header">
            <h2 id="books-heading">Books</h2>
          </header>
          <div className="books-list">
            {books.map((book, index) => (
              <Fragment key={book.slug}>
                <BookCard book={book} dateMode="iso" />
                {index < books.length - 1 ? <hr className="book-divider" /> : null}
              </Fragment>
            ))}
          </div>
        </section>
      </div>
    </PageLayout>
  );
}
