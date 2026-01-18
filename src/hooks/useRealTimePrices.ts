import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PriceData {
  stocks: { [ticker: string]: { price: number; change: number } };
  crypto: { [name: string]: { price: number; change: number } };
  currencies: { [name: string]: { price: number; change: number } };
  economic: {
    current: { cdi: number; ipca: number; selic: number };
    accumulated12m: { cdi: number; ipca: number };
  } | null;
  lastUpdate: Date | null;
}

interface UseRealTimePricesOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
  onUpdate?: () => void;
}

export const useRealTimePrices = (options: UseRealTimePricesOptions = {}) => {
  const { 
    autoRefresh = true, 
    refreshInterval = 5 * 60 * 1000, // 5 minutes
    onUpdate 
  } = options;

  const [priceData, setPriceData] = useState<PriceData>({
    stocks: {},
    crypto: {},
    currencies: {},
    economic: null,
    lastUpdate: null,
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onUpdateRef = useRef(onUpdate);
  const hasInitializedRef = useRef(false);

  // Keep onUpdate ref current without triggering re-renders
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  // Fetch all prices and update investments
  const refreshPrices = useCallback(async (showToast = true) => {
    try {
      setIsUpdating(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return false;

      console.log("[useRealTimePrices] Refreshing all prices...");

      // Call the edge function to update all prices
      const { data, error } = await supabase.functions.invoke('update-prices', {
        body: { userId: session.user.id }
      });

      if (error) {
        console.error("[useRealTimePrices] Error:", error);
        if (showToast) toast.error("Erro ao atualizar cotações");
        return false;
      }

      console.log("[useRealTimePrices] Update result:", data);
      
      setLastUpdateTime(new Date());
      
      if (showToast && data?.updated > 0) {
        toast.success(`${data.updated} cotações atualizadas!`);
      }
      
      // Call onUpdate via ref to avoid dependency issues
      onUpdateRef.current?.();
      return true;
    } catch (error) {
      console.error("[useRealTimePrices] Error:", error);
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, []); // No dependencies - uses refs

  // Fetch individual price data (for display purposes)
  const fetchMarketData = useCallback(async () => {
    try {
      const [cryptoRes, currencyRes, economicRes] = await Promise.all([
        supabase.functions.invoke('market-data', { body: { type: 'crypto-prices' } }),
        supabase.functions.invoke('market-data', { body: { type: 'currency-prices' } }),
        supabase.functions.invoke('market-data', { body: { type: 'economic-indicators' } }),
      ]);

      setPriceData(prev => ({
        ...prev,
        crypto: cryptoRes.data?.prices || {},
        currencies: currencyRes.data?.prices || {},
        economic: economicRes.data || null,
        lastUpdate: new Date(),
      }));
    } catch (error) {
      console.error("[useRealTimePrices] Error fetching market data:", error);
    }
  }, []);

  // Fetch stock price for a specific ticker
  const getStockPrice = useCallback(async (ticker: string): Promise<number | null> => {
    try {
      const { data } = await supabase.functions.invoke('market-data', {
        body: { type: 'quote', symbol: ticker }
      });
      return data?.regularMarketPrice || null;
    } catch {
      return null;
    }
  }, []);

  // Get crypto price from cached data
  const getCryptoPrice = useCallback((name: string): number | null => {
    return priceData.crypto[name.toUpperCase()]?.price || null;
  }, [priceData.crypto]);

  // Get currency price from cached data
  const getCurrencyPrice = useCallback((name: string): number | null => {
    return priceData.currencies[name]?.price || null;
  }, [priceData.currencies]);

  // Get economic indicators
  const getEconomicIndicators = useCallback(() => {
    return priceData.economic;
  }, [priceData.economic]);

  // Setup auto-refresh - runs once on mount
  useEffect(() => {
    if (!autoRefresh) return;
    
    // Prevent multiple initializations
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;
    
    console.log("[useRealTimePrices] Initializing auto-refresh...");
    
    // Initial fetch (only market data, not full price refresh)
    fetchMarketData();
    
    // Setup interval for periodic refresh
    const intervalId = setInterval(() => {
      console.log("[useRealTimePrices] Auto-refresh triggered");
      refreshPrices(false).then((success) => {
        if (success) {
          fetchMarketData();
        }
      });
    }, refreshInterval);
    
    intervalRef.current = intervalId;

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [autoRefresh, refreshInterval, fetchMarketData, refreshPrices]);

  return {
    priceData,
    isUpdating,
    lastUpdateTime,
    refreshPrices,
    fetchMarketData,
    getStockPrice,
    getCryptoPrice,
    getCurrencyPrice,
    getEconomicIndicators,
  };
};

export default useRealTimePrices;
