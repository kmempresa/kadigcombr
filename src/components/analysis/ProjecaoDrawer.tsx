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

  // Fetch data and subscribe to realtime updates
  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      if (!open) return;
      setIsLoading(true);
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || !isMounted) return;

        // Fetch in parallel
        const [historyResult, investmentsResult, globalResult] = await Promise.all([
          // Historical data (last year)
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

        if (!isMounted) return;

        // Process historical returns (monthly)
        const history = historyResult.data || [];
        if (history.length > 1) {
          const returns: number[] = [];
          for (let i = 1; i < history.length; i++) {
            const prev = history[i - 1];
            const curr = history[i];
            if (prev.total_value > 0) {
              const dailyReturn = ((curr.total_value - prev.total_value) / prev.total_value) * 100;
              returns.push(dailyReturn);
            }
          }
          setHistoricalReturns(returns);
        }

        setInvestments(investmentsResult.data || []);
        setGlobalAssets(globalResult.data || []);

        console.log("ProjecaoDrawer - Data loaded:", {
          investments: investmentsResult.data?.length || 0,
          globalAssets: globalResult.data?.length || 0,
          historyPoints: history.length,
        });
      } catch (error) {
        console.error("Error fetching projection data:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchData();

    // Subscribe to realtime updates for automatic refresh
    const investmentsChannel = supabase
      .channel('projections-investments-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'investments' },
        () => {
          console.log("Investments updated, refreshing projections...");
          fetchData();
        }
      )
      .subscribe();

    const globalAssetsChannel = supabase
      .channel('projections-global-assets-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'global_assets' },
        () => {
          console.log("Global assets updated, refreshing projections...");
          fetchData();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(investmentsChannel);
      supabase.removeChannel(globalAssetsChannel);
    };
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
    const cdi12m = economicIndicators?.accumulated12m?.cdi || 14.38; // Current real CDI
    const ipca12m = economicIndicators?.accumulated12m?.ipca || 4.26; // Current real IPCA
    const selic = economicIndicators?.current?.selic || 15; // Current SELIC rate
    
    // Calculate monthly rates from annual rates
    const cdiMonthly = Math.pow(1 + cdi12m / 100, 1/12) - 1;
    const ipcaMonthly = Math.pow(1 + ipca12m / 100, 1/12) - 1;
    const selicMonthly = Math.pow(1 + selic / 100, 1/12) - 1;
    
    // Helper to get realistic expected return based on asset type
    const getExpectedReturnByType = (assetType: string | null): { monthlyReturn: number; volatility: number } => {
      switch (assetType) {
        case "Criptoativos":
          // Crypto: Use CDI + risk premium (historical crypto returns are highly variable)
          // Long-term expectation: higher than stocks but with high volatility
          return { monthlyReturn: cdiMonthly + 0.02, volatility: 0.15 };
        case "Ação":
        case "Ações, Stocks e ETF":
          // Stocks: CDI + equity risk premium (~6% annual)
          return { monthlyReturn: cdiMonthly + 0.005, volatility: 0.05 };
        case "BDRs":
          // BDRs: Similar to stocks but with currency exposure
          return { monthlyReturn: cdiMonthly + 0.004, volatility: 0.06 };
        case "FIIs e REITs":
          // REITs: CDI + small premium with lower volatility
          return { monthlyReturn: cdiMonthly + 0.002, volatility: 0.03 };
        case "Renda Fixa":
        case "Tesouro Direto":
          // Fixed income: CDI rate with very low volatility
          return { monthlyReturn: cdiMonthly, volatility: 0.005 };
        case "Fundos":
          // Funds: Slightly above CDI
          return { monthlyReturn: cdiMonthly * 1.05, volatility: 0.02 };
        case "Moedas":
          // Currencies: Lower expected return, moderate volatility
          return { monthlyReturn: 0.003, volatility: 0.04 };
        case "Conta Corrente":
          // Checking account: No return
          return { monthlyReturn: 0, volatility: 0 };
        default:
          // Default: CDI rate
          return { monthlyReturn: cdiMonthly, volatility: 0.02 };
      }
    };
    
    let baseMonthlyReturn: number;
    let volatility: number;
    
    const assetType = selectedItem ? getAssetTypeForItem(selectedItem.id) : null;
    
    if (selectedItem?.type === "global" || selectedItem?.type === "global_asset") {
      // Real assets (real estate, vehicles, etc.) - follow inflation + small premium
      // Real estate historically appreciates at IPCA + 2-4% annually
      baseMonthlyReturn = ipcaMonthly + 0.002; // IPCA + 2.4% annual
      volatility = 0.01; // Low volatility for real assets
    } else if (selectedItem?.id.startsWith("asset_")) {
      // Individual asset - use type-based expectation
      const assetId = selectedItem.id.replace("asset_", "");
      const inv = investments.find(i => i.id === assetId);
      const typeReturn = getExpectedReturnByType(inv?.asset_type || null);
      baseMonthlyReturn = typeReturn.monthlyReturn;
      volatility = typeReturn.volatility;
    } else if (selectedItem?.id.startsWith("type_")) {
      // Asset type category
      const typeName = selectedItem.id.replace("type_", "");
      const typeReturn = getExpectedReturnByType(typeName);
      baseMonthlyReturn = typeReturn.monthlyReturn;
      volatility = typeReturn.volatility;
    } else if (selectedItem?.type === "carteira") {
      // Investment portfolio - weighted average based on asset types
      let weightedReturn = 0;
      let weightedVolatility = 0;
      let totalValue = 0;
      
      investments.forEach(inv => {
        const value = inv.current_value || 0;
        const typeReturn = getExpectedReturnByType(inv.asset_type);
        weightedReturn += typeReturn.monthlyReturn * value;
        weightedVolatility += typeReturn.volatility * value;
        totalValue += value;
      });
      
      if (totalValue > 0) {
        baseMonthlyReturn = weightedReturn / totalValue;
        volatility = weightedVolatility / totalValue;
      } else {
        baseMonthlyReturn = cdiMonthly;
        volatility = 0.02;
      }
      
      // Also consider historical returns if available
      if (historicalReturns.length >= 3) {
        const avgHistoricalReturn = historicalReturns.reduce((a, b) => a + b, 0) / historicalReturns.length;
        // Blend historical with expected (60% expected, 40% historical)
        baseMonthlyReturn = baseMonthlyReturn * 0.6 + (avgHistoricalReturn / 100) * 0.4;
      }
    } else if (selectedItem?.type === "total") {
      // Total patrimony - weighted average of investments + global assets
      const investmentWeight = totalPatrimonio / (totalPatrimonio + totalGlobal || 1);
      const globalWeight = totalGlobal / (totalPatrimonio + totalGlobal || 1);
      
      // Calculate weighted average from investments
      let invWeightedReturn = 0;
      let invWeightedVolatility = 0;
      let totalInvValue = 0;
      
      investments.forEach(inv => {
        const value = inv.current_value || 0;
        const typeReturn = getExpectedReturnByType(inv.asset_type);
        invWeightedReturn += typeReturn.monthlyReturn * value;
        invWeightedVolatility += typeReturn.volatility * value;
        totalInvValue += value;
      });
      
      const invReturn = totalInvValue > 0 ? invWeightedReturn / totalInvValue : cdiMonthly;
      const invVolatility = totalInvValue > 0 ? invWeightedVolatility / totalInvValue : 0.02;
      
      // Global assets follow IPCA + premium
      const globalReturn = ipcaMonthly + 0.002;
      const globalVolatility = 0.01;
      
      baseMonthlyReturn = (invReturn * investmentWeight) + (globalReturn * globalWeight);
      volatility = (invVolatility * investmentWeight) + (globalVolatility * globalWeight);
    } else {
      baseMonthlyReturn = cdiMonthly;
      volatility = 0.01;
    }
    
    // Ensure reasonable bounds for monthly return
    // Cap at -5% to +10% monthly to avoid unrealistic projections
    baseMonthlyReturn = Math.max(-0.05, Math.min(0.10, baseMonthlyReturn));
    volatility = Math.max(0.001, Math.min(0.20, volatility));
    
    // Scenario multipliers based on volatility (more conservative)
    const pessimisticMultiplier = Math.max(0.3, 1 - volatility * 2);
    const optimisticMultiplier = Math.min(1.8, 1 + volatility * 2);
    
    console.log(`Projeção para ${selectedItem?.name}: return=${(baseMonthlyReturn * 100).toFixed(3)}%/mês, volatility=${(volatility * 100).toFixed(2)}%`);
    
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
  }, [selectedItem, historicalReturns, economicIndicators, totalPatrimonio, totalGlobal, investments, getAssetTypeForItem]);

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
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart 
                  data={projectionData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="gradientSelected" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={scenarioColors[selectedScenario]} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={scenarioColors[selectedScenario]} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis 
                    dataKey="month" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={9}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                    interval={1}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={8}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(value) => {
                      if (!showValues) return "••";
                      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                      if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
                      return value.toString();
                    }}
                    width={48}
                    domain={['dataMin * 0.98', 'dataMax * 1.02']}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "12px",
                      fontSize: "11px",
                      padding: "8px 12px",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))", marginBottom: "4px" }}
                    formatter={(value: number, name: string) => [
                      showValues ? formatCurrency(value) : "R$ ••••••",
                      name === selectedScenario ? scenarioLabels[selectedScenario] : name === "cdi" ? "CDI" : name
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey={selectedScenario}
                    stroke={scenarioColors[selectedScenario]}
                    strokeWidth={2}
                    fill="url(#gradientSelected)"
                  />
                  <Line
                    type="monotone"
                    dataKey="cdi"
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth={1.5}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-4 mt-3 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: scenarioColors[selectedScenario] }} />
                <span className="text-muted-foreground">{scenarioLabels[selectedScenario]}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-0.5 bg-muted-foreground shrink-0" style={{ borderStyle: "dashed" }} />
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
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-muted-foreground">Cenário {scenarioLabels[selectedScenario]}</span>
                    <p className="text-lg font-bold text-foreground truncate">{formatCurrency(finalProjections[selectedScenario].value)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-base font-bold ${finalProjections[selectedScenario].gain >= 0 ? "text-success" : "text-destructive"}`}>
                      {formatPercent(finalProjections[selectedScenario].percent)}
                    </span>
                    <p className="text-[10px] text-muted-foreground truncate">
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
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer overflow-hidden ${
                      selectedScenario === scenario
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:bg-muted/50"
                    }`}
                  >
                    <span className="text-[9px] text-muted-foreground uppercase block truncate">{scenarioLabels[scenario]}</span>
                    <p className="text-sm font-bold text-foreground mt-0.5 truncate">
                      {formatPercent(finalProjections[scenario].percent)}
                    </p>
                  </motion.div>
                ))}
              </div>

              {/* CDI vs IPCA Comparison */}
              <div className="bg-muted/50 rounded-xl p-3 space-y-2.5">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-xs text-muted-foreground">Comparativo com indicadores</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-background rounded-lg p-2.5 border border-border overflow-hidden">
                    <span className="text-[10px] text-muted-foreground block">CDI Projetado</span>
                    <p className="text-xs font-semibold text-foreground truncate">{formatCurrency(finalProjections.cdi.value)}</p>
                    <span className="text-[10px] text-primary">{formatPercent(finalProjections.cdi.percent)}</span>
                  </div>
                  <div className="bg-background rounded-lg p-2.5 border border-border overflow-hidden">
                    <span className="text-[10px] text-muted-foreground block">IPCA Projetado</span>
                    <p className="text-xs font-semibold text-foreground truncate">{formatCurrency(finalProjections.ipca.value)}</p>
                    <span className="text-[10px] text-warning">{formatPercent(finalProjections.ipca.percent)}</span>
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
