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
  Loader2,
  ExternalLink
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
        setMarketIndices(data.indices || []);
        setCommodities(data.commodities || []);
        const now = new Date();
        setLastUpdate(now.toLocaleDateString("pt-BR") + " às " + now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
      }
    } catch (error) {
      console.error("Error fetching market:", error);
    }
    setLoadingMarket(false);
  };

  useEffect(() => {
    if (activeTab === "mercado" || activeTab === "favoritos") {
      fetchMarketStocks();
      fetchMarketNews();
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

  const formatNumber = (num: number) => {
    return num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const tabs = [
    { id: "meus-ativos", label: "Meus ativos" },
    { id: "patrimonio", label: "Patrimônio" },
    { id: "mercado", label: "Mercado" },
    { id: "favoritos", label: "Favoritos" },
  ];

  const assetFilters = [
    { id: "acoes", label: "Ações" },
    { id: "fiis", label: "FIIs" },
    { id: "bdrs", label: "BDRs" },
    { id: "etfs", label: "ETFs" },
    { id: "cripto", label: "Cripto" },
  ];

  const filteredMarketStocks = searchTerm 
    ? marketStocks.filter(s => 
        s.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.shortName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : marketStocks;

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
    <div className="flex-1 pb-20 bg-background">
      {/* Header */}
      <header className="p-4 safe-area-inset-top">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-foreground">Kadig Trade</h1>
          <div className="flex items-center gap-2">
            <button className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted/50">
              <HelpCircle className="w-5 h-5" />
            </button>
            <button 
              onClick={onToggleValues}
              className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted/50"
            >
              {showValues ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

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
                  <div className="relative mb-6">
                    <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-lg">
                      <Plus className="w-8 h-8 text-white" />
                    </div>
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
                      className="w-full flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-4"
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Link2 className="w-5 h-5 text-primary" />
                      </div>
                      <span className="font-medium text-foreground">Adicionar conexão</span>
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
                        <p className={`text-xs ${asset.gain_percent >= 0 ? "text-emerald-500" : "text-red-500"}`}>
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
            className="p-4"
          >
            <div className="flex flex-col items-center justify-center py-12">
              <TrendingUp className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Patrimônio</h3>
              <p className="text-sm text-muted-foreground text-center">
                Visualize a evolução do seu patrimônio ao longo do tempo
              </p>
            </div>
          </motion.div>
        )}

        {/* Mercado Tab - NOVO DESIGN */}
        {activeTab === "mercado" && (
          <motion.div 
            key="mercado"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pb-4"
          >
            {loadingMarket && marketStocks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
                <p className="text-sm text-muted-foreground">Carregando cotações...</p>
              </div>
            ) : (
              <>
                {/* Notícias em destaque */}
                <section className="px-4 pt-4 pb-2">
                  <h2 className="text-lg font-semibold text-foreground mb-3">Notícias em destaque</h2>
                  
                  {loadingNews ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : marketNews.length > 0 ? (
                    <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                      {marketNews.map((news, index) => (
                        <a
                          key={index}
                          href={news.news_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0 w-64 bg-card border border-border rounded-xl overflow-hidden"
                        >
                          {news.image_url && (
                            <div className="h-28 bg-muted">
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
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-card border border-border rounded-xl p-6 text-center">
                      <p className="text-sm text-muted-foreground">Nenhuma notícia disponível no momento</p>
                    </div>
                  )}
                </section>

                {/* Índices do mercado */}
                <section className="px-4 py-3">
                  <h2 className="text-lg font-semibold text-foreground mb-3">Índices do mercado</h2>
                  <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                    {marketIndices.map((index) => (
                      <div 
                        key={index.name}
                        className="flex-shrink-0 w-32 bg-card border border-border rounded-xl p-3"
                      >
                        <p className="font-semibold text-foreground text-sm mb-1">{index.name}</p>
                        <div className="h-5 mb-1">
                          <MiniChart positive={index.changePercent >= 0} />
                        </div>
                        <p className="text-xs text-foreground mb-1">{formatNumber(index.value)}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          index.changePercent >= 0 
                            ? "bg-emerald-500/20 text-emerald-500" 
                            : "bg-red-500/20 text-red-500"
                        }`}>
                          {index.changePercent >= 0 ? "+" : ""}{index.changePercent.toFixed(2)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Commodities */}
                <section className="px-4 py-3">
                  <h2 className="text-lg font-semibold text-foreground mb-3">Commodities</h2>
                  <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                    {commodities.map((commodity) => (
                      <div 
                        key={commodity.symbol}
                        className="flex-shrink-0 w-28 bg-card border border-border rounded-xl p-3 text-center"
                      >
                        <span className="text-2xl mb-1 block">{commodity.icon}</span>
                        <p className="font-semibold text-foreground text-sm">{commodity.name}</p>
                        <p className="text-xs text-foreground">${formatNumber(commodity.value)}</p>
                        <span className={`text-xs ${
                          commodity.changePercent >= 0 ? "text-emerald-500" : "text-red-500"
                        }`}>
                          {commodity.changePercent >= 0 ? "+" : ""}{commodity.changePercent.toFixed(2)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Busca e Filtros */}
                <section className="px-4 py-3">
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
                <section className="px-4 py-2">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold text-foreground">
                      {assetFilter === "acoes" ? "Maiores altas" : assetFilter.toUpperCase()}
                    </h2>
                    <span className="text-xs text-muted-foreground">Atualizado: {lastUpdate}</span>
                  </div>

                  <div className="space-y-2">
                    {(assetFilter === "acoes" ? maioresAltas.slice(0, 8) : []).map((stock) => (
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
                              ? "bg-emerald-500/20 text-emerald-500" 
                              : "bg-red-500/20 text-red-500"
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
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-500">
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
                </section>
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
              <div className="space-y-2">
                {marketStocks.filter(s => favorites.includes(s.symbol)).map((stock) => (
                  <div 
                    key={stock.symbol}
                    onClick={() => {
                      setSelectedStock(stock);
                      setStockDetailOpen(true);
                    }}
                    className="bg-card border border-border rounded-xl p-3 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform"
                  >
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <span className="text-xs font-bold text-foreground">
                        {stock.symbol.slice(0, 2)}
                      </span>
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
                          ? "bg-emerald-500/20 text-emerald-500" 
                          : "bg-red-500/20 text-red-500"
                      }`}>
                        {stock.regularMarketChangePercent >= 0 ? "+" : ""}
                        {stock.regularMarketChangePercent.toFixed(2)}%
                      </span>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(stock.symbol); }}
                      className="p-1"
                    >
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    </button>
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
