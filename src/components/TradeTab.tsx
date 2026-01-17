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
  TrendingDown,
  RefreshCw,
  Star,
  Loader2,
  Zap,
  BarChart3,
  Activity,
  X
} from "lucide-react";
import { Input } from "@/components/ui/input";

interface StockQuote {
  symbol: string;
  shortName: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  logoUrl?: string;
}

// Popular stocks for market view
const popularStocks = [
  "PETR4", "VALE3", "ITUB4", "BBDC4", "ABEV3", 
  "WEGE3", "RENT3", "MGLU3", "BBAS3", "B3SA3",
  "SUZB3", "JBSS3", "LREN3", "RADL3", "RAIL3"
];

// Stock logos (using initials as fallback)
const getStockColor = (symbol: string) => {
  const colors = [
    "from-blue-500 to-blue-600",
    "from-emerald-500 to-emerald-600",
    "from-purple-500 to-purple-600",
    "from-orange-500 to-orange-600",
    "from-pink-500 to-pink-600",
    "from-cyan-500 to-cyan-600",
    "from-red-500 to-red-600",
    "from-indigo-500 to-indigo-600",
  ];
  const index = symbol.charCodeAt(0) % colors.length;
  return colors[index];
};

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
  const [activeTab, setActiveTab] = useState<"meus-ativos" | "patrimonio" | "mercado" | "favoritos">("meus-ativos");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [lastUpdate, setLastUpdate] = useState<string>("-");
  const [marketStocks, setMarketStocks] = useState<StockQuote[]>([]);
  const [loadingMarket, setLoadingMarket] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLive, setIsLive] = useState(true);
  const [portfolioOpen, setPortfolioOpen] = useState(false);

  // Fetch market stocks
  const fetchMarketStocks = async () => {
    setLoadingMarket(true);
    try {
      const response = await fetch(
        `https://brapi.dev/api/quote/${popularStocks.join(",")}?token=`
      );
      const data = await response.json();
      
      if (data.results) {
        setMarketStocks(data.results.map((stock: any) => ({
          symbol: stock.symbol,
          shortName: stock.shortName || stock.longName || stock.symbol,
          regularMarketPrice: stock.regularMarketPrice || 0,
          regularMarketChange: stock.regularMarketChange || 0,
          regularMarketChangePercent: stock.regularMarketChangePercent || 0,
        })));
        setLastUpdate(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      }
    } catch (error) {
      console.error("Error fetching market:", error);
      // Mock data fallback
      setMarketStocks(popularStocks.map(ticker => ({
        symbol: ticker,
        shortName: ticker,
        regularMarketPrice: Math.random() * 100 + 10,
        regularMarketChange: (Math.random() - 0.5) * 5,
        regularMarketChangePercent: (Math.random() - 0.5) * 10,
      })));
      setLastUpdate(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    }
    setLoadingMarket(false);
  };

  useEffect(() => {
    if (activeTab === "mercado" || activeTab === "favoritos") {
      fetchMarketStocks();
      const interval = setInterval(fetchMarketStocks, 15000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  const toggleFavorite = (symbol: string) => {
    setFavorites(prev => 
      prev.includes(symbol) 
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol]
    );
  };

  const formatPrice = (price: number) => {
    if (!showValues) return "R$ ••••••";
    return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const tabs = [
    { id: "meus-ativos", label: "Meus ativos", icon: BarChart3 },
    { id: "patrimonio", label: "Patrimônio", icon: TrendingUp },
    { id: "mercado", label: "Mercado", icon: Activity },
    { id: "favoritos", label: "Favoritos", icon: Star },
  ];

  const filteredMarketStocks = searchTerm 
    ? marketStocks.filter(s => 
        s.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.shortName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : marketStocks;

  return (
    <div className="flex-1 pb-20 bg-gradient-to-b from-background to-muted/20">
      {/* Header with glassmorphism */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-10 backdrop-blur-xl bg-background/80 border-b border-border/50 safe-area-inset-top"
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <motion.div 
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center shadow-lg shadow-primary/25"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Zap className="w-5 h-5 text-white" />
              </motion.div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Kadig Trade</h1>
                <div className="flex items-center gap-1">
                  <motion.div 
                    className={`w-2 h-2 rounded-full ${isLive ? "bg-emerald-500" : "bg-muted"}`}
                    animate={isLive ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 2 }}
                  />
                  <span className="text-[10px] text-muted-foreground">
                    {isLive ? "AO VIVO" : "OFFLINE"}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <motion.button 
                whileTap={{ scale: 0.9 }}
                className="p-2.5 rounded-full hover:bg-muted/50 transition-colors"
              >
                <HelpCircle className="w-5 h-5 text-muted-foreground" />
              </motion.button>
              <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={onToggleValues}
                className="p-2.5 rounded-full hover:bg-muted/50 transition-colors"
              >
                {showValues ? <Eye className="w-5 h-5 text-muted-foreground" /> : <EyeOff className="w-5 h-5 text-muted-foreground" />}
              </motion.button>
              <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={() => setSearchOpen(!searchOpen)}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  searchOpen 
                    ? "bg-primary text-white shadow-lg shadow-primary/25" 
                    : "bg-muted/50 text-foreground"
                }`}
              >
                {searchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
              </motion.button>
            </div>
          </div>

          {/* Search Bar */}
          <AnimatePresence>
            {searchOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              >
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Buscar ativo, ticker ou empresa..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-12 pl-12 bg-muted/50 border-0 rounded-xl text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
                    autoFocus
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tabs with modern design */}
          <div className="flex gap-1 p-1 bg-muted/30 rounded-xl overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  whileTap={{ scale: 0.98 }}
                  className={`flex-1 min-w-fit px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex items-center justify-center gap-2 ${
                    isActive
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-primary" : ""}`} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </motion.header>

      {/* Portfolio Selector */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="px-4 py-3"
      >
        <div className="flex items-center gap-3">
          <motion.button 
            whileTap={{ scale: 0.98 }}
            onClick={() => setPortfolioOpen(!portfolioOpen)}
            className="flex-1 flex items-center justify-between bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-violet-500/20 flex items-center justify-center">
                <span className="text-lg font-bold text-primary">
                  {userName?.charAt(0)?.toUpperCase() || "K"}
                </span>
              </div>
              <div className="text-left">
                <p className="text-foreground font-semibold">Patrimônio {userName}</p>
                <p className="text-xs text-muted-foreground">Carteira principal</p>
              </div>
            </div>
            <motion.div animate={{ rotate: portfolioOpen ? 180 : 0 }}>
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            </motion.div>
          </motion.button>
          
          <motion.button 
            whileTap={{ scale: 0.95 }}
            className="relative w-14 h-14 bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl flex items-center justify-center shadow-sm hover:shadow-md transition-all"
          >
            <List className="w-5 h-5 text-muted-foreground" />
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg"
            >
              <span className="text-[10px] text-white font-bold">1</span>
            </motion.div>
          </motion.button>
        </div>
      </motion.div>

      {/* Real-time update indicator */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="px-4 pb-4"
      >
        <div className="flex items-center justify-center gap-3 py-3 px-4 bg-gradient-to-r from-emerald-500/10 via-primary/10 to-violet-500/10 rounded-xl border border-primary/10">
          <motion.div 
            className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 shadow-lg shadow-emerald-500/50"
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [1, 0.7, 1]
            }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          />
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Atualização</span>
            <span className="text-sm font-semibold bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
              em tempo real
            </span>
          </div>
          <div className="h-4 w-px bg-border" />
          <span className="text-xs text-muted-foreground font-mono">
            {lastUpdate}
          </span>
        </div>
      </motion.div>

      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* Content based on active tab */}
      <AnimatePresence mode="wait">
        {activeTab === "meus-ativos" && (
          <motion.div 
            key="meus-ativos"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="p-4"
          >
            {userAssets.length === 0 ? (
              /* Empty State - Premium Design */
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-16"
              >
                {/* Animated Icon Group */}
                <div className="relative mb-8">
                  {/* Glow effect */}
                  <motion.div 
                    className="absolute inset-0 bg-primary/20 rounded-full blur-3xl"
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [0.3, 0.5, 0.3]
                    }}
                    transition={{ repeat: Infinity, duration: 3 }}
                  />
                  
                  {/* Main circle */}
                  <motion.div 
                    className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-violet-500/20 flex items-center justify-center"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  >
                    <motion.div 
                      className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center shadow-xl shadow-primary/30"
                      whileHover={{ scale: 1.1 }}
                    >
                      <Plus className="w-8 h-8 text-white" />
                    </motion.div>
                  </motion.div>
                  
                  {/* Animated hand pointer */}
                  <motion.div 
                    className="absolute -bottom-4 -right-4"
                    animate={{ 
                      x: [0, 5, 0],
                      y: [0, 5, 0],
                      rotate: [0, 5, 0]
                    }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="drop-shadow-lg">
                      <path d="M24 8C24 5.79086 25.7909 4 28 4V4C30.2091 4 32 5.79086 32 8V24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-muted-foreground"/>
                      <path d="M32 20C32 17.7909 33.7909 16 36 16V16C38.2091 16 40 17.7909 40 20V28" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-muted-foreground"/>
                      <path d="M16 28V12C16 9.79086 17.7909 8 20 8V8C22.2091 8 24 9.79086 24 12V24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-muted-foreground"/>
                      <path d="M16 28L12 32C10 34 10 38 12 40L16 44H36C40 44 40 40 40 36V28" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"/>
                    </svg>
                  </motion.div>
                </div>
                
                <motion.h3 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-xl font-bold text-foreground text-center mb-2"
                >
                  Adicione ativos da bolsa<br/>na sua carteira
                </motion.h3>
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-sm text-muted-foreground text-center mb-8 max-w-[280px]"
                >
                  Você não possui ativos da bolsa nesta carteira. Comece agora!
                </motion.p>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="w-full max-w-sm space-y-3"
                >
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onAddAsset}
                    className="w-full h-16 bg-gradient-to-r from-primary to-violet-500 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-primary/25 text-white font-semibold"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <Plus className="w-5 h-5" />
                    </div>
                    Adicionar ativos
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onAddConnection}
                    className="w-full h-16 bg-card border border-border rounded-2xl flex items-center justify-center gap-3 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Link2 className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-foreground font-medium">Adicionar conexão</span>
                  </motion.button>
                </motion.div>
              </motion.div>
            ) : (
              /* Assets List with animations */
              <div className="space-y-3">
                {userAssets.map((asset, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.01, y: -2 }}
                    className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getStockColor(asset.ticker || asset.asset_name)} flex items-center justify-center shadow-lg`}>
                        <span className="text-white font-bold text-sm">
                          {(asset.ticker || asset.asset_name)?.slice(0, 2)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-foreground">{asset.ticker || asset.asset_name}</p>
                        <p className="text-xs text-muted-foreground">{asset.asset_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-foreground">{formatPrice(asset.current_value)}</p>
                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          asset.gain_percent >= 0 
                            ? "bg-emerald-500/10 text-emerald-500" 
                            : "bg-red-500/10 text-red-500"
                        }`}>
                          {asset.gain_percent >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {asset.gain_percent >= 0 ? "+" : ""}{asset.gain_percent?.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "patrimonio" && (
          <motion.div 
            key="patrimonio"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="p-4 space-y-4"
          >
            {/* Total Card */}
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="bg-gradient-to-br from-primary via-violet-500 to-purple-600 rounded-3xl p-6 text-white shadow-xl shadow-primary/25"
            >
              <p className="text-white/80 text-sm mb-1">Patrimônio em Renda Variável</p>
              <p className="text-4xl font-bold mb-4">
                {showValues ? "R$ 0,00" : "R$ ••••••"}
              </p>
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-white/10 rounded-xl p-3">
                  <p className="text-white/60 text-xs">Resultado</p>
                  <p className="text-white font-semibold">R$ 0,00</p>
                </div>
                <div className="flex-1 bg-white/10 rounded-xl p-3">
                  <p className="text-white/60 text-xs">Rentabilidade</p>
                  <p className="text-white font-semibold">0,00%</p>
                </div>
              </div>
            </motion.div>

            {/* Allocation placeholder */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="font-semibold text-foreground mb-4">Alocação por tipo</h3>
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground text-sm">Sem ativos para exibir</p>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "mercado" && (
          <motion.div 
            key="mercado"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="p-4 space-y-3"
          >
            {loadingMarket ? (
              <div className="flex flex-col items-center justify-center py-16">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                >
                  <Loader2 className="w-10 h-10 text-primary" />
                </motion.div>
                <p className="text-muted-foreground mt-4">Carregando cotações...</p>
              </div>
            ) : (
              filteredMarketStocks.map((stock, index) => (
                <motion.div
                  key={stock.symbol}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  whileHover={{ scale: 1.01, x: 4 }}
                  className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-all cursor-pointer"
                >
                  {/* Favorite */}
                  <motion.button
                    whileTap={{ scale: 0.8 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(stock.symbol);
                    }}
                  >
                    <Star 
                      className={`w-5 h-5 transition-all ${
                        favorites.includes(stock.symbol) 
                          ? "fill-yellow-400 text-yellow-400 drop-shadow-lg" 
                          : "text-muted-foreground/50 hover:text-yellow-400"
                      }`} 
                    />
                  </motion.button>

                  {/* Stock logo */}
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getStockColor(stock.symbol)} flex items-center justify-center shadow-lg`}>
                    <span className="text-white font-bold text-sm">
                      {stock.symbol.slice(0, 2)}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">{stock.symbol}</span>
                      <motion.div
                        animate={stock.regularMarketChange !== 0 ? { y: [0, -2, 0] } : {}}
                        transition={{ repeat: Infinity, duration: 1 }}
                      >
                        {stock.regularMarketChange >= 0 ? (
                          <TrendingUp className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-500" />
                        )}
                      </motion.div>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{stock.shortName}</p>
                  </div>

                  {/* Price */}
                  <div className="text-right">
                    <p className="font-bold text-foreground">{formatPrice(stock.regularMarketPrice)}</p>
                    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      stock.regularMarketChange >= 0 
                        ? "bg-emerald-500/10 text-emerald-500" 
                        : "bg-red-500/10 text-red-500"
                    }`}>
                      {stock.regularMarketChange >= 0 ? "+" : ""}
                      {stock.regularMarketChangePercent.toFixed(2)}%
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-muted-foreground/50" />
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        {activeTab === "favoritos" && (
          <motion.div 
            key="favoritos"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="p-4"
          >
            {favorites.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-16"
              >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <Star className="w-16 h-16 text-muted-foreground/30 mb-4" />
                </motion.div>
                <p className="text-lg font-semibold text-foreground">Nenhum favorito ainda</p>
                <p className="text-sm text-muted-foreground mt-1 text-center max-w-[250px]">
                  Toque na ⭐ de um ativo na aba Mercado para adicionar aos favoritos
                </p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {marketStocks
                  .filter(stock => favorites.includes(stock.symbol))
                  .map((stock, index) => (
                    <motion.div 
                      key={stock.symbol}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-4 flex items-center gap-3"
                    >
                      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getStockColor(stock.symbol)} flex items-center justify-center shadow-lg`}>
                        <span className="text-white font-bold text-sm">{stock.symbol.slice(0, 2)}</span>
                      </div>
                      <div className="flex-1">
                        <span className="font-bold text-foreground">{stock.symbol}</span>
                        <p className="text-xs text-muted-foreground">{stock.shortName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-foreground">{formatPrice(stock.regularMarketPrice)}</p>
                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          stock.regularMarketChange >= 0 
                            ? "bg-emerald-500/10 text-emerald-500" 
                            : "bg-red-500/10 text-red-500"
                        }`}>
                          {stock.regularMarketChange >= 0 ? "+" : ""}
                          {stock.regularMarketChangePercent.toFixed(2)}%
                        </div>
                      </div>
                    </motion.div>
                  ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TradeTab;
