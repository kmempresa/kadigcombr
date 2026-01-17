import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Bell, 
  Eye,
  EyeOff,
  HelpCircle,
  Plus,
  ChevronRight,
  ChevronDown,
  User,
  Wallet,
  TrendingUp,
  Link2,
  Store,
  Shield,
  Settings,
  MessageSquare,
  Info,
  LogOut,
  Sparkles
} from "lucide-react";
import kadigLogo from "@/assets/kadig-logo.png";

interface UserProfile {
  name: string;
  experience: string;
  riskTolerance: string;
}

// Get current date in Brazil timezone (America/Sao_Paulo)
const getBrazilDate = () => {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
};

// Get month name in Portuguese
const getMonthName = (monthIndex: number) => {
  const months = [
    "JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO",
    "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"
  ];
  return months[monthIndex];
};

// Generate monthly data for the last 3 months based on current Brazil date
const generateMonthlyData = () => {
  const brazilDate = getBrazilDate();
  const currentMonth = brazilDate.getMonth();
  const currentYear = brazilDate.getFullYear();
  
  // Sample data for demonstration - in production this would come from a database
  const sampleData = [
    { value: "R$ 121.850,20", gain: "R$ 2.150,00", cdiPercent: "82%", stats: { carteira: 0.38, cdi: 0.52, ipca: 0.21 } },
    { value: "R$ 124.320,80", gain: "R$ 2.470,60", cdiPercent: "85%", stats: { carteira: 0.45, cdi: 0.54, ipca: 0.19 } },
    { value: "R$ 127.450,53", gain: "R$ 3.280,00", cdiPercent: "88%", stats: { carteira: 0.49, cdi: 0.55, ipca: 0.17 } },
  ];
  
  return Array.from({ length: 3 }, (_, i) => {
    const monthOffset = 2 - i; // 2 months ago, 1 month ago, current month
    let month = currentMonth - monthOffset;
    let year = currentYear;
    
    if (month < 0) {
      month += 12;
      year -= 1;
    }
    
    return {
      month: `${getMonthName(month)} ${year}`,
      ...sampleData[i]
    };
  });
};

const monthlyData = generateMonthlyData();

// Calculate chart segments based on stats
const calculateChartSegments = (stats: { carteira: number; cdi: number; ipca: number }) => {
  const total = stats.carteira + stats.cdi + stats.ipca;
  const circumference = 2 * Math.PI * 85; // r = 85
  
  const carteiraPercent = stats.carteira / total;
  const cdiPercent = stats.cdi / total;
  const ipcaPercent = stats.ipca / total;
  
  const carteiraLength = circumference * carteiraPercent;
  const cdiLength = circumference * cdiPercent;
  const ipcaLength = circumference * ipcaPercent;
  
  // Gap between segments (in pixels)
  const gap = 8;
  
  return {
    carteira: {
      dasharray: `${carteiraLength - gap} ${circumference}`,
      offset: circumference * 0.25, // Start from top
    },
    cdi: {
      dasharray: `${cdiLength - gap} ${circumference}`,
      offset: circumference * 0.25 - carteiraLength,
    },
    ipca: {
      dasharray: `${ipcaLength - gap} ${circumference}`,
      offset: circumference * 0.25 - carteiraLength - cdiLength,
    },
  };
};

const AppDashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<"carteira" | "trade" | "conexoes" | "mercado" | "conta">("carteira");
  const [carteiraTab, setCarteiraTab] = useState<"resumo" | "ativos" | "analises" | "extrato">("resumo");
  const [showValues, setShowValues] = useState(true);
  const [currentMonthIndex, setCurrentMonthIndex] = useState(2); // Start at latest month (Janeiro)

  useEffect(() => {
    const savedProfile = localStorage.getItem("kadig-user-profile");
    if (!savedProfile) {
      navigate("/onboarding");
      return;
    }
    setProfile(JSON.parse(savedProfile));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("kadig-user-profile");
    navigate("/welcome");
  };

  if (!profile) return null;

  const formatCurrency = (value: number) => {
    if (!showValues) return "R$ ••••••";
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  return (
    <div className="light-theme min-h-screen bg-background flex flex-col">
      {/* Carteira Tab Content */}
      {activeTab === "carteira" && (
        <div className="flex-1 pb-20">
          {/* Header */}
          <header className="flex items-center justify-between p-4 safe-area-inset-top">
            <button className="flex items-center gap-2">
              <ChevronDown className="w-5 h-5 text-foreground" />
              <span className="font-semibold text-foreground">Patrimônio {profile.name}</span>
            </button>
            <div className="flex items-center gap-3">
              <button className="p-2 text-muted-foreground">
                <Bell className="w-5 h-5" />
              </button>
              <button className="p-2 text-muted-foreground" onClick={() => setShowValues(!showValues)}>
                {showValues ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </button>
              <button className="p-2 text-muted-foreground">
                <HelpCircle className="w-5 h-5" />
              </button>
              <button className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-md">
                <Plus className="w-5 h-5 text-white" />
              </button>
            </div>
          </header>

          {/* Sub Tabs */}
          <div className="flex border-b border-border px-4 overflow-x-auto bg-card/50">
            {[
              { id: "resumo", label: "Resumo" },
              { id: "ativos", label: "Ativos" },
              { id: "analises", label: "Análises" },
              { id: "extrato", label: "Extrato" },
            ].map((tab, index) => (
              <motion.button
                key={tab.id}
                onClick={() => setCarteiraTab(tab.id as any)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition-all duration-300 relative rounded-t-lg ${
                  carteiraTab === tab.id
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground/80"
                }`}
              >
                {/* Background glow effect for active tab */}
                {carteiraTab === tab.id && (
                  <motion.div
                    layoutId="tabBg"
                    className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent rounded-t-lg"
                    initial={false}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                
                {/* Tab label */}
                <span className="relative z-10">{tab.label}</span>
                
                {/* Underline indicator */}
                {carteiraTab === tab.id && (
                  <motion.div
                    layoutId="carteiraTab"
                    className="absolute bottom-0 left-2 right-2 h-[3px] bg-gradient-to-r from-primary via-primary to-primary/60 rounded-full"
                    initial={false}
                    transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                  />
                )}
                
                {/* Hover dot indicator */}
                {carteiraTab !== tab.id && (
                  <motion.div
                    className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-muted-foreground/0 group-hover:bg-muted-foreground/50"
                    whileHover={{ scale: 1.5, opacity: 0.5 }}
                  />
                )}
              </motion.button>
            ))}
          </div>

          {/* Resumo Content */}
          {carteiraTab === "resumo" && (
            <div className="p-4 space-y-6">
              {/* Chart Section */}
              <div className="relative flex items-center justify-center py-8">
                {/* Ring Chart */}
                <div className="relative w-72 h-72">
                  {(() => {
                    const segments = calculateChartSegments(monthlyData[currentMonthIndex].stats);
                    return (
                      <svg viewBox="0 0 200 200" className="w-full h-full">
                        {/* Background ring - thin gray */}
                        <circle
                          cx="100"
                          cy="100"
                          r="85"
                          fill="none"
                          stroke="hsl(var(--muted))"
                          strokeWidth="3"
                        />
                        
                        {/* Carteira segment - Green */}
                        <motion.circle
                          cx="100"
                          cy="100"
                          r="85"
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="18"
                          strokeDasharray={segments.carteira.dasharray}
                          strokeDashoffset={segments.carteira.offset}
                          strokeLinecap="round"
                          style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
                          initial={{ strokeDasharray: "0 534.07" }}
                          animate={{ strokeDasharray: segments.carteira.dasharray }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                        />
                        
                        {/* CDI segment - Blue */}
                        <motion.circle
                          cx="100"
                          cy="100"
                          r="85"
                          fill="none"
                          stroke="hsl(var(--primary))"
                          strokeWidth="18"
                          strokeDasharray={segments.cdi.dasharray}
                          strokeDashoffset={segments.cdi.offset}
                          strokeLinecap="round"
                          style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
                          initial={{ strokeDasharray: "0 534.07" }}
                          animate={{ strokeDasharray: segments.cdi.dasharray }}
                          transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
                        />
                        
                        {/* IPCA segment - Orange */}
                        <motion.circle
                          cx="100"
                          cy="100"
                          r="85"
                          fill="none"
                          stroke="#f97316"
                          strokeWidth="18"
                          strokeDasharray={segments.ipca.dasharray}
                          strokeDashoffset={segments.ipca.offset}
                          strokeLinecap="round"
                          style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
                          initial={{ strokeDasharray: "0 534.07" }}
                          animate={{ strokeDasharray: segments.ipca.dasharray }}
                          transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
                        />
                      </svg>
                    );
                  })()}
                  
                  {/* Center content - Swipeable */}
                  <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                    <motion.div
                      className="flex items-center"
                      drag="x"
                      dragConstraints={{ left: 0, right: 0 }}
                      dragElastic={0.2}
                      onDragEnd={(e, info) => {
                        if (info.offset.x > 50 && currentMonthIndex > 0) {
                          setCurrentMonthIndex(currentMonthIndex - 1);
                        } else if (info.offset.x < -50 && currentMonthIndex < monthlyData.length - 1) {
                          setCurrentMonthIndex(currentMonthIndex + 1);
                        }
                      }}
                    >
                      <motion.div
                        key={currentMonthIndex}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="flex flex-col items-center justify-center text-center px-8 cursor-grab active:cursor-grabbing"
                      >
                        <span className="text-[11px] text-muted-foreground bg-muted/50 px-3 py-1 rounded-full mb-2 border border-border">
                          {monthlyData[currentMonthIndex].month}
                        </span>
                        <span className="text-2xl font-bold text-foreground flex items-center gap-1 leading-tight">
                          {showValues ? monthlyData[currentMonthIndex].value : "R$ ••••••"}
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        </span>
                        <span className="text-xs text-muted-foreground mt-1 leading-tight">
                          CARTEIRA <span className="text-primary font-semibold">{monthlyData[currentMonthIndex].cdiPercent}</span> DO CDI
                        </span>
                        <div className="mt-3">
                          <span className="text-[10px] text-muted-foreground tracking-wide">GANHO DE CAPITAL</span>
                          <div className="mt-1">
                            <span className="text-sm font-semibold text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                              {showValues ? monthlyData[currentMonthIndex].gain : "R$ ••••"}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  </div>
                </div>

                {/* Chart icon button */}
                <button className="absolute left-4 bottom-4 w-10 h-10 rounded-full border border-border bg-card flex items-center justify-center shadow-sm">
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Pagination dots */}
              <div className="flex justify-center gap-2">
                {monthlyData.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentMonthIndex(index)}
                    className="p-1"
                  >
                    <motion.div
                      className={`w-2 h-2 rounded-full transition-colors ${
                        currentMonthIndex === index ? "bg-primary" : "bg-muted-foreground/30"
                      }`}
                      animate={{ scale: currentMonthIndex === index ? 1.2 : 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </button>
                ))}
              </div>

              {/* Stats Row */}
              <div className="flex items-center justify-around py-4 border-y border-border">
                <div className="text-center">
                  <div className="flex items-center gap-1 justify-center">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Carteira</span>
                  </div>
                  <motion.p 
                    key={`carteira-${currentMonthIndex}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-lg font-bold text-emerald-500"
                  >
                    {monthlyData[currentMonthIndex].stats.carteira.toFixed(2).replace('.', ',')}%
                  </motion.p>
                </div>
                <div className="w-px h-10 bg-border" />
                <div className="text-center">
                  <div className="flex items-center gap-1 justify-center">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">CDI</span>
                  </div>
                  <motion.p 
                    key={`cdi-${currentMonthIndex}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-lg font-bold text-primary"
                  >
                    {monthlyData[currentMonthIndex].stats.cdi.toFixed(2).replace('.', ',')}%
                  </motion.p>
                </div>
                <div className="w-px h-10 bg-border" />
                <div className="text-center flex flex-col items-center">
                  <div className="flex items-center gap-1 justify-center">
                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">IPCA</span>
                  </div>
                  <button className="flex items-center gap-1">
                    <motion.span 
                      key={`ipca-${currentMonthIndex}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-lg font-bold text-orange-500"
                    >
                      {monthlyData[currentMonthIndex].stats.ipca.toFixed(2).replace('.', ',')}%
                    </motion.span>
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>

              {/* Promo Card */}
              <button
                onClick={() => navigate("/consultor-ia")}
                className="w-full bg-gradient-to-r from-primary/10 to-violet-500/10 border border-primary/20 rounded-2xl p-4 flex items-center gap-4 hover:from-primary/20 hover:to-violet-500/20 transition-all active:scale-[0.98]"
              >
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center shadow-lg">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    Consultor Kadig IA
                    <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full">NOVO</span>
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Tire dúvidas e receba recomendações personalizadas!
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>

              {/* Goals Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-0">
                  <div className="w-1 h-5 bg-foreground rounded-full" />
                  <h2 className="font-semibold text-foreground">Metas da carteira</h2>
                </div>

                <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
                  {/* Goal Card 1 - Renda Passiva */}
                  <div className="bg-card border border-border rounded-2xl p-4 min-w-[160px] flex-shrink-0 snap-start">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                        <span className="font-medium text-foreground text-sm">Renda Passiva</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-4">Definir Meta</p>
                    <div className="flex justify-center mb-4">
                      <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center">
                        <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center">
                          <Plus className="w-6 h-6 text-emerald-500" />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-3 bg-muted rounded-full" />
                        <span className="text-muted-foreground">Média 12 meses</span>
                      </div>
                      <p className="font-semibold text-foreground pl-3">R$ -</p>
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-3 bg-emerald-500 rounded-full" />
                        <span className="text-muted-foreground">Meta</span>
                      </div>
                      <p className="font-semibold text-foreground pl-3">R$ -</p>
                    </div>
                  </div>

                  {/* Goal Card 2 - Patrimônio */}
                  <div className="bg-card border border-border rounded-2xl p-4 min-w-[160px] flex-shrink-0 snap-start">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-4 bg-primary rounded-full" />
                        <span className="font-medium text-foreground text-sm">Patrimônio</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-4">Definir Meta</p>
                    <div className="flex justify-center mb-4">
                      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                        <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                          <Plus className="w-6 h-6 text-primary" />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-3 bg-muted rounded-full" />
                        <span className="text-muted-foreground">Saldo Atual</span>
                      </div>
                      <p className="font-semibold text-foreground pl-3">{formatCurrency(127450.53)}</p>
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-3 bg-primary rounded-full" />
                        <span className="text-muted-foreground">Meta</span>
                      </div>
                      <p className="font-semibold text-foreground pl-3">R$ -</p>
                    </div>
                  </div>

                  {/* Goal Card 3 - Reserva de Emergência */}
                  <div className="bg-card border border-border rounded-2xl p-4 min-w-[160px] flex-shrink-0 snap-start">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-4 bg-amber-500 rounded-full" />
                        <span className="font-medium text-foreground text-sm">Reserva</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-4">6 meses custos</p>
                    <div className="flex justify-center mb-4">
                      <div className="relative w-20 h-20">
                        <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                          <circle cx="40" cy="40" r="32" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
                          <circle cx="40" cy="40" r="32" fill="none" stroke="hsl(38 92% 50%)" strokeWidth="6" strokeDasharray="120.64 201.06" strokeLinecap="round" />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-foreground">60%</span>
                      </div>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-3 bg-muted rounded-full" />
                        <span className="text-muted-foreground">Atual</span>
                      </div>
                      <p className="font-semibold text-foreground pl-3">{formatCurrency(18000)}</p>
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-3 bg-amber-500 rounded-full" />
                        <span className="text-muted-foreground">Meta</span>
                      </div>
                      <p className="font-semibold text-foreground pl-3">{formatCurrency(30000)}</p>
                    </div>
                  </div>

                  {/* Goal Card 4 - Aposentadoria */}
                  <div className="bg-card border border-border rounded-2xl p-4 min-w-[160px] flex-shrink-0 snap-start">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-4 bg-violet-500 rounded-full" />
                        <span className="font-medium text-foreground text-sm">Aposentadoria</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-4">Previdência</p>
                    <div className="flex justify-center mb-4">
                      <div className="relative w-20 h-20">
                        <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                          <circle cx="40" cy="40" r="32" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
                          <circle cx="40" cy="40" r="32" fill="none" stroke="hsl(258 90% 66%)" strokeWidth="6" strokeDasharray="24.13 201.06" strokeLinecap="round" />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-foreground">12%</span>
                      </div>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-3 bg-muted rounded-full" />
                        <span className="text-muted-foreground">Atual</span>
                      </div>
                      <p className="font-semibold text-foreground pl-3">{formatCurrency(45000)}</p>
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-3 bg-violet-500 rounded-full" />
                        <span className="text-muted-foreground">Meta</span>
                      </div>
                      <p className="font-semibold text-foreground pl-3">{formatCurrency(500000)}</p>
                    </div>
                  </div>

                  {/* Goal Card 5 - Aporte Mensal */}
                  <div className="bg-card border border-border rounded-2xl p-4 min-w-[160px] flex-shrink-0 snap-start">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-4 bg-sky-500 rounded-full" />
                        <span className="font-medium text-foreground text-sm">Aporte Mensal</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-4">Investir mês</p>
                    <div className="flex justify-center mb-4">
                      <div className="relative w-20 h-20">
                        <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                          <circle cx="40" cy="40" r="32" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
                          <circle cx="40" cy="40" r="32" fill="none" stroke="hsl(199 89% 48%)" strokeWidth="6" strokeDasharray="160.85 201.06" strokeLinecap="round" />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-foreground">80%</span>
                      </div>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-3 bg-muted rounded-full" />
                        <span className="text-muted-foreground">Aportado</span>
                      </div>
                      <p className="font-semibold text-foreground pl-3">{formatCurrency(2400)}</p>
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-3 bg-sky-500 rounded-full" />
                        <span className="text-muted-foreground">Meta</span>
                      </div>
                      <p className="font-semibold text-foreground pl-3">{formatCurrency(3000)}</p>
                    </div>
                  </div>

                  {/* Goal Card 6 - Rentabilidade */}
                  <div className="bg-card border border-border rounded-2xl p-4 min-w-[160px] flex-shrink-0 snap-start">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-4 bg-rose-500 rounded-full" />
                        <span className="font-medium text-foreground text-sm">Rentabilidade</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-4">Superar CDI</p>
                    <div className="flex justify-center mb-4">
                      <div className="relative w-20 h-20">
                        <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                          <circle cx="40" cy="40" r="32" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
                          <circle cx="40" cy="40" r="32" fill="none" stroke="hsl(350 89% 60%)" strokeWidth="6" strokeDasharray="176.93 201.06" strokeLinecap="round" />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-foreground">88%</span>
                      </div>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-3 bg-muted rounded-full" />
                        <span className="text-muted-foreground">Rentabilidade</span>
                      </div>
                      <p className="font-semibold text-foreground pl-3">88% do CDI</p>
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-3 bg-rose-500 rounded-full" />
                        <span className="text-muted-foreground">Meta</span>
                      </div>
                      <p className="font-semibold text-foreground pl-3">100% do CDI</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Conta Tab Content */}
      {activeTab === "conta" && (
        <div className="flex-1 pb-20">
          {/* Header */}
          <header className="bg-muted/30 p-4 safe-area-inset-top">
            <h1 className="text-xl font-semibold text-foreground mb-4">Conta</h1>
            
            {/* Profile Section */}
            <button className="w-full flex items-center gap-3 mb-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <User className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-background" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-foreground">{profile.name}</p>
                <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                  Dados pendentes
                </span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>

            <div>
              <span className="text-xs text-muted-foreground">Tipo de plano</span>
              <p className="font-medium text-foreground">Gratuito</p>
            </div>
          </header>

          {/* Premium Card */}
          <div className="p-4">
            <div className="bg-gradient-to-br from-violet-400 to-violet-500 rounded-2xl p-5 text-white">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-1">Assine Kadig Premium por R$ 29,90</h3>
                  <p className="text-white/80 text-sm mb-4">
                    Acompanhe com mais clareza o desempenho dos seus investimentos.
                  </p>
                  <button className="bg-white text-violet-600 font-semibold px-4 py-2 rounded-full text-sm">
                    Assinar
                  </button>
                </div>
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="px-4">
            {[
              { icon: Shield, label: "Central de segurança", badge: "Novidade" },
              { icon: Link2, label: "Kadig Open Finance", badge: "Novidade" },
              { icon: Settings, label: "Preferências" },
              { icon: MessageSquare, label: "Abrir chamado" },
              { icon: Info, label: "Sobre o Kadig" },
            ].map((item, index) => (
              <button
                key={index}
                className="w-full flex items-center justify-between py-4 border-b border-border"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium text-foreground">{item.label}</span>
                  {item.badge && (
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            ))}

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-between py-4 border-b border-border"
            >
              <span className="font-medium text-red-500">Sair da conta</span>
              <LogOut className="w-5 h-5 text-red-500" />
            </button>
          </div>
        </div>
      )}

      {/* Other tabs placeholder */}
      {(activeTab === "trade" || activeTab === "conexoes" || activeTab === "mercado") && (
        <div className="flex-1 pb-20 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              {activeTab === "trade" && <TrendingUp className="w-8 h-8 text-primary" />}
              {activeTab === "conexoes" && <Link2 className="w-8 h-8 text-primary" />}
              {activeTab === "mercado" && <Store className="w-8 h-8 text-primary" />}
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">
              {activeTab === "trade" && "Trade"}
              {activeTab === "conexoes" && "Conexões"}
              {activeTab === "mercado" && "Mercado"}
            </h2>
            <p className="text-muted-foreground text-sm">Em breve</p>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 safe-area-inset-bottom">
        <div className="flex justify-around py-2">
          {[
            { id: "carteira", icon: Wallet, label: "Carteira" },
            { id: "trade", icon: TrendingUp, label: "Trade" },
            { id: "conexoes", icon: Link2, label: "Conexões" },
            { id: "mercado", icon: Store, label: "Mercado" },
            { id: "conta", icon: User, label: "Conta" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center gap-1 px-4 py-2 relative transition-colors ${
                activeTab === tab.id ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div
                  layoutId="bottomNav"
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full"
                />
              )}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default AppDashboard;
