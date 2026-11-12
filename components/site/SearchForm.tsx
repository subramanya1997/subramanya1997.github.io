// Header search trigger. Looks like a search box, but it is a link: with JS,
// assets/js/components/search-palette.js intercepts the click (and "/" or
// Cmd/Ctrl+K) and opens the search palette; without JS it goes to /search/.
function SearchIcon({ size }: { size: number }) {
  return (
    <svg
      className="search-icon"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  );
}

export default function SearchForm() {
  return (
    <a
      className="header-search"
      href="/search/"
      aria-label="Search posts and books"
      aria-keyshortcuts="/ Meta+K Control+K"
      data-search-open=""
      data-preserve-lang=""
    >
      <SearchIcon size={15} />
      <span className="header-search-label">Search…</span>
      <kbd className="header-search-kbd" aria-hidden="true">
        /
      </kbd>
    </a>
  );
}

/** Icon-only trigger for narrow screens, where the box above is hidden. */
export function SearchToggle() {
  return (
    <a
      className="search-toggle"
      href="/search/"
      aria-label="Search posts and books"
      data-search-open=""
      data-preserve-lang=""
    >
      <SearchIcon size={17} />
    </a>
  );
}
