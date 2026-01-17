import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search,
  Star,
  Loader2,
  ChevronRight,
  ChevronLeft,
  TrendingUp,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  Calculator,
  BarChart3,
  Briefcase,
  FileText,
  Award,
  Calendar,
  ExternalLink,
  Sun,
  Moon,
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
}

interface NewsItem {
  title: string;
  text?: string;
  source_name: string;
  date: string;
  news_url: string;
  image_url: string | null;
  category?: string;
}

interface DividendItem {
  ticker: string;
  companyName: string;
  dataCom: string;
  value: number;
  paymentDay: number;
  paymentMonth: string;
}

interface MercadoTabProps {
  showValues: boolean;
}

const MercadoTab = ({ showValues }: MercadoTabProps) => {
  const [selectedStock, setSelectedStock] = useState<StockQuote | null>(null);
  const [stockDetailOpen, setStockDetailOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [lastUpdate, setLastUpdate] = useState<string>("-");
  const [maioresAltas, setMaioresAltas] = useState<StockQuote[]>([]);
  const [maioresBaixas, setMaioresBaixas] = useState<StockQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [marketIndices, setMarketIndices] = useState<MarketIndex[]>([
    { name: "IBOV", value: 164799.99, changePercent: -0.46 },
    { name: "IFIX", value: 3809.30, changePercent: 0.13 },
    { name: "IDIV", value: 11587.36, changePercent: -0.45 },
  ]);
  const [marketNews, setMarketNews] = useState<NewsItem[]>([]);
  const [loadingNews, setLoadingNews] = useState(false);
  const [newsPage, setNewsPage] = useState(1);
  const [totalNewsPages, setTotalNewsPages] = useState(89);
  const newsPerPage = 5;
  // Mock dividends data
  const [dividends] = useState<DividendItem[]>([
    { ticker: "CPLE3", companyName: "CIA PARANAENSE DE ENERGIA - COPEL", dataCom: "30/12/2025", value: 0.37, paymentDay: 19, paymentMonth: "JAN" },
    { ticker: "CXAG11", companyName: "FI IMOBILIA", dataCom: "30/12/2025", value: 0.86, paymentDay: 19, paymentMonth: "JAN" },
    { ticker: "IBCR11", companyName: "FII DE CRI INTEGRAL BREI RESP LIM", dataCom: "12/01/2026", value: 0.70, paymentDay: 19, paymentMonth: "JAN" },
    { ticker: "IRIF11", companyName: "IRIDIUM INFRA FUN DE INV EM COTAS DE FUN INCENT", dataCom: "08/01/2026", value: 0.12, paymentDay: 19, paymentMonth: "JAN" },
    { ticker: "IRIM11", companyName: "IRIDIUM FI -UNICA", dataCom: "12/01/2026", value: 0.89, paymentDay: 19, paymentMonth: "JAN" },
  ]);

  // Mock best performance stocks
  const [bestPerformance] = useState([
    { ticker: "CURY3", name: "CURY CONSTRUTORA E...", financeiro: 85, dividendos: 70, recomendacao: 45, indice: 60 },
    { ticker: "LPSB3", name: "LPS BRASIL - CONSULTORIA DE IMOVEI...", financeiro: 80, dividendos: 75, recomendacao: 40, indice: 55 },
    { ticker: "RSUL4", name: "METALURGICA RIOSULENSE S.A.", financeiro: 75, dividendos: 65, recomendacao: 35, indice: 50 },
    { ticker: "CAMB3", name: "CAMBUCI S.A.", financeiro: 70, dividendos: 60, recomendacao: 30, indice: 45 },
  ]);

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
      if (data?.totalPages) {
        setTotalNewsPages(data.totalPages);
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
        setMaioresAltas(data.maioresAltas || []);
        setMaioresBaixas(data.maioresBaixas || []);
        if (data.indices && data.indices.length > 0) {
          setMarketIndices([
            ...data.indices.slice(0, 2),
            { name: "IDIV", value: 11587.36, changePercent: -0.45 }
          ]);
        }
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
    if (!showValues) return "••••";
    return price.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Gauge component for performance indicators
  const GaugeChart = ({ value, colors }: { value: number; colors: string }) => {
    const rotation = (value / 100) * 180 - 90;
    return (
      <div className="relative w-14 h-8 overflow-hidden">
        <div className={`absolute bottom-0 left-0 right-0 h-14 rounded-t-full ${colors}`} />
        <div 
          className="absolute bottom-0 left-1/2 w-0.5 h-6 bg-gray-800 origin-bottom"
          style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
        />
      </div>
    );
  };

  const tools = [
    { label: "Simulador de investimentos", gradient: "from-violet-500 to-purple-600", icon: Calculator },
    { label: "Comparador de ativos", gradient: "from-fuchsia-500 to-pink-500", icon: BarChart3 },
    { label: "Carteiras recomendadas", gradient: "from-violet-400 to-purple-500", icon: Briefcase },
    { label: "Relatórios e análises", gradient: "from-teal-500 to-cyan-600", icon: FileText },
    { label: "Índice Kadig", gradient: "from-cyan-500 to-teal-500", icon: Award },
  ];

  return (
    <div className="flex-1 pb-20 bg-[#1a1f2e] overflow-y-auto">
      {/* Header */}
      <header className="flex items-center justify-between p-4 safe-area-inset-top">
        <div className="flex items-center gap-2 text-white">
          <span className="font-medium">Mercado</span>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <span className="text-gray-400">Home</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 text-gray-400">
            <Sun className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-400">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-400">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </header>

      {loading && maioresAltas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
          <p className="text-sm text-gray-400">Carregando dados do mercado...</p>
        </div>
      ) : (
        <>
          {/* Índices do mercado */}
          <section className="px-4 pb-4">
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
              {marketIndices.map((index) => (
                <div 
                  key={index.name}
                  className="flex-shrink-0 bg-[#252b3d] rounded-xl px-4 py-3 flex items-center gap-3"
                >
                  <div>
                    <p className="text-white text-sm font-medium">{index.name}</p>
                    <p className="text-gray-400 text-xs">{formatNumber(index.value)}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-md font-medium ${
                    index.changePercent >= 0 
                      ? "bg-emerald-500 text-white" 
                      : "bg-red-500 text-white"
                  }`}>
                    {index.changePercent >= 0 ? "" : ""}{index.changePercent.toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Barra de busca */}
          <section className="px-4 pb-4">
            <div className="relative">
              <Input
                placeholder="Buscar ativos, índices, fundos de investime..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-12 bg-[#252b3d] border-0 text-white placeholder:text-gray-500 pr-10"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            </div>
          </section>

          {/* Ferramentas */}
          <section className="px-4 pb-6 space-y-3">
            {tools.map((tool, index) => (
              <button
                key={index}
                className={`w-full flex items-center justify-between bg-gradient-to-r ${tool.gradient} rounded-xl px-5 py-4`}
              >
                <span className="text-white font-medium">{tool.label}</span>
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            ))}
          </section>

          {/* Principais notícias do mercado */}
          <section className="px-4 pb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-6 bg-primary rounded-full" />
              <h2 className="text-lg font-semibold text-white">Principais notícias do mercado</h2>
            </div>
            
            <button className="bg-[#252b3d] text-gray-300 text-sm px-4 py-2 rounded-lg mb-4">
              TODAS AS NOTÍCIAS
            </button>
            
            {loadingNews ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : marketNews.length > 0 ? (
              <>
                {/* Hero news */}
                {marketNews[0] && (
                  <a
                    href={marketNews[0].news_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block mb-4"
                  >
                    <div className="relative rounded-2xl overflow-hidden h-64 bg-[#252b3d]">
                      {marketNews[0].image_url && (
                        <img 
                          src={marketNews[0].image_url} 
                          alt="" 
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                      <div className="absolute inset-0 p-4 flex flex-col justify-end">
                        <span className="inline-block bg-gray-600/80 text-white text-xs px-3 py-1 rounded-full mb-2 w-fit">
                          ECONOMIA
                        </span>
                        <h3 className="text-white font-bold text-lg mb-2 line-clamp-3">
                          {marketNews[0].title}
                        </h3>
                        {marketNews[0].text && (
                          <p className="text-gray-300 text-sm line-clamp-2">
                            {marketNews[0].text}
                          </p>
                        )}
                      </div>
                    </div>
                  </a>
                )}
                
                {/* Secondary news cards */}
                <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                  {marketNews.slice(1, 4).map((news, index) => (
                    <a
                      key={index}
                      href={news.news_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 w-64 bg-white rounded-xl overflow-hidden"
                    >
                      {news.image_url && (
                        <div className="h-32 bg-gray-200">
                          <img 
                            src={news.image_url} 
                            alt="" 
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        </div>
                      )}
                      <div className="p-3">
                        <h3 className="text-gray-900 font-medium text-sm line-clamp-3 mb-2">
                          {news.title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{new Date(news.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                          <span>•</span>
                          <span>{new Date(news.date).toLocaleDateString('pt-BR')}</span>
                          <span>•</span>
                          <span>{news.source_name}</span>
                          <ChevronRight className="w-4 h-4 ml-auto" />
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </>
            ) : (
              <div className="bg-[#252b3d] rounded-xl p-6 text-center">
                <p className="text-sm text-gray-400">Nenhuma notícia disponível</p>
              </div>
            )}
          </section>

          {/* Timeline de notícias */}
          <section className="px-4 pb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-6 bg-primary rounded-full" />
              <h2 className="text-lg font-semibold text-white">Timeline de notícias</h2>
            </div>
            
            {/* Pagination */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <button 
                onClick={() => setNewsPage(Math.max(1, newsPage - 1))}
                disabled={newsPage === 1}
                className="w-10 h-10 rounded-lg bg-[#252b3d] flex items-center justify-center text-gray-400 disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              {/* First pages */}
              {[1, 2, 3].map((page) => (
                <button 
                  key={page}
                  onClick={() => setNewsPage(page)}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium ${
                    newsPage === page ? 'bg-primary text-white' : 'bg-[#252b3d] text-gray-400'
                  }`}
                >
                  {page}
                </button>
              ))}
              
              {/* Current page indicator if not in first 3 or last 3 */}
              {newsPage > 3 && newsPage < totalNewsPages - 2 && (
                <>
                  <span className="w-10 h-10 rounded-lg bg-[#252b3d] flex items-center justify-center text-gray-400">...</span>
                  <button 
                    className="w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center text-sm font-medium"
                  >
                    {newsPage}
                  </button>
                </>
              )}
              
              {newsPage <= 3 && (
                <span className="w-10 h-10 rounded-lg bg-[#252b3d] flex items-center justify-center text-gray-400">...</span>
              )}
              
              {newsPage > 3 && newsPage < totalNewsPages - 2 && (
                <span className="w-10 h-10 rounded-lg bg-[#252b3d] flex items-center justify-center text-gray-400">...</span>
              )}
              
              {/* Last pages */}
              {[totalNewsPages - 1, totalNewsPages].map((page) => (
                <button 
                  key={page}
                  onClick={() => setNewsPage(page)}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium ${
                    newsPage === page ? 'bg-primary text-white' : 'bg-[#252b3d] text-gray-400'
                  }`}
                >
                  {page}
                </button>
              ))}
              
              <button 
                onClick={() => setNewsPage(Math.min(totalNewsPages, newsPage + 1))}
                disabled={newsPage === totalNewsPages}
                className="w-10 h-10 rounded-lg bg-[#252b3d] flex items-center justify-center text-gray-400 disabled:opacity-50"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            
            {/* Timeline items - show 5 news per page */}
            <div className="space-y-4">
              {marketNews.slice((newsPage - 1) * newsPerPage, newsPage * newsPerPage).map((news, index) => (
                <a
                  key={index}
                  href={news.news_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-gray-500" />
                      {index < newsPerPage - 1 && <div className="w-0.5 flex-1 bg-gray-600 mt-1" />}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-gray-400 text-xs mb-2">
                        {new Date(news.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} • {new Date(news.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })} • {news.source_name}
                      </p>
                      {news.image_url && (
                        <div className="w-48 h-32 rounded-lg overflow-hidden mb-2 bg-gray-700">
                          <img 
                            src={news.image_url} 
                            alt="" 
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        </div>
                      )}
                      <h4 className="text-white font-medium text-sm line-clamp-2 mb-1">
                        {news.title}
                      </h4>
                      {news.text && (
                        <p className="text-gray-400 text-xs line-clamp-2">
                          {news.text}
                        </p>
                      )}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </section>

          {/* Cotações do dia */}
          <section className="px-4 pb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-6 bg-primary rounded-full" />
              <h2 className="text-lg font-semibold text-white">Cotações do dia</h2>
            </div>
            
            {/* Premium banner */}
            <div className="bg-[#252b3d] rounded-xl p-4 mb-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <p className="text-gray-300 text-sm">
                Tá de olho nas cotações? <span className="text-primary font-medium">Acompanhe em tempo real.</span>
              </p>
            </div>

            {/* IBOV indicator */}
            <div className="bg-[#252b3d] rounded-xl px-4 py-3 mb-4 flex items-center gap-3">
              <span className="text-white font-medium">IBOV:</span>
              <span className="text-gray-300">{formatNumber(marketIndices[0]?.value || 0)}</span>
              <div className="flex items-center gap-1 text-red-500">
                <ArrowDown className="w-4 h-4" />
                <span className="text-sm">{marketIndices[0]?.changePercent.toFixed(2)}%</span>
              </div>
              <ChevronDown className="w-5 h-5 text-gray-400 ml-auto" />
            </div>

            {/* Maiores Altas */}
            <div className="bg-[#252b3d] rounded-2xl p-4 mb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ArrowUp className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-white font-semibold">Maiores Altas</h3>
                </div>
                <button className="flex items-center gap-1 bg-[#3a4259] text-gray-300 text-sm px-3 py-1.5 rounded-lg">
                  Ver todos
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-3">
                {maioresAltas.slice(0, 5).map((stock) => (
                  <div 
                    key={stock.symbol}
                    onClick={() => {
                      setSelectedStock(stock);
                      setStockDetailOpen(true);
                    }}
                    className="flex items-center gap-3 cursor-pointer hover:bg-[#3a4259] p-2 -mx-2 rounded-lg transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center overflow-hidden">
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
                        <span className="text-xs font-bold text-gray-800">
                          {stock.symbol.slice(0, 3)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white">{stock.symbol}</p>
                      <p className="text-xs text-gray-400 truncate">{stock.shortName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">VALOR (R$)</p>
                      <p className="text-white font-medium">{formatPrice(stock.regularMarketPrice)}</p>
                    </div>
                    <div className="text-right w-20">
                      <p className="text-xs text-gray-400">VARIAÇÃO</p>
                      <p className="text-emerald-500 font-medium">
                        {stock.regularMarketChangePercent.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Maiores Baixas */}
            <div className="bg-[#252b3d] rounded-2xl p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ArrowDown className="w-5 h-5 text-red-500" />
                  <h3 className="text-white font-semibold">Maiores Baixas</h3>
                </div>
                <button className="flex items-center gap-1 bg-[#3a4259] text-gray-300 text-sm px-3 py-1.5 rounded-lg">
                  Ver todos
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-3">
                {maioresBaixas.slice(0, 5).map((stock) => (
                  <div 
                    key={stock.symbol}
                    onClick={() => {
                      setSelectedStock(stock);
                      setStockDetailOpen(true);
                    }}
                    className="flex items-center gap-3 cursor-pointer hover:bg-[#3a4259] p-2 -mx-2 rounded-lg transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center overflow-hidden">
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
                        <span className="text-xs font-bold text-gray-800">
                          {stock.symbol.slice(0, 3)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white">{stock.symbol}</p>
                      <p className="text-xs text-gray-400 truncate">{stock.shortName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">VALOR (R$)</p>
                      <p className="text-white font-medium">{formatPrice(stock.regularMarketPrice)}</p>
                    </div>
                    <div className="text-right w-20">
                      <p className="text-xs text-gray-400">VARIAÇÃO</p>
                      <p className="text-red-500 font-medium">
                        {stock.regularMarketChangePercent.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Índice Kadig */}
          <section className="px-4 pb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-6 bg-primary rounded-full" />
              <h2 className="text-lg font-semibold text-white">Índice Kadig</h2>
            </div>
            
            <button className="bg-[#252b3d] text-gray-300 text-sm px-4 py-2 rounded-lg mb-4">
              LISTA COMPLETA DO ÍNDICE
            </button>

            <div className="bg-[#252b3d] rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-700">
                <ArrowUp className="w-5 h-5 text-emerald-500" />
                <h3 className="text-white font-semibold">Melhor desempenho</h3>
              </div>
              
              <div className="space-y-6">
                {bestPerformance.map((stock, index) => (
                  <div key={index}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="bg-[#3a4259] text-white text-xs px-2 py-1 rounded-md font-medium">
                        {stock.ticker}
                      </span>
                      <span className="text-white text-sm truncate">{stock.name}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <div className="text-center">
                        <GaugeChart value={stock.financeiro} colors="bg-gradient-to-r from-orange-400 via-yellow-400 to-green-400" />
                        <p className="text-gray-400 text-xs mt-1">Financeiro</p>
                      </div>
                      <div className="text-center">
                        <GaugeChart value={stock.dividendos} colors="bg-gradient-to-r from-yellow-400 via-lime-400 to-green-500" />
                        <p className="text-gray-400 text-xs mt-1">Dividendos</p>
                      </div>
                      <div className="text-center">
                        <GaugeChart value={stock.recomendacao} colors="bg-gray-400" />
                        <p className="text-gray-400 text-xs mt-1">Recomendação</p>
                      </div>
                      <div className="text-center">
                        <GaugeChart value={stock.indice} colors="bg-gradient-to-r from-violet-400 to-purple-500" />
                        <p className="text-gray-400 text-xs mt-1">Índice Kadig</p>
                      </div>
                    </div>
                    
                    {index < bestPerformance.length - 1 && (
                      <div className="border-b border-gray-700 mt-4" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Agenda do mercado - Dividendos */}
          <section className="px-4 pb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-6 bg-primary rounded-full" />
              <h2 className="text-lg font-semibold text-white">Agenda do mercado</h2>
            </div>
            
            {/* Premium banner */}
            <div className="bg-[#252b3d] rounded-xl p-4 mb-4 flex items-center gap-3">
              <Calendar className="w-5 h-5 text-primary" />
              <p className="text-gray-300 text-sm">
                Tá esperando um provento? <span className="text-primary font-medium">Assine Premium!</span>
              </p>
            </div>

            <div className="bg-[#252b3d] rounded-2xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">Dividendos</h3>
                <button className="flex items-center gap-1 bg-[#3a4259] text-gray-300 text-sm px-3 py-1.5 rounded-lg">
                  Ver todos
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-4">
                {dividends.map((dividend, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-14 h-14 rounded-full bg-violet-500/20 border-2 border-violet-500 flex flex-col items-center justify-center text-center flex-shrink-0">
                      <span className="text-white font-bold text-lg leading-none">{dividend.paymentDay}</span>
                      <span className="text-violet-400 text-xs">{dividend.paymentMonth}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-violet-500 text-white text-xs px-2 py-0.5 rounded-md font-medium">
                          {dividend.ticker}
                        </span>
                        <span className="text-gray-400 text-xs">DATA-COM:</span>
                        <span className="text-white text-xs">{dividend.dataCom}</span>
                        <span className="text-gray-400 text-xs ml-2">VALOR</span>
                        <span className="text-white text-xs">R$ {dividend.value.toFixed(2)}</span>
                      </div>
                      <p className="text-gray-400 text-xs truncate">{dividend.companyName}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
