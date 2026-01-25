import { useState, useEffect } from "react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { X, Info, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/hooks/useTheme";
import { useRealtimeAnalysis } from "@/hooks/useRealtimeAnalysis";
import { AnalysisHelpDialog, HelpButton } from "./AnalysisHelpDialog";

interface MarketAnalysis {
  ticker: string;
  volatility: number;
  expectedReturn: number;
  change30d?: number;
}

interface RiscoRetornoDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  portfolioId: string | null;
}

// Sharpe Ratio Gauge Component
const SharpeGauge = ({ value }: { value: number }) => {
  const normalizedValue = Math.min(3, Math.max(-3, value));
  const angle = ((normalizedValue + 3) / 6) * 180;
  
  const getGradientStyle = () => {
    return {
      background: `conic-gradient(
        from 180deg,
        hsl(0, 80%, 55%) 0deg,
        hsl(30, 80%, 55%) 60deg,
        hsl(50, 80%, 55%) 90deg,
        hsl(80, 70%, 50%) 120deg,
        hsl(120, 60%, 45%) 180deg,
        transparent 180deg
      )`,
    };
  };

  return (
    <div className="relative w-56 h-28 mx-auto">
      <div 
        className="absolute inset-0 rounded-t-full overflow-hidden"
        style={getGradientStyle()}
      />
      <div className="absolute left-1/2 bottom-0 w-40 h-20 bg-card rounded-t-full transform -translate-x-1/2" />
      <div 
        className="absolute bottom-0 left-1/2 origin-bottom"
        style={{ 
          transform: `translateX(-50%) rotate(${angle - 90}deg)`,
          width: '2px',
          height: '70px',
        }}
      >
        <div className="w-2 h-16 bg-gray-600 rounded-full transform -translate-x-1/2" />
        <div className="w-4 h-4 bg-gray-600 rounded-full absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2" />
      </div>
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-center">
        <p className="text-sm text-muted-foreground">Sharpe</p>
        <p className="text-2xl font-bold text-foreground">{value.toFixed(2)}</p>
      </div>
      <div className="absolute bottom-0 left-4 text-sm text-muted-foreground">Risco</div>
      <div className="absolute bottom-0 right-4 text-sm text-muted-foreground">Retorno</div>
    </div>
  );
};

// Color bar for Sharpe in assets
const SharpeColorBar = ({ sharpe }: { sharpe: number }) => {
  const normalizedValue = Math.min(3, Math.max(-3, sharpe));
  const position = ((normalizedValue + 3) / 6) * 100;

  return (
    <div className="relative">
      <div 
        className="h-3 rounded-full overflow-hidden"
        style={{
          background: 'linear-gradient(to right, hsl(0, 80%, 55%), hsl(30, 80%, 55%), hsl(50, 80%, 55%), hsl(80, 70%, 50%), hsl(120, 60%, 45%))',
        }}
      />
      <div 
        className="absolute top-full left-0 mt-1 flex flex-col items-center"
        style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
      >
        <div className="w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-600" />
        <span className="text-xs text-muted-foreground mt-1">Sharpe {sharpe.toFixed(2)}</span>
      </div>
    </div>
  );
};

export default function RiscoRetornoDrawer({
  open,
  onOpenChange,
  portfolioId,
}: RiscoRetornoDrawerProps) {
  const { theme } = useTheme();
  const themeClass = theme === "light" ? "light-theme" : "";
  const [activeTab, setActiveTab] = useState<'carteira' | 'ativos'>('carteira');
  const [marketLoading, setMarketLoading] = useState(false);
  const [marketAnalysis, setMarketAnalysis] = useState<Map<string, MarketAnalysis>>(new Map());
  const [helpOpen, setHelpOpen] = useState(false);

  // Real-time data
  const { 
    investments, 
    totals, 
    economicIndicators,
    loading, 
    isUpdating, 
    formatLastUpdate 
  } = useRealtimeAnalysis({ portfolioId, enabled: open });

  const totalPatrimonio = totals.totalValue;
  const totalInvested = totals.totalInvested;
  const totalGain = totalPatrimonio - totalInvested;
  const returnPercent = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;
  const cdi12m = economicIndicators?.accumulated12m?.cdi || 13.14;
  const riskFreeRate = cdi12m;

  // Fetch real volatility data from market-analysis API
  useEffect(() => {
    const fetchMarketAnalysisData = async () => {
      if (!open || investments.length === 0) return;
      
      setMarketLoading(true);
      try {
        const analysisMap = new Map<string, MarketAnalysis>();

        // Get stock/FII tickers
        const stockTickers = investments
          .filter(inv => ['Ações', 'FIIs', 'BDRs', 'Ações, Stocks e ETF', 'FIIs e REITs'].includes(inv.asset_type) && inv.ticker)
          .map(inv => inv.ticker as string);

        if (stockTickers.length > 0) {
          const { data: stockAnalysis } = await supabase.functions.invoke('market-analysis', {
            body: { assets: stockTickers, assetType: 'stocks' }
          });
          
          stockAnalysis?.analyses?.forEach((a: any) => {
            analysisMap.set(a.ticker, {
              ticker: a.ticker,
              volatility: a.volatility,
              expectedReturn: a.expectedReturn,
              change30d: a.change30d,
            });
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
            analysisMap.set(a.ticker, {
              ticker: a.ticker,
              volatility: a.volatility,
              expectedReturn: a.expectedReturn,
              change30d: a.change30d,
            });
          });
        }

        // Get fixed income analysis
        const { data: fixedIncomeAnalysis } = await supabase.functions.invoke('market-analysis', {
          body: { assetType: 'fixed_income' }
        });
        
        fixedIncomeAnalysis?.analyses?.forEach((a: any) => {
          analysisMap.set(a.ticker, {
            ticker: a.ticker,
            volatility: a.volatility,
            expectedReturn: a.expectedReturn,
          });
        });

        setMarketAnalysis(analysisMap);
      } catch (error) {
        console.error("Error fetching market analysis:", error);
      } finally {
        setMarketLoading(false);
      }
    };

    fetchMarketAnalysisData();
  }, [open, investments]);

  // Calculate portfolio volatility (weighted average)
  const calculatePortfolioVolatility = () => {
    if (marketAnalysis.size === 0 || totalPatrimonio === 0) return 5; // Default estimate

    let weightedVolatility = 0;
    let totalWeight = 0;

    investments.forEach(inv => {
      const key = inv.ticker || inv.asset_name;
      const analysis = marketAnalysis.get(key);
      
      if (analysis) {
        const weight = inv.current_value / totalPatrimonio;
        weightedVolatility += analysis.volatility * weight;
        totalWeight += weight;
      } else {
        // Estimate volatility based on asset type
        const weight = inv.current_value / totalPatrimonio;
        let estimatedVol = 5; // Default
        
        if (inv.asset_type.includes('Renda Fixa') || inv.asset_type === 'Tesouro Direto') {
          estimatedVol = 1;
        } else if (inv.asset_type === 'Criptoativos') {
          estimatedVol = 50;
        } else if (inv.asset_type === 'Ações' || inv.asset_type.includes('Stocks')) {
          estimatedVol = 25;
        } else if (inv.asset_type === 'FIIs' || inv.asset_type.includes('REITs')) {
          estimatedVol = 15;
        }
        
        weightedVolatility += estimatedVol * weight;
        totalWeight += weight;
      }
    });

    return totalWeight > 0 ? weightedVolatility / totalWeight : 5;
  };

  const portfolioVolatility = calculatePortfolioVolatility();
  const sharpeRatio = portfolioVolatility > 0 ? (returnPercent - riskFreeRate) / portfolioVolatility : 0;

  // Calculate per asset with real data
  const assetData = investments.map(inv => {
    const key = inv.ticker || inv.asset_name;
    const analysis = marketAnalysis.get(key);
    
    const invReturn = inv.gain_percent;
    const invVolatility = analysis?.volatility || Math.abs(invReturn) * 0.1 + 0.5;
    const invSharpe = invVolatility > 0 ? (invReturn - riskFreeRate) / invVolatility : 0;
    
    return {
      ...inv,
      returnAnnualized: invReturn,
      cdiAnnualized: cdi12m,
      volatility: invVolatility,
      sharpe: invSharpe,
      hasRealData: !!analysis,
    };
  });

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className={`h-[95vh] bg-background ${themeClass}`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Risco Retorno</h2>
            <div className="flex items-center gap-2">
              {(isUpdating || marketLoading) && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
              <span className="text-xs text-muted-foreground">{formatLastUpdate()}</span>
              <HelpButton onClick={() => setHelpOpen(true)} />
            </div>
          </div>

          <AnalysisHelpDialog open={helpOpen} onOpenChange={setHelpOpen} section="risco-retorno" />

          {/* Tabs */}
          <div className="flex bg-muted/30">
            {(['carteira', 'ativos'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-sm font-medium transition-all ${
                  activeTab === tab 
                    ? 'text-foreground border-b-2 border-primary bg-background' 
                    : 'text-muted-foreground'
                }`}
              >
                {tab === 'carteira' ? 'Carteira' : 'Ativos'}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {(loading || marketLoading) ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : activeTab === 'carteira' ? (
              <>
                <div className="bg-card border border-border rounded-2xl p-4">
                  <div className="flex items-center justify-center gap-2 mb-6">
                    <h3 className="font-medium text-foreground">Carteira do Início</h3>
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </div>
                  
                  <SharpeGauge value={sharpeRatio} />
                  
                  <div className="grid grid-cols-3 gap-4 mt-8 pt-4 border-t border-border">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Retorno Carteira</p>
                      <p className="font-bold text-foreground">{returnPercent.toFixed(2)}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Retorno CDI</p>
                      <p className="font-bold text-foreground">{cdi12m.toFixed(2)}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Volatilidade</p>
                      <p className="font-bold text-foreground">{portfolioVolatility.toFixed(2)}%</p>
                    </div>
                  </div>
                </div>

                <h3 className="text-center font-medium text-foreground">Histórico</h3>
                
                <div className="bg-card border border-border rounded-2xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-1 h-6 rounded-full bg-primary" />
                    <span className="font-medium text-foreground">{new Date().getFullYear()}</span>
                  </div>
                  <div className="h-4 rounded-full overflow-hidden" style={{
                    background: 'linear-gradient(to right, hsl(0, 80%, 55%), hsl(30, 80%, 55%), hsl(50, 80%, 55%), hsl(80, 70%, 50%), hsl(120, 60%, 45%))',
                  }} />
                </div>
              </>
            ) : (
              <>
                <h3 className="text-center font-medium text-foreground">Histórico</h3>
                
                {assetData.map((asset) => (
                  <div key={asset.id} className="bg-card border border-border rounded-2xl p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-1 h-6 rounded-full bg-primary" />
                      <div className="flex-1">
                        <span className="font-medium text-foreground">{asset.asset_name}</span>
                        {asset.hasRealData && (
                          <span className="ml-2 text-xs text-primary">• Dados reais</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="mb-8">
                      <SharpeColorBar sharpe={asset.sharpe} />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Ret. anualizado</p>
                        <p className="font-bold text-foreground">{asset.returnAnnualized.toFixed(2)}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Ret. anualizado CDI</p>
                        <p className="font-bold text-foreground">{asset.cdiAnnualized.toFixed(2)}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Volatilidade</p>
                        <p className="font-bold text-foreground">{asset.volatility.toFixed(2)}%</p>
                      </div>
                    </div>
                  </div>
                ))}
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
