// Port of blog.md (layout: page, custom_layout: true).
import { Fragment } from "react";
import PostCard from "@/components/cards/PostCard";
import { readingTime } from "@/components/lib/jekyll";
import { pageMeta } from "@/components/lib/page-meta";
import { getPostsInJekyllOrder, viewsFor } from "@/components/lib/site-data";
import PageLayout from "@/components/site/PageLayout";
import { renderMarkdown } from "@/lib/markdown";

const meta = pageMeta({
  title: "Blog",
  url: "/blog/",
  customLayout: true,
  stylesheets: [
    "/assets/css/components/content-cards.css",
    "/assets/css/pages/blog-index.css",
  ],
});

export default async function BlogIndex() {
  const posts = getPostsInJekyllOrder();
  const readingTimes = await Promise.all(
    posts.map(async (post) => readingTime((await renderMarkdown(post.content)).html))
  );

  return (
    <PageLayout meta={meta}>
      <div className="blog-container">
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
