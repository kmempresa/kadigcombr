import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  Search,
  Star,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Loader2
} from "lucide-react";
import { Input } from "@/components/ui/input";

interface StockQuote {
  symbol: string;
  shortName: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketTime: string;
}

interface IndexQuote {
  symbol: string;
  name: string;
  points: number;
  change: number;
  changePercent: number;
}

// Major Brazilian indices
const majorIndices: IndexQuote[] = [
  { symbol: "IBOV", name: "Ibovespa", points: 127845, change: 1245, changePercent: 0.98 },
  { symbol: "IFIX", name: "IFIX", points: 3245, change: -12, changePercent: -0.37 },
  { symbol: "SMLL", name: "Small Caps", points: 2156, change: 34, changePercent: 1.58 },
  { symbol: "IDIV", name: "Dividendos", points: 7823, change: 89, changePercent: 1.15 },
];

// Popular stocks for quick access
const popularStocks = [
  "PETR4", "VALE3", "ITUB4", "BBDC4", "ABEV3", 
  "WEGE3", "RENT3", "MGLU3", "BBAS3", "B3SA3",
  "SUZB3", "JBSS3", "LREN3", "RADL3", "RAIL3"
];

interface TradeTabProps {
  showValues: boolean;
}

const TradeTab = ({ showValues }: TradeTabProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [stocks, setStocks] = useState<StockQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(["PETR4", "VALE3", "ITUB4"]);
  const [activeFilter, setActiveFilter] = useState<"all" | "favorites" | "gainers" | "losers">("all");

  // Fetch stock quotes from Brapi API
  const fetchStocks = async (tickers: string[]) => {
    try {
      const response = await fetch(
        `https://brapi.dev/api/quote/${tickers.join(",")}?token=`
      );
      const data = await response.json();
      
      if (data.results) {
        return data.results.map((stock: any) => ({
          symbol: stock.symbol,
          shortName: stock.shortName || stock.longName || stock.symbol,
          regularMarketPrice: stock.regularMarketPrice || 0,
          regularMarketChange: stock.regularMarketChange || 0,
          regularMarketChangePercent: stock.regularMarketChangePercent || 0,
          regularMarketTime: stock.regularMarketTime || new Date().toISOString(),
        }));
      }
      return [];
    } catch (error) {
      console.error("Error fetching stocks:", error);
      // Return mock data if API fails
      return tickers.map(ticker => ({
        symbol: ticker,
        shortName: ticker,
        regularMarketPrice: Math.random() * 100 + 10,
        regularMarketChange: (Math.random() - 0.5) * 5,
        regularMarketChangePercent: (Math.random() - 0.5) * 10,
        regularMarketTime: new Date().toISOString(),
      }));
    }
  };

  const loadStocks = async () => {
    setLoading(true);
    const stocksData = await fetchStocks(popularStocks);
    setStocks(stocksData);
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStocks();
    setRefreshing(false);
  };

  useEffect(() => {
    loadStocks();
    // Refresh every 30 seconds
    const interval = setInterval(loadStocks, 30000);
    return () => clearInterval(interval);
  }, []);

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

  const formatChange = (change: number, percent: number) => {
    if (!showValues) return "••%";
    const sign = change >= 0 ? "+" : "";
    return `${sign}${percent.toFixed(2)}%`;
  };

  const filteredStocks = stocks.filter(stock => {
    if (searchTerm) {
      return stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
             stock.shortName.toLowerCase().includes(searchTerm.toLowerCase());
    }
    switch (activeFilter) {
      case "favorites":
        return favorites.includes(stock.symbol);
      case "gainers":
        return stock.regularMarketChange > 0;
      case "losers":
        return stock.regularMarketChange < 0;
      default:
        return true;
    }
  });

  return (
    <div className="flex-1 pb-20">
      {/* Header */}
      <header className="p-4 safe-area-inset-top">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-foreground">Trade</h1>
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Buscar ativo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12 bg-card border-border rounded-xl"
          />
        </div>
      </header>

      {/* Indices Carousel */}
      <div className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
        <div className="flex gap-3" style={{ minWidth: "max-content" }}>
          {majorIndices.map((index) => (
            <motion.div
              key={index.symbol}
              whileTap={{ scale: 0.98 }}
              className="bg-card border border-border rounded-xl p-4 min-w-[160px]"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-primary">{index.symbol}</span>
                {index.change >= 0 ? (
                  <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-500" />
                )}
              </div>
              <p className="text-lg font-bold text-foreground">
                {showValues ? index.points.toLocaleString("pt-BR") : "••••"}
              </p>
              <p className={`text-sm font-medium ${index.change >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                {showValues ? `${index.change >= 0 ? "+" : ""}${index.changePercent.toFixed(2)}%` : "••%"}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 mb-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {[
            { id: "all", label: "Todos" },
            { id: "favorites", label: "Favoritos" },
            { id: "gainers", label: "📈 Altas" },
            { id: "losers", label: "📉 Baixas" },
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id as any)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeFilter === filter.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stock List */}
      <div className="px-4 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredStocks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum ativo encontrado</p>
          </div>
        ) : (
          filteredStocks.map((stock, index) => (
            <motion.div
              key={stock.symbol}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="bg-card border border-border rounded-xl p-4 flex items-center gap-3"
            >
              {/* Favorite Button */}
              <button
                onClick={() => toggleFavorite(stock.symbol)}
                className="text-muted-foreground hover:text-yellow-500 transition-colors"
              >
                <Star 
                  className={`w-5 h-5 ${favorites.includes(stock.symbol) ? "fill-yellow-500 text-yellow-500" : ""}`} 
                />
              </button>

              {/* Stock Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground">{stock.symbol}</span>
                  {stock.regularMarketChange >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {stock.shortName}
                </p>
              </div>

              {/* Price Info */}
              <div className="text-right">
                <p className="font-bold text-foreground">
                  {formatPrice(stock.regularMarketPrice)}
                </p>
                <p className={`text-sm font-medium ${
                  stock.regularMarketChange >= 0 ? "text-emerald-500" : "text-red-500"
                }`}>
                  {formatChange(stock.regularMarketChange, stock.regularMarketChangePercent)}
                </p>
              </div>

              {/* Action */}
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </motion.div>
          ))
        )}
      </div>

      {/* Last Update */}
      <div className="px-4 pt-4 pb-8">
        <p className="text-xs text-center text-muted-foreground">
          Dados atualizados automaticamente a cada 30 segundos
        </p>
      </div>
    </div>
  );
};

export default TradeTab;
