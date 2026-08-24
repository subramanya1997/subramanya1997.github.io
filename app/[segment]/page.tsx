// Legacy tag URLs — `_plugins/tag_pages_generator.rb#LegacyTagRedirectPage`
// emitted a `/tags-<slug>/` page for every tag that bounces to `/tags/<slug>/`.
//
// Next cannot express a literal `tags-` prefix in a dynamic segment, and every
// root-level dynamic route has to share one slug name, so this route lives on
// the same `[segment]` placeholder as the post permalinks
// (`app/[segment]/[month]/[day]/[slug]/`) and validates the prefix itself.
import { notFound } from "next/navigation";
import { linkTitle } from "@/components/lib/jekyll";
import { pageMeta } from "@/components/lib/page-meta";
import { getTagArchives } from "@/components/lib/site-data";
import SiteShell from "@/components/site/SiteShell";

const LEGACY_PREFIX = "tags-";

export function generateStaticParams() {
  return getTagArchives().map((tag) => ({ segment: `${LEGACY_PREFIX}${tag.slug}` }));
}

function redirectScript(target: string): string {
  return `
  (function() {
    var target = ${JSON.stringify(target)};
    var hash = window.location.hash || "";
    var search = window.location.search || "";
    window.location.replace(target + search + hash);
  })();
`;
}

export default async function LegacyTagPage({
  params,
}: {
  params: Promise<{ segment: string }>;
}) {
  const { segment } = await params;
  if (!segment.startsWith(LEGACY_PREFIX)) notFound();

  const slug = segment.slice(LEGACY_PREFIX.length);
  if (!getTagArchives().some((tag) => tag.slug === slug)) notFound();

  const target = `/tags/${slug}/`;
  const meta = pageMeta({
    title: "Redirecting...",
    url: `/${segment}/`,
    robots: "noindex, nofollow",
  });

  return (
    <SiteShell meta={meta} layout="default">
      <div className="post">
        <header className="post-header">
          <h1>Redirecting…</h1>
        </header>
        <article className="post-content">
          <p>
            {"If you are not redirected automatically, "}
            <a
              href={target}
              id="legacy-tag-link"
              title={linkTitle("open the current tag archive")}
            >
              open the current tag archive
            </a>
            .
          </p>
        </article>
      </div>
      <script dangerouslySetInnerHTML={{ __html: redirectScript(target) }} />
      <noscript>
        <meta httpEquiv="refresh" content={`0; url=${target}`} />
      </noscript>
    </SiteShell>
  );
}
