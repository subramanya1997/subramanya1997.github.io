
  (function() {
    'use strict';
    
    // TOC translations (loaded from Jekyll data)
    const tocTranslations = {
      en: { on_this_page: "On this page", share: "Share" },
      es: { on_this_page: "En esta página", share: "Compartir" },
      zh: { on_this_page: "本页目录", share: "分享" },
      hi: { on_this_page: "इस पृष्ठ पर", share: "साझा करें" },
      pt: { on_this_page: "Nesta página", share: "Compartilhar" },
      fr: { on_this_page: "Sur cette page", share: "Partager" },
      de: { on_this_page: "Auf dieser Seite", share: "Teilen" },
      ja: { on_this_page: "このページの目次", share: "共有" },
      ko: { on_this_page: "이 페이지에서", share: "공유" }
    };
    
    let tocItems = [];
    let lastActiveIndex = -1;
    let scrollHandler = null;
    
    /**
     * Generate the TOC from headings in post content
     */
    function generateTOC() {
      const toc = document.getElementById('table-of-contents');
      const tocList = document.getElementById('toc-list');
      const postContent = document.querySelector('.post-content');
      
      if (!toc || !tocList || !postContent) return;
      
      // Clear existing TOC items
      tocList.innerHTML = '';
      tocItems = [];
      lastActiveIndex = -1;
      
      // Get all h2 and h3 headings from post content
      const headings = postContent.querySelectorAll('h2, h3');
      
      // Only show TOC if there are at least 3 headings
      if (headings.length < 3) {
        toc.style.display = 'none';
        return;
      }
      
      // Generate TOC
      headings.forEach(function(heading, index) {
        // Add ID to heading if it doesn't have one
        if (!heading.id) {
          heading.id = 'heading-' + index;
        }
        
        const level = heading.tagName.toLowerCase();
        const text = heading.textContent;
        const id = heading.id;
        
        const li = document.createElement('li');
        li.className = 'toc-' + level;
        
        const a = document.createElement('a');
        a.href = '#' + id;
        a.textContent = text;
        a.setAttribute('data-heading-id', id);
        
        // Smooth scroll on click
        a.addEventListener('click', function(e) {
          e.preventDefault();
          const target = document.getElementById(id);
          if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            // Update URL without jumping
            history.pushState(null, null, '#' + id);
          }
        });
        
        li.appendChild(a);
        tocList.appendChild(li);
        tocItems.push({ element: heading, link: a, id: id });
      });
      
      // Show TOC
      toc.style.display = 'block';
      
      // Update active heading
      updateActiveHeading();
    }
    
    /**
     * Update the TOC labels based on language
     * @param {string} lang - Language code
     */
    function updateTOCLabels(lang) {
      const translations = tocTranslations[lang] || tocTranslations.en;
      
      const tocTitle = document.getElementById('toc-title');
      const shareTitle = document.getElementById('toc-share-title');
      const mobileShareTitle = document.getElementById('mobile-share-title');
      
      if (tocTitle) {
        tocTitle.textContent = translations.on_this_page;
      }
      
      if (shareTitle) {
        shareTitle.textContent = translations.share;
      }
      
      // Also update mobile share title
      if (mobileShareTitle) {
        mobileShareTitle.textContent = translations.share;
      }
    }
    
    /**
     * Highlight the current section in the TOC based on scroll position
     */
    function updateActiveHeading() {
      if (tocItems.length === 0) return;
      
      const scrollPosition = window.scrollY + 100; // Offset for header
      
      let activeIndex = -1;
      for (let i = tocItems.length - 1; i >= 0; i--) {
        const headingTop = tocItems[i].element.offsetTop;
        if (scrollPosition >= headingTop) {
          activeIndex = i;
          break;
        }
      }
      
      if (activeIndex !== lastActiveIndex) {
        // Remove all active classes
        tocItems.forEach(function(item) {
          item.link.classList.remove('active');
        });
        
        // Add active class to current item
        if (activeIndex >= 0) {
          tocItems[activeIndex].link.classList.add('active');
        }
        
        lastActiveIndex = activeIndex;
      }
    }
    
    /**
     * Initialize scroll handler for active section tracking
     */
    function initScrollHandler() {
      if (scrollHandler) return; // Already initialized
      
      let ticking = false;
      scrollHandler = function() {
        if (!ticking) {
          window.requestAnimationFrame(function() {
            updateActiveHeading();
            ticking = false;
          });
          ticking = true;
        }
      };
      
      window.addEventListener('scroll', scrollHandler);
    }
    
    /**
     * Handle language change events
     */
    function handleLanguageChange(event) {
      const lang = event.detail?.lang || 'en';
      
      // Update TOC labels
      updateTOCLabels(lang);
      
      // Regenerate TOC after a short delay to allow content to update
      setTimeout(function() {
        generateTOC();
      }, 100);
    }
    
    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', function() {
      generateTOC();
      initScrollHandler();
      
      // Get initial language from URL or i18n module
      const urlParams = new URLSearchParams(window.location.search);
      const initialLang = urlParams.get('lang') || 'en';
      updateTOCLabels(initialLang);
    });
    
    // Listen for translation loaded events (from i18n.js)
    document.addEventListener('i18n:translationLoaded', handleLanguageChange);
    
    // Also listen for language changed events as a backup
    document.addEventListener('i18n:languageChanged', handleLanguageChange);
    
    // Expose for external access if needed
    window.tocModule = {
      regenerate: generateTOC,
      updateLabels: updateTOCLabels
    };
  })();
