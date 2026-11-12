// The page shell: header, main column with the newsletter rail, footer,
// back-to-top and site scripts. Every HTML route renders its body through
// this component, so that order stays identical to the Jekyll output.
import type { ReactNode } from "react";
import type { PageMeta } from "@/lib/page-meta";
import Analytics from "./Analytics";
import Footer from "./Footer";
import Header from "./Header";
import Newsletter from "./Newsletter";
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
          // Hidden again once the footer is on screen, so it never sits on top
          // of the footer's own controls.
          const footer = document.querySelector('.site-footer');
          const atFooter = footer && footer.getBoundingClientRect().top < window.innerHeight - 24;
          button.classList.toggle('visible', window.pageYOffset > 300 && !atFooter);
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

// Footer theme switcher (Light / Dark / System). The stored preference is
// applied before paint by THEME_SCRIPT in app/layout.tsx; this changes it.
const THEME_SWITCH_SCRIPT = `
      (function() {
        const root = document.documentElement;
        const media = window.matchMedia('(prefers-color-scheme: dark)');

        // Light is the site default when nothing has been chosen.
        function preference() {
          const pref = root.getAttribute('data-theme-pref');
          return pref === 'dark' || pref === 'system' ? pref : 'light';
        }

        function apply(pref) {
          const resolved = pref === 'system' ? (media.matches ? 'dark' : 'light') : pref;
          root.setAttribute('data-theme-pref', pref);
          root.setAttribute('data-theme', resolved);
        }

        function sync() {
          const pref = preference();
          document.querySelectorAll('[data-theme-value]').forEach(function(option) {
            const selected = option.getAttribute('data-theme-value') === pref;
            option.setAttribute('aria-checked', selected ? 'true' : 'false');
            option.tabIndex = selected ? 0 : -1;
          });
        }

        function choose(option) {
          const pref = option.getAttribute('data-theme-value');
          apply(pref);
          try { localStorage.setItem('theme', pref); } catch (e) {}
          sync();
        }

        document.addEventListener('click', function(event) {
          const option = event.target.closest && event.target.closest('[data-theme-value]');
          if (option) choose(option);
        });

        // Radio-group keyboard model: arrows move and select.
        document.addEventListener('keydown', function(event) {
          const option = event.target.closest && event.target.closest('[data-theme-value]');
          if (!option) return;
          const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
          if (!step) return;
          event.preventDefault();
          const options = Array.from(option.parentNode.querySelectorAll('[data-theme-value]'));
          const next = options[(options.indexOf(option) + step + options.length) % options.length];
          choose(next);
          next.focus();
        });

        media.addEventListener('change', function() {
          if (preference() === 'system') apply('system');
        });

        sync();
        document.addEventListener('DOMContentLoaded', sync);
        window.addEventListener('load', sync);
      })();
    `;

// Newsletter sheet. Below 1280px there is no right rail, so the sign-up card
// slides up from the bottom once the reader is about halfway down a long page
// (never on load, never on short pages). Closing it keeps it away for 30
// days; subscribing — from the sheet or the rail — keeps it away for good.
const NEWSLETTER_SHEET_SCRIPT = `
      (function() {
        const KEY = 'newsletter-sheet';
        const QUIET_MS = 30 * 24 * 60 * 60 * 1000;
        const narrow = window.matchMedia('(max-width: 1280px)');
        let shown = false;

        function sheet() { return document.getElementById('newsletter-sheet'); }

        function read() {
          try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; }
        }

        function write(state) {
          try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
        }

        function eligible() {
          if (shown || !narrow.matches || !sheet()) return false;
          if (document.documentElement.classList.contains('sp-open')) return false;
          const state = read();
          if (state.subscribed) return false;
          return !(state.dismissed && Date.now() - state.dismissed < QUIET_MS);
        }

        function open() {
          const el = sheet();
          if (!el) return;
          shown = true;
          el.inert = false;
          el.classList.add('is-open');
          document.documentElement.classList.add('nl-sheet-open');
        }

        function close(remember) {
          const el = sheet();
          if (!el || !el.classList.contains('is-open')) return;
          if (el.contains(document.activeElement)) document.activeElement.blur();
          el.classList.remove('is-open');
          el.inert = true;
          document.documentElement.classList.remove('nl-sheet-open');
          if (remember) write(Object.assign(read(), { dismissed: Date.now() }));
        }

        function check() {
          if (!eligible()) return;
          const page = document.documentElement.scrollHeight;
          const view = window.innerHeight;
          if (page < view * 2.5) return;
          if (window.pageYOffset + view >= page * 0.5) open();
        }

        window.addEventListener('scroll', check, { passive: true });

        document.addEventListener('click', function(event) {
          if (event.target.closest && event.target.closest('[data-newsletter-close]')) close(true);
        });

        document.addEventListener('keydown', function(event) {
          if (event.key !== 'Escape') return;
          if (document.documentElement.classList.contains('sp-open')) return;
          close(true);
        });

        document.addEventListener('submit', function(event) {
          if (!event.target.matches || !event.target.matches('.js-newsletter-form')) return;
          write(Object.assign(read(), { subscribed: true }));
          setTimeout(function() { close(false); }, 5000);
        });

        // The rail takes over again when the window grows past the breakpoint.
        narrow.addEventListener('change', function() {
          if (!narrow.matches) close(false);
        });
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
  /** Which Jekyll layout the page used — drives analytics `content_type`. */
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
  /** Extra class on the `.wrap` container (the handbook widens it). */
  wrapClassName?: string;
  /**
   * The site-wide newsletter card in a sticky right column (inline after the
   * content on narrow screens). Off for layouts that place it themselves —
   * the handbook puts it in its own right column under "On this page".
   */
  newsletterRail?: boolean;
}

export default function SiteShell({
  meta,
  layout = "page",
  children,
  rawContent,
  bodyClass,
  wrapClassName,
  newsletterRail = true,
}: SiteShellProps) {
  const wrapClass = [
    "wrap",
    newsletterRail ? "wrap-rail" : null,
    wrapClassName ?? null,
  ]
    .filter(Boolean)
    .join(" ");
  // Page body: verbatim HTML (404) or React children.
  const body =
    rawContent !== undefined ? { dangerouslySetInnerHTML: { __html: rawContent } } : { children };
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
        {!newsletterRail ? (
          <div className={wrapClass} {...body} />
        ) : (
          <div className={wrapClass}>
            <div className="site-rail-layout">
              <div className="site-rail-main" {...body} />
              <aside className="site-rail" aria-label="Newsletter">
                <div className="site-rail-sticky">
                  <Newsletter />
                </div>
              </aside>
            </div>
            {/* Narrow screens: no right column, so the card is a dismissible
                sheet that NEWSLETTER_SHEET_SCRIPT slides up from the bottom. */}
            <aside
              className="nl-sheet"
              id="newsletter-sheet"
              aria-label="Newsletter sign-up"
              inert
              suppressHydrationWarning
            >
              <button
                type="button"
                className="nl-sheet-close"
                data-newsletter-close=""
                aria-label="Close newsletter sign-up"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
              <Newsletter />
            </aside>
          </div>
        )}
      </main>

      <Footer />

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
      <script dangerouslySetInnerHTML={{ __html: THEME_SWITCH_SCRIPT }} />
      {newsletterRail && <script dangerouslySetInnerHTML={{ __html: NEWSLETTER_SHEET_SCRIPT }} />}

      <script src="/assets/js/components/site-language.js" defer />
      <script src="/assets/js/components/search-palette.js" defer />

      {(meta.scripts ?? []).map((src) => (
        <script key={src} src={src} defer />
      ))}
    </>
  );
}
