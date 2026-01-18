import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingUp, Calculator, Info, ChevronDown, Wallet, Globe, PieChart, Landmark, Bitcoin, Building2, Coins, Check } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

interface Investment {
  id: string;
  asset_name: string;
  asset_type: string;
  ticker: string | null;
  current_value: number;
  total_invested: number;
  gain_percent: number;
}

interface GlobalAsset {
  id: string;
  name: string;
  category: string;
  value_brl: number;
}

interface ProjecaoDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showValues: boolean;
  totalPatrimonio: number;
  totalInvestido: number;
  totalGanho: number;
  economicIndicators: {
    current: { cdi: number; ipca: number; selic: number };
    accumulated12m: { cdi: number; ipca: number };
  } | null;
}

interface ProjectionData {
  month: string;
  monthIndex: number;
  pessimista: number;
  moderado: number;
  otimista: number;
  cdi: number;
  ipca: number;
}

type ProjectionTarget = "carteira" | "global" | "total" | "asset_type" | "asset";

interface SelectableItem {
  id: string;
  name: string;
  value: number;
  type: "carteira" | "global" | "total" | "asset_type" | "asset" | "global_asset";
  icon: React.ReactNode;
  color: string;
}

const ProjecaoDrawer = ({
  open,
  onOpenChange,
  showValues,
  totalPatrimonio,
  totalInvestido,
  totalGanho,
  economicIndicators,
}: ProjecaoDrawerProps) => {
  const { theme } = useTheme();
  const themeClass = theme === "light" ? "light-theme" : "";
  
  const [historicalReturns, setHistoricalReturns] = useState<number[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<"pessimista" | "moderado" | "otimista">("moderado");
  const [isLoading, setIsLoading] = useState(true);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [globalAssets, setGlobalAssets] = useState<GlobalAsset[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<string>("carteira");
  const [showSelector, setShowSelector] = useState(false);
  const [assetVolatility, setAssetVolatility] = useState<{ [ticker: string]: { change: number; volatility: number } }>({});
  const [marketAnalysis, setMarketAnalysis] = useState<{ [key: string]: { expectedReturn: number; volatility: number; change30d?: number } }>({});
  useEffect(() => {
    const fetchData = async () => {
      if (!open) return;
      setIsLoading(true);
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // Fetch in parallel
        const [historyResult, investmentsResult, globalResult] = await Promise.all([
          // Historical data
          (async () => {
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
            return supabase
              .from("portfolio_history")
              .select("snapshot_date, total_value, total_gain, gain_percent")
              .eq("user_id", session.user.id)
              .gte("snapshot_date", oneYearAgo.toISOString().split('T')[0])
              .order("snapshot_date", { ascending: true });
          })(),
          // Investments
          supabase
            .from("investments")
            .select("id, asset_name, asset_type, ticker, current_value, total_invested, gain_percent")
            .eq("user_id", session.user.id)
            .order("current_value", { ascending: false }),
          // Global assets
          supabase
            .from("global_assets")
            .select("id, name, category, value_brl")
            .eq("user_id", session.user.id)
            .order("value_brl", { ascending: false }),
        ]);

        // Process historical returns
        const history = historyResult.data || [];
        if (history.length > 1) {
          const returns: number[] = [];
          for (let i = 1; i < history.length; i++) {
            const prev = history[i - 1];
            const curr = history[i];
            if (prev.total_value > 0) {
              const monthlyReturn = ((curr.total_value - prev.total_value) / prev.total_value) * 100;
              returns.push(monthlyReturn);
            }
          }
          setHistoricalReturns(returns);
        }

        const loadedInvestments = investmentsResult.data || [];
        setInvestments(loadedInvestments);
        setGlobalAssets(globalResult.data || []);

        // Fetch comprehensive market analysis from the new API
        const analysisMap: { [key: string]: { expectedReturn: number; volatility: number; change30d?: number } } = {};
        
        // Get stock analysis
        const stockTickers = loadedInvestments
          .filter(inv => inv.ticker && ['Ações, Stocks e ETF', 'BDRs', 'FIIs e REITs'].includes(inv.asset_type))
          .map(inv => inv.ticker)
          .filter(Boolean) as string[];

        if (stockTickers.length > 0) {
          try {
            const { data: stockAnalysis } = await supabase.functions.invoke('market-analysis', {
              body: { assets: stockTickers, assetType: 'stocks' }
            });
            
            if (stockAnalysis?.analyses) {
              stockAnalysis.analyses.forEach((a: any) => {
                analysisMap[a.ticker] = {
                  expectedReturn: a.expectedReturn / 100, // Convert to decimal
                  volatility: a.volatility / 100,
                  change30d: a.change30d,
                };
              });
            }
          } catch (e) {
            console.error("Error fetching stock analysis:", e);
          }
        }

        // Get crypto analysis
        const cryptoNames = loadedInvestments
          .filter(inv => inv.asset_type === 'Criptoativos')
          .map(inv => inv.asset_name);

        if (cryptoNames.length > 0) {
          try {
            const { data: cryptoAnalysis } = await supabase.functions.invoke('market-analysis', {
              body: { assets: cryptoNames, assetType: 'crypto' }
            });
            
            if (cryptoAnalysis?.analyses) {
              cryptoAnalysis.analyses.forEach((a: any) => {
                analysisMap[a.ticker] = {
                  expectedReturn: a.expectedReturn / 100,
                  volatility: a.volatility / 100,
                  change30d: a.change30d,
                };
              });
            }
          } catch (e) {
            console.error("Error fetching crypto analysis:", e);
          }
        }

        // Get fixed income analysis (CDI/SELIC)
        try {
          const { data: fixedIncomeAnalysis } = await supabase.functions.invoke('market-analysis', {
            body: { assetType: 'fixed_income' }
          });
          
          if (fixedIncomeAnalysis?.analyses) {
            fixedIncomeAnalysis.analyses.forEach((a: any) => {
              analysisMap[a.ticker] = {
                expectedReturn: a.expectedReturn / 100,
                volatility: a.volatility / 100,
              };
            });
          }
        } catch (e) {
          console.error("Error fetching fixed income analysis:", e);
        }

        setMarketAnalysis(analysisMap);
        console.log("ProjecaoDrawer - Market analysis loaded:", Object.keys(analysisMap).length);
        console.log("ProjecaoDrawer - Investments loaded:", loadedInvestments.length);
        console.log("ProjecaoDrawer - Global assets loaded:", globalResult.data?.length || 0);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [open]);

  // Calculate totals
  const totalGlobal = useMemo(() => {
    const total = globalAssets.reduce((sum, a) => sum + (Number(a.value_brl) || 0), 0);
    console.log("ProjecaoDrawer - totalGlobal calculated:", total, "from", globalAssets.length, "assets");
    return total;
  }, [globalAssets]);
  const totalCompleto = totalPatrimonio + totalGlobal;

  // Group investments by type
  const investmentsByType = useMemo(() => {
    const groups: { [key: string]: { value: number; invested: number; count: number } } = {};
    investments.forEach(inv => {
      const type = inv.asset_type || "Outros";
      if (!groups[type]) groups[type] = { value: 0, invested: 0, count: 0 };
      groups[type].value += inv.current_value || 0;
      groups[type].invested += inv.total_invested || 0;
      groups[type].count++;
    });
    return groups;
  }, [investments]);

  // Selectable items list
  const selectableItems = useMemo((): SelectableItem[] => {
    const items: SelectableItem[] = [
      {
        id: "carteira",
        name: "Carteira de Investimentos",
        value: totalPatrimonio,
        type: "carteira",
        icon: <Wallet className="w-5 h-5" />,
        color: "from-emerald-400 to-green-500",
      },
      {
        id: "global",
        name: "Patrimônio Global",
        value: totalGlobal,
        type: "global",
        icon: <Globe className="w-5 h-5" />,
        color: "from-violet-400 to-purple-500",
      },
      {
        id: "total",
        name: "Patrimônio Total",
        value: totalCompleto,
        type: "total",
        icon: <PieChart className="w-5 h-5" />,
        color: "from-blue-400 to-cyan-500",
      },
    ];

    // Add asset types
    Object.entries(investmentsByType).forEach(([type, data]) => {
      const typeIcons: { [key: string]: React.ReactNode } = {
        "Ação": <TrendingUp className="w-5 h-5" />,
        "Ações, Stocks e ETF": <TrendingUp className="w-5 h-5" />,
        "FIIs e REITs": <Building2 className="w-5 h-5" />,
        "Criptoativos": <Bitcoin className="w-5 h-5" />,
        "Renda Fixa": <Landmark className="w-5 h-5" />,
        "Tesouro Direto": <Landmark className="w-5 h-5" />,
        "Moedas": <Coins className="w-5 h-5" />,
      };
      items.push({
        id: `type_${type}`,
        name: type,
        value: data.value,
        type: "asset_type",
        icon: typeIcons[type] || <Coins className="w-5 h-5" />,
        color: "from-amber-400 to-orange-500",
      });
    });

    // Add ALL individual investments
    investments.forEach(inv => {
      const assetTypeIcons: { [key: string]: React.ReactNode } = {
        "Ação": <TrendingUp className="w-5 h-5" />,
        "Ações, Stocks e ETF": <TrendingUp className="w-5 h-5" />,
        "FIIs e REITs": <Building2 className="w-5 h-5" />,
        "Criptoativos": <Bitcoin className="w-5 h-5" />,
        "Renda Fixa": <Landmark className="w-5 h-5" />,
        "Tesouro Direto": <Landmark className="w-5 h-5" />,
        "Moedas": <Coins className="w-5 h-5" />,
        "Conta Corrente": <Wallet className="w-5 h-5" />,
        "BDRs": <Globe className="w-5 h-5" />,
        "Fundos": <PieChart className="w-5 h-5" />,
      };
      items.push({
        id: `asset_${inv.id}`,
        name: inv.ticker ? `${inv.ticker} - ${inv.asset_name}` : inv.asset_name,
        value: inv.current_value,
        type: "asset",
        icon: assetTypeIcons[inv.asset_type] || <TrendingUp className="w-5 h-5" />,
        color: "from-rose-400 to-pink-500",
      });
    });

    // Add global assets
    globalAssets.forEach(asset => {
      const categoryIcons: { [key: string]: React.ReactNode } = {
        "imoveis": <Building2 className="w-5 h-5" />,
        "veiculos": <Coins className="w-5 h-5" />,
        "empresas": <Landmark className="w-5 h-5" />,
      };
      items.push({
        id: `global_${asset.id}`,
        name: asset.name,
        value: asset.value_brl,
        type: "global_asset",
        icon: categoryIcons[asset.category] || <Globe className="w-5 h-5" />,
        color: "from-indigo-400 to-violet-500",
      });
    });

    return items;
  }, [totalPatrimonio, totalGlobal, totalCompleto, investmentsByType, investments, globalAssets]);

  // Get selected item
  const selectedItem = useMemo(() => {
    return selectableItems.find(item => item.id === selectedTarget) || selectableItems[0];
  }, [selectableItems, selectedTarget]);

  // Calculate projection based on selected item
  // Get asset type for individual assets
  const getAssetTypeForItem = (itemId: string): string | null => {
    if (itemId.startsWith("asset_")) {
      const assetId = itemId.replace("asset_", "");
      const inv = investments.find(i => i.id === assetId);
      return inv?.asset_type || null;
    }
    if (itemId.startsWith("type_")) {
      return itemId.replace("type_", "");
    }
    return null;
  };

  const projectionData = useMemo((): ProjectionData[] => {
    const currentDate = new Date();
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    
    const baseValue = selectedItem?.value || totalPatrimonio;
    
    // Get CDI and IPCA monthly rates from real economic indicators
    const cdi12m = economicIndicators?.accumulated12m?.cdi || 11.5;
    const ipca12m = economicIndicators?.accumulated12m?.ipca || 4.5;
    const cdiMonthly = Math.pow(1 + cdi12m / 100, 1/12) - 1;
    const ipcaMonthly = Math.pow(1 + ipca12m / 100, 1/12) - 1;
    
    // Use real market analysis from API when available
    let baseMonthlyReturn: number;
    let volatility: number;
    
    const assetType = selectedItem ? getAssetTypeForItem(selectedItem.id) : null;
    
    // Check if we have real market analysis for this specific asset
    const getMarketAnalysisForItem = (): { expectedReturn: number; volatility: number } | null => {
      if (selectedItem?.id.startsWith("asset_")) {
        const assetId = selectedItem.id.replace("asset_", "");
        const inv = investments.find(i => i.id === assetId);
        if (inv?.ticker && marketAnalysis[inv.ticker]) {
          return marketAnalysis[inv.ticker];
        }
        if (inv?.asset_name && marketAnalysis[inv.asset_name]) {
          return marketAnalysis[inv.asset_name];
        }
      }
      return null;
    };
    
    const realAnalysis = getMarketAnalysisForItem();
    
    if (realAnalysis) {
      // Use REAL data from market API
      baseMonthlyReturn = realAnalysis.expectedReturn;
      volatility = realAnalysis.volatility;
      console.log(`Using REAL market analysis: return=${(baseMonthlyReturn * 100).toFixed(2)}%, volatility=${(volatility * 100).toFixed(2)}%`);
    } else if (selectedItem?.type === "global" || selectedItem?.type === "global_asset") {
      // Real assets (real estate, vehicles, etc.) - follow inflation + small premium
      baseMonthlyReturn = ipcaMonthly * 1.3;
      volatility = 0.02;
    } else if (assetType === "Criptoativos") {
      // Check if we have real crypto data
      const inv = investments.find(i => selectedItem?.id === `asset_${i.id}`);
      if (inv && marketAnalysis[inv.asset_name]) {
        baseMonthlyReturn = marketAnalysis[inv.asset_name].expectedReturn;
        volatility = marketAnalysis[inv.asset_name].volatility;
      } else {
        baseMonthlyReturn = 0.04;
        volatility = 0.15;
      }
    } else if (assetType === "Ação" || assetType === "Ações, Stocks e ETF" || assetType === "BDRs") {
      baseMonthlyReturn = 0.01;
      volatility = 0.05;
    } else if (assetType === "FIIs e REITs") {
      baseMonthlyReturn = 0.008;
      volatility = 0.03;
    } else if (assetType === "Renda Fixa" || assetType === "Tesouro Direto") {
      // Use real CDI from market analysis if available
      if (marketAnalysis['CDI']) {
        baseMonthlyReturn = marketAnalysis['CDI'].expectedReturn;
        volatility = marketAnalysis['CDI'].volatility;
      } else {
        baseMonthlyReturn = cdiMonthly;
        volatility = 0.005;
      }
    } else if (assetType === "Moedas") {
      baseMonthlyReturn = 0.005;
      volatility = 0.04;
    } else if (assetType === "Fundos") {
      baseMonthlyReturn = cdiMonthly * 1.1;
      volatility = 0.02;
    } else if (selectedItem?.type === "carteira" && historicalReturns.length > 0) {
      const avgHistoricalReturn = historicalReturns.reduce((a, b) => a + b, 0) / historicalReturns.length;
      baseMonthlyReturn = avgHistoricalReturn / 100;
      const variance = historicalReturns.reduce((sum, r) => sum + Math.pow(r - avgHistoricalReturn, 2), 0) / historicalReturns.length;
      volatility = Math.sqrt(variance) / 100;
    } else if (selectedItem?.type === "total") {
      // Total patrimony - weighted average with real data
      const investmentWeight = totalPatrimonio / (totalPatrimonio + totalGlobal || 1);
      const globalWeight = totalGlobal / (totalPatrimonio + totalGlobal || 1);
      
      // Calculate weighted average from all assets with real analysis
      let weightedReturn = 0;
      let weightedVolatility = 0;
      let totalWeight = 0;
      
      investments.forEach(inv => {
        const analysis = marketAnalysis[inv.ticker || ''] || marketAnalysis[inv.asset_name];
        if (analysis) {
          const weight = inv.current_value / totalPatrimonio;
          weightedReturn += analysis.expectedReturn * weight;
          weightedVolatility += analysis.volatility * weight;
          totalWeight += weight;
        }
      });
      
      if (totalWeight > 0.5) {
        // More than 50% of portfolio has real data
        baseMonthlyReturn = weightedReturn;
        volatility = weightedVolatility;
      } else {
        baseMonthlyReturn = (cdiMonthly * investmentWeight) + (ipcaMonthly * 1.3 * globalWeight);
        volatility = 0.03;
      }
    } else {
      baseMonthlyReturn = cdiMonthly;
      volatility = 0.01;
    }
    
    // Scenario multipliers based on volatility
    const pessimisticMultiplier = Math.max(0.2, 1 - volatility * 3);
    const optimisticMultiplier = Math.min(2.5, 1 + volatility * 3);
    
    const data: ProjectionData[] = [];
    let pessimista = baseValue;
    let moderado = baseValue;
    let otimista = baseValue;
    let cdi = baseValue;
    let ipca = baseValue;
    
    // Add current month
    data.push({
      month: monthNames[currentDate.getMonth()],
      monthIndex: 0,
      pessimista,
      moderado,
      otimista,
      cdi,
      ipca,
    });
    
    // Project next 12 months
    for (let i = 1; i <= 12; i++) {
      const monthIndex = (currentDate.getMonth() + i) % 12;
      
      pessimista *= (1 + baseMonthlyReturn * pessimisticMultiplier);
      moderado *= (1 + baseMonthlyReturn);
      otimista *= (1 + baseMonthlyReturn * optimisticMultiplier);
      cdi *= (1 + cdiMonthly);
      ipca *= (1 + ipcaMonthly);
      
      data.push({
        month: monthNames[monthIndex],
        monthIndex: i,
        pessimista,
        moderado,
        otimista,
        cdi,
        ipca,
      });
    }
    
    return data;
  }, [selectedItem, historicalReturns, economicIndicators, totalPatrimonio, totalGlobal, investments, marketAnalysis]);

  // Calculate final projections
  const finalProjections = useMemo(() => {
    if (projectionData.length < 2) return null;
    
    const final = projectionData[projectionData.length - 1];
    const initial = projectionData[0];
    
    return {
      pessimista: {
        value: final.pessimista,
        gain: final.pessimista - initial.pessimista,
        percent: ((final.pessimista - initial.pessimista) / initial.pessimista) * 100,
      },
      moderado: {
        value: final.moderado,
        gain: final.moderado - initial.moderado,
        percent: ((final.moderado - initial.moderado) / initial.moderado) * 100,
      },
      otimista: {
        value: final.otimista,
        gain: final.otimista - initial.otimista,
        percent: ((final.otimista - initial.otimista) / initial.otimista) * 100,
      },
      cdi: {
        value: final.cdi,
        gain: final.cdi - initial.cdi,
        percent: ((final.cdi - initial.cdi) / initial.cdi) * 100,
      },
      ipca: {
        value: final.ipca,
        gain: final.ipca - initial.ipca,
        percent: ((final.ipca - initial.ipca) / initial.ipca) * 100,
      },
    };
  }, [projectionData]);

  const formatCurrency = (value: number) => {
    if (!showValues) return "R$ ••••••";
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const formatPercent = (value: number) => {
    if (!showValues) return "••%";
    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
  };

  const scenarioColors = {
    pessimista: "hsl(var(--warning))",
    moderado: "hsl(var(--success))",
    otimista: "hsl(var(--primary))",
  };

  const scenarioLabels = {
    pessimista: "Pessimista",
    moderado: "Moderado",
    otimista: "Otimista",
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className={`${themeClass} max-h-[95vh] bg-background`}>
        <DrawerHeader className="border-b border-border">
          <div className="flex items-center justify-between">
            <DrawerTitle className="flex items-center gap-2 text-foreground">
              <TrendingUp className="w-5 h-5 text-primary" />
              Projeção 12 Meses
            </DrawerTitle>
            <DrawerClose asChild>
              <button className="p-2 hover:bg-muted rounded-full transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(95vh-80px)]">
          {/* Target Selector */}
          <motion.button
            onClick={() => setShowSelector(!showSelector)}
            className="w-full bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-4 border border-primary/20 text-left"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${selectedItem?.color || "from-primary to-violet-500"} flex items-center justify-center text-white shadow-lg`}>
                  {selectedItem?.icon}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Projetando</p>
                  <p className="font-semibold text-foreground">{selectedItem?.name || "Selecione"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-lg font-bold text-foreground">{formatCurrency(selectedItem?.value || 0)}</p>
                <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${showSelector ? "rotate-180" : ""}`} />
              </div>
            </div>
          </motion.button>

          {/* Selector Dropdown */}
          <AnimatePresence>
            {showSelector && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-card rounded-2xl border border-border p-3 space-y-2 max-h-64 overflow-y-auto">
                  {/* Main Options */}
                  <p className="text-xs text-muted-foreground px-2 pt-1">Principal</p>
                  {selectableItems.filter(i => ["carteira", "global", "total"].includes(i.type)).map(item => (
                    <motion.button
                      key={item.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setSelectedTarget(item.id);
                        setShowSelector(false);
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                        selectedTarget === item.id
                          ? "bg-primary/10 border border-primary/30"
                          : "bg-muted/50 hover:bg-muted border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow`}>
                          {item.icon}
                        </div>
                        <span className="font-medium text-foreground text-sm">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-muted-foreground">{formatCurrency(item.value)}</span>
                        {selectedTarget === item.id && <Check className="w-4 h-4 text-primary" />}
                      </div>
                    </motion.button>
                  ))}

                  {/* Asset Types */}
                  {Object.keys(investmentsByType).length > 0 && (
                    <>
                      <p className="text-xs text-muted-foreground px-2 pt-3">Por Tipo de Ativo</p>
                      {selectableItems.filter(i => i.type === "asset_type").map(item => (
                        <motion.button
                          key={item.id}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setSelectedTarget(item.id);
                            setShowSelector(false);
                          }}
                          className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                            selectedTarget === item.id
                              ? "bg-primary/10 border border-primary/30"
                              : "bg-muted/50 hover:bg-muted border border-transparent"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow`}>
                              {item.icon}
                            </div>
                            <span className="font-medium text-foreground text-sm">{item.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-muted-foreground">{formatCurrency(item.value)}</span>
                            {selectedTarget === item.id && <Check className="w-4 h-4 text-primary" />}
                          </div>
                        </motion.button>
                      ))}
                    </>
                  )}

                  {/* Individual Assets */}
                  {investments.length > 0 && (
                    <>
                      <p className="text-xs text-muted-foreground px-2 pt-3">Ativos Individuais</p>
                      {selectableItems.filter(i => i.type === "asset").map(item => (
                        <motion.button
                          key={item.id}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setSelectedTarget(item.id);
                            setShowSelector(false);
                          }}
                          className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                            selectedTarget === item.id
                              ? "bg-primary/10 border border-primary/30"
                              : "bg-muted/50 hover:bg-muted border border-transparent"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow`}>
                              {item.icon}
                            </div>
                            <span className="font-medium text-foreground text-sm truncate max-w-[150px]">{item.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-muted-foreground">{formatCurrency(item.value)}</span>
                            {selectedTarget === item.id && <Check className="w-4 h-4 text-primary" />}
                          </div>
                        </motion.button>
                      ))}
                    </>
                  )}

                  {/* Global Assets */}
                  {globalAssets.length > 0 && (
                    <>
                      <p className="text-xs text-muted-foreground px-2 pt-3">Patrimônio Global</p>
                      {selectableItems.filter(i => i.type === "global_asset").map(item => (
                        <motion.button
                          key={item.id}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setSelectedTarget(item.id);
                            setShowSelector(false);
                          }}
                          className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                            selectedTarget === item.id
                              ? "bg-primary/10 border border-primary/30"
                              : "bg-muted/50 hover:bg-muted border border-transparent"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow`}>
                              {item.icon}
                            </div>
                            <span className="font-medium text-foreground text-sm truncate max-w-[150px]">{item.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-muted-foreground">{formatCurrency(item.value)}</span>
                            {selectedTarget === item.id && <Check className="w-4 h-4 text-primary" />}
                          </div>
                        </motion.button>
                      ))}
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Scenario Selector */}
          <div className="flex gap-2">
            {(["pessimista", "moderado", "otimista"] as const).map((scenario) => (
              <button
                key={scenario}
                onClick={() => setSelectedScenario(scenario)}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                  selectedScenario === scenario
                    ? "bg-primary text-white shadow-lg"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {scenarioLabels[scenario]}
              </button>
            ))}
          </div>

          {/* Projection Chart */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-2xl p-4 border border-border"
          >
            <h3 className="text-sm font-medium text-foreground mb-4">Evolução Projetada</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={projectionData}>
                  <defs>
                    <linearGradient id="gradientSelected" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={scenarioColors[selectedScenario]} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={scenarioColors[selectedScenario]} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="month" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={10}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={9}
                    tickLine={false}
                    tickFormatter={(value) => showValues ? `${(value / 1000).toFixed(0)}k` : "••"}
                    width={40}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "12px",
                      fontSize: "11px",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                    formatter={(value: number, name: string) => [
                      showValues ? formatCurrency(value) : "R$ ••••••",
                      name === selectedScenario ? scenarioLabels[selectedScenario] : name === "cdi" ? "CDI" : name
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey={selectedScenario}
                    stroke={scenarioColors[selectedScenario]}
                    strokeWidth={3}
                    fill="url(#gradientSelected)"
                  />
                  <Line
                    type="monotone"
                    dataKey="cdi"
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-4 mt-2 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: scenarioColors[selectedScenario] }} />
                <span className="text-muted-foreground">{scenarioLabels[selectedScenario]}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-0.5 bg-muted-foreground" />
                <span className="text-muted-foreground">CDI</span>
              </div>
            </div>
          </motion.div>

          {/* Final Projections */}
          {finalProjections && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-3"
            >
              <h3 className="text-sm font-medium text-foreground">Projeção em 12 meses</h3>
              
              {/* Selected Scenario Highlight */}
              <div className="bg-gradient-to-r from-success/10 to-success/5 rounded-2xl p-4 border border-success/20">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs text-muted-foreground">Cenário {scenarioLabels[selectedScenario]}</span>
                    <p className="text-xl font-bold text-foreground">{formatCurrency(finalProjections[selectedScenario].value)}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-lg font-bold ${finalProjections[selectedScenario].gain >= 0 ? "text-success" : "text-destructive"}`}>
                      {formatPercent(finalProjections[selectedScenario].percent)}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {finalProjections[selectedScenario].gain >= 0 ? "+" : ""}{formatCurrency(finalProjections[selectedScenario].gain)}
                    </p>
                  </div>
                </div>
              </div>

              {/* All Scenarios Comparison */}
              <div className="grid grid-cols-3 gap-2">
                {(["pessimista", "moderado", "otimista"] as const).map((scenario) => (
                  <motion.div
                    key={scenario}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedScenario(scenario)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      selectedScenario === scenario
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:bg-muted/50"
                    }`}
                  >
                    <span className="text-[10px] text-muted-foreground uppercase">{scenarioLabels[scenario]}</span>
                    <p className="text-sm font-bold text-foreground mt-1">
                      {formatPercent(finalProjections[scenario].percent)}
                    </p>
                  </motion.div>
                ))}
              </div>

              {/* CDI vs IPCA Comparison */}
              <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Comparativo com indicadores</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-background rounded-lg p-3 border border-border">
                    <span className="text-xs text-muted-foreground">CDI Projetado</span>
                    <p className="text-sm font-semibold text-foreground">{formatCurrency(finalProjections.cdi.value)}</p>
                    <span className="text-xs text-primary">{formatPercent(finalProjections.cdi.percent)}</span>
                  </div>
                  <div className="bg-background rounded-lg p-3 border border-border">
                    <span className="text-xs text-muted-foreground">IPCA Projetado</span>
                    <p className="text-sm font-semibold text-foreground">{formatCurrency(finalProjections.ipca.value)}</p>
                    <span className="text-xs text-warning">{formatPercent(finalProjections.ipca.percent)}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Disclaimer */}
          <p className="text-[10px] text-muted-foreground text-center px-4">
            * Projeções baseadas no histórico da carteira e taxas atuais. Resultados passados não garantem resultados futuros.
          </p>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default ProjecaoDrawer;
