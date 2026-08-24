// Port of _includes/search.html.
export default function SearchForm() {
  return (
    <form
      className="header-search"
      action="/search/"
      method="get"
      role="search"
      aria-label="Site search"
      data-preserve-lang=""
    >
      <label className="sr-only" htmlFor="site-search-input">
        Search posts and books
      </label>
      <svg
        className="search-icon"
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
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
      <input
        type="search"
        id="site-search-input"
        name="q"
        className="header-search-input"
        placeholder="Search posts and books..."
        autoComplete="off"
      />
    </form>
  );
}
