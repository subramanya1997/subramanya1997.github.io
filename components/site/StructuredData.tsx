// Port of _includes/structured-data.html.
import { getAbout, getSiteConfig } from "@/components/lib/site-data";
import { stripHtml, stripNewlines, truncate } from "@/components/lib/jekyll";
import type { PageMeta } from "@/components/lib/page-meta";

const COLLECTION_URLS = ["/blog/", "/tags/", "/books/", "/awesome-loops/", "/publications/"];

type Node = Record<string, unknown>;

export function buildStructuredData(meta: PageMeta): Node {
  const site = getSiteConfig();
  const about = getAbout();
  const canonical = `${site.url}${meta.url}`;
  const description = truncate(
    stripNewlines(stripHtml(meta.description ?? site.description)),
    300
  );

  const graph: Node[] = [
    {
      "@type": "WebSite",
      "@id": `${site.url}/#website`,
      url: `${site.url}/`,
      name: site.title,
      description: site.description,
      publisher: { "@id": `${site.url}/#person` },
      inLanguage: "en",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${site.url}/search/?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Person",
      "@id": `${site.url}/#person`,
      name: site.title,
      url: `${site.url}/`,
      description: stripHtml(about.bio),
      jobTitle: "Machine Learning Engineer",
      email: `mailto:${site.email}`,
      sameAs: [
        `https://x.com/${about.twitter_username}`,
        `https://github.com/${about.github_username}`,
        `https://www.linkedin.com/in/${about.linkedin_username}`,
        `https://scholar.google.com/citations?user=${about.scholar_id}`,
      ],
    },
  ];

  if (meta.url === "/") {
    graph.push({
      "@type": "ProfilePage",
      "@id": `${canonical}#webpage`,
      url: canonical,
      name: site.title,
      description,
      isPartOf: { "@id": `${site.url}/#website` },
      about: { "@id": `${site.url}/#person` },
      mainEntity: { "@id": `${site.url}/#person` },
      inLanguage: "en",
    });
    return { "@context": "https://schema.org", "@graph": graph };
  }

  if (meta.isPost) {
    // Posts get breadcrumbs only — the ScholarlyArticle node lives in the post layout.
    graph.push({
      "@type": "BreadcrumbList",
      "@id": `${canonical}#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${site.url}/` },
        { "@type": "ListItem", position: 2, name: "Blog", item: `${site.url}/blog/` },
        { "@type": "ListItem", position: 3, name: meta.title },
      ],
    });
    return { "@context": "https://schema.org", "@graph": graph };
  }

  const pageType =
    COLLECTION_URLS.includes(meta.url) || meta.url.includes("/tags/")
      ? "CollectionPage"
      : "WebPage";

  graph.push({
    "@type": pageType,
    "@id": `${canonical}#webpage`,
    url: canonical,
    name: meta.title ?? site.title,
    description,
    isPartOf: { "@id": `${site.url}/#website` },
    inLanguage: "en",
  });

  const crumbs: Node[] = [
    { "@type": "ListItem", position: 1, name: "Home", item: `${site.url}/` },
  ];
  if (meta.url !== "/" && meta.title) {
    if (meta.url.includes("/tags/") && meta.url !== "/tags/") {
      crumbs.push({ "@type": "ListItem", position: 2, name: "Tags", item: `${site.url}/tags/` });
      crumbs.push({ "@type": "ListItem", position: 3, name: meta.title });
    } else {
      crumbs.push({ "@type": "ListItem", position: 2, name: meta.title });
    }
  }
  graph.push({
    "@type": "BreadcrumbList",
    "@id": `${canonical}#breadcrumb`,
    itemListElement: crumbs,
  });

  return { "@context": "https://schema.org", "@graph": graph };
}

export default function StructuredData({ meta }: { meta: PageMeta }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(buildStructuredData(meta), null, 2) }}
    />
  );
}
