import { useState, useEffect, useMemo } from "react";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { X, HelpCircle, Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/hooks/useTheme";

interface Investment {
  id: string;
  asset_name: string;
  asset_type: string;
  ticker?: string | null;
  current_value: number;
  total_invested: number;
  gain_percent: number;
}

interface SensibilidadeAtivosDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investments: Investment[];
  totalPatrimonio: number;
  totalInvested: number;
  totalGanho: number;
  economicIndicators: any;
}

interface AssetSensitivity {
  id: string;
  name: string;
  type: string;
  ticker?: string | null;
  value: number;
  invested: number;
  gain: number;
  gainPercent: number;
  weight: number;
  contribution: number;
  volatility: number;
  impact: 'positive' | 'negative' | 'neutral';
}

export default function SensibilidadeAtivosDrawer({
  open,
  onOpenChange,
  investments,
  totalPatrimonio,
  totalInvested,
  totalGanho,
  economicIndicators
}: SensibilidadeAtivosDrawerProps) {
  const { theme } = useTheme();
  const themeClass = theme === "light" ? "light-theme" : "";
  const [loading, setLoading] = useState(false);
  const [volatilityData, setVolatilityData] = useState<Map<string, number>>(new Map());

  // Fetch volatility data
  useEffect(() => {
    const fetchVolatilityData = async () => {
      if (!open || investments.length === 0) return;
      
      setLoading(true);
      try {
        const volatilityMap = new Map<string, number>();

        // Get stock/FII tickers
        const stockTickers = investments
          .filter(inv => ['Ações', 'FIIs', 'BDRs', 'Ações, Stocks e ETF', 'FIIs e REITs', 'Ação', 'Conta Corrente'].includes(inv.asset_type) && inv.ticker)
          .map(inv => inv.ticker as string);

        if (stockTickers.length > 0) {
          const { data: stockAnalysis } = await supabase.functions.invoke('market-analysis', {
            body: { assets: stockTickers, assetType: 'stocks' }
          });
          
          stockAnalysis?.analyses?.forEach((a: any) => {
            volatilityMap.set(a.ticker, a.volatility || 15);
          });
        }

        // Get crypto analysis
        const cryptoNames = investments
          .filter(inv => inv.asset_type === 'Criptoativos')
          .map(inv => inv.asset_name);

        if (cryptoNames.length > 0) {
          const { data: cryptoAnalysis } = await supabase.functions.invoke('market-analysis', {
            body: { assets: cryptoNames, assetType: 'crypto' }
          });
          
          cryptoAnalysis?.analyses?.forEach((a: any) => {
            volatilityMap.set(a.ticker, a.volatility || 50);
          });
        }

        setVolatilityData(volatilityMap);
      } catch (error) {
        console.error("Error fetching volatility data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVolatilityData();
  }, [open, investments]);

  // Calculate sensitivities
  const sensitivities: AssetSensitivity[] = useMemo(() => {
    if (investments.length === 0 || totalPatrimonio === 0) return [];

    const totalPortfolioGain = totalPatrimonio - totalInvested;

    return investments.map(inv => {
      const weight = (inv.current_value / totalPatrimonio) * 100;
      const assetGain = inv.current_value - inv.total_invested;
      
      // Contribution = how much this asset contributed to the total gain (in percentage points)
      const contribution = totalPortfolioGain !== 0 
        ? (assetGain / totalInvested) * 100 
        : 0;
      
      // Get volatility from API or estimate
      const key = inv.ticker || inv.asset_name;
      let volatility = volatilityData.get(key) || 5;
      
      // Estimate volatility based on asset type if not available
      if (!volatilityData.has(key)) {
        if (inv.asset_type.includes('Renda Fixa') || inv.asset_type === 'Tesouro Direto') {
          volatility = 1;
        } else if (inv.asset_type === 'Criptoativos') {
          volatility = 50;
        } else if (inv.asset_type === 'Ações' || inv.asset_type.includes('Stocks') || inv.asset_type === 'Ação') {
          volatility = 25;
        } else if (inv.asset_type === 'FIIs' || inv.asset_type.includes('REITs')) {
          volatility = 15;
        }
      }

      const impact: 'positive' | 'negative' | 'neutral' = 
        contribution > 0.5 ? 'positive' : 
        contribution < -0.5 ? 'negative' : 'neutral';

      return {
        id: inv.id,
        name: inv.asset_name,
        type: inv.asset_type,
        ticker: inv.ticker,
        value: inv.current_value,
        invested: inv.total_invested,
        gain: assetGain,
        gainPercent: inv.gain_percent,
        weight,
        contribution,
        volatility,
        impact
      };
    }).sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
  }, [investments, totalPatrimonio, totalInvested, volatilityData]);

  // Summary stats
  const positiveContributors = sensitivities.filter(s => s.contribution > 0);
  const negativeContributors = sensitivities.filter(s => s.contribution < 0);
  const totalPositive = positiveContributors.reduce((acc, s) => acc + s.contribution, 0);
  const totalNegative = negativeContributors.reduce((acc, s) => acc + s.contribution, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getImpactColor = (impact: 'positive' | 'negative' | 'neutral') => {
    switch (impact) {
      case 'positive': return 'text-emerald-500';
      case 'negative': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  const getImpactBgColor = (impact: 'positive' | 'negative' | 'neutral') => {
    switch (impact) {
      case 'positive': return 'bg-emerald-500/10';
      case 'negative': return 'bg-red-500/10';
      default: return 'bg-muted/50';
    }
  };

  const getImpactIcon = (impact: 'positive' | 'negative' | 'neutral') => {
    switch (impact) {
      case 'positive': return <TrendingUp className="w-4 h-4" />;
      case 'negative': return <TrendingDown className="w-4 h-4" />;
      default: return <Minus className="w-4 h-4" />;
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className={`h-[95vh] bg-background ${themeClass}`}>
        <DrawerTitle className="sr-only">Sensibilidade dos Ativos</DrawerTitle>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Sensibilidade dos Ativos</h2>
            <button className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Summary Card */}
                <div className="bg-card border border-border rounded-2xl p-4">
                  <h3 className="font-medium text-foreground mb-4 text-center">Contribuição Total</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-emerald-500/10 rounded-xl p-4 text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <TrendingUp className="w-5 h-5 text-emerald-500" />
                        <span className="text-sm text-emerald-600 font-medium">Positivos</span>
                      </div>
                      <p className="text-2xl font-bold text-emerald-500">
                        +{totalPositive.toFixed(2)}%
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {positiveContributors.length} ativos
                      </p>
                    </div>
                    
                    <div className="bg-red-500/10 rounded-xl p-4 text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <TrendingDown className="w-5 h-5 text-red-500" />
                        <span className="text-sm text-red-600 font-medium">Negativos</span>
                      </div>
                      <p className="text-2xl font-bold text-red-500">
                        {totalNegative.toFixed(2)}%
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {negativeContributors.length} ativos
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Resultado Líquido</span>
                      <span className={`font-bold text-lg ${(totalPositive + totalNegative) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {(totalPositive + totalNegative) >= 0 ? '+' : ''}{(totalPositive + totalNegative).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sensitivity Bar */}
                <div className="bg-card border border-border rounded-2xl p-4">
                  <h3 className="font-medium text-foreground mb-3">Impacto por Ativo</h3>
                  <div className="h-4 rounded-full overflow-hidden flex">
                    {sensitivities.map((s, idx) => (
                      <div
                        key={s.id}
                        className={`h-full ${s.contribution >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                        style={{ 
                          width: `${Math.max(s.weight, 2)}%`,
                          opacity: 0.4 + (Math.abs(s.contribution) / 10) * 0.6
                        }}
                        title={`${s.name}: ${s.contribution.toFixed(2)}%`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>Maior impacto negativo</span>
                    <span>Maior impacto positivo</span>
                  </div>
                </div>

                {/* Assets List */}
                <h3 className="font-medium text-foreground">Detalhamento por Ativo</h3>
                
                {sensitivities.map((asset) => (
                  <div 
                    key={asset.id} 
                    className="bg-card border border-border rounded-2xl p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{asset.name}</span>
                          {asset.ticker && (
                            <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                              {asset.ticker}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{asset.type}</p>
                      </div>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${getImpactBgColor(asset.impact)}`}>
                        <span className={getImpactColor(asset.impact)}>
                          {getImpactIcon(asset.impact)}
                        </span>
                        <span className={`text-sm font-medium ${getImpactColor(asset.impact)}`}>
                          {asset.contribution >= 0 ? '+' : ''}{asset.contribution.toFixed(2)}%
                        </span>
                      </div>
                    </div>

                    {/* Progress bar for contribution */}
                    <div className="mb-3">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${asset.contribution >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                          style={{ 
                            width: `${Math.min(Math.abs(asset.contribution) * 10, 100)}%`,
                            marginLeft: asset.contribution < 0 ? 'auto' : 0
                          }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div>
                        <p className="text-xs text-muted-foreground">Peso</p>
                        <p className="font-medium text-foreground text-sm">{asset.weight.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Rent.</p>
                        <p className={`font-medium text-sm ${asset.gainPercent >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {asset.gainPercent >= 0 ? '+' : ''}{asset.gainPercent.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Volatilidade</p>
                        <p className="font-medium text-foreground text-sm">{asset.volatility.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Ganho</p>
                        <p className={`font-medium text-sm ${asset.gain >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {formatCurrency(asset.gain)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {sensitivities.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>Nenhum ativo encontrado para análise.</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Close Button */}
          <div className="p-4 border-t border-border">
            <button
              onClick={() => onOpenChange(false)}
              className="w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center"
            >
              <X className="w-6 h-6 text-muted-foreground" />
            </button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
