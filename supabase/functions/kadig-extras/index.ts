import { fetch as brapiFetch } from "../_shared/brapiCache.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import postgres from "npm:postgres@3.4.4";
import { z } from "npm:zod@3.23.8";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("check") }),
  z.object({ action: z.literal("dividends") }),
  z.object({ action: z.literal("sessions") }),
  z.object({ action: z.literal("revoke_session"), session_id: z.string().uuid() }),
]);

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const spNow = () => new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));

function sessionIdFromJwt(auth: string): string | null {
  try {
    const p = JSON.parse(atob(auth.replace("Bearer ", "").split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return p.session_id ?? null;
  } catch { return null; }
}

function device(ua: string | null) {
  const u = ua || "";
  const os = /iPhone|iPad/.test(u) ? "iPhone" : /Android/.test(u) ? "Android" : /Mac OS/.test(u) ? "Mac" : /Windows/.test(u) ? "Windows" : /Linux/.test(u) ? "Linux" : "Dispositivo";
  const app = /Kadig|Capacitor|wv\)/.test(u) ? "App Kadig" : /Edg\//.test(u) ? "Edge" : /Chrome\//.test(u) ? "Chrome" : /Safari\//.test(u) ? "Safari" : /Firefox\//.test(u) ? "Firefox" : "Navegador";
  return { os, app };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const auth = req.headers.get("Authorization");
  if (!auth) return json({ error: "Unauthorized" }, 401);
  const url = Deno.env.get("SUPABASE_URL")!;
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return json({ error: "Unauthorized" }, 401);
  const { data: ctl } = await admin.from("account_security_controls").select("status").eq("user_id", user.id).maybeSingle();
  if (ctl && ctl.status !== "active") return json({ error: "Account restricted" }, 403);

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
  const body = parsed.data;
  const token = Deno.env.get("BRAPI_TOKEN") ?? "";

  try {
    if (body.action === "check") {
      const triggered: string[] = [];
      // Price alerts
      const { data: alerts } = await admin.from("price_alerts").select("*").eq("user_id", user.id).eq("active", true);
      if (alerts?.length) {
        const prices: Record<string, number> = {};
        const stocks = [...new Set(alerts.filter((a) => a.asset_kind === "stock").map((a) => a.symbol))];
        const cryptos = [...new Set(alerts.filter((a) => a.asset_kind === "crypto").map((a) => a.symbol))];
        await Promise.all(stocks.map(async (s) => {
          const r = await brapiFetch(`https://brapi.dev/api/quote/${encodeURIComponent(s)}?token=${token}`);
          if (!r.ok) return;
          const d = await r.json();
          const p = Number(d?.results?.[0]?.regularMarketPrice);
          if (p > 0) prices[`stock:${s}`] = p;
        }));
        if (cryptos.length) {
          const r = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${cryptos.join(",")}&vs_currencies=brl`);
          if (r.ok) {
            const d = await r.json();
            for (const c of cryptos) if (Number(d?.[c]?.brl) > 0) prices[`crypto:${c}`] = Number(d[c].brl);
          }
        }
        for (const a of alerts) {
          const p = prices[`${a.asset_kind}:${a.symbol}`];
          if (!p) continue;
          const hit = a.direction === "above" ? p >= Number(a.target_price) : p <= Number(a.target_price);
          if (hit) {
            await admin.from("price_alerts").update({ active: false, triggered_at: new Date().toISOString(), last_price: p }).eq("id", a.id);
            await admin.from("notifications").insert({
              user_id: user.id, type: "info", category: "price_alert",
              title: `${a.label} ${a.direction === "above" ? "subiu acima" : "caiu abaixo"} de ${brl(Number(a.target_price))}`,
              message: `Cotação atual: ${brl(p)}. O alerta foi concluído e pode ser criado de novo quando quiser.`,
              data: { alert_id: a.id, symbol: a.symbol, price: p },
            });
            triggered.push(a.id);
          } else {
            await admin.from("price_alerts").update({ last_price: p }).eq("id", a.id);
          }
        }
      }
      // Goal contribution reminders
      const now = spNow();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const { data: goals } = await admin.from("goals").select("id,type,monthly_contribution,contribution_day,last_reminder_month")
        .eq("user_id", user.id).not("monthly_contribution", "is", null).not("contribution_day", "is", null);
      for (const g of goals ?? []) {
        if (Number(g.monthly_contribution) <= 0 || now.getDate() < Number(g.contribution_day) || g.last_reminder_month === month) continue;
        await admin.from("goals").update({ last_reminder_month: month }).eq("id", g.id);
        await admin.from("notifications").insert({
          user_id: user.id, type: "info", category: "goal",
          title: "Dia do aporte da sua meta",
          message: `Seu aporte planejado de ${brl(Number(g.monthly_contribution))} para a meta de ${g.type === "renda_passiva" ? "renda passiva" : "patrimônio"} é hoje.`,
          data: { goal_id: g.id },
        });
      }
      return json({ triggered });
    }

    if (body.action === "dividends") {
      const { data: inv } = await admin.from("investments").select("ticker,quantity,asset_name").eq("user_id", user.id).not("ticker", "is", null);
      const b3 = /^[A-Z]{4}\d{1,2}$/;
      const holdings = new Map<string, number>();
      for (const i of inv ?? []) {
        const t = String(i.ticker).toUpperCase().replace(/F$/, "");
        if (b3.test(t) && Number(i.quantity) > 0) holdings.set(t, (holdings.get(t) ?? 0) + Number(i.quantity));
      }
      const since = Date.now() - 365 * 86400000;
      const items: unknown[] = [];
      let failed = 0;
      await Promise.all([...holdings].map(async ([t, qty]) => {
        const r = await brapiFetch(`https://brapi.dev/api/quote/${t}?dividends=true&token=${token}`);
        if (!r.ok) { failed++; return; }
        const d = await r.json();
        for (const c of d?.results?.[0]?.dividendsData?.cashDividends ?? []) {
          const pay = c.paymentDate ? new Date(c.paymentDate).getTime() : NaN;
          if (!(pay >= since) || !(Number(c.rate) > 0)) continue;
          items.push({ ticker: t, label: c.label || "Provento", rate: Number(c.rate), quantity: qty, total: Number(c.rate) * qty, payment_date: c.paymentDate, upcoming: pay > Date.now() });
        }
      }));
      return json({ items, tickers: holdings.size, failed });
    }

    const dbUrl = Deno.env.get("SUPABASE_DB_URL");
    if (!dbUrl) return json({ error: "Serviço indisponível" }, 503);
    const sql = postgres(dbUrl, { max: 1, prepare: false });
    try {
      const current = sessionIdFromJwt(auth);
      if (body.action === "sessions") {
        const rows = await sql`select id, created_at, coalesce(refreshed_at, updated_at, created_at) as last_seen, user_agent from auth.sessions where user_id = ${user.id} order by last_seen desc limit 20`;
        return json({ sessions: rows.map((r) => ({ id: r.id, created_at: r.created_at, last_seen: r.last_seen, ...device(r.user_agent), current: r.id === current })) });
      }
      if (body.session_id === current) return json({ error: "Use Sair para encerrar esta sessão." }, 400);
      await sql`delete from auth.sessions where id = ${body.session_id} and user_id = ${user.id}`;
      return json({ ok: true });
    } finally { await sql.end(); }
  } catch (e) {
    console.error(e);
    return json({ error: "Falha ao processar" }, 500);
  }
});
