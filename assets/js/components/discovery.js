(function() {
  "use strict";

  var indexPromise = null;

  function getIndexUrl() {
    var baseUrl = document.documentElement.dataset.baseurl || "";
    return baseUrl + "/search.json";
  }

  function normalizeText(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function getTagNames(item) {
    return (item.tags || []).map(function(tag) { return tag.name; });
  }

  function sortByDateDesc(items) {
    return items.slice().sort(function(left, right) {
      return String(right.date_iso || "").localeCompare(String(left.date_iso || ""));
    });
  }

  function scoreItem(item, tokens, normalizedQuery) {
    var title = normalizeText(item.title);
    var excerpt = normalizeText(item.excerpt);
    var content = normalizeText(item.content);
    var tags = normalizeText(getTagNames(item).join(" "));
    var combined = [title, excerpt, content, tags, item.kind].join(" ");

    if (!tokens.every(function(token) { return combined.indexOf(token) !== -1; })) {
      return -1;
    }

    var score = 0;

    if (title === normalizedQuery) {
      score += 120;
    }

    tokens.forEach(function(token) {
      if (title.indexOf(token) !== -1) score += 40;
      if (tags.indexOf(token) !== -1) score += 24;
      if (excerpt.indexOf(token) !== -1) score += 12;
      if (content.indexOf(token) !== -1) score += 4;
    });

    return score;
  }

  function searchItems(items, query, kind) {
    var normalizedQuery = normalizeText(query);
    var tokens = normalizedQuery.split(" ").filter(Boolean);

    return items
      .filter(function(item) {
        return !kind || item.kind === kind;
      })
      .map(function(item) {
        return { item: item, score: scoreItem(item, tokens, normalizedQuery) };
      })
      .filter(function(result) {
        return result.score >= 0;
      })
      .sort(function(left, right) {
        if (right.score !== left.score) {
          return right.score - left.score;
        }

        return String(right.item.date_iso || "").localeCompare(String(left.item.date_iso || ""));
      })
      .map(function(result) { return result.item; });
  }

  function getRecentItems(items, kind, limit) {
    return sortByDateDesc(items.filter(function(item) {
      return !kind || item.kind === kind;
    })).slice(0, limit || 8);
  }

  function renderTags(item) {
    if (!item.tags || item.tags.length === 0) {
      return "";
    }

    var className = item.kind === "book" ? "book-tags" : "post-tags";
    var tagsHtml = item.tags.map(function(tag) {
      return '<a class="tag" href="' + escapeHtml(tag.url) + '" data-preserve-lang>' + escapeHtml(tag.name) + "</a>";
    }).join("");

    return '<div class="' + className + '">' + tagsHtml + "</div>";
  }

  function renderMeta(item) {
    if (item.kind === "book") {
      return [
        '<div class="book-meta">',
        '<span class="result-kind result-kind--book">Book</span>',
        '<span class="book-date">' + escapeHtml(item.date_display) + "</span>",
        "</div>"
      ].join("");
    }

    var stats = [];
    if (typeof item.views === "number" && item.views > 0) {
      stats.push(item.views.toLocaleString() + " views");
    }
    if (typeof item.reading_minutes === "number" && item.reading_minutes > 0) {
      stats.push(item.reading_minutes + " min read");
    }

    return [
      '<div class="post-meta">',
      '<span class="result-kind result-kind--post">Post</span>',
      '<span class="post-date">' + escapeHtml(item.date_display) + "</span>",
      stats.length ? '<span class="post-reading-time">' + escapeHtml(stats.join(" · ")) + "</span>" : "",
      "</div>"
    ].join("");
  }

  function renderResult(item) {
    var isBook = item.kind === "book";
    var cardClass = isBook ? "book-entry search-result search-result--book" : "blog-post search-result search-result--post";
    var titleClass = isBook ? "book-title" : "post-title";
    var excerptClass = isBook ? "book-excerpt" : "post-excerpt";

    return [
      '<article class="' + cardClass + '">',
      renderMeta(item),
      '<h2 class="' + titleClass + '"><a href="' + escapeHtml(item.url) + '" data-preserve-lang>' + escapeHtml(item.title) + "</a></h2>",
      renderTags(item),
      '<div class="' + excerptClass + '">' + escapeHtml(item.excerpt) + "</div>",
      '<a href="' + escapeHtml(item.url) + '" class="continue-reading" data-preserve-lang>',
      "Continue reading",
      '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">',
      '<line x1="5" y1="12" x2="19" y2="12"></line>',
      '<polyline points="12 5 19 12 12 19"></polyline>',
      "</svg>",
      "</a>",
      "</article>"
    ].join("");
  }

  function renderResults(items) {
    return items.map(function(item, index) {
      var html = renderResult(item);

      if (index < items.length - 1) {
        html += '<hr class="post-divider">';
      }

      return html;
    }).join("");
  }

  function renderEmptyState(options) {
    var action = "";

    if (options.actionHref && options.actionLabel) {
      action = '<a class="search-empty-link" href="' + escapeHtml(options.actionHref) + '" data-preserve-lang>' + escapeHtml(options.actionLabel) + "</a>";
    }

    return [
      '<div class="search-empty-state">',
      '<h2>' + escapeHtml(options.title) + "</h2>",
      '<p>' + escapeHtml(options.copy) + "</p>",
      action,
      "</div>"
    ].join("");
  }

  function loadIndex() {
    if (!indexPromise) {
      indexPromise = fetch(getIndexUrl()).then(function(response) {
        if (!response.ok) {
          throw new Error("Failed to load search index (" + response.status + ")");
        }

        return response.json();
      });
    }

    return indexPromise;
  }

  window.ContentDiscovery = {
    loadIndex: loadIndex,
    searchItems: searchItems,
    getRecentItems: getRecentItems,
    renderResults: renderResults,
    renderEmptyState: renderEmptyState
  };
})();
