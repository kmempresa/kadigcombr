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
  const [ind, setInd] = useState<EngineIndicators>({ cdi12m: 0, ipca12m: 0, selic: 0 });
  const [analyzedAt, setAnalyzedAt] = useState<Date | null>(null);
  const [dataWarning, setDataWarning] = useState<string | null>(null);
  const chId = useRef(`intel-${++channelSeq}`);
  const [refreshing, setRefreshing] = useState(false);

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
    const dataErrors = [inv.error, ga.error, gl.error, cn.error].filter(Boolean);
    if (dataErrors.length) {
      setDataWarning("Não foi possível atualizar todos os dados do patrimônio.");
    } else {
      setDataWarning(null);
    }
    setInvestments((inv.data || []).map((i) => ({
      id: i.id, asset_name: i.asset_name, asset_type: i.asset_type, ticker: i.ticker,
      current_value: Number(i.current_value) || 0, total_invested: Number(i.total_invested) || 0, maturity_date: i.maturity_date,
    })));
    setGlobals((ga.data || []).map((a) => ({ id: a.id, name: a.name, category: a.category, value_brl: Number(a.value_brl) || 0 })));
    setGoals((gl.data || []).map((g) => ({ id: g.id, type: g.type, target_value: Number(g.target_value) || 0, target_date: g.target_date })));
    setConnections((cn as any).count || 0);
    const e = econ.data as any;
    setInd({
      cdi12m: Number(e?.accumulated12m?.cdi) || 0,
      ipca12m: Number(e?.accumulated12m?.ipca) || 0,
      selic: Number(e?.current?.selic) || 0,
      financing: fin || undefined,
    });
    setAnalyzedAt(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const ch = supabase.channel(chId.current)
      .on("postgres_changes", { event: "*", schema: "public", table: "investments" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "global_assets" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "goals" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "pluggy_connections" }, () => load())
      .subscribe();
    const refresh = () => { if (document.visibilityState === "visible") load(); };
    document.addEventListener("visibilitychange", refresh);
    const interval = window.setInterval(load, 60 * 1000);
    return () => {
      supabase.removeChannel(ch);
      document.removeEventListener("visibilitychange", refresh);
      window.clearInterval(interval);
    };
  }, [load]);

  const result = useMemo(() => runEngine(investments, globals, goals, ind), [investments, globals, goals, ind]);

  const assetShare = useCallback(
    (id: string) => {
      const a = investments.find((i) => i.id === id);
      return a && result.netWorth > 0 ? (a.current_value / result.netWorth) * 100 : 0;
    },
    [investments, result.netWorth],
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await supabase.functions.invoke("update-prices", { body: {} }).catch(() => null);
      await load();
    } finally { setRefreshing(false); }
  }, [load]);

  return { refreshing, refresh, analyzedAt, loading, dataWarning, userId, investments, globals, goals, connections, ind, result, assetShare, reload: load };
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
