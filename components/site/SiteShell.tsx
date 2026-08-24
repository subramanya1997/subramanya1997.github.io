// Port of _layouts/default.html. Every HTML route renders its body through
// this component, so the header/footer/back-to-top/script order stays identical
// to the Jekyll output.
import type { ReactNode } from "react";
import type { PageMeta } from "@/components/lib/page-meta";
import Analytics from "./Analytics";
import Footer from "./Footer";
import Header from "./Header";
import NewsletterPopup from "./NewsletterPopup";
import PageHead from "./PageHead";

// NOTE on all the scripts below: React hydration can replace the header/button
// nodes that were server-rendered, which drops any listener bound directly to
// them. Everything here therefore delegates from `document`/`window` and looks
// the element up at event time.
const STICKY_HEADER_SCRIPT = `
      (function() {
        function sync() {
          const header = document.querySelector('.site-header');
          if (!header) return;
          header.classList.toggle('scrolled', window.pageYOffset > 50);
        }

        window.addEventListener('scroll', sync, { passive: true });
        sync();
      })();
    `;

const BACK_TO_TOP_SCRIPT = `
      (function() {
        function sync() {
          const button = document.getElementById('back-to-top');
          if (!button) return;
          button.classList.toggle('visible', window.pageYOffset > 300);
        }

        window.addEventListener('scroll', sync, { passive: true });
        sync();

        document.addEventListener('click', function(event) {
          const button = event.target.closest && event.target.closest('#back-to-top');
          if (!button) return;
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      })();
    `;

// Colour-scheme toggle. The stored preference is applied before paint by
// THEME_SCRIPT in app/layout.tsx; this only flips it.
const THEME_TOGGLE_SCRIPT = `
      (function() {
        const root = document.documentElement;
        const media = window.matchMedia('(prefers-color-scheme: dark)');

        function effective() {
          const attr = root.getAttribute('data-theme');
          if (attr === 'dark' || attr === 'light') return attr;
          return media.matches ? 'dark' : 'light';
        }

        function label() {
          const button = document.getElementById('theme-toggle');
          if (!button) return;
          const next = effective() === 'dark' ? 'light' : 'dark';
          button.setAttribute('aria-label', 'Switch to ' + next + ' theme');
        }

        document.addEventListener('click', function(event) {
          const button = event.target.closest && event.target.closest('#theme-toggle');
          if (!button) return;
          const next = effective() === 'dark' ? 'light' : 'dark';
          root.setAttribute('data-theme', next);
          try { localStorage.setItem('theme', next); } catch (e) {}
          label();
        });

        // Follow the OS while the visitor has expressed no preference.
        media.addEventListener('change', function() {
          if (!root.hasAttribute('data-theme')) label();
        });

        label();
        document.addEventListener('DOMContentLoaded', label);
        window.addEventListener('load', label);
      })();
    `;

const MOBILE_MENU_SCRIPT = `
      (function() {
        function close() {
          const button = document.querySelector('.menu-icon');
          const menu = document.getElementById('nav-menu');
          if (!button || !menu) return;
          button.setAttribute('aria-expanded', 'false');
          menu.classList.remove('active');
        }

        document.addEventListener('click', function(event) {
          const target = event.target;
          const button = target.closest && target.closest('.menu-icon');
          const menu = document.getElementById('nav-menu');
          if (!menu) return;

          if (button) {
            event.preventDefault();
            const open = button.getAttribute('aria-expanded') === 'true';
            button.setAttribute('aria-expanded', open ? 'false' : 'true');
            menu.classList.toggle('active', !open);
            if (!open) {
              const first = menu.querySelector('a');
              if (first) first.focus();
            }
            return;
          }

          if (!(target.closest && target.closest('#nav-menu'))) close();
        });

        document.addEventListener('keydown', function(event) {
          if (event.key !== 'Escape') return;
          const menu = document.getElementById('nav-menu');
          if (!menu || !menu.classList.contains('active')) return;
          close();
          const button = document.querySelector('.menu-icon');
          if (button) button.focus();
        });
      })();
    `;

export interface SiteShellProps {
  meta: PageMeta;
  /** Which Jekyll layout the page used — drives analytics `content_type` and the footer newsletter. */
  layout?: "page" | "default" | "post";
  children?: ReactNode;
  /**
   * Verbatim HTML for the `.wrap` container. Used by the 404 page, whose body
   * contains an HTML comment that JSX cannot express.
   */
  rawContent?: string;
  /**
   * Class Jekyll put on <body> (loop pages use "loop-shell"). The App Router
   * has a single root layout, so it is applied with an inline script that runs
   * while the body is still parsing — before any content paints.
   */
  bodyClass?: string;
}

export default function SiteShell({
  meta,
  layout = "page",
  children,
  rawContent,
  bodyClass,
}: SiteShellProps) {
  return (
    <>
      <PageHead meta={meta} />
      {bodyClass !== undefined && (
        <script
          dangerouslySetInnerHTML={{
            __html: `document.body.classList.add(${JSON.stringify(bodyClass)});`,
          }}
        />
      )}
      <Analytics meta={meta} layout={layout} />

      <Header />

      <main className="page-content" id="main-content" role="main">
        {rawContent !== undefined ? (
          <div className="wrap" dangerouslySetInnerHTML={{ __html: rawContent }} />
        ) : (
          <div className="wrap">{children}</div>
        )}
      </main>

      <Footer showNewsletter={layout !== "post"} />

      {/* Back to Top Button */}
      <button id="back-to-top" className="back-to-top" aria-label="Back to top">
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
          <line x1="12" y1="19" x2="12" y2="5"></line>
          <polyline points="5 12 12 5 19 12"></polyline>
        </svg>
      </button>

      <script dangerouslySetInnerHTML={{ __html: STICKY_HEADER_SCRIPT }} />
      <script dangerouslySetInnerHTML={{ __html: BACK_TO_TOP_SCRIPT }} />
      <script dangerouslySetInnerHTML={{ __html: MOBILE_MENU_SCRIPT }} />
      <script dangerouslySetInnerHTML={{ __html: THEME_TOGGLE_SCRIPT }} />

      <script src="/assets/js/components/site-language.js" defer />

      <NewsletterPopup />

      {(meta.scripts ?? []).map((src) => (
        <script key={src} src={src} defer />
      ))}
    </>
  );
}
