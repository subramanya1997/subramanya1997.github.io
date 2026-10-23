  (function() {
    'use strict';

    // Handbook chrome: section-level search, the mobile contents drawer, and
    // sortable / filterable tables. Everything is delegated from `document`
    // and looks elements up at event time, so React hydration replacing the
    // server-rendered nodes cannot drop a listener (see SiteShell).

    var MAX_RESULTS = 8;
    var indexPromise = null;

    function normalize(value) {
      return String(value || '')
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[̀-ͯ]/g, '');
    }

    function terms(query) {
      return normalize(query).split(/[^a-z0-9]+/).filter(Boolean);
    }

    function escapeHtml(value) {
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    function escapeRegExp(value) {
      return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function loadIndex(url) {
      if (!indexPromise) {
        indexPromise = fetch(url, { credentials: 'same-origin' })
          .then(function(response) {
            if (!response.ok) throw new Error('HTTP ' + response.status);
            return response.json();
          })
          .then(function(entries) {
            return entries.map(function(entry) {
              entry.n = {
                section: normalize(entry.section),
                page: normalize(entry.page),
                chapter: normalize(entry.chapter),
                text: normalize(entry.text)
              };
              return entry;
            });
          })
          .catch(function(error) {
            indexPromise = null;
            throw error;
          });
      }
      return indexPromise;
    }

    function countOf(haystack, needle) {
      var count = 0;
      var at = haystack.indexOf(needle);
      while (at !== -1 && count < 6) {
        count += 1;
        at = haystack.indexOf(needle, at + needle.length);
      }
      return count;
    }

    // Every term must appear somewhere in the entry (AND). Headings outrank
    // body text, and whole-word hits outrank substring hits.
    function score(entry, words) {
      var total = 0;
      for (var i = 0; i < words.length; i++) {
        var word = words[i];
        var boundary = new RegExp('(^|[^a-z0-9])' + escapeRegExp(word));
        var hit = 0;
        if (entry.n.section.indexOf(word) !== -1) hit += boundary.test(entry.n.section) ? 10 : 6;
        if (entry.n.page.indexOf(word) !== -1) hit += boundary.test(entry.n.page) ? 6 : 4;
        if (entry.n.chapter.indexOf(word) !== -1) hit += 1;
        var inText = countOf(entry.n.text, word);
        if (inText) hit += inText + (boundary.test(entry.n.text) ? 2 : 0);
        if (!hit) return 0;
        total += hit;
      }
      return total;
    }

    function snippet(entry, words) {
      var text = entry.text;
      var lower = normalize(text);
      var at = -1;
      for (var i = 0; i < words.length && at === -1; i++) at = lower.indexOf(words[i]);
      var start = at > 60 ? text.lastIndexOf(' ', at - 50) + 1 : 0;
      var end = Math.min(text.length, start + 180);
      var piece = (start > 0 ? '… ' : '') + text.slice(start, end) + (end < text.length ? ' …' : '');
      return highlight(piece, words);
    }

    function highlight(value, words) {
      var html = escapeHtml(value);
      if (!words.length) return html;
      var pattern = new RegExp('(' + words.map(escapeRegExp).join('|') + ')', 'gi');
      return html.replace(pattern, '<mark>$1</mark>');
    }

    function search(entries, query) {
      var words = terms(query);
      if (!words.length) return { words: words, results: [] };
      var scored = [];
      for (var i = 0; i < entries.length; i++) {
        var value = score(entries[i], words);
        if (value) scored.push({ entry: entries[i], score: value });
      }
      scored.sort(function(a, b) { return b.score - a.score; });
      return { words: words, results: scored.slice(0, MAX_RESULTS) };
    }

    function rootOf(element) {
      return element && element.closest ? element.closest('[data-hb-search]') : null;
    }

    function parts(root) {
      return {
        input: root.querySelector('.hb-search-input'),
        panel: root.querySelector('.hb-search-results')
      };
    }

    // The book rail scrolls (overflow: auto), which would clip an absolutely
    // positioned panel, so the panel is fixed and pinned under its input.
    function place(root) {
      var p = parts(root);
      var rect = p.input.getBoundingClientRect();
      var gutter = 12;
      var width = Math.min(Math.max(rect.width, 480), window.innerWidth - gutter * 2);
      var left = Math.min(rect.left, window.innerWidth - width - gutter);
      p.panel.style.top = rect.bottom + 6 + 'px';
      p.panel.style.left = Math.max(gutter, left) + 'px';
      p.panel.style.width = width + 'px';
      p.panel.style.maxHeight = Math.max(200, window.innerHeight - rect.bottom - 24) + 'px';
    }

    function open(root) {
      var p = parts(root);
      p.panel.hidden = false;
      p.input.setAttribute('aria-expanded', 'true');
      place(root);
    }

    function reposition() {
      document.querySelectorAll('[data-hb-search]').forEach(function(root) {
        if (!parts(root).panel.hidden) place(root);
      });
    }

    window.addEventListener('resize', reposition, { passive: true });
    window.addEventListener('scroll', reposition, { passive: true, capture: true });

    function close(root) {
      var p = parts(root);
      p.panel.hidden = true;
      p.input.setAttribute('aria-expanded', 'false');
      p.input.removeAttribute('aria-activedescendant');
    }

    function render(root, query) {
      var p = parts(root);
      var id = p.panel.id;
      if (!query.trim()) {
        close(root);
        return;
      }
      open(root);
      if (!p.panel.innerHTML) {
        p.panel.innerHTML = '<p class="hb-search-status">Loading…</p>';
      }

      loadIndex(root.getAttribute('data-index')).then(function(entries) {
        if (p.input.value !== query) return;
        var found = search(entries, query);
        if (!found.results.length) {
          p.panel.innerHTML =
            '<p class="hb-search-status">No matches for <strong>' + escapeHtml(query) +
            '</strong>. Try a building name, a bus route number, or a course code.</p>';
          return;
        }
        var items = found.results.map(function(result, index) {
          var entry = result.entry;
          var title = highlight(entry.page, found.words) +
            (entry.section ? '<span class="hb-result-section"> · ' + highlight(entry.section, found.words) + '</span>' : '');
          return (
            '<li role="presentation"><a class="hb-result" role="option" aria-selected="false" ' +
            'id="' + id + '-' + index + '" href="' + escapeHtml(entry.url) + '">' +
            '<span class="hb-result-path">' + escapeHtml(entry.chapter) + '</span>' +
            '<span class="hb-result-title">' + title + '</span>' +
            (entry.text ? '<span class="hb-result-snippet">' + snippet(entry, found.words) + '</span>' : '') +
            '</a></li>'
          );
        });
        p.panel.innerHTML =
          '<ul class="hb-search-list" role="presentation">' + items.join('') + '</ul>' +
          '<p class="hb-search-hint" aria-hidden="true"><span><kbd>↑</kbd> <kbd>↓</kbd> to move</span>' +
          '<span><kbd>↵</kbd> to open</span><span><kbd>esc</kbd> to close</span></p>';
      }).catch(function() {
        p.panel.innerHTML = '<p class="hb-search-status">Search is unavailable right now.</p>';
      });
    }

    function move(root, delta) {
      var p = parts(root);
      var options = Array.prototype.slice.call(p.panel.querySelectorAll('.hb-result'));
      if (!options.length) return;
      var current = options.findIndex(function(option) {
        return option.getAttribute('aria-selected') === 'true';
      });
      var next = (current + delta + options.length) % options.length;
      if (current === -1 && delta < 0) next = options.length - 1;
      options.forEach(function(option, index) {
        option.setAttribute('aria-selected', index === next ? 'true' : 'false');
      });
      p.input.setAttribute('aria-activedescendant', options[next].id);
      options[next].scrollIntoView({ block: 'nearest' });
    }

    document.addEventListener('input', function(event) {
      var root = rootOf(event.target);
      if (!root || !event.target.classList.contains('hb-search-input')) return;
      render(root, event.target.value);
    });

    document.addEventListener('focusin', function(event) {
      var root = rootOf(event.target);
      if (!root || !event.target.classList.contains('hb-search-input')) return;
      loadIndex(root.getAttribute('data-index')).catch(function() {});
      if (event.target.value.trim()) render(root, event.target.value);
    });

    document.addEventListener('keydown', function(event) {
      var root = rootOf(event.target);
      if (root && event.target.classList.contains('hb-search-input')) {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault();
          move(root, event.key === 'ArrowDown' ? 1 : -1);
        } else if (event.key === 'Enter') {
          var p = parts(root);
          var chosen = p.panel.querySelector('.hb-result[aria-selected="true"]') ||
            p.panel.querySelector('.hb-result');
          event.preventDefault();
          if (chosen) chosen.click();
        } else if (event.key === 'Escape') {
          event.target.value = '';
          close(root);
          event.target.blur();
        }
        return;
      }

      // "/" or Cmd/Ctrl+K jumps to search from anywhere on the page.
      var typing = event.target.closest &&
        event.target.closest('input, textarea, select, [contenteditable="true"]');
      var shortcut = (event.key === '/' && !typing) ||
        ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k');
      if (shortcut) {
        var input = visibleSearchInput();
        if (!input) return;
        event.preventDefault();
        if (!isVisible(input)) setDrawer(true);
        input.focus();
        input.select();
      } else if (event.key === 'Escape' && document.querySelector('.hb-nav-open')) {
        setDrawer(false);
      }
    });

    document.addEventListener('click', function(event) {
      var target = event.target;
      document.querySelectorAll('[data-hb-search]').forEach(function(root) {
        if (!root.contains(target)) close(root);
      });

      var result = target.closest && target.closest('.hb-result');
      if (result) {
        var root = rootOf(result);
        if (root) close(root);
        setDrawer(false);
      }

      if (target.closest && target.closest('[data-hb-nav-toggle]')) {
        event.preventDefault();
        setDrawer(!document.querySelector('.hb-nav-open'));
        return;
      }
      if (target.closest && (target.closest('.hb-scrim') || target.closest('.hb-nav a'))) {
        setDrawer(false);
      }
    });

    function isVisible(element) {
      return !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length) &&
        getComputedStyle(element).visibility !== 'hidden';
    }

    // Prefer a search box that is on screen (the landing hero); otherwise the
    // one in the book rail, which lives in the drawer on small screens.
    function visibleSearchInput() {
      var inputs = Array.prototype.slice.call(document.querySelectorAll('[data-hb-search] .hb-search-input'));
      var onScreen = inputs.filter(function(input) {
        if (!isVisible(input)) return false;
        var rect = input.getBoundingClientRect();
        return rect.bottom > 0 && rect.top < window.innerHeight;
      });
      return onScreen[0] || document.getElementById('hb-search-rail-input') || inputs[0];
    }

    // --- Mobile drawer -------------------------------------------------------

    function setDrawer(openState) {
      var shell = document.querySelector('[data-hb]');
      if (!shell) return;
      shell.classList.toggle('hb-nav-open', openState);
      document.querySelectorAll('[data-hb-nav-toggle]').forEach(function(button) {
        button.setAttribute('aria-expanded', openState ? 'true' : 'false');
      });
      document.documentElement.style.overflow = openState ? 'hidden' : '';
    }

    // --- Tables --------------------------------------------------------------

    function cellValue(cell) {
      var text = (cell ? cell.textContent : '').trim();
      var number = text.replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
      return { text: text, number: number ? parseFloat(number[0]) : null };
    }

    function enhanceTable(table) {
      var body = table.tBodies[0];
      var head = table.tHead;
      if (!body || !head || body.rows.length < 2) return;
      var rows = Array.prototype.slice.call(body.rows);
      var headers = Array.prototype.slice.call(head.rows[0].cells);

      headers.forEach(function(th, column) {
        var values = rows.map(function(row) { return cellValue(row.cells[column]); });
        // Image columns (floor plans) have nothing to sort on.
        if (values.every(function(value) { return !value.text; })) return;
        var numeric = values.every(function(value) { return !value.text || value.number !== null; });

        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'hb-sort';
        while (th.firstChild) button.appendChild(th.firstChild);
        th.appendChild(button);
        th.setAttribute('aria-sort', 'none');

        button.addEventListener('click', function() {
          var ascending = th.getAttribute('aria-sort') !== 'ascending';
          headers.forEach(function(other) {
            if (other.hasAttribute('aria-sort')) other.setAttribute('aria-sort', 'none');
          });
          th.setAttribute('aria-sort', ascending ? 'ascending' : 'descending');
          var sorted = Array.prototype.slice.call(body.rows).sort(function(a, b) {
            var x = cellValue(a.cells[column]);
            var y = cellValue(b.cells[column]);
            var order;
            if (numeric) {
              order = (x.number === null ? Infinity : x.number) - (y.number === null ? Infinity : y.number);
            } else {
              order = x.text.localeCompare(y.text, undefined, { numeric: true, sensitivity: 'base' });
            }
            return ascending ? order : -order;
          });
          sorted.forEach(function(row) { body.appendChild(row); });
        });
      });

      // Long tables (the housing overview) also get a quick row filter.
      if (rows.length >= 8) {
        var wrapper = table.closest('.table-wrapper') || table;
        var tools = document.createElement('div');
        tools.className = 'hb-table-tools';
        var input = document.createElement('input');
        input.type = 'search';
        input.className = 'hb-search-input';
        input.placeholder = 'Filter rows (e.g. 31, 2bd, Yes)';
        input.setAttribute('aria-label', 'Filter table rows');
        var count = document.createElement('span');
        count.className = 'hb-table-count';
        count.setAttribute('aria-live', 'polite');
        count.textContent = rows.length + ' rows';
        tools.appendChild(input);
        tools.appendChild(count);
        wrapper.parentNode.insertBefore(tools, wrapper);

        input.addEventListener('input', function() {
          var words = terms(input.value);
          var shown = 0;
          rows.forEach(function(row) {
            var text = normalize(row.textContent);
            var match = words.every(function(word) { return text.indexOf(word) !== -1; });
            row.hidden = !match;
            if (match) shown += 1;
          });
          count.textContent = words.length ? shown + ' of ' + rows.length + ' rows' : rows.length + ' rows';
        });
      }
    }

    function init() {
      document.querySelectorAll('.hb .post-content table').forEach(enhanceTable);

      // Keep the current page visible in the rail's scroll area, and fade the
      // edges of that area while there is more to scroll.
      var nav = document.querySelector('.hb-nav');
      if (nav) {
        var current = nav.querySelector('[aria-current="page"]');
        if (current && current.offsetTop + current.offsetHeight > nav.clientHeight) {
          nav.scrollTop = current.offsetTop - nav.clientHeight / 2;
        }
        var fade = function() {
          var edges = [];
          if (nav.scrollTop > 2) edges.push('top');
          if (nav.scrollTop + nav.clientHeight < nav.scrollHeight - 2) edges.push('bottom');
          if (edges.length) nav.setAttribute('data-fade', edges.join(' '));
          else nav.removeAttribute('data-fade');
        };
        nav.addEventListener('scroll', fade, { passive: true });
        nav.addEventListener('toggle', function(event) {
          fade();
          // Remember collapsed chapters across pages (restored by the inline
          // NAV_STATE_SCRIPT in HandbookLayout before first paint).
          var group = event.target;
          if (!group.matches || !group.matches('details[data-chapter]')) return;
          try {
            var closed = JSON.parse(localStorage.getItem('hb-nav-closed') || '[]');
            var id = group.getAttribute('data-chapter');
            closed = closed.filter(function(value) { return value !== id; });
            if (!group.open) closed.push(id);
            localStorage.setItem('hb-nav-closed', JSON.stringify(closed));
          } catch (e) {}
        }, true);
        window.addEventListener('resize', fade, { passive: true });
        fade();
      }

      // `?q=` deep links open the search with the query filled in.
      var query = new URLSearchParams(window.location.search).get('q');
      if (query) {
        var openQuery = function() {
          var input = visibleSearchInput();
          if (!input) return;
          input.value = query;
          if (!isVisible(input)) setDrawer(true);
          input.focus();
          var root = rootOf(input);
          if (root) render(root, query);
        };
        openQuery();
      }
    }

    // After `load`, so React has hydrated before the tables are rewritten.
    if (document.readyState === 'complete') {
      setTimeout(init, 0);
    } else {
      window.addEventListener('load', function() { setTimeout(init, 0); });
    }
  })();
