
  document.addEventListener('DOMContentLoaded', function () {
    // Initialize Mermaid diagrams
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default'
    });
    window.mermaid.init(undefined, document.querySelectorAll('.language-mermaid'));

    // Create overlay element (for dim background on zoom)
    const overlay = document.createElement('div');
    overlay.id = 'mermaid-overlay';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', () => {
      document.querySelectorAll('.mermaid-container.zoomed').forEach(c => c.classList.remove('zoomed'));
      overlay.classList.remove('active');
    });

    // Wrap each rendered diagram in a container that supports scroll + zoom
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
  });
