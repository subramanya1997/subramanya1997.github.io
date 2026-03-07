(function() {
  "use strict";

  function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function formatTime(seconds) {
    var mins = Math.round(seconds / 60 * 10) / 10;
    if (mins < 1) {
      return Math.round(seconds) + "s";
    }

    return mins + "m";
  }

  document.addEventListener("DOMContentLoaded", function() {
    var totalViewsEl = document.getElementById("total-views");

    if (totalViewsEl) {
      var rawValue = parseInt(totalViewsEl.textContent.trim(), 10);
      if (!isNaN(rawValue)) {
        totalViewsEl.textContent = formatNumber(rawValue);
      }
    }

    document.querySelectorAll(".stats-metric-value").forEach(function(el) {
      var text = el.textContent.trim();

      if (el.dataset.seconds) {
        var seconds = parseFloat(el.dataset.seconds);
        if (!isNaN(seconds)) {
          el.textContent = formatTime(seconds);
        }
        return;
      }

      var num = parseInt(text, 10);
      if (!isNaN(num) && !text.includes("%") && !text.includes("m") && !text.includes("s")) {
        el.textContent = formatNumber(num);
      }
    });

    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll(".stat-card, .stats-row").forEach(function(el) {
      observer.observe(el);
    });
  });
})();
