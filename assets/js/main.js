/* ZeroFilterDad.com - small vanilla JS shared by every page. No dependencies, no build step. */
(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.remove('no-js'); root.classList.add('js');

  /* ---- Event window: the WWP charity stream banner hides itself after Oct 31, 2026 (Central) ----
     Nov 1, 2026 00:00 is still CDT (UTC-5). Elements with [data-event] are hidden once the window closes. */
  var EVENT_END = Date.parse('2026-11-01T00:00:00-05:00');
  var eventActive = Date.now() < EVENT_END;
  window.ZFD = { eventActive: eventActive };
  if (!eventActive) {
    document.querySelectorAll('[data-event]').forEach(function (el) { el.hidden = true; });
    document.querySelectorAll('[data-event-over]').forEach(function (el) { el.hidden = false; });
  }

  /* ---- Mobile nav toggle ---- */
  var toggle = document.querySelector('.nav-toggle');
  var list = document.getElementById('nav-list');
  if (toggle && list) {
    toggle.addEventListener('click', function () {
      var open = list.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && list.classList.contains('open')) {
        list.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); toggle.focus();
      }
    });
  }

  /* ---- Email: assembled at runtime so the address isn't in the HTML for scrapers.
     Contact address is hello@zerofilterdad.com (Brook's decision).
     TODO: make sure Cloudflare Email Routing (or a mailbox) exists for it before launch. ---- */
  document.querySelectorAll('a[data-u][data-d]').forEach(function (a) {
    var addr = a.getAttribute('data-u') + '@' + a.getAttribute('data-d');
    var subj = a.getAttribute('data-subject');
    a.href = 'mailto:' + addr + (subj ? '?subject=' + encodeURIComponent(subj) : '');
    if (a.hasAttribute('data-show')) { a.textContent = addr; }
  });

  /* ---- Local-time hints. Everything is published in CT; viewers elsewhere get a small conversion. ---- */
  var userTz = '';
  try { userTz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
  function fmt(d) {
    try { return new Intl.DateTimeFormat(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }).format(d); }
    catch (e) { return ''; }
  }
  function chicagoParts(d) {
    var p = {};
    new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric', weekday: 'short' }).formatToParts(d).forEach(function (x) { p[x.type] = x.value; });
    return p;
  }
  var DAYS = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  // Next instant that is `hour:00` on weekday `dow` in America/Chicago.
  function nextChicago(dow, hour) {
    var now = Date.now();
    for (var i = 0; i < 8; i++) {
      var probe = new Date(now + i * 86400000);
      var c = chicagoParts(probe);
      if (DAYS[c.weekday] !== dow) { continue; }
      for (var off = 5; off <= 6; off++) { // CDT = UTC-5, CST = UTC-6
        var guess = new Date(Date.UTC(+c.year, +c.month - 1, +c.day, hour + off, 0));
        var g = chicagoParts(guess);
        if (+g.hour === hour && DAYS[g.weekday] === dow) { return guess; }
      }
    }
    return null;
  }
  var sameZone = false;
  try { sameZone = userTz === 'America/Chicago'; } catch (e) {}
  if (userTz && !sameZone) {
    document.querySelectorAll('[data-dow][data-hour]').forEach(function (el) {
      var d = nextChicago(+el.getAttribute('data-dow'), +el.getAttribute('data-hour'));
      if (!d) { return; }
      var s = document.createElement('span'); s.className = 'local'; s.textContent = ' (' + fmt(d) + ' your time)';
      el.appendChild(s);
    });
    document.querySelectorAll('[data-ts]').forEach(function (el) {
      var d = new Date(el.getAttribute('data-ts'));
      if (isNaN(d)) { return; }
      var s = document.createElement('span'); s.className = 'local'; s.textContent = ' (' + fmt(d) + ' your time)';
      el.appendChild(s);
    });
  }

  /* ---- Email capture (placeholder): no backend yet, so the form only shows a message.
     TODO: set data-endpoint on the form (Beehiiv / Mailchimp / Formspree URL) and POST to it here. ---- */
  document.querySelectorAll('form.signup').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var note = form.parentNode.querySelector('.signup-note');
      if (note) { note.textContent = 'Signup opens soon. Check back, or follow on Twitch or TikTok for the drop.'; }
    });
  });

  /* ---- Twitch player: loads on click. "parent" must be the site's hostname. ---- */
  var btn = document.getElementById('load-player');
  if (btn) {
    btn.addEventListener('click', function () {
      var box = btn.parentNode;
      var f = document.createElement('iframe');
      var channel = box.getAttribute('data-channel') || 'zerofilterdad';
      f.src = 'https://player.twitch.tv/?channel=' + encodeURIComponent(channel) +
              '&parent=' + encodeURIComponent(location.hostname || 'localhost') + '&muted=true';
      f.title = 'ZeroFilterDad live on Twitch';
      f.allowFullscreen = true;
      f.setAttribute('allow', 'autoplay; fullscreen');
      box.replaceChild(f, btn);
    });
  }
})();
