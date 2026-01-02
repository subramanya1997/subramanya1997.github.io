/**
 * i18n.js - Internationalization Module for Blog Posts
 * 
 * This module handles:
 * - Language detection (URL params, localStorage, browser preference)
 * - Translation JSON fetching and caching
 * - DOM content replacement (title, content, excerpt)
 * - URL query parameter management
 * - localStorage preference persistence
 */

(function() {
  'use strict';

  // ============================================================================
  // CONFIGURATION
  // ============================================================================
  
  const CONFIG = {
    // Supported languages with their native names
    languages: {
      en: { name: 'English', native: 'English' },
      es: { name: 'Spanish', native: 'Español' },
      zh: { name: 'Chinese', native: '中文' },
      hi: { name: 'Hindi', native: 'हिन्दी' },
      pt: { name: 'Portuguese', native: 'Português' },
      fr: { name: 'French', native: 'Français' },
      de: { name: 'German', native: 'Deutsch' },
      ja: { name: 'Japanese', native: '日本語' },
      ko: { name: 'Korean', native: '한국어' }
    },
    
    defaultLang: 'en',
    
    // Storage keys
    storageKey: 'preferredLanguage',
    toastDismissedKey: 'translationToastDismissed',
    
    // Translation files base path
    translationsPath: '/assets/translations',
    
    // Cache duration in milliseconds (1 hour)
    cacheDuration: 60 * 60 * 1000,
    
    // DOM selectors
    selectors: {
      postTitle: '.post-header h1',
      postContent: '.post-content',
      postExcerpt: '.post-excerpt',
      languageSwitcher: '#languageSwitcher',
      translationToast: '#translationToast'
    },
    
    // ========================================================================
    // STANDARD EVENT NAMES
    // ========================================================================
    // These are the canonical event names for the i18n system.
    // All components should use these events for communication.
    //
    // Event Flow:
    //   UI Component --[i18n:languageChange]--> i18n.js (handler)
    //   i18n.js --[i18n:languageChanged]--> UI Components (state update)
    //   i18n.js --[i18n:translationLoaded]--> Toast/UI (content applied)
    //
    events: {
      // INPUT EVENT: Dispatched by UI components to REQUEST a language change
      // Detail: { lang: string } - the target language code
      // Listened by: i18n.js (main handler)
      LANGUAGE_CHANGE: 'i18n:languageChange',
      
      // OUTPUT EVENT: Dispatched AFTER language has been successfully changed
      // Detail: { lang: string, previous: string } - new and previous language
      // Listened by: language-switcher.html (to update UI state)
      LANGUAGE_CHANGED: 'i18n:languageChanged',
      
      // OUTPUT EVENT: Dispatched AFTER translation content has been applied to DOM
      // Detail: { lang: string, slug: string } - language and post slug
      // Listened by: translation-toast.html (to show/update toast)
      TRANSLATION_LOADED: 'i18n:translationLoaded',
      
      // INTERNAL EVENT: Dispatched when content is updated (for other scripts)
      // Detail: { element: HTMLElement } - the updated content element
      CONTENT_UPDATED: 'i18n:contentUpdated'
    }
  };

  // ============================================================================
  // MEMORY CACHE FOR TRANSLATIONS
  // ============================================================================
  
  const translationCache = new Map();

  // ============================================================================
  // LOCALSTORAGE MODULE
  // ============================================================================
  
  const storage = {
    /**
     * Get the user's preferred language from localStorage
     * @returns {string|null} Language code or null
     */
    getPreferredLanguage() {
      try {
        return localStorage.getItem(CONFIG.storageKey);
      } catch (e) {
        console.warn('[i18n] localStorage not available:', e);
        return null;
      }
    },

    /**
     * Save the user's preferred language to localStorage
     * @param {string} lang - Language code
     */
    setPreferredLanguage(lang) {
      try {
        localStorage.setItem(CONFIG.storageKey, lang);
      } catch (e) {
        console.warn('[i18n] Could not save to localStorage:', e);
      }
    },

    /**
     * Remove the preferred language from localStorage
     */
    clearPreferredLanguage() {
      try {
        localStorage.removeItem(CONFIG.storageKey);
      } catch (e) {
        console.warn('[i18n] Could not clear localStorage:', e);
      }
    },

    /**
     * Check if translation toast was dismissed for this session
     * @returns {boolean}
     */
    isToastDismissed() {
      try {
        return sessionStorage.getItem(CONFIG.toastDismissedKey) === 'true';
      } catch (e) {
        return false;
      }
    },

    /**
     * Mark translation toast as dismissed for this session
     */
    dismissToast() {
      try {
        sessionStorage.setItem(CONFIG.toastDismissedKey, 'true');
      } catch (e) {
        console.warn('[i18n] Could not save toast state:', e);
      }
    }
  };

  // ============================================================================
  // URL HANDLING MODULE
  // ============================================================================
  
  const urlHandler = {
    /**
     * Get language from URL query parameter
     * @returns {string|null} Language code or null
     */
    getLanguageFromURL() {
      const params = new URLSearchParams(window.location.search);
      const lang = params.get('lang');
      
      // Validate the language
      if (lang && CONFIG.languages[lang]) {
        return lang;
      }
      return null;
    },

    /**
     * Update URL with language parameter without page reload
     * @param {string} lang - Language code
     */
    setLanguageInURL(lang) {
      const url = new URL(window.location.href);
      
      if (lang === CONFIG.defaultLang) {
        // Remove lang param for default language
        url.searchParams.delete('lang');
      } else {
        url.searchParams.set('lang', lang);
      }
      
      // Update URL without reload
      window.history.replaceState({ lang }, '', url.toString());
    },

    /**
     * Get the current post slug from URL path
     * @returns {string|null} Post slug or null
     */
    getPostSlug() {
      const path = window.location.pathname;
      
      // Match blog post URLs like /blog/2026/01/01/post-title/ or /blog/post-title/
      const match = path.match(/\/blog\/(?:\d{4}\/\d{2}\/\d{2}\/)?([^\/]+)\/?$/);
      
      if (match) {
        return match[1];
      }
      
      // Fallback: try to extract from path
      const segments = path.split('/').filter(Boolean);
      if (segments.length > 0) {
        return segments[segments.length - 1];
      }
      
      return null;
    }
  };

  // ============================================================================
  // LANGUAGE DETECTION MODULE
  // ============================================================================
  
  const detector = {
    /**
     * Detect the best language based on priority:
     * 1. URL query param (?lang=es)
     * 2. localStorage preference
     * 3. Browser language
     * 4. Default (English)
     * 
     * @returns {string} Language code
     */
    detectLanguage() {
      // Priority 1: URL query parameter
      const urlLang = urlHandler.getLanguageFromURL();
      if (urlLang) {
        return urlLang;
      }

      // Priority 2: localStorage preference
      const storedLang = storage.getPreferredLanguage();
      if (storedLang && CONFIG.languages[storedLang]) {
        return storedLang;
      }

      // Priority 3: Browser language
      const browserLang = this.getBrowserLanguage();
      if (browserLang) {
        return browserLang;
      }

      // Priority 4: Default
      return CONFIG.defaultLang;
    },

    /**
     * Get the browser's preferred language if supported
     * @returns {string|null} Language code or null
     */
    getBrowserLanguage() {
      try {
        // Get browser language (e.g., "en-US", "es", "zh-CN")
        const browserLang = navigator.language || navigator.userLanguage;
        
        if (!browserLang) return null;
        
        // Extract primary language code (e.g., "en" from "en-US")
        const primaryLang = browserLang.split('-')[0].toLowerCase();
        
        // Check if we support this language
        if (CONFIG.languages[primaryLang]) {
          return primaryLang;
        }
        
        return null;
      } catch (e) {
        return null;
      }
    },

    /**
     * Check if a language code is valid and supported
     * @param {string} lang - Language code
     * @returns {boolean}
     */
    isValidLanguage(lang) {
      return lang && CONFIG.languages.hasOwnProperty(lang);
    }
  };

  // ============================================================================
  // TRANSLATION LOADER MODULE
  // ============================================================================
  
  const loader = {
    /**
     * Fetch translation JSON for a specific post and language
     * @param {string} slug - Post slug
     * @param {string} lang - Language code
     * @returns {Promise<Object|null>} Translation object or null
     */
    async fetchTranslation(slug, lang) {
      // Don't fetch for English (it's the original content)
      if (lang === CONFIG.defaultLang) {
        return null;
      }

      // Check memory cache first
      const cacheKey = `${lang}:${slug}`;
      const cached = translationCache.get(cacheKey);
      
      if (cached && cached.timestamp > Date.now() - CONFIG.cacheDuration) {
        return cached.data;
      }

      try {
        // Construct the translation file URL
        const url = `${CONFIG.translationsPath}/${lang}/${slug}.json`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
          if (response.status === 404) {
            console.info(`[i18n] No translation available for "${slug}" in "${lang}"`);
          } else {
            console.warn(`[i18n] Failed to fetch translation: ${response.status}`);
          }
          return null;
        }

        const data = await response.json();
        
        // Cache the result
        translationCache.set(cacheKey, {
          data,
          timestamp: Date.now()
        });

        return data;
      } catch (error) {
        console.error('[i18n] Error fetching translation:', error);
        return null;
      }
    },

    /**
     * Preload translations for a given post
     * @param {string} slug - Post slug
     * @param {string[]} langs - Language codes to preload
     */
    async preloadTranslations(slug, langs) {
      const promises = langs
        .filter(lang => lang !== CONFIG.defaultLang)
        .map(lang => this.fetchTranslation(slug, lang));
      
      await Promise.allSettled(promises);
    },

    /**
     * Clear the translation cache
     */
    clearCache() {
      translationCache.clear();
    }
  };

  // ============================================================================
  // CONTENT REPLACER MODULE
  // ============================================================================
  
  const replacer = {
    // Store original content for reverting
    originalContent: null,

    /**
     * Store the original English content before any replacements
     */
    storeOriginalContent() {
      if (this.originalContent) return; // Already stored

      const titleEl = document.querySelector(CONFIG.selectors.postTitle);
      const contentEl = document.querySelector(CONFIG.selectors.postContent);
      const excerptEl = document.querySelector(CONFIG.selectors.postExcerpt);

      this.originalContent = {
        title: titleEl ? titleEl.innerHTML : null,
        content: contentEl ? contentEl.innerHTML : null,
        excerpt: excerptEl ? excerptEl.innerHTML : null
      };
    },

    /**
     * Apply translation to the page
     * @param {Object} translation - Translation object
     * @returns {boolean} Whether replacement was successful
     */
    applyTranslation(translation) {
      if (!translation) return false;

      // Store original content if not already stored
      this.storeOriginalContent();

      let applied = false;

      // Replace title
      if (translation.title) {
        const titleEl = document.querySelector(CONFIG.selectors.postTitle);
        if (titleEl) {
          titleEl.innerHTML = translation.title;
          // Also update document title
          document.title = translation.title + ' | ' + document.title.split('|').pop().trim();
          applied = true;
        }
      }

      // Replace content
      if (translation.content_html) {
        const contentEl = document.querySelector(CONFIG.selectors.postContent);
        if (contentEl) {
          contentEl.innerHTML = translation.content_html;
          applied = true;
          
          // Re-initialize any scripts that depend on content
          this.reinitializeContent(contentEl);
        }
      }

      // Replace excerpt (if element exists)
      if (translation.excerpt) {
        const excerptEl = document.querySelector(CONFIG.selectors.postExcerpt);
        if (excerptEl) {
          excerptEl.textContent = translation.excerpt;
          applied = true;
        }
      }

      return applied;
    },

    /**
     * Restore original English content
     */
    restoreOriginalContent() {
      if (!this.originalContent) return;

      const titleEl = document.querySelector(CONFIG.selectors.postTitle);
      const contentEl = document.querySelector(CONFIG.selectors.postContent);
      const excerptEl = document.querySelector(CONFIG.selectors.postExcerpt);

      if (titleEl && this.originalContent.title) {
        titleEl.innerHTML = this.originalContent.title;
      }

      if (contentEl && this.originalContent.content) {
        contentEl.innerHTML = this.originalContent.content;
        this.reinitializeContent(contentEl);
      }

      if (excerptEl && this.originalContent.excerpt) {
        excerptEl.innerHTML = this.originalContent.excerpt;
      }

      // Restore document title
      const originalTitle = this.originalContent.title;
      if (originalTitle) {
        const siteName = document.title.split('|').pop().trim();
        document.title = this.stripHtml(originalTitle) + ' | ' + siteName;
      }
    },

    /**
     * Re-initialize content-dependent scripts after replacement
     * @param {HTMLElement} contentEl - The content element
     */
    reinitializeContent(contentEl) {
      // Re-add lazy loading to images
      contentEl.querySelectorAll('img').forEach(img => {
        if (!img.hasAttribute('loading')) {
          img.setAttribute('loading', 'lazy');
        }
      });

      // Re-add click handlers for lightbox (dispatch event for existing script)
      const event = new CustomEvent(CONFIG.events.CONTENT_UPDATED, { 
        detail: { element: contentEl } 
      });
      document.dispatchEvent(event);

      // Re-add copy buttons to code blocks
      this.addCopyButtonsToCodeBlocks(contentEl);
    },

    /**
     * Add copy buttons to code blocks in translated content
     * @param {HTMLElement} contentEl - The content element
     */
    addCopyButtonsToCodeBlocks(contentEl) {
      contentEl.querySelectorAll('pre code').forEach(codeBlock => {
        const pre = codeBlock.parentElement;
        
        // Skip if already wrapped
        if (pre.parentElement.classList.contains('code-wrapper')) return;

        const wrapper = document.createElement('div');
        wrapper.className = 'code-wrapper';
        pre.parentNode.insertBefore(wrapper, pre);
        wrapper.appendChild(pre);

        const button = document.createElement('button');
        button.className = 'copy-code-button';
        button.type = 'button';
        button.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          <span class="copy-text">Copy</span>
        `;
        button.setAttribute('aria-label', 'Copy code to clipboard');

        button.addEventListener('click', async function() {
          const code = codeBlock.textContent;
          
          try {
            await navigator.clipboard.writeText(code);
            button.classList.add('copied');
            button.querySelector('.copy-text').textContent = 'Copied!';
            
            setTimeout(() => {
              button.classList.remove('copied');
              button.querySelector('.copy-text').textContent = 'Copy';
            }, 2000);
          } catch (err) {
            console.error('Failed to copy:', err);
          }
        });

        wrapper.insertBefore(button, pre);
      });
    },

    /**
     * Strip HTML tags from a string
     * @param {string} html - HTML string
     * @returns {string} Plain text
     */
    stripHtml(html) {
      const tmp = document.createElement('div');
      tmp.innerHTML = html;
      return tmp.textContent || tmp.innerText || '';
    }
  };

  // ============================================================================
  // UI TOAST MODULE
  // ============================================================================
  
  const toast = {
    /**
     * Show translation warning toast
     * @param {string} lang - Current language code
     */
    show(lang) {
      // Don't show for English or if already dismissed
      if (lang === CONFIG.defaultLang || storage.isToastDismissed()) {
        return;
      }

      const toastEl = document.querySelector(CONFIG.selectors.translationToast);
      if (!toastEl) return;

      // Update toast content with current language
      const langInfo = CONFIG.languages[lang];
      const langName = langInfo ? langInfo.native : lang;
      
      const messageEl = toastEl.querySelector('.toast-message');
      if (messageEl) {
        messageEl.innerHTML = this.getToastMessage(lang, langName);
      }

      // Show the toast
      toastEl.classList.add('visible');

      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        this.hide();
      }, 5000);
    },

    /**
     * Hide the translation toast
     */
    hide() {
      const toastEl = document.querySelector(CONFIG.selectors.translationToast);
      if (toastEl) {
        toastEl.classList.remove('visible');
        storage.dismissToast();
      }
    },

    /**
     * Get localized toast message
     * @param {string} lang - Language code
     * @param {string} langName - Language native name
     * @returns {string} Toast message HTML
     */
    getToastMessage(lang, langName) {
      const messages = {
        es: `🌐 Esta página ha sido traducida automáticamente al ${langName}. <a href="?lang=en">Ver original en inglés</a>`,
        zh: `🌐 此页面已自动翻译成${langName}。<a href="?lang=en">查看英文原文</a>`,
        hi: `🌐 यह पृष्ठ स्वचालित रूप से ${langName} में अनुवादित किया गया है। <a href="?lang=en">अंग्रेजी में मूल देखें</a>`,
        pt: `🌐 Esta página foi traduzida automaticamente para ${langName}. <a href="?lang=en">Ver original em inglês</a>`,
        fr: `🌐 Cette page a été automatiquement traduite en ${langName}. <a href="?lang=en">Voir l'original en anglais</a>`,
        de: `🌐 Diese Seite wurde automatisch ins ${langName} übersetzt. <a href="?lang=en">Original auf Englisch ansehen</a>`,
        ja: `🌐 このページは${langName}に自動翻訳されました。<a href="?lang=en">英語の原文を見る</a>`,
        ko: `🌐 이 페이지는 ${langName}로 자동 번역되었습니다. <a href="?lang=en">영어 원문 보기</a>`
      };

      return messages[lang] || `🌐 This page has been automatically translated to ${langName}. <a href="?lang=en">View original in English</a>`;
    }
  };

  // ============================================================================
  // MAIN I18N CONTROLLER
  // ============================================================================
  
  const i18n = {
    currentLang: CONFIG.defaultLang,
    initialized: false,

    /**
     * Initialize the i18n module
     */
    async init() {
      if (this.initialized) return;
      
      // Only run on post pages
      if (!document.querySelector(CONFIG.selectors.postContent)) {
        return;
      }

      // Store original content before any modifications
      replacer.storeOriginalContent();

      // Detect language
      this.currentLang = detector.detectLanguage();

      // Initialize language switcher if present
      this.initLanguageSwitcher();

      // Listen for i18n:languageChange events from UI components
      // This is the SINGLE entry point for all language change requests
      document.addEventListener(CONFIG.events.LANGUAGE_CHANGE, async (event) => {
        const lang = event.detail?.lang;
        if (lang && detector.isValidLanguage(lang)) {
          await this.switchLanguage(lang, { updateStorage: true, updateUrl: true });
        }
      });

      // Apply translation if not English
      if (this.currentLang !== CONFIG.defaultLang) {
        await this.switchLanguage(this.currentLang, { updateStorage: false, updateUrl: true });
      }

      // Listen for popstate (browser back/forward)
      // IMPORTANT: We skip URL update here because the URL is already correct
      // (the browser has already navigated). Updating the URL with replaceState
      // during popstate can cause history navigation issues.
      window.addEventListener('popstate', async (event) => {
        // Use state.lang first (most reliable), then URL param, then default
        const lang = event.state?.lang || urlHandler.getLanguageFromURL() || CONFIG.defaultLang;
        
        // Skip URL update to prevent interference with browser history
        // The URL is already correct after browser back/forward
        await this.switchLanguage(lang, { updateStorage: false, updateUrl: false });
      });

      this.initialized = true;
    },

    /**
     * Switch to a different language
     * @param {string} lang - Target language code
     * @param {Object} options - Options for the switch
     * @param {boolean} options.updateStorage - Whether to save preference (default: true)
     * @param {boolean} options.updateUrl - Whether to update URL (default: true)
     */
    async switchLanguage(lang, options = {}) {
      // Handle legacy boolean parameter for backwards compatibility
      if (typeof options === 'boolean') {
        options = { updateStorage: options };
      }
      
      const { updateStorage = true, updateUrl = true } = options;
      
      if (!detector.isValidLanguage(lang)) {
        console.warn(`[i18n] Invalid language: ${lang}`);
        return;
      }

      // Prevent redundant switches to the same language
      const previousLang = this.currentLang;
      if (previousLang === lang) {
        // Still update UI state in case it's out of sync
        this.updateSwitcherUI(lang);
        return;
      }

      // Update current language
      this.currentLang = lang;

      // Update URL only if requested (skip during popstate handling)
      if (updateUrl) {
        urlHandler.setLanguageInURL(lang);
      }

      // Save preference if requested
      if (updateStorage) {
        if (lang === CONFIG.defaultLang) {
          storage.clearPreferredLanguage();
        } else {
          storage.setPreferredLanguage(lang);
        }
      }

      // Update language switcher UI
      this.updateSwitcherUI(lang);

      // Apply translation or restore original
      const slug = urlHandler.getPostSlug();
      if (lang === CONFIG.defaultLang) {
        replacer.restoreOriginalContent();
        toast.hide();
        
        // Dispatch translation loaded event (for original content)
        document.dispatchEvent(new CustomEvent(CONFIG.events.TRANSLATION_LOADED, {
          detail: { lang, slug, isOriginal: true }
        }));
      } else {
        if (slug) {
          const translation = await loader.fetchTranslation(slug, lang);
          if (translation) {
            replacer.applyTranslation(translation);
            toast.show(lang);
            
            // Dispatch translation loaded event
            document.dispatchEvent(new CustomEvent(CONFIG.events.TRANSLATION_LOADED, {
              detail: { lang, slug, isOriginal: false }
            }));
          } else {
            // No translation available, revert to English
            console.info(`[i18n] No translation available, falling back to English`);
            replacer.restoreOriginalContent();
            this.currentLang = CONFIG.defaultLang;
            // Only update URL if we're allowed to (respect updateUrl flag)
            if (updateUrl) {
              urlHandler.setLanguageInURL(CONFIG.defaultLang);
            }
            this.updateSwitcherUI(CONFIG.defaultLang);
          }
        }
      }

      // Dispatch language changed event (for UI components to update their state)
      document.dispatchEvent(new CustomEvent(CONFIG.events.LANGUAGE_CHANGED, {
        detail: { lang, previous: previousLang }
      }));

      // Track in analytics if available
      this.trackLanguageChange(lang);
    },

    /**
     * Initialize the language switcher dropdown
     * 
     * NOTE: This method only handles <select> elements for backwards compatibility.
     * Custom dropdown buttons with [data-lang] attributes should dispatch 
     * i18n:languageChange events instead. The language-switcher.html component
     * handles this automatically.
     */
    initLanguageSwitcher() {
      const switcher = document.querySelector(CONFIG.selectors.languageSwitcher);
      if (!switcher) return;

      // Set initial value for <select> elements (backwards compatibility)
      const select = switcher.querySelector('select') || switcher;
      if (select.tagName === 'SELECT') {
        select.value = this.currentLang;

        // Add change handler for <select> elements only
        select.addEventListener('change', async (e) => {
          await this.switchLanguage(e.target.value, true);
        });
      }
      
      // NOTE: We do NOT attach click handlers to [data-lang] buttons here.
      // The language-switcher.html component dispatches i18n:languageChange events,
      // which are handled by the event listener in init() (lines 652-659).
      // This prevents duplicate handlers and keeps i18n.js as the single source of truth.
    },

    /**
     * Update the language switcher UI to reflect current language
     * @param {string} lang - Current language code
     */
    updateSwitcherUI(lang) {
      const switcher = document.querySelector(CONFIG.selectors.languageSwitcher);
      if (!switcher) return;

      const select = switcher.querySelector('select');
      if (select) {
        select.value = lang;
      }

      // Update active state for custom buttons
      switcher.querySelectorAll('[data-lang]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
      });

      // Update aria-label for accessibility
      const langInfo = CONFIG.languages[lang];
      if (langInfo) {
        switcher.setAttribute('aria-label', `Current language: ${langInfo.name}`);
      }
    },

    /**
     * Track language change in analytics
     * @param {string} lang - Language code
     */
    trackLanguageChange(lang) {
      if (typeof gtag === 'function') {
        gtag('event', 'language_change', {
          'event_category': 'i18n',
          'event_label': lang,
          'language': lang,
          'page_url': window.location.href
        });
      }
    },

    /**
     * Get the current language
     * @returns {string} Current language code
     */
    getCurrentLanguage() {
      return this.currentLang;
    },

    /**
     * Get all supported languages
     * @returns {Object} Languages configuration
     */
    getLanguages() {
      return { ...CONFIG.languages };
    },

    /**
     * Get language info for a specific code
     * @param {string} lang - Language code
     * @returns {Object|null} Language info or null
     */
    getLanguageInfo(lang) {
      return CONFIG.languages[lang] || null;
    }
  };

  // ============================================================================
  // INITIALIZATION
  // ============================================================================
  
  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => i18n.init());
  } else {
    i18n.init();
  }

  // Expose to global scope for external access
  window.i18n = i18n;

  // Also expose modules for advanced usage
  window.i18n.storage = storage;
  window.i18n.urlHandler = urlHandler;
  window.i18n.detector = detector;
  window.i18n.loader = loader;
  window.i18n.replacer = replacer;
  window.i18n.toast = toast;
  window.i18n.CONFIG = CONFIG;

})();
