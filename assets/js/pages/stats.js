(function() {
  "use strict";

  // Number/time formatting happens server-side in app/stats/page.tsx now;
  // this script only reveals the cards as they scroll into view.
  document.addEventListener("DOMContentLoaded", function() {
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
