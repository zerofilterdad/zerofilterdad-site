// Cloudflare Pages Function: POST /api/testimonial
// Emails a visitor's testimonial to Brook for review. Nothing is published automatically.
//
// Sends through Resend (https://resend.com), the simplest option: one HTTPS call, no binding needed.
// Environment variables (Pages > Settings > Variables and Secrets):
//   RESEND_API_KEY      (secret, required)  Resend API key
//   TESTIMONIAL_FROM    (required)          verified sender, e.g. "ZeroFilterDad Site <testimonials@zerofilterdad.com>"
//   TESTIMONIAL_TO      (optional)          defaults to hello@zerofilterdad.com
// If RESEND_API_KEY or TESTIMONIAL_FROM is missing, this returns 503 "not_configured" and the
// page falls back to a prefilled mailto: link. No keys are stored in this repo.

const DEFAULT_TO = "hello@zerofilterdad.com";
const MAX_BODY = 6000;      // bytes of request body
const MAX_MESSAGE = 1000;   // characters
const MIN_MESSAGE = 10;
const MAX_NAME = 80;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 3;

// Loose, best-effort rate limit (per isolate, per IP). For a hard limit add a
// Cloudflare WAF rate-limiting rule on /api/testimonial.
const hits = new Map();
function limited(ip) {
  const now = Date.now();
  for (const [k, v] of hits) if (now - v.t > WINDOW_MS) hits.delete(k);
  const rec = hits.get(ip);
  if (!rec) { hits.set(ip, { t: now, n: 1 }); return false; }
  rec.n += 1;
  return rec.n > MAX_PER_WINDOW;
}

const reply = (obj, status) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });

const clean = (s, max) =>
  String(s == null ? "" : s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim().slice(0, max);

export async function onRequestPost(context) {
  const { request, env } = context;

  // Same-origin only.
  const origin = request.headers.get("Origin");
  if (origin) {
    try { if (new URL(origin).host !== new URL(request.url).host) return reply({ error: "forbidden" }, 403); }
    catch (e) { return reply({ error: "forbidden" }, 403); }
  }

  const len = Number(request.headers.get("Content-Length") || 0);
  if (len > MAX_BODY) return reply({ error: "too_large" }, 413);

  let data;
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY) return reply({ error: "too_large" }, 413);
    data = JSON.parse(raw);
  } catch (e) { return reply({ error: "bad_request" }, 400); }
  if (!data || typeof data !== "object") return reply({ error: "bad_request" }, 400);

  // Honeypot: real visitors never fill this. Drop silently so bots think it worked.
  if (clean(data.website, 200)) return reply({ ok: true }, 200);

  const message = clean(data.message, MAX_MESSAGE);
  const name = clean(data.name, MAX_NAME);
  if (message.length < MIN_MESSAGE) return reply({ error: "message_too_short" }, 400);

  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  if (limited(ip)) return reply({ error: "rate_limited" }, 429);

  if (!env.RESEND_API_KEY || !env.TESTIMONIAL_FROM) return reply({ error: "not_configured" }, 503);

  const text =
    "New testimonial submitted on zerofilterdad.com (not published; review before using)\n\n" +
    "From: " + (name || "(no name given)") + "\n\n" +
    message + "\n";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer " + env.RESEND_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: env.TESTIMONIAL_FROM,
        to: [env.TESTIMONIAL_TO || DEFAULT_TO],
        subject: "New testimonial from zerofilterdad.com",
        text,
      }),
    });
    if (!res.ok) return reply({ error: "send_failed" }, 502);
    return reply({ ok: true }, 200);
  } catch (e) {
    return reply({ error: "send_failed" }, 502);
  }
}

export async function onRequest() {
  return reply({ error: "method_not_allowed" }, 405);
}
