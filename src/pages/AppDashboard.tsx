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
  ChevronUp,
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
  Sparkles,
  Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import kadigLogo from "@/assets/kadig-logo.png";
import PatrimonioDrawer from "@/components/PatrimonioDrawer";
import AdicionarDrawer from "@/components/AdicionarDrawer";
import TradeTab from "@/components/TradeTab";

interface UserData {
  id: string;
  email: string;
  profile: {
    full_name: string | null;
    investor_profile: string | null;
    risk_tolerance: string | null;
    monthly_income: number | null;
    investment_goal: string | null;
  } | null;
  portfolios: {
    id: string;
    name: string;
    total_value: number;
    total_gain: number;
    cdi_percent: number;
  }[];
  investments: {
    id: string;
    asset_name: string;
    asset_type: string;
    ticker: string | null;
    current_value: number;
    total_invested: number;
    gain_percent: number;
  }[];
}

interface MonthlyData {
  month: string;
  value: number;
  gain: number;
  cdiPercent: number;
  stats: { carteira: number; cdi: number; ipca: number };
}

// Get current date in Brazil timezone
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

// Calculate chart segments based on stats
const calculateChartSegments = (stats: { carteira: number; cdi: number; ipca: number }) => {
  const total = stats.carteira + stats.cdi + stats.ipca;
  if (total === 0) return {
    carteira: { dasharray: "0 534.07", offset: 0 },
    cdi: { dasharray: "0 534.07", offset: 0 },
    ipca: { dasharray: "0 534.07", offset: 0 },
  };
  
  const circumference = 2 * Math.PI * 85;
  const gap = 8;
  
  const carteiraLength = circumference * (stats.carteira / total) - gap;
  const cdiLength = circumference * (stats.cdi / total) - gap;
  const ipcaLength = circumference * (stats.ipca / total) - gap;
  
  return {
    carteira: {
      dasharray: `${Math.max(0, carteiraLength)} ${circumference}`,
      offset: circumference * 0.25,
    },
    cdi: {
      dasharray: `${Math.max(0, cdiLength)} ${circumference}`,
      offset: circumference * 0.25 - carteiraLength - gap,
    },
    ipca: {
      dasharray: `${Math.max(0, ipcaLength)} ${circumference}`,
      offset: circumference * 0.25 - carteiraLength - cdiLength - gap * 2,
    },
  };
};

const AppDashboard = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"carteira" | "trade" | "conexoes" | "mercado" | "conta">("carteira");
  const [carteiraTab, setCarteiraTab] = useState<"resumo" | "ativos" | "analises" | "extrato">("resumo");
  const [showValues, setShowValues] = useState(true);
  const [currentMonthIndex, setCurrentMonthIndex] = useState(2);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [patrimonioDrawerOpen, setPatrimonioDrawerOpen] = useState(false);
  const [adicionarDrawerOpen, setAdicionarDrawerOpen] = useState(false);

  // Fetch all user data from database
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          // Check localStorage for legacy users
          const savedProfile = localStorage.getItem("kadig-user-profile");
          if (!savedProfile) {
            navigate("/welcome");
            return;
          }
          // Redirect legacy users to auth
          navigate("/auth");
          return;
        }

        const userId = session.user.id;

        // Fetch all data in parallel
        const [profileResult, portfoliosResult, investmentsResult] = await Promise.all([
          supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
          supabase.from("portfolios").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
          supabase.from("investments").select("*").eq("user_id", userId).order("current_value", { ascending: false }),
        ]);

        const profile = profileResult.data;
        const portfolios = portfoliosResult.data || [];
        const investments = investmentsResult.data || [];

        // Calculate totals
        let totalValue = 0;
        let totalGain = 0;
        let totalInvested = 0;

        portfolios.forEach((p: any) => {
          totalValue += Number(p.total_value) || 0;
          totalGain += Number(p.total_gain) || 0;
        });

        investments.forEach((inv: any) => {
          totalInvested += Number(inv.total_invested) || 0;
        });

        // Generate monthly data based on real portfolio data
        const brazilDate = getBrazilDate();
        const currentMonth = brazilDate.getMonth();
        const currentYear = brazilDate.getFullYear();

        // Estimate monthly performance (in real app, this would come from historical data)
        const monthlyPerformance = generateMonthlyPerformance(totalValue, totalGain, portfolios);
        setMonthlyData(monthlyPerformance);

        setUserData({
          id: userId,
          email: session.user.email || "",
          profile: profile ? {
            full_name: profile.full_name,
            investor_profile: profile.investor_profile,
            risk_tolerance: profile.risk_tolerance,
            monthly_income: profile.monthly_income,
            investment_goal: profile.investment_goal,
          } : null,
          portfolios: portfolios.map((p: any) => ({
            id: p.id,
            name: p.name,
            total_value: Number(p.total_value) || 0,
            total_gain: Number(p.total_gain) || 0,
            cdi_percent: Number(p.cdi_percent) || 0,
          })),
          investments: investments.map((inv: any) => ({
            id: inv.id,
            asset_name: inv.asset_name,
            asset_type: inv.asset_type,
            ticker: inv.ticker,
            current_value: Number(inv.current_value) || 0,
            total_invested: Number(inv.total_invested) || 0,
            gain_percent: Number(inv.gain_percent) || 0,
          })),
        });

      } catch (error) {
        console.error("Error fetching user data:", error);
        toast.error("Erro ao carregar dados");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        navigate("/welcome");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Generate monthly performance data
  const generateMonthlyPerformance = (totalValue: number, totalGain: number, portfolios: any[]): MonthlyData[] => {
    const brazilDate = getBrazilDate();
    const currentMonth = brazilDate.getMonth();
    const currentYear = brazilDate.getFullYear();

    // Average CDI percent from portfolios
    const avgCdiPercent = portfolios.length > 0 
      ? portfolios.reduce((sum, p) => sum + (Number(p.cdi_percent) || 0), 0) / portfolios.length 
      : 0;

    // Estimated monthly rates (would come from real historical data)
    const estimatedMonthlyReturn = totalValue > 0 && totalGain > 0 ? (totalGain / totalValue) / 12 : 0.008;
    const cdiMonthlyRate = 0.0095; // ~11.5% annual
    const ipcaMonthlyRate = 0.004; // ~4.8% annual

    return Array.from({ length: 3 }, (_, i) => {
      const monthOffset = 2 - i;
      let month = currentMonth - monthOffset;
      let year = currentYear;
      
      if (month < 0) {
        month += 12;
        year -= 1;
      }

      // Calculate estimated values for each month
      const multiplier = Math.pow(1 + estimatedMonthlyReturn, monthOffset);
      const monthValue = totalValue / multiplier;
      const monthGain = totalGain / (3 - i);

      return {
        month: `${getMonthName(month)} ${year}`,
        value: monthValue,
        gain: monthGain,
        cdiPercent: avgCdiPercent,
        stats: {
          carteira: estimatedMonthlyReturn * 100 * (1 + (i * 0.1)),
          cdi: cdiMonthlyRate * 100,
          ipca: ipcaMonthlyRate * 100,
        },
      };
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("kadig-user-profile");
    navigate("/welcome");
  };

  const formatCurrency = (value: number) => {
    if (!showValues) return "R$ ••••••";
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const formatPercent = (value: number) => {
    if (!showValues) return "••%";
    return `${value.toFixed(0)}%`;
  };

  // Calculate totals
  const totalPatrimonio = userData?.portfolios.reduce((sum, p) => sum + p.total_value, 0) || 0;
  const totalGanhos = userData?.portfolios.reduce((sum, p) => sum + p.total_gain, 0) || 0;
  const totalInvestido = userData?.investments.reduce((sum, inv) => sum + inv.total_invested, 0) || 0;
  const avgCdiPercent = userData?.portfolios.length 
    ? userData.portfolios.reduce((sum, p) => sum + p.cdi_percent, 0) / userData.portfolios.length 
    : 0;
  
  const userName = userData?.profile?.full_name?.split(" ")[0] || userData?.email?.split("@")[0] || "";

  // Group investments by type
  const investmentsByType: { [key: string]: typeof userData.investments } = {};
  userData?.investments.forEach(inv => {
    const type = inv.asset_type || "outro";
    if (!investmentsByType[type]) investmentsByType[type] = [];
    investmentsByType[type].push(inv);
  });

  const typeLabels: { [key: string]: string } = {
    acao: "Ações",
    fii: "FIIs",
    renda_fixa: "Renda Fixa",
    tesouro: "Tesouro",
    cdb: "CDB",
    lci: "LCI",
    lca: "LCA",
    crypto: "Crypto",
    etf: "ETFs",
    outro: "Outros",
  };

  if (loading) {
    return (
      <div className="light-theme min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando seus dados...</p>
        </div>
      </div>
    );
  }

  const currentData = monthlyData[currentMonthIndex] || {
    month: "---",
    value: totalPatrimonio,
    gain: totalGanhos,
    cdiPercent: avgCdiPercent,
    stats: { carteira: 0, cdi: 0, ipca: 0 },
  };

  return (
    <div className="light-theme min-h-screen bg-background flex flex-col">
      {/* Carteira Tab Content */}
      {activeTab === "carteira" && (
        <div className="flex-1 pb-20">
          {/* Header */}
          <header className="flex items-center justify-between p-4 safe-area-inset-top">
            <button 
              onClick={() => setPatrimonioDrawerOpen(true)}
              className="flex items-center gap-2 active:opacity-70 transition-opacity"
            >
              {patrimonioDrawerOpen ? (
                <ChevronUp className="w-5 h-5 text-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-foreground" />
              )}
              <span className="font-semibold text-foreground">
                Patrimônio {userName}
              </span>
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
              <button 
                onClick={() => setAdicionarDrawerOpen(true)}
                className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-md"
              >
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
            ].map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => setCarteiraTab(tab.id as any)}
                whileTap={{ scale: 0.95 }}
                className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition-all relative ${
                  carteiraTab === tab.id ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {tab.label}
                {carteiraTab === tab.id && (
                  <motion.div
                    layoutId="carteiraTab"
                    className="absolute bottom-0 left-2 right-2 h-[3px] bg-primary rounded-full"
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
                <div className="relative w-72 h-72">
                  {(() => {
                    const segments = calculateChartSegments(currentData.stats);
                    return (
                      <svg viewBox="0 0 200 200" className="w-full h-full">
                        <circle cx="100" cy="100" r="85" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                        
                        <motion.circle
                          cx="100" cy="100" r="85" fill="none" stroke="#10b981" strokeWidth="18"
                          strokeDasharray={segments.carteira.dasharray}
                          strokeDashoffset={segments.carteira.offset}
                          strokeLinecap="round"
                          style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
                          animate={{ strokeDasharray: segments.carteira.dasharray }}
                          transition={{ duration: 0.6 }}
                        />
                        
                        <motion.circle
                          cx="100" cy="100" r="85" fill="none" stroke="hsl(var(--primary))" strokeWidth="18"
                          strokeDasharray={segments.cdi.dasharray}
                          strokeDashoffset={segments.cdi.offset}
                          strokeLinecap="round"
                          style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
                          animate={{ strokeDasharray: segments.cdi.dasharray }}
                          transition={{ duration: 0.6, delay: 0.1 }}
                        />
                        
                        <motion.circle
                          cx="100" cy="100" r="85" fill="none" stroke="#f97316" strokeWidth="18"
                          strokeDasharray={segments.ipca.dasharray}
                          strokeDashoffset={segments.ipca.offset}
                          strokeLinecap="round"
                          style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
                          animate={{ strokeDasharray: segments.ipca.dasharray }}
                          transition={{ duration: 0.6, delay: 0.2 }}
                        />
                      </svg>
                    );
                  })()}
                  
                  {/* Center content */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      key={currentMonthIndex}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col items-center text-center px-4"
                    >
                      <span className="text-[11px] text-muted-foreground bg-muted/50 px-3 py-1 rounded-full mb-2 border border-border">
                        {currentData.month}
                      </span>
                      <span className="text-2xl font-bold text-foreground">
                        {formatCurrency(currentData.value)}
                      </span>
                      <span className="text-xs text-muted-foreground mt-1">
                        CARTEIRA <span className="text-primary font-semibold">{formatPercent(currentData.cdiPercent)}</span> DO CDI
                      </span>
                      <div className="mt-3">
                        <span className="text-[10px] text-muted-foreground">GANHO DE CAPITAL</span>
                        <div className="mt-1">
                          <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                            currentData.gain >= 0 
                              ? "text-emerald-500 bg-emerald-50 border border-emerald-100" 
                              : "text-red-500 bg-red-50 border border-red-100"
                          }`}>
                            {currentData.gain >= 0 ? "+" : ""}{formatCurrency(currentData.gain)}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>

                <button className="absolute left-4 bottom-4 w-10 h-10 rounded-full border border-border bg-card flex items-center justify-center shadow-sm">
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Pagination dots */}
              <div className="flex justify-center gap-2">
                {monthlyData.map((_, index) => (
                  <button key={index} onClick={() => setCurrentMonthIndex(index)} className="p-1">
                    <motion.div
                      className={`w-2 h-2 rounded-full ${currentMonthIndex === index ? "bg-primary" : "bg-muted-foreground/30"}`}
                      animate={{ scale: currentMonthIndex === index ? 1.2 : 1 }}
                    />
                  </button>
                ))}
              </div>

              {/* Stats Row */}
              <div className="flex items-center justify-around py-4 border-y border-border">
                <div className="text-center">
                  <div className="flex items-center gap-1 justify-center">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-xs text-muted-foreground uppercase">Carteira</span>
                  </div>
                  <p className="text-lg font-bold text-emerald-500">
                    {showValues ? `${currentData.stats.carteira.toFixed(2)}%` : "••%"}
                  </p>
                </div>
                <div className="w-px h-10 bg-border" />
                <div className="text-center">
                  <div className="flex items-center gap-1 justify-center">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-xs text-muted-foreground uppercase">CDI</span>
                  </div>
                  <p className="text-lg font-bold text-primary">
                    {showValues ? `${currentData.stats.cdi.toFixed(2)}%` : "••%"}
                  </p>
                </div>
                <div className="w-px h-10 bg-border" />
                <div className="text-center">
                  <div className="flex items-center gap-1 justify-center">
                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                    <span className="text-xs text-muted-foreground uppercase">IPCA</span>
                  </div>
                  <p className="text-lg font-bold text-orange-500">
                    {showValues ? `${currentData.stats.ipca.toFixed(2)}%` : "••%"}
                  </p>
                </div>
              </div>

              {/* Kadig AI Card */}
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
                    Análises personalizadas e recomendações!
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>

              {/* Metas da carteira - Always show carousel */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 bg-foreground rounded-full" />
                  <h2 className="font-semibold text-foreground">Metas da carteira</h2>
                </div>

                {/* Horizontal Carousel */}
                <div className="overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                  <div className="flex gap-3" style={{ minWidth: 'max-content' }}>
                    {/* Renda Passiva Card */}
                    <div 
                      className="bg-card border border-border rounded-2xl p-4 flex flex-col"
                      style={{ minWidth: '200px', height: '280px' }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-4 bg-primary rounded-full" />
                          <h3 className="font-semibold text-foreground text-sm">Renda Passiva</h3>
                        </div>
                        <button className="text-muted-foreground">
                          <span className="text-lg">•••</span>
                        </button>
                      </div>
                      <p className="text-xs text-primary mb-4">Definir Meta</p>
                      
                      {/* Circular Button */}
                      <div className="flex-1 flex items-center justify-center">
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          className="relative w-24 h-24"
                        >
                          <div className="absolute inset-0 bg-cyan-100 rounded-full opacity-40" />
                          <div className="absolute inset-2 bg-cyan-200 rounded-full opacity-60" />
                          <div className="absolute inset-4 bg-cyan-300/80 rounded-full flex items-center justify-center">
                            <Plus className="w-8 h-8 text-white" />
                          </div>
                        </motion.button>
                      </div>
                      
                      {/* Stats */}
                      <div className="space-y-2 mt-4">
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-3 bg-muted-foreground/30 rounded-full" />
                          <div>
                            <p className="text-[10px] text-muted-foreground">Média últ. 12 meses</p>
                            <p className="text-sm font-semibold text-foreground">R$ -</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-3 bg-primary rounded-full" />
                          <div>
                            <p className="text-[10px] text-muted-foreground">Meta</p>
                            <p className="text-sm font-semibold text-foreground">R$ -</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Patrimônio Card */}
                    <div 
                      className="bg-card border border-border rounded-2xl p-4 flex flex-col"
                      style={{ minWidth: '200px', height: '280px' }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-1 h-4 bg-primary rounded-full" />
                        <h3 className="font-semibold text-foreground text-sm">Patrimônio</h3>
                      </div>
                      <p className="text-xs text-primary mb-4">Definir Meta</p>
                      
                      {/* Circular Button */}
                      <div className="flex-1 flex items-center justify-center">
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          className="relative w-24 h-24"
                        >
                          <div className="absolute inset-0 bg-cyan-100 rounded-full opacity-40" />
                          <div className="absolute inset-2 bg-cyan-200 rounded-full opacity-60" />
                          <div className="absolute inset-4 bg-cyan-300/80 rounded-full flex items-center justify-center">
                            <Plus className="w-8 h-8 text-white" />
                          </div>
                        </motion.button>
                      </div>
                      
                      {/* Stats */}
                      <div className="space-y-2 mt-4">
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-3 bg-muted-foreground/30 rounded-full" />
                          <div>
                            <p className="text-[10px] text-muted-foreground">Saldo Bruto Atual</p>
                            <p className="text-sm font-semibold text-foreground">{formatCurrency(totalPatrimonio)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-3 bg-primary rounded-full" />
                          <div>
                            <p className="text-[10px] text-muted-foreground">Meta</p>
                            <p className="text-sm font-semibold text-foreground">R$ -</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Ativos Tab */}
          {carteiraTab === "ativos" && (
            <div className="p-4 space-y-6">
              {/* Summary */}
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground">Total em Ativos</h3>
                  <span className="text-2xl font-bold text-foreground">{formatCurrency(totalPatrimonio)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className={totalGanhos >= 0 ? "text-emerald-500" : "text-red-500"}>
                    {totalGanhos >= 0 ? "+" : ""}{formatCurrency(totalGanhos)}
                  </span>
                  <span className="text-muted-foreground">de lucro</span>
                </div>
              </div>

              {/* Assets by Type */}
              {Object.entries(investmentsByType).map(([type, investments]) => {
                const typeTotal = investments.reduce((sum, inv) => sum + inv.current_value, 0);
                const typePercent = totalPatrimonio > 0 ? (typeTotal / totalPatrimonio) * 100 : 0;
                
                return (
                  <div key={type} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground">{typeLabels[type] || type}</h3>
                      <div className="text-right">
                        <span className="font-medium text-foreground">{formatCurrency(typeTotal)}</span>
                        <span className="text-xs text-muted-foreground ml-2">({typePercent.toFixed(1)}%)</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {investments.map((inv) => (
                        <div key={inv.id} className="bg-card border border-border rounded-xl p-3 flex items-center justify-between">
                          <div>
                            <p className="font-medium text-foreground">{inv.asset_name}</p>
                            {inv.ticker && <p className="text-xs text-muted-foreground">{inv.ticker}</p>}
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-foreground">{formatCurrency(inv.current_value)}</p>
                            <p className={`text-xs ${inv.gain_percent >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                              {inv.gain_percent >= 0 ? "+" : ""}{inv.gain_percent.toFixed(2)}%
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Empty State */}
              {(!userData?.investments || userData.investments.length === 0) && (
                <div className="bg-card border border-dashed border-border rounded-2xl p-8 text-center">
                  <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold text-foreground mb-2">Nenhum ativo cadastrado</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Adicione seus investimentos para ver a análise completa
                  </p>
                  <button 
                    onClick={() => navigate("/adicionar-investimento")}
                    className="bg-primary text-primary-foreground px-6 py-2 rounded-full font-medium"
                  >
                    Adicionar Ativo
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Análises Tab */}
          {carteiraTab === "analises" && (
            <div className="p-4 space-y-6">
              <div className="bg-gradient-to-br from-primary/10 to-violet-500/10 border border-primary/20 rounded-2xl p-6 text-center">
                <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-2">Análise Inteligente</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Use o Kadig AI para análises detalhadas da sua carteira
                </p>
                <button 
                  onClick={() => navigate("/consultor-ia")}
                  className="bg-primary text-primary-foreground px-6 py-2 rounded-full font-medium"
                >
                  Falar com Kadig AI
                </button>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-card border border-border rounded-xl p-4">
                  <p className="text-xs text-muted-foreground mb-1">Ativos</p>
                  <p className="text-2xl font-bold text-foreground">{userData?.investments.length || 0}</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                  <p className="text-xs text-muted-foreground mb-1">Carteiras</p>
                  <p className="text-2xl font-bold text-foreground">{userData?.portfolios.length || 0}</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                  <p className="text-xs text-muted-foreground mb-1">Tipos de Ativo</p>
                  <p className="text-2xl font-bold text-foreground">{Object.keys(investmentsByType).length}</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                  <p className="text-xs text-muted-foreground mb-1">vs CDI</p>
                  <p className="text-2xl font-bold text-foreground">{avgCdiPercent.toFixed(0)}%</p>
                </div>
              </div>
            </div>
          )}

          {/* Extrato Tab */}
          {carteiraTab === "extrato" && (
            <div className="p-4 space-y-4">
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <p className="text-muted-foreground">Extrato em breve...</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Conta Tab Content */}
      {activeTab === "conta" && (
        <div className="flex-1 pb-20">
          <header className="bg-muted/30 p-4 safe-area-inset-top">
            <h1 className="text-xl font-semibold text-foreground mb-4">Conta</h1>
            
            <button className="w-full flex items-center gap-3 mb-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <User className="w-6 h-6 text-muted-foreground" />
                </div>
                {!userData?.profile?.full_name && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-background" />
                )}
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-foreground">
                  {userData?.profile?.full_name || userData?.email?.split("@")[0] || "Usuário"}
                </p>
                {!userData?.profile?.full_name ? (
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                    Complete seu perfil
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">{userData?.email}</span>
                )}
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-muted-foreground">Perfil</span>
                <p className="font-medium text-foreground capitalize">{userData?.profile?.investor_profile || "Não definido"}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Plano</span>
                <p className="font-medium text-foreground">Gratuito</p>
              </div>
            </div>
          </header>

          <div className="p-4">
            <div className="bg-gradient-to-br from-violet-400 to-violet-500 rounded-2xl p-5 text-white">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-1">Assine Kadig Premium</h3>
                  <p className="text-white/80 text-sm mb-4">
                    Análises avançadas e recomendações exclusivas
                  </p>
                  <button className="bg-white text-violet-600 font-semibold px-4 py-2 rounded-full text-sm">
                    R$ 29,90/mês
                  </button>
                </div>
                <Sparkles className="w-8 h-8 text-white/80" />
              </div>
            </div>
          </div>

          <div className="px-4">
            {[
              { icon: Shield, label: "Segurança" },
              { icon: Settings, label: "Preferências" },
              { icon: MessageSquare, label: "Suporte" },
              { icon: Info, label: "Sobre" },
            ].map((item, index) => (
              <button key={index} className="w-full flex items-center justify-between py-4 border-b border-border">
                <span className="font-medium text-foreground">{item.label}</span>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            ))}

            <button onClick={handleLogout} className="w-full flex items-center justify-between py-4 border-b border-border">
              <span className="font-medium text-red-500">Sair da conta</span>
              <LogOut className="w-5 h-5 text-red-500" />
            </button>
          </div>
        </div>
      )}

      {/* Trade Tab */}
      {activeTab === "trade" && (
        <TradeTab 
          showValues={showValues} 
          userName={userName}
          userAssets={userData?.investments || []}
          onToggleValues={() => setShowValues(!showValues)}
          onAddAsset={() => setAdicionarDrawerOpen(true)}
          onAddConnection={() => navigate("/conexoes")}
        />
      )}

      {/* Other tabs */}
      {(activeTab === "conexoes" || activeTab === "mercado") && (
        <div className="flex-1 flex items-center justify-center pb-20">
          <div className="text-center">
            <p className="text-muted-foreground">Em breve...</p>
          </div>
        </div>
      )}

      {/* Patrimonio Drawer */}
      <PatrimonioDrawer
        open={patrimonioDrawerOpen}
        onOpenChange={setPatrimonioDrawerOpen}
        userName={userName}
        portfolios={userData?.portfolios.map(p => ({
          ...p,
          updated_at: new Date().toISOString(),
        })) || []}
        totalPatrimonio={totalPatrimonio}
        totalInvestido={totalInvestido}
        totalGanhos={totalGanhos}
        showValues={showValues}
        onAddPortfolio={() => {
          setPatrimonioDrawerOpen(false);
          navigate("/adicionar-carteira");
        }}
        onSelectPortfolio={(id) => {
          setPatrimonioDrawerOpen(false);
          // Could navigate to portfolio detail page
        }}
      />

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-area-inset-bottom">
        <div className="flex items-center justify-around py-2">
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
              className={`flex flex-col items-center py-2 px-4 ${
                activeTab === tab.id ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <tab.icon className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Adicionar Drawer */}
      <AdicionarDrawer 
        open={adicionarDrawerOpen}
        onClose={() => setAdicionarDrawerOpen(false)}
        onNavigate={(path) => navigate(path)}
      />
    </div>
  );
};

export default AppDashboard;
