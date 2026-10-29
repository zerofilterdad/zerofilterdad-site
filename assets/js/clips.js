/* Top clips on streaming.html: YouTube embeds that start muted, with a per-clip Unmute/Mute button.
   Loads the YouTube IFrame API only when the clips section is near the viewport. */
(function () {
  var wrap = document.querySelector('[data-clips]');
  if (!wrap) return;
  var cards = Array.prototype.slice.call(wrap.querySelectorAll('[data-clip]'));
  var started = false;

  function setLabel(btn, muted) {
    btn.setAttribute('aria-pressed', muted ? 'false' : 'true');
    btn.querySelector('.clip-lbl').textContent = muted ? 'Unmute' : 'Mute';
  }

  function build() {
    cards.forEach(function (card) {
      var btn = card.querySelector('.clip-sound');
      var host = card.querySelector('.clip-player');
      var player = new YT.Player(host, {
        host: 'https://www.youtube-nocookie.com',
        videoId: card.getAttribute('data-clip'),
        playerVars: { mute: 1, playsinline: 1, rel: 0, modestbranding: 1, controls: 1, enablejsapi: 1, origin: location.origin },
        events: {
          onReady: function (e) {
            e.target.mute();
            e.target.getIframe().setAttribute('title', card.querySelector('h3').textContent + ' (video clip)');
            setLabel(btn, true);
            btn.disabled = false;
            btn.addEventListener('click', function () {
              if (e.target.isMuted()) { e.target.unMute(); e.target.setVolume(80); setLabel(btn, false); }
              else { e.target.mute(); setLabel(btn, true); }
            });
            card.__player = e.target;
          }
        }
      });
    });
  }

  function load() {
    if (started) return;
    started = true;
    window.onYouTubeIframeAPIReady = build;
    var s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    s.async = true;
    document.head.appendChild(s);
  }

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (en) {
      if (en.some(function (x) { return x.isIntersecting; })) { io.disconnect(); load(); }
    }, { rootMargin: '300px 0px' });
    io.observe(wrap);
  } else { load(); }
})();
