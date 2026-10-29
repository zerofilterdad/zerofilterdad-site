// Serves the Search Console file at the exact .html path.
// Pages otherwise 308s /file.html to /file, which would fail verification.
const BODY = "google-site-verification: google50007e5d0d65f3c8.html\n";

export function onRequest() {
  return new Response(BODY, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
