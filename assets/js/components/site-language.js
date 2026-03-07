(function() {
  "use strict";

  var root = document.documentElement;
  var defaultLang = root.dataset.defaultLang || "en";
  var supportedLanguages = (root.dataset.supportedLanguages || "")
    .split(",")
    .map(function(lang) { return lang.trim(); })
    .filter(Boolean);
  var storageKey = "preferredLanguage";

  function isInternalHref(href) {
    return href &&
      !href.startsWith("#") &&
      !href.startsWith("mailto:") &&
      !href.startsWith("tel:") &&
      !href.startsWith("javascript:");
  }

  function isSupportedLanguage(lang) {
    return !!lang && supportedLanguages.indexOf(lang) !== -1;
  }

  function getUrlLanguage() {
    var params = new URLSearchParams(window.location.search);
    var lang = params.get("lang");
    return isSupportedLanguage(lang) ? lang : null;
  }

  function getStoredLanguage() {
    try {
      var lang = localStorage.getItem(storageKey);
      return isSupportedLanguage(lang) ? lang : null;
    } catch (error) {
      return null;
    }
  }

  function getCurrentLanguage(options) {
    var opts = options || {};
    var lang = getUrlLanguage() || getStoredLanguage();

    if (!opts.includeDefault && lang === defaultLang) {
      return null;
    }

    return lang;
  }

  function serializeUrl(url) {
    return url.pathname + url.search + url.hash;
  }

  function appendLanguageToUrl(href, options) {
    if (!isInternalHref(href)) {
      return href;
    }

    var lang = (options && options.lang) || getCurrentLanguage();
    var absoluteUrl = new URL(href, window.location.origin);

    if (absoluteUrl.origin !== window.location.origin) {
      return href;
    }

    if (lang) {
      absoluteUrl.searchParams.set("lang", lang);
    } else {
      absoluteUrl.searchParams.delete("lang");
    }

    return serializeUrl(absoluteUrl);
  }

  function updateLink(link, options) {
    var href = link.getAttribute("href");

    if (!isInternalHref(href)) {
      return;
    }

    if (!link.dataset.originalHref) {
      link.dataset.originalHref = href;
    }

    link.setAttribute("href", appendLanguageToUrl(link.dataset.originalHref, options));
  }

  function updateForm(form, options) {
    var lang = (options && options.lang) || getCurrentLanguage();
    var hiddenInput = form.querySelector('input[data-lang-field="true"]');

    if (lang) {
      if (!hiddenInput) {
        hiddenInput = document.createElement("input");
        hiddenInput.type = "hidden";
        hiddenInput.name = "lang";
        hiddenInput.dataset.langField = "true";
        form.appendChild(hiddenInput);
      }

      hiddenInput.value = lang;
      return;
    }

    if (hiddenInput) {
      hiddenInput.remove();
    }
  }

  function applyToLinks(scope, options) {
    var rootScope = scope || document;
    var links = [];

    if (rootScope.matches && rootScope.matches("a[data-preserve-lang]")) {
      links.push(rootScope);
    }

    links = links.concat(Array.prototype.slice.call(rootScope.querySelectorAll("a[data-preserve-lang]")));
    links.forEach(function(link) {
      updateLink(link, options);
    });
  }

  function applyToForms(scope, options) {
    var rootScope = scope || document;
    var forms = [];

    if (rootScope.matches && rootScope.matches("form[data-preserve-lang]")) {
      forms.push(rootScope);
    }

    forms = forms.concat(Array.prototype.slice.call(rootScope.querySelectorAll("form[data-preserve-lang]")));
    forms.forEach(function(form) {
      updateForm(form, options);
    });
  }

  function apply(scope, options) {
    applyToLinks(scope, options);
    applyToForms(scope, options);
  }

  function setStoredLanguage(lang) {
    try {
      if (lang && lang !== defaultLang && isSupportedLanguage(lang)) {
        localStorage.setItem(storageKey, lang);
      } else {
        localStorage.removeItem(storageKey);
      }
    } catch (error) {
      // Ignore storage failures.
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function() {
      apply();
    });
  } else {
    apply();
  }

  window.SiteLanguage = {
    defaultLang: defaultLang,
    getUrlLanguage: getUrlLanguage,
    getStoredLanguage: getStoredLanguage,
    getCurrentLanguage: getCurrentLanguage,
    appendLanguageToUrl: appendLanguageToUrl,
    applyToLinks: applyToLinks,
    applyToForms: applyToForms,
    apply: apply,
    setStoredLanguage: setStoredLanguage
  };
})();
