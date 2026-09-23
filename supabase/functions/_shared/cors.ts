// Restricts browser access to Kadig's own origins (site, app and previews).
const EXACT = new Set([
  "https://kadig.com.br",
  "https://www.kadig.com.br",
  "https://appinvestt.lovable.app",
  "capacitor://localhost",
  "ionic://localhost",
  "http://localhost",
  "https://localhost",
  "http://localhost:8080",
]);

export function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (EXACT.has(origin)) return true;
  try {
    const host = new URL(origin).hostname;
    return host.endsWith(".lovable.app") || host.endsWith(".lovableproject.com");
  } catch {
    return false;
  }
}

type Handler = (req: Request) => Response | Promise<Response>;

export function serve(handler: Handler) {
  return Deno.serve(async (req) => {
    const origin = req.headers.get("origin");
    const allowed = isAllowedOrigin(origin);

    if (origin && !allowed) {
      return new Response(JSON.stringify({ error: "Origin not allowed" }), {
        status: 403,
        headers: { "Content-Type": "application/json", "Vary": "Origin" },
      });
    }

    const res = await handler(req);
    const headers = new Headers(res.headers);
    headers.set("Access-Control-Allow-Origin", allowed && origin ? origin : "https://kadig.com.br");
    headers.set("Vary", "Origin");
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
  });
}
