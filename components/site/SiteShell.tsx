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

const STICKY_HEADER_SCRIPT = `
      (function() {
        const header = document.querySelector('.site-header');
        let lastScroll = 0;

        window.addEventListener('scroll', function() {
          const currentScroll = window.pageYOffset;

          if (currentScroll > 50) {
            header.classList.add('scrolled');
          } else {
            header.classList.remove('scrolled');
          }

          lastScroll = currentScroll;
        });
      })();
    `;

const BACK_TO_TOP_SCRIPT = `
      (function() {
        const backToTopButton = document.getElementById('back-to-top');

        if (backToTopButton) {
          // Show/hide button based on scroll position
          window.addEventListener('scroll', function() {
            if (window.pageYOffset > 300) {
              backToTopButton.classList.add('visible');
            } else {
              backToTopButton.classList.remove('visible');
            }
          });

          // Smooth scroll to top on click
          backToTopButton.addEventListener('click', function() {
            window.scrollTo({
              top: 0,
              behavior: 'smooth'
            });
          });
        }
      })();
    `;

const MOBILE_MENU_SCRIPT = `
      (function() {
        const menuButton = document.querySelector('.menu-icon');
        const navMenu = document.getElementById('nav-menu');

        if (menuButton && navMenu) {
          menuButton.addEventListener('click', function(e) {
            e.preventDefault();
            const isExpanded = this.getAttribute('aria-expanded') === 'true';

            this.setAttribute('aria-expanded', !isExpanded);
            navMenu.classList.toggle('active');

            // Trap focus within menu when open
            if (!isExpanded) {
              const firstLink = navMenu.querySelector('a');
              if (firstLink) firstLink.focus();
            }
          });

          // Close menu on escape key
          document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && navMenu.classList.contains('active')) {
              menuButton.setAttribute('aria-expanded', 'false');
              navMenu.classList.remove('active');
              menuButton.focus();
            }
          });

          // Close menu when clicking outside
          document.addEventListener('click', function(e) {
            if (!menuButton.contains(e.target) && !navMenu.contains(e.target)) {
              if (navMenu.classList.contains('active')) {
                menuButton.setAttribute('aria-expanded', 'false');
                navMenu.classList.remove('active');
              }
            }
          });
        }
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
}

export default function SiteShell({
  meta,
  layout = "page",
  children,
  rawContent,
}: SiteShellProps) {
  return (
    <>
      <PageHead meta={meta} />
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

      <script src="/assets/js/components/site-language.js" defer />

      <NewsletterPopup />

      {(meta.scripts ?? []).map((src) => (
        <script key={src} src={src} defer />
      ))}
    </>
  );
}
