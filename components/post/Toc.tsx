// Table of contents. The list itself is built client-side from the rendered
// headings, so the server markup is just the shell plus the share links; the
// CSS and the TOC script are injected verbatim from components/post/assets.
import { tocCss, tocJs } from "./assets";
import { tocShareLinksHtml, type ShareTarget } from "./social-share";

export default function Toc({ target }: { target: ShareTarget }) {
  return (
    <>
      <nav
        id="table-of-contents"
        className="table-of-contents"
        aria-label="Table of Contents"
        suppressHydrationWarning
      >
        <div className="toc-header">
          <h4 id="toc-title">On this page</h4>
        </div>
        {/*
          The inline script below fills this list (and toggles the nav's
          `style`) synchronously, before React hydrates. An empty `__html`
          emits the same `<ul></ul>` bytes but tells React not to reconcile
          the children the script added, which otherwise throws a hydration
          mismatch (#418) on every post page.
        */}
        <ul
          id="toc-list"
          className="toc-list"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: "" }}
        />

        {/* Social Share Section */}
        <div className="toc-social-share">
          <div className="toc-social-header">
            <h4 id="toc-share-title">Share</h4>
          </div>
          <div
            className="toc-social-links"
            dangerouslySetInnerHTML={{ __html: `\n      ${tocShareLinksHtml(target)}\n    ` }}
          />
        </div>
      </nav>

      <style dangerouslySetInnerHTML={{ __html: tocCss() }} />
      <script dangerouslySetInnerHTML={{ __html: tocJs() }} />
    </>
  );
}
