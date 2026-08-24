// Port of blog.md (layout: page, custom_layout: true).
import { Fragment } from "react";
import PostCard from "@/components/cards/PostCard";
import { readingTime } from "@/components/lib/jekyll";
import { pageMeta } from "@/components/lib/page-meta";
import { viewsFor } from "@/components/lib/site-data";
import PageLayout from "@/components/site/PageLayout";
import { getAllPosts } from "@/lib/content";
import { memoizedHtml } from "@/lib/nonhtml";

const meta = pageMeta({
  title: "Blog",
  url: "/blog/",
  customLayout: true,
});

export default async function BlogIndex() {
  const posts = getAllPosts();
  const readingTimes = await Promise.all(
    posts.map(async (post) => readingTime(await memoizedHtml(post.url, post.content)))
  );

  return (
    <PageLayout meta={meta}>
      <div className="blog-container">
        <header className="index-header">
          <h1>{meta.title}</h1>
        </header>
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
    </PageLayout>
  );
}
