(function() {
  "use strict";

  function getOrdinalSuffix(day) {
    if (day === 1 || day === 21 || day === 31) {
      return "st";
    }

    if (day === 2 || day === 22) {
      return "nd";
    }

    if (day === 3 || day === 23) {
      return "rd";
    }

    return "th";
  }

  document.addEventListener("DOMContentLoaded", function() {
    var dateElements = document.querySelectorAll(".post-date[data-date]");
    var months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    dateElements.forEach(function(el) {
      var dateStr = el.getAttribute("data-date");
      if (!dateStr) return;

      var date = new Date(dateStr + "T00:00:00");
      if (isNaN(date.getTime())) return;

      var day = date.getDate();
      var month = months[date.getMonth()];
      var year = date.getFullYear();

      el.textContent = month + " " + day + getOrdinalSuffix(day) + ", " + year;
    });

    document.querySelectorAll(".views-count").forEach(function(el) {
      var count = parseInt(el.textContent, 10);
      if (!isNaN(count)) {
        el.textContent = count.toLocaleString();
      }
    });
  });
})();
