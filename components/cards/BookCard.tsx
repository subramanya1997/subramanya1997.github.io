// Port of _includes/components/book-card.html.
import { applyLinkAttributes, humanDate, isoDate, linkTitle } from "@/components/lib/jekyll";
import { getSiteConfig } from "@/components/lib/site-data";
import { slugifyTag, type CollectionDoc } from "@/lib/content";

export interface BookCardProps {
  book: CollectionDoc;
  dateMode: "human" | "iso";
}

export default function BookCard({ book, dateMode }: BookCardProps) {
  const fm = book.frontmatter as {
    title: string;
    excerpt?: string;
    date?: string | Date;
    tags?: string[];
    web_url?: string;
  };
  const date = fm.date instanceof Date ? fm.date : new Date(`${String(fm.date)}T00:00:00Z`);
  const tags = fm.tags ?? [];
  const bookLink = fm.web_url ?? book.url;

  return (
    <div className="book-entry">
      <div className="book-meta">
        {dateMode === "human" ? (
          <span className="book-date">{humanDate(date)}</span>
        ) : (
          <span className="book-date">{isoDate(date)}</span>
        )}
      </div>

      <h2 className="book-title">
        <a href={bookLink} data-preserve-lang="" title={linkTitle(fm.title)}>
          {fm.title}
        </a>
      </h2>

      {tags.length > 0 ? (
        <div className="book-tags">
          {tags.map((tag) => (
            <a
              key={tag}
              className="tag"
              href={`/tags/${slugifyTag(tag)}/#books`}
              data-preserve-lang=""
              title={linkTitle(tag)}
            >
              {tag}
            </a>
          ))}
        </div>
      ) : null}

      <div className="book-excerpt" dangerouslySetInnerHTML={{ __html: applyLinkAttributes(String(fm.excerpt ?? ""), getSiteConfig().url) }} />

      <a
        href={bookLink}
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
