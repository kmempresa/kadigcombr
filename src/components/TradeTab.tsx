import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  HelpCircle,
  Eye,
  EyeOff,
  Search,
  ChevronRight,
  ChevronDown,
  Plus,
  Link2,
  List,
  TrendingUp,
  Star,
  Loader2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import StockDetailDrawer from "@/components/StockDetailDrawer";
import { usePortfolio } from "@/contexts/PortfolioContext";

interface StockQuote {
  symbol: string;
  shortName: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
}

interface MarketIndex {
  name: string;
  value: number;
  changePercent: number;
}

interface TradeTabProps {
  showValues: boolean;
  userName?: string;
  userAssets?: any[];
  onToggleValues?: () => void;
  onAddAsset?: () => void;
  onAddConnection?: () => void;
}

const TradeTab = ({ 
  showValues, 
  userName = "",
  userAssets = [],
  onToggleValues,
  onAddAsset,
  onAddConnection
}: TradeTabProps) => {
  const { portfolios, selectedPortfolioId, setSelectedPortfolioId, activePortfolio } = usePortfolio();
  const [selectedStock, setSelectedStock] = useState<StockQuote | null>(null);
  const [stockDetailOpen, setStockDetailOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"meus-ativos" | "patrimonio" | "mercado" | "favoritos">("meus-ativos");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [lastUpdate, setLastUpdate] = useState<string>("-");
  const [marketStocks, setMarketStocks] = useState<StockQuote[]>([]);
  const [maioresAltas, setMaioresAltas] = useState<StockQuote[]>([]);
  const [maioresBaixas, setMaioresBaixas] = useState<StockQuote[]>([]);
  const [loadingMarket, setLoadingMarket] = useState(false);
  const [globalPatrimonio, setGlobalPatrimonio] = useState(0);
  const [loadingGlobalPatrimonio, setLoadingGlobalPatrimonio] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('kadig-favorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [marketSubTab, setMarketSubTab] = useState<"dados" | "carteiras">("dados");
  const [indicesExpanded, setIndicesExpanded] = useState(true);
  const [altasExpanded, setAltasExpanded] = useState(true);
  const [baixasExpanded, setBaixasExpanded] = useState(true);

  const [marketIndices, setMarketIndices] = useState<MarketIndex[]>([
    { name: "IBOV", value: 164799.99, changePercent: -0.46 },
    { name: "IFIX", value: 3809.30, changePercent: 0.13 },
    { name: "IDIV", value: 11587.36, changePercent: -0.45 },
  ]);

  const fetchMarketStocks = async () => {
    setLoadingMarket(true);
    try {
      const { data, error } = await supabase.functions.invoke('market-data', {
        body: { type: 'all' }
      });
      
      if (error) throw error;
      
      if (data) {
        setMarketStocks(data.stocks || []);
        setMaioresAltas(data.maioresAltas || []);
        setMaioresBaixas(data.maioresBaixas || []);
        if (data.indices && data.indices.length > 0) {
          setMarketIndices([
            ...data.indices.slice(0, 2),
            { name: "IDIV", value: 11587.36, changePercent: -0.45 }
          ]);
        }
        const now = new Date();
        setLastUpdate(now.toLocaleDateString("pt-BR") + " às " + now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      }
    } catch (error) {
      console.error("Error fetching market:", error);
      const now = new Date();
      setLastUpdate(now.toLocaleDateString("pt-BR") + " às " + now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    }
    setLoadingMarket(false);
  };

  useEffect(() => {
    if (activeTab === "mercado" || activeTab === "favoritos") {
      fetchMarketStocks();
      const interval = setInterval(fetchMarketStocks, 30000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  const fetchGlobalPatrimonio = async () => {
    setLoadingGlobalPatrimonio(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from("global_assets")
        .select("value_brl")
        .eq("user_id", session.user.id);

      if (error) throw error;

      const total = (data || []).reduce((sum: number, row: any) => sum + Number(row.value_brl || 0), 0);
      setGlobalPatrimonio(total);
    } catch (error) {
      console.error("Error fetching global patrimony:", error);
    } finally {
      setLoadingGlobalPatrimonio(false);
    }
  };

  useEffect(() => {
    if (activeTab === "patrimonio" || activeTab === "meus-ativos") {
      fetchGlobalPatrimonio();
    }
  }, [activeTab]);

  const toggleFavorite = (symbol: string) => {
    setFavorites(prev => {
      const newFavorites = prev.includes(symbol) 
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol];
      localStorage.setItem('kadig-favorites', JSON.stringify(newFavorites));
      return newFavorites;
    });
  };

  const formatPrice = (price: number) => {
    if (!showValues) return "R$ ••••••";
    return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const tabs = [
    { id: "meus-ativos", label: "Meus ativos" },
    { id: "patrimonio", label: "Patrimônio" },
    { id: "mercado", label: "Mercado" },
    { id: "favoritos", label: "Favoritos" },
  ];

  const filteredMarketStocks = searchTerm 
    ? marketStocks.filter(s => 
        s.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.shortName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : marketStocks;

  const filteredAltas = maioresAltas.length > 0 ? maioresAltas : [...filteredMarketStocks].sort((a, b) => b.regularMarketChangePercent - a.regularMarketChangePercent).slice(0, 10);
  const filteredBaixas = maioresBaixas.length > 0 ? maioresBaixas : [...filteredMarketStocks].sort((a, b) => a.regularMarketChangePercent - b.regularMarketChangePercent).slice(0, 10);

  // Mini chart component
  const MiniChart = ({ positive }: { positive: boolean }) => (
    <svg viewBox="0 0 80 24" className="w-full h-6">
      <path
        d={positive 
          ? "M0,18 L8,16 L16,17 L24,14 L32,15 L40,12 L48,13 L56,10 L64,8 L72,9 L80,6"
          : "M0,6 L8,8 L16,7 L24,10 L32,9 L40,12 L48,11 L56,14 L64,16 L72,15 L80,18"
        }
        fill="none"
        stroke={positive ? "#22c55e" : "#ef4444"}
        strokeWidth="1.5"
        strokeDasharray="3 2"
      />
    </svg>
  );

  return (
    <div className="flex-1 pb-20 bg-background">
      {/* Header Premium */}
      <header className="relative overflow-hidden pt-safe">
        {/* Background gradient effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute top-0 left-0 w-24 h-24 bg-accent/10 rounded-full blur-2xl -translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative px-4 pb-4 pt-2">
          <div className="flex items-center justify-between">
            {/* Left side - Title with icon */}
            <motion.div 
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="relative">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-background" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Kadig</span>
                <span className="font-bold text-lg text-foreground bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">Trade</span>
              </div>
            </motion.div>

            {/* Right side - Action buttons */}
            <div className="flex items-center gap-1">
              <motion.button 
                whileTap={{ scale: 0.9 }}
                className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
              >
                <HelpCircle className="w-5 h-5" />
              </motion.button>
              <motion.button 
                onClick={onToggleValues}
                whileTap={{ scale: 0.9 }}
                className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
              >
                {showValues ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </motion.button>
              <motion.button 
                onClick={() => setSearchOpen(!searchOpen)}
                whileTap={{ scale: 0.9 }}
                className={`p-2.5 rounded-xl transition-all ${
                  searchOpen 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <Search className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 pb-3"
          >
            <Input
              placeholder="Buscar ativo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 bg-muted/30 border-border"
              autoFocus
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex px-4 gap-1 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap rounded-lg transition-colors ${
              activeTab === tab.id 
                ? "bg-muted text-foreground" 
                : "text-muted-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {/* Meus Ativos Tab */}
        {activeTab === "meus-ativos" && (
          <motion.div 
            key="meus-ativos"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Portfolio Selector */}
            <div className="p-4 flex items-center gap-3">
              <button className="flex-1 flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3">
                <span className="text-foreground font-medium">Patrimônio {userName}</span>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
              <button className="relative w-12 h-12 bg-card border border-border rounded-xl flex items-center justify-center">
                <List className="w-5 h-5 text-muted-foreground" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  1
                </span>
              </button>
            </div>

            {/* Real-time indicator */}
            <div className="px-4 pb-4">
              <div className="flex flex-col items-center gap-1 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-400" />
                  <span className="text-sm text-muted-foreground">
                    Atualização <span className="text-foreground font-medium">em tempo real</span>
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Última atualização: {lastUpdate}
                </span>
              </div>
              <div className="h-px bg-border" />
            </div>

            <div className="px-4">
              {userAssets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  {/* Plus button with hand pointer */}
                  <div className="relative mb-6">
                    <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-lg">
                      <Plus className="w-8 h-8 text-white" />
                    </div>
                    {/* Hand pointer */}
                    <svg 
                      width="40" 
                      height="48" 
                      viewBox="0 0 40 48" 
                      fill="none" 
                      className="absolute -bottom-4 left-1/2 -translate-x-1/4"
                    >
                      <path 
                        d="M20 8C20 5.79086 21.7909 4 24 4C26.2091 4 28 5.79086 28 8V20" 
                        stroke="#9CA3AF" 
                        strokeWidth="2.5" 
                        strokeLinecap="round"
                      />
                      <path 
                        d="M28 16C28 13.7909 29.7909 12 32 12C34.2091 12 36 13.7909 36 16V24" 
                        stroke="#9CA3AF" 
                        strokeWidth="2.5" 
                        strokeLinecap="round"
                      />
                      <path 
                        d="M12 24V8C12 5.79086 13.7909 4 16 4C18.2091 4 20 5.79086 20 8V20" 
                        stroke="#9CA3AF" 
                        strokeWidth="2.5" 
                        strokeLinecap="round"
                      />
                      <path 
                        d="M12 24L8 28C6 30 6 34 8 36L12 40H32C36 40 36 36 36 32V24" 
                        stroke="#9CA3AF" 
                        strokeWidth="2.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>

                  <h3 className="text-lg font-semibold text-foreground text-center mb-2">
                    Adicione ativos da bolsa<br/>na sua carteira
                  </h3>
                  <p className="text-sm text-muted-foreground text-center mb-8">
                    Você não possui ativos da bolsa nesta carteira
                  </p>

                  <div className="w-full max-w-xs space-y-3">
                    <button
                      onClick={onAddAsset}
                      className="w-full flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-4"
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Plus className="w-5 h-5 text-primary" />
                      </div>
                      <span className="font-medium text-foreground">Adicionar ativos</span>
                    </button>

                    <button
                      onClick={onAddConnection}
                      className="w-full flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-4 relative overflow-hidden group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Link2 className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 text-left">
                        <span className="font-medium text-foreground block">Adicionar conexão</span>
                        <span className="text-xs text-muted-foreground">Em breve</span>
                      </div>
                      <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            className="w-1.5 h-1.5 bg-primary/50 rounded-full"
                            animate={{
                              opacity: [0.3, 1, 0.3],
                            }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              delay: i * 0.2,
                            }}
                          />
                        ))}
                      </div>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {userAssets.map((asset, index) => (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-card border border-border rounded-xl p-4 flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">
                          {(asset.ticker || asset.asset_name)?.slice(0, 2)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{asset.ticker || asset.asset_name}</p>
                        <p className="text-xs text-muted-foreground">{asset.asset_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-foreground">{formatPrice(asset.current_value)}</p>
                        <p className={`text-xs ${asset.gain_percent >= 0 ? "text-success" : "text-destructive"}`}>
                          {asset.gain_percent >= 0 ? "+" : ""}{asset.gain_percent?.toFixed(2)}%
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Patrimônio Tab */}
        {activeTab === "patrimonio" && (
          <motion.div 
            key="patrimonio"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Portfolio Selector */}
            <div className="p-4">
              <button className="w-full flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3">
                <span className="text-foreground font-medium">Patrimônio {userName}</span>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Real-time indicator */}
            <div className="px-4 pb-4">
              <div className="flex flex-col items-center gap-1 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-400" />
                  <span className="text-sm text-muted-foreground">
                    Atualização <span className="text-foreground font-medium">em tempo real</span>
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Última atualização: {lastUpdate}
                </span>
              </div>
            </div>

            {/* Section Title */}
            <div className="px-4 pb-3">
              <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl p-4 border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Patrimônio total</p>
                    <p className="text-[11px] text-muted-foreground">Bolsa + Global</p>
                  </div>
                  <div className="text-right">
                    {loadingGlobalPatrimonio ? (
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    ) : (
                      <p className="text-lg font-semibold text-foreground tabular-nums">
                        {showValues ? formatPrice(portfolios.reduce((s, p) => s + (p.total_value || 0), 0) + globalPatrimonio) : "R$ ••••••"}
                      </p>
                    )}
                    <p className="text-[11px] text-muted-foreground">
                      Global: {showValues ? formatPrice(globalPatrimonio) : "R$ ••••••"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Section Title */}
            <div className="px-4 pb-3">
              <div className="bg-muted/30 rounded-lg py-2 px-4">
                <span className="text-sm text-muted-foreground font-medium">Meu patrimônio na bolsa</span>
              </div>
            </div>

            {/* Portfolio Cards */}
            <div className="px-4 space-y-3">
              {portfolios.length > 0 ? (
                portfolios.map((portfolio, index) => {
                  const isSelected = portfolio.id === selectedPortfolioId;
                  const isPrimary = index === 0;
                  const dailyVariation = portfolio.total_value > 0 
                    ? ((portfolio.total_gain / portfolio.total_value) * 100) 
                    : 0;

                  return (
                    <button
                      key={portfolio.id}
                      onClick={() => setSelectedPortfolioId(portfolio.id)}
                      className={`w-full bg-card border rounded-2xl p-4 text-left transition-all ${
                        isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-border'
                      }`}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-2">
                          <div className="w-1 h-8 bg-muted-foreground rounded-full mt-0.5" />
                          <div>
                            <h3 className="font-semibold text-foreground">{portfolio.name}</h3>
                            <p className="text-xs text-muted-foreground">
                              Atualização: <span className="text-foreground">Em tempo real</span>
                            </p>
                          </div>
                        </div>
                        {isPrimary && (
                          <span className="text-[10px] bg-muted text-muted-foreground px-2 py-1 rounded font-medium border border-border">
                            PRINCIPAL
                          </span>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Saldo bruto atual:</span>
                          <span className="font-semibold text-foreground">
                            {showValues ? formatPrice(portfolio.total_value) : "R$ ••••••"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Variação do dia:</span>
                          <span className={`font-semibold ${dailyVariation >= 0 ? "text-success" : "text-destructive"}`}>
                            {showValues 
                              ? `${dailyVariation >= 0 ? "+" : ""}${dailyVariation.toFixed(2)}%`
                              : "••••%"
                            }
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="bg-card border border-dashed border-border rounded-2xl p-6 text-center">
                  <TrendingUp className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma carteira</h3>
                  <p className="text-sm text-muted-foreground">
                    Adicione uma carteira para visualizar seu patrimônio
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Mercado Tab */}
        {activeTab === "mercado" && (
          <motion.div 
            key="mercado"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-4 pt-4"
          >
            {/* Sub menu */}
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-4">
              <button 
                onClick={() => setMarketSubTab("dados")}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors whitespace-nowrap ${
                  marketSubTab === "dados" 
                    ? "bg-muted" 
                    : "bg-card border border-border"
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <span className="font-medium text-foreground text-sm">Dados do<br/>mercado</span>
              </button>
              <button 
                onClick={() => setMarketSubTab("carteiras")}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors whitespace-nowrap ${
                  marketSubTab === "carteiras" 
                    ? "bg-muted" 
                    : "bg-card border border-border"
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">btg</span>
                </div>
                <span className="font-medium text-foreground text-sm">Carteiras<br/>BTG Pactual</span>
              </button>
            </div>

            {loadingMarket ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
                <p className="text-sm text-muted-foreground">Carregando cotações...</p>
              </div>
            ) : (
              <>
                {/* Last update */}
                <div className="pb-4">
                  <p className="text-center text-sm text-muted-foreground">
                    Última atualização: {lastUpdate}
                  </p>
                </div>

                {/* Índices do mercado */}
                <div className="pb-4">
                  <button 
                    onClick={() => setIndicesExpanded(!indicesExpanded)}
                    className="flex items-center justify-center gap-2 w-full py-2"
                  >
                    <span className="font-medium text-foreground">Índices do mercado</span>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${indicesExpanded ? "" : "-rotate-180"}`} />
                  </button>
                  
                  <AnimatePresence>
                    {indicesExpanded && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex gap-3 overflow-x-auto scrollbar-hide pt-3"
                      >
                        {marketIndices.map((index) => (
                          <div 
                            key={index.name}
                            className="flex-shrink-0 w-36 bg-card border border-border rounded-xl p-4"
                          >
                            <p className="font-semibold text-foreground mb-2">{index.name}</p>
                            <div className="h-6 mb-2">
                              <MiniChart positive={index.changePercent >= 0} />
                            </div>
                            <p className="text-sm text-foreground mb-1">{formatNumber(index.value)}</p>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              index.changePercent >= 0 
                                ? "bg-success text-success-foreground" 
                                : "bg-destructive text-destructive-foreground"
                            }`}>
                              {index.changePercent >= 0 ? "+ " : "- "}{Math.abs(index.changePercent).toFixed(2)}%
                            </span>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Maiores altas */}
                <div className="pb-4">
                  <button 
                    onClick={() => setAltasExpanded(!altasExpanded)}
                    className="flex items-center justify-center gap-2 w-full py-2"
                  >
                    <span className="font-medium text-foreground">Maiores altas</span>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${altasExpanded ? "" : "-rotate-180"}`} />
                  </button>
                  
                  <AnimatePresence>
                    {altasExpanded && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="grid grid-cols-2 gap-3 pt-3"
                      >
                        {filteredAltas.map((stock) => (
                          <div 
                            key={stock.symbol}
                            onClick={() => {
                              setSelectedStock(stock);
                              setStockDetailOpen(true);
                            }}
                            className="bg-card border border-border rounded-xl p-4 cursor-pointer active:scale-95 transition-transform"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-semibold text-foreground">{stock.symbol}</p>
                              <button onClick={(e) => { e.stopPropagation(); toggleFavorite(stock.symbol); }}>
                                <Star className={`w-4 h-4 ${
                                  favorites.includes(stock.symbol) 
                                    ? "fill-yellow-400 text-yellow-400" 
                                    : "text-muted-foreground"
                                }`} />
                              </button>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2 truncate">{stock.shortName}</p>
                            <div className="h-6 mb-2">
                              <MiniChart positive={stock.regularMarketChangePercent >= 0} />
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-foreground">
                                {formatPrice(stock.regularMarketPrice)}
                              </span>
                              <span className="text-xs px-2 py-1 rounded-full bg-success text-success-foreground">
                                + {Math.abs(stock.regularMarketChangePercent).toFixed(2)}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Maiores baixas */}
                <div className="pb-4">
                  <button 
                    onClick={() => setBaixasExpanded(!baixasExpanded)}
                    className="flex items-center justify-center gap-2 w-full py-2"
                  >
                    <span className="font-medium text-foreground">Maiores baixas</span>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${baixasExpanded ? "" : "-rotate-180"}`} />
                  </button>
                  
                  <AnimatePresence>
                    {baixasExpanded && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="grid grid-cols-2 gap-3 pt-3"
                      >
                        {filteredBaixas.map((stock) => (
                          <div 
                            key={stock.symbol}
                            onClick={() => {
                              setSelectedStock(stock);
                              setStockDetailOpen(true);
                            }}
                            className="bg-card border border-border rounded-xl p-4 cursor-pointer active:scale-95 transition-transform"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-semibold text-foreground">{stock.symbol}</p>
                              <button onClick={(e) => { e.stopPropagation(); toggleFavorite(stock.symbol); }}>
                                <Star className={`w-4 h-4 ${
                                  favorites.includes(stock.symbol) 
                                    ? "fill-yellow-400 text-yellow-400" 
                                    : "text-muted-foreground"
                                }`} />
                              </button>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2 truncate">{stock.shortName}</p>
                            <div className="h-6 mb-2">
                              <MiniChart positive={stock.regularMarketChangePercent >= 0} />
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-foreground">
                                {formatPrice(stock.regularMarketPrice)}
                              </span>
                              <span className="text-xs px-2 py-1 rounded-full bg-destructive text-destructive-foreground">
                                - {Math.abs(stock.regularMarketChangePercent).toFixed(2)}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* Favoritos Tab */}
        {activeTab === "favoritos" && (
          <motion.div 
            key="favoritos"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-4 pt-4"
          >
            {favorites.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Star className="w-12 h-12 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Sem favoritos</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Adicione ações aos favoritos para<br/>acompanhar de perto
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {marketStocks.filter(s => favorites.includes(s.symbol)).map((stock) => (
                  <div 
                    key={stock.symbol}
                    onClick={() => {
                      setSelectedStock(stock);
                      setStockDetailOpen(true);
                    }}
                    className="bg-card border border-border rounded-xl p-4 cursor-pointer active:scale-95 transition-transform"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-foreground">{stock.symbol}</p>
                      <button onClick={(e) => { e.stopPropagation(); toggleFavorite(stock.symbol); }}>
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2 truncate">{stock.shortName}</p>
                    <div className="h-6 mb-2">
                      <MiniChart positive={stock.regularMarketChangePercent >= 0} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">
                        {formatPrice(stock.regularMarketPrice)}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        stock.regularMarketChangePercent >= 0 
                          ? "bg-success text-success-foreground" 
                          : "bg-destructive text-destructive-foreground"
                      }`}>
                        {stock.regularMarketChangePercent >= 0 ? "+ " : "- "}
                        {Math.abs(stock.regularMarketChangePercent).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stock Detail Drawer */}
      <StockDetailDrawer
        isOpen={stockDetailOpen}
        onClose={() => setStockDetailOpen(false)}
        stock={selectedStock}
        showValues={showValues}
        onToggleFavorite={toggleFavorite}
        isFavorite={selectedStock ? favorites.includes(selectedStock.symbol) : false}
      />
    </div>
  );
};

export default TradeTab;
