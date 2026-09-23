import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

function checkSecret(req: Request): boolean {
  const expected = Deno.env.get("KDG_BRIDGE_SECRET") ?? "";
  const auth = req.headers.get("authorization") ?? "";
  const got = req.headers.get("x-kdg-secret") ?? (auth.startsWith("Bearer ") ? auth.slice(7) : "");
  if (expected.length < 16 || got.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ got.charCodeAt(i);
  return diff === 0;
}

const PLANS = ["free", "premium"];
const STATUSES = ["active", "inactive", "canceled", "past_due", "trialing"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!checkSecret(req)) return json({ error: "Unauthorized" }, 401);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
  const { user_id, plan, status, price_monthly } = body ?? {};

  if (typeof user_id !== "string" || !UUID.test(user_id)) return json({ error: "user_id inválido" }, 400);
  if (plan !== undefined && !PLANS.includes(plan)) return json({ error: `plan deve ser: ${PLANS.join(", ")}` }, 400);
  if (status !== undefined && !STATUSES.includes(status)) return json({ error: `status deve ser: ${STATUSES.join(", ")}` }, 400);
  if (price_monthly !== undefined && (typeof price_monthly !== "number" || price_monthly < 0)) return json({ error: "price_monthly inválido" }, 400);
  if (plan === undefined && status === undefined && price_monthly === undefined) return json({ error: "Nada para alterar" }, 400);

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const changes: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (plan !== undefined) changes.plan = plan;
  if (status !== undefined) changes.status = status;
  if (price_monthly !== undefined) changes.price_monthly = price_monthly;

  const { data: existing } = await db.from("subscriptions").select("id").eq("user_id", user_id).maybeSingle();
  const res = existing
    ? await db.from("subscriptions").update(changes).eq("user_id", user_id).select().single()
    : await db.from("subscriptions").insert({ user_id, plan: plan ?? "free", status: status ?? "active", price_monthly: price_monthly ?? 0 }).select().single();

  if (res.error) {
    console.error("kdg-update-plan failed:", res.error.message);
    return json({ error: "Update failed" }, 500);
  }
  return json({ ok: true, subscription: res.data });
});
