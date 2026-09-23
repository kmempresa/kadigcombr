import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

export function checkSecret(req: Request): boolean {
  const expected = Deno.env.get("KDG_BRIDGE_SECRET") ?? "";
  const auth = req.headers.get("authorization") ?? "";
  const got = req.headers.get("x-kdg-secret") ?? (auth.startsWith("Bearer ") ? auth.slice(7) : "");
  if (expected.length < 16 || got.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ got.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method !== "GET" && req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!checkSecret(req)) return json({ error: "Unauthorized" }, 401);

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  async function all(table: string, columns: string) {
    const rows: any[] = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await db.from(table).select(columns).range(from, from + 999);
      if (error) throw new Error(`${table}: ${error.message}`);
      rows.push(...(data ?? []));
      if (!data || data.length < 1000) break;
    }
    return rows;
  }

  try {
    const [profiles, subscriptions, portfolios] = await Promise.all([
      all("profiles", "user_id, full_name, email, phone, investor_profile, investment_goal, created_at, updated_at"),
      all("subscriptions", "user_id, plan, status, price_monthly, current_period_start, current_period_end, created_at, updated_at"),
      all("portfolios", "id, user_id, name, total_value, total_gain, created_at, updated_at"),
    ]);

    const patrimonyByUser: Record<string, number> = {};
    for (const p of portfolios) patrimonyByUser[p.user_id] = (patrimonyByUser[p.user_id] ?? 0) + Number(p.total_value ?? 0);

    const active = subscriptions.filter((s) => s.status === "active");
    const mrr = active.reduce((sum, s) => sum + Number(s.price_monthly ?? 0), 0);

    return json({
      generated_at: new Date().toISOString(),
      totals: {
        users: profiles.length,
        active_subscriptions: active.length,
        mrr,
        total_patrimony: Object.values(patrimonyByUser).reduce((a, b) => a + b, 0),
      },
      profiles: profiles.map((p) => ({ ...p, total_patrimony: patrimonyByUser[p.user_id] ?? 0 })),
      subscriptions,
      portfolios,
    });
  } catch (e) {
    console.error("kdg-export failed:", (e as Error).message);
    return json({ error: "Export failed" }, 500);
  }
});
