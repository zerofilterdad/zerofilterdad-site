/* Homepage extras: testimonial form. POSTs to /api/testimonial (Cloudflare Pages Function).
   If that is not set up yet or fails, falls back to a prefilled mailto: to the site's contact address. */
(function () {
  "use strict";
  var form = document.getElementById("tform");
  if (!form) return;
  var msg = document.getElementById("t-msg");
  var nameEl = document.getElementById("t-name");
  var note = document.getElementById("t-note");
  var btn = form.querySelector("button[type=submit]");
  var user = form.getAttribute("data-u"), domain = form.getAttribute("data-d");

  function say(text, kind) {
    note.textContent = text;
    note.className = "tnote" + (kind ? " is-" + kind : "");
  }
  function mailtoFallback(message, name) {
    var addr = user + "@" + domain;
    var body = message + (name ? "\n\n" + name : "");
    var href = "mailto:" + addr + "?subject=" + encodeURIComponent("Testimonial") + "&body=" + encodeURIComponent(body);
    say("I couldn't send that from here, so I'm opening your email app with it filled in. Just hit send.", "warn");
    window.location.href = href;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var message = msg.value.trim();
    var name = nameEl.value.trim();
    var hp = form.elements["website"] ? form.elements["website"].value : "";
    if (message.length < 10) {
      say("Add a sentence or two first.", "warn");
      msg.focus();
      return;
    }
    btn.disabled = true;
    say("Sending...", "");
    var ctl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctl) ctl.abort(); }, 10000);
    fetch("/api/testimonial", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ message: message, name: name, website: hp }),
      signal: ctl ? ctl.signal : undefined
    }).then(function (r) {
      return r.json().then(function (d) { return { ok: r.ok && d && d.ok, status: r.status }; });
    }).then(function (res) {
      clearTimeout(timer);
      if (res.ok) {
        form.reset();
        form.classList.add("is-done");
        say("Thanks! Brook reviews every message before anything goes up.", "ok");
      } else if (res.status === 429) {
        btn.disabled = false;
        say("That's a few in a row. Give it a few minutes and try again.", "warn");
      } else {
        btn.disabled = false;
        mailtoFallback(message, name);
      }
    }).catch(function () {
      clearTimeout(timer);
      btn.disabled = false;
      mailtoFallback(message, name);
    });
  });
})();
