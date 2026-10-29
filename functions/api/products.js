// Cloudflare Pages Function: GET /api/products
// Keeps the Fourthwall Storefront API token on the server. Set the secret
// FOURTHWALL_STOREFRONT_TOKEN in Cloudflare Pages (Settings > Variables and Secrets).
// Returns trimmed JSON for the merch page grid. Never returns the token.

const API = "https://storefront-api.fourthwall.com/v1/collections/all/products";
const SHOP = "https://zerofilterdad-shop.fourthwall.com";
const MAX_PAGES = 5;

const json = (body, status, cache) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": cache,
      "X-Content-Type-Options": "nosniff",
    },
  });

const isSoldOutVariant = (v) =>
  !!v && !!v.stock && v.stock.type === "LIMITED" && !(v.stock.inStock > 0);

function trimProduct(p) {
  if (!p || !p.slug || !p.name) return null;
  if (p.access && p.access.type && p.access.type !== "PUBLIC") return null;
  const img = (p.images && p.images[0]) || null;
  const out = {
    slug: p.slug,
    name: p.name,
    url: SHOP + "/products/" + encodeURIComponent(p.slug),
    image: img && img.url ? { url: img.url, width: img.width || null, height: img.height || null } : null,
    soldOut: !!(p.state && p.state.type === "SOLD_OUT"),
    currency: "USD",
    priceMin: null,
    priceMax: null,
    compareAt: null,
    colors: [],
    sizes: [],
  };

  if (p.type === "BUNDLE") {
    if (p.price && typeof p.price.value === "number") {
      out.priceMin = out.priceMax = p.price.value;
      out.currency = p.price.currency || "USD";
    }
    if (p.compareAtPrice && typeof p.compareAtPrice.value === "number") out.compareAt = p.compareAtPrice.value;
    out.bundle = true;
    return out;
  }

  const variants = Array.isArray(p.variants) ? p.variants : [];
  const colors = new Map();
  const sizes = new Map();
  let anyAvailable = false;
  for (const v of variants) {
    const price = v.unitPrice && typeof v.unitPrice.value === "number" ? v.unitPrice.value : null;
    if (price !== null) {
      out.priceMin = out.priceMin === null ? price : Math.min(out.priceMin, price);
      out.priceMax = out.priceMax === null ? price : Math.max(out.priceMax, price);
      out.currency = v.unitPrice.currency || out.currency;
    }
    if (v.compareAtPrice && typeof v.compareAtPrice.value === "number") {
      out.compareAt = Math.max(out.compareAt || 0, v.compareAtPrice.value);
    }
    const soldOut = isSoldOutVariant(v);
    if (!soldOut) anyAvailable = true;
    const a = v.attributes || {};
    if (a.color && a.color.name) {
      const c = colors.get(a.color.name) || { name: a.color.name, swatch: a.color.swatch || null, soldOut: true };
      if (!soldOut) c.soldOut = false;
      colors.set(a.color.name, c);
    }
    if (a.size && a.size.name) {
      const s = sizes.get(a.size.name) || { name: a.size.name, soldOut: true };
      if (!soldOut) s.soldOut = false;
      sizes.set(a.size.name, s);
    }
  }
  out.colors = [...colors.values()];
  out.sizes = [...sizes.values()];
  if (variants.length && !anyAvailable) out.soldOut = true;
  return out;
}

export async function onRequestGet(context) {
  const token = context.env && context.env.FOURTHWALL_STOREFRONT_TOKEN;
  if (!token) return json({ error: "not_configured" }, 503, "no-store");

  try {
    const results = [];
    for (let page = 0; page < MAX_PAGES; page++) {
      const url = API + "?storefront_token=" + encodeURIComponent(token) + "&page=" + page + "&size=50";
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (!res.ok) return json({ error: "upstream_error" }, 502, "no-store");
      const data = await res.json();
      if (Array.isArray(data.results)) results.push(...data.results);
      if (!data.paging || !data.paging.hasNextPage) break;
    }
    const products = results.map(trimProduct).filter(Boolean);
    return json({ shop: SHOP, count: products.length, products }, 200, "public, max-age=60, s-maxage=300, stale-while-revalidate=600");
  } catch (e) {
    return json({ error: "upstream_error" }, 502, "no-store");
  }
}
