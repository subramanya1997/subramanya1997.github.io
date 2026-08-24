// Related-posts rail at the foot of a post.
import { relatedPostsCss } from "./assets";
import { linkTitle, stripHtml } from "@/components/lib/jekyll";
import { shortDate, xmlSchemaDate } from "@/components/lib/post-extras";
import { slugifyTag, type Post } from "@/lib/content";
import { truncateWords } from "@/lib/nonhtml";

export default function RelatedPosts({ posts }: { posts: Post[] }) {
  if (posts.length === 0) return null;

  return (
    <>
      <section className="related-posts">
        <h3 className="related-posts-title">Related Posts</h3>
        <div className="related-posts-grid">
          {posts.map((post) => {
            const excerpt = post.frontmatter.excerpt;
            const tags = (post.frontmatter.tags ?? []).slice(0, 3);
            return (
              <article className="related-post-card" key={post.url}>
                <div className="related-post-content">
                  {/* React 19 emits `dateTime` verbatim; Jekyll wrote `datetime`. */}
                  <time
                    className="related-post-date"
                    {...({ datetime: xmlSchemaDate(post.date) } as React.TimeHTMLAttributes<HTMLTimeElement>)}
                  >
                    {shortDate(post.date)}
                  </time>
                  <h4 className="related-post-title">
                    <a
                      href={post.url}
                      data-preserve-lang=""
                      title={linkTitle(post.frontmatter.title)}
                    >
                      {post.frontmatter.title}
                    </a>
                  </h4>
                  {excerpt ? (
                    <p className="related-post-excerpt">
                      {truncateWords(stripHtml(String(excerpt)), 20)}
                    </p>
                  ) : null}
                  {tags.length > 0 ? (
                    <div className="related-post-tags">
                      {tags.map((tag) => (
                        <a
                          key={tag}
                          className="tag"
                          href={`/tags/${slugifyTag(tag)}/#posts`}
                          data-preserve-lang=""
                          title={linkTitle(tag)}
                        >
                          {tag}
                        </a>
                      ))}
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <style dangerouslySetInnerHTML={{ __html: relatedPostsCss() }} />
    </>
  );
}
