// Port of _layouts/page.html (which itself wraps _layouts/default.html).
import type { ReactNode } from "react";
import type { PageMeta } from "@/components/lib/page-meta";
import SiteShell from "./SiteShell";

export default function PageLayout({
  meta,
  children,
  contentHtml,
}: {
  meta: PageMeta;
  children?: ReactNode;
  /** Rendered markdown body, injected straight into <article class="post-content">. */
  contentHtml?: string;
}) {
  if (meta.customLayout) {
    return (
      <SiteShell meta={meta} layout="page">
        {children}
      </SiteShell>
    );
  }

  return (
    <SiteShell meta={meta} layout="page">
      <div className="post">
        <header className="post-header">
          <h1>{meta.title}</h1>
        </header>

        {contentHtml !== undefined ? (
          <article className="post-content" dangerouslySetInnerHTML={{ __html: contentHtml }} />
        ) : (
          <article className="post-content">{children}</article>
        )}
      </div>
    </SiteShell>
  );
}
