// Tag archives — `_plugins/tag_pages_generator.rb#TagArchivePage` rendering
// `_includes/tag-archive.html` through `layout: page` with `custom_layout`.
import { Fragment } from "react";
import BookCard from "@/components/cards/BookCard";
import PostCard from "@/components/cards/PostCard";
import { linkTitle, readingTime } from "@/components/lib/jekyll";
import { pageMeta } from "@/components/lib/page-meta";
import { urlEncode } from "@/components/lib/post-extras";
import { getTagArchives, viewsFor, type TagArchive } from "@/components/lib/site-data";
import PageLayout from "@/components/site/PageLayout";
import { memoizedHtml } from "@/lib/nonhtml";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return getTagArchives().map((tag) => ({ tag: tag.slug }));
}

const plural = (count: number, noun: string) => `${count} ${noun}${count !== 1 ? "s" : ""}`;

export default async function TagArchivePage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag: slug } = await params;
  const tag = getTagArchives().find((candidate) => candidate.slug === slug);
  if (!tag) notFound();

  const readingTimes = await Promise.all(
    tag.posts.map(async (post) => readingTime(await memoizedHtml(post.url, post.content)))
  );

  const meta = pageMeta({
    title: tag.name,
    url: `/tags/${tag.slug}/`,
    description: `Posts and books tagged ${tag.name}.`,
    customLayout: true,
  });

  return (
    <PageLayout meta={meta}>
      <TagArchiveBody tag={tag} readingTimes={readingTimes} />
    </PageLayout>
  );
}

function TagArchiveBody({
  tag,
  readingTimes,
}: {
  tag: TagArchive;
  readingTimes: string[];
}) {
  return (
    <div className="tags-page tags-archive">
      <div className="tags-shell">
        <header className="tags-hero tags-hero--archive">
          <a className="tags-backlink" href="/tags/" data-preserve-lang="" title="All tags">
            All tags
          </a>
          <p className="tags-overline">Topic archive</p>
          <h1>{tag.name}</h1>
          <p className="tags-summary">
            {`${plural(tag.total_count, "item")} grouped under this topic.`}
          </p>
          <div className="tag-archive-actions">
            {tag.post_count > 0 ? (
              <a className="tag-archive-pill" href="#posts">
                {plural(tag.post_count, "post")}
              </a>
            ) : null}
            {tag.book_count > 0 ? (
              <a className="tag-archive-pill" href="#books">
                {plural(tag.book_count, "book")}
              </a>
            ) : null}
            <a
              className="tags-secondary-link"
              href={`/search/?q=${urlEncode(tag.name)}`}
              data-preserve-lang=""
              title={linkTitle("Search this topic")}
            >
              Search this topic
            </a>
          </div>
        </header>

        {tag.post_count > 0 ? (
          <section className="tag-results-section" id="posts">
            <div className="tag-results-header">
              <h2 className="tag-results-title">Posts</h2>
              <p className="tag-results-copy">{plural(tag.post_count, "matching essay")}</p>
            </div>
            <div className="blog-posts">
              {tag.posts.map((post, index) => (
                <Fragment key={post.url}>
                  <PostCard
                    post={post}
                    postViews={viewsFor(post.url)}
                    dateMode="human"
                    readingTime={readingTimes[index]}
                  />
                  {index < tag.posts.length - 1 ? <hr className="post-divider" /> : null}
                </Fragment>
              ))}
            </div>
          </section>
        ) : null}

        {tag.book_count > 0 ? (
          <section className="tag-results-section" id="books">
            <div className="tag-results-header">
              <h2 className="tag-results-title">Books</h2>
              <p className="tag-results-copy">
                {plural(tag.book_count, "matching reading note")}
              </p>
            </div>
            <div className="books-list">
              {tag.books.map((book, index) => (
                <Fragment key={book.url}>
                  <BookCard book={book} dateMode="human" />
                  {index < tag.books.length - 1 ? <hr className="book-divider" /> : null}
                </Fragment>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
