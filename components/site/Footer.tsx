// Site footer.
import { getAbout, getSiteConfig } from "@/lib/site-data";

const FOOTER_STYLE = `
  .site-footer .header-wrap {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 40px;
  }

  .footer-left {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .footer-right {
    text-align: right;
  }

  .footer-quote {
    font-size: 13px;
    font-style: italic;
    color: var(--text-secondary);
    margin-bottom: 8px;
    white-space: nowrap;
  }

  .social-icons {
    display: flex;
    gap: 16px;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .footer-nav {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
  }

  .footer-nav a {
    font-size: 13px;
    color: var(--text-secondary);
    text-decoration: none;
    transition: color 0.2s ease;
  }

  .footer-nav a:hover {
    color: var(--text-primary);
  }

  .social-icon-link {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-secondary);
    transition: all 0.2s ease;
  }

  .social-icon-link:hover {
    color: var(--text-primary);
    transform: translateY(-2px);
  }

  .copyright {
    font-size: 13px;
    color: var(--text-tertiary);
    margin: 0;
  }

  .theme-switch {
    margin-top: 16px;
  }

  @media screen and (max-width: 600px) {
    .site-footer .header-wrap {
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 24px;
    }

    .footer-left {
      align-items: center;
    }

    .footer-right {
      text-align: center;
    }

    .footer-quote {
      margin-left: 0;
      margin-right: 0;
      /* The quote is nowrap on desktop; on narrow screens it must wrap or it
         forces horizontal scroll (overflowed at 320px viewports). */
      white-space: normal;
    }
  }
`;

// Light / Dark / System, styled after shadcn's Tabs. The selected segment is
// drawn by CSS from `data-theme-pref` on <html> (set before paint by the boot
// script in app/layout.tsx), so it is right on first paint and React never has
// to reconcile it; THEME_SWITCH_SCRIPT in SiteShell.tsx handles the clicks.
const THEMES = [
  {
    value: "light",
    label: "Light",
    icon: (
      <>
        <circle cx="12" cy="12" r="4"></circle>
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path>
      </>
    ),
  },
  {
    value: "dark",
    label: "Dark",
    icon: <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>,
  },
  {
    value: "system",
    label: "System",
    icon: (
      <>
        <rect x="2" y="3" width="20" height="14" rx="2"></rect>
        <path d="M8 21h8M12 17v4"></path>
      </>
    ),
  },
];

function ThemeSwitch() {
  return (
    <div className="theme-switch" role="radiogroup" aria-label="Colour theme">
      {THEMES.map((theme) => (
        <button
          key={theme.value}
          type="button"
          className="theme-switch-option"
          role="radio"
          aria-checked="false"
          data-theme-value={theme.value}
          suppressHydrationWarning
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {theme.icon}
          </svg>
          {theme.label}
        </button>
      ))}
    </div>
  );
}

const FOOTER_NAV = [
  { href: "/publications/", label: "Publications" },
  { href: "/stats/", label: "Stats" },
  { href: "/contact/", label: "Contact" },
  { href: "/privacy/", label: "Privacy" },
];

export default function Footer() {
  const site = getSiteConfig();
  const about = getAbout();

  return (
    <>
      <footer className="site-footer" role="contentinfo">
        <div className="wrap header-wrap">
          <div className="footer-left">
            <b className="footer-heading">{site.title}</b>
            <ul className="social-icons" aria-label="Social media links">
              {about.linkedin_username ? (
                <li>
                  <a
                    href={`https://www.linkedin.com/in/${about.linkedin_username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-icon-link"
                    aria-label="LinkedIn profile"
                    title="LinkedIn profile"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                      <rect x="2" y="9" width="4" height="12"></rect>
                      <circle cx="4" cy="4" r="2"></circle>
                    </svg>
                  </a>
                </li>
              ) : null}
              {about.github_username ? (
                <li>
                  <a
                    href={`https://github.com/${about.github_username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-icon-link"
                    aria-label="GitHub profile"
                    title="GitHub profile"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                    </svg>
                  </a>
                </li>
              ) : null}
              {about.twitter_username ? (
                <li>
                  <a
                    href={`https://x.com/${about.twitter_username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-icon-link"
                    aria-label="X profile"
                    title="X profile"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </a>
                </li>
              ) : null}
              {about.scholar_id ? (
                <li>
                  <a
                    href={`https://scholar.google.com/citations?user=${about.scholar_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-icon-link"
                    aria-label="Google Scholar profile"
                    title="Google Scholar profile"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M22 10 12 5 2 10l10 5 10-5z"></path>
                      <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
                    </svg>
                  </a>
                </li>
              ) : null}
              {about.email ? (
                <li>
                  <a
                    href={`mailto:${about.email}`}
                    className="social-icon-link"
                    aria-label="Email"
                    title="Email"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                  </a>
                </li>
              ) : null}
            </ul>
            <nav className="footer-nav" aria-label="Secondary navigation">
              {FOOTER_NAV.map((item) => (
                <a key={item.href} href={item.href} data-preserve-lang="" title={item.label}>
                  {item.label}
                </a>
              ))}
            </nav>
          </div>

          <div className="footer-right">
            {about.fav_quote ? <p className="footer-quote">{about.fav_quote}</p> : null}
            <p className="copyright">{`© ${new Date().getFullYear()} ${site.title}`}</p>
            <ThemeSwitch />
          </div>
        </div>

      </footer>

      <style dangerouslySetInnerHTML={{ __html: FOOTER_STYLE }} />
    </>
  );
}
