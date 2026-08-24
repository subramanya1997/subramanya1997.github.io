// Per-page half of _includes/head.html. The site-wide half (favicons, fonts,
// main.css, RFC 8288 discovery links) lives in app/layout.tsx.
//
// These elements are rendered as ordinary JSX: React 19 hoists <title>, <meta>
// and <link> into <head>. Stylesheets carry a `precedence` so they are hoisted
// too and always land *after* the layout's main.css (see PARITY-NOTES.md).
import { getAbout, getSiteConfig } from "@/components/lib/site-data";
import { stripHtml, stripNewlines, truncate } from "@/components/lib/jekyll";
import type { PageMeta } from "@/components/lib/page-meta";
import StructuredData from "./StructuredData";

export default function PageHead({ meta }: { meta: PageMeta }) {
  const site = getSiteConfig();
  const about = getAbout();

  const canonical = `${site.url}${meta.url}`;
  const metaDescription = truncate(
    stripNewlines(stripHtml(meta.description ?? site.description)),
    160
  );
  const title = meta.title ? `${meta.title} | ${site.title}` : site.title;
  const ogTitle = meta.title ?? site.title;

  // head.html's social-image cascade for non-post pages.
  const imagePath = meta.image ?? (site.default_social_image as string);
  const imageAlt = meta.image ? (meta.title ?? site.title) : site.title;
  let imageUrl = imagePath.includes("://")
    ? imagePath.replace(/ /g, "%20")
    : `${site.url}${imagePath.replace(/ /g, "%20")}`;
  if (site.social_image_version) {
    imageUrl += `${imageUrl.includes("?") ? "&" : "?"}v=${site.social_image_version}`;
  }

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={metaDescription} />
      {meta.robots ? <meta name="robots" content={meta.robots} /> : null}

      <meta property="og:title" content={ogTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:type" content={meta.isPost ? "article" : "website"} />
      <meta property="og:url" content={canonical} />
      <meta property="og:site_name" content={site.title} />
      <meta property="og:locale" content="en_US" />

      {meta.markdownUrl ? (
        <>
          <link rel="alternate" type="text/markdown" href={`${site.url}${meta.markdownUrl}`} />
          <meta name="agent-markdown" content={`${site.url}${meta.markdownUrl}`} />
        </>
      ) : null}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={ogTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:url" content={canonical} />
      <meta name="twitter:site" content={`@${about.twitter_username}`} />
      <meta name="twitter:creator" content={`@${about.twitter_username}`} />
      <meta name="twitter:label1" content="Reading time" />
      <meta
        name="linkedin:profile"
        content={`https://www.linkedin.com/in/${about.linkedin_username}`}
      />

      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:secure_url" content={imageUrl} />
      <meta property="og:image:alt" content={imageAlt} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta name="twitter:image" content={imageUrl} />
      <meta name="twitter:image:src" content={imageUrl} />
      <meta name="twitter:image:alt" content={imageAlt} />

      <link rel="canonical" href={canonical} />

      {(meta.stylesheets ?? []).map((href) => (
        <link key={href} rel="stylesheet" href={href} precedence="page" />
      ))}

      <StructuredData meta={meta} />
    </>
  );
}
