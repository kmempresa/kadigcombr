// Shared cache for BRAPI calls. Every user and every function reads from the
// same stored response, so BRAPI is hit at most once per URL per TTL window.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const QUOTE_TTL_MS = 60 * 1000; // live quotes: 1 min (real time)
const HEAVY_TTL_MS = 6 * 60 * 60 * 1000; // fundamentals/history: 6h

const pending = new Map<string, Promise<{ body: string; status: number }>>();
let client: ReturnType<typeof createClient> | null = null;
const db = () => {
  if (!client) {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) return null;
    client = createClient(url, key);
  }
  return client;
};

const ttlFor = (u: string) =>
  /fundamental=true|modules=|range=|dividends=true/.test(u) ? HEAVY_TTL_MS : QUOTE_TTL_MS;

const toResponse = (r: { body: string; status: number }) =>
  new Response(r.body, { status: r.status, headers: { "Content-Type": "application/json" } });

export async function fetch(input: string | URL | Request, init?: RequestInit): Promise<Response> {
  const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
  const method = (init?.method || (input instanceof Request ? input.method : "GET")).toUpperCase();
  if (!url.includes("brapi.dev") || method !== "GET") return globalThis.fetch(input, init);

  const key = url.replace(/([?&])token=[^&]*&?/, "$1").replace(/[?&]$/, "");
  const ttl = ttlFor(url);
  const supa = db();

  if (supa) {
    const { data } = await supa.from("api_cache").select("body,status,fetched_at").eq("key", key).maybeSingle();
    if (data && Date.now() - new Date(data.fetched_at as string).getTime() < ttl) {
      return toResponse({ body: data.body as string, status: data.status as number });
    }
  }

  let job = pending.get(key);
  if (!job) {
    job = (async () => {
      const res = await globalThis.fetch(url, init);
      const body = await res.text();
      if (res.ok && supa) {
        await supa.from("api_cache").upsert({ key, body, status: res.status, fetched_at: new Date().toISOString() });
      }
      return { body, status: res.status };
    })().finally(() => pending.delete(key));
    pending.set(key, job);
  }
  return toResponse(await job);
}
