
(function() {
  'use strict';
  
  const toast = document.getElementById('translationToast');
  const toastMessage = document.getElementById('toastMessage');
  const toastLink = document.getElementById('toastOriginalLink');
  const toastDismiss = document.getElementById('toastDismiss');
  const toastProgress = document.getElementById('toastProgress');
  
  if (!toast || !toastMessage || !toastLink || !toastDismiss) return;
  
  const AUTO_DISMISS_DURATION = 8000; // 8 seconds
  const DISMISS_MEMORY_KEY = 'translationToastDismissed';
  const DISMISS_MEMORY_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  
  let autoDismissTimeout = null;
  let isVisible = false;
  
  // Toast messages in target languages
  const toastMessages = {
    en: {
      message: 'This page is displayed in English.',
      link: 'View original'
    },
    es: {
      message: 'Esta página ha sido traducida automáticamente al español.',
      link: 'Ver original en inglés'
    },
    zh: {
      message: '此页面已自动翻译成中文。',
      link: '查看英文原文'
    },
    hi: {
      message: 'इस पृष्ठ का हिंदी में स्वचालित रूप से अनुवाद किया गया है।',
      link: 'मूल अंग्रेजी में देखें'
    },
    pt: {
      message: 'Esta página foi traduzida automaticamente para português.',
      link: 'Ver original em inglês'
    },
    fr: {
      message: 'Cette page a été automatiquement traduite en français.',
      link: 'Voir l\'original en anglais'
    },
    de: {
      message: 'Diese Seite wurde automatisch ins Deutsche übersetzt.',
      link: 'Original auf Englisch anzeigen'
    },
    ja: {
      message: 'このページは日本語に自動翻訳されています。',
      link: '英語の原文を表示'
    },
    ko: {
      message: '이 페이지는 한국어로 자동 번역되었습니다.',
      link: '영어 원문 보기'
    }
  };
  
  /**
   * Check if toast was recently dismissed
   */
  function wasRecentlyDismissed() {
    try {
      const dismissedData = localStorage.getItem(DISMISS_MEMORY_KEY);
      if (!dismissedData) return false;
      
      const { timestamp } = JSON.parse(dismissedData);
      const now = Date.now();
      
      // Clear old dismissal memory
      if (now - timestamp > DISMISS_MEMORY_DURATION) {
        localStorage.removeItem(DISMISS_MEMORY_KEY);
        return false;
      }
      
      return true;
    } catch (e) {
      return false;
    }
  }
  
  /**
   * Remember that toast was dismissed
   */
  function rememberDismissal() {
    try {
      localStorage.setItem(DISMISS_MEMORY_KEY, JSON.stringify({
        timestamp: Date.now()
      }));
    } catch (e) {
      // localStorage might be disabled
    }
  }
  
  /**
   * Show the toast notification
   */
  function showToast(langCode) {
    // Don't show if recently dismissed or already visible
    if (wasRecentlyDismissed() || isVisible) return;
    
    // Don't show for default language (English)
    if (langCode === '__DEFAULT_LANG__') return;
    
    // Update message based on language
    const messages = toastMessages[langCode] || toastMessages.en;
    toastMessage.textContent = messages.message;
    toastLink.textContent = messages.link;
    
    // Set link to switch to English
    // Dispatch i18n:languageChange event for i18n.js to handle the switch
    toastLink.href = '#';
    toastLink.onclick = (e) => {
      e.preventDefault();
      hideToast();
      document.dispatchEvent(new CustomEvent('i18n:languageChange', { 
        detail: { lang: '__DEFAULT_LANG__' } 
      }));
    };
    
    // Show toast with animation
    isVisible = true;
    toast.classList.add('visible', 'animate-in');
    
    // Start progress bar animation
    if (toastProgress) {
      toastProgress.style.transition = `transform ${AUTO_DISMISS_DURATION}ms linear`;
      requestAnimationFrame(() => {
        toastProgress.style.transform = 'scaleX(0)';
      });
    }
    
    // Auto-dismiss after duration
    clearTimeout(autoDismissTimeout);
    autoDismissTimeout = setTimeout(() => {
      hideToast();
    }, AUTO_DISMISS_DURATION);
  }
  
  /**
   * Hide the toast notification
   */
  function hideToast(remember = false) {
    if (!isVisible) return;
    
    clearTimeout(autoDismissTimeout);
    isVisible = false;
    
    toast.classList.add('hiding');
    toast.classList.remove('animate-in');
    
    setTimeout(() => {
      toast.classList.remove('visible', 'hiding');
      
      // Reset progress bar
      if (toastProgress) {
        toastProgress.style.transition = 'none';
        toastProgress.style.transform = 'scaleX(1)';
      }
    }, 400);
    
    if (remember) {
      rememberDismissal();
    }
  }
  
  /**
   * Pause auto-dismiss on hover
   */
  function pauseAutoDismiss() {
    clearTimeout(autoDismissTimeout);
    if (toastProgress) {
      const computedStyle = getComputedStyle(toastProgress);
      toastProgress.style.transition = 'none';
      toastProgress.style.transform = computedStyle.transform;
    }
  }
  
  /**
   * Resume auto-dismiss on mouse leave
   */
  function resumeAutoDismiss() {
    if (!isVisible) return;
    
    // Calculate remaining time based on progress bar position
    const remainingTime = AUTO_DISMISS_DURATION * 0.4; // Resume with 40% time
    
    if (toastProgress) {
      toastProgress.style.transition = `transform ${remainingTime}ms linear`;
      requestAnimationFrame(() => {
        toastProgress.style.transform = 'scaleX(0)';
      });
    }
    
    autoDismissTimeout = setTimeout(() => {
      hideToast();
    }, remainingTime);
  }
  
  // Event: Dismiss button click
  toastDismiss.addEventListener('click', () => {
    hideToast(true);
  });
  
  // Event: Pause on hover
  toast.addEventListener('mouseenter', pauseAutoDismiss);
  toast.addEventListener('mouseleave', resumeAutoDismiss);
  
  // Event: Touch support
  toast.addEventListener('touchstart', pauseAutoDismiss, { passive: true });
  toast.addEventListener('touchend', resumeAutoDismiss, { passive: true });
  
  // Event: Keyboard dismiss (Escape)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isVisible) {
      hideToast(true);
    }
  });
  
  // Event: Listen for translation loaded events from i18n.js
  // i18n.js dispatches 'i18n:translationLoaded' on document after content is applied
  document.addEventListener('i18n:translationLoaded', (e) => {
    if (e.detail && e.detail.lang) {
      showToast(e.detail.lang);
    }
  });
  
  // Expose functions globally for i18n.js integration
  window.TranslationToast = {
    show: showToast,
    hide: hideToast
  };
})();
