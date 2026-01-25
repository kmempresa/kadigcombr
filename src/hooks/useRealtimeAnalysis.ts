import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Investment {
  id: string;
  asset_name: string;
  asset_type: string;
  ticker: string | null;
  quantity: number;
  purchase_price: number;
  current_price: number;
  current_value: number;
  total_invested: number;
  gain_percent: number;
  maturity_date: string | null;
  portfolio_id: string;
  source: string;
}

interface GlobalAsset {
  id: string;
  name: string;
  category: string;
  value_brl: number;
  currency: string;
}

interface EconomicIndicators {
  current: { cdi: number; ipca: number; selic: number };
  accumulated12m: { cdi: number; ipca: number };
}

interface UseRealtimeAnalysisOptions {
  portfolioId: string | null;
  enabled?: boolean;
}

export function useRealtimeAnalysis({ portfolioId, enabled = true }: UseRealtimeAnalysisOptions) {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [globalAssets, setGlobalAssets] = useState<GlobalAsset[]>([]);
  const [economicIndicators, setEconomicIndicators] = useState<EconomicIndicators | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchInvestments = useCallback(async () => {
    if (!portfolioId) {
      setInvestments([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('investments')
        .select('*')
        .eq('portfolio_id', portfolioId)
        .order('current_value', { ascending: false });

      if (error) throw error;
      
      setInvestments((data || []).map(inv => ({
        id: inv.id,
        asset_name: inv.asset_name,
        asset_type: inv.asset_type,
        ticker: inv.ticker,
        quantity: Number(inv.quantity) || 0,
        purchase_price: Number(inv.purchase_price) || 0,
        current_price: Number(inv.current_price) || 0,
        current_value: Number(inv.current_value) || 0,
        total_invested: Number(inv.total_invested) || 0,
        gain_percent: Number(inv.gain_percent) || 0,
        maturity_date: inv.maturity_date,
        portfolio_id: inv.portfolio_id,
        source: inv.source || 'manual',
      })));
      
      setLastUpdate(new Date());
    } catch (err) {
      console.error('[useRealtimeAnalysis] Error fetching investments:', err);
    }
  }, [portfolioId]);

  const fetchGlobalAssets = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('global_assets')
        .select('*')
        .eq('user_id', session.user.id)
        .order('value_brl', { ascending: false });

      if (error) throw error;
      
      setGlobalAssets((data || []).map(asset => ({
        id: asset.id,
        name: asset.name,
        category: asset.category,
        value_brl: Number(asset.value_brl) || 0,
        currency: asset.currency,
      })));
    } catch (err) {
      console.error('[useRealtimeAnalysis] Error fetching global assets:', err);
    }
  }, []);

  const fetchEconomicIndicators = useCallback(async () => {
    try {
      const { data } = await supabase.functions.invoke('market-data', {
        body: { type: 'economic-indicators' }
      });
      
      if (data) {
        setEconomicIndicators(data);
      }
    } catch (err) {
      console.error('[useRealtimeAnalysis] Error fetching economic indicators:', err);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setIsUpdating(true);
    try {
      await Promise.all([
        fetchInvestments(),
        fetchGlobalAssets(),
        fetchEconomicIndicators(),
      ]);
      setLastUpdate(new Date());
    } finally {
      setIsUpdating(false);
    }
  }, [fetchInvestments, fetchGlobalAssets, fetchEconomicIndicators]);

  // Initial fetch
  useEffect(() => {
    if (!enabled) return;
    
    const init = async () => {
      setLoading(true);
      await refreshAll();
      setLoading(false);
    };
    
    init();
  }, [enabled, portfolioId, refreshAll]);

  // Realtime subscriptions
  useEffect(() => {
    if (!enabled || !portfolioId) return;

    const investmentsChannel = supabase
      .channel(`analysis-investments-${portfolioId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'investments',
          filter: `portfolio_id=eq.${portfolioId}`,
        },
        (payload) => {
          console.log('[useRealtimeAnalysis] Investment change:', payload.eventType);
          fetchInvestments();
        }
      )
      .subscribe();

    const globalChannel = supabase
      .channel('analysis-global-assets')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'global_assets',
        },
        () => {
          console.log('[useRealtimeAnalysis] Global asset change');
          fetchGlobalAssets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(investmentsChannel);
      supabase.removeChannel(globalChannel);
    };
  }, [enabled, portfolioId, fetchInvestments, fetchGlobalAssets]);

  // Auto-refresh economic indicators every 5 minutes
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      fetchEconomicIndicators();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [enabled, fetchEconomicIndicators]);

  // Calculated values
  const totals = useMemo(() => {
    const totalValue = investments.reduce((sum, inv) => sum + inv.current_value, 0);
    const totalInvested = investments.reduce((sum, inv) => sum + inv.total_invested, 0);
    const totalGain = totalValue - totalInvested;
    const totalGlobal = globalAssets.reduce((sum, a) => sum + a.value_brl, 0);
    const gainPercent = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

    return {
      totalValue,
      totalInvested,
      totalGain,
      totalGlobal,
      totalPatrimonio: totalValue + totalGlobal,
      gainPercent,
    };
  }, [investments, globalAssets]);

  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }, []);

  const formatLastUpdate = useCallback(() => {
    if (!lastUpdate) return "Nunca";
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastUpdate.getTime()) / 1000);
    if (diff < 60) return "Agora";
    if (diff < 3600) return `${Math.floor(diff / 60)} min atrás`;
    return `${Math.floor(diff / 3600)}h atrás`;
  }, [lastUpdate]);

  return {
    investments,
    globalAssets,
    economicIndicators,
    loading,
    isUpdating,
    lastUpdate,
    totals,
    refreshAll,
    formatCurrency,
    formatLastUpdate,
  };
}

export default useRealtimeAnalysis;
