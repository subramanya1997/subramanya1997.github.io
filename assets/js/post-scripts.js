/**
 * Post Scripts - Optimized JavaScript for blog posts
 * Includes: Reading progress, lightbox, copy buttons, references, and more
 *
 * Performance optimizations:
 * - All scroll events use requestAnimationFrame for debouncing
 * - Event delegation where possible
 * - Intersection Observer for scroll-based features
 * - Minimal DOM queries (cached references)
 */

(function() {
  'use strict';

  // ============================================
  // Utility Functions
  // ============================================

  /**
   * Throttle function using requestAnimationFrame
   * Much more efficient than setTimeout-based throttling
   */
  function rafThrottle(callback) {
    let requestId = null;
    let lastArgs = null;

    const later = function() {
      requestId = null;
      callback.apply(null, lastArgs);
    };

    return function() {
      lastArgs = arguments;
      if (requestId === null) {
        requestId = requestAnimationFrame(later);
      }
    };
  }

  /**
   * Debounce function for resize events
   */
  function debounce(func, wait) {
    let timeout;
    return function() {
      const context = this;
      const args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(function() {
        func.apply(context, args);
      }, wait);
    };
  }

  // ============================================
  // Reading Progress Bar
  // ============================================

  const ReadingProgress = {
    progressBar: null,

    init: function() {
      this.progressBar = document.getElementById('reading-progress');
      if (!this.progressBar) return;

      // Use throttled scroll handler
      const throttledUpdate = rafThrottle(this.update.bind(this));
      window.addEventListener('scroll', throttledUpdate, { passive: true });
      window.addEventListener('resize', debounce(this.update.bind(this), 100), { passive: true });

      // Initial update
      this.update();
    },

    update: function() {
      if (!this.progressBar) return;

      const winScroll = window.pageYOffset || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
      this.progressBar.style.width = Math.min(scrolled, 100) + '%';
    }
  };

  // ============================================
  // Image Lightbox
  // ============================================

  const Lightbox = {
    lightbox: null,
    lightboxImage: null,
    scale: 1,
    translateX: 0,
    translateY: 0,
    isDragging: false,
    startX: 0,
    startY: 0,
    touchStartDistance: 0,
    initialScale: 1,

    init: function() {
      this.lightbox = document.getElementById('imageLightbox');
      this.lightboxImage = document.getElementById('lightboxImage');

      if (!this.lightbox || !this.lightboxImage) return;

      this.bindEvents();
      this.initPostImages();
    },

    initPostImages: function() {
      // Use event delegation for post images
      const postContent = document.querySelector('.post-content');
      if (postContent) {
        postContent.addEventListener('click', function(e) {
          if (e.target.tagName === 'IMG') {
            Lightbox.open(e.target.src, e.target.alt);
          }
        });
      }
    },

    bindEvents: function() {
      const self = this;
      const lightboxClose = document.getElementById('lightboxClose');
      const zoomInBtn = document.getElementById('zoomIn');
      const zoomOutBtn = document.getElementById('zoomOut');
      const resetZoomBtn = document.getElementById('resetZoom');

      // Close button
      if (lightboxClose) {
        lightboxClose.addEventListener('click', function() { self.close(); });
      }

      // Click outside to close
      this.lightbox.addEventListener('click', function(e) {
        if (e.target === self.lightbox) {
          self.close();
        }
      });

      // Zoom controls
      if (zoomInBtn) {
        zoomInBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          self.zoomIn();
        });
      }

      if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          self.zoomOut();
        });
      }

      if (resetZoomBtn) {
        resetZoomBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          self.resetTransform();
        });
      }

      // Mouse wheel zoom
      this.lightbox.addEventListener('wheel', function(e) {
        e.preventDefault();
        if (e.deltaY < 0) {
          self.zoomIn();
        } else {
          self.zoomOut();
        }
      }, { passive: false });

      // Pan functionality (mouse)
      this.lightboxImage.addEventListener('mousedown', function(e) {
        if (self.scale > 1) {
          self.isDragging = true;
          self.startX = e.clientX - self.translateX;
          self.startY = e.clientY - self.translateY;
          self.lightboxImage.classList.add('grabbing');
          e.preventDefault();
        }
      });

      document.addEventListener('mousemove', function(e) {
        if (self.isDragging) {
          self.translateX = e.clientX - self.startX;
          self.translateY = e.clientY - self.startY;
          self.updateTransform();
        }
      });

      document.addEventListener('mouseup', function() {
        if (self.isDragging) {
          self.isDragging = false;
          self.lightboxImage.classList.remove('grabbing');
        }
      });

      // Touch support
      this.bindTouchEvents();

      // Keyboard controls
      document.addEventListener('keydown', function(e) {
        if (!self.lightbox.classList.contains('active')) return;

        switch(e.key) {
          case 'Escape':
            self.close();
            break;
          case '+':
          case '=':
            self.zoomIn();
            break;
          case '-':
            self.zoomOut();
            break;
          case '0':
            self.resetTransform();
            break;
        }
      });
    },

    bindTouchEvents: function() {
      const self = this;
      let touchStartX = 0;
      let touchStartY = 0;

      this.lightboxImage.addEventListener('touchstart', function(e) {
        if (e.touches.length === 1 && self.scale > 1) {
          self.isDragging = true;
          touchStartX = e.touches[0].clientX - self.translateX;
          touchStartY = e.touches[0].clientY - self.translateY;
        } else if (e.touches.length === 2) {
          self.isDragging = false;
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          self.touchStartDistance = Math.sqrt(dx * dx + dy * dy);
          self.initialScale = self.scale;
        }
      });

      this.lightboxImage.addEventListener('touchmove', function(e) {
        if (e.touches.length === 1 && self.isDragging && self.scale > 1) {
          e.preventDefault();
          self.translateX = e.touches[0].clientX - touchStartX;
          self.translateY = e.touches[0].clientY - touchStartY;
          self.updateTransform();
        } else if (e.touches.length === 2) {
          e.preventDefault();
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const newScale = (distance / self.touchStartDistance) * self.initialScale;
          self.scale = Math.max(0.5, Math.min(5, newScale));
          self.updateTransform();
        }
      }, { passive: false });

      this.lightboxImage.addEventListener('touchend', function(e) {
        if (e.touches.length === 0) {
          self.isDragging = false;
        }
      });
    },

    open: function(src, alt) {
      this.lightboxImage.src = src;
      this.lightboxImage.alt = alt || '';
      this.lightbox.classList.add('active');
      document.body.style.overflow = 'hidden';
      this.resetTransform();
    },

    close: function() {
      this.lightbox.classList.remove('active');
      document.body.style.overflow = '';
      this.resetTransform();
    },

    resetTransform: function() {
      this.scale = 1;
      this.translateX = 0;
      this.translateY = 0;
      this.updateTransform();
    },

    updateTransform: function() {
      this.lightboxImage.style.transform =
        'translate(' + this.translateX + 'px, ' + this.translateY + 'px) scale(' + this.scale + ')';
    },

    zoomIn: function() {
      this.scale = Math.min(this.scale + 0.3, 5);
      this.updateTransform();
    },

    zoomOut: function() {
      this.scale = Math.max(this.scale - 0.3, 0.5);
      this.updateTransform();
    }
  };

  // ============================================
  // Copy Code Buttons
  // ============================================

  const CopyCode = {
    init: function() {
      const codeBlocks = document.querySelectorAll('pre code');

      codeBlocks.forEach(function(codeBlock) {
        const pre = codeBlock.parentElement;

        if (!pre.classList.contains('code-wrapper')) {
          const wrapper = document.createElement('div');
          wrapper.className = 'code-wrapper';
          pre.parentNode.insertBefore(wrapper, pre);
          wrapper.appendChild(pre);

          const button = document.createElement('button');
          button.className = 'copy-code-button';
          button.type = 'button';
          button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg><span class="copy-text">Copy</span>';
          button.setAttribute('aria-label', 'Copy code to clipboard');

          button.addEventListener('click', function() {
            CopyCode.copyToClipboard(codeBlock.textContent, button);
          });

          wrapper.insertBefore(button, pre);
        }
      });
    },

    copyToClipboard: async function(text, button) {
      try {
        await navigator.clipboard.writeText(text);
        this.showSuccess(button);
      } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
          this.showSuccess(button);
        } catch (err) {
          console.error('Failed to copy:', err);
        }
        document.body.removeChild(textArea);
      }
    },

    showSuccess: function(button) {
      button.classList.add('copied');
      button.querySelector('.copy-text').textContent = 'Copied!';

      setTimeout(function() {
        button.classList.remove('copied');
        button.querySelector('.copy-text').textContent = 'Copy';
      }, 2000);
    }
  };

  // ============================================
  // Copy Page as Markdown
  // ============================================

  const CopyPage = {
    init: function() {
      const copyPageBtn = document.getElementById('copyPageBtn');
      const dropdownToggle = document.getElementById('copyDropdownToggle');
      const dropdown = document.getElementById('copyDropdown');
      const wrapper = document.querySelector('.copy-page-wrapper');

      if (!copyPageBtn) return;

      const self = this;

      copyPageBtn.addEventListener('click', function() {
        self.copyPageAsMarkdown(this);
      });

      if (dropdownToggle && dropdown) {
        dropdownToggle.addEventListener('click', function(e) {
          e.stopPropagation();
          dropdown.classList.toggle('show');
        });

        document.addEventListener('click', function(e) {
          if (wrapper && !wrapper.contains(e.target)) {
            dropdown.classList.remove('show');
          }
        });
      }

      // AI options
      document.querySelectorAll('.copy-option[data-ai]').forEach(function(option) {
        option.addEventListener('click', function() {
          self.openInAI(this.dataset.ai);
          if (dropdown) dropdown.classList.remove('show');
        });
      });
    },

    htmlToMarkdown: function(element) {
      let markdown = '';
      const clone = element.cloneNode(true);

      // Remove UI elements
      clone.querySelectorAll('.code-wrapper button, .heading-anchor, .copy-code-button, script, style').forEach(function(el) {
        el.remove();
      });

      function processNode(node, indent) {
        indent = indent || '';

        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent.trim();
          if (text) markdown += text + ' ';
          return;
        }

        if (node.nodeType !== Node.ELEMENT_NODE) return;

        const tag = node.tagName.toLowerCase();

        if (tag.match(/^h([1-6])$/)) {
          const level = tag[1];
          markdown += '\n\n' + '#'.repeat(level) + ' ';
          processChildren(node);
          markdown += '\n\n';
        } else if (tag === 'pre') {
          const codeBlock = node.querySelector('code');
          if (codeBlock) {
            const language = (codeBlock.className.match(/language-(\w+)/) || ['', ''])[1];
            markdown += '\n\n```' + language + '\n' + codeBlock.textContent + '\n```\n\n';
          }
        } else if (tag === 'table') {
          markdown += '\n\n';
          const rows = Array.from(node.querySelectorAll('tr'));
          rows.forEach(function(row, rowIndex) {
            const cells = Array.from(row.querySelectorAll('th, td'));
            markdown += '| ' + cells.map(function(cell) { return cell.textContent.trim(); }).join(' | ') + ' |\n';
            if (rowIndex === 0 && row.querySelector('th')) {
              markdown += '| ' + cells.map(function() { return '---'; }).join(' | ') + ' |\n';
            }
          });
          markdown += '\n';
        } else if (tag === 'blockquote') {
          markdown += '\n\n> ';
          processChildren(node);
          markdown += '\n\n';
        } else if (tag === 'ul' || tag === 'ol') {
          markdown += '\n';
          const items = Array.from(node.children).filter(function(child) { return child.tagName === 'LI'; });
          items.forEach(function(item, index) {
            const bullet = tag === 'ul' ? '-' : (index + 1) + '.';
            markdown += indent + bullet + ' ';
            processChildren(item, indent + '  ');
            markdown += '\n';
          });
          markdown += '\n';
        } else if (tag === 'p') {
          markdown += '\n\n';
          processChildren(node);
          markdown += '\n\n';
        } else if (tag === 'a') {
          markdown += '[' + node.textContent.trim() + '](' + node.getAttribute('href') + ')';
        } else if (tag === 'strong' || tag === 'b') {
          markdown += '**';
          processChildren(node);
          markdown += '**';
        } else if (tag === 'em' || tag === 'i') {
          markdown += '*';
          processChildren(node);
          markdown += '*';
        } else if (tag === 'code' && node.parentElement.tagName !== 'PRE') {
          markdown += '`' + node.textContent + '`';
        } else if (tag === 'br') {
          markdown += '\n';
        } else {
          processChildren(node, indent);
        }
      }

      function processChildren(node, indent) {
        Array.from(node.childNodes).forEach(function(child) { processNode(child, indent); });
      }

      processNode(clone);

      return markdown.replace(/\n{3,}/g, '\n\n').replace(/ +/g, ' ').trim();
    },

    copyPageAsMarkdown: async function(button) {
      const title = document.querySelector('.post-header h1')?.textContent?.trim() || document.title;
      const url = window.location.href;
      const postContent = document.querySelector('.post-content');

      if (!postContent) return;

      // Track in analytics
      if (typeof gtag === 'function') {
        gtag('event', 'copy_page', {
          'event_category': 'ai_assistant',
          'event_label': title,
          'page_url': url
        });
      }

      let markdown = '# ' + title + '\n\n' + url + '\n\n---\n\n';
      markdown += this.htmlToMarkdown(postContent);

      try {
        await navigator.clipboard.writeText(markdown);

        const originalHTML = button.innerHTML;
        button.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg><span>Copied!</span>';
        button.classList.add('copied');

        setTimeout(function() {
          button.innerHTML = originalHTML;
          button.classList.remove('copied');
        }, 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    },

    openInAI: function(ai) {
      const title = document.querySelector('.post-header h1')?.textContent?.trim() || document.title;
      const url = window.location.href;

      if (typeof gtag === 'function') {
        gtag('event', 'open_in_ai', {
          'event_category': 'ai_assistant',
          'event_label': ai,
          'page_title': title,
          'page_url': url
        });
      }

      const prompt = 'Help me understand "' + title + '" about ' + url;
      const encodedPrompt = encodeURIComponent(prompt);

      let aiUrl = '';
      if (ai === 'claude') {
        aiUrl = 'https://claude.ai/new?q=' + encodedPrompt;
      } else if (ai === 'chatgpt') {
        aiUrl = 'https://chat.openai.com/?q=' + encodedPrompt;
      }

      if (aiUrl) {
        window.open(aiUrl, '_blank', 'noopener,noreferrer');
      }
    }
  };

  // ============================================
  // References Auto-linking
  // ============================================

  const References = {
    init: function() {
      const content = document.querySelector('.post-content');
      if (!content) return;

      const citationRegex = /\[[\d,\s]+\]/g;
      let referenceSection = null;

      const allElements = Array.from(content.children);

      for (let i = 0; i < allElements.length; i++) {
        const element = allElements[i];
        const text = element.textContent.trim();

        if (element.tagName === 'H2' && /^References:?$/i.test(text)) {
          referenceSection = element;
          break;
        }

        if (element.tagName === 'P') {
          const strong = element.querySelector('strong');
          if (strong && /^References:?$/i.test(strong.textContent.trim())) {
            referenceSection = element;
            break;
          }
        }
      }

      if (!referenceSection) return;

      referenceSection.classList.add('references-section');

      let nextElement = referenceSection.nextElementSibling;

      while (nextElement) {
        const text = nextElement.textContent.trim();
        const match = text.match(/^\[?(\d+)\]?[.\):]?\s/);

        if (match) {
          const num = match[1];
          nextElement.id = 'ref-' + num;
          nextElement.classList.add('reference-item');

          const refHTML = nextElement.innerHTML;
          nextElement.innerHTML = refHTML.replace(
            /^(\[(\d+)\]|(\d+)[.\):])/,
            '<span class="ref-number" id="ref-source-$2$3">[$2$3]</span>'
          );

          nextElement = nextElement.nextElementSibling;
        } else if (nextElement.tagName === 'UL' || nextElement.tagName === 'OL') {
          const listItems = nextElement.querySelectorAll('li');
          listItems.forEach(function(li, index) {
            li.id = 'ref-' + (index + 1);
            li.classList.add('reference-item');
          });
          break;
        } else if (text.length > 0 && !text.match(/^https?:\/\//)) {
          break;
        } else {
          nextElement = nextElement.nextElementSibling;
        }
      }

      // Link citations in main text
      const referenceSectionIndex = allElements.indexOf(referenceSection);
      const mainText = allElements.slice(0, referenceSectionIndex);

      mainText.forEach(function(element) {
        if (element.classList.contains('references-section')) return;

        const walker = document.createTreeWalker(
          element,
          NodeFilter.SHOW_TEXT,
          null,
          false
        );

        const nodesToReplace = [];
        let textNode;

        while (textNode = walker.nextNode()) {
          if (citationRegex.test(textNode.nodeValue)) {
            nodesToReplace.push(textNode);
          }
        }

        nodesToReplace.forEach(function(textNode) {
          const parent = textNode.parentElement;
          if (parent.tagName === 'A' || /^H\d$/.test(parent.tagName)) return;

          const html = textNode.nodeValue.replace(
            /\[([\d,\s]+)\]/g,
            function(match, numbers) {
              const nums = numbers.split(',').map(function(n) { return n.trim(); });
              const links = nums.map(function(num) {
                return '<a href="#ref-' + num + '" class="citation-link" title="Jump to reference ' + num + '">' + num + '</a>';
              }).join(', ');
              return '[' + links + ']';
            }
          );

          const span = document.createElement('span');
          span.innerHTML = html;
          textNode.replaceWith(span);
        });
      });
    }
  };

  // ============================================
  // Lazy Loading Images
  // ============================================

  const LazyImages = {
    init: function() {
      document.querySelectorAll('.post-content img').forEach(function(img) {
        if (!img.hasAttribute('loading')) {
          img.setAttribute('loading', 'lazy');
        }
      });
    }
  };

  // ============================================
  // Initialize All Modules
  // ============================================

  function init() {
    LazyImages.init();
    ReadingProgress.init();
    Lightbox.init();
    CopyCode.init();
    CopyPage.init();
    References.init();
  }

  // Run on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
