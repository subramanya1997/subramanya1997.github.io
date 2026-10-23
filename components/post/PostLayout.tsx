// Blog post layout, rendered inside SiteShell.
// The newsletter card comes from SiteShell's right column, like every page.
import { postChromeCss, postLayoutCss } from "./assets";
import { linkTitle, stripHtml, stripNewlines } from "@/lib/text";
import type { PageMeta } from "@/lib/page-meta";
import {
  jsonLdTimestamp,
  postNeighbours,
  relatedPosts,
  shortDate,
} from "@/lib/post-extras";
import { getSiteConfig } from "@/lib/site-data";
import SiteShell from "@/components/site/SiteShell";
import { slugifyTag, type Post } from "@/lib/content";
import { citationHtml } from "./citation";
import LanguageSwitcher from "./LanguageSwitcher";
import Lightbox from "./Lightbox";
import Mermaid from "./Mermaid";
import Kaggriculture from "./kaggriculture/Kaggriculture";
import { postFaqHtml, type FaqItem } from "./post-faq";
import RelatedPosts from "./RelatedPosts";
import Toc from "./Toc";
import TranslationToast from "./TranslationToast";
import { mobileShareLinksHtml } from "./social-share";

const UTTERANCES =
  '<script src="https://utteranc.es/client.js" ' +
  'repo="subramanya1997/subramanya1997.github.io" ' +
  'issue-term="pathname" theme="github-light" crossorigin="anonymous" async>\n</script>';

const MATHJAX_SCRIPT =
  '<script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>';

const MATHJAX_CONFIG = `
      window.MathJax = {
        tex: {
          inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
          displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']],
          processEscapes: true
        },
        options: {
          skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code']
        }
      };
    `;

export interface PostLayoutProps {
  meta: PageMeta;
  post: Post;
  /** The post body, rendered by lib/markdown.ts. */
  contentHtml: string;
  /** Reading time of `contentHtml`. */
  readingTime: string;
  /** Front-matter `faq`, with each answer already markdownified. */
  faq: FaqItem[];
}

export default function PostLayout({
  meta,
  post,
  contentHtml,
  readingTime,
  faq,
}: PostLayoutProps) {
  const site = getSiteConfig();
  const canonical = `${site.url}${post.url}`;
  const fm = post.frontmatter;
  const tags = fm.tags ?? [];
  const author = typeof fm.author === "string" ? fm.author : undefined;
  const { previous, next } = postNeighbours(post);
  const shareTarget = { url: canonical, title: fm.title, excerpt: fm.excerpt };

  // The post's own JSON-LD node. `schema_type` defaults to
  // TechArticle; `last_modified_at` falls back to the publication date.
  const modified = fm.last_modified_at
    ? new Date(
        fm.last_modified_at instanceof Date
          ? fm.last_modified_at
          : `${String(fm.last_modified_at)}T00:00:00Z`
      )
    : post.date;
  const articleJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": String(fm.schema_type ?? "TechArticle"),
    headline: fm.title,
    author: { "@type": "Person", name: author ?? site.title, url: site.url },
    datePublished: jsonLdTimestamp(post.date),
    dateModified: jsonLdTimestamp(modified),
    publisher: { "@type": "Organization", name: site.title, url: site.url },
    // The layout's own node reads `page.excerpt`, not `page.description`.
    description: fm.excerpt ? stripNewlines(stripHtml(String(fm.excerpt))) : site.description,
    url: canonical,
    mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
    keywords: tags.join(", "),
    inLanguage: "en",
  };
  if (typeof fm.image === "string" && fm.image) {
    articleJsonLd.image = `${site.url}${fm.image}`;
  }

  return (
    <SiteShell meta={meta} layout="post">
      {/* Reading Progress Bar */}
      {/* post-scripts.js sets `style.width` on this before React hydrates. */}
      <div className="reading-progress-bar" id="reading-progress" suppressHydrationWarning></div>

      <div className="post-container">
        {/* Table of Contents Sidebar (Left) */}
        <aside className="post-toc-sidebar">
          <Toc target={shareTarget} />
        </aside>

        <div className="post">
          <header className="post-header">
            <h1>{fm.title}</h1>

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

            <div className="post-meta">
              <div className="post-meta-info">
                {author ? <div className="post-author">{author}</div> : null}
                <div className="post-date-time">
                  <span className="post-date">{shortDate(post.date)}</span>
                  <span className="meta-dot">·</span>
                  <span className="post-reading-time">{`${readingTime} `}</span>
                </div>
              </div>

              <div className="post-meta-actions">
                <div className="copy-page-wrapper">
                  <button className="copy-page-btn" id="copyPageBtn">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="9" y="9" width="13" height="13" rx="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    <span>Copy Page</span>
                  </button>
                  <button
                    className="copy-dropdown-toggle"
                    id="copyDropdownToggle"
                    aria-label="More options"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
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

                {/* Language Switcher */}
                <LanguageSwitcher slug={post.slug} />
              </div>
            </div>
          </header>

          {/*
            `{{ content }}` and the two includes are siblings inside
            <article class="post-content">, and JSX cannot interleave raw HTML
            with elements without adding a wrapper node the CSS would see — so
            the includes are built as markup and concatenated.
          */}
          <article
            className="post-content"
            dangerouslySetInnerHTML={{
              __html: `${contentHtml}\n${postFaqHtml(canonical, faq)}\n${citationHtml(post, canonical)}\n`,
            }}
          />

          {/* Mobile Social Share (visible only on mobile/tablet) */}
          <div className="mobile-social-share">
            <div className="mobile-social-header">
              <h4 id="mobile-share-title">Share</h4>
            </div>
            <div
              className="mobile-social-links"
              dangerouslySetInnerHTML={{
                __html: `\n        ${mobileShareLinksHtml(shareTarget)}\n      `,
              }}
            />
          </div>

          {/* Related Posts */}
          <RelatedPosts posts={relatedPosts(post)} />

          <div className="post-navigation">
            {previous ? (
              <a
                className="prev-post"
                href={previous.url}
                data-preserve-lang=""
                title={linkTitle(`Previous ${previous.frontmatter.title}`)}
              >
                <span>Previous</span>
                <strong>{previous.frontmatter.title}</strong>
              </a>
            ) : null}

            {next ? (
              <a
                className="next-post"
                href={next.url}
                data-preserve-lang=""
                title={linkTitle(`Next ${next.frontmatter.title}`)}
              >
                <span>Next</span>
                <strong>{next.frontmatter.title}</strong>
              </a>
            ) : null}
          </div>

          {/*
            Comments Section — utterances injects its iframe next to its own
            <script>, and React 19 hoists `async` scripts into <head>, so the
            tag is emitted as raw markup to keep it inside this container.
          */}
          <div
            className="comments-section"
            dangerouslySetInnerHTML={{ __html: `\n      ${UTTERANCES}\n    ` }}
          />
        </div>
      </div>

      <div style={{ clear: "both" }}></div>

      <Lightbox />

      {/* Post Scripts */}
      <div>
        {fm.mathjax ? (
          <>
            {/* async — emitted raw so React 19 does not hoist it into <head>. */}
            <div dangerouslySetInnerHTML={{ __html: MATHJAX_SCRIPT }} />
            <script dangerouslySetInnerHTML={{ __html: MATHJAX_CONFIG }} />
          </>
        ) : null}
        {fm.mermaid ? <Mermaid /> : null}
        {fm.interactive === "kaggriculture" ? <Kaggriculture /> : null}
      </div>

      {/* Optimized Post Scripts (external file with debounced scroll handlers) */}
      <script src="/assets/js/post-scripts.js" defer />

      <style dangerouslySetInnerHTML={{ __html: postChromeCss() }} />

      {/* Structured Data for the post. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd, null, 2) }}
      />

      <style dangerouslySetInnerHTML={{ __html: postLayoutCss() }} />

      {/* Translation Toast */}
      <TranslationToast />

      {/* i18n Script for Translation Support */}
      <script src="/assets/js/i18n.js" defer />
    </SiteShell>
  );
}
