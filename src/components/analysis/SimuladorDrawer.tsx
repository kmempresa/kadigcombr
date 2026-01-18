import { useState, useEffect, useMemo } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Calculator, TrendingUp, PiggyBank, Calendar, Percent, DollarSign, ChevronDown, Info, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  Legend,
} from "recharts";

interface SimuladorDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SimulationResult {
  month: number;
  monthLabel: string;
  invested: number;
  finalValue: number;
  earnings: number;
  cdiValue: number;
  poupancaValue: number;
}

const investmentProfiles = [
  { id: "conservador", name: "Conservador", annualReturn: 0.12, description: "Renda fixa, CDBs, Tesouro SELIC" },
  { id: "moderado", name: "Moderado", annualReturn: 0.15, description: "Mix de renda fixa e fundos multimercado" },
  { id: "arrojado", name: "Arrojado", annualReturn: 0.18, description: "Ações, FIIs e renda variável" },
  { id: "agressivo", name: "Agressivo", annualReturn: 0.25, description: "Ações, criptomoedas e derivativos" },
];

const SimuladorDrawer = ({ open, onOpenChange }: SimuladorDrawerProps) => {
  const [initialValue, setInitialValue] = useState("");
  const [monthlyContribution, setMonthlyContribution] = useState("");
  const [investmentPeriod, setInvestmentPeriod] = useState([12]); // months
  const [selectedProfile, setSelectedProfile] = useState("moderado");
  const [showResults, setShowResults] = useState(false);
  const [economicData, setEconomicData] = useState({ cdi: 14.15, selic: 15, ipca: 4.5 });
  const [loading, setLoading] = useState(false);

  // Fetch economic indicators
  useEffect(() => {
    const fetchEconomicData = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('market-data', {
          body: { type: 'economic-indicators' }
        });
        if (!error && data) {
          setEconomicData({
            cdi: data.current?.cdi || 14.15,
            selic: data.current?.selic || 15,
            ipca: data.current?.ipca || 4.5,
          });
        }
      } catch (error) {
        console.error('Error fetching economic data:', error);
      }
    };
    if (open) {
      fetchEconomicData();
    }
  }, [open]);

  const profile = investmentProfiles.find(p => p.id === selectedProfile) || investmentProfiles[1];
  const monthlyRate = Math.pow(1 + profile.annualReturn, 1/12) - 1;
  const cdiMonthlyRate = Math.pow(1 + (economicData.cdi / 100), 1/12) - 1;
  const poupancaMonthlyRate = 0.005; // ~6% a.a.

  const simulationResults = useMemo(() => {
    const initial = parseFloat(initialValue) || 0;
    const monthly = parseFloat(monthlyContribution) || 0;
    const months = investmentPeriod[0];
    
    const results: SimulationResult[] = [];
    
    let portfolioValue = initial;
    let cdiValue = initial;
    let poupancaValue = initial;
    let totalInvested = initial;
    
    for (let i = 1; i <= months; i++) {
      // Add monthly contribution
      totalInvested += monthly;
      
      // Apply returns
      portfolioValue = (portfolioValue + monthly) * (1 + monthlyRate);
      cdiValue = (cdiValue + monthly) * (1 + cdiMonthlyRate);
      poupancaValue = (poupancaValue + monthly) * (1 + poupancaMonthlyRate);
      
      const monthLabel = i <= 12 
        ? `${i}m` 
        : i % 12 === 0 
          ? `${Math.floor(i/12)}a` 
          : `${Math.floor(i/12)}a${i%12}m`;
      
      results.push({
        month: i,
        monthLabel,
        invested: totalInvested,
        finalValue: portfolioValue,
        earnings: portfolioValue - totalInvested,
        cdiValue,
        poupancaValue,
      });
    }
    
    return results;
  }, [initialValue, monthlyContribution, investmentPeriod, monthlyRate, cdiMonthlyRate]);

  const finalResult = simulationResults[simulationResults.length - 1] || {
    invested: 0,
    finalValue: 0,
    earnings: 0,
    cdiValue: 0,
    poupancaValue: 0,
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handleSimulate = () => {
    if ((parseFloat(initialValue) > 0 || parseFloat(monthlyContribution) > 0) && investmentPeriod[0] > 0) {
      setShowResults(true);
    }
  };

  const handleReset = () => {
    setShowResults(false);
    setInitialValue("");
    setMonthlyContribution("");
    setInvestmentPeriod([12]);
  };

  const periodLabels: { [key: number]: string } = {
    6: "6 meses",
    12: "1 ano",
    24: "2 anos",
    36: "3 anos",
    60: "5 anos",
    120: "10 anos",
    240: "20 anos",
    360: "30 anos",
  };

  const getPeriodLabel = (months: number) => {
    if (months < 12) return `${months} meses`;
    if (months % 12 === 0) return `${months / 12} ${months === 12 ? 'ano' : 'anos'}`;
    return `${Math.floor(months / 12)} anos e ${months % 12} meses`;
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[95vh] bg-[#1a1f2e]">
        <DrawerHeader className="border-b border-white/10 pb-4">
          <DrawerTitle className="text-white flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 flex items-center justify-center">
              <Calculator className="w-5 h-5 text-white" />
            </div>
            Simulador de Investimentos
          </DrawerTitle>
        </DrawerHeader>

        <div className="overflow-y-auto max-h-[calc(95vh-80px)] px-4 py-6 space-y-6">
          <AnimatePresence mode="wait">
            {!showResults ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                {/* Indicadores atuais */}
                <div className="bg-[#252b3d] rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-3">Indicadores atuais do mercado</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <p className="text-xs text-gray-400">SELIC</p>
                      <p className="text-lg font-bold text-white">{economicData.selic}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-400">CDI</p>
                      <p className="text-lg font-bold text-white">{economicData.cdi.toFixed(2)}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-400">IPCA</p>
                      <p className="text-lg font-bold text-white">{economicData.ipca}%</p>
                    </div>
                  </div>
                </div>

                {/* Valor inicial */}
                <div className="space-y-2">
                  <label className="text-sm text-gray-400 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Valor inicial
                  </label>
                  <Input
                    type="number"
                    placeholder="R$ 0,00"
                    value={initialValue}
                    onChange={(e) => setInitialValue(e.target.value)}
                    className="h-12 bg-[#252b3d] border-0 text-white text-lg"
                  />
                </div>

                {/* Aporte mensal */}
                <div className="space-y-2">
                  <label className="text-sm text-gray-400 flex items-center gap-2">
                    <PiggyBank className="w-4 h-4" />
                    Aporte mensal
                  </label>
                  <Input
                    type="number"
                    placeholder="R$ 0,00"
                    value={monthlyContribution}
                    onChange={(e) => setMonthlyContribution(e.target.value)}
                    className="h-12 bg-[#252b3d] border-0 text-white text-lg"
                  />
                </div>

                {/* Período */}
                <div className="space-y-4">
                  <label className="text-sm text-gray-400 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Período: <span className="text-white font-semibold">{getPeriodLabel(investmentPeriod[0])}</span>
                  </label>
                  <Slider
                    value={investmentPeriod}
                    onValueChange={setInvestmentPeriod}
                    min={6}
                    max={360}
                    step={6}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>6m</span>
                    <span>5a</span>
                    <span>10a</span>
                    <span>20a</span>
                    <span>30a</span>
                  </div>
                </div>

                {/* Perfil de investimento */}
                <div className="space-y-3">
                  <label className="text-sm text-gray-400 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Perfil de investimento
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {investmentProfiles.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedProfile(p.id)}
                        className={`p-3 rounded-xl text-left transition-all ${
                          selectedProfile === p.id
                            ? "bg-primary/20 border-2 border-primary"
                            : "bg-[#252b3d] border-2 border-transparent"
                        }`}
                      >
                        <p className={`font-medium text-sm ${selectedProfile === p.id ? "text-primary" : "text-white"}`}>
                          {p.name}
                        </p>
                        <p className="text-xs text-gray-400">{(p.annualReturn * 100).toFixed(0)}% a.a.</p>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    {profile.description}
                  </p>
                </div>

                {/* Botão simular */}
                <Button
                  onClick={handleSimulate}
                  disabled={!initialValue && !monthlyContribution}
                  className="w-full h-14 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-semibold text-lg rounded-xl"
                >
                  Simular investimento
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="results"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Resultado principal */}
                <div className="bg-gradient-to-br from-violet-500/20 to-purple-600/20 rounded-2xl p-5 border border-violet-500/30">
                  <p className="text-sm text-gray-400 mb-1">Valor final estimado</p>
                  <p className="text-3xl font-bold text-white mb-2">
                    {formatCurrency(finalResult.finalValue)}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-emerald-400">
                      +{formatCurrency(finalResult.earnings)} de rendimento
                    </span>
                    <span className="text-xs text-gray-400">
                      ({((finalResult.earnings / finalResult.invested) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>

                {/* Comparativo */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-[#252b3d] rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-400 mb-1">Total investido</p>
                    <p className="text-sm font-semibold text-white">{formatCurrency(finalResult.invested)}</p>
                  </div>
                  <div className="bg-[#252b3d] rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-400 mb-1">No CDI</p>
                    <p className="text-sm font-semibold text-blue-400">{formatCurrency(finalResult.cdiValue)}</p>
                  </div>
                  <div className="bg-[#252b3d] rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-400 mb-1">Na Poupança</p>
                    <p className="text-sm font-semibold text-orange-400">{formatCurrency(finalResult.poupancaValue)}</p>
                  </div>
                </div>

                {/* Vantagem sobre poupança */}
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                  <p className="text-sm text-emerald-400 font-medium">
                    Você ganharia{" "}
                    <span className="text-lg font-bold">
                      {formatCurrency(finalResult.finalValue - finalResult.poupancaValue)}
                    </span>{" "}
                    a mais que na poupança!
                  </p>
                </div>

                {/* Gráfico de evolução */}
                <div className="bg-[#252b3d] rounded-xl p-4">
                  <p className="text-sm text-gray-400 mb-4">Evolução do patrimônio</p>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={simulationResults.filter((_, i) => i % Math.ceil(simulationResults.length / 12) === 0 || i === simulationResults.length - 1)}>
                      <defs>
                        <linearGradient id="gradientFinal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="gradientCDI" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="gradientPoupanca" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="monthLabel" 
                        stroke="#6b7280"
                        tick={{ fill: '#9ca3af', fontSize: 10 }}
                      />
                      <YAxis 
                        stroke="#6b7280"
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                        tick={{ fill: '#9ca3af', fontSize: 10 }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1f2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number, name: string) => [
                          formatCurrency(value),
                          name === 'finalValue' ? 'Seu investimento' :
                          name === 'cdiValue' ? 'CDI' :
                          name === 'poupancaValue' ? 'Poupança' :
                          name === 'invested' ? 'Investido' : name
                        ]}
                        labelFormatter={(label) => `Período: ${label}`}
                      />
                      <Area
                        type="monotone"
                        dataKey="invested"
                        stroke="#6b7280"
                        fill="none"
                        strokeDasharray="5 5"
                        name="invested"
                      />
                      <Area
                        type="monotone"
                        dataKey="poupancaValue"
                        stroke="#f97316"
                        fill="url(#gradientPoupanca)"
                        name="poupancaValue"
                      />
                      <Area
                        type="monotone"
                        dataKey="cdiValue"
                        stroke="#3b82f6"
                        fill="url(#gradientCDI)"
                        name="cdiValue"
                      />
                      <Area
                        type="monotone"
                        dataKey="finalValue"
                        stroke="#8b5cf6"
                        fill="url(#gradientFinal)"
                        strokeWidth={2}
                        name="finalValue"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                  
                  <div className="flex justify-center gap-4 mt-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-violet-500" />
                      <span className="text-xs text-gray-400">{profile.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="text-xs text-gray-400">CDI</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-orange-500" />
                      <span className="text-xs text-gray-400">Poupança</span>
                    </div>
                  </div>
                </div>

                {/* Detalhes da simulação */}
                <div className="bg-[#252b3d] rounded-xl p-4 space-y-3">
                  <p className="text-sm font-medium text-white">Detalhes da simulação</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Valor inicial</span>
                      <span className="text-white">{formatCurrency(parseFloat(initialValue) || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Aporte mensal</span>
                      <span className="text-white">{formatCurrency(parseFloat(monthlyContribution) || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Período</span>
                      <span className="text-white">{getPeriodLabel(investmentPeriod[0])}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Perfil</span>
                      <span className="text-white">{profile.name} ({(profile.annualReturn * 100).toFixed(0)}% a.a.)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Taxa mensal</span>
                      <span className="text-white">{(monthlyRate * 100).toFixed(2)}%</span>
                    </div>
                  </div>
                </div>

                {/* Disclaimer */}
                <p className="text-xs text-gray-500 text-center">
                  Esta simulação é apenas ilustrativa e não garante retornos futuros.
                  Rentabilidade passada não é garantia de rentabilidade futura.
                </p>

                {/* Botão nova simulação */}
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="w-full h-12 border-primary text-primary hover:bg-primary/10"
                >
                  Nova simulação
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default SimuladorDrawer;
