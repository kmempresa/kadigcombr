import { useState, useEffect, useMemo } from "react";
import { usePortfolio } from "@/contexts/PortfolioContext";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
// Lucide icons
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
  Loader2,
  Search
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import kadigLogo from "@/assets/kadig-logo.png";
import PatrimonioDrawer from "@/components/PatrimonioDrawer";
import AdicionarDrawer from "@/components/AdicionarDrawer";
import TradeTab from "@/components/TradeTab";
import MercadoTab from "@/components/MercadoTab";
import InvestmentEditDrawer from "@/components/InvestmentEditDrawer";
import DistribuicaoDrawer from "@/components/analysis/DistribuicaoDrawer";
import EvolucaoDrawer from "@/components/analysis/EvolucaoDrawer";
import RentabilidadeDrawer from "@/components/analysis/RentabilidadeDrawer";
import RentabilidadeRealDrawer from "@/components/analysis/RentabilidadeRealDrawer";
import RiscoRetornoDrawer from "@/components/analysis/RiscoRetornoDrawer";
import GanhoCapitalDrawer from "@/components/analysis/GanhoCapitalDrawer";
import ComparadorAtivosDrawer from "@/components/analysis/ComparadorAtivosDrawer";
import CoberturaFGCDrawer from "@/components/analysis/CoberturaFGCDrawer";
import ProventosDrawer from "@/components/analysis/ProventosDrawer";

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
    portfolio_id: string;
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

interface EconomicIndicators {
  current: { cdi: number; ipca: number; selic: number };
  accumulated12m: { cdi: number; ipca: number };
  monthly: { month: string; cdi: number; ipca: number }[];
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
  const { selectedPortfolioId, setSelectedPortfolioId } = usePortfolio();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"carteira" | "trade" | "conexoes" | "mercado" | "conta">("carteira");
  const [carteiraTab, setCarteiraTab] = useState<"resumo" | "ativos" | "analises" | "extrato">("resumo");
  const [showValues, setShowValues] = useState(true);
  const [currentMonthIndex, setCurrentMonthIndex] = useState(2);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [patrimonioDrawerOpen, setPatrimonioDrawerOpen] = useState(false);
  const [adicionarDrawerOpen, setAdicionarDrawerOpen] = useState(false);
  const [economicIndicators, setEconomicIndicators] = useState<EconomicIndicators | null>(null);
  const [editingInvestment, setEditingInvestment] = useState<any>(null);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [distribuicaoOpen, setDistribuicaoOpen] = useState(false);
  const [evolucaoOpen, setEvolucaoOpen] = useState(false);
  const [rentabilidadeOpen, setRentabilidadeOpen] = useState(false);
  const [rentabilidadeRealOpen, setRentabilidadeRealOpen] = useState(false);
  const [riscoRetornoOpen, setRiscoRetornoOpen] = useState(false);
  const [ganhoCapitalOpen, setGanhoCapitalOpen] = useState(false);
  const [comparadorOpen, setComparadorOpen] = useState(false);
  const [coberturaFGCOpen, setCoberturaFGCOpen] = useState(false);
  const [proventosOpen, setProventosOpen] = useState(false);

  // Fetch economic indicators (CDI, IPCA, SELIC) from BCB
  useEffect(() => {
    const fetchEconomicIndicators = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('market-data', {
          body: { type: 'economic-indicators' }
        });
        
        if (error) throw error;
        
        console.log('Economic indicators:', data);
        setEconomicIndicators(data);
      } catch (error) {
        console.error('Error fetching economic indicators:', error);
      }
    };
    
    fetchEconomicIndicators();
  }, []);

  // Update crypto and currency prices for investments
  const updateInvestmentPrices = async (userId: string) => {
    try {
      console.log('Updating investment prices...');
      
      // Fetch all investments
      const { data: investments } = await supabase
        .from("investments")
        .select("*")
        .eq("user_id", userId);
      
      if (!investments || investments.length === 0) return;
      
      // Identify crypto and currency investments
      const cryptoInvestments = investments.filter((inv: any) => 
        inv.asset_type === 'Criptoativos'
      );
      const currencyInvestments = investments.filter((inv: any) => 
        inv.asset_type === 'Moedas'
      );
      const stockInvestments = investments.filter((inv: any) => 
        ['Ações, Stocks e ETF', 'BDRs', 'FIIs e REITs', 'Fundos'].includes(inv.asset_type)
      );
      
      // Fetch crypto prices if needed
      if (cryptoInvestments.length > 0) {
        console.log(`Updating ${cryptoInvestments.length} crypto investments`);
        const { data: cryptoData } = await supabase.functions.invoke('market-data', {
          body: { type: 'crypto-prices' }
        });
        
        if (cryptoData?.prices) {
          for (const inv of cryptoInvestments) {
            const priceData = cryptoData.prices[inv.asset_name];
            if (priceData) {
              const newCurrentPrice = priceData.price;
              const newCurrentValue = (inv.quantity || 1) * newCurrentPrice;
              const gainPercent = inv.total_invested > 0 
                ? ((newCurrentValue - inv.total_invested) / inv.total_invested) * 100 
                : 0;
              
              await supabase.from("investments").update({
                current_price: newCurrentPrice,
                current_value: newCurrentValue,
                gain_percent: gainPercent,
                updated_at: new Date().toISOString(),
              }).eq("id", inv.id);
            }
          }
        }
      }
      
      // Fetch currency prices if needed
      if (currencyInvestments.length > 0) {
        console.log(`Updating ${currencyInvestments.length} currency investments`);
        const { data: currencyData } = await supabase.functions.invoke('market-data', {
          body: { type: 'currency-prices' }
        });
        
        if (currencyData?.prices) {
          for (const inv of currencyInvestments) {
            const priceData = currencyData.prices[inv.asset_name];
            if (priceData) {
              const newCurrentPrice = priceData.price;
              const newCurrentValue = (inv.quantity || 1) * newCurrentPrice;
              const gainPercent = inv.total_invested > 0 
                ? ((newCurrentValue - inv.total_invested) / inv.total_invested) * 100 
                : 0;
              
              await supabase.from("investments").update({
                current_price: newCurrentPrice,
                current_value: newCurrentValue,
                gain_percent: gainPercent,
                updated_at: new Date().toISOString(),
              }).eq("id", inv.id);
            }
          }
        }
      }
      
      // Fetch stock prices if needed
      if (stockInvestments.length > 0) {
        console.log(`Updating ${stockInvestments.length} stock investments`);
        const { data: stockData } = await supabase.functions.invoke('market-data', {
          body: { type: 'all' }
        });
        
        if (stockData?.stocks) {
          const stockPrices: { [key: string]: number } = {};
          stockData.stocks.forEach((s: any) => {
            if (s.regularMarketPrice > 0) {
              stockPrices[s.symbol] = s.regularMarketPrice;
            }
          });
          
          for (const inv of stockInvestments) {
            if (inv.ticker && stockPrices[inv.ticker]) {
              const newCurrentPrice = stockPrices[inv.ticker];
              const newCurrentValue = (inv.quantity || 1) * newCurrentPrice;
              const gainPercent = inv.total_invested > 0 
                ? ((newCurrentValue - inv.total_invested) / inv.total_invested) * 100 
                : 0;
              
              await supabase.from("investments").update({
                current_price: newCurrentPrice,
                current_value: newCurrentValue,
                gain_percent: gainPercent,
                updated_at: new Date().toISOString(),
              }).eq("id", inv.id);
            }
          }
        }
      }
      
      // Update portfolio totals
      const { data: updatedInvestments } = await supabase
        .from("investments")
        .select("current_value, total_invested, portfolio_id")
        .eq("user_id", userId);
      
      if (updatedInvestments && updatedInvestments.length > 0) {
        // Group by portfolio
        const portfolioTotals: { [key: string]: { value: number; invested: number } } = {};
        updatedInvestments.forEach((inv: any) => {
          if (!portfolioTotals[inv.portfolio_id]) {
            portfolioTotals[inv.portfolio_id] = { value: 0, invested: 0 };
          }
          portfolioTotals[inv.portfolio_id].value += inv.current_value || 0;
          portfolioTotals[inv.portfolio_id].invested += inv.total_invested || 0;
        });
        
        // Update each portfolio
        for (const [portfolioId, totals] of Object.entries(portfolioTotals)) {
          const gain = totals.value - totals.invested;
          const cdiPercent = totals.invested > 0 ? (gain / totals.invested) * 100 : 0;
          
          await supabase.from("portfolios").update({
            total_value: totals.value,
            total_gain: gain,
            cdi_percent: cdiPercent,
            updated_at: new Date().toISOString(),
          }).eq("id", portfolioId);
        }
      }
      
      console.log('Investment prices updated successfully');
      toast.success("Cotações atualizadas!");
    } catch (error) {
      console.error('Error updating investment prices:', error);
    }
  };

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

        // Update investment prices in background (only on first load)
        if (!userData) {
          updateInvestmentPrices(userId);
        }

        // Fetch all data in parallel
        const [profileResult, portfoliosResult, investmentsResult] = await Promise.all([
          supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
          supabase.from("portfolios").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
          supabase.from("investments").select("*").eq("user_id", userId).order("current_value", { ascending: false }),
        ]);

        const profile = profileResult.data;
        const portfolios = portfoliosResult.data || [];
        const investments = investmentsResult.data || [];

        // Calculate totals from investments (more accurate)
        let totalValue = 0;
        let totalInvested = 0;

        investments.forEach((inv: any) => {
          totalValue += Number(inv.current_value) || 0;
          totalInvested += Number(inv.total_invested) || 0;
        });

        const totalGain = totalValue - totalInvested;

        // Generate monthly data based on real portfolio data and economic indicators
        const monthlyPerformance = generateMonthlyPerformance(totalValue, totalGain, totalInvested, economicIndicators);
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
            portfolio_id: inv.portfolio_id,
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
  }, [navigate, economicIndicators, refreshKey]);

  // Generate monthly performance data with real economic indicators
  const generateMonthlyPerformance = (
    totalValue: number, 
    totalGain: number, 
    totalInvested: number,
    indicators: EconomicIndicators | null
  ): MonthlyData[] => {
    const brazilDate = getBrazilDate();
    const currentMonth = brazilDate.getMonth();
    const currentYear = brazilDate.getFullYear();

    // Calculate real return percentage of portfolio
    const portfolioReturnPercent = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;
    
    // Get real CDI and IPCA from economic indicators
    const cdi12m = indicators?.accumulated12m?.cdi || 11.5;
    const ipca12m = indicators?.accumulated12m?.ipca || 4.5;
    
    // Calculate how much % of CDI the portfolio is returning
    const cdiPercent = cdi12m > 0 ? (portfolioReturnPercent / cdi12m) * 100 : 0;
    
    // Monthly data from BCB (if available)
    const monthlyIndicators = indicators?.monthly || [];

    return Array.from({ length: 3 }, (_, i) => {
      const monthOffset = 2 - i;
      let month = currentMonth - monthOffset;
      let year = currentYear;
      
      if (month < 0) {
        month += 12;
        year -= 1;
      }

      // Find corresponding month data from BCB
      const monthNames = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
      const monthKey = `${monthNames[month]} ${year}`;
      const monthIndicator = monthlyIndicators.find(m => m.month === monthKey);
      
      // Use real data if available, otherwise estimate
      const realCdiMonthly = monthIndicator?.cdi || (cdi12m / 12);
      const realIpcaMonthly = monthIndicator?.ipca || (ipca12m / 12);
      
      // Estimate portfolio monthly return based on annual return
      const estimatedMonthlyReturn = portfolioReturnPercent / 12;
      
      // Calculate estimated values for each month
      const multiplier = Math.pow(1 + (portfolioReturnPercent / 100) / 12, monthOffset);
      const monthValue = totalValue / multiplier;
      const monthGain = totalGain / (3 - i);

      return {
        month: `${getMonthName(month)} ${year}`,
        value: monthValue,
        gain: monthGain,
        cdiPercent: cdiPercent,
        stats: {
          carteira: estimatedMonthlyReturn,
          cdi: realCdiMonthly,
          ipca: realIpcaMonthly,
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

  // Get selected portfolio (default to first one if none selected)
  const activePortfolioId = selectedPortfolioId || userData?.portfolios[0]?.id || null;
  const selectedPortfolio = userData?.portfolios.find(p => p.id === activePortfolioId);
  
  // Filter investments by selected portfolio
  const filteredInvestments = activePortfolioId 
    ? userData?.investments.filter(inv => inv.portfolio_id === activePortfolioId) || []
    : userData?.investments || [];

  // Calculate totals based on selected portfolio
  const totalPatrimonio = selectedPortfolio?.total_value || 0;
  const totalGanhos = selectedPortfolio?.total_gain || 0;
  const totalInvestido = filteredInvestments.reduce((sum, inv) => sum + inv.total_invested, 0);
  const avgCdiPercent = selectedPortfolio?.cdi_percent || 0;
  
  // Total patrimonio across all portfolios (for percentage calculation)
  const totalPatrimonioGeral = userData?.portfolios.reduce((sum, p) => sum + p.total_value, 0) || 0;
  const totalGanhosGeral = userData?.portfolios.reduce((sum, p) => sum + p.total_gain, 0) || 0;
  const totalInvestidoGeral = userData?.investments.reduce((sum, inv) => sum + inv.total_invested, 0) || 0;
  
  const userName = userData?.profile?.full_name?.split(" ")[0] || userData?.email?.split("@")[0] || "";

  // Group investments by type (filtered)
  const investmentsByType: { [key: string]: typeof filteredInvestments } = {};
  filteredInvestments.forEach(inv => {
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

  // Recalculate monthly data when portfolio changes
  const portfolioMonthlyData = useMemo(() => {
    return generateMonthlyPerformance(totalPatrimonio, totalGanhos, totalInvestido, economicIndicators);
  }, [totalPatrimonio, totalGanhos, totalInvestido, economicIndicators]);

  const currentData = portfolioMonthlyData[currentMonthIndex] || {
    month: "---",
    value: totalPatrimonio,
    gain: totalGanhos,
    cdiPercent: avgCdiPercent,
    stats: { carteira: 0, cdi: 0, ipca: 0 },
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

  return (
    <div className="light-theme min-h-screen bg-background flex flex-col">
      {/* Carteira Tab Content */}
      {activeTab === "carteira" && (
        <div className="flex-1 pb-20">
          {/* Header */}
          <header className="flex flex-col p-4 safe-area-inset-top gap-2">
            <div className="flex items-center justify-between">
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
                          cx="100" cy="100" r="85" fill="none" stroke="hsl(var(--success))" strokeWidth="18"
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
                          cx="100" cy="100" r="85" fill="none" stroke="hsl(var(--warning))" strokeWidth="18"
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
                              ? "text-success bg-success/10 border border-success/20" 
                              : "text-destructive bg-destructive/10 border border-destructive/20"
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
                    <div className="w-2 h-2 rounded-full bg-success" />
                    <span className="text-xs text-muted-foreground uppercase">Carteira</span>
                  </div>
                  <p className="text-lg font-bold text-success">
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
                    <div className="w-2 h-2 rounded-full bg-warning" />
                    <span className="text-xs text-muted-foreground uppercase">IPCA</span>
                  </div>
                  <p className="text-lg font-bold text-warning">
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
                          <div className="absolute inset-0 bg-primary/10 rounded-full opacity-40" />
                          <div className="absolute inset-2 bg-primary/20 rounded-full opacity-60" />
                          <div className="absolute inset-4 bg-primary/40 rounded-full flex items-center justify-center">
                            <Plus className="w-8 h-8 text-primary-foreground" />
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
                          <div className="absolute inset-0 bg-primary/10 rounded-full opacity-40" />
                          <div className="absolute inset-2 bg-primary/20 rounded-full opacity-60" />
                          <div className="absolute inset-4 bg-primary/40 rounded-full flex items-center justify-center">
                            <Plus className="w-8 h-8 text-primary-foreground" />
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
              {/* Search and Filter */}
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input 
                    type="text" 
                    placeholder="Buscar:"
                    className="w-full h-12 bg-card border border-border rounded-2xl px-4 pr-10 text-foreground text-sm placeholder:text-muted-foreground"
                  />
                  <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <button className="h-12 w-12 bg-card border border-border rounded-2xl flex items-center justify-center relative">
                  <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center font-bold">
                    {Object.keys(investmentsByType).length}
                  </span>
                </button>
              </div>

              {/* Assets by Type with New Layout */}
              {Object.entries(investmentsByType).map(([type, investments]) => {
                const typeTotal = investments.reduce((sum, inv) => sum + inv.current_value, 0);
                const typePercent = totalPatrimonio > 0 ? (typeTotal / totalPatrimonio) * 100 : 0;
                const typeLabel = typeLabels[type] || type;
                
                // Color mapping for each asset type
                const typeColors: { [key: string]: string } = {
                  'acoes': 'hsl(0, 84%, 60%)',
                  'bdrs': 'hsl(25, 95%, 53%)',
                  'conta_corrente': 'hsl(348, 83%, 47%)',
                  'criptoativos': 'hsl(142, 71%, 45%)',
                  'debentures': 'hsl(172, 66%, 50%)',
                  'fundos': 'hsl(199, 89%, 48%)',
                  'fiis': 'hsl(217, 91%, 60%)',
                  'moedas': 'hsl(263, 70%, 50%)',
                  'personalizados': 'hsl(280, 65%, 60%)',
                  'poupanca': 'hsl(292, 84%, 61%)',
                  'previdencia': 'hsl(330, 81%, 60%)',
                  'renda_fixa_pre': 'hsl(142, 71%, 45%)',
                  'renda_fixa_pos': 'hsl(185, 84%, 39%)',
                  'tesouro': 'hsl(340, 82%, 52%)',
                };
                
                const typeColor = typeColors[type] || 'hsl(var(--primary))';
                
                return (
                  <div key={type} className="space-y-3">
                    {/* Section Header */}
                    <h2 className="text-center font-semibold text-foreground text-base">
                      {typeLabel}
                    </h2>
                    
                    {/* Summary Card */}
                    <div className="bg-muted/50 rounded-2xl px-4 py-3 flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Total de ativos: <span className="font-medium text-foreground">{investments.length}</span>
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Saldo atual: <span className="font-bold text-foreground">{formatCurrency(typeTotal)}</span>
                      </span>
                    </div>
                    
                    {/* Asset Cards */}
                    {investments.map((inv) => {
                      const invPercent = totalPatrimonio > 0 ? (inv.current_value / totalPatrimonio) * 100 : 0;
                      const bankName = inv.asset_name.includes(' - ') 
                        ? inv.asset_name.split(' - ')[1]?.split(' ')[0] 
                        : inv.ticker || '';
                      
                      return (
                        <button 
                          key={inv.id} 
                          onClick={() => {
                            setEditingInvestment(inv);
                            setEditDrawerOpen(true);
                          }}
                          className="w-full bg-card border border-border rounded-2xl p-4 text-left hover:border-primary/50 hover:bg-primary/5 transition-all active:scale-[0.99]"
                        >
                          {/* Bank Name */}
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                            {bankName || 'ATIVO'}
                          </p>
                          
                          {/* Asset Name */}
                          <p className="font-medium text-foreground text-sm mb-2">
                            {inv.asset_name}
                          </p>
                          
                          {/* Badge */}
                          <span 
                            className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white mb-3"
                            style={{ backgroundColor: typeColor }}
                          >
                            {typeLabel}
                          </span>
                          
                          {/* Progress Bar */}
                          <div className="w-full h-1 bg-muted rounded-full mb-4 overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all"
                              style={{ 
                                width: `${Math.min(invPercent, 100)}%`,
                                backgroundColor: typeColor
                              }}
                            />
                          </div>
                          
                          {/* Divider */}
                          <div className="border-t border-border pt-3 space-y-2">
                            {/* Saldo Atual */}
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Saldo Atual:</span>
                              <span className="font-bold text-foreground">{formatCurrency(inv.current_value)}</span>
                            </div>
                            
                            {/* Rentabilidade */}
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Rentabilidade:</span>
                              <span className={`font-semibold ${inv.gain_percent >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                                {inv.gain_percent >= 0 ? "+" : ""}{inv.gain_percent.toFixed(2)}%
                              </span>
                            </div>
                            
                            {/* % na carteira */}
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">% na carteira:</span>
                              <span className="font-semibold text-foreground">{invPercent.toFixed(2)}%</span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
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
            <div className="p-4 space-y-3">
              {/* Distribuição da Carteira */}
              <motion.button 
                whileTap={{ scale: 0.98 }}
                onClick={() => setDistribuicaoOpen(true)}
                className="w-full bg-gradient-to-br from-card to-orange-50/30 border border-border rounded-3xl p-5 text-left hover:shadow-lg hover:shadow-orange-500/10 hover:border-orange-200 transition-all duration-300 group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl blur-md opacity-40 group-hover:opacity-60 transition-opacity" />
                      <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-lg">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                        </svg>
                      </div>
                    </div>
                    <span className="font-bold text-foreground text-base">Distribuição da Carteira</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-orange-500 transition-colors" />
                  </div>
                </div>
                <div className="border-t border-border/50 pt-3 pl-16">
                  <p className="text-sm text-muted-foreground leading-relaxed">Entenda como está distribuída a sua carteira e como cada ativo rende.</p>
                </div>
              </motion.button>

              {/* Evolução da Carteira */}
              <motion.button 
                whileTap={{ scale: 0.98 }}
                onClick={() => setEvolucaoOpen(true)}
                className="w-full bg-gradient-to-br from-card to-rose-50/30 border border-border rounded-3xl p-5 text-left hover:shadow-lg hover:shadow-rose-500/10 hover:border-rose-200 transition-all duration-300 group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-rose-400 to-pink-500 rounded-2xl blur-md opacity-40 group-hover:opacity-60 transition-opacity" />
                      <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shadow-lg">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                    </div>
                    <span className="font-bold text-foreground text-base">Evolução da Carteira</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center group-hover:bg-rose-100 transition-colors">
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-rose-500 transition-colors" />
                  </div>
                </div>
                <div className="border-t border-border/50 pt-3 pl-16">
                  <p className="text-sm text-muted-foreground leading-relaxed">Veja a evolução da sua carteira frente ao seu primeiro valor aplicado.</p>
                </div>
              </motion.button>

              {/* Section Header - Recursos Premium */}
              <div className="flex items-center gap-3 pt-4 pb-1">
                <div className="w-1.5 h-6 bg-gradient-to-b from-primary to-violet-500 rounded-full" />
                <h2 className="font-bold text-foreground text-lg">Recursos Premium</h2>
                <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
              </div>

              {/* Proventos */}
              <motion.button 
                whileTap={{ scale: 0.98 }}
                onClick={() => setProventosOpen(true)}
                className="w-full bg-gradient-to-br from-card to-violet-50/30 border border-border rounded-3xl p-5 text-left hover:shadow-lg hover:shadow-violet-500/10 hover:border-violet-200 transition-all duration-300 group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl blur-md opacity-40 group-hover:opacity-60 transition-opacity" />
                      <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                    <span className="font-bold text-foreground text-base">Proventos</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center group-hover:bg-violet-100 transition-colors">
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-violet-500 transition-colors" />
                  </div>
                </div>
                <div className="border-t border-border/50 pt-3 pl-16">
                  <p className="text-sm text-muted-foreground leading-relaxed">Tenha acesso aos proventos recebidos e a receber de todos os seus ativos.</p>
                </div>
              </motion.button>

              {/* Ganho de Capital */}
              <motion.button 
                whileTap={{ scale: 0.98 }}
                onClick={() => setGanhoCapitalOpen(true)}
                className="w-full bg-gradient-to-br from-card to-emerald-50/30 border border-border rounded-3xl p-5 text-left hover:shadow-lg hover:shadow-emerald-500/10 hover:border-emerald-200 transition-all duration-300 group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl blur-md opacity-40 group-hover:opacity-60 transition-opacity" />
                      <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <span className="font-bold text-foreground text-base">Ganho de Capital</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
                  </div>
                </div>
                <div className="border-t border-border/50 pt-3 pl-16">
                  <p className="text-sm text-muted-foreground leading-relaxed">Acompanhe todo valor em dinheiro que ganhou num determinado período de tempo.</p>
                </div>
              </motion.button>

              {/* Rentabilidade */}
              <motion.button 
                whileTap={{ scale: 0.98 }}
                onClick={() => setRentabilidadeOpen(true)}
                className="w-full bg-gradient-to-br from-card to-pink-50/30 border border-border rounded-3xl p-5 text-left hover:shadow-lg hover:shadow-pink-500/10 hover:border-pink-200 transition-all duration-300 group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl blur-md opacity-40 group-hover:opacity-60 transition-opacity" />
                      <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg">
                        <TrendingUp className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <span className="font-bold text-foreground text-base">Rentabilidade</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center group-hover:bg-pink-100 transition-colors">
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-pink-500 transition-colors" />
                  </div>
                </div>
                <div className="border-t border-border/50 pt-3 pl-16">
                  <p className="text-sm text-muted-foreground leading-relaxed">Acompanhe a rentabilidade histórica da sua carteira e dos seus ativos.</p>
                </div>
              </motion.button>

              {/* Rentabilidade Real */}
              <motion.button 
                whileTap={{ scale: 0.98 }}
                onClick={() => setRentabilidadeRealOpen(true)}
                className="w-full bg-gradient-to-br from-card to-indigo-50/30 border border-border rounded-3xl p-5 text-left hover:shadow-lg hover:shadow-indigo-500/10 hover:border-indigo-200 transition-all duration-300 group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl blur-md opacity-40 group-hover:opacity-60 transition-opacity" />
                      <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                    </div>
                    <span className="font-bold text-foreground text-base">Rentabilidade Real</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-indigo-500 transition-colors" />
                  </div>
                </div>
                <div className="border-t border-border/50 pt-3 pl-16">
                  <p className="text-sm text-muted-foreground leading-relaxed">Conheça a rentabilidade das suas aplicações abatida da inflação.</p>
                </div>
              </motion.button>

              {/* Risco x Retorno */}
              <motion.button 
                whileTap={{ scale: 0.98 }}
                onClick={() => setRiscoRetornoOpen(true)}
                className="w-full bg-gradient-to-br from-card to-purple-50/30 border border-border rounded-3xl p-5 text-left hover:shadow-lg hover:shadow-purple-500/10 hover:border-purple-200 transition-all duration-300 group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-fuchsia-600 rounded-2xl blur-md opacity-40 group-hover:opacity-60 transition-opacity" />
                      <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-600 flex items-center justify-center shadow-lg">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                    </div>
                    <span className="font-bold text-foreground text-base">Risco x Retorno</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-purple-500 transition-colors" />
                  </div>
                </div>
                <div className="border-t border-border/50 pt-3 pl-16">
                  <p className="text-sm text-muted-foreground leading-relaxed">Acompanhe o custo-benefício da sua carteira e de cada ativo.</p>
                </div>
              </motion.button>

              {/* Sensibilidade dos Ativos */}
              <motion.button 
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-br from-card to-cyan-50/30 border border-border rounded-3xl p-5 text-left hover:shadow-lg hover:shadow-cyan-500/10 hover:border-cyan-200 transition-all duration-300 group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-sky-600 rounded-2xl blur-md opacity-40 group-hover:opacity-60 transition-opacity" />
                      <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-600 flex items-center justify-center shadow-lg">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                    </div>
                    <span className="font-bold text-foreground text-base">Sensibilidade dos Ativos</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center group-hover:bg-cyan-100 transition-colors">
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-cyan-500 transition-colors" />
                  </div>
                </div>
                <div className="border-t border-border/50 pt-3 pl-16">
                  <p className="text-sm text-muted-foreground leading-relaxed">Entenda como cada ativo contribui para o resultado da carteira.</p>
                </div>
              </motion.button>

              {/* Comparador de Ativos */}
              <motion.button 
                whileTap={{ scale: 0.98 }}
                onClick={() => setComparadorOpen(true)}
                className="w-full bg-gradient-to-br from-card to-blue-50/30 border border-border rounded-3xl p-5 text-left hover:shadow-lg hover:shadow-blue-500/10 hover:border-blue-200 transition-all duration-300 group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl blur-md opacity-40 group-hover:opacity-60 transition-opacity" />
                      <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                      </div>
                    </div>
                    <span className="font-bold text-foreground text-base">Comparador de Ativos</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-blue-500 transition-colors" />
                  </div>
                </div>
                <div className="border-t border-border/50 pt-3 pl-16">
                  <p className="text-sm text-muted-foreground leading-relaxed">Compare um ativo da sua carteira com os índices do mercado.</p>
                </div>
              </motion.button>

              {/* Cobertura do FGC */}
              <motion.button 
                whileTap={{ scale: 0.98 }}
                onClick={() => setCoberturaFGCOpen(true)}
                className="w-full bg-gradient-to-br from-card to-teal-50/30 border border-border rounded-3xl p-5 text-left hover:shadow-lg hover:shadow-teal-500/10 hover:border-teal-200 transition-all duration-300 group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl blur-md opacity-40 group-hover:opacity-60 transition-opacity" />
                      <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                    </div>
                    <span className="font-bold text-foreground text-base">Cobertura do FGC</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center group-hover:bg-teal-100 transition-colors">
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-teal-500 transition-colors" />
                  </div>
                </div>
                <div className="border-t border-border/50 pt-3 pl-16">
                  <p className="text-sm text-muted-foreground leading-relaxed">Acompanhe quanto do seu dinheiro está protegido pelo FGC.</p>
                </div>
              </motion.button>

              {/* Kadig AI Card - Featured */}
              <motion.div 
                whileTap={{ scale: 0.98 }}
                className="relative overflow-hidden rounded-3xl p-5 mt-4"
              >
                {/* Animated gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-violet-500 to-fuchsia-500" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent)]" />
                
                {/* Floating orbs */}
                <div className="absolute top-4 right-4 w-20 h-20 bg-white/10 rounded-full blur-2xl" />
                <div className="absolute bottom-4 left-4 w-16 h-16 bg-white/10 rounded-full blur-xl" />
                
                <div className="relative">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/20">
                      <Sparkles className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg">Kadig AI</h3>
                      <p className="text-sm text-white/70">Análise inteligente com IA</p>
                    </div>
                  </div>
                  <p className="text-sm text-white/80 mb-4 leading-relaxed">
                    Use a inteligência artificial para análises personalizadas e recomendações para sua carteira.
                  </p>
                  <button 
                    onClick={() => navigate("/consultor-ia")}
                    className="w-full bg-white text-primary py-3 rounded-2xl font-bold text-sm shadow-lg hover:shadow-xl transition-shadow"
                  >
                    Falar com Kadig AI
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {/* Extrato Tab */}
          {carteiraTab === "extrato" && (
            <div className="p-4 space-y-4">
              {/* Search and Filter */}
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Buscar:"
                    className="w-full h-11 pl-4 pr-10 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                </div>
                <button className="w-11 h-11 bg-card border border-border rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="4" y1="6" x2="16" y2="6" />
                    <line x1="4" y1="12" x2="20" y2="12" />
                    <line x1="4" y1="18" x2="12" y2="18" />
                    <circle cx="18" cy="6" r="2" />
                    <circle cx="8" cy="18" r="2" />
                  </svg>
                </button>
              </div>

              {/* Transactions grouped by month */}
              {(() => {
                // Group investments by month
                const groupedByMonth: { [key: string]: typeof filteredInvestments } = {};
                
                filteredInvestments.forEach(inv => {
                  const date = new Date((inv as any).created_at || Date.now());
                  const monthKey = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                  const capitalizedMonth = monthKey.charAt(0).toUpperCase() + monthKey.slice(1);
                  
                  if (!groupedByMonth[capitalizedMonth]) {
                    groupedByMonth[capitalizedMonth] = [];
                  }
                  groupedByMonth[capitalizedMonth].push(inv);
                });

                const months = Object.keys(groupedByMonth);

                if (months.length === 0) {
                  return (
                    <div className="bg-card border border-border rounded-xl p-8 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                        <svg className="w-8 h-8 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14,2 14,8 20,8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma movimentação</h3>
                      <p className="text-sm text-muted-foreground">
                        Suas aplicações e resgates aparecerão aqui
                      </p>
                    </div>
                  );
                }

                return months.map(month => (
                  <div key={month}>
                    {/* Month Header */}
                    <h3 className="text-center font-semibold text-foreground py-3">{month}</h3>
                    
                    {/* Transaction Cards */}
                    <div className="space-y-3">
                      {groupedByMonth[month].map((inv, idx) => {
                        const date = new Date((inv as any).created_at || Date.now());
                        const formattedDate = date.toLocaleDateString('pt-BR');
                        
                        return (
                          <div 
                            key={inv.id || idx}
                            className="bg-card border border-border rounded-2xl p-4"
                          >
                            <div className="flex items-start gap-3">
                              {/* Icon */}
                              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                  <polyline points="17,8 12,3 7,8" />
                                  <line x1="12" y1="3" x2="12" y2="15" />
                                </svg>
                              </div>
                              
                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-muted-foreground">Aplicação</p>
                                <p className="font-medium text-foreground truncate">
                                  {inv.asset_name}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">{formattedDate}</p>
                              </div>
                              
                              {/* Value */}
                              <div className="text-right flex-shrink-0">
                                <p className="font-semibold text-foreground">
                                  {showValues 
                                    ? formatCurrency(inv.total_invested)
                                    : "R$ ••••••"
                                  }
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ));
              })()}
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
          userName={selectedPortfolio?.name || userName}
          userAssets={filteredInvestments}
          onToggleValues={() => setShowValues(!showValues)}
          onAddAsset={() => setAdicionarDrawerOpen(true)}
          onAddConnection={() => navigate("/conexoes")}
        />
      )}

      {/* Mercado Tab */}
      {activeTab === "mercado" && (
        <MercadoTab showValues={showValues} />
      )}

      {/* Conexoes Tab */}
      {activeTab === "conexoes" && (
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
          is_selected: p.id === activePortfolioId,
        })) || []}
        totalPatrimonio={totalPatrimonioGeral}
        totalInvestido={totalInvestidoGeral}
        totalGanhos={totalGanhosGeral}
        showValues={showValues}
        selectedPortfolioId={activePortfolioId}
        onAddPortfolio={() => {
          setPatrimonioDrawerOpen(false);
          navigate("/adicionar-carteira");
        }}
        onSelectPortfolio={(id) => {
          setSelectedPortfolioId(id);
          setPatrimonioDrawerOpen(false);
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

      {/* Investment Edit Drawer */}
      <InvestmentEditDrawer
        open={editDrawerOpen}
        onOpenChange={setEditDrawerOpen}
        investment={editingInvestment}
        onSuccess={() => setRefreshKey(prev => prev + 1)}
      />

      {/* Analysis Drawers */}
      <DistribuicaoDrawer
        open={distribuicaoOpen}
        onOpenChange={setDistribuicaoOpen}
        investments={filteredInvestments}
        totalPatrimonio={totalPatrimonio}
        formatCurrency={formatCurrency}
      />

      <EvolucaoDrawer
        open={evolucaoOpen}
        onOpenChange={setEvolucaoOpen}
        investments={filteredInvestments}
        totalPatrimonio={totalPatrimonio}
        totalInvested={totalInvestido}
        formatCurrency={formatCurrency}
        economicIndicators={economicIndicators}
      />

      <RentabilidadeDrawer
        open={rentabilidadeOpen}
        onOpenChange={setRentabilidadeOpen}
        totalPatrimonio={totalPatrimonio}
        totalInvested={totalInvestido}
        formatCurrency={formatCurrency}
        economicIndicators={economicIndicators}
      />

      <RentabilidadeRealDrawer
        open={rentabilidadeRealOpen}
        onOpenChange={setRentabilidadeRealOpen}
        investments={filteredInvestments}
        totalPatrimonio={totalPatrimonio}
        totalInvested={totalInvestido}
        formatCurrency={formatCurrency}
        economicIndicators={economicIndicators}
      />

      <RiscoRetornoDrawer
        open={riscoRetornoOpen}
        onOpenChange={setRiscoRetornoOpen}
        investments={filteredInvestments}
        totalPatrimonio={totalPatrimonio}
        totalInvested={totalInvestido}
        economicIndicators={economicIndicators}
      />

      <GanhoCapitalDrawer
        open={ganhoCapitalOpen}
        onOpenChange={setGanhoCapitalOpen}
        investments={filteredInvestments}
        totalPatrimonio={totalPatrimonio}
        totalInvested={totalInvestido}
        formatCurrency={formatCurrency}
      />

      <ComparadorAtivosDrawer
        open={comparadorOpen}
        onOpenChange={setComparadorOpen}
        investments={filteredInvestments}
        formatCurrency={formatCurrency}
        economicIndicators={economicIndicators}
      />

      <CoberturaFGCDrawer
        open={coberturaFGCOpen}
        onOpenChange={setCoberturaFGCOpen}
        investments={filteredInvestments}
        totalPatrimonio={totalPatrimonio}
        formatCurrency={formatCurrency}
      />

      <ProventosDrawer
        open={proventosOpen}
        onOpenChange={setProventosOpen}
        investments={filteredInvestments}
        formatCurrency={formatCurrency}
      />
    </div>
  );
};

export default AppDashboard;
