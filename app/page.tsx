// Port of index.html (layout: default).
import { Fragment } from "react";
import BookCard from "@/components/cards/BookCard";
import PostCard from "@/components/cards/PostCard";
import { applyLinkAttributes, readingTime } from "@/components/lib/jekyll";
import { pageMeta } from "@/components/lib/page-meta";
import { getAbout, getSiteConfig, viewsFor } from "@/components/lib/site-data";
import SiteShell from "@/components/site/SiteShell";
import { getAllBooks, getAllPosts } from "@/lib/content";
import { memoizedHtml } from "@/lib/nonhtml";

const meta = pageMeta({
  url: "/",
});

export default async function Home() {
  const site = getSiteConfig();
  const about = getAbout();
  const books = getAllBooks();
  const posts = getAllPosts();

  const readingTimes = await Promise.all(
    posts.map(async (post) => readingTime(await memoizedHtml(post.url, post.content)))
  );

  return (
    <SiteShell meta={meta} layout="default">
      <div className="index-container">
        <div className="profile-card">
          <div className="profile-content">
            <h1 className="section-heading">About</h1>
            <p>{about.bio}</p>
            <p dangerouslySetInnerHTML={{ __html: applyLinkAttributes(about.history, site.url) }} />
            <div className="profile-links">
              <a href={`mailto:${site.email}`} title="Email">
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
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                Email
              </a>
              <a href={about.cv_file} title="CV">
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
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                CV
              </a>
              <a
                href={`https://github.com/${about.github_username}`}
                target="_blank"
                rel="noopener"
                title="Github"
              >
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
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                </svg>
                Github
              </a>
              <a
                href={`https://www.linkedin.com/in/${about.linkedin_username}`}
                target="_blank"
                rel="noopener"
                title="LinkedIn"
              >
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
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                  <rect x="2" y="9" width="4" height="12"></rect>
                  <circle cx="4" cy="4" r="2"></circle>
                </svg>
                LinkedIn
              </a>
            </div>
          </div>
          <div className="profile-image">
            <img
              alt="profile photo"
              src="/assets/images/profile_picture.webp"
              loading="lazy"
              className="profile-img"
            />
          </div>
        </div>

        <div className="content-section">
          <h2 className="section-heading">Books</h2>
          <div className="books-list">
            {books.map((book, index) => (
              <Fragment key={book.slug}>
                <BookCard book={book} dateMode="iso" />
                {index < books.length - 1 ? <hr className="book-divider" /> : null}
              </Fragment>
            ))}
          </div>
        </div>

        <div className="content-section">
          <h2 className="section-heading">Blog</h2>

          <div className="blog-posts">
            {posts.map((post, index) => (
              <Fragment key={post.url}>
                <PostCard
                  post={post}
                  postViews={viewsFor(post.url)}
                  dateMode="human"
                  readingTime={readingTimes[index]}
                />
                {index < posts.length - 1 ? <hr className="post-divider" /> : null}
              </Fragment>
            ))}
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
