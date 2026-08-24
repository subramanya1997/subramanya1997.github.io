---
layout: page
title: Search
permalink: /search/
custom_layout: true
description: Search posts and books across the archive.
robots: noindex, follow
page_stylesheets:
  - /assets/css/components/content-cards.css
  - /assets/css/pages/search.css
page_scripts:
  - /assets/js/components/discovery.js
  - /assets/js/pages/search.js
---

<div class="search-page" data-search-page>
  <div class="search-shell">
    <header class="search-hero">
      <p class="search-overline">Archive search</p>
      <h1>Search posts and books</h1>
      <p class="search-intro">
        Search across essays, notes, and book writeups by title, excerpt, tag, or full text.
      </p>
    </header>

    <form id="search-page-form" class="search-form" action="{{ '/search/' | prepend: site.baseurl }}" method="get" role="search" data-preserve-lang>
      <div class="search-input-row">
        <label class="sr-only" for="search-page-input">Search query</label>
        <input id="search-page-input" class="search-input" type="search" name="q" placeholder="Try: AI agents, OIDC, auth, or a tag name">
        <input id="search-kind-input" type="hidden" name="kind" value="">
        <button class="search-submit" type="submit">Search</button>
      </div>

      <div class="search-filters" role="group" aria-label="Filter results by type">
        <button class="search-filter" type="button" data-search-kind="" aria-pressed="true">All</button>
        <button class="search-filter" type="button" data-search-kind="post" aria-pressed="false">Posts</button>
        <button class="search-filter" type="button" data-search-kind="book" aria-pressed="false">Books</button>
      </div>
    </form>

    <div class="search-meta">
      <p id="search-status" class="search-status">Loading search index…</p>
      <a class="search-meta-link" href="{{ '/tags/' | prepend: site.baseurl }}" data-preserve-lang>Browse tags</a>
    </div>

    <div id="search-results" class="search-results" aria-live="polite"></div>
  </div>
</div>
