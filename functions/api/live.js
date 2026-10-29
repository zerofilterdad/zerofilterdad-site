// Cloudflare Pages Function: GET /api/live
// Checks Twitch (decapi uptime text) and TikTok (@zerofilterdad) server-side.
// TikTok's live page embeds SIGI_STATE / __UNIVERSAL_DATA. A room status of 2 means live.
// Returns { live, twitch, tiktok, checked }. Never throws a live "yes" when a check fails.

const TWITCH_UPTIME = "https://decapi.me/twitch/uptime/zerofilterdad";
const TIKTOK_LIVE = "https://www.tiktok.com/@zerofilterdad/live";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

const json = (body) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=30",
      "X-Content-Type-Options": "nosniff",
    },
  });

async function twitchIsLive() {
  const res = await fetch(TWITCH_UPTIME, {
    headers: { Accept: "text/plain", "User-Agent": UA },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return false;
  const text = (await res.text()).trim().toLowerCase();
  return text.length > 0 && text.indexOf("is offline") === -1;
}

function scriptJson(html, id) {
  const re = new RegExp('<script id="' + id + '"[^>]*>([\\s\\S]*?)</script>');
  const m = html.match(re);
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch (e) {
    return null;
  }
}

function roomIsLive(node, depth) {
  if (!node || typeof node !== "object" || depth > 14) return false;
  if (node.liveRoom && typeof node.liveRoom.status === "number" && node.liveRoom.status === 2) return true;
  if (node.roomInfo && typeof node.roomInfo === "object" && node.roomInfo.status === 2) return true;
  const keys = Object.keys(node);
  for (let i = 0; i < keys.length; i++) {
    const v = node[keys[i]];
    if (v && typeof v === "object" && roomIsLive(v, depth + 1)) return true;
  }
  return false;
}

function tiktokIsLiveFromHtml(html) {
  const sigi = scriptJson(html, "SIGI_STATE");
  const uni = scriptJson(html, "__UNIVERSAL_DATA_FOR_REHYDRATION__");
  return roomIsLive(sigi, 0) || roomIsLive(uni, 0);
}

async function tiktokIsLive() {
  const res = await fetch(TIKTOK_LIVE, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent": UA,
      "Accept-Language": "en-US,en;q=0.9",
    },
    signal: AbortSignal.timeout(8000),
    redirect: "follow",
  });
  if (!res.ok) return false;
  const html = await res.text();
  return tiktokIsLiveFromHtml(html);
}

export async function onRequestGet() {
  const checked = new Date().toISOString();
  let twitch = false;
  let tiktok = false;
  try {
    twitch = await twitchIsLive();
  } catch (e) {
    twitch = false;
  }
  try {
    tiktok = await tiktokIsLive();
  } catch (e) {
    tiktok = false;
  }
  return json({ live: twitch || tiktok, twitch: twitch, tiktok: tiktok, checked: checked });
}
