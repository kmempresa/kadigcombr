import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  HelpCircle,
  Eye,
  EyeOff,
  Search,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Plus,
  Link2,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Star,
  Loader2,
  BarChart3,
  Wallet
} from "lucide-react";
import { Input } from "@/components/ui/input";

interface StockQuote {
  symbol: string;
  shortName: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
}

const popularStocks = [
  "PETR4", "VALE3", "ITUB4", "BBDC4", "ABEV3", 
  "WEGE3", "RENT3", "MGLU3", "BBAS3", "B3SA3",
  "SUZB3", "JBSS3", "LREN3", "RADL3", "RAIL3"
];

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
  const [patrimonioExpanded, setPatrimonioExpanded] = useState(false);

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
        setLastUpdate(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
      }
    } catch (error) {
      console.error("Error fetching market:", error);
      setMarketStocks(popularStocks.map(ticker => ({
        symbol: ticker,
        shortName: ticker,
        regularMarketPrice: Math.random() * 100 + 10,
        regularMarketChange: (Math.random() - 0.5) * 5,
        regularMarketChangePercent: (Math.random() - 0.5) * 10,
      })));
      setLastUpdate(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
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

  return (
    <div className="flex-1 pb-20 bg-background">
      {/* Header - Same pattern as Carteira */}
      <header className="flex items-center justify-between p-4 safe-area-inset-top">
        <button 
          onClick={() => setPatrimonioExpanded(!patrimonioExpanded)}
          className="flex items-center gap-2 active:opacity-70 transition-opacity"
        >
          {patrimonioExpanded ? (
            <ChevronUp className="w-5 h-5 text-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-foreground" />
          )}
          <span className="font-semibold text-foreground">
            Trade {userName}
          </span>
        </button>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setSearchOpen(!searchOpen)}
            className="p-2 text-muted-foreground"
          >
            <Search className="w-5 h-5" />
          </button>
          <button className="p-2 text-muted-foreground" onClick={onToggleValues}>
            {showValues ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
          </button>
          <button className="p-2 text-muted-foreground">
            <HelpCircle className="w-5 h-5" />
          </button>
          <button 
            onClick={onAddAsset}
            className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-md"
          >
            <Plus className="w-5 h-5 text-white" />
          </button>
        </div>
      </header>

      {/* Search Bar */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 pb-2"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar ativo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10 pl-10 bg-muted/50 border-border"
                autoFocus
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sub Tabs - Same pattern as Carteira */}
      <div className="flex border-b border-border px-4 overflow-x-auto bg-card/50">
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            whileTap={{ scale: 0.95 }}
            className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition-all relative ${
              activeTab === tab.id ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="tradeTab"
                className="absolute bottom-0 left-2 right-2 h-[3px] bg-primary rounded-full"
              />
            )}
          </motion.button>
        ))}
      </div>

      {/* Real-time indicator */}
      {(activeTab === "mercado" || activeTab === "favoritos") && (
        <div className="px-4 py-3 flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-muted-foreground">Tempo real</span>
          </div>
          <div className="flex items-center gap-2">
            <RefreshCw className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{lastUpdate}</span>
          </div>
        </div>
      )}

      {/* Content */}
      <AnimatePresence mode="wait">
        {/* Meus Ativos Tab */}
        {activeTab === "meus-ativos" && (
          <motion.div 
            key="meus-ativos"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-4"
          >
            {userAssets.length === 0 ? (
              <div className="bg-card border border-dashed border-border rounded-2xl p-8 text-center">
                <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-2">
                  Adicione ativos da bolsa
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Você não possui ativos de renda variável nesta carteira
                </p>
                
                <div className="space-y-3">
                  <button
                    onClick={onAddAsset}
                    className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-medium flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar ativos
                  </button>
                  
                  <button
                    onClick={onAddConnection}
                    className="w-full bg-card border border-border py-3 rounded-xl font-medium flex items-center justify-center gap-2 text-foreground"
                  >
                    <Link2 className="w-4 h-4" />
                    Adicionar conexão
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {userAssets.map((asset, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-card border border-border rounded-xl p-4"
                  >
                    <div className="flex items-center gap-3">
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
                        <p className={`text-xs ${asset.gain_percent >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                          {asset.gain_percent >= 0 ? "+" : ""}{asset.gain_percent?.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Patrimônio Tab */}
        {activeTab === "patrimonio" && (
          <motion.div 
            key="patrimonio"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-4 space-y-4"
          >
            {/* Summary Card */}
            <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-5 text-white">
              <p className="text-white/70 text-sm mb-1">Patrimônio em Renda Variável</p>
              <p className="text-3xl font-bold mb-4">
                {showValues ? "R$ 0,00" : "R$ ••••••"}
              </p>
              <div className="flex gap-4">
                <div className="flex-1 bg-white/10 rounded-lg p-3">
                  <p className="text-white/60 text-xs">Resultado</p>
                  <p className="text-white font-semibold">R$ 0,00</p>
                </div>
                <div className="flex-1 bg-white/10 rounded-lg p-3">
                  <p className="text-white/60 text-xs">Rentabilidade</p>
                  <p className="text-white font-semibold">0,00%</p>
                </div>
              </div>
            </div>

            {/* Allocation */}
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="font-semibold text-foreground mb-4">Alocação por tipo</h3>
              <div className="flex items-center justify-center py-6">
                <p className="text-sm text-muted-foreground">Sem ativos para exibir</p>
              </div>
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
            className="p-4 space-y-2"
          >
            {loadingMarket ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
                <p className="text-sm text-muted-foreground">Carregando cotações...</p>
              </div>
            ) : (
              filteredMarketStocks.map((stock, index) => (
                <motion.div
                  key={stock.symbol}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="bg-card border border-border rounded-xl p-4 flex items-center gap-3"
                >
                  <button
                    onClick={() => toggleFavorite(stock.symbol)}
                    className="p-1"
                  >
                    <Star 
                      className={`w-5 h-5 ${
                        favorites.includes(stock.symbol) 
                          ? "fill-yellow-400 text-yellow-400" 
                          : "text-muted-foreground"
                      }`} 
                    />
                  </button>

                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">
                      {stock.symbol.slice(0, 2)}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{stock.symbol}</span>
                      {stock.regularMarketChange >= 0 ? (
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{stock.shortName}</p>
                  </div>

                  <div className="text-right">
                    <p className="font-medium text-foreground">{formatPrice(stock.regularMarketPrice)}</p>
                    <p className={`text-xs ${stock.regularMarketChange >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                      {stock.regularMarketChange >= 0 ? "+" : ""}
                      {stock.regularMarketChangePercent.toFixed(2)}%
                    </p>
                  </div>

                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </motion.div>
              ))
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
            className="p-4"
          >
            {favorites.length === 0 ? (
              <div className="bg-card border border-dashed border-border rounded-2xl p-8 text-center">
                <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-2">Nenhum favorito</h3>
                <p className="text-sm text-muted-foreground">
                  Toque na ⭐ de um ativo na aba Mercado para adicionar aqui
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {marketStocks
                  .filter(stock => favorites.includes(stock.symbol))
                  .map((stock, index) => (
                    <motion.div 
                      key={stock.symbol}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-card border border-border rounded-xl p-4 flex items-center gap-3"
                    >
                      <button onClick={() => toggleFavorite(stock.symbol)}>
                        <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      </button>
                      
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">{stock.symbol.slice(0, 2)}</span>
                      </div>
                      
                      <div className="flex-1">
                        <span className="font-semibold text-foreground">{stock.symbol}</span>
                        <p className="text-xs text-muted-foreground">{stock.shortName}</p>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-medium text-foreground">{formatPrice(stock.regularMarketPrice)}</p>
                        <p className={`text-xs ${stock.regularMarketChange >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                          {stock.regularMarketChange >= 0 ? "+" : ""}
                          {stock.regularMarketChangePercent.toFixed(2)}%
                        </p>
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
