import { useEffect, useState, useCallback } from "react";
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
  pluggy_investment_id: string | null;
}

export function useRealtimeInvestments(portfolioId: string | null) {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvestments = useCallback(async () => {
    if (!portfolioId) {
      setInvestments([]);
      setLoading(false);
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
        source: (inv as any).source || 'manual',
        pluggy_investment_id: (inv as any).pluggy_investment_id || null,
      })));
    } catch (err) {
      console.error('Error fetching investments:', err);
    } finally {
      setLoading(false);
    }
  }, [portfolioId]);

  useEffect(() => {
    fetchInvestments();

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`investments-${portfolioId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'investments',
          filter: portfolioId ? `portfolio_id=eq.${portfolioId}` : undefined,
        },
        (payload) => {
          console.log('Investment change:', payload.eventType, payload);
          
          if (payload.eventType === 'INSERT') {
            const newInv = payload.new as any;
            setInvestments(prev => [{
              id: newInv.id,
              asset_name: newInv.asset_name,
              asset_type: newInv.asset_type,
              ticker: newInv.ticker,
              quantity: Number(newInv.quantity) || 0,
              purchase_price: Number(newInv.purchase_price) || 0,
              current_price: Number(newInv.current_price) || 0,
              current_value: Number(newInv.current_value) || 0,
              total_invested: Number(newInv.total_invested) || 0,
              gain_percent: Number(newInv.gain_percent) || 0,
              maturity_date: newInv.maturity_date,
              portfolio_id: newInv.portfolio_id,
              source: newInv.source || 'manual',
              pluggy_investment_id: newInv.pluggy_investment_id || null,
            }, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            const updatedInv = payload.new as any;
            setInvestments(prev => prev.map(inv => 
              inv.id === updatedInv.id 
                ? {
                    id: updatedInv.id,
                    asset_name: updatedInv.asset_name,
                    asset_type: updatedInv.asset_type,
                    ticker: updatedInv.ticker,
                    quantity: Number(updatedInv.quantity) || 0,
                    purchase_price: Number(updatedInv.purchase_price) || 0,
                    current_price: Number(updatedInv.current_price) || 0,
                    current_value: Number(updatedInv.current_value) || 0,
                    total_invested: Number(updatedInv.total_invested) || 0,
                    gain_percent: Number(updatedInv.gain_percent) || 0,
                    maturity_date: updatedInv.maturity_date,
                    portfolio_id: updatedInv.portfolio_id,
                    source: updatedInv.source || 'manual',
                    pluggy_investment_id: updatedInv.pluggy_investment_id || null,
                  }
                : inv
            ));
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as any).id;
            setInvestments(prev => prev.filter(inv => inv.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [portfolioId, fetchInvestments]);

  return {
    investments,
    loading,
    refetch: fetchInvestments,
    pluggyInvestments: investments.filter(inv => inv.source === 'pluggy'),
    manualInvestments: investments.filter(inv => inv.source !== 'pluggy'),
  };
}
