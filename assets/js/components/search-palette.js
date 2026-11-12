// Site-wide search palette: "/" or Cmd/Ctrl+K (or the header trigger) opens a
// modal with live results. Loaded on every page by components/site/SiteShell.tsx.
//
// Searching happens on the server: each query is a small GET to /api/search/
// (app/api/search/route.dynamic.ts), which returns a dozen ranked hits. The
// browser never downloads the index, and repeat queries come from the CDN.
//
// The dialog is built here and appended to <body> rather than server-rendered,
// and every listener delegates from `document`, so React hydration replacing
// the header nodes cannot drop anything (see the note in SiteShell.tsx).
(function() {
  "use strict";

  var ENDPOINT = "/api/search/";
  var DEBOUNCE_MS = 90;

  var ICONS = {
    search: '<circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>',
    post: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"></path><polyline points="14 3 14 8 19 8"></polyline><line x1="9" y1="13" x2="15" y2="13"></line><line x1="9" y1="17" x2="13" y2="17"></line>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>',
    loop: '<polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path>',
    section: '<line x1="4" y1="9" x2="20" y2="9"></line><line x1="4" y1="15" x2="20" y2="15"></line><line x1="10" y1="3" x2="8" y2="21"></line><line x1="16" y1="3" x2="14" y2="21"></line>',
    link: '<line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline>',
    enter: '<polyline points="9 10 4 15 9 20"></polyline><path d="M20 4v7a4 4 0 0 1-4 4H4"></path>'
  };
  var KIND_LABELS = { post: "Post", book: "Book", loop: "Loop" };

  var dialog = null;
  var input = null;
  var list = null;
  var cache = {};
  var controller = null;
  var timer = null;
  var options = [];
  var active = -1;
  var lastFocus = null;
  var renderToken = 0;

  function icon(name, size) {
    return '<svg class="sp-icon" xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size +
      '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      ICONS[name] + "</svg>";
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function normalize(value) {
    return String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
  }

  // Escapes `text` and wraps every occurrence of a term in <mark>.
  function highlight(text, terms) {
    text = String(text || "");
    if (!terms || !terms.length) return escapeHtml(text);
    var pattern = terms
      .slice()
      .sort(function(a, b) { return b.length - a.length; })
      .map(function(term) { return term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); })
      .join("|");
    return text.split(new RegExp("(" + pattern + ")", "gi")).map(function(part, index) {
      return index % 2 ? "<mark>" + escapeHtml(part) + "</mark>" : escapeHtml(part);
    }).join("");
  }

  // One request per distinct query; answers are kept for the page's lifetime.
  function request(query) {
    if (cache[query]) return cache[query];
    if (controller) controller.abort();
    controller = typeof AbortController === "function" ? new AbortController() : null;
    var base = document.documentElement.dataset.baseurl || "";
    var url = base + ENDPOINT + (query ? "?q=" + encodeURIComponent(query) : "");
    var pending = fetch(url, controller ? { signal: controller.signal } : undefined)
      .then(function(response) {
        if (!response.ok) throw new Error("search " + response.status);
        return response.json();
      });
    cache[query] = pending;
    pending.catch(function() { delete cache[query]; });
    return pending;
  }

  function row(href, iconName, titleHtml, subHtml) {
    return '<a class="sp-item" role="option" aria-selected="false" tabindex="-1" data-preserve-lang href="' +
      escapeHtml(href) + '">' + icon(iconName, 16) +
      '<span class="sp-item-body"><span class="sp-item-title">' + titleHtml + "</span>" +
      (subHtml ? '<span class="sp-item-sub">' + subHtml + "</span>" : "") + "</span>" +
      '<span class="sp-item-enter">' + icon("enter", 14) + "</span></a>";
  }

  function meta(hit) {
    return [hit.date].concat(hit.tags || []).filter(Boolean).join(" · ");
  }

  function resultRow(hit, terms) {
    var separator = '<span class="sp-sep" aria-hidden="true">›</span>';
    var detail = hit.snippet ? highlight(hit.snippet, terms) : escapeHtml(meta(hit));
    if (hit.type === "section") {
      return row(
        hit.url,
        "section",
        highlight(hit.heading, terms),
        '<span class="sp-item-kind">' + escapeHtml(hit.title) + "</span>" + (detail ? separator + detail : "")
      );
    }
    return row(
      hit.url,
      ICONS[hit.kind] ? hit.kind : "post",
      highlight(hit.title, terms),
      '<span class="sp-item-kind">' + (KIND_LABELS[hit.kind] || "Page") + "</span>" + (detail ? separator + detail : "")
    );
  }

  function group(label) {
    return '<div class="sp-group" role="presentation">' + escapeHtml(label) + "</div>";
  }

  function message(text) {
    return '<div class="sp-message" role="presentation">' + text + "</div>";
  }

  function searchPageUrl(query) {
    return "/search/" + (query ? "?q=" + encodeURIComponent(query) : "");
  }

  // "Go to" mirrors whatever the header nav links to.
  function navRows() {
    var seen = {};
    var pages = [];
    Array.prototype.forEach.call(document.querySelectorAll("#nav-menu a.page-link"), function(link) {
      var href = link.getAttribute("href");
      if (!href || seen[href]) return;
      seen[href] = true;
      pages.push(row(href, "link", escapeHtml(link.textContent.trim()), ""));
    });
    if (!seen["/tags/"]) pages.push(row("/tags/", "link", "Tags", ""));
    return group("Go to") + pages.join("");
  }

  function emptyQueryHtml(hits) {
    var recent = hits.map(function(hit) {
      return row(hit.url, "post", escapeHtml(hit.title), escapeHtml(meta(hit)));
    }).join("");
    return (recent ? group("Recent posts") + recent : "") + navRows();
  }

  function setList(html) {
    list.innerHTML = html;
    options = Array.prototype.slice.call(list.querySelectorAll(".sp-item"));
    options.forEach(function(option, index) { option.id = "sp-option-" + index; });
    if (window.SiteLanguage) window.SiteLanguage.apply(list);
    list.scrollTop = 0;
    setActive(options.length ? 0 : -1, false);
  }

  function setActive(index, scroll) {
    if (active >= 0 && options[active]) {
      options[active].classList.remove("is-active");
      options[active].setAttribute("aria-selected", "false");
    }
    active = index;
    var option = options[active];
    if (option) {
      option.classList.add("is-active");
      option.setAttribute("aria-selected", "true");
      input.setAttribute("aria-activedescendant", option.id);
      if (scroll) option.scrollIntoView({ block: "nearest" });
    } else {
      input.removeAttribute("aria-activedescendant");
    }
  }

  function show(raw, data) {
    if (!data.query) {
      setList(emptyQueryHtml(data.results));
      return;
    }
    if (!data.results.length) {
      setList(
        message("No results for <strong>“" + escapeHtml(raw) + "”</strong>. Try a broader phrase or a tag name.") +
        row("/tags/", "link", "Browse all tags", "")
      );
      return;
    }
    var html = "";
    if (data.corrected) {
      html += group("Showing results for “" + data.corrected + "”");
    }
    html += data.results.map(function(hit) { return resultRow(hit, data.terms); }).join("");
    html += row(
      searchPageUrl(raw),
      "search",
      "See all results for <mark>" + escapeHtml(raw) + "</mark>",
      ""
    );
    setList(html);
  }

  function render(immediate) {
    var token = ++renderToken;
    var raw = input.value.trim();
    var query = normalize(raw);
    clearTimeout(timer);

    function run() {
      request(query).then(function(data) {
        if (token !== renderToken || !isOpen()) return;
        show(raw, data);
      }).catch(function(error) {
        if (token !== renderToken || !isOpen() || (error && error.name === "AbortError")) return;
        setList(
          message("Search is temporarily unavailable.") +
          row(searchPageUrl(raw), "search", "Open the search page", "")
        );
      });
    }

    // Cached answers and the empty state render at once; typing is debounced
    // so a fast typist sends one request, not one per key.
    if (immediate === true || !query || cache[query]) run();
    else timer = setTimeout(run, DEBOUNCE_MS);
  }

  function build() {
    dialog = document.createElement("div");
    dialog.className = "sp-root";
    dialog.hidden = true;
    dialog.innerHTML =
      '<div class="sp-backdrop" data-search-close></div>' +
      '<div class="sp-panel" role="dialog" aria-modal="true" aria-label="Search posts and books">' +
        '<div class="sp-field">' + icon("search", 17) +
          '<input class="sp-input" id="sp-input" type="search" placeholder="Search posts, books and loops…" ' +
            'autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" enterkeyhint="go" ' +
            'role="combobox" aria-expanded="true" aria-autocomplete="list" aria-controls="sp-results" ' +
            'aria-label="Search posts, books and loops">' +
          '<button class="sp-esc" type="button" data-search-close aria-label="Close search"><kbd>esc</kbd></button>' +
        "</div>" +
        '<div class="sp-results" id="sp-results" role="listbox" aria-label="Search results"></div>' +
        '<div class="sp-footer" aria-hidden="true">' +
          "<span><kbd>↑</kbd><kbd>↓</kbd> Select</span>" +
          "<span><kbd>↵</kbd> Open</span>" +
          '<span class="sp-footer-end"><kbd>esc</kbd> Close</span>' +
        "</div>" +
      "</div>";
    document.body.appendChild(dialog);
    input = dialog.querySelector(".sp-input");
    list = dialog.querySelector(".sp-results");

    input.addEventListener("input", function() { render(false); });

    list.addEventListener("mousemove", function(event) {
      var option = event.target.closest && event.target.closest(".sp-item");
      var index = options.indexOf(option);
      if (index !== -1 && index !== active) setActive(index, false);
    });

    // Following a result closes the palette, so Back returns to a clean page.
    list.addEventListener("click", function(event) {
      if (event.target.closest && event.target.closest(".sp-item") &&
          !(event.metaKey || event.ctrlKey || event.shiftKey)) {
        close(false);
      }
    });
  }

  function isOpen() {
    return !!dialog && !dialog.hidden;
  }

  function open() {
    if (!dialog) build();
    if (isOpen()) {
      input.focus();
      input.select();
      return;
    }
    lastFocus = document.activeElement;
    dialog.hidden = false;
    document.documentElement.classList.add("sp-open");
    input.value = "";
    if (!list.firstChild) setList(navRows());
    render(true);
    input.focus();
  }

  function close(restoreFocus) {
    if (!isOpen()) return;
    dialog.hidden = true;
    document.documentElement.classList.remove("sp-open");
    renderToken++;
    clearTimeout(timer);
    if (restoreFocus !== false && lastFocus && lastFocus.focus) lastFocus.focus();
    lastFocus = null;
  }

  function isTyping(target) {
    return !!(target && target.closest &&
      target.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]'));
  }

  document.addEventListener("keydown", function(event) {
    if (isOpen()) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        if (!options.length) return;
        var step = event.key === "ArrowDown" ? 1 : -1;
        setActive((active + step + options.length) % options.length, true);
      } else if (event.key === "Enter") {
        var option = options[active];
        if (!option || event.isComposing) return;
        event.preventDefault();
        if (event.metaKey || event.ctrlKey) {
          window.open(option.href, "_blank", "noopener");
        } else {
          close(false);
          window.location.assign(option.href);
        }
      } else if (event.key === "Tab") {
        // The input is the only tab stop; results are reached with the arrows.
        event.preventDefault();
        input.focus();
      } else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        close();
      }
      return;
    }

    if (event.defaultPrevented || event.altKey) return;
    var slash = event.key === "/" && !event.metaKey && !event.ctrlKey && !isTyping(event.target);
    var commandK = (event.metaKey || event.ctrlKey) && !event.shiftKey && event.key.toLowerCase() === "k";
    if (!slash && !commandK) return;

    // The handbook binds the same keys to its own in-page search box.
    if (document.querySelector("[data-hb-search]")) return;

    event.preventDefault();
    open();
  });

  document.addEventListener("click", function(event) {
    var target = event.target;
    if (!target.closest) return;
    if (target.closest("[data-search-close]")) {
      close();
      return;
    }
    var trigger = target.closest("[data-search-open]");
    if (!trigger || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    open();
  });

  // Fetch the empty-state answer as soon as the pointer or focus reaches the
  // trigger, so the palette opens already filled.
  function warm(event) {
    if (event.target.closest && event.target.closest("[data-search-open]")) {
      request("").catch(function() {});
    }
  }
  document.addEventListener("pointerover", warm, { passive: true });
  document.addEventListener("focusin", warm);

  // bfcache: never come back to a page with the palette still open.
  window.addEventListener("pageshow", function() { close(false); });
})();
