/* Mini Zero greeter (homepage only). Vanilla JS, no dependencies.
   - Entrance + typed welcome bubble once per session (sessionStorage), idle float afterwards.
   - Dismissible bubble; click Mini Zero to reopen it any time.
   - Quick buttons + "Ask Mini Zero" client-side keyword search (synonym map + light fuzzy matching).
   - Optional voice lines (assets/audio/*.mp3): never autoplay; first tap/click or the Hear button starts the welcome.
     Mute toggle persists in localStorage. Respects prefers-reduced-motion (static, no typing, no float).
   - Hover / first touch tap / keyboard focus: cap-tip + "Hey, how you doin'?" (throttled 10 s). Click / Enter: a random clean joke, no repeat until all nine are used.
   - Animated loop (WebM alpha, animated WebP on Safari) loads after page load; reduced motion keeps the still.
   TODO COPY: every line in LINES below is placeholder copy in Mini Zero's voice; Brook edits text here. */
(function () {
  'use strict';
  var g = document.getElementById('greeter');
  if (!g) { return; }

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasAudio = g.getAttribute('data-audio') === '1';
  var bubble = document.getElementById('mz-bubble');
  var char = document.getElementById('mz-char');
  var text = document.getElementById('mz-text');
  var live = document.getElementById('mz-live');
  var link = document.getElementById('mz-link');
  var quick = document.getElementById('mz-quick');
  var form = document.getElementById('mz-form');
  var input = document.getElementById('mz-q');
  var closeBtn = document.getElementById('mz-close');
  var muteBtn = document.getElementById('mz-mute');
  var hearBtn = document.getElementById('mz-hear');
  var hint = document.getElementById('mz-hint');
  var eventOn = !(window.ZFD && window.ZFD.eventActive === false);

  function ss(k, v) { try { if (v === undefined) { return sessionStorage.getItem(k); } sessionStorage.setItem(k, v); } catch (e) {} return null; }
  function ls(k, v) { try { if (v === undefined) { return localStorage.getItem(k); } localStorage.setItem(k, v); } catch (e) {} return null; }

  /* ---------- Copy (TODO: placeholder lines) ---------- */
  var WELCOME = "Yo! Welcome to ZeroFilterDad HQ. Streams, guides, and zero filter. Let's go!";
  var DEST = {
    streaming: { href: '#streaming', label: 'Go to Streaming', audio: 'streaming', text: "Streams? Right over here. Watch live on Twitch or TikTok." },
    schedule:  { href: '#schedule', label: 'See the schedule', audio: 'streaming', text: "I'm live Fri 8 PM, Sat 9 AM and 7 PM, Sun 9 AM and 7 PM, all CT. On kid weekends, Sunday is a pop-up stream with no set time." },
    beginner:  { href: '#guide', label: 'Open the Beginner Guide', audio: 'beginner', text: "New to streaming? Start right here with the beginner guide." },
    automation:{ href: '#automation', label: 'See the Automation guides', audio: 'automation', text: "Automation. Work smarter, not harder. Look right here." },
    consulting:{ href: '#consulting', label: 'Work with me', audio: 'consulting', text: "Need a hand? Book a call, contact for pricing." },
    merch:     { href: '#merch', label: 'Shop merch', audio: 'merch', text: "Merch. Look sharp. The shelf is right here." },
    wwp:       { href: '#give-back', label: 'See the charity stream', audio: 'wwp', text: "Charity stream Fri Oct 30: starts 7:30 PM CT, DJ Cyber Sentinel joins at 8 PM CT. If you'd like to give, Twitch's charity feature or the WWP page both work." },
    fallback:  { href: null, label: '', audio: 'fallback', text: "Hmm, not sure. Try one of these!" }
  };
  if (!eventOn) { DEST.wwp.text = "Giving back to Wounded Warrior Project. Details are right here."; }

  /* ---------- Search: synonym map (weight 2 = strong word, 1 = weak) ---------- */
  var SYN = {
    schedule: { 2: ['schedule', 'when', 'times', 'calendar', 'weekend', 'weekends', 'saturday', 'sunday', 'friday', 'hours', 'timetable'], 1: ['time', 'live', 'tonight', 'today'] },
    wwp: { 2: ['wwp', 'wounded', 'warrior', 'charity', 'fundraiser', 'donate', 'donation', 'cyber', 'sentinel', 'event', 'veteran', 'veterans', 'military', 'giveback'], 1: ['dj', 'give', 'gives', 'back', 'cause'] },
    streaming: { 2: ['stream', 'streams', 'streaming', 'twitch', 'watch', 'tiktok', 'kick', 'vod', 'clips', 'live'], 1: ['play', 'games', 'gaming', 'video', 'channel'] },
    beginner: { 2: ['beginner', 'beginners', 'start', 'starting', 'setup', 'obs', 'guide', 'guides', 'tutorial', 'learn', 'newbie', 'basics'], 1: ['new', 'how', 'begin', 'gear'] },
    automation: { 2: ['automate', 'automation', 'automations', 'bot', 'bots', 'tools', 'workflow', 'workflows', 'script', 'ai'], 1: ['save', 'faster', 'auto'] },
    consulting: { 2: ['hire', 'consulting', 'consult', 'consultant', 'advisor', 'adviser', 'coach', 'coaching', 'pricing', 'rates', 'book', 'call'], 1: ['help', 'work', 'service', 'services', 'contact'] },
    merch: { 2: ['merch', 'shirt', 'shirts', 'tee', 'hoodie', 'hoodies', 'shop', 'store', 'hat', 'hats', 'sticker', 'stickers', 'buy', 'clothes', 'apparel'], 1: ['gear', 'swag'] }
  };
  var PHRASES = { // multi-word hints: strong boost
    schedule: ['when do you stream', 'live times', 'what time', 'stream times', 'when are you live', 'when do you go live'],
    wwp: ['event time', 'dj cyber sentinel', 'wounded warrior', 'cyber sentinel', 'wounded warrior project'],
    streaming: ['watch live', 'where to watch'],
    beginner: ['get started', 'start streaming', 'new to streaming'],
    consulting: ['book a call', 'work with'],
    automation: ['automate my stream']
  };
  function lev(a, b) {
    if (Math.abs(a.length - b.length) > 1) { return 2; }
    var prev = [], i, j;
    for (j = 0; j <= b.length; j++) { prev[j] = j; }
    for (i = 1; i <= a.length; i++) {
      var cur = [i];
      for (j = 1; j <= b.length; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1));
      }
      prev = cur;
    }
    return prev[b.length];
  }
  function match(raw) {
    var q = (raw || '').toLowerCase().replace(/[^a-z0-9\s']/g, ' ').replace(/\s+/g, ' ').trim();
    if (!q) { return null; }
    var toks = q.split(' ');
    var best = null, bestScore = 0;
    Object.keys(SYN).forEach(function (dest) {
      var score = 0;
      (PHRASES[dest] || []).forEach(function (p) { if (q.indexOf(p) !== -1) { score += 4; } });
      [2, 1].forEach(function (w) {
        SYN[dest][w].forEach(function (word) {
          toks.forEach(function (t) {
            if (t === word) { score += w; }
            else if (t.length >= 4 && word.length >= 4 && (word.indexOf(t) === 0 || t.indexOf(word) === 0)) { score += w * 0.8; }
            else if (t.length >= 5 && word.length >= 5 && lev(t, word) <= 1) { score += w * 0.7; }
          });
        });
      });
      if (score > bestScore) { bestScore = score; best = dest; }
    });
    return bestScore >= 0.9 ? best : null;
  }
  window.__mzMatch = match; // handy for testing in the console

  /* ---------- Audio (optional) ---------- */
  var muted = ls('mzMuted') === '1';
  var audio = null;
  function setMuteUI() {
    if (!muteBtn) { return; }
    muteBtn.setAttribute('aria-pressed', String(muted));
    muteBtn.setAttribute('aria-label', muted ? 'Unmute Mini Zero' : 'Mute Mini Zero');
    muteBtn.querySelector('.on').hidden = muted;
    muteBtn.querySelector('.off').hidden = !muted;
  }
  function stopAudio() { if (audio) { audio.pause(); } char.classList.remove('talking'); }
  function play(key) {
    if (!hasAudio || muted || !key) { return; }
    stopAudio();
    audio = new Audio('assets/audio/mz-' + key + '.mp3');
    audio.preload = 'auto';
    audio.addEventListener('playing', function () { char.classList.add('talking'); });
    audio.addEventListener('ended', function () { char.classList.remove('talking'); });
    audio.addEventListener('error', function () { char.classList.remove('talking'); });
    var p = audio.play(); if (p && p.catch) { p.catch(function () {}); }
  }
  if (hasAudio && muteBtn) {
    muteBtn.hidden = false; setMuteUI();
    muteBtn.addEventListener('click', function () {
      muted = !muted; ls('mzMuted', muted ? '1' : '0'); setMuteUI(); if (muted) { stopAudio(); }
    });
  }
  if (hasAudio && hearBtn) {
    hearBtn.hidden = false;
    hearBtn.addEventListener('click', function () {
      muted = false; ls('mzMuted', '0'); setMuteUI(); ss('mzWelcomed', '1'); play('welcome');
    });
  }
  // First user interaction anywhere starts the welcome once per visit (never forced on load).
  if (hasAudio) {
    var first = function (e) {
      document.removeEventListener('pointerdown', first, true); document.removeEventListener('keydown', first, true);
      if (ss('mzWelcomed') || muted || bubble.hidden) { return; }
      if (g.contains(e.target)) { return; } // greeter controls play their own lines
      ss('mzWelcomed', '1'); play('welcome');
    };
    document.addEventListener('pointerdown', first, true);
    document.addEventListener('keydown', first, true);
  }

  /* ---------- Bubble ---------- */
  var typeTimer = null;
  function say(msg, opts) {
    opts = opts || {};
    clearInterval(typeTimer);
    live.textContent = msg;               // screen readers get the full line at once (polite)
    if (reduce || opts.instant) { text.textContent = msg; text.classList.remove('typing'); return; }
    text.textContent = ''; text.classList.add('typing');
    var i = 0;
    typeTimer = setInterval(function () {
      i++; text.textContent = msg.slice(0, i);
      if (i >= msg.length) { clearInterval(typeTimer); text.classList.remove('typing'); }
    }, 26);
  }
  function openBubble(instant) {
    bubble.hidden = false; char.setAttribute('aria-expanded', 'true'); if (hint) { hint.hidden = true; }
    if (instant !== false) { /* keep current text */ }
  }
  function closeBubble() {
    clearInterval(typeTimer); stopAudio();
    bubble.hidden = true; char.setAttribute('aria-expanded', 'false'); if (hint) { hint.hidden = false; }
    ss('mzGreeted', '1');
  }

  var glowTimer = null;
  function point(dest) {
    var d = DEST[dest]; if (!d || !d.href) { return; }
    var el = document.querySelector(d.href); if (!el) { return; }
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    el.classList.remove('mz-glow'); void el.offsetWidth; el.classList.add('mz-glow');
    clearTimeout(glowTimer); glowTimer = setTimeout(function () { el.classList.remove('mz-glow'); }, 2800);
  }
  function answer(dest, instant) {
    var d = DEST[dest];
    say(d.text, { instant: instant });
    if (d.href) { link.hidden = false; link.href = d.href; link.textContent = d.label + ' \u203A'; } else { link.hidden = true; }
    play(d.audio);
    if (d.href) { point(dest); }
    quick.hidden = false; // quick buttons always stay available (and the no-match case shows them)
  }

  quick.addEventListener('click', function (e) {
    var a = e.target.closest('a[data-dest]'); if (!a) { return; }
    e.preventDefault(); answer(a.getAttribute('data-dest'), true);
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var m = match(input.value);
    if (!m) { answer('fallback', true); return; }
    answer(m, true);
  });
  closeBtn.addEventListener('click', function () { closeBubble(); char.focus(); });
  bubble.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeBubble(); char.focus(); } });
  /* ---------- Hover / tap greeting + click jokes ---------- */
  // Voice lines for these live in assets/audio/mz-hello.mp3 and mz-joke1..9.mp3 (fetched only when played, i.e. after the visitor's first interaction).
  var HELLO = "Hey, how you doin'?";
  var JOKES = [
    "Why did the gamer bring a ladder to reach the next level?",
    "I don't have lag. I have dramatic pauses.",
    "Dad's aim is like Wi-Fi. Sometimes it connects.",
    "I'm not bragging, but I've never once respawned.",
    "I run the automations, so Dad can run his mouth.",
    "What do you call a gnome in a gaming chair? The boss.",
    "Dad asked for a coffee break. I said, never heard of her.",
    "Why are gamers never cold? They're surrounded by fans.",
    "Dad has zero filter. I call that a feature, not a bug."
  ];
  function nextJoke() {
    var bag = null, last = ss('mzLast');
    try { bag = JSON.parse(ss('mzBag') || 'null'); } catch (e) { bag = null; }
    if (!bag || !bag.length) {            // pool used up (or first time): reshuffle, never start on the joke just told
      bag = JOKES.map(function (_, i) { return i; });
      for (var i = bag.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = bag[i]; bag[i] = bag[j]; bag[j] = t; }
      if (last !== null && String(bag[bag.length - 1]) === last) { var k = bag[0]; bag[0] = bag[bag.length - 1]; bag[bag.length - 1] = k; }
    }
    var n = bag.pop(); ss('mzBag', JSON.stringify(bag)); ss('mzLast', String(n));
    return n;
  }
  window.__mzJokes = JOKES;
  function animate(cls) {
    if (reduce) { return; }
    char.classList.remove('tip', 'joke'); void char.offsetWidth; char.classList.add(cls);
    setTimeout(function () { char.classList.remove(cls); }, 1100);
  }
  function speakLine(msg, audioKey, cls) {
    if (bubble.hidden) { openBubble(); }
    link.hidden = true; quick.hidden = false;
    say(msg, { instant: true });          // bubble text and audio start together
    play(audioKey);
    animate(cls);
  }
  var lastHello = 0;
  function hello() {
    var now = Date.now();
    if (now - lastHello < 10000) { return; }                      // throttle: once every 10 s
    if (char.classList.contains('enter') || text.classList.contains('typing')) { return; } // never talk over the welcome
    lastHello = now;
    speakLine(HELLO, 'hello', 'tip');
  }
  function joke() {
    var n = nextJoke();
    speakLine(JOKES[n], 'joke' + (n + 1), 'joke');
  }
  var viaTouch = false, touchHelloDone = false;
  char.addEventListener('pointerdown', function (e) { viaTouch = (e.pointerType === 'touch' || e.pointerType === 'pen'); });
  char.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') { hello(); } });
  char.addEventListener('focus', function () {            // keyboard focus triggers the hello (mouse/touch focus does not)
    var fv = false; try { fv = char.matches(':focus-visible'); } catch (e) {}
    if (fv) { hello(); }
  });
  char.addEventListener('click', function () {
    var t = viaTouch; viaTouch = false;
    if (t && !touchHelloDone) { touchHelloDone = true; lastHello = 0; hello(); return; }   // first tap = hello
    joke();                                                                               // click / Enter / later taps = joke
  });

  /* ---------- Animated Mini Zero (lazy, after page load; still image for reduced motion) ---------- */
  var still = char.querySelector('img');
  var vid = document.getElementById('mz-vid');
  function loadLoop() {
    if (reduce || !still) { return; }
    var ua = navigator.userAgent;
    var webkit = /iP(hone|ad|od)/.test(ua) || (/^((?!chrome|android|crios|fxios|edg).)*safari/i.test(ua));
    var canWebm = vid && vid.canPlayType && vid.canPlayType('video/webm; codecs="vp9"');
    if (webkit || !canWebm) {                                  // Safari: animated WebP (HEVC-alpha MOV can't be made on this box)
      var im = new Image();
      im.onload = function () { still.src = im.src; };
      im.src = 'assets/img/mini-zero-loop.webp';
      return;
    }
    vid.src = 'assets/img/mini-zero-loop.webm';
    vid.addEventListener('playing', function () { char.classList.add('has-vid'); vid.hidden = false; }, { once: true });
    var p = vid.play(); if (p && p.catch) { p.catch(function () {}); }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { if (!char.classList.contains('has-vid')) { return; } if (en[0].isIntersecting) { vid.play().catch(function () {}); } else { vid.pause(); } }).observe(char);
    }
  }
  function whenIdle(fn) { if ('requestIdleCallback' in window) { requestIdleCallback(fn, { timeout: 3000 }); } else { setTimeout(fn, 800); } }
  if (document.readyState === 'complete') { whenIdle(loadLoop); } else { window.addEventListener('load', function () { whenIdle(loadLoop); }); }

  /* ---------- Boot ---------- */
  if (ss('mzGreeted')) {
    // Already greeted this session: no entrance, no typing, bubble tucked away, just the idle float.
    bubble.hidden = true; char.setAttribute('aria-expanded', 'false'); if (hint) { hint.hidden = false; }
    live.textContent = '';
    if (!reduce) { char.classList.add('idle'); }
  } else {
    ss('mzGreeted', '1');
    if (reduce) { say(WELCOME, { instant: true }); }
    else {
      bubble.style.visibility = 'hidden'; quick.style.visibility = 'hidden';
      char.classList.add('enter');
      setTimeout(function () {
        bubble.style.visibility = ''; say(WELCOME);
        setTimeout(function () { quick.style.visibility = ''; }, WELCOME.length * 26 + 150);
      }, 900);
      char.addEventListener('animationend', function onEnd(e) {
        if (e.animationName !== 'mzenter') { return; }
        char.removeEventListener('animationend', onEnd);
        char.classList.remove('enter'); char.classList.add('idle');
      });
    }
    if (!reduce) { /* idle float starts after the entrance finishes */ } else { /* static */ }
  }
})();
