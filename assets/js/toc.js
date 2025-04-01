document.addEventListener('DOMContentLoaded', function() {
  // Smooth scrolling for TOC links
  const tocLinks = document.querySelectorAll('.toc a');
  
  tocLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      
      const targetId = this.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 80, // Offset for fixed header
          behavior: 'smooth'
        });
        
        // Update URL hash without scrolling
        history.pushState(null, null, targetId);
      }
    });
  });
  
  // Highlight active section in TOC as user scrolls
  const headings = document.querySelectorAll('h2, h3, h4, h5, h6');
  
  if (headings.length > 0) {
    const headingElements = Array.from(headings);
    
    function highlightToc() {
      let currentHeadingIndex = -1;
      
      // Find which heading is in view
      headingElements.forEach((heading, index) => {
        const rect = heading.getBoundingClientRect();
        if (rect.top <= 100) {
          currentHeadingIndex = index;
        }
      });
      
      // Clear all active classes
      tocLinks.forEach(link => {
        link.classList.remove('active');
      });
      
      // Add active class to current heading's link
      if (currentHeadingIndex >= 0) {
        const activeHeading = headingElements[currentHeadingIndex];
        const activeLink = document.querySelector(`.toc a[href="#${activeHeading.id}"]`);
        
        if (activeLink) {
          activeLink.classList.add('active');
        }
      }
    }
    
    window.addEventListener('scroll', highlightToc);
    highlightToc(); // Initialize on page load
  }
}); 