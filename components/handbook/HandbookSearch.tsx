// Search box for the handbook. Server markup only; handbook.client.js loads
// the section index on first focus and renders the results listbox.
import { HANDBOOK_BASE } from "@/lib/handbook";

export default function HandbookSearch({
  id,
  placeholder = "Search the handbook",
}: {
  /** Prefix for the input / results ids (two boxes can share a page). */
  id: string;
  placeholder?: string;
}) {
  return (
    <div className="hb-search" data-hb-search="" data-index={`${HANDBOOK_BASE}search_index.json`}>
      <form className="hb-search-field" role="search" action={HANDBOOK_BASE} method="get">
        <label className="sr-only" htmlFor={`${id}-input`}>
          Search the handbook
        </label>
        <svg
          className="hb-search-icon"
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          id={`${id}-input`}
          className="hb-search-input"
          type="search"
          name="q"
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded="false"
          aria-controls={`${id}-results`}
          suppressHydrationWarning
        />
        <kbd className="hb-search-kbd" aria-hidden="true">
          /
        </kbd>
      </form>
      {/*
        handbook.client.js fills this listbox; the empty `__html` tells React
        not to reconcile its children, so a query typed before hydration
        cannot trigger a hydration mismatch (same trick as the post TOC).
      */}
      <div
        id={`${id}-results`}
        className="hb-search-results"
        role="listbox"
        aria-label="Search results"
        hidden
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: "" }}
      />
    </div>
  );
}
