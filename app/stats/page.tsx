// Port of stats.md (layout: page, custom_layout: true). The numbers are baked
// in at build time exactly as Liquid computed them; stats.js only re-formats.
import { Fragment } from "react";
import { linkTitle, longDateTime, rubyRound } from "@/components/lib/jekyll";
import { pageMeta } from "@/components/lib/page-meta";
import { getViewCounts } from "@/components/lib/site-data";
import PageLayout from "@/components/site/PageLayout";
import { getAllPosts } from "@/lib/content";

const meta = pageMeta({
  title: "Stats",
  url: "/stats/",
  customLayout: true,
  stylesheets: ["/assets/css/pages/stats.css"],
  scripts: ["/assets/js/pages/stats.js"],
});

/**
 * `content/data/view_count.json` stores engagement/duration as JSON floats, and Liquid
 * prints Ruby floats with a trailing ".0". JSON.parse loses that, so re-add it.
 */
function floatText(value: number): string {
  return Number.isInteger(value) ? value.toFixed(1) : String(value);
}

export default function Stats() {
  const { view_counts: viewCounts, last_updated: lastUpdated } = getViewCounts();
  const size = viewCounts.length;
  const posts = getAllPosts();
  const titleFor = (url: string) => posts.find((post) => post.url === url)?.frontmatter.title;

  const totalViews = viewCounts.reduce((sum, item) => sum + item.views, 0);
  const totalEngagement = viewCounts.reduce((sum, item) => sum + item.engagement_rate, 0);
  const totalDuration = viewCounts.reduce((sum, item) => sum + item.avg_duration_seconds, 0);
  const avgEngagement = size > 0 ? rubyRound(totalEngagement / size) : 0;
  // Liquid: `round` yields an Integer, so the /60 that follows is integer division.
  const avgSeconds = size > 0 ? rubyRound(totalDuration / size) : 0;
  const avgMinutes = Math.floor(avgSeconds / 60);

  return (
    <PageLayout meta={meta}>
      <div className="stats-container">
        <header className="stats-header">
          <h1>Site Statistics</h1>
          <p className="stats-subtitle">
            Real-time analytics for this site. All data updates automatically.
          </p>
        </header>

        <section className="stats-cards">
          <div className="stat-card">
            <div className="stat-card-header">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
              <span className="stat-number">01</span>
            </div>
            <h3 className="stat-label">Total Views</h3>
            <p className="stat-value" id="total-views">
              {totalViews}
            </p>
            <p className="stat-description">All-time page views</p>
            <p className="stat-meta">Since site launch</p>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <span className="stat-number">02</span>
            </div>
            <h3 className="stat-label">Avg. Engagement</h3>
            <p className="stat-value" id="avg-engagement">
              {`${avgEngagement}%`}
            </p>
            <p className="stat-description">Average reader engagement</p>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
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
              <span className="stat-number">03</span>
            </div>
            <h3 className="stat-label">Avg. Read Time</h3>
            <p className="stat-value" id="avg-read-time">
              {`${avgMinutes}m`}
            </p>
            <p className="stat-description">Time spent reading</p>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
              </svg>
              <span className="stat-number">04</span>
            </div>
            <h3 className="stat-label">Blog Posts</h3>
            <p className="stat-value">{posts.length}</p>
            <p className="stat-description">Published articles</p>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
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
              <span className="stat-number">05</span>
            </div>
            <h3 className="stat-label">Tracked Posts</h3>
            <p className="stat-value">{size}</p>
            <p className="stat-description">Posts with 100+ views</p>
          </div>
        </section>

        <section className="stats-section">
          <h2 className="stats-section-title">Top Performing Posts</h2>
          <div className="stats-table">
            {size > 0 ? (
              viewCounts.map((item, index) => {
                const postTitle = titleFor(item.url) ?? item.url;
                return (
                  <Fragment key={item.url}>
                    <div className={`stats-row ${index === 0 ? "first" : ""}`}>
                      <div className="stats-row-content">
                        <span className="stats-rank">{index + 1}</span>
                        <div className="stats-row-info">
                          <a
                            href={item.url}
                            className="stats-row-title"
                            title={linkTitle(postTitle)}
                          >
                            {postTitle}
                          </a>
                          <span className="stats-row-url">{item.url}</span>
                        </div>
                      </div>
                      <div className="stats-row-metrics">
                        <div className="stats-metric">
                          <span className="stats-metric-value">{item.views}</span>
                          <span className="stats-metric-label">views</span>
                        </div>
                        <div className="stats-metric">
                          <span className="stats-metric-value">
                            {`${floatText(item.engagement_rate)}%`}
                          </span>
                          <span className="stats-metric-label">engagement</span>
                        </div>
                        <div className="stats-metric">
                          <span
                            className="stats-metric-value"
                            data-seconds={floatText(item.avg_duration_seconds)}
                          >
                            {`${rubyRound(item.avg_duration_seconds / 60, 1).toFixed(1)}m`}
                          </span>
                          <span className="stats-metric-label">avg. time</span>
                        </div>
                      </div>
                    </div>
                  </Fragment>
                );
              })
            ) : (
              <div className="stats-row">
                <div className="stats-row-content">
                  <span className="stats-rank">0</span>
                  <div className="stats-row-info">
                    <span className="stats-row-title">No analytics data available</span>
                    <span className="stats-row-url">
                      The dashboard will update when view data is available.
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="stats-section">
          <h2 className="stats-section-title">Data Source</h2>
          <div className="stats-info-card">
            <div className="stats-info-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
            </div>
            <div className="stats-info-content">
              <h3>Privacy-Focused Analytics</h3>
              <p>
                This site uses Google Analytics 4 with privacy-preserving settings. Data is
                aggregated and no personally identifiable information is collected. View counts are
                updated daily via GitHub Actions.
              </p>
              <p className="stats-info-meta">
                <span>{`Last updated: ${longDateTime(lastUpdated)}`}</span>
              </p>
            </div>
          </div>
        </section>
      </div>
    </PageLayout>
  );
}
