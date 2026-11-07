/* Book a call: in-page Cal.com calendar.
   Buttons keep a real cal.com href. If this embed cannot load, the click
   does nothing special and that link opens the same booking page.
   Same popup the link page uses for "Book a Call with Dad". */
(function () {
  'use strict';
  var links = document.querySelectorAll('a[data-book-link]');
  if (!links.length) { return; }

  /* Official Cal.com embed stub. Cal() calls queue until embed.js arrives. */
  (function (C, A, L) {
    var p = function (a, ar) { a.q.push(ar); };
    var d = C.document;
    C.Cal = C.Cal || function () {
      var cal = C.Cal;
      var ar = arguments;
      if (!cal.loaded) {
        cal.ns = {};
        cal.q = cal.q || [];
        var sc = d.createElement('script');
        sc.src = A;
        sc.async = true;
        sc.onload = function () { C.__bookReady = true; };
        d.head.appendChild(sc);
        cal.loaded = true;
      }
      if (ar[0] === L) {
        var api = function () { p(api, arguments); };
        var namespace = ar[1];
        api.q = api.q || [];
        if (typeof namespace === 'string') {
          cal.ns[namespace] = cal.ns[namespace] || api;
          p(cal.ns[namespace], ar);
          p(cal, ['initNamespace', namespace]);
        } else { p(cal, ar); }
        return;
      }
      p(cal, ar);
    };
  })(window, 'https://app.cal.com/embed/embed.js', 'init');

  window.Cal('init', { origin: 'https://app.cal.com' });
  window.Cal('ui', {
    theme: 'dark',
    hideEventTypeDetails: false,
    layout: 'month_view',
    cssVarsPerTheme: {
      dark: { 'cal-brand': '#0050f8' },
      light: { 'cal-brand': '#0050f8' }
    }
  });

  links.forEach(function (a) {
    a.addEventListener('click', function (e) {
      /* Modified clicks keep the real link (open in a new tab, and so on). */
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) { return; }
      if (!window.__bookReady) { return; }
      var calLink = a.getAttribute('data-book-link');
      if (!calLink) { return; }
      e.preventDefault();
      try {
        window.Cal('modal', { calLink: calLink, config: { layout: 'month_view', theme: 'dark' } });
      } catch (err) {
        window.open(a.href, '_blank', 'noopener');
      }
    });
  });
})();
