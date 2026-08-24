
  document.addEventListener('DOMContentLoaded', function () {
    var sources = new WeakMap();

    function activeScheme() {
      var attr = document.documentElement.getAttribute('data-theme');
      if (attr === 'dark' || attr === 'light') return attr;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    function renderDiagrams() {
      var nodes = document.querySelectorAll('.language-mermaid');
      nodes.forEach(function (node) {
        if (!sources.has(node)) sources.set(node, node.textContent);
        node.textContent = sources.get(node);
        node.removeAttribute('data-processed');
      });

      mermaid.initialize({
        startOnLoad: false,
        theme: activeScheme() === 'dark' ? 'dark' : 'default'
      });
      window.mermaid.init(undefined, nodes);
    }

    renderDiagrams();

    // Create overlay element (for dim background on zoom)
    const overlay = document.createElement('div');
    overlay.id = 'mermaid-overlay';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', () => {
      document.querySelectorAll('.mermaid-container.zoomed').forEach(c => c.classList.remove('zoomed'));
      overlay.classList.remove('active');
    });

    // Wrap each rendered diagram in a container that supports scroll + zoom
    function wrapDiagrams() {
      document.querySelectorAll('.mermaid').forEach(diagram => {
        if (diagram.parentElement.classList.contains('mermaid-container')) return; // already wrapped
        const container = document.createElement('div');
        container.className = 'mermaid-container';
        diagram.parentNode.insertBefore(container, diagram);
        container.appendChild(diagram);

        // Toggle zoom on click
        container.addEventListener('click', () => {
          const zoomed = container.classList.toggle('zoomed');
          overlay.classList.toggle('active', zoomed);
        });
      });
    }

    wrapDiagrams();

    // Re-render with the matching mermaid palette when the theme changes.
    var repaint = function () {
      renderDiagrams();
      wrapDiagrams();
    };

    new MutationObserver(function (records) {
      for (var i = 0; i < records.length; i += 1) {
        if (records[i].attributeName === 'data-theme') {
          repaint();
          return;
        }
      }
    }).observe(document.documentElement, { attributes: true });

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
      if (!document.documentElement.hasAttribute('data-theme')) repaint();
    });
  });
