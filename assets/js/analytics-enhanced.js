/**
 * Enhanced Analytics Tracking
 * Uses Intersection Observer instead of scroll events for better performance
 *
 * Performance optimizations:
 * - Intersection Observer API replaces scroll events for depth tracking
 * - Event delegation for link tracking
 * - Minimal DOM queries with cached references
 * - Passive event listeners where possible
 */

(function() {
  'use strict';

  // Early exit if gtag is not available
  if (typeof gtag !== 'function') {
    console.warn('Analytics: gtag not available');
    return;
  }

  // ============================================
  // Intersection Observer for Scroll Depth
  // ============================================

  const ScrollDepthTracker = {
    depthsReached: new Set(),
    targets: [25, 50, 75, 90, 100],

    init: function() {
      // Create sentinel elements at each scroll depth
      this.createSentinels();
    },

    createSentinels: function() {
      const self = this;
      const docHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight
      );

      // Create an Intersection Observer
      const observer = new IntersectionObserver(
        function(entries) {
          entries.forEach(function(entry) {
            if (entry.isIntersecting) {
              const depth = parseInt(entry.target.dataset.depth, 10);
              if (!self.depthsReached.has(depth)) {
                self.depthsReached.add(depth);
                self.trackScrollDepth(depth);
                // Unobserve after tracking
                observer.unobserve(entry.target);
              }
            }
          });
        },
        {
          threshold: 0,
          rootMargin: '0px'
        }
      );

      // Create and observe sentinel elements
      this.targets.forEach(function(depth) {
        const sentinel = document.createElement('div');
        sentinel.className = 'scroll-sentinel';
        sentinel.dataset.depth = depth;
        sentinel.style.cssText = 'position: absolute; height: 1px; width: 1px; opacity: 0; pointer-events: none;';

        // Position the sentinel
        const position = (depth / 100) * docHeight;
        sentinel.style.top = position + 'px';
        sentinel.style.left = '0';

        document.body.appendChild(sentinel);
        observer.observe(sentinel);
      });

      // Make body position relative for absolute positioning
      if (getComputedStyle(document.body).position === 'static') {
        document.body.style.position = 'relative';
      }
    },

    trackScrollDepth: function(depth) {
      gtag('event', 'scroll', {
        'event_category': 'engagement',
        'event_label': depth + '%',
        'value': depth,
        'non_interaction': true
      });
    }
  };

  // ============================================
  // Reading Progress Tracker (for blog posts)
  // ============================================

  const ReadingProgressTracker = {
    progressMilestones: new Set(),
    startTime: Date.now(),
    articleElement: null,

    init: function() {
      this.articleElement = document.querySelector('article') || document.querySelector('.post-content');
      if (!this.articleElement) return;

      this.setupIntersectionObserver();
      this.setupTimeTracking();
      this.setupExitTracking();
    },

    setupIntersectionObserver: function() {
      const self = this;
      const milestones = [25, 50, 75, 100];

      const observer = new IntersectionObserver(
        function(entries) {
          entries.forEach(function(entry) {
            if (entry.isIntersecting) {
              const milestone = parseInt(entry.target.dataset.milestone, 10);
              if (!self.progressMilestones.has(milestone)) {
                self.progressMilestones.add(milestone);
                self.trackReadingProgress(milestone);
                observer.unobserve(entry.target);
              }
            }
          });
        },
        {
          threshold: 0.1
        }
      );

      // Create milestone markers within the article
      const articleRect = this.articleElement.getBoundingClientRect();
      const articleHeight = this.articleElement.offsetHeight;

      milestones.forEach(function(milestone) {
        const marker = document.createElement('div');
        marker.className = 'reading-milestone';
        marker.dataset.milestone = milestone;
        marker.style.cssText = 'position: absolute; height: 1px; width: 100%; opacity: 0; pointer-events: none;';
        marker.style.top = (milestone / 100) * articleHeight + 'px';

        self.articleElement.style.position = 'relative';
        self.articleElement.appendChild(marker);
        observer.observe(marker);
      });
    },

    setupTimeTracking: function() {
      const self = this;
      const pageTitle = document.title;
      const intervals = [30, 60, 120, 300]; // seconds

      intervals.forEach(function(interval) {
        setTimeout(function() {
          gtag('event', 'time_on_page', {
            'event_category': 'blog_engagement',
            'event_label': pageTitle,
            'value': interval,
            'non_interaction': true
          });
        }, interval * 1000);
      });
    },

    setupExitTracking: function() {
      const self = this;
      const pageTitle = document.title;

      window.addEventListener('beforeunload', function() {
        const readingTime = Math.round((Date.now() - self.startTime) / 1000);
        gtag('event', 'blog_read_time', {
          'event_category': 'blog_engagement',
          'event_label': pageTitle,
          'value': readingTime,
          'non_interaction': true,
          'transport_type': 'beacon'
        });
      });
    },

    trackReadingProgress: function(milestone) {
      const pageTitle = document.title;
      gtag('event', 'reading_progress', {
        'event_category': 'blog_engagement',
        'event_label': pageTitle,
        'value': milestone,
        'non_interaction': true
      });
    }
  };

  // ============================================
  // Link Tracking with Event Delegation
  // ============================================

  const LinkTracker = {
    init: function() {
      // Use event delegation on document body for all link clicks
      document.body.addEventListener('click', this.handleClick.bind(this), { passive: true });
    },

    handleClick: function(e) {
      const link = e.target.closest('a');
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href) return;

      // Check link types
      this.trackOutbound(link, href);
      this.trackDownload(link, href);
      this.trackSocial(link, href);
      this.trackEmail(link, href);
      this.trackNavigation(link);
    },

    trackOutbound: function(link, href) {
      if (href.startsWith('http') && !href.includes(window.location.hostname)) {
        gtag('event', 'click', {
          'event_category': 'outbound_link',
          'event_label': href,
          'transport_type': 'beacon'
        });
      }
    },

    trackDownload: function(link, href) {
      const downloadExtensions = ['.pdf', '.mp4', '.zip', '.doc', '.docx', '.xls', '.xlsx'];
      const isDownload = downloadExtensions.some(function(ext) { return href.endsWith(ext); });

      if (isDownload) {
        const fileName = href.split('/').pop();
        gtag('event', 'file_download', {
          'event_category': 'downloads',
          'event_label': fileName,
          'file_extension': fileName.split('.').pop(),
          'file_name': fileName
        });
      }
    },

    trackSocial: function(link, href) {
      const socialPlatforms = ['linkedin.com', 'github.com', 'twitter.com', 'x.com', 'facebook.com'];
      const platform = socialPlatforms.find(function(p) { return href.includes(p); });

      if (platform) {
        gtag('event', 'social_click', {
          'event_category': 'social_media',
          'event_label': platform.replace('.com', ''),
          'social_network': platform.replace('.com', '')
        });
      }
    },

    trackEmail: function(link, href) {
      if (href.startsWith('mailto:')) {
        gtag('event', 'email_click', {
          'event_category': 'contact',
          'event_label': 'email'
        });
      }
    },

    trackNavigation: function(link) {
      if (link.closest('nav')) {
        gtag('event', 'navigation_click', {
          'event_category': 'navigation',
          'event_label': link.textContent.trim(),
          'link_url': link.getAttribute('href')
        });
      }
    }
  };

  // ============================================
  // Media Tracking
  // ============================================

  const MediaTracker = {
    init: function() {
      this.trackVideos();
      this.trackImageErrors();
    },

    trackVideos: function() {
      document.querySelectorAll('video').forEach(function(video) {
        video.addEventListener('play', function() {
          gtag('event', 'video_start', {
            'event_category': 'video',
            'event_label': this.src
          });
        }, { once: true });

        video.addEventListener('ended', function() {
          gtag('event', 'video_complete', {
            'event_category': 'video',
            'event_label': this.src
          });
        });
      });
    },

    trackImageErrors: function() {
      document.querySelectorAll('img').forEach(function(img) {
        img.addEventListener('error', function() {
          gtag('event', 'exception', {
            'description': 'Image load error: ' + this.src,
            'fatal': false
          });
        });
      });
    }
  };

  // ============================================
  // Engagement Tracking
  // ============================================

  const EngagementTracker = {
    visibilityStartTime: Date.now(),

    init: function() {
      this.trackVisibility();
      this.trackPrint();
      this.trackCopy();
      this.trackCodeInteractions();
    },

    trackVisibility: function() {
      const self = this;

      document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
          const activeTime = Math.round((Date.now() - self.visibilityStartTime) / 1000);
          gtag('event', 'tab_hidden', {
            'event_category': 'engagement',
            'event_label': 'visibility_change',
            'value': activeTime,
            'non_interaction': true
          });
        } else {
          self.visibilityStartTime = Date.now();
          gtag('event', 'tab_visible', {
            'event_category': 'engagement',
            'event_label': 'visibility_change',
            'non_interaction': true
          });
        }
      });
    },

    trackPrint: function() {
      window.addEventListener('beforeprint', function() {
        gtag('event', 'print', {
          'event_category': 'engagement',
          'event_label': document.title
        });
      });
    },

    trackCopy: function() {
      document.addEventListener('copy', function() {
        const selection = window.getSelection().toString();
        if (selection.length > 20) {
          gtag('event', 'content_copy', {
            'event_category': 'engagement',
            'event_label': document.title,
            'value': selection.length
          });
        }
      });
    },

    trackCodeInteractions: function() {
      // Use event delegation for code blocks
      document.body.addEventListener('click', function(e) {
        const codeBlock = e.target.closest('pre code');
        if (codeBlock) {
          const language = (codeBlock.className.match(/language-(\w+)/) || ['', 'unknown'])[1];
          gtag('event', 'code_interaction', {
            'event_category': 'blog_engagement',
            'event_label': 'code_block_click',
            'language': language
          });
        }
      }, { passive: true });
    }
  };

  // ============================================
  // Search Tracking
  // ============================================

  const SearchTracker = {
    init: function() {
      const searchInput = document.querySelector('input[type="search"]');
      if (searchInput) {
        searchInput.addEventListener('blur', function() {
          if (this.value) {
            gtag('event', 'search', {
              'search_term': this.value
            });
          }
        });
      }
    }
  };

  // ============================================
  // Initialize All Trackers
  // ============================================

  function init() {
    // Check if IntersectionObserver is supported
    if ('IntersectionObserver' in window) {
      ScrollDepthTracker.init();

      // Only init reading progress on blog posts
      if (document.querySelector('article') || document.querySelector('.post-content')) {
        ReadingProgressTracker.init();
      }
    }

    LinkTracker.init();
    MediaTracker.init();
    EngagementTracker.init();
    SearchTracker.init();
  }

  // Run on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
