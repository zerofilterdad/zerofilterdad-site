/* Live Fourthwall product grid for merch.html.
   Calls /api/products (Cloudflare Pages Function; the token stays server-side).
   If anything fails, the static cards already in the page stay as they are. */
(function () {
  "use strict";
  var grid = document.querySelector("[data-live-products]");
  if (!grid || !window.fetch) return;

  var DEFAULT_ALT = "Product photo";
  grid.classList.add("fw-loading");

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function money(v, cur) {
    try {
      return new Intl.NumberFormat("en-US", { style: "currency", currency: cur || "USD" }).format(v);
    } catch (e) { return "$" + Number(v).toFixed(2); }
  }
  function priceText(p) {
    if (p.priceMin == null) return "";
    if (p.priceMax != null && p.priceMax !== p.priceMin) return money(p.priceMin, p.currency) + " \u2013 " + money(p.priceMax, p.currency);
    return money(p.priceMin, p.currency);
  }
  function safeUrl(u) { return typeof u === "string" && /^https:\/\//i.test(u); }

  function card(p) {
    var a = el("article", "card product fw-card" + (p.soldOut ? " is-soldout" : ""));

    var media = el("div", "fw-media");
    if (p.image && safeUrl(p.image.url)) {
      var img = document.createElement("img");
      img.src = p.image.url;
      img.alt = p.name;
      img.loading = "lazy";
      img.decoding = "async";
      if (p.image.width && p.image.height) { img.width = p.image.width; img.height = p.image.height; }
      media.appendChild(img);
    } else {
      media.appendChild(el("div", "fw-noimg", DEFAULT_ALT));
    }
    if (p.soldOut) media.appendChild(el("span", "fw-badge", "Sold out"));
    a.appendChild(media);

    var h = el("h3", "fw-title");
    var link = document.createElement("a");
    link.href = p.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.appendChild(document.createTextNode(p.name));
    link.appendChild(el("span", "sr-only", p.soldOut ? " (sold out, opens in a new tab)" : " (opens in a new tab)"));
    h.appendChild(link);
    a.appendChild(h);

    var price = el("p", "fw-price", priceText(p));
    if (p.compareAt && p.priceMin != null && p.compareAt > p.priceMin) {
      price.appendChild(document.createTextNode(" "));
      price.appendChild(el("s", null, money(p.compareAt, p.currency)));
    }
    a.appendChild(price);

    if (p.colors && p.colors.length) {
      var cw = el("ul", "fw-colors");
      cw.setAttribute("aria-label", "Colors");
      p.colors.forEach(function (c) {
        var li = el("li", c.soldOut ? "is-out" : "");
        var sw = el("i");
        sw.setAttribute("aria-hidden", "true");
        if (c.swatch && /^#[0-9a-f]{3,8}$/i.test(c.swatch)) sw.style.background = c.swatch;
        li.appendChild(sw);
        li.appendChild(el("span", null, c.name));
        cw.appendChild(li);
      });
      a.appendChild(cw);
    }
    if (p.sizes && p.sizes.length) {
      var sw2 = el("ul", "fw-sizes");
      sw2.setAttribute("aria-label", "Sizes");
      p.sizes.forEach(function (s) {
        var li = el("li", s.soldOut ? "is-out" : "", s.name);
        if (s.soldOut) li.title = "Sold out";
        sw2.appendChild(li);
      });
      a.appendChild(sw2);
    }

    var more = el("span", "more", p.soldOut ? "Sold out" : "View in shop");
    more.setAttribute("aria-hidden", "true");
    a.appendChild(more);
    return a;
  }

  function fail() { grid.classList.remove("fw-loading"); }

  var ctl = window.AbortController ? new AbortController() : null;
  var timer = setTimeout(function () { if (ctl) ctl.abort(); }, 8000);

  fetch("/api/products", { headers: { Accept: "application/json" }, signal: ctl ? ctl.signal : undefined })
    .then(function (r) { if (!r.ok) throw new Error("bad status"); return r.json(); })
    .then(function (d) {
      clearTimeout(timer);
      if (!d || !Array.isArray(d.products) || !d.products.length) throw new Error("empty");
      var frag = document.createDocumentFragment();
      d.products.forEach(function (p) { frag.appendChild(card(p)); });
      grid.textContent = "";
      grid.appendChild(frag);
      grid.classList.remove("fw-loading");
      grid.classList.add("fw-live");
      grid.setAttribute("aria-busy", "false");
    })
    .catch(function () { clearTimeout(timer); fail(); });
})();
