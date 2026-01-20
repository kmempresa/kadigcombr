import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePortfolio } from "@/contexts/PortfolioContext";

interface SyncResult {
  created: number;
  updated: number;
  deleted: number;
}

export function usePluggySync() {
  const [syncing, setSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const { refreshPortfolios } = usePortfolio();

  // Sync all connections
  const syncAllConnections = useCallback(async (showToast = true) => {
    try {
      setSyncing(true);
      
      const { data, error } = await supabase.functions.invoke('sync-pluggy-investments', {
        body: { action: 'sync-all' }
      });

      if (error) throw error;

      setLastSyncAt(new Date());
      
      if (showToast && data.results) {
        const { created, updated, deleted } = data.results as SyncResult;
        if (created > 0 || updated > 0 || deleted > 0) {
          toast.success(`Sincronizado: ${created} novos, ${updated} atualizados`);
        } else {
          toast.success('Investimentos já estão sincronizados');
        }
      }

      // Refresh portfolios to update UI
      await refreshPortfolios();
      
      return data;
    } catch (err: any) {
      console.error('Error syncing all connections:', err);
      if (showToast) {
        toast.error('Erro ao sincronizar investimentos');
      }
      throw err;
    } finally {
      setSyncing(false);
    }
  }, [refreshPortfolios]);

  // Sync a specific connection
  const syncConnection = useCallback(async (connectionId: string, portfolioId: string) => {
    try {
      setSyncing(true);
      
      const { data, error } = await supabase.functions.invoke('sync-pluggy-investments', {
        body: { 
          action: 'sync-connection',
          connectionId,
          portfolioId
        }
      });

      if (error) throw error;

      setLastSyncAt(new Date());
      
      if (data.results) {
        const { created, updated, deleted } = data.results as SyncResult;
        toast.success(`Sincronizado: ${created} novos, ${updated} atualizados, ${deleted} removidos`);
      }

      // Refresh portfolios
      await refreshPortfolios();
      
      return data;
    } catch (err: any) {
      console.error('Error syncing connection:', err);
      toast.error('Erro ao sincronizar conexão');
      throw err;
    } finally {
      setSyncing(false);
    }
  }, [refreshPortfolios]);

  return {
    syncing,
    lastSyncAt,
    syncAllConnections,
    syncConnection,
  };
}
