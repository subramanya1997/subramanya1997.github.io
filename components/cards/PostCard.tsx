// Port of _includes/components/post-card.html.
import { applyLinkAttributes, humanDate, isoDate, linkTitle } from "@/components/lib/jekyll";
import { getSiteConfig } from "@/components/lib/site-data";
import { slugifyTag, type Post } from "@/lib/content";

// The Jekyll markup puts a plain `title` attribute on the <svg>; React's SVG
// prop types do not declare it, so it is spread in.
const VIEWS_ICON_TITLE = { title: "Total views" } as React.SVGProps<SVGSVGElement>;

export interface PostCardProps {
  post: Post;
  /** Matching entry from content/data/view_count.json, when the post has one. */
  postViews?: number;
  dateMode: "human" | "iso";
  /** Result of components/lib/jekyll#readingTime on the post's rendered HTML. */
  readingTime: string;
}

export default function PostCard({ post, postViews, dateMode, readingTime }: PostCardProps) {
  const tags = post.frontmatter.tags ?? [];
  const excerpt = applyLinkAttributes(String(post.frontmatter.excerpt ?? ""), getSiteConfig().url);

  return (
    <div className="blog-post">
      <div className="post-meta">
        {dateMode === "human" ? (
          <span className="post-date">{humanDate(post.date)}</span>
        ) : (
          <span className="post-date" data-date={isoDate(post.date)}>
            {isoDate(post.date)}
          </span>
        )}

        <span className="post-reading-time">
          {postViews !== undefined ? (
            <>
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
                className="views-icon"
                {...VIEWS_ICON_TITLE}
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              <span className="views-count">{postViews}</span>
            </>
          ) : null}
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
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          {`${readingTime} `}
        </span>
      </div>

      <h2 className="post-title">
        <a href={post.url} data-preserve-lang="" title={linkTitle(post.frontmatter.title)}>
          {post.frontmatter.title}
        </a>
      </h2>

      {tags.length > 0 ? (
        <div className="post-tags">
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

      <div className="post-excerpt" dangerouslySetInnerHTML={{ __html: excerpt }} />

      <a
        href={post.url}
        className="continue-reading"
        data-preserve-lang=""
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
    </div>
  );
}
