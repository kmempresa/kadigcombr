import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { X, TrendingUp, Calculator, Info, ChevronDown } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, Legend } from "recharts";

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

  // Fetch historical returns from portfolio_history
  useEffect(() => {
    const fetchHistoricalData = async () => {
      if (!open) return;
      setIsLoading(true);
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // Get last 12 months of history
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        
        const { data: history } = await supabase
          .from("portfolio_history")
          .select("snapshot_date, total_value, total_gain, gain_percent")
          .eq("user_id", session.user.id)
          .gte("snapshot_date", oneYearAgo.toISOString().split('T')[0])
          .order("snapshot_date", { ascending: true });

        if (history && history.length > 1) {
          // Calculate monthly returns
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
      } catch (error) {
        console.error("Error fetching historical data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistoricalData();
  }, [open]);

  // Calculate projection based on historical data and economic indicators
  const projectionData = useMemo((): ProjectionData[] => {
    const currentDate = new Date();
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    
    // Calculate historical average return
    const avgHistoricalReturn = historicalReturns.length > 0
      ? historicalReturns.reduce((a, b) => a + b, 0) / historicalReturns.length
      : 0;
    
    // Calculate standard deviation for scenarios
    const variance = historicalReturns.length > 1
      ? historicalReturns.reduce((sum, r) => sum + Math.pow(r - avgHistoricalReturn, 2), 0) / historicalReturns.length
      : 1;
    const stdDev = Math.sqrt(variance);
    
    // Get CDI and IPCA monthly rates
    const cdi12m = economicIndicators?.accumulated12m?.cdi || 11.5;
    const ipca12m = economicIndicators?.accumulated12m?.ipca || 4.5;
    const cdiMonthly = Math.pow(1 + cdi12m / 100, 1/12) - 1;
    const ipcaMonthly = Math.pow(1 + ipca12m / 100, 1/12) - 1;
    
    // If no historical data, use CDI as base
    const baseMonthlyReturn = historicalReturns.length > 0 
      ? avgHistoricalReturn / 100 
      : cdiMonthly;
    
    // Scenario multipliers
    const pessimisticMultiplier = historicalReturns.length > 0 
      ? Math.max(0.3, 1 - stdDev / 100) 
      : 0.7;
    const optimisticMultiplier = historicalReturns.length > 0 
      ? Math.min(1.7, 1 + stdDev / 100) 
      : 1.3;
    
    const data: ProjectionData[] = [];
    let pessimista = totalPatrimonio;
    let moderado = totalPatrimonio;
    let otimista = totalPatrimonio;
    let cdi = totalPatrimonio;
    let ipca = totalPatrimonio;
    
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
  }, [totalPatrimonio, historicalReturns, economicIndicators]);

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

        <div className="p-4 space-y-6 overflow-y-auto max-h-[calc(95vh-80px)]">
          {/* Current Value Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-4 border border-primary/20"
          >
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">Patrimônio Atual</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(totalPatrimonio)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Base para projeções • {historicalReturns.length > 0 ? `${historicalReturns.length} meses de histórico` : "Usando CDI como referência"}
            </p>
          </motion.div>

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
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={projectionData}>
                  <defs>
                    <linearGradient id="gradientSelected" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={scenarioColors[selectedScenario]} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={scenarioColors[selectedScenario]} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradientCDI" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="month" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={11}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={10}
                    tickLine={false}
                    tickFormatter={(value) => showValues ? `${(value / 1000).toFixed(0)}k` : "••"}
                    width={45}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "12px",
                      fontSize: "12px",
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
            <div className="flex items-center justify-center gap-4 mt-3 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: scenarioColors[selectedScenario] }} />
                <span className="text-muted-foreground">{scenarioLabels[selectedScenario]}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-0.5 bg-muted-foreground" style={{ borderStyle: "dashed" }} />
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
                <p className="text-[10px] text-muted-foreground text-center">
                  * Projeções baseadas no histórico da carteira e taxas atuais. Resultados passados não garantem resultados futuros.
                </p>
              </div>
            </motion.div>
          )}

          {/* Methodology Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-card rounded-xl p-4 border border-border"
          >
            <button
              className="flex items-center justify-between w-full text-left"
            >
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Como calculamos</span>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </button>
            <div className="mt-3 space-y-2 text-xs text-muted-foreground">
              <p><strong>Cenário Pessimista:</strong> Retorno histórico com desconto de 1 desvio padrão</p>
              <p><strong>Cenário Moderado:</strong> Média do retorno histórico da carteira</p>
              <p><strong>Cenário Otimista:</strong> Retorno histórico com acréscimo de 1 desvio padrão</p>
              <p className="pt-2 border-t border-border">
                CDI e IPCA são projetados com base nas taxas acumuladas dos últimos 12 meses fornecidas pelo Banco Central.
              </p>
            </div>
          </motion.div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default ProjecaoDrawer;
