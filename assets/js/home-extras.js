/* Homepage extras: testimonial form. POSTs straight to Web3Forms (https://api.web3forms.com/submit),
   which emails the message to Brook. Nothing is published automatically. */
(function () {
  "use strict";
  var form = document.getElementById("tform");
  if (!form) return;
  var msg = document.getElementById("t-msg");
  var nameEl = document.getElementById("t-name");
  var note = document.getElementById("t-note");
  var btn = form.querySelector("button[type=submit]");
  var ENDPOINT = "https://api.web3forms.com/submit";

  function say(text, kind) {
    note.textContent = text;
    note.className = "tnote" + (kind ? " is-" + kind : "");
  }
  function val(name) {
    var el = form.elements[name];
    return el ? el.value : "";
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var message = msg.value.trim();
    var name = nameEl.value.trim();
    var hp = val("website");
    var bot = form.elements["botcheck"] && form.elements["botcheck"].checked;
    if (message.length < 10) {
      say("Add a sentence or two first.", "warn");
      msg.focus();
      return;
    }
    if (hp || bot) { /* a bot filled a hidden field: pretend it worked, send nothing */
      form.reset();
      form.classList.add("is-done");
      say("Thanks! Brook reviews every message before anything goes up.", "ok");
      return;
    }
    var payload = {
      access_key: val("access_key"),
      subject: val("subject"),
      from_name: val("from_name"),
      message: message,
      name: name || "Anonymous",
      botcheck: ""
    };
    btn.disabled = true;
    say("Sending...", "");
    var ctl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctl) ctl.abort(); }, 10000);
    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
      signal: ctl ? ctl.signal : undefined
    }).then(function (r) {
      return r.json().then(function (d) { return { ok: r.ok && d && d.success, status: r.status }; });
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
        say("Sorry, that didn't go through. Try again in a minute, or email hello [at] zerofilterdad [dot] com.", "warn");
      }
    }).catch(function () {
      clearTimeout(timer);
      btn.disabled = false;
      say("Sorry, that didn't go through. Try again in a minute, or email hello [at] zerofilterdad [dot] com.", "warn");
    });
  });
})();
