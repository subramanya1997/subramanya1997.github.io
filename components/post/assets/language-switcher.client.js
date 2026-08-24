
(function() {
  'use strict';
  
  const switcher = document.getElementById('languageSwitcher');
  const toggle = document.getElementById('languageSwitcherToggle');
  const dropdown = document.getElementById('languageDropdown');
  const currentLangLabel = document.getElementById('currentLangLabel');
  const options = dropdown?.querySelectorAll('.language-option');
  
  if (!switcher || !toggle || !dropdown || !options) return;
  
  // Build language data from rendered options (only available languages)
  const languages = {};
  options.forEach(option => {
    const langCode = option.dataset.lang;
    const nativeName = option.querySelector('.lang-native')?.textContent;
    if (langCode && nativeName) {
      languages[langCode] = { native: nativeName };
    }
  });
  
  // Get current language
  function getCurrentLanguage() {
    // Priority: URL param > localStorage > browser > default
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get('lang');
    if (urlLang && languages[urlLang]) return urlLang;
    
    const storedLang = localStorage.getItem('preferredLanguage');
    if (storedLang && languages[storedLang]) return storedLang;
    
    return '__DEFAULT_LANG__';
  }
  
  // Update visual state
  function updateCurrentLanguage(langCode) {
    const lang = languages[langCode];
    if (!lang) return;
    
    currentLangLabel.textContent = lang.native;
    
    options.forEach(option => {
      const optionLang = option.dataset.lang;
      const isActive = optionLang === langCode;
      option.classList.toggle('active', isActive);
      option.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
  }
  
  // Toggle dropdown
  function toggleDropdown(open) {
    const isOpen = open !== undefined ? open : !switcher.classList.contains('open');
    switcher.classList.toggle('open', isOpen);
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    
    if (isOpen) {
      // Focus first option when opened
      const activeOption = dropdown.querySelector('.language-option.active') || options[0];
      activeOption?.focus();
    }
  }
  
  // Handle language selection
  // This function only handles UI updates and dispatches the event.
  // The actual language switching logic is handled by i18n.js
  function selectLanguage(langCode) {
    if (!languages[langCode]) return;
    
    // Close dropdown and refocus toggle
    toggleDropdown(false);
    toggle.focus();
    
    // Dispatch i18n:languageChange event for i18n.js to handle
    // i18n.js is the single source of truth for:
    // - localStorage persistence
    // - URL management
    // - Translation loading
    // - State management
    document.dispatchEvent(new CustomEvent('i18n:languageChange', { 
      detail: { lang: langCode } 
    }));
  }
  
  // Event: Toggle click
  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleDropdown();
  });
  
  // Event: Option click
  options.forEach(option => {
    option.addEventListener('click', () => {
      selectLanguage(option.dataset.lang);
    });
    
    option.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectLanguage(option.dataset.lang);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = option.nextElementSibling;
        if (next) next.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = option.previousElementSibling;
        if (prev) prev.focus();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        toggleDropdown(false);
        toggle.focus();
      }
    });
  });
  
  // Event: Click outside to close
  document.addEventListener('click', (e) => {
    if (!switcher.contains(e.target)) {
      toggleDropdown(false);
    }
  });
  
  // Event: Keyboard navigation on toggle
  toggle.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      toggleDropdown(true);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      toggleDropdown(false);
    }
  });
  
  // Initialize on load
  document.addEventListener('DOMContentLoaded', () => {
    const currentLang = getCurrentLanguage();
    updateCurrentLanguage(currentLang);
  });
  
  // Listen for language changes from i18n.js to update UI state
  document.addEventListener('i18n:languageChanged', (e) => {
    if (e.detail && e.detail.lang) {
      updateCurrentLanguage(e.detail.lang);
    }
  });
})();
