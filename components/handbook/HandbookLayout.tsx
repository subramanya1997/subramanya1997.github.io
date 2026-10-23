// Layout for every handbook page: the site shell (header, footer, theme,
// newsletter) around a book rail, the article, and the post "On this page"
// rail. The post chrome (header styles, prev/next, copy-page, lightbox, TOC)
// is reused as-is; components/handbook/assets adds the book-specific pieces.
import type { ReactNode } from "react";
import { readingTime } from "@/lib/text";
import { slugifyHeading } from "@/lib/markdown";
import type { PageMeta } from "@/lib/page-meta";
import { getSiteConfig } from "@/lib/site-data";
import Lightbox from "@/components/post/Lightbox";
import Toc from "@/components/post/Toc";
import { postChromeCss, postLayoutCss } from "@/components/post/assets";
import Newsletter from "@/components/site/Newsletter";
import SiteShell from "@/components/site/SiteShell";
import {
  HANDBOOK_AUTHOR,
  HANDBOOK_BASE,
  HANDBOOK_SHORT_TITLE,
  HANDBOOK_TITLE,
  handbookChapterOf,
  handbookChapters,
  handbookNeighbours,
  handbookPages,
  handbookPosition,
  handbookTwinUrl,
  type HandbookPage,
} from "@/lib/handbook";
import { handbookCss, handbookJs } from "./assets";
import HandbookSearch from "./HandbookSearch";

const HOUSING_NOTE =
  "Apartment pricing and availability change frequently. Use the figures here as a starting point and verify current terms directly with each property.";

type Node = Record<string, unknown>;

// Restores the chapters a reader collapsed (localStorage) before first paint.
// The chapter being read always stays open. Runs inline right after the nav.
const NAV_STATE_SCRIPT = `
  (function() {
    try {
      var closed = JSON.parse(localStorage.getItem('hb-nav-closed') || '[]');
      document.querySelectorAll('.hb-nav details[data-chapter]').forEach(function(group) {
        var id = group.getAttribute('data-chapter');
        if (id !== '__CURRENT__' && closed.indexOf(id) !== -1) group.removeAttribute('open');
      });
    } catch (e) {}
  })();
`;

function structuredData(page: HandbookPage, heading: string): Node[] {
  const site = getSiteConfig();
  const canonical = `${site.url}${page.url}`;
  const author = { "@type": "Person", name: HANDBOOK_AUTHOR, url: `${site.url}/` };
  const book: Node = {
    "@type": "Book",
    "@id": `${site.url}${HANDBOOK_BASE}#book`,
    name: HANDBOOK_TITLE,
    url: `${site.url}${HANDBOOK_BASE}`,
    author,
    inLanguage: "en",
  };

  const crumbs: Node[] = [
    { "@type": "ListItem", position: 1, name: "Subramanya N", item: site.url },
    { "@type": "ListItem", position: 2, name: "Books", item: `${site.url}/books/` },
    {
      "@type": "ListItem",
      position: 3,
      name: HANDBOOK_SHORT_TITLE,
      item: `${site.url}${HANDBOOK_BASE}`,
    },
  ];

  if (page.route === "") {
    const primary: Node = {
      ...book,
      description: page.description,
      numberOfPages: handbookPages().length,
      hasPart: handbookChapters().map((chapter) => ({
        "@type": "Chapter",
        name: chapter.page.navTitle,
        url: `${site.url}${chapter.page.url}`,
      })),
    };
    return [primary, { "@type": "BreadcrumbList", itemListElement: crumbs }];
  }

  crumbs.push({ "@type": "ListItem", position: 4, name: page.title.split(" | ")[0], item: canonical });
  return [
    {
      "@type": "Article",
      headline: page.title.split(" | ")[0],
      name: heading,
      description: page.description,
      url: canonical,
      mainEntityOfPage: canonical,
      author,
      isPartOf: book,
      inLanguage: "en",
    },
    { "@type": "BreadcrumbList", itemListElement: crumbs },
  ];
}

export function handbookMeta(page: HandbookPage, heading: string): PageMeta {
  return {
    title: heading,
    fullTitle: page.title,
    description: page.description,
    url: page.url,
    markdownUrl: handbookTwinUrl(page),
    ogType: page.route === "" ? "book" : "article",
    robots: "index, follow, max-image-preview:large",
    jsonLd: structuredData(page, heading),
  };
}

function BookRail({ current }: { current: HandbookPage }) {
  return (
    <aside className="hb-sidebar" id="hb-sidebar" aria-label="Handbook">
      <a className="hb-brand" href={HANDBOOK_BASE}>
        <span className="hb-overline">Handbook</span>
        <span className="hb-brand-title">Navigating UMass Amherst</span>
      </a>

      <HandbookSearch id="hb-search-rail" />

      {/* handbook.client.js sets data-fade (scroll-edge fades) on this, which
          can land before React hydrates in a slow dev build. */}
      <nav className="hb-nav" aria-label="Handbook contents" suppressHydrationWarning>
        <ol>
          {handbookChapters().map((chapter, index) => (
            <li key={chapter.page.file} className="hb-nav-group">
              {/* Headers only toggle; the chapter's own page is its first
                  item. suppressHydrationWarning: NAV_STATE_SCRIPT may restore
                  a collapsed state before React hydrates. */}
              <details open data-chapter={index} suppressHydrationWarning>
                <summary className="hb-nav-summary">
                  <span className="hb-nav-num">{String(index + 1).padStart(2, "0")}</span>
                  <span className="hb-nav-label">
                    {index === 0 ? "Introduction" : chapter.page.navTitle}
                  </span>
                  <span className="hb-nav-count" aria-hidden="true">
                    {chapter.articles.length + 1}
                  </span>
                  <svg className="hb-nav-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </summary>
                <ol className="hb-nav-articles">
                  {[chapter.page, ...chapter.articles].map((item) => (
                    <li key={item.file}>
                      <a
                        className="hb-nav-link"
                        href={item.url}
                        aria-current={item.route === current.route ? "page" : undefined}
                      >
                        {item === chapter.page ? (index === 0 ? "Welcome" : "Overview") : item.navTitle}
                      </a>
                    </li>
                  ))}
                </ol>
              </details>
            </li>
          ))}
        </ol>
      </nav>
      <script
        dangerouslySetInnerHTML={{ __html: NAV_STATE_SCRIPT.replace("__CURRENT__", String(current.chapter)) }}
      />

      <p className="hb-sidebar-foot">
        Written by <a href="/">{HANDBOOK_AUTHOR}</a> with help from friends.{" "}
        <a href={`${HANDBOOK_BASE}introduction/contribute.html`}>Suggest an edit</a>.
      </p>
    </aside>
  );
}

function CopyPageButton() {
  return (
    <div className="copy-page-wrapper">
      <button className="copy-page-btn" id="copyPageBtn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="9" y="9" width="13" height="13" rx="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        <span>Copy Page</span>
      </button>
      <button className="copy-dropdown-toggle" id="copyDropdownToggle" aria-label="More options">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
      <div className="copy-dropdown" id="copyDropdown">
        <button className="copy-option" data-ai="claude">
          <img src="/assets/images/logos/claude.svg" alt="Claude" className="ai-logo" width={14} height={14} loading="lazy" decoding="async" />
          Open in Claude
        </button>
        <button className="copy-option" data-ai="chatgpt">
          <img src="/assets/images/logos/openai.svg" alt="OpenAI" className="ai-logo" width={14} height={14} loading="lazy" decoding="async" />
          Open in ChatGPT
        </button>
      </div>
    </div>
  );
}

export interface HandbookLayoutProps {
  page: HandbookPage;
  heading: string;
  contentHtml: string;
  /** Landing page: replaces the standard article header. */
  hero?: ReactNode;
  /** Extra blocks after the article body (landing page chapter cards). */
  after?: ReactNode;
}

export default function HandbookLayout({
  page,
  heading,
  contentHtml,
  hero,
  after,
}: HandbookLayoutProps) {
  const site = getSiteConfig();
  const meta = handbookMeta(page, heading);
  const chapter = handbookChapterOf(page);
  const { previous, next } = handbookNeighbours(page);
  const total = handbookPages().length;
  const isLanding = page.route === "";
  const isHousing = page.file.startsWith("off-campus-housing/");
  const shareTarget = { url: `${site.url}${page.url}`, title: heading, excerpt: page.description };
  const chapterLabel = page.chapter === 0 ? "Introduction" : chapter.page.navTitle;

  return (
    <SiteShell meta={meta} layout="page" wrapClassName="hb-wrap" bodyClass="hb-page" newsletterRail={false}>
      <div className="reading-progress-bar" id="reading-progress" suppressHydrationWarning></div>

      <div className="hb" data-hb="">
        <div className="hb-mobile-bar">
          <button
            type="button"
            className="hb-mobile-toggle"
            data-hb-nav-toggle=""
            aria-controls="hb-sidebar"
            aria-expanded="false"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <line x1="4" y1="6" x2="20" y2="6"></line>
              <line x1="4" y1="12" x2="20" y2="12"></line>
              <line x1="4" y1="18" x2="14" y2="18"></line>
            </svg>
            Contents &amp; search
          </button>
          <span className="hb-mobile-title">
            {isLanding ? "Navigating UMass Amherst" : `${chapterLabel} · ${heading}`}
          </span>
        </div>
        <div className="hb-scrim" aria-hidden="true"></div>

        <div className="hb-rail">
          <BookRail current={page} />
        </div>

        <div className="hb-main">
          <nav className="hb-breadcrumbs" aria-label="Breadcrumb">
            <ol>
              <li>
                <a href="/books/">Books</a>
              </li>
              {isLanding ? (
                <li aria-current="page">{HANDBOOK_SHORT_TITLE}</li>
              ) : (
                <>
                  <li>
                    <a href={HANDBOOK_BASE}>{HANDBOOK_SHORT_TITLE}</a>
                  </li>
                  {page.isChapter ? null : (
                    <li>
                      <a href={chapter.page.url}>{chapterLabel}</a>
                    </li>
                  )}
                  <li aria-current="page">{page.navTitle}</li>
                </>
              )}
            </ol>
          </nav>

          <div className="post">
            {hero ?? (
              <header className="post-header">
                <p className="hb-overline">
                  {chapterLabel} · Page {handbookPosition(page)} of {total}
                </p>
                {/* Same id the HonKit build gave the page-title heading, so
                    inbound `#the-boulders`-style anchors still land. */}
                <h1 id={slugifyHeading(heading)}>{heading}</h1>
                <div className="post-meta">
                  <div className="post-meta-info">
                    <div className="post-date-time">
                      <span className="post-reading-time">{readingTime(contentHtml)}</span>
                    </div>
                  </div>
                  <div className="post-meta-actions">
                    <CopyPageButton />
                  </div>
                </div>
              </header>
            )}

            {isHousing ? (
              <div className="hb-callout" role="note">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
                <p>
                  <strong>Data note:</strong> {HOUSING_NOTE}
                </p>
              </div>
            ) : null}

            {/* post-scripts.js (lazy images) may touch the body before React
                hydrates; the HTML is static, so skip the dev-only diff. */}
            <article
              className="post-content"
              suppressHydrationWarning
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />

            {after}


            <div className="post-navigation">
              {previous ? (
                <a className="prev-post" href={previous.url}>
                  <span>Previous</span>
                  <strong>{previous.navTitle}</strong>
                </a>
              ) : (
                <span />
              )}
              {next ? (
                <a className="next-post" href={next.url}>
                  <span>Next</span>
                  <strong>{next.navTitle}</strong>
                </a>
              ) : null}
            </div>

            {/* Below 1280px the right column is hidden; keep the signup in reach. */}
            <div className="hb-newsletter-inline">
              <Newsletter />
            </div>
          </div>
        </div>

        <aside className="post-toc-sidebar">
          <div className="hb-aside">
            <Toc target={shareTarget} />
            <Newsletter />
          </div>
        </aside>
      </div>

      <Lightbox />

      <script src="/assets/js/post-scripts.js" defer />
      <style dangerouslySetInnerHTML={{ __html: postChromeCss() }} />
      <style dangerouslySetInnerHTML={{ __html: postLayoutCss() }} />
      <style dangerouslySetInnerHTML={{ __html: handbookCss() }} />
      <script dangerouslySetInnerHTML={{ __html: handbookJs() }} />
    </SiteShell>
  );
}
