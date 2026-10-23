// Handbook landing page (formerly the HonKit index.html at the same URL).
import HandbookLayout from "@/components/handbook/HandbookLayout";
import {
  HANDBOOK_AUTHOR,
  HANDBOOK_TITLE,
  handbookChapters,
  handbookPage,
  handbookPages,
  renderHandbookPage,
} from "@/lib/handbook";

/** Pages listed on a chapter card before collapsing the rest into "+N more". */
const CARD_ARTICLES = 4;

/**
 * Seeded node-and-edge constellation (the site's blueprint motif) — fixed
 * coordinates so the prerendered bytes are stable.
 */
function HeroArt() {
  const nodes: [number, number, number][] = [
    [40, 60, 0], [120, 30, 1], [200, 80, 0], [90, 140, 0], [170, 170, 1],
    [250, 130, 0], [280, 40, 0], [60, 230, 0], [150, 250, 0], [240, 220, 1], [300, 190, 0],
  ];
  const edges: [number, number][] = [
    [0, 1], [1, 2], [0, 3], [3, 4], [2, 4], [2, 5], [1, 6], [6, 5],
    [3, 7], [7, 8], [4, 8], [8, 9], [4, 9], [5, 10], [9, 10],
  ];
  return (
    <svg className="hb-hero-art" viewBox="0 0 320 280" aria-hidden="true" focusable="false">
      {edges.map(([a, b]) => (
        <line
          key={`${a}-${b}`}
          x1={nodes[a][0]}
          y1={nodes[a][1]}
          x2={nodes[b][0]}
          y2={nodes[b][1]}
          stroke="#4A54D6"
          strokeOpacity="0.28"
          strokeWidth="1.2"
        />
      ))}
      {nodes.map(([x, y, accent], index) => (
        <circle
          key={index}
          cx={x}
          cy={y}
          r={accent ? 6 : 4}
          fill={accent ? "#CE5E38" : "#4A54D6"}
          fillOpacity={accent ? 0.85 : 0.55}
        />
      ))}
    </svg>
  );
}

export default async function HandbookHome() {
  const page = handbookPage("")!;
  const { html } = await renderHandbookPage(page);
  const chapters = handbookChapters();
  const pages = handbookPages();
  const housing = chapters.find((chapter) => chapter.page.file.startsWith("off-campus-housing/"));
  const firstArticle = chapters[0].articles[0] ?? pages[1];

  const hero = (
    <header className="hb-hero">
      <HeroArt />
      <p className="hb-overline">Handbook · Free to read</p>
      <h1>{HANDBOOK_TITLE}</h1>
      <p className="hb-hero-lede">{page.description}</p>
      <ul className="hb-hero-meta">
        <li>
          <strong>{pages.length}</strong> pages
        </li>
        {housing ? (
          <li>
            <strong>{housing.articles.length}</strong> apartment complexes compared
          </li>
        ) : null}
        <li>By {HANDBOOK_AUTHOR}</li>
      </ul>
      <div className="hb-hero-actions">
        <a className="hb-button hb-button-primary" href={firstArticle.url}>
          Start reading
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </a>
        {housing ? (
          <a className="hb-button" href={housing.page.url}>
            Compare apartments
          </a>
        ) : null}
      </div>
    </header>
  );

  const after = (
    <>
      <h2 className="hb-section-title">Inside the handbook</h2>
      <ol className="hb-chapters">
        {chapters.map((chapter, index) => (
          <li key={chapter.page.file} className="hb-chapter-card">
            <p className="hb-overline">Part {index + 1}</p>
            <h2>
              <a href={chapter.page.url}>{index === 0 ? "Introduction" : chapter.page.navTitle}</a>
            </h2>
            <p>
              {index === 0
                ? "Who this guide is for, the people who helped write it, and how to contribute."
                : chapter.page.description}
            </p>
            {chapter.articles.length > 0 ? (
              <ul>
                {chapter.articles.slice(0, CARD_ARTICLES).map((article) => (
                  <li key={article.file}>
                    <a href={article.url}>{article.navTitle}</a>
                  </li>
                ))}
                {chapter.articles.length > CARD_ARTICLES ? (
                  <li>
                    <a
                      className="hb-chapter-more"
                      href={chapter.page.url}
                      aria-label={`${chapter.articles.length - CARD_ARTICLES} more pages in ${chapter.page.navTitle}`}
                    >
                      +{chapter.articles.length - CARD_ARTICLES} more
                    </a>
                  </li>
                ) : null}
              </ul>
            ) : null}
          </li>
        ))}
      </ol>
    </>
  );

  return (
    <HandbookLayout
      page={page}
      heading={HANDBOOK_TITLE}
      contentHtml={html}
      hero={hero}
      after={after}
    />
  );
}
