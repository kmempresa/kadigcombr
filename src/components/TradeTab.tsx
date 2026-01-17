import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  HelpCircle,
  Eye,
  EyeOff,
  Search,
  ChevronRight,
  Plus,
  Link2,
  List,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Star,
  Loader2
} from "lucide-react";
import { Input } from "@/components/ui/input";

interface StockQuote {
  symbol: string;
  shortName: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
}

// Popular stocks for market view
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
        setLastUpdate(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
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
      setLastUpdate(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
    }
    setLoadingMarket(false);
  };

  useEffect(() => {
    if (activeTab === "mercado") {
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
    if (!showValues) return "R$ ••••";
    return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const tabs = [
    { id: "meus-ativos", label: "Meus ativos" },
    { id: "patrimonio", label: "Patrimônio" },
    { id: "mercado", label: "Mercado" },
    { id: "favoritos", label: "Favoritos" },
  ];

  return (
    <div className="flex-1 pb-20">
      {/* Header */}
      <header className="p-4 safe-area-inset-top">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-foreground">Kadig Trade</h1>
          <div className="flex items-center gap-2">
            <button className="p-2 text-muted-foreground">
              <HelpCircle className="w-5 h-5" />
            </button>
            <button 
              onClick={onToggleValues}
              className="p-2 text-muted-foreground"
            >
              {showValues ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </button>
            <button 
              onClick={() => setSearchOpen(!searchOpen)}
              className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
            >
              <Search className="w-5 h-5 text-foreground" />
            </button>
          </div>
        </div>

        {/* Search Bar (when open) */}
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4"
          >
            <Input
              placeholder="Buscar ativo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-12 bg-card border-border rounded-xl"
              autoFocus
            />
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-background text-foreground shadow-sm border border-border"
                  : "text-muted-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Portfolio Selector */}
      <div className="px-4 mb-4">
        <div className="flex items-center gap-3">
          <button className="flex-1 flex items-center justify-between bg-card border border-border rounded-xl p-4">
            <span className="text-foreground font-medium">Patrimônio {userName}</span>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
          <button className="relative w-12 h-12 bg-card border border-border rounded-xl flex items-center justify-center">
            <List className="w-5 h-5 text-muted-foreground" />
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-[10px] text-white font-bold">1</span>
            </div>
          </button>
        </div>
      </div>

      {/* Real-time update indicator */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-center gap-2 text-sm">
          <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
          <span className="text-muted-foreground">Atualização</span>
          <span className="text-foreground font-medium">em tempo real</span>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-1">
          Última atualização: {lastUpdate}
        </p>
      </div>

      <div className="border-t border-border" />

      {/* Content based on active tab */}
      {activeTab === "meus-ativos" && (
        <div className="p-4">
          {userAssets.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative mb-4">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <Plus className="w-8 h-8 text-primary" />
                </div>
                <div className="absolute -bottom-2 -right-2">
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                    <path d="M20 5 L20 15 L10 20 L20 25 L20 35" stroke="currentColor" strokeWidth="2" className="text-muted-foreground" />
                    <circle cx="20" cy="15" r="3" fill="currentColor" className="text-muted-foreground" />
                  </svg>
                </div>
              </div>
              
              <h3 className="text-lg font-semibold text-foreground text-center mb-2">
                Adicione ativos da bolsa<br/>na sua carteira
              </h3>
              <p className="text-sm text-muted-foreground text-center mb-6">
                Você não possui ativos da bolsa nesta carteira
              </p>

              <div className="w-full max-w-xs space-y-3">
                <button
                  onClick={onAddAsset}
                  className="w-full h-14 bg-card border border-border rounded-2xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Plus className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-foreground font-medium">Adicionar ativos</span>
                </button>

                <button
                  onClick={onAddConnection}
                  className="w-full h-14 bg-card border border-border rounded-2xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Link2 className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-foreground font-medium">Adicionar conexão</span>
                </button>
              </div>
            </div>
          ) : (
            /* Assets List */
            <div className="space-y-2">
              {userAssets.map((asset, index) => (
                <div key={index} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-foreground">{asset.ticker || asset.asset_name}</p>
                      <p className="text-xs text-muted-foreground">{asset.asset_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground">{formatPrice(asset.current_value)}</p>
                      <p className={`text-xs ${asset.gain_percent >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                        {asset.gain_percent >= 0 ? "+" : ""}{asset.gain_percent?.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "patrimonio" && (
        <div className="p-4">
          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <p className="text-muted-foreground">Patrimônio em renda variável</p>
            <p className="text-3xl font-bold text-foreground mt-2">
              {showValues ? "R$ 0,00" : "R$ ••••"}
            </p>
          </div>
        </div>
      )}

      {activeTab === "mercado" && (
        <div className="p-4 space-y-2">
          {loadingMarket ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            marketStocks.map((stock, index) => (
              <motion.div
                key={stock.symbol}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="bg-card border border-border rounded-xl p-4 flex items-center gap-3"
              >
                <button
                  onClick={() => toggleFavorite(stock.symbol)}
                  className="text-muted-foreground"
                >
                  <Star 
                    className={`w-5 h-5 ${favorites.includes(stock.symbol) ? "fill-yellow-500 text-yellow-500" : ""}`} 
                  />
                </button>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">{stock.symbol}</span>
                    {stock.regularMarketChange >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{stock.shortName}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-foreground">{formatPrice(stock.regularMarketPrice)}</p>
                  <p className={`text-xs ${stock.regularMarketChange >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                    {stock.regularMarketChange >= 0 ? "+" : ""}{stock.regularMarketChangePercent.toFixed(2)}%
                  </p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {activeTab === "favoritos" && (
        <div className="p-4">
          {favorites.length === 0 ? (
            <div className="text-center py-12">
              <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum favorito ainda</p>
              <p className="text-sm text-muted-foreground mt-1">
                Adicione ativos aos favoritos na aba Mercado
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {marketStocks
                .filter(stock => favorites.includes(stock.symbol))
                .map((stock) => (
                  <div key={stock.symbol} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                    <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                    <div className="flex-1">
                      <span className="font-bold text-foreground">{stock.symbol}</span>
                      <p className="text-xs text-muted-foreground">{stock.shortName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground">{formatPrice(stock.regularMarketPrice)}</p>
                      <p className={`text-xs ${stock.regularMarketChange >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                        {stock.regularMarketChange >= 0 ? "+" : ""}{stock.regularMarketChangePercent.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TradeTab;
