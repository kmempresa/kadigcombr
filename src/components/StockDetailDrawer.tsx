import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Bell, 
  Star, 
  FileText,
  Loader2,
  Globe,
  Building2,
  Users,
  MapPin,
  ExternalLink
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  Tooltip,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";

interface StockDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  stock: {
    symbol: string;
    shortName: string;
    regularMarketPrice: number;
    regularMarketChangePercent: number;
  } | null;
  showValues: boolean;
  onToggleFavorite?: (symbol: string) => void;
  isFavorite?: boolean;
}

interface StockDetails {
  // Básico
  symbol: string;
  shortName: string;
  longName: string;
  currency: string;
  logoUrl: string | null;
  
  // Preços
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketOpen: number | null;
  regularMarketDayHigh: number | null;
  regularMarketDayLow: number | null;
  regularMarketPreviousClose: number | null;
  regularMarketVolume: number | null;
  
  // 52 semanas
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  
  // Volume
  averageDailyVolume10Day: number | null;
  averageDailyVolume3Month: number | null;
  
  // Fundamentalistas
  marketCap: number | null;
  priceEarnings: number | null;
  earningsPerShare: number | null;
  priceToBook: number | null;
  
  // Dividendos
  dividendYield: number | null;
  payoutRatio: number | null;
  lastDividendValue: number | null;
  
  // Valor
  enterpriseValue: number | null;
  forwardPE: number | null;
  pegRatio: number | null;
  enterpriseToRevenue: number | null;
  enterpriseToEbitda: number | null;
  
  // Rentabilidade
  profitMargins: number | null;
  returnOnAssets: number | null;
  returnOnEquity: number | null;
  
  // Financeiros
  totalCash: number | null;
  totalDebt: number | null;
  debtToEquity: number | null;
  currentRatio: number | null;
  
  // Receita
  totalRevenue: number | null;
  revenueGrowth: number | null;
  grossMargins: number | null;
  ebitdaMargins: number | null;
  operatingMargins: number | null;
  ebitda: number | null;
  freeCashflow: number | null;
  
  // Empresa
  sector: string | null;
  industry: string | null;
  website: string | null;
  longBusinessSummary: string | null;
  fullTimeEmployees: number | null;
  city: string | null;
  state: string | null;
  
  // Balanço
  totalAssets: number | null;
  totalLiabilities: number | null;
  totalStockholderEquity: number | null;
  
  // DRE
  grossProfit: number | null;
  netIncome: number | null;
  
  // Volatilidade
  beta: number | null;
  
  // Ações
  sharesOutstanding: number | null;
  
  // Dados históricos
  historicalData: { date: number; close: number; volume: number }[];
  
  // Dividendos
  dividendsHistory: { paymentDate: string; rate: number; type: string }[];
}

interface NewsItem {
  title: string;
  text: string;
  source_name: string;
  date: string;
  news_url: string;
  image_url: string | null;
  sentiment: string;
}

const StockDetailDrawer = ({
  isOpen,
  onClose,
  stock,
  showValues,
  onToggleFavorite,
  isFavorite = false
}: StockDetailDrawerProps) => {
  const [loading, setLoading] = useState(false);
  const [stockDetails, setStockDetails] = useState<StockDetails | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [activeInfoTab, setActiveInfoTab] = useState<"indicadores" | "empresa" | "financeiro">("indicadores");
  
  useEffect(() => {
    if (isOpen && stock) {
      fetchStockDetails(stock.symbol);
      fetchNews(stock.symbol);
    }
  }, [isOpen, stock]);

  const fetchStockDetails = async (symbol: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('market-data', {
        body: { type: 'detail', symbol }
      });
      
      if (error) throw error;
      
      if (data) {
        setStockDetails(data);
      }
    } catch (error) {
      console.error("Error fetching stock details:", error);
    }
    setLoading(false);
  };

  const fetchNews = async (symbol: string) => {
    setNewsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('market-data', {
        body: { type: 'news', symbol }
      });
      
      if (error) throw error;
      
      if (data?.news) {
        setNews(data.news);
      }
    } catch (error) {
      console.error("Error fetching news:", error);
    }
    setNewsLoading(false);
  };

  if (!stock) return null;

  const isPositive = (stockDetails?.regularMarketChangePercent ?? stock.regularMarketChangePercent) >= 0;
  const currentPrice = stockDetails?.regularMarketPrice ?? stock.regularMarketPrice;
  const changePercent = stockDetails?.regularMarketChangePercent ?? stock.regularMarketChangePercent;

  const formatPrice = (price: number | null) => {
    if (price === null) return "-";
    if (!showValues) return "R$ ••••••";
    return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const formatLargeNumber = (num: number | null) => {
    if (num === null || num === undefined) return "-";
    if (num >= 1e12) return `R$ ${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `R$ ${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `R$ ${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `R$ ${(num / 1e3).toFixed(2)}K`;
    return `R$ ${num.toFixed(2)}`;
  };

  const formatPercent = (value: number | null) => {
    if (value === null || value === undefined) return "-";
    // API returns as decimal (0.15 = 15%)
    const percent = value > 1 ? value : value * 100;
    return `${percent.toFixed(2)}%`;
  };

  const formatNumber = (value: number | null, decimals = 2) => {
    if (value === null || value === undefined) return "-";
    return value.toFixed(decimals);
  };

  const formatVolume = (volume: number | null) => {
    if (volume === null) return "-";
    if (volume >= 1e9) return `${(volume / 1e9).toFixed(2)}B`;
    if (volume >= 1e6) return `${(volume / 1e6).toFixed(2)}M`;
    if (volume >= 1e3) return `${(volume / 1e3).toFixed(0)}K`;
    return volume.toString();
  };

  // Prepare chart data from historical data
  const chartData = stockDetails?.historicalData?.map((item, index) => ({
    day: index,
    value: item.close,
    volume: item.volume,
  })) || [];

  // Prepare dividend chart data
  const dividendChartData = stockDetails?.dividendsHistory?.slice(0, 6).reverse().map((div) => ({
    date: new Date(div.paymentDate).toLocaleDateString("pt-BR", { month: "short" }),
    value: div.rate,
    type: div.type,
  })) || [];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 bg-background rounded-t-3xl max-h-[90vh] overflow-hidden flex flex-col"
          >
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Carregando dados em tempo real...</p>
              </div>
            ) : (
              <>
                {/* Header with gradient */}
                <div className="bg-gradient-to-b from-muted to-background pt-8 pb-6 px-4">
                  {/* Company Logo */}
                  <div className="flex justify-center mb-4">
                    <div className="w-20 h-20 bg-card rounded-2xl shadow-lg flex items-center justify-center overflow-hidden">
                      {stockDetails?.logoUrl ? (
                        <img 
                          src={stockDetails.logoUrl} 
                          alt={stock.symbol}
                          className="w-16 h-16 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="text-xl font-bold text-foreground">
                          {stock.symbol.slice(0, 3)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stock Info */}
                  <div className="text-center mb-4">
                    <h2 className="text-xl font-bold text-foreground">{stock.symbol}</h2>
                    <p className="text-sm text-muted-foreground uppercase px-4 line-clamp-2">
                      {stockDetails?.longName || stock.shortName}
                    </p>
                    {stockDetails?.sector && (
                      <p className="text-xs text-primary mt-1">
                        {stockDetails.sector} • {stockDetails.industry}
                      </p>
                    )}
                  </div>

                  {/* Price Chart */}
                  {chartData.length > 0 && (
                    <div className="h-20 mb-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={isPositive ? "#22c55e" : "#ef4444"} stopOpacity={0.3}/>
                              <stop offset="95%" stopColor={isPositive ? "#22c55e" : "#ef4444"} stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <Area 
                            type="monotone" 
                            dataKey="value" 
                            stroke={isPositive ? "#22c55e" : "#ef4444"} 
                            strokeWidth={2}
                            fill="url(#colorValue)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Price and Variation */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-4 py-2 bg-foreground text-background rounded-full font-semibold">
                        {formatPrice(currentPrice)}
                      </span>
                      <span className={`px-4 py-2 rounded-full font-semibold text-white ${
                        isPositive ? "bg-emerald-500" : "bg-red-500"
                      }`}>
                        {isPositive ? "+" : ""}{changePercent.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="w-10 h-10 rounded-full border border-border flex items-center justify-center">
                        <Bell className="w-5 h-5 text-muted-foreground" />
                      </button>
                      <button 
                        onClick={() => onToggleFavorite?.(stock.symbol)}
                        className="w-10 h-10 rounded-full border border-border flex items-center justify-center"
                      >
                        <Star className={`w-5 h-5 ${isFavorite ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-4 pb-20">
                  
                  {/* Preços do Dia */}
                  <section className="py-4">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Cotação do Dia</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-card border border-border rounded-xl p-3">
                        <p className="text-xs text-muted-foreground">Abertura</p>
                        <p className="font-semibold text-foreground">{formatPrice(stockDetails?.regularMarketOpen ?? null)}</p>
                      </div>
                      <div className="bg-card border border-border rounded-xl p-3">
                        <p className="text-xs text-muted-foreground">Fech. Anterior</p>
                        <p className="font-semibold text-foreground">{formatPrice(stockDetails?.regularMarketPreviousClose ?? null)}</p>
                      </div>
                      <div className="bg-card border border-border rounded-xl p-3">
                        <p className="text-xs text-muted-foreground">Máxima</p>
                        <p className="font-semibold text-emerald-500">{formatPrice(stockDetails?.regularMarketDayHigh ?? null)}</p>
                      </div>
                      <div className="bg-card border border-border rounded-xl p-3">
                        <p className="text-xs text-muted-foreground">Mínima</p>
                        <p className="font-semibold text-red-500">{formatPrice(stockDetails?.regularMarketDayLow ?? null)}</p>
                      </div>
                    </div>
                  </section>

                  {/* Volume */}
                  <section className="py-4 border-t border-border">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Volume</h3>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Hoje</p>
                        <p className="font-semibold text-foreground">{formatVolume(stockDetails?.regularMarketVolume ?? null)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Média 10d</p>
                        <p className="font-semibold text-foreground">{formatVolume(stockDetails?.averageDailyVolume10Day ?? null)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Média 3m</p>
                        <p className="font-semibold text-foreground">{formatVolume(stockDetails?.averageDailyVolume3Month ?? null)}</p>
                      </div>
                    </div>
                  </section>

                  {/* 52 Semanas */}
                  <section className="py-4 border-t border-border">
                    <h3 className="text-lg font-semibold text-foreground mb-4">52 Semanas</h3>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-muted-foreground w-16">{formatPrice(stockDetails?.fiftyTwoWeekLow ?? null)}</span>
                      <div className="flex-1 h-2 bg-muted rounded-full relative">
                        <div 
                          className="absolute h-3 w-3 bg-primary rounded-full top-1/2 -translate-y-1/2"
                          style={{
                            left: stockDetails?.fiftyTwoWeekLow && stockDetails?.fiftyTwoWeekHigh 
                              ? `${((currentPrice - stockDetails.fiftyTwoWeekLow) / (stockDetails.fiftyTwoWeekHigh - stockDetails.fiftyTwoWeekLow)) * 100}%`
                              : '50%'
                          }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-16 text-right">{formatPrice(stockDetails?.fiftyTwoWeekHigh ?? null)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Mínima</span>
                      <span>Máxima</span>
                    </div>
                  </section>

                  {/* Tabs de Informações */}
                  <section className="py-4 border-t border-border">
                    <div className="flex gap-2 mb-4 overflow-x-auto">
                      {[
                        { id: "indicadores", label: "Indicadores" },
                        { id: "empresa", label: "Empresa" },
                        { id: "financeiro", label: "Financeiro" },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveInfoTab(tab.id as any)}
                          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                            activeInfoTab === tab.id 
                              ? "bg-primary text-white" 
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {activeInfoTab === "indicadores" && (
                      <div className="space-y-4">
                        {/* Valuation */}
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Valuation</h4>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="text-center p-3 bg-card rounded-lg border border-border">
                              <p className="text-xs text-muted-foreground">P/L</p>
                              <p className="font-semibold text-foreground">{formatNumber(stockDetails?.priceEarnings ?? null)}</p>
                            </div>
                            <div className="text-center p-3 bg-card rounded-lg border border-border">
                              <p className="text-xs text-muted-foreground">P/VP</p>
                              <p className="font-semibold text-foreground">{formatNumber(stockDetails?.priceToBook ?? null)}</p>
                            </div>
                            <div className="text-center p-3 bg-card rounded-lg border border-border">
                              <p className="text-xs text-muted-foreground">P/L Futuro</p>
                              <p className="font-semibold text-foreground">{formatNumber(stockDetails?.forwardPE ?? null)}</p>
                            </div>
                            <div className="text-center p-3 bg-card rounded-lg border border-border">
                              <p className="text-xs text-muted-foreground">EV/Receita</p>
                              <p className="font-semibold text-foreground">{formatNumber(stockDetails?.enterpriseToRevenue ?? null)}</p>
                            </div>
                            <div className="text-center p-3 bg-card rounded-lg border border-border">
                              <p className="text-xs text-muted-foreground">EV/EBITDA</p>
                              <p className="font-semibold text-foreground">{formatNumber(stockDetails?.enterpriseToEbitda ?? null)}</p>
                            </div>
                            <div className="text-center p-3 bg-card rounded-lg border border-border">
                              <p className="text-xs text-muted-foreground">PEG Ratio</p>
                              <p className="font-semibold text-foreground">{formatNumber(stockDetails?.pegRatio ?? null)}</p>
                            </div>
                          </div>
                        </div>

                        {/* Dividendos */}
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Dividendos</h4>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="text-center p-3 bg-card rounded-lg border border-border">
                              <p className="text-xs text-muted-foreground">Div. Yield</p>
                              <p className="font-semibold text-emerald-500">{formatPercent(stockDetails?.dividendYield ?? null)}</p>
                            </div>
                            <div className="text-center p-3 bg-card rounded-lg border border-border">
                              <p className="text-xs text-muted-foreground">Payout</p>
                              <p className="font-semibold text-foreground">{formatPercent(stockDetails?.payoutRatio ?? null)}</p>
                            </div>
                            <div className="text-center p-3 bg-card rounded-lg border border-border">
                              <p className="text-xs text-muted-foreground">Último Div.</p>
                              <p className="font-semibold text-foreground">{formatPrice(stockDetails?.lastDividendValue ?? null)}</p>
                            </div>
                          </div>
                        </div>

                        {/* Rentabilidade */}
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Rentabilidade</h4>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="text-center p-3 bg-card rounded-lg border border-border">
                              <p className="text-xs text-muted-foreground">ROE</p>
                              <p className="font-semibold text-foreground">{formatPercent(stockDetails?.returnOnEquity ?? null)}</p>
                            </div>
                            <div className="text-center p-3 bg-card rounded-lg border border-border">
                              <p className="text-xs text-muted-foreground">ROA</p>
                              <p className="font-semibold text-foreground">{formatPercent(stockDetails?.returnOnAssets ?? null)}</p>
                            </div>
                            <div className="text-center p-3 bg-card rounded-lg border border-border">
                              <p className="text-xs text-muted-foreground">Margem Liq.</p>
                              <p className="font-semibold text-foreground">{formatPercent(stockDetails?.profitMargins ?? null)}</p>
                            </div>
                          </div>
                        </div>

                        {/* Volatilidade */}
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Risco</h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="text-center p-3 bg-card rounded-lg border border-border">
                              <p className="text-xs text-muted-foreground">Beta</p>
                              <p className="font-semibold text-foreground">{formatNumber(stockDetails?.beta ?? null)}</p>
                            </div>
                            <div className="text-center p-3 bg-card rounded-lg border border-border">
                              <p className="text-xs text-muted-foreground">LPA</p>
                              <p className="font-semibold text-foreground">{formatPrice(stockDetails?.earningsPerShare ?? null)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeInfoTab === "empresa" && (
                      <div className="space-y-4">
                        {/* Sobre */}
                        {stockDetails?.longBusinessSummary && (
                          <div className="bg-card border border-border rounded-xl p-4">
                            <h4 className="font-medium text-foreground mb-2">Sobre</h4>
                            <p className="text-sm text-muted-foreground line-clamp-4">
                              {stockDetails.longBusinessSummary}
                            </p>
                          </div>
                        )}

                        {/* Info cards */}
                        <div className="space-y-2">
                          {stockDetails?.sector && (
                            <div className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl">
                              <Building2 className="w-5 h-5 text-primary" />
                              <div>
                                <p className="text-xs text-muted-foreground">Setor / Indústria</p>
                                <p className="font-medium text-foreground">{stockDetails.sector} • {stockDetails.industry}</p>
                              </div>
                            </div>
                          )}
                          
                          {stockDetails?.fullTimeEmployees && (
                            <div className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl">
                              <Users className="w-5 h-5 text-primary" />
                              <div>
                                <p className="text-xs text-muted-foreground">Funcionários</p>
                                <p className="font-medium text-foreground">{stockDetails.fullTimeEmployees.toLocaleString("pt-BR")}</p>
                              </div>
                            </div>
                          )}

                          {stockDetails?.city && (
                            <div className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl">
                              <MapPin className="w-5 h-5 text-primary" />
                              <div>
                                <p className="text-xs text-muted-foreground">Localização</p>
                                <p className="font-medium text-foreground">{stockDetails.city}, {stockDetails.state}</p>
                              </div>
                            </div>
                          )}

                          {stockDetails?.website && (
                            <a 
                              href={stockDetails.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl"
                            >
                              <Globe className="w-5 h-5 text-primary" />
                              <div className="flex-1">
                                <p className="text-xs text-muted-foreground">Website</p>
                                <p className="font-medium text-primary">{stockDetails.website}</p>
                              </div>
                              <ExternalLink className="w-4 h-4 text-muted-foreground" />
                            </a>
                          )}
                        </div>

                        {/* Ações */}
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Ações em Circulação</h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="text-center p-3 bg-card rounded-lg border border-border">
                              <p className="text-xs text-muted-foreground">Total</p>
                              <p className="font-semibold text-foreground">{formatVolume(stockDetails?.sharesOutstanding ?? null)}</p>
                            </div>
                            <div className="text-center p-3 bg-card rounded-lg border border-border">
                              <p className="text-xs text-muted-foreground">Valor Mercado</p>
                              <p className="font-semibold text-foreground">{formatLargeNumber(stockDetails?.marketCap ?? null)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeInfoTab === "financeiro" && (
                      <div className="space-y-4">
                        {/* Valor da Empresa */}
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Valor</h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="text-center p-3 bg-card rounded-lg border border-border">
                              <p className="text-xs text-muted-foreground">Market Cap</p>
                              <p className="font-semibold text-foreground">{formatLargeNumber(stockDetails?.marketCap ?? null)}</p>
                            </div>
                            <div className="text-center p-3 bg-card rounded-lg border border-border">
                              <p className="text-xs text-muted-foreground">Enterprise Value</p>
                              <p className="font-semibold text-foreground">{formatLargeNumber(stockDetails?.enterpriseValue ?? null)}</p>
                            </div>
                          </div>
                        </div>

                        {/* Dívida */}
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Endividamento</h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="text-center p-3 bg-card rounded-lg border border-border">
                              <p className="text-xs text-muted-foreground">Dívida Total</p>
                              <p className="font-semibold text-foreground">{formatLargeNumber(stockDetails?.totalDebt ?? null)}</p>
                            </div>
                            <div className="text-center p-3 bg-card rounded-lg border border-border">
                              <p className="text-xs text-muted-foreground">Caixa Total</p>
                              <p className="font-semibold text-emerald-500">{formatLargeNumber(stockDetails?.totalCash ?? null)}</p>
                            </div>
                            <div className="text-center p-3 bg-card rounded-lg border border-border">
                              <p className="text-xs text-muted-foreground">Dív./Patrimônio</p>
                              <p className="font-semibold text-foreground">{formatNumber(stockDetails?.debtToEquity ?? null)}</p>
                            </div>
                            <div className="text-center p-3 bg-card rounded-lg border border-border">
                              <p className="text-xs text-muted-foreground">Liquidez Corr.</p>
                              <p className="font-semibold text-foreground">{formatNumber(stockDetails?.currentRatio ?? null)}</p>
                            </div>
                          </div>
                        </div>

                        {/* Receita e Lucro */}
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Resultados</h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="text-center p-3 bg-card rounded-lg border border-border">
                              <p className="text-xs text-muted-foreground">Receita Total</p>
                              <p className="font-semibold text-foreground">{formatLargeNumber(stockDetails?.totalRevenue ?? null)}</p>
                            </div>
                            <div className="text-center p-3 bg-card rounded-lg border border-border">
                              <p className="text-xs text-muted-foreground">Cresc. Receita</p>
                              <p className="font-semibold text-foreground">{formatPercent(stockDetails?.revenueGrowth ?? null)}</p>
                            </div>
                            <div className="text-center p-3 bg-card rounded-lg border border-border">
                              <p className="text-xs text-muted-foreground">EBITDA</p>
                              <p className="font-semibold text-foreground">{formatLargeNumber(stockDetails?.ebitda ?? null)}</p>
                            </div>
                            <div className="text-center p-3 bg-card rounded-lg border border-border">
                              <p className="text-xs text-muted-foreground">Lucro Líquido</p>
                              <p className="font-semibold text-foreground">{formatLargeNumber(stockDetails?.netIncome ?? null)}</p>
                            </div>
                          </div>
                        </div>

                        {/* Margens */}
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Margens</h4>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="text-center p-3 bg-card rounded-lg border border-border">
                              <p className="text-xs text-muted-foreground">Bruta</p>
                              <p className="font-semibold text-foreground">{formatPercent(stockDetails?.grossMargins ?? null)}</p>
                            </div>
                            <div className="text-center p-3 bg-card rounded-lg border border-border">
                              <p className="text-xs text-muted-foreground">EBITDA</p>
                              <p className="font-semibold text-foreground">{formatPercent(stockDetails?.ebitdaMargins ?? null)}</p>
                            </div>
                            <div className="text-center p-3 bg-card rounded-lg border border-border">
                              <p className="text-xs text-muted-foreground">Operacional</p>
                              <p className="font-semibold text-foreground">{formatPercent(stockDetails?.operatingMargins ?? null)}</p>
                            </div>
                          </div>
                        </div>

                        {/* Balanço */}
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Balanço Patrimonial</h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="text-center p-3 bg-card rounded-lg border border-border">
                              <p className="text-xs text-muted-foreground">Ativos Totais</p>
                              <p className="font-semibold text-foreground">{formatLargeNumber(stockDetails?.totalAssets ?? null)}</p>
                            </div>
                            <div className="text-center p-3 bg-card rounded-lg border border-border">
                              <p className="text-xs text-muted-foreground">Passivos Totais</p>
                              <p className="font-semibold text-foreground">{formatLargeNumber(stockDetails?.totalLiabilities ?? null)}</p>
                            </div>
                            <div className="text-center p-3 bg-card rounded-lg border border-border col-span-2">
                              <p className="text-xs text-muted-foreground">Patrimônio Líquido</p>
                              <p className="font-semibold text-foreground">{formatLargeNumber(stockDetails?.totalStockholderEquity ?? null)}</p>
                            </div>
                          </div>
                        </div>

                        {/* Free Cash Flow */}
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Fluxo de Caixa</h4>
                          <div className="text-center p-3 bg-card rounded-lg border border-border">
                            <p className="text-xs text-muted-foreground">Free Cash Flow</p>
                            <p className="font-semibold text-foreground">{formatLargeNumber(stockDetails?.freeCashflow ?? null)}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </section>

                  {/* Histórico de Dividendos */}
                  {dividendChartData.length > 0 && (
                    <section className="py-4 border-t border-border">
                      <h3 className="text-lg font-semibold text-foreground mb-1">Histórico de Dividendos</h3>
                      <p className="text-sm text-muted-foreground mb-4">Últimos pagamentos</p>
                      
                      <div className="bg-card border border-border rounded-xl p-4 h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={dividendChartData}>
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                            <YAxis hide />
                            <Tooltip 
                              formatter={(value: number) => [`R$ ${value.toFixed(4)}`, 'Valor']}
                              contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                            />
                            <Bar dataKey="value" fill="#818cf8" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </section>
                  )}

                  {/* Gráfico de Preço Histórico */}
                  {chartData.length > 0 && (
                    <section className="py-4 border-t border-border">
                      <h3 className="text-lg font-semibold text-foreground mb-1">Histórico de Preços</h3>
                      <p className="text-sm text-muted-foreground mb-4">Últimos 30 dias</p>
                      
                      <div className="bg-card border border-border rounded-xl p-4 h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData}>
                            <YAxis hide domain={['auto', 'auto']} />
                            <Tooltip 
                              formatter={(value: number) => [formatPrice(value), 'Preço']}
                              contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="value" 
                              stroke={isPositive ? "#22c55e" : "#ef4444"} 
                              strokeWidth={2} 
                              dot={false} 
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </section>
                  )}

                  {/* Notícias */}
                  <section className="py-4 border-t border-border">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Notícias relacionadas</h3>
                    
                    {newsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      </div>
                    ) : news.length > 0 ? (
                      <div className="space-y-3">
                        {news.slice(0, 5).map((item, index) => (
                          <a
                            key={index}
                            href={item.news_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block bg-card border border-border rounded-xl p-3 hover:border-primary transition-colors"
                          >
                            <div className="flex gap-3">
                              {item.image_url && (
                                <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                                  <img 
                                    src={item.image_url} 
                                    alt="" 
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-foreground line-clamp-2 mb-1">
                                  {item.title}
                                </h4>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>{item.source_name}</span>
                                  <span>•</span>
                                  <span>{new Date(item.date).toLocaleDateString('pt-BR')}</span>
                                  {item.sentiment && (
                                    <>
                                      <span>•</span>
                                      <span className={`${
                                        item.sentiment === 'Positive' ? 'text-emerald-500' : 
                                        item.sentiment === 'Negative' ? 'text-red-500' : 
                                        'text-muted-foreground'
                                      }`}>
                                        {item.sentiment === 'Positive' ? '📈' : item.sentiment === 'Negative' ? '📉' : '➖'}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            </div>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-muted/30 rounded-xl p-8 flex flex-col items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-3">
                          <FileText className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground text-center text-sm">
                          Nenhuma notícia encontrada para {stock?.symbol}.
                        </p>
                      </div>
                    )}
                  </section>
                </div>

                {/* Close button */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
                  <button
                    onClick={onClose}
                    className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shadow-lg"
                  >
                    <X className="w-6 h-6 text-muted-foreground" />
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default StockDetailDrawer;
