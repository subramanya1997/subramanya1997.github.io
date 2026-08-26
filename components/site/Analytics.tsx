// Port of _includes/analytics.html. Always emitted (the old Jekyll
// JEKYLL_ENV=production guard is gone), so every build carries the GA tags.
import { getSiteConfig } from "@/components/lib/site-data";
import type { PageMeta } from "@/components/lib/page-meta";

export default function Analytics({
  meta,
  layout = "page",
}: {
  meta: PageMeta;
  layout?: "page" | "default" | "post";
}) {
  const site = getSiteConfig();
  const ga = site.google_analytics as string | undefined;
  if (!ga) return null;

  const contentType = layout === "page" ? "    'content_type': 'page',\n" : "";
  const pageView = meta.title
    ? `
  // Track page view with custom parameters
  gtag('event', 'page_view', {
    'page_title': '${escapeJs(meta.title)}',
    'page_location': window.location.href,
    'page_path': '${meta.url}',
${contentType}  });
  `
    : "";

  const inline = `
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  // Basic configuration with enhanced measurement
  gtag('config', '${ga}', {
    'send_page_view': true,
    'anonymize_ip': true,
    'allow_google_signals': true,
    'allow_ad_personalization_signals': false
  });
${pageView}`;

  const is404 = meta.url.includes("404");

  return (
    <>
      <script async src={`https://www.googletagmanager.com/gtag/js?id=${ga}`} />
      <script dangerouslySetInnerHTML={{ __html: inline }} />
      <script src="/assets/js/analytics-enhanced.js" defer />
      {is404 ? (
        <script
          dangerouslySetInnerHTML={{
            __html: `
  if (typeof gtag === 'function') {
    gtag('event', 'exception', {
      'description': '404 Error - Page not found: ' + window.location.pathname,
      'fatal': false
    });
  }
`,
          }}
        />
      ) : null}
    </>
  );
}

/** Liquid's `escape` on a title that is interpolated into a JS string literal. */
function escapeJs(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/'/g, "&#39;");
}
