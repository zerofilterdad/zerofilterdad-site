/* Donate section: progress bar + sticky pill (homepage).
   ==========================================================================
   EDIT THESE TWO NUMBERS (the only place they live):
   The goal ($3,000) was set by Brook. "raised" is NOT connected to anything:
   it is a hand-entered placeholder. Update it by hand, or connect a live
   tracker later. Do not enter a number that has not been confirmed. */
var DONATE = {
  goal: 3000,   // goal set by Brook, in US dollars
  raised: 0     // update by hand
};

(function () {
  "use strict";
  var box = document.querySelector("[data-donate-progress]");
  if (box) {
    var goal = Number(DONATE.goal), raised = Number(DONATE.raised);
    if (goal > 0 && raised >= 0) {
      var fmt = function (n) { return "$" + Math.round(n).toLocaleString("en-US"); };
      var pct = Math.max(0, Math.min(100, (raised / goal) * 100));
      box.querySelector("[data-donate-text]").textContent = fmt(raised) + " raised of " + fmt(goal) + " goal";
      var bar = box.querySelector(".donate-bar");
      bar.setAttribute("aria-valuenow", String(Math.round(pct)));
      bar.setAttribute("aria-valuetext", fmt(raised) + " raised of " + fmt(goal) + " goal");
      box.hidden = false;
      var fill = box.querySelector(".donate-fill");
      requestAnimationFrame(function () { fill.style.width = pct + "%"; });
    }
  }

  /* Sticky pill: hide it while the donate section is in view */
  var pill = document.getElementById("donate-pill");
  var sec = document.getElementById("donate");
  if (pill && sec && "IntersectionObserver" in window) {
    new IntersectionObserver(function (es) {
      pill.classList.toggle("is-away", es[0].isIntersecting);
    }, { threshold: 0.2 }).observe(sec);
  }
})();
