/* Header Live badge. Polls /api/live (Pages Function: Twitch + TikTok) on load and every 60s.
   The markup starts Offline, so that is what shows before this runs and if the request fails. */
(function () {
  "use strict";
  var badge = document.querySelector(".live-badge");
  if (!badge) return;
  var label = badge.querySelector(".lb-label");
  var TWITCH = "https://www.twitch.tv/zerofilterdad";
  var TIKTOK = "https://www.tiktok.com/@zerofilterdad/live";

  function paint(live, href) {
    badge.classList.toggle("is-live", live);
    badge.classList.toggle("is-offline", !live);
    badge.href = href || TWITCH;
    if (label) label.textContent = live ? "Live now" : "Offline";
  }

  function refresh() {
    fetch("/api/live", { cache: "no-store", credentials: "same-origin" })
      .then(function (res) {
        if (!res.ok) throw new Error("status");
        return res.json();
      })
      .then(function (data) {
        var twitch = !!(data && data.twitch);
        var tiktok = !!(data && data.tiktok);
        var live = !!(data && (data.live || twitch || tiktok));
        paint(live, live ? (twitch ? TWITCH : TIKTOK) : TWITCH);
      })
      .catch(function () { paint(false, TWITCH); });
  }

  refresh();
  setInterval(refresh, 60000);
})();
