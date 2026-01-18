import { useState, useEffect, useMemo } from "react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { 
  Calculator, 
  ChevronLeft, 
  ChevronDown,
  Info,
  ArrowRight,
  Target,
  TrendingUp,
  Shield,
  Zap,
} from "lucide-react";
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
  Legend,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SimuladorDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const objetivos = [
  { id: "reserva", label: "Reserva de emergência" },
  { id: "aposentadoria", label: "Aposentadoria" },
  { id: "viagem", label: "Viagem" },
  { id: "imovel", label: "Comprar imóvel" },
  { id: "educacao", label: "Educação" },
  { id: "outros", label: "Outros" },
];

const relacaoInvestimentos = [
  { id: "iniciante", label: "Estou começando agora" },
  { id: "basico", label: "Tenho conhecimento básico" },
  { id: "intermediario", label: "Já invisto há algum tempo" },
  { id: "experiente", label: "Sou investidor experiente" },
];

const perfisInvestidor = [
  { 
    id: "conservador", 
    nome: "Conservador", 
    risco: "BAIXO RISCO",
    riscoCor: "bg-emerald-500/20 text-emerald-400",
    descricao: "Investidor com pouca tolerância ao risco, valoriza muito a segurança e busca investimentos com alta liquidez.",
    retornoAnual: 0.12,
    composicao: [
      { nome: "Pós-fixado", percentual: 70, cor: "bg-primary" },
      { nome: "Inflação", percentual: 20, cor: "bg-primary/70" },
      { nome: "Prefixado", percentual: 10, cor: "bg-primary/40" },
    ]
  },
  { 
    id: "moderado", 
    nome: "Moderado", 
    risco: "MÉDIO RISCO",
    riscoCor: "bg-amber-500/20 text-amber-400",
    descricao: "Investidor que valoriza a segurança, mas está disposto a abrir mão dela às vezes para ter retornos melhores.",
    retornoAnual: 0.15,
    composicao: [
      { nome: "Pós-fixado", percentual: 50, cor: "bg-primary" },
      { nome: "Inflação", percentual: 30, cor: "bg-primary/70" },
      { nome: "Multimercado", percentual: 20, cor: "bg-primary/40" },
    ]
  },
  { 
    id: "arrojado", 
    nome: "Arrojado", 
    risco: "ALTO RISCO",
    riscoCor: "bg-red-500/20 text-red-400",
    descricao: "Investidor mais ousado, disposto a assumir mais riscos com seus investimentos em busca de maior rentabilidade.",
    retornoAnual: 0.20,
    composicao: [
      { nome: "Pós-fixado", percentual: 30, cor: "bg-primary" },
      { nome: "Inflação", percentual: 25, cor: "bg-primary/70" },
      { nome: "Ações", percentual: 25, cor: "bg-primary/50" },
      { nome: "Multimercado", percentual: 20, cor: "bg-primary/30" },
    ]
  },
];

const SimuladorDrawer = ({ open, onOpenChange }: SimuladorDrawerProps) => {
  const [step, setStep] = useState(1);
  const totalSteps = 3;
  
  // Step 1 - Valores
  const [initialValue, setInitialValue] = useState("");
  const [monthlyContribution, setMonthlyContribution] = useState("");
  const [investmentPeriod, setInvestmentPeriod] = useState([6]); // months
  
  // Step 2 - Objetivos
  const [objetivo, setObjetivo] = useState("");
  const [relacao, setRelacao] = useState("");
  
  // Step 3 - Resultados
  const [selectedPerfil, setSelectedPerfil] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"projecao" | "liquidez">("projecao");
  
  const [economicData, setEconomicData] = useState({ cdi: 14.15, selic: 15, ipca: 4.5 });

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

  // Reset when closing
  useEffect(() => {
    if (!open) {
      setStep(1);
      setSelectedPerfil(null);
    }
  }, [open]);

  const cdiMonthlyRate = Math.pow(1 + (economicData.cdi / 100), 1/12) - 1;
  const poupancaMonthlyRate = 0.005;

  const calculateScenario = (annualReturn: number, variance: number = 0) => {
    const monthlyRate = Math.pow(1 + annualReturn + variance, 1/12) - 1;
    const initial = parseFloat(initialValue) || 0;
    const monthly = parseFloat(monthlyContribution) || 0;
    const months = investmentPeriod[0];
    
    let value = initial;
    for (let i = 0; i < months; i++) {
      value = (value + monthly) * (1 + monthlyRate);
    }
    return value;
  };

  const calculateChartData = (perfil: typeof perfisInvestidor[0]) => {
    const initial = parseFloat(initialValue) || 0;
    const monthly = parseFloat(monthlyContribution) || 0;
    const months = investmentPeriod[0];
    const monthlyRate = Math.pow(1 + perfil.retornoAnual, 1/12) - 1;
    
    const data = [];
    let portfolioValue = initial;
    let cdiValue = initial;
    let poupancaValue = initial;
    
    for (let i = 0; i <= months; i++) {
      if (i > 0) {
        portfolioValue = (portfolioValue + monthly) * (1 + monthlyRate);
        cdiValue = (cdiValue + monthly) * (1 + cdiMonthlyRate);
        poupancaValue = (poupancaValue + monthly) * (1 + poupancaMonthlyRate);
      }
      
      if (i === 0 || i === months || i % Math.max(1, Math.floor(months / 6)) === 0) {
        data.push({
          month: i,
          label: i === 0 ? "Hoje" : i < 12 ? `${i}m` : `${Math.floor(i/12)}a${i%12 > 0 ? i%12 + 'm' : ''}`,
          esperado: portfolioValue,
          cdi: cdiValue,
          poupanca: poupancaValue,
        });
      }
    }
    return data;
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const getPeriodLabel = (months: number) => {
    if (months < 12) return `${months} meses`;
    if (months % 12 === 0) return `${months / 12} ${months === 12 ? 'ano' : 'anos'}`;
    return `${Math.floor(months / 12)} anos e ${months % 12} meses`;
  };

  const canAdvance = () => {
    if (step === 1) return (parseFloat(initialValue) > 0 || parseFloat(monthlyContribution) > 0);
    if (step === 2) return objetivo !== "" && relacao !== "";
    return true;
  };

  const handleNext = () => {
    if (step < totalSteps && canAdvance()) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setSelectedPerfil(null);
    } else {
      onOpenChange(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[95vh] bg-background border-t border-border">
        {/* Hero Header */}
        <div className="relative bg-gradient-to-br from-primary/30 via-primary/20 to-background px-4 pt-4 pb-6">
          <button 
            onClick={handleBack}
            className="absolute left-4 top-4 p-2 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="pt-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {step === 3 ? "Vamos lá! Já temos o investimento ideal para você" : "Simulador de Investimentos"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {step === 3 
                ? "Confira as orientações do Simulador e conte sempre com a ajuda da Bianca, sua consultora IA!"
                : "Simule agora mesmo uma carteira de investimentos com alto potencial"
              }
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        {step < 3 && (
          <div className="px-4 py-3 bg-card">
            <p className="text-sm text-muted-foreground mb-2">Etapa {step} de {totalSteps}</p>
            <div className="flex gap-2">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 h-1 rounded-full transition-all ${
                    i < step ? "bg-primary" : "bg-muted"
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        <div className="overflow-y-auto max-h-[calc(95vh-180px)] px-4 py-6">
          <AnimatePresence mode="wait">
            {/* Step 1 - Valores */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="bg-card border border-border rounded-2xl p-5 space-y-6">
                  <h2 className="text-lg font-semibold text-foreground">
                    Simule sua carteira personalizada
                  </h2>

                  {/* Valor inicial */}
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">
                      Valor do investimento inicial
                    </label>
                    <div className="flex items-center gap-2 border-b border-border pb-2">
                      <span className="text-muted-foreground">R$</span>
                      <Input
                        type="number"
                        placeholder="0,00"
                        value={initialValue}
                        onChange={(e) => setInitialValue(e.target.value)}
                        className="border-0 bg-transparent text-lg font-medium text-primary p-0 h-auto focus-visible:ring-0"
                      />
                    </div>
                  </div>

                  {/* Aporte mensal */}
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">
                      Valor das aplicações mensais
                    </label>
                    <div className="flex items-center gap-2 border-b border-border pb-2">
                      <span className="text-muted-foreground">R$</span>
                      <Input
                        type="number"
                        placeholder="0,00"
                        value={monthlyContribution}
                        onChange={(e) => setMonthlyContribution(e.target.value)}
                        className="border-0 bg-transparent text-lg font-medium text-primary p-0 h-auto focus-visible:ring-0"
                      />
                    </div>
                  </div>

                  {/* Período */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-sm text-muted-foreground">
                        Duração do investimento
                      </label>
                      <span className="text-sm font-medium text-foreground">
                        {getPeriodLabel(investmentPeriod[0])}
                      </span>
                    </div>
                    <Slider
                      value={investmentPeriod}
                      onValueChange={setInvestmentPeriod}
                      min={6}
                      max={360}
                      step={6}
                      className="w-full"
                    />
                  </div>

                  {/* Botão */}
                  <Button
                    onClick={handleNext}
                    disabled={!canAdvance()}
                    className="w-full h-12 bg-muted hover:bg-muted/80 text-foreground font-medium rounded-xl"
                  >
                    Iniciar simulação
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 2 - Objetivos */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="bg-card border border-border rounded-2xl p-5 space-y-6">
                  {/* Objetivo */}
                  <div className="space-y-3">
                    <h3 className="text-foreground font-medium">
                      Qual é o seu principal objetivo com este investimento?
                    </h3>
                    <Select value={objetivo} onValueChange={setObjetivo}>
                      <SelectTrigger className="w-full h-12 border-0 border-b border-border rounded-none bg-transparent text-primary focus:ring-0">
                        <SelectValue placeholder="Objetivo *" />
                      </SelectTrigger>
                      <SelectContent>
                        {objetivos.map((obj) => (
                          <SelectItem key={obj.id} value={obj.id}>
                            {obj.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Relação com investimentos */}
                  <div className="space-y-3">
                    <h3 className="text-foreground font-medium">
                      Qual sua relação com investimentos?
                    </h3>
                    <Select value={relacao} onValueChange={setRelacao}>
                      <SelectTrigger className="w-full h-12 border-0 border-b border-border rounded-none bg-transparent text-primary focus:ring-0">
                        <SelectValue placeholder="Relação com investimentos *" />
                      </SelectTrigger>
                      <SelectContent>
                        {relacaoInvestimentos.map((rel) => (
                          <SelectItem key={rel.id} value={rel.id}>
                            {rel.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3 - Resultados */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Perfil Badge e Título */}
                <div className="space-y-2">
                  <span className="inline-block bg-muted text-muted-foreground text-xs font-medium px-3 py-1 rounded-full uppercase">
                    {selectedPerfil ? perfisInvestidor.find(p => p.id === selectedPerfil)?.risco : "SUGESTÃO PERSONALIZADA"}
                  </span>
                  <h2 className="text-xl font-bold text-foreground">
                    Sugestão personalizada Kadig
                  </h2>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 border-b border-border">
                  <button
                    onClick={() => setActiveTab("projecao")}
                    className={`pb-3 text-sm font-medium transition-colors ${
                      activeTab === "projecao" 
                        ? "text-foreground border-b-2 border-primary" 
                        : "text-muted-foreground"
                    }`}
                  >
                    Projeção
                  </button>
                  <button
                    onClick={() => setActiveTab("liquidez")}
                    className={`pb-3 text-sm font-medium transition-colors ${
                      activeTab === "liquidez" 
                        ? "text-foreground border-b-2 border-primary" 
                        : "text-muted-foreground"
                    }`}
                  >
                    Liquidez
                  </button>
                </div>

                {activeTab === "projecao" && (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Confira a projeção que fizemos para o rendimento da carteira ideal recomendada para cada perfil. Os cenários estimados são baseados para produtos e prazos selecionados de acordo com as suas respostas.
                    </p>

                    {/* Resumo dos valores */}
                    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Ao final de</p>
                        <p className="text-xl font-bold text-primary">{getPeriodLabel(investmentPeriod[0])}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">com um investimento inicial de</p>
                        <p className="text-xl font-bold text-primary">{formatCurrency(parseFloat(initialValue) || 0)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">e investindo mensalmente</p>
                        <p className="text-xl font-bold text-primary">{formatCurrency(parseFloat(monthlyContribution) || 0)}</p>
                      </div>
                      
                      {selectedPerfil && (
                        <>
                          <div className="pt-4 border-t border-border space-y-1">
                            <p className="text-sm text-muted-foreground">Você terá, no cenário esperado,</p>
                            <p className="text-xl font-bold text-primary">
                              {formatCurrency(calculateScenario(perfisInvestidor.find(p => p.id === selectedPerfil)!.retornoAnual))}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">no cenário pessimista</p>
                            <p className="text-lg font-semibold text-primary/80">
                              {formatCurrency(calculateScenario(perfisInvestidor.find(p => p.id === selectedPerfil)!.retornoAnual, -0.02))}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">e no cenário otimista</p>
                            <p className="text-lg font-semibold text-primary/80">
                              {formatCurrency(calculateScenario(perfisInvestidor.find(p => p.id === selectedPerfil)!.retornoAnual, 0.03))}
                            </p>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Gráfico */}
                    {selectedPerfil && (
                      <div className="bg-card border border-border rounded-2xl p-4">
                        <ResponsiveContainer width="100%" height={220}>
                          <LineChart data={calculateChartData(perfisInvestidor.find(p => p.id === selectedPerfil)!)}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis 
                              dataKey="label" 
                              stroke="hsl(var(--muted-foreground))"
                              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                            />
                            <YAxis 
                              stroke="hsl(var(--muted-foreground))"
                              tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)} K`}
                              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                            />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'hsl(var(--card))', 
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                              }}
                              formatter={(value: number) => [formatCurrency(value)]}
                            />
                            <Line
                              type="monotone"
                              dataKey="esperado"
                              stroke="hsl(var(--primary))"
                              strokeWidth={2}
                              dot={false}
                              name="Cenário esperado"
                            />
                            <Line
                              type="monotone"
                              dataKey="cdi"
                              stroke="hsl(var(--muted-foreground))"
                              strokeWidth={1}
                              strokeDasharray="5 5"
                              dot={false}
                              name="CDI"
                            />
                            <Line
                              type="monotone"
                              dataKey="poupanca"
                              stroke="hsl(var(--muted-foreground))"
                              strokeWidth={1}
                              strokeDasharray="3 3"
                              dot={false}
                              name="Poupança"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                        
                        <div className="flex justify-center gap-4 mt-3 text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-0.5 bg-primary" />
                            <span className="text-muted-foreground">Cenário esperado</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-0.5 bg-muted-foreground border-dashed" style={{ borderTop: '2px dashed' }} />
                            <span className="text-muted-foreground">CDI</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-0.5 bg-muted-foreground opacity-50" />
                            <span className="text-muted-foreground">Poupança</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Composição da carteira */}
                    {selectedPerfil && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-bold text-foreground">
                          Composição da carteira recomendada
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Confira a distribuição ideal de cada produto selecionado para atender a sua expectativa de rendimento.
                        </p>
                        
                        <div className="space-y-3">
                          {perfisInvestidor.find(p => p.id === selectedPerfil)?.composicao.map((item, index) => (
                            <div key={index} className="flex items-center gap-3 bg-card border border-border rounded-xl p-3">
                              <div 
                                className={`h-12 rounded-lg ${item.cor}`}
                                style={{ width: `${item.percentual}%`, minWidth: '40px' }}
                              />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-foreground">{item.nome}</p>
                                <p className="text-xs text-muted-foreground">
                                  {item.percentual}% • {formatCurrency((parseFloat(initialValue) || 0) * item.percentual / 100)}
                                </p>
                              </div>
                              <ChevronDown className="w-5 h-5 text-muted-foreground" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Perfis do investidor */}
                    <div className="space-y-4 pt-4">
                      <h3 className="text-lg font-bold text-foreground">
                        Perfil do investidor
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Selecione os cards para ver detalhes de cada perfil. Confira as projeções esperadas em diferentes cenários e, caso você queira mudar de perfil, basta editar as respostas.
                      </p>

                      <div className="space-y-4">
                        {perfisInvestidor.map((perfil) => {
                          const pessimista = calculateScenario(perfil.retornoAnual, -0.02);
                          const esperado = calculateScenario(perfil.retornoAnual);
                          const otimista = calculateScenario(perfil.retornoAnual, 0.03);
                          const isSelected = selectedPerfil === perfil.id;
                          const maxValue = otimista;

                          return (
                            <button
                              key={perfil.id}
                              onClick={() => setSelectedPerfil(perfil.id)}
                              className={`w-full text-left bg-card border rounded-2xl p-5 transition-all ${
                                isSelected ? "border-primary ring-2 ring-primary/20" : "border-border"
                              }`}
                            >
                              <span className={`inline-block text-xs font-medium px-3 py-1 rounded-full mb-3 ${perfil.riscoCor}`}>
                                {perfil.risco}
                              </span>
                              <h4 className="text-xl font-bold text-foreground mb-2">{perfil.nome}</h4>
                              <p className="text-sm text-muted-foreground mb-4">{perfil.descricao}</p>

                              {/* Cenários com barras */}
                              <div className="space-y-3">
                                <div>
                                  <p className="text-sm text-muted-foreground mb-1">
                                    Cenário pessimista: <span className="text-foreground font-medium">{formatCurrency(pessimista)}</span>
                                  </p>
                                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-primary/40 rounded-full"
                                      style={{ width: `${(pessimista / maxValue) * 100}%` }}
                                    />
                                  </div>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground mb-1">
                                    Cenário esperado: <span className="text-foreground font-medium">{formatCurrency(esperado)}</span>
                                  </p>
                                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-primary/70 rounded-full"
                                      style={{ width: `${(esperado / maxValue) * 100}%` }}
                                    />
                                  </div>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground mb-1">
                                    Cenário otimista: <span className="text-foreground font-medium">{formatCurrency(otimista)}</span>
                                  </p>
                                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-primary rounded-full"
                                      style={{ width: `${(otimista / maxValue) * 100}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Disclaimer */}
                    <div className="bg-muted/30 rounded-xl p-4 flex gap-3">
                      <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-muted-foreground">
                        O Simulador de Investimentos é uma mera ferramenta de simulação, não configurando a abertura ou compromisso de início de relacionamento com o Kadig tampouco oferta de qualquer produto e/ou serviço. Os resultados deste simulador são apenas exemplificativos, não servindo como parâmetro de conferência para transações passadas ou futuras. A rentabilidade divulgada não é livre de impostos. O simulador acima é meramente ilustrativo.
                      </p>
                    </div>
                  </>
                )}

                {activeTab === "liquidez" && (
                  <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Liquidez dos investimentos</h3>
                    <p className="text-sm text-muted-foreground">
                      A liquidez representa a facilidade de converter seu investimento em dinheiro. Quanto maior a liquidez, mais rápido você pode resgatar.
                    </p>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-muted/30 rounded-xl">
                        <span className="text-sm text-foreground">Pós-fixado</span>
                        <span className="text-xs text-emerald-400">D+0 a D+1</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted/30 rounded-xl">
                        <span className="text-sm text-foreground">Inflação</span>
                        <span className="text-xs text-amber-400">D+30</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted/30 rounded-xl">
                        <span className="text-sm text-foreground">Multimercado</span>
                        <span className="text-xs text-red-400">D+30 a D+60</span>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Buttons */}
        {step < 3 && (
          <div className="p-4 bg-card border-t border-border flex gap-3 safe-area-inset-bottom">
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex-1 h-12 border-border"
            >
              Voltar
            </Button>
            <Button
              onClick={handleNext}
              disabled={!canAdvance()}
              className="flex-1 h-12 bg-primary hover:bg-primary/90"
            >
              Avançar
            </Button>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
};

export default SimuladorDrawer;
