import { useState, useEffect, useMemo } from "react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { 
  Calculator, 
  ChevronLeft, 
  ChevronDown,
  ChevronUp,
  Info,
  ArrowRight,
  Landmark,
  TrendingUp,
  Shield,
  Wallet,
  PiggyBank,
  Building2,
  Percent,
  Clock,
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

// Ativos detalhados por categoria
const ativosRendaFixa = [
  { 
    id: "tesouro_selic", 
    nome: "Tesouro SELIC", 
    tipo: "Título Público",
    rentabilidade: "SELIC",
    liquidez: "D+1",
    risco: "Muito Baixo",
    minimo: 30,
    descricao: "Título pós-fixado atrelado à taxa SELIC, ideal para reserva de emergência."
  },
  { 
    id: "tesouro_ipca", 
    nome: "Tesouro IPCA+", 
    tipo: "Título Público",
    rentabilidade: "IPCA + 6% a.a.",
    liquidez: "D+1",
    risco: "Baixo",
    minimo: 30,
    descricao: "Protege contra inflação com rentabilidade real garantida no vencimento."
  },
  { 
    id: "tesouro_prefixado", 
    nome: "Tesouro Prefixado", 
    tipo: "Título Público",
    rentabilidade: "12% a 14% a.a.",
    liquidez: "D+1",
    risco: "Baixo",
    minimo: 30,
    descricao: "Taxa fixa definida no momento da compra, ideal para cenários de queda de juros."
  },
  { 
    id: "cdb", 
    nome: "CDB (Certificado de Depósito Bancário)", 
    tipo: "Renda Fixa Bancária",
    rentabilidade: "100% a 120% CDI",
    liquidez: "D+0 a vencimento",
    risco: "Baixo",
    minimo: 1000,
    descricao: "Emitido por bancos, possui garantia do FGC até R$ 250 mil."
  },
  { 
    id: "lci", 
    nome: "LCI (Letra de Crédito Imobiliário)", 
    tipo: "Renda Fixa Bancária",
    rentabilidade: "90% a 100% CDI",
    liquidez: "90 dias a vencimento",
    risco: "Baixo",
    minimo: 1000,
    descricao: "Isento de IR para pessoa física, garantia do FGC."
  },
  { 
    id: "lca", 
    nome: "LCA (Letra de Crédito do Agronegócio)", 
    tipo: "Renda Fixa Bancária",
    rentabilidade: "90% a 100% CDI",
    liquidez: "90 dias a vencimento",
    risco: "Baixo",
    minimo: 1000,
    descricao: "Isento de IR para pessoa física, voltado ao agronegócio."
  },
  { 
    id: "debentures", 
    nome: "Debêntures", 
    tipo: "Crédito Privado",
    rentabilidade: "CDI + 1% a 3%",
    liquidez: "Baixa",
    risco: "Médio",
    minimo: 1000,
    descricao: "Títulos de dívida de empresas, maior rentabilidade com maior risco."
  },
  { 
    id: "cri", 
    nome: "CRI (Certificado de Recebíveis Imobiliários)", 
    tipo: "Crédito Privado",
    rentabilidade: "CDI + 1% a 4%",
    liquidez: "Baixa",
    risco: "Médio",
    minimo: 1000,
    descricao: "Isento de IR, lastreado em créditos imobiliários."
  },
  { 
    id: "cra", 
    nome: "CRA (Certificado de Recebíveis do Agronegócio)", 
    tipo: "Crédito Privado",
    rentabilidade: "CDI + 1% a 4%",
    liquidez: "Baixa",
    risco: "Médio",
    minimo: 1000,
    descricao: "Isento de IR, lastreado em créditos do agronegócio."
  },
];

const ativosFundos = [
  { 
    id: "fundo_rf", 
    nome: "Fundos de Renda Fixa", 
    tipo: "Fundo de Investimento",
    rentabilidade: "100% a 105% CDI",
    liquidez: "D+0 a D+5",
    risco: "Baixo",
    taxaAdm: "0.3% a 1% a.a.",
    descricao: "Investem majoritariamente em títulos de renda fixa."
  },
  { 
    id: "fundo_di", 
    nome: "Fundos DI", 
    tipo: "Fundo de Investimento",
    rentabilidade: "100% CDI",
    liquidez: "D+0",
    risco: "Muito Baixo",
    taxaAdm: "0.2% a 0.5% a.a.",
    descricao: "Acompanham a taxa DI, alta liquidez e segurança."
  },
  { 
    id: "fundo_multimercado", 
    nome: "Fundos Multimercado", 
    tipo: "Fundo de Investimento",
    rentabilidade: "CDI + 2% a 8%",
    liquidez: "D+30 a D+60",
    risco: "Médio a Alto",
    taxaAdm: "1% a 2% a.a. + performance",
    descricao: "Estratégias diversificadas em múltiplos mercados."
  },
  { 
    id: "fundo_acoes", 
    nome: "Fundos de Ações", 
    tipo: "Fundo de Investimento",
    rentabilidade: "Variável (IBOV + alpha)",
    liquidez: "D+30",
    risco: "Alto",
    taxaAdm: "1.5% a 2.5% a.a. + performance",
    descricao: "Investem no mínimo 67% em ações do mercado."
  },
  { 
    id: "fundo_imobiliario", 
    nome: "Fundos Imobiliários (FIIs)", 
    tipo: "Fundo de Investimento",
    rentabilidade: "Dividendos + valorização",
    liquidez: "D+2 (negociado em bolsa)",
    risco: "Médio",
    taxaAdm: "0.5% a 1.5% a.a.",
    descricao: "Investem em imóveis ou títulos imobiliários, pagam dividendos mensais."
  },
  { 
    id: "etf", 
    nome: "ETFs (Fundos de Índice)", 
    tipo: "Fundo de Investimento",
    rentabilidade: "Acompanha o índice",
    liquidez: "D+2 (negociado em bolsa)",
    risco: "Médio a Alto",
    taxaAdm: "0.2% a 0.6% a.a.",
    descricao: "Replicam índices como IBOV, S&P 500, etc."
  },
];

const ativosPrevidencia = [
  { 
    id: "pgbl", 
    nome: "PGBL (Plano Gerador de Benefício Livre)", 
    tipo: "Previdência Privada",
    rentabilidade: "Varia conforme o fundo",
    beneficioFiscal: "Dedução de até 12% da renda bruta no IR",
    indicado: "Declaração completa do IR",
    taxas: "Administração + Carregamento",
    descricao: "Ideal para quem faz declaração completa e quer deduzir no IR."
  },
  { 
    id: "vgbl", 
    nome: "VGBL (Vida Gerador de Benefício Livre)", 
    tipo: "Previdência Privada",
    rentabilidade: "Varia conforme o fundo",
    beneficioFiscal: "IR apenas sobre os rendimentos",
    indicado: "Declaração simplificada ou já esgotou limite PGBL",
    taxas: "Administração + Carregamento",
    descricao: "Mais flexível, IR incide apenas sobre o rendimento."
  },
];

const ativosRendaVariavel = [
  { 
    id: "acoes", 
    nome: "Ações", 
    tipo: "Renda Variável",
    rentabilidade: "Variável",
    liquidez: "D+2",
    risco: "Alto",
    descricao: "Participação societária em empresas listadas na bolsa."
  },
  { 
    id: "bdrs", 
    nome: "BDRs (Brazilian Depositary Receipts)", 
    tipo: "Renda Variável",
    rentabilidade: "Variável",
    liquidez: "D+2",
    risco: "Alto",
    descricao: "Certificados de ações estrangeiras negociados na B3."
  },
  { 
    id: "criptoativos", 
    nome: "Criptoativos", 
    tipo: "Ativos Digitais",
    rentabilidade: "Alta volatilidade",
    liquidez: "Imediata",
    risco: "Muito Alto",
    descricao: "Bitcoin, Ethereum e outras criptomoedas."
  },
];

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
    retornoAnual: { pessimista: 0.10, esperado: 0.12, otimista: 0.14 },
    composicao: [
      { categoria: "Renda Fixa Pós-fixada", percentual: 50, cor: "bg-primary", ativos: ["Tesouro SELIC", "CDB", "Fundos DI"] },
      { categoria: "Renda Fixa Inflação", percentual: 30, cor: "bg-primary/70", ativos: ["Tesouro IPCA+", "LCI", "LCA"] },
      { categoria: "Renda Fixa Prefixada", percentual: 15, cor: "bg-primary/50", ativos: ["Tesouro Prefixado", "CDB Prefixado"] },
      { categoria: "Previdência", percentual: 5, cor: "bg-primary/30", ativos: ["PGBL/VGBL Renda Fixa"] },
    ]
  },
  { 
    id: "moderado", 
    nome: "Moderado", 
    risco: "MÉDIO RISCO",
    riscoCor: "bg-amber-500/20 text-amber-400",
    descricao: "Investidor que valoriza a segurança, mas está disposto a abrir mão dela às vezes para ter retornos melhores.",
    retornoAnual: { pessimista: 0.12, esperado: 0.15, otimista: 0.18 },
    composicao: [
      { categoria: "Renda Fixa Pós-fixada", percentual: 35, cor: "bg-primary", ativos: ["Tesouro SELIC", "CDB", "LCI/LCA"] },
      { categoria: "Renda Fixa Inflação", percentual: 25, cor: "bg-primary/70", ativos: ["Tesouro IPCA+", "Debêntures Incentivadas"] },
      { categoria: "Fundos Multimercado", percentual: 20, cor: "bg-primary/50", ativos: ["Fundos Macro", "Fundos Long & Short"] },
      { categoria: "Fundos Imobiliários", percentual: 10, cor: "bg-primary/40", ativos: ["FIIs de Tijolo", "FIIs de Papel"] },
      { categoria: "Previdência", percentual: 10, cor: "bg-primary/30", ativos: ["PGBL/VGBL Multimercado"] },
    ]
  },
  { 
    id: "arrojado", 
    nome: "Arrojado", 
    risco: "ALTO RISCO",
    riscoCor: "bg-red-500/20 text-red-400",
    descricao: "Investidor mais ousado, disposto a assumir mais riscos com seus investimentos em busca de maior rentabilidade.",
    retornoAnual: { pessimista: 0.10, esperado: 0.20, otimista: 0.30 },
    composicao: [
      { categoria: "Renda Fixa", percentual: 20, cor: "bg-primary", ativos: ["Tesouro SELIC", "CDB", "Debêntures"] },
      { categoria: "Fundos Multimercado", percentual: 20, cor: "bg-primary/70", ativos: ["Fundos Macro", "Fundos Quantitativos"] },
      { categoria: "Ações Nacionais", percentual: 25, cor: "bg-primary/50", ativos: ["Ações Blue Chips", "Small Caps", "ETFs"] },
      { categoria: "Fundos Imobiliários", percentual: 15, cor: "bg-primary/40", ativos: ["FIIs Diversos", "FOFs"] },
      { categoria: "Ações Internacionais", percentual: 10, cor: "bg-primary/30", ativos: ["BDRs", "ETFs Internacionais"] },
      { categoria: "Previdência", percentual: 10, cor: "bg-primary/20", ativos: ["PGBL/VGBL Ações"] },
    ]
  },
];

const SimuladorDrawer = ({ open, onOpenChange }: SimuladorDrawerProps) => {
  const [step, setStep] = useState(1);
  const totalSteps = 3;
  
  // Step 1 - Valores
  const [initialValue, setInitialValue] = useState("");
  const [monthlyContribution, setMonthlyContribution] = useState("");
  const [investmentPeriod, setInvestmentPeriod] = useState([6]);
  
  // Step 2 - Objetivos
  const [objetivo, setObjetivo] = useState("");
  const [relacao, setRelacao] = useState("");
  
  // Step 3 - Resultados
  const [selectedPerfil, setSelectedPerfil] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"projecao" | "ativos" | "liquidez">("projecao");
  const [expandedCategoria, setExpandedCategoria] = useState<string | null>(null);
  const [expandedAtivoCategoria, setExpandedAtivoCategoria] = useState<string | null>(null);
  
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
      setExpandedCategoria(null);
      setExpandedAtivoCategoria(null);
    }
  }, [open]);

  // CÁLCULOS CORRETOS - Fórmula de Juros Compostos com Aportes
  // FV = P * (1 + r)^n + PMT * [((1 + r)^n - 1) / r]
  // Onde: FV = Valor Futuro, P = Principal, PMT = Aporte Mensal, r = taxa mensal, n = meses
  const calculateFutureValue = (annualRate: number) => {
    const initial = parseFloat(initialValue) || 0;
    const monthly = parseFloat(monthlyContribution) || 0;
    const months = investmentPeriod[0];
    
    // Taxa mensal equivalente (conversão correta de taxa anual para mensal)
    const monthlyRate = Math.pow(1 + annualRate, 1/12) - 1;
    
    if (monthlyRate === 0) {
      return initial + (monthly * months);
    }
    
    // Valor futuro do principal
    const fvPrincipal = initial * Math.pow(1 + monthlyRate, months);
    
    // Valor futuro dos aportes (série de pagamentos - anuidade)
    const fvAportes = monthly * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
    
    return fvPrincipal + fvAportes;
  };

  // Cálculo do total investido
  const totalInvested = useMemo(() => {
    const initial = parseFloat(initialValue) || 0;
    const monthly = parseFloat(monthlyContribution) || 0;
    return initial + (monthly * investmentPeriod[0]);
  }, [initialValue, monthlyContribution, investmentPeriod]);

  // Cálculos para CDI e Poupança
  const cdiAnnualRate = economicData.cdi / 100;
  const poupancaAnnualRate = 0.0617; // ~6.17% a.a. (0.5% a.m.)
  
  const cdiMonthlyRate = Math.pow(1 + cdiAnnualRate, 1/12) - 1;
  const poupancaMonthlyRate = 0.005;

  const calculateChartData = (perfil: typeof perfisInvestidor[0]) => {
    const initial = parseFloat(initialValue) || 0;
    const monthly = parseFloat(monthlyContribution) || 0;
    const months = investmentPeriod[0];
    
    const monthlyRateEsperado = Math.pow(1 + perfil.retornoAnual.esperado, 1/12) - 1;
    
    const data = [];
    let portfolioValue = initial;
    let cdiValue = initial;
    let poupancaValue = initial;
    
    // Adicionar ponto inicial
    data.push({
      month: 0,
      label: "Hoje",
      esperado: initial,
      cdi: initial,
      poupanca: initial,
      investido: initial,
    });
    
    for (let i = 1; i <= months; i++) {
      // Aplicar juros compostos mês a mês
      portfolioValue = portfolioValue * (1 + monthlyRateEsperado) + monthly;
      cdiValue = cdiValue * (1 + cdiMonthlyRate) + monthly;
      poupancaValue = poupancaValue * (1 + poupancaMonthlyRate) + monthly;
      
      const totalInvestedAtMonth = initial + (monthly * i);
      
      // Adicionar apenas pontos relevantes para não poluir o gráfico
      if (i === months || i % Math.max(1, Math.floor(months / 8)) === 0) {
        data.push({
          month: i,
          label: i < 12 ? `${i}m` : i % 12 === 0 ? `${i/12}a` : `${Math.floor(i/12)}a${i%12}m`,
          esperado: portfolioValue,
          cdi: cdiValue,
          poupanca: poupancaValue,
          investido: totalInvestedAtMonth,
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

  const getPerfilSelected = () => perfisInvestidor.find(p => p.id === selectedPerfil);

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
                {/* Indicadores atuais */}
                <div className="bg-card border border-border rounded-xl p-4">
                  <p className="text-xs text-muted-foreground mb-3">Indicadores atuais do mercado</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">SELIC</p>
                      <p className="text-lg font-bold text-foreground">{economicData.selic}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">CDI</p>
                      <p className="text-lg font-bold text-foreground">{economicData.cdi.toFixed(2)}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">IPCA</p>
                      <p className="text-lg font-bold text-foreground">{economicData.ipca}%</p>
                    </div>
                  </div>
                </div>

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
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>6m</span>
                      <span>5a</span>
                      <span>10a</span>
                      <span>20a</span>
                      <span>30a</span>
                    </div>
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
                {/* Badge e Título */}
                <div className="space-y-2">
                  <span className="inline-block bg-muted text-muted-foreground text-xs font-medium px-3 py-1 rounded-full uppercase">
                    {selectedPerfil ? getPerfilSelected()?.risco : "SUGESTÃO PERSONALIZADA"}
                  </span>
                  <h2 className="text-xl font-bold text-foreground">
                    Sugestão personalizada Kadig
                  </h2>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 border-b border-border">
                  {[
                    { id: "projecao", label: "Projeção" },
                    { id: "ativos", label: "Ativos" },
                    { id: "liquidez", label: "Liquidez" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`pb-3 text-sm font-medium transition-colors ${
                        activeTab === tab.id 
                          ? "text-foreground border-b-2 border-primary" 
                          : "text-muted-foreground"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab Projeção */}
                {activeTab === "projecao" && (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Confira a projeção que fizemos para o rendimento da carteira ideal. Os cenários são baseados nas taxas atuais de mercado e no seu perfil.
                    </p>

                    {/* Resumo */}
                    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Período</p>
                          <p className="text-xl font-bold text-primary">{getPeriodLabel(investmentPeriod[0])}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total investido</p>
                          <p className="text-xl font-bold text-foreground">{formatCurrency(totalInvested)}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Inicial</p>
                          <p className="text-lg font-semibold text-primary">{formatCurrency(parseFloat(initialValue) || 0)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Mensal</p>
                          <p className="text-lg font-semibold text-primary">{formatCurrency(parseFloat(monthlyContribution) || 0)}</p>
                        </div>
                      </div>
                      
                      {selectedPerfil && (
                        <div className="pt-4 border-t border-border space-y-3">
                          <div>
                            <p className="text-sm text-muted-foreground">Cenário esperado</p>
                            <p className="text-2xl font-bold text-primary">
                              {formatCurrency(calculateFutureValue(getPerfilSelected()!.retornoAnual.esperado))}
                            </p>
                            <p className="text-xs text-emerald-400">
                              +{formatCurrency(calculateFutureValue(getPerfilSelected()!.retornoAnual.esperado) - totalInvested)} de rendimento
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-muted-foreground">Pessimista</p>
                              <p className="text-lg font-semibold text-foreground">
                                {formatCurrency(calculateFutureValue(getPerfilSelected()!.retornoAnual.pessimista))}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Otimista</p>
                              <p className="text-lg font-semibold text-foreground">
                                {formatCurrency(calculateFutureValue(getPerfilSelected()!.retornoAnual.otimista))}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Comparativo */}
                    {selectedPerfil && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-card border border-border rounded-xl p-3">
                          <p className="text-xs text-muted-foreground mb-1">No CDI ({economicData.cdi.toFixed(1)}% a.a.)</p>
                          <p className="text-sm font-semibold text-foreground">{formatCurrency(calculateFutureValue(cdiAnnualRate))}</p>
                        </div>
                        <div className="bg-card border border-border rounded-xl p-3">
                          <p className="text-xs text-muted-foreground mb-1">Na Poupança (~6.17% a.a.)</p>
                          <p className="text-sm font-semibold text-foreground">{formatCurrency(calculateFutureValue(poupancaAnnualRate))}</p>
                        </div>
                      </div>
                    )}

                    {/* Gráfico */}
                    {selectedPerfil && (
                      <div className="bg-card border border-border rounded-2xl p-4">
                        <p className="text-sm font-medium text-foreground mb-3">Evolução do patrimônio</p>
                        <ResponsiveContainer width="100%" height={220}>
                          <LineChart data={calculateChartData(getPerfilSelected()!)}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis 
                              dataKey="label" 
                              stroke="hsl(var(--muted-foreground))"
                              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                            />
                            <YAxis 
                              stroke="hsl(var(--muted-foreground))"
                              tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                            />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'hsl(var(--card))', 
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                              }}
                              formatter={(value: number, name: string) => [
                                formatCurrency(value),
                                name === 'esperado' ? 'Carteira' :
                                name === 'cdi' ? 'CDI' :
                                name === 'poupanca' ? 'Poupança' :
                                name === 'investido' ? 'Investido' : name
                              ]}
                            />
                            <Line type="monotone" dataKey="investido" stroke="hsl(var(--muted-foreground))" strokeWidth={1} strokeDasharray="5 5" dot={false} name="investido" />
                            <Line type="monotone" dataKey="poupanca" stroke="#f97316" strokeWidth={1.5} dot={false} name="poupanca" />
                            <Line type="monotone" dataKey="cdi" stroke="#3b82f6" strokeWidth={1.5} dot={false} name="cdi" />
                            <Line type="monotone" dataKey="esperado" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="esperado" />
                          </LineChart>
                        </ResponsiveContainer>
                        
                        <div className="flex flex-wrap justify-center gap-4 mt-3 text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-0.5 bg-primary" />
                            <span className="text-muted-foreground">Carteira</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-0.5 bg-blue-500" />
                            <span className="text-muted-foreground">CDI</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-0.5 bg-orange-500" />
                            <span className="text-muted-foreground">Poupança</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-0.5 bg-muted-foreground border-dashed" style={{ borderTop: '2px dashed' }} />
                            <span className="text-muted-foreground">Investido</span>
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
                          Distribuição ideal de cada categoria para atender seu perfil e objetivos.
                        </p>
                        
                        <div className="space-y-2">
                          {getPerfilSelected()?.composicao.map((item, index) => {
                            const valorAlocado = totalInvested * (item.percentual / 100);
                            const isExpanded = expandedCategoria === item.categoria;
                            
                            return (
                              <div key={index} className="bg-card border border-border rounded-xl overflow-hidden">
                                <button
                                  onClick={() => setExpandedCategoria(isExpanded ? null : item.categoria)}
                                  className="w-full flex items-center gap-3 p-3"
                                >
                                  <div 
                                    className={`h-10 rounded-lg ${item.cor}`}
                                    style={{ width: `${Math.max(item.percentual, 15)}%`, minWidth: '30px' }}
                                  />
                                  <div className="flex-1 text-left">
                                    <p className="text-sm font-medium text-foreground">{item.categoria}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {item.percentual}% • {formatCurrency(valorAlocado)}
                                    </p>
                                  </div>
                                  {isExpanded ? (
                                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                                  ) : (
                                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                                  )}
                                </button>
                                
                                {isExpanded && (
                                  <div className="px-3 pb-3 pt-1 border-t border-border">
                                    <p className="text-xs text-muted-foreground mb-2">Ativos recomendados:</p>
                                    <div className="flex flex-wrap gap-2">
                                      {item.ativos.map((ativo, i) => (
                                        <span key={i} className="text-xs bg-muted px-2 py-1 rounded-lg text-foreground">
                                          {ativo}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Perfis do investidor */}
                    <div className="space-y-4 pt-4">
                      <h3 className="text-lg font-bold text-foreground">
                        Perfil do investidor
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Selecione um perfil para ver os detalhes e cenários de rentabilidade.
                      </p>

                      <div className="space-y-4">
                        {perfisInvestidor.map((perfil) => {
                          const pessimista = calculateFutureValue(perfil.retornoAnual.pessimista);
                          const esperado = calculateFutureValue(perfil.retornoAnual.esperado);
                          const otimista = calculateFutureValue(perfil.retornoAnual.otimista);
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

                              <div className="space-y-3">
                                <div>
                                  <p className="text-sm text-muted-foreground mb-1">
                                    Pessimista ({(perfil.retornoAnual.pessimista * 100).toFixed(0)}% a.a.): <span className="text-foreground font-medium">{formatCurrency(pessimista)}</span>
                                  </p>
                                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-primary/40 rounded-full" style={{ width: `${(pessimista / maxValue) * 100}%` }} />
                                  </div>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground mb-1">
                                    Esperado ({(perfil.retornoAnual.esperado * 100).toFixed(0)}% a.a.): <span className="text-foreground font-medium">{formatCurrency(esperado)}</span>
                                  </p>
                                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-primary/70 rounded-full" style={{ width: `${(esperado / maxValue) * 100}%` }} />
                                  </div>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground mb-1">
                                    Otimista ({(perfil.retornoAnual.otimista * 100).toFixed(0)}% a.a.): <span className="text-foreground font-medium">{formatCurrency(otimista)}</span>
                                  </p>
                                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-primary rounded-full" style={{ width: `${(otimista / maxValue) * 100}%` }} />
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
                        O Simulador de Investimentos é uma ferramenta educacional. Os resultados são estimativas baseadas em taxas históricas e projeções, não garantindo rentabilidade futura. A rentabilidade divulgada não considera impostos (IR, IOF) que variam conforme prazo e tipo de investimento. Consulte um assessor de investimentos antes de tomar decisões.
                      </p>
                    </div>
                  </>
                )}

                {/* Tab Ativos */}
                {activeTab === "ativos" && (
                  <div className="space-y-6">
                    <p className="text-sm text-muted-foreground">
                      Conheça todos os ativos disponíveis para compor sua carteira de investimentos.
                    </p>

                    {/* Renda Fixa */}
                    <div className="space-y-3">
                      <button
                        onClick={() => setExpandedAtivoCategoria(expandedAtivoCategoria === 'rf' ? null : 'rf')}
                        className="w-full flex items-center justify-between bg-card border border-border rounded-xl p-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                            <Landmark className="w-5 h-5 text-emerald-400" />
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-foreground">Renda Fixa</p>
                            <p className="text-xs text-muted-foreground">{ativosRendaFixa.length} ativos disponíveis</p>
                          </div>
                        </div>
                        {expandedAtivoCategoria === 'rf' ? (
                          <ChevronUp className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        )}
                      </button>
                      
                      {expandedAtivoCategoria === 'rf' && (
                        <div className="space-y-2 pl-4">
                          {ativosRendaFixa.map((ativo) => (
                            <div key={ativo.id} className="bg-card border border-border rounded-xl p-4">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-medium text-foreground text-sm">{ativo.nome}</h4>
                                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">{ativo.risco}</span>
                              </div>
                              <p className="text-xs text-muted-foreground mb-3">{ativo.descricao}</p>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="flex items-center gap-1">
                                  <Percent className="w-3 h-3 text-primary" />
                                  <span className="text-muted-foreground">Rent:</span>
                                  <span className="text-foreground">{ativo.rentabilidade}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-primary" />
                                  <span className="text-muted-foreground">Liquidez:</span>
                                  <span className="text-foreground">{ativo.liquidez}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Fundos de Investimento */}
                    <div className="space-y-3">
                      <button
                        onClick={() => setExpandedAtivoCategoria(expandedAtivoCategoria === 'fundos' ? null : 'fundos')}
                        className="w-full flex items-center justify-between bg-card border border-border rounded-xl p-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-blue-400" />
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-foreground">Fundos de Investimento</p>
                            <p className="text-xs text-muted-foreground">{ativosFundos.length} tipos de fundos</p>
                          </div>
                        </div>
                        {expandedAtivoCategoria === 'fundos' ? (
                          <ChevronUp className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        )}
                      </button>
                      
                      {expandedAtivoCategoria === 'fundos' && (
                        <div className="space-y-2 pl-4">
                          {ativosFundos.map((ativo) => (
                            <div key={ativo.id} className="bg-card border border-border rounded-xl p-4">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-medium text-foreground text-sm">{ativo.nome}</h4>
                                <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">{ativo.risco}</span>
                              </div>
                              <p className="text-xs text-muted-foreground mb-3">{ativo.descricao}</p>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="flex items-center gap-1">
                                  <Percent className="w-3 h-3 text-primary" />
                                  <span className="text-muted-foreground">Rent:</span>
                                  <span className="text-foreground">{ativo.rentabilidade}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-primary" />
                                  <span className="text-muted-foreground">Liquidez:</span>
                                  <span className="text-foreground">{ativo.liquidez}</span>
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground mt-2">Taxa: {ativo.taxaAdm}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Previdência */}
                    <div className="space-y-3">
                      <button
                        onClick={() => setExpandedAtivoCategoria(expandedAtivoCategoria === 'prev' ? null : 'prev')}
                        className="w-full flex items-center justify-between bg-card border border-border rounded-xl p-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                            <PiggyBank className="w-5 h-5 text-purple-400" />
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-foreground">Previdência Privada</p>
                            <p className="text-xs text-muted-foreground">{ativosPrevidencia.length} modalidades</p>
                          </div>
                        </div>
                        {expandedAtivoCategoria === 'prev' ? (
                          <ChevronUp className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        )}
                      </button>
                      
                      {expandedAtivoCategoria === 'prev' && (
                        <div className="space-y-2 pl-4">
                          {ativosPrevidencia.map((ativo) => (
                            <div key={ativo.id} className="bg-card border border-border rounded-xl p-4">
                              <h4 className="font-medium text-foreground text-sm mb-2">{ativo.nome}</h4>
                              <p className="text-xs text-muted-foreground mb-3">{ativo.descricao}</p>
                              <div className="space-y-1 text-xs">
                                <div className="flex items-start gap-1">
                                  <Shield className="w-3 h-3 text-primary mt-0.5" />
                                  <span className="text-muted-foreground">Benefício fiscal:</span>
                                  <span className="text-foreground">{ativo.beneficioFiscal}</span>
                                </div>
                                <div className="flex items-start gap-1">
                                  <TrendingUp className="w-3 h-3 text-primary mt-0.5" />
                                  <span className="text-muted-foreground">Indicado:</span>
                                  <span className="text-foreground">{ativo.indicado}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Renda Variável */}
                    <div className="space-y-3">
                      <button
                        onClick={() => setExpandedAtivoCategoria(expandedAtivoCategoria === 'rv' ? null : 'rv')}
                        className="w-full flex items-center justify-between bg-card border border-border rounded-xl p-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-red-400" />
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-foreground">Renda Variável</p>
                            <p className="text-xs text-muted-foreground">{ativosRendaVariavel.length} classes de ativos</p>
                          </div>
                        </div>
                        {expandedAtivoCategoria === 'rv' ? (
                          <ChevronUp className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        )}
                      </button>
                      
                      {expandedAtivoCategoria === 'rv' && (
                        <div className="space-y-2 pl-4">
                          {ativosRendaVariavel.map((ativo) => (
                            <div key={ativo.id} className="bg-card border border-border rounded-xl p-4">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-medium text-foreground text-sm">{ativo.nome}</h4>
                                <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">{ativo.risco}</span>
                              </div>
                              <p className="text-xs text-muted-foreground mb-3">{ativo.descricao}</p>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="flex items-center gap-1">
                                  <Percent className="w-3 h-3 text-primary" />
                                  <span className="text-muted-foreground">Rent:</span>
                                  <span className="text-foreground">{ativo.rentabilidade}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-primary" />
                                  <span className="text-muted-foreground">Liquidez:</span>
                                  <span className="text-foreground">{ativo.liquidez}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tab Liquidez */}
                {activeTab === "liquidez" && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      A liquidez representa a facilidade e rapidez de converter seu investimento em dinheiro.
                    </p>

                    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                      <h3 className="font-semibold text-foreground">Tabela de liquidez por ativo</h3>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                          <div>
                            <p className="text-sm font-medium text-foreground">Altíssima liquidez</p>
                            <p className="text-xs text-muted-foreground">Tesouro SELIC, Fundos DI, CDB liquidez diária</p>
                          </div>
                          <span className="text-xs font-medium text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded-full">D+0 a D+1</span>
                        </div>
                        
                        <div className="flex justify-between items-center p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                          <div>
                            <p className="text-sm font-medium text-foreground">Alta liquidez</p>
                            <p className="text-xs text-muted-foreground">Ações, FIIs, ETFs, Tesouro IPCA+</p>
                          </div>
                          <span className="text-xs font-medium text-blue-400 bg-blue-500/20 px-2 py-1 rounded-full">D+1 a D+2</span>
                        </div>
                        
                        <div className="flex justify-between items-center p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                          <div>
                            <p className="text-sm font-medium text-foreground">Média liquidez</p>
                            <p className="text-xs text-muted-foreground">Fundos Multimercado, Fundos de Ações</p>
                          </div>
                          <span className="text-xs font-medium text-amber-400 bg-amber-500/20 px-2 py-1 rounded-full">D+30 a D+60</span>
                        </div>
                        
                        <div className="flex justify-between items-center p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                          <div>
                            <p className="text-sm font-medium text-foreground">Baixa liquidez</p>
                            <p className="text-xs text-muted-foreground">LCI, LCA, CDB com prazo</p>
                          </div>
                          <span className="text-xs font-medium text-orange-400 bg-orange-500/20 px-2 py-1 rounded-full">90+ dias</span>
                        </div>
                        
                        <div className="flex justify-between items-center p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                          <div>
                            <p className="text-sm font-medium text-foreground">Sem liquidez</p>
                            <p className="text-xs text-muted-foreground">Debêntures, CRI, CRA, Previdência</p>
                          </div>
                          <span className="text-xs font-medium text-red-400 bg-red-500/20 px-2 py-1 rounded-full">Vencimento</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-muted/30 rounded-xl p-4 flex gap-3">
                      <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-muted-foreground">
                        D+0 significa resgate no mesmo dia. D+1 no dia seguinte, e assim por diante. Investimentos com menor liquidez geralmente oferecem maior rentabilidade como compensação.
                      </p>
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
