(function() {
  "use strict";

  function getKindLabel(kind) {
    if (kind === "post") return "posts";
    if (kind === "book") return "books";
    return "items";
  }

  document.addEventListener("DOMContentLoaded", function() {
    var page = document.querySelector("[data-search-page]");
    if (!page || !window.ContentDiscovery) return;

    var form = document.getElementById("search-page-form");
    var input = document.getElementById("search-page-input");
    var kindInput = document.getElementById("search-kind-input");
    var status = document.getElementById("search-status");
    var results = document.getElementById("search-results");
    var filters = Array.prototype.slice.call(document.querySelectorAll("[data-search-kind]"));
    var headerInput = document.getElementById("site-search-input");

    function readState() {
      var params = new URLSearchParams(window.location.search);
      return {
        query: (params.get("q") || "").trim(),
        kind: (params.get("kind") || "").trim()
      };
    }

    function writeState(state) {
      var url = new URL(window.location.href);

      if (state.query) {
        url.searchParams.set("q", state.query);
      } else {
        url.searchParams.delete("q");
      }

      if (state.kind) {
        url.searchParams.set("kind", state.kind);
      } else {
        url.searchParams.delete("kind");
      }

      if (window.SiteLanguage) {
        var lang = window.SiteLanguage.getCurrentLanguage();
        if (lang) {
          url.searchParams.set("lang", lang);
        } else {
          url.searchParams.delete("lang");
        }
      }

      window.history.replaceState({ query: state.query, kind: state.kind }, "", url.pathname + url.search);
    }

    function setActiveFilter(kind) {
      filters.forEach(function(filter) {
        var isActive = filter.dataset.searchKind === kind;
        filter.classList.toggle("is-active", isActive);
        filter.setAttribute("aria-pressed", isActive ? "true" : "false");
      });
    }

    async function render(state) {
      input.value = state.query;
      kindInput.value = state.kind;
      setActiveFilter(state.kind);

      if (headerInput) {
        headerInput.value = state.query;
      }

      try {
        var items = await window.ContentDiscovery.loadIndex();
        var matches = state.query
          ? window.ContentDiscovery.searchItems(items, state.query, state.kind)
          : window.ContentDiscovery.getRecentItems(items, state.kind, 8);

        if (state.query) {
          if (matches.length > 0) {
            status.textContent = matches.length + " result" + (matches.length === 1 ? "" : "s") + " for “" + state.query + "” in " + getKindLabel(state.kind) + ".";
            results.innerHTML = window.ContentDiscovery.renderResults(matches);
          } else {
            status.textContent = "No results for “" + state.query + "”.";
            results.innerHTML = window.ContentDiscovery.renderEmptyState({
              title: "No matches found",
              copy: "Try a broader phrase, a tag name, or switch the filter back to all results.",
              actionHref: "/tags/",
              actionLabel: "Browse tags"
            });
          }
        } else {
          var kindText = state.kind ? "Latest " + getKindLabel(state.kind) : "Latest posts and books";
          status.textContent = kindText + " while you decide what to search for.";
          results.innerHTML = window.ContentDiscovery.renderResults(matches);
        }

        if (window.SiteLanguage) {
          window.SiteLanguage.apply(results);
        }
      } catch (error) {
        status.textContent = "Search is temporarily unavailable.";
        results.innerHTML = window.ContentDiscovery.renderEmptyState({
          title: "Search index unavailable",
          copy: "The search index could not be loaded just now. You can still browse the tag archive.",
          actionHref: "/tags/",
          actionLabel: "Open tags"
        });
        if (window.SiteLanguage) {
          window.SiteLanguage.apply(results);
        }
      }
    }

    form.addEventListener("submit", function(event) {
      event.preventDefault();
      var nextState = {
        query: input.value.trim(),
        kind: kindInput.value.trim()
      };

      writeState(nextState);
      render(nextState);
    });

    filters.forEach(function(filter) {
      filter.addEventListener("click", function() {
        var nextState = {
          query: input.value.trim(),
          kind: filter.dataset.searchKind || ""
        };

        kindInput.value = nextState.kind;
        writeState(nextState);
        render(nextState);
      });
    });

    window.addEventListener("popstate", function() {
      render(readState());
    });

    render(readState());
  });
})();
