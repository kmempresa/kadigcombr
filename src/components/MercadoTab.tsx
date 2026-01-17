import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search,
  Star,
  Loader2,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  RefreshCw
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import StockDetailDrawer from "@/components/StockDetailDrawer";

interface StockQuote {
  symbol: string;
  shortName: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  logoUrl?: string | null;
}

interface MarketIndex {
  name: string;
  value: number;
  changePercent: number;
  type?: string;
}

interface Commodity {
  name: string;
  symbol: string;
  value: number;
  changePercent: number;
  icon: string;
}

interface NewsItem {
  title: string;
  source_name: string;
  date: string;
  news_url: string;
  image_url: string | null;
}

interface MercadoTabProps {
  showValues: boolean;
}

const MercadoTab = ({ showValues }: MercadoTabProps) => {
  const [selectedStock, setSelectedStock] = useState<StockQuote | null>(null);
  const [stockDetailOpen, setStockDetailOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [lastUpdate, setLastUpdate] = useState<string>("-");
  const [marketStocks, setMarketStocks] = useState<StockQuote[]>([]);
  const [maioresAltas, setMaioresAltas] = useState<StockQuote[]>([]);
  const [maioresBaixas, setMaioresBaixas] = useState<StockQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [marketIndices, setMarketIndices] = useState<MarketIndex[]>([]);
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [marketNews, setMarketNews] = useState<NewsItem[]>([]);
  const [loadingNews, setLoadingNews] = useState(false);
  
  // Filtros para ações
  const [assetFilter, setAssetFilter] = useState<"acoes" | "fiis" | "bdrs" | "etfs" | "cripto">("acoes");

  const fetchMarketNews = async () => {
    setLoadingNews(true);
    try {
      const { data, error } = await supabase.functions.invoke('market-data', {
        body: { type: 'market-news' }
      });
      
      if (error) throw error;
      
      if (data?.news) {
        setMarketNews(data.news);
      }
    } catch (error) {
      console.error("Error fetching market news:", error);
    }
    setLoadingNews(false);
  };

  const fetchMarketData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('market-data', {
        body: { type: 'all' }
      });
      
      if (error) throw error;
      
      if (data) {
        setMarketStocks(data.stocks || []);
        setMaioresAltas(data.maioresAltas || []);
        setMaioresBaixas(data.maioresBaixas || []);
        setMarketIndices(data.indices || []);
        setCommodities(data.commodities || []);
        const now = new Date();
        setLastUpdate(now.toLocaleDateString("pt-BR") + " às " + now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
      }
    } catch (error) {
      console.error("Error fetching market:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMarketData();
    fetchMarketNews();
    const interval = setInterval(fetchMarketData, 60000);
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
    if (!showValues) return "R$ ••••••";
    return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const assetFilters = [
    { id: "acoes", label: "Ações" },
    { id: "fiis", label: "FIIs" },
    { id: "bdrs", label: "BDRs" },
    { id: "etfs", label: "ETFs" },
    { id: "cripto", label: "Cripto" },
  ];

  const filteredStocks = searchTerm 
    ? marketStocks.filter(s => 
        s.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.shortName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : maioresAltas;

  // Mini chart component
  const MiniChart = ({ positive }: { positive: boolean }) => (
    <svg viewBox="0 0 60 20" className="w-full h-5">
      <path
        d={positive 
          ? "M0,15 L10,13 L20,14 L30,10 L40,11 L50,8 L60,5"
          : "M0,5 L10,7 L20,6 L30,10 L40,9 L50,12 L60,15"
        }
        fill="none"
        stroke={positive ? "#22c55e" : "#ef4444"}
        strokeWidth="1.5"
      />
    </svg>
  );

  return (
    <div className="flex-1 pb-20 bg-background overflow-y-auto">
      {/* Header */}
      <header className="p-4 safe-area-inset-top">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-semibold text-foreground">Mercado</h1>
          <button 
            onClick={() => { fetchMarketData(); fetchMarketNews(); }}
            className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted/50"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <p className="text-xs text-muted-foreground">Atualizado: {lastUpdate}</p>
      </header>

      {loading && marketStocks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
          <p className="text-sm text-muted-foreground">Carregando dados do mercado...</p>
        </div>
      ) : (
        <>
          {/* Notícias em destaque */}
          <section className="px-4 pb-4">
            <h2 className="text-lg font-semibold text-foreground mb-3">Notícias em destaque</h2>
            
            {loadingNews ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : marketNews.length > 0 ? (
              <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
                {marketNews.map((news, index) => (
                  <a
                    key={index}
                    href={news.news_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 w-72 bg-card border border-border rounded-xl overflow-hidden"
                  >
                    {news.image_url && (
                      <div className="h-32 bg-muted">
                        <img 
                          src={news.image_url} 
                          alt="" 
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                    )}
                    <div className="p-3">
                      <h3 className="text-sm font-medium text-foreground line-clamp-2 mb-2">
                        {news.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{news.source_name}</span>
                        <ExternalLink className="w-3 h-3" />
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <p className="text-sm text-muted-foreground">Nenhuma notícia disponível</p>
              </div>
            )}
          </section>

          {/* Índices do mercado */}
          <section className="px-4 pb-4">
            <h2 className="text-lg font-semibold text-foreground mb-3">Índices do mercado</h2>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
              {marketIndices.map((index) => (
                <div 
                  key={index.name}
                  className="flex-shrink-0 w-36 bg-card border border-border rounded-xl p-4"
                >
                  <p className="font-semibold text-foreground text-sm mb-2">{index.name}</p>
                  <div className="h-6 mb-2">
                    <MiniChart positive={index.changePercent >= 0} />
                  </div>
                  <p className="text-sm text-foreground mb-1">{formatNumber(index.value)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                    index.changePercent >= 0 
                      ? "bg-emerald-500/20 text-emerald-600" 
                      : "bg-red-500/20 text-red-600"
                  }`}>
                    {index.changePercent >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {index.changePercent >= 0 ? "+" : ""}{index.changePercent.toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Commodities */}
          <section className="px-4 pb-4">
            <h2 className="text-lg font-semibold text-foreground mb-3">Commodities</h2>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
              {commodities.map((commodity) => (
                <div 
                  key={commodity.symbol}
                  className="flex-shrink-0 w-28 bg-card border border-border rounded-xl p-3 text-center"
                >
                  <span className="text-2xl mb-1 block">{commodity.icon}</span>
                  <p className="font-semibold text-foreground text-sm">{commodity.name}</p>
                  <p className="text-xs text-foreground">${formatNumber(commodity.value)}</p>
                  <span className={`text-xs ${
                    commodity.changePercent >= 0 ? "text-emerald-600" : "text-red-600"
                  }`}>
                    {commodity.changePercent >= 0 ? "+" : ""}{commodity.changePercent.toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Busca e Filtros */}
          <section className="px-4 pb-4">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Buscar ativo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 bg-muted/30 border-border"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
              {assetFilters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setAssetFilter(filter.id as any)}
                  className={`px-4 py-2 text-sm font-medium whitespace-nowrap rounded-full transition-colors ${
                    assetFilter === filter.id 
                      ? "bg-primary text-white" 
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </section>

          {/* Lista de Ações */}
          <section className="px-4 pb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-foreground">
                {searchTerm ? "Resultados" : "Maiores altas"}
              </h2>
            </div>

            <div className="space-y-2">
              {(searchTerm ? filteredStocks : maioresAltas.slice(0, 8)).map((stock) => (
                <div 
                  key={stock.symbol}
                  onClick={() => {
                    setSelectedStock(stock);
                    setStockDetailOpen(true);
                  }}
                  className="bg-card border border-border rounded-xl p-3 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform"
                >
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                    {stock.logoUrl ? (
                      <img 
                        src={stock.logoUrl} 
                        alt={stock.symbol}
                        className="w-8 h-8 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <span className="text-xs font-bold text-foreground">
                        {stock.symbol.slice(0, 2)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground">{stock.symbol}</p>
                    <p className="text-xs text-muted-foreground truncate">{stock.shortName}</p>
                  </div>
                  <div className="w-16 h-8">
                    <MiniChart positive={stock.regularMarketChangePercent >= 0} />
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-foreground text-sm">{formatPrice(stock.regularMarketPrice)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      stock.regularMarketChangePercent >= 0 
                        ? "bg-emerald-500/20 text-emerald-600" 
                        : "bg-red-500/20 text-red-600"
                    }`}>
                      {stock.regularMarketChangePercent >= 0 ? "+" : ""}
                      {stock.regularMarketChangePercent.toFixed(2)}%
                    </span>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(stock.symbol); }}
                    className="p-1"
                  >
                    <Star className={`w-4 h-4 ${
                      favorites.includes(stock.symbol) 
                        ? "fill-yellow-400 text-yellow-400" 
                        : "text-muted-foreground"
                    }`} />
                  </button>
                </div>
              ))}
            </div>

            {/* Maiores Baixas */}
            {!searchTerm && (
              <>
                <h2 className="text-lg font-semibold text-foreground mt-6 mb-3">Maiores baixas</h2>
                <div className="space-y-2">
                  {maioresBaixas.slice(0, 5).map((stock) => (
                    <div 
                      key={stock.symbol}
                      onClick={() => {
                        setSelectedStock(stock);
                        setStockDetailOpen(true);
                      }}
                      className="bg-card border border-border rounded-xl p-3 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform"
                    >
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                        {stock.logoUrl ? (
                          <img 
                            src={stock.logoUrl} 
                            alt={stock.symbol}
                            className="w-8 h-8 object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <span className="text-xs font-bold text-foreground">
                            {stock.symbol.slice(0, 2)}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground">{stock.symbol}</p>
                        <p className="text-xs text-muted-foreground truncate">{stock.shortName}</p>
                      </div>
                      <div className="w-16 h-8">
                        <MiniChart positive={stock.regularMarketChangePercent >= 0} />
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-foreground text-sm">{formatPrice(stock.regularMarketPrice)}</p>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-600">
                          {stock.regularMarketChangePercent.toFixed(2)}%
                        </span>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(stock.symbol); }}
                        className="p-1"
                      >
                        <Star className={`w-4 h-4 ${
                          favorites.includes(stock.symbol) 
                            ? "fill-yellow-400 text-yellow-400" 
                            : "text-muted-foreground"
                        }`} />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        </>
      )}

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

export default MercadoTab;
