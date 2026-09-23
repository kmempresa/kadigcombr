import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { createNotification } from "@/lib/notifications";
import {
  runEngine, type EngineInvestment, type EngineGlobalAsset, type EngineGoal, type EngineIndicators,
} from "@/lib/opportunityEngine";

let channelSeq = 0;

export function useIntelligence() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [investments, setInvestments] = useState<EngineInvestment[]>([]);
  const [globals, setGlobals] = useState<EngineGlobalAsset[]>([]);
  const [goals, setGoals] = useState<EngineGoal[]>([]);
  const [connections, setConnections] = useState(0);
  const [ind, setInd] = useState<EngineIndicators>({ cdi12m: 14.4, ipca12m: 4.1, selic: 15 });
  const [analyzedAt, setAnalyzedAt] = useState<Date | null>(null);
  const chId = useRef(`intel-${++channelSeq}`);

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLoading(false); return; }
    const uid = session.user.id;
    setUserId(uid);
    const finP = fetch("https://api.bcb.gov.br/dados/serie/bcdata.sgs.20749/dados/ultimos/1?formato=json")
      .then((r) => r.json()).then((d) => Number(d?.[0]?.valor) || 0).catch(() => 0);
    const [inv, ga, gl, cn, econ, fin] = await Promise.all([
      supabase.from("investments").select("*").eq("user_id", uid),
      supabase.from("global_assets").select("*").eq("user_id", uid),
      supabase.from("goals").select("*").eq("user_id", uid),
      supabase.from("pluggy_connections" as any).select("id", { count: "exact", head: true }).eq("user_id", uid),
      supabase.functions.invoke("market-data", { body: { type: "economic-indicators" } }),
      finP,
    ]);
    setInvestments((inv.data || []).map((i) => ({
      id: i.id, asset_name: i.asset_name, asset_type: i.asset_type, ticker: i.ticker,
      current_value: Number(i.current_value) || 0, total_invested: Number(i.total_invested) || 0, maturity_date: i.maturity_date,
    })));
    setGlobals((ga.data || []).map((a) => ({ id: a.id, name: a.name, category: a.category, value_brl: Number(a.value_brl) || 0 })));
    setGoals((gl.data || []).map((g) => ({ id: g.id, type: g.type, target_value: Number(g.target_value) || 0, target_date: g.target_date })));
    setConnections((cn as any).count || 0);
    const e = econ.data as any;
    setInd((p) => ({
      cdi12m: Number(e?.accumulated12m?.cdi) || p.cdi12m,
      ipca12m: Number(e?.accumulated12m?.ipca) || p.ipca12m,
      selic: Number(e?.current?.selic) || p.selic,
      financing: fin || p.financing,
    }));
    setAnalyzedAt(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const ch = supabase.channel(chId.current)
      .on("postgres_changes", { event: "*", schema: "public", table: "investments" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "global_assets" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  const result = useMemo(() => runEngine(investments, globals, goals, ind), [investments, globals, goals, ind]);

  const assetShare = useCallback(
    (id: string) => {
      const a = investments.find((i) => i.id === id);
      return a && result.netWorth > 0 ? (a.current_value / result.netWorth) * 100 : 0;
    },
    [investments, result.netWorth],
  );

  return { analyzedAt, loading, userId, investments, globals, goals, connections, ind, result, assetShare, reload: load };
}

/** Push a notification when concentration rises significantly (once per day per level). */
export function useIntelligenceAlerts(userId: string | null, topSharePct: number) {
  useEffect(() => {
    if (!userId || topSharePct <= 0) return;
    const key = `kadig-intel-conc-${userId}`;
    const prev = Number(localStorage.getItem(key) || 0);
    localStorage.setItem(key, String(topSharePct));
    if (prev > 0 && topSharePct - prev >= 5 && topSharePct > 25) {
      createNotification({
        title: "Kadig encontrou algo",
        message: `Sua concentração aumentou de ${prev.toFixed(0)}% para ${topSharePct.toFixed(0)}% em um único ativo.`,
        type: "warning",
        category: "intelligence",
      });
    }
  }, [userId, topSharePct]);
}
