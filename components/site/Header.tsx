// Port of _includes/header.html (plus the skip links that precede it).
// `title` attributes are the ones _plugins/link_attributes.rb adds at build time.
import { getSiteConfig, NAV_LINKS } from "@/components/lib/site-data";
import SearchForm from "./SearchForm";

export default function Header() {
  const site = getSiteConfig();
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <a href="#site-navigation" className="skip-link">
        Skip to navigation
      </a>

      <header className="site-header" role="banner">
        <div className="wrap header-wrap">
          <a
            className="site-title animated-link"
            href="/"
            aria-label={`Home - ${site.title}`}
            data-preserve-lang=""
            title={`Home - ${site.title}`}
          >
            {site.title}
          </a>

          <SearchForm />

          <nav
            className="site-nav"
            id="site-navigation"
            role="navigation"
            aria-label="Main navigation"
          >
            <button
              className="theme-toggle"
              id="theme-toggle"
              type="button"
              aria-label="Switch to dark theme"
              title="Switch theme"
            >
              <svg
                className="icon-sun"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="4"></circle>
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path>
              </svg>
              <svg
                className="icon-moon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
              <span className="sr-only">Toggle colour theme</span>
            </button>
            <button
              className="menu-icon"
              aria-label="Toggle navigation menu"
              aria-expanded="false"
              aria-controls="nav-menu"
            >
              <svg
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                xmlnsXlink="http://www.w3.org/1999/xlink"
                x="0px"
                y="0px"
                viewBox="0 0 18 15"
                enableBackground="new 0 0 18 15"
                xmlSpace="preserve"
                aria-hidden="true"
              >
                <path
                  fill="currentColor"
                  d="M18,1.484c0,0.82-0.665,1.484-1.484,1.484H1.484C0.665,2.969,0,2.304,0,1.484l0,0C0,0.665,0.665,0,1.484,0
            h15.031C17.335,0,18,0.665,18,1.484L18,1.484z"
                />
                <path
                  fill="currentColor"
                  d="M18,7.516C18,8.335,17.335,9,16.516,9H1.484C0.665,9,0,8.335,0,7.516l0,0c0-0.82,0.665-1.484,1.484-1.484
            h15.031C17.335,6.031,18,6.696,18,7.516L18,7.516z"
                />
                <path
                  fill="currentColor"
                  d="M18,13.516C18,14.335,17.335,15,16.516,15H1.484C0.665,15,0,14.335,0,13.516l0,0
            c0-0.82,0.665-1.484,1.484-1.484h15.031C17.335,12.031,18,12.696,18,13.516L18,13.516z"
                />
              </svg>
              <span className="sr-only">Menu</span>
            </button>
            <div className="trigger" id="nav-menu">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.url}
                  className="page-link animated-link"
                  href={link.url}
                  data-preserve-lang=""
                  title={link.title}
                >
                  {link.title}
                </a>
              ))}
            </div>
          </nav>
        </div>
      </header>
    </>
  );
}
