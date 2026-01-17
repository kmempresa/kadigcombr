import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Bell, 
  Star, 
  FileText,
  Loader2
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  Tooltip,
  ComposedChart
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
  symbol: string;
  shortName: string;
  longName: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  logoUrl: string | null;
  priceEarnings: number | null;
  earningsPerShare: number | null;
  priceToBook: number | null;
  dividendYield: number | null;
  marketCap: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  regularMarketDayHigh: number | null;
  regularMarketDayLow: number | null;
  regularMarketVolume: number | null;
}

// Sector stocks mock data (would need another API for real sector data)
const getSectorStocks = () => [
  { symbol: "RAIL3", name: "Rumo S.a.", price: 13.60, change: -0.95 },
  { symbol: "CCRO3", name: "CCR S.a.", price: 12.50, change: 0.32 },
];

const generateDividendData = () => [
  { month: "Mai.", value: Math.random() * 1 + 0.2 },
  { month: "Ago.", value: Math.random() * 1.5 + 0.3 },
  { month: "Dez.", value: Math.random() * 1 + 0.2 },
];

const generateResultsData = () => [
  { year: "2021", receita: 12, custos: 6, lucro: 2 },
  { year: "2022", receita: 14, custos: 7, lucro: 2.2 },
  { year: "2023", receita: 13, custos: 6.5, lucro: 2.1 },
  { year: "2024", receita: 15, custos: 7.5, lucro: 2.5 },
  { year: "2025", receita: 15.6, custos: 7.9, lucro: 2.7 },
];

const StockDetailDrawer = ({
  isOpen,
  onClose,
  stock,
  showValues,
  onToggleFavorite,
  isFavorite = false
}: StockDetailDrawerProps) => {
  const [chartPeriod, setChartPeriod] = useState<"5d" | "1m" | "1y" | "ytd">("5d");
  const [resultsPeriod, setResultsPeriod] = useState<"5" | "10">("5");
  const [loading, setLoading] = useState(false);
  const [stockDetails, setStockDetails] = useState<StockDetails | null>(null);
  const [chartData, setChartData] = useState<{day: number; value: number}[]>([]);
  
  useEffect(() => {
    if (isOpen && stock) {
      fetchStockDetails(stock.symbol);
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
        // Generate chart data based on price
        const basePrice = data.regularMarketPrice || 100;
        const generatedChart = [];
        let value = basePrice * 0.95;
        for (let i = 0; i < 30; i++) {
          value += (Math.random() - 0.48) * (basePrice * 0.02);
          generatedChart.push({ day: i, value: Math.max(value, basePrice * 0.8) });
        }
        // Ensure last value is close to current price
        generatedChart[generatedChart.length - 1].value = basePrice;
        setChartData(generatedChart);
      }
    } catch (error) {
      console.error("Error fetching stock details:", error);
      // Use basic stock data as fallback
      if (stock) {
        setStockDetails({
          symbol: stock.symbol,
          shortName: stock.shortName,
          longName: stock.shortName,
          regularMarketPrice: stock.regularMarketPrice,
          regularMarketChange: 0,
          regularMarketChangePercent: stock.regularMarketChangePercent,
          logoUrl: null,
          priceEarnings: null,
          earningsPerShare: null,
          priceToBook: null,
          dividendYield: null,
          marketCap: null,
          fiftyTwoWeekHigh: null,
          fiftyTwoWeekLow: null,
          regularMarketDayHigh: null,
          regularMarketDayLow: null,
          regularMarketVolume: null,
        });
      }
    }
    setLoading(false);
  };

  if (!stock) return null;

  const dividendData = generateDividendData();
  const resultsData = generateResultsData();
  const sectorStocks = getSectorStocks();
  const isPositive = (stockDetails?.regularMarketChangePercent ?? stock.regularMarketChangePercent) >= 0;
  const currentPrice = stockDetails?.regularMarketPrice ?? stock.regularMarketPrice;
  const changePercent = stockDetails?.regularMarketChangePercent ?? stock.regularMarketChangePercent;

  const formatPrice = (price: number) => {
    if (!showValues) return "R$ ••••••";
    return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const formatLargeNumber = (num: number | null) => {
    if (num === null) return "-";
    if (num >= 1e12) return `R$ ${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `R$ ${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `R$ ${(num / 1e6).toFixed(2)}M`;
    return `R$ ${num.toFixed(2)}`;
  };

  const formatIndicator = (value: number | null, suffix = "") => {
    if (value === null || value === undefined) return "-";
    return `${value.toFixed(2)}${suffix}`;
  };

  // Mini chart for sector stocks
  const MiniChart = ({ positive }: { positive: boolean }) => (
    <svg viewBox="0 0 80 24" className="w-20 h-6">
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
                <p className="text-muted-foreground">Carregando dados...</p>
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
                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <span className={`text-xl font-bold text-foreground ${stockDetails?.logoUrl ? 'hidden' : ''}`}>
                        {stock.symbol.slice(0, 3)}
                      </span>
                    </div>
                  </div>

                  {/* Stock Info */}
                  <div className="text-center mb-4">
                    <h2 className="text-xl font-bold text-foreground">{stock.symbol}</h2>
                    <p className="text-sm text-muted-foreground uppercase px-4">
                      {stockDetails?.longName || stock.shortName}
                    </p>
                  </div>

                  {/* Price Chart */}
                  <div className="h-16 mb-4">
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
                  {/* Informações - Dados Reais */}
                  <section className="py-4">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Informações</h3>
                    <div className="border-t border-border pt-4">
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Preço/lucro</p>
                          <p className="font-semibold text-foreground">
                            {formatIndicator(stockDetails?.priceEarnings ?? null)}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">P/VP</p>
                          <p className="font-semibold text-foreground">
                            {formatIndicator(stockDetails?.priceToBook ?? null)}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">LPA</p>
                          <p className="font-semibold text-foreground">
                            R$ {formatIndicator(stockDetails?.earningsPerShare ?? null)}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Dividend Yield</p>
                          <p className="font-semibold text-foreground">
                            {formatIndicator(stockDetails?.dividendYield ?? null, "%")}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Máx. 52 sem</p>
                          <p className="font-semibold text-foreground">
                            {stockDetails?.fiftyTwoWeekHigh ? formatPrice(stockDetails.fiftyTwoWeekHigh) : "-"}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Mín. 52 sem</p>
                          <p className="font-semibold text-foreground">
                            {stockDetails?.fiftyTwoWeekLow ? formatPrice(stockDetails.fiftyTwoWeekLow) : "-"}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Máx. Dia</p>
                          <p className="font-semibold text-foreground">
                            {stockDetails?.regularMarketDayHigh ? formatPrice(stockDetails.regularMarketDayHigh) : "-"}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Mín. Dia</p>
                          <p className="font-semibold text-foreground">
                            {stockDetails?.regularMarketDayLow ? formatPrice(stockDetails.regularMarketDayLow) : "-"}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Volume</p>
                          <p className="font-semibold text-foreground">
                            {stockDetails?.regularMarketVolume 
                              ? (stockDetails.regularMarketVolume / 1e6).toFixed(1) + "M"
                              : "-"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Market Cap */}
                  <section className="py-4 border-t border-border">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Valor de mercado</span>
                      <span className="font-semibold text-foreground">
                        {formatLargeNumber(stockDetails?.marketCap ?? null)}
                      </span>
                    </div>
                  </section>

                  {/* Ações do setor */}
                  <section className="py-4 border-t border-border">
                    <h3 className="text-lg font-semibold text-foreground mb-1">Ações do setor</h3>
                    <p className="text-sm text-muted-foreground mb-4">Outro:</p>
                    
                    <div className="space-y-3">
                      {sectorStocks.map((s) => (
                        <div key={s.symbol} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <button>
                              <Star className="w-5 h-5 text-muted-foreground" />
                            </button>
                            <div>
                              <p className="font-semibold text-foreground">{s.symbol}</p>
                              <p className="text-xs text-muted-foreground">{s.name}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <MiniChart positive={s.change >= 0} />
                            <div className="text-right">
                              <p className="font-semibold text-foreground">{formatPrice(s.price)}</p>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                s.change >= 0 ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
                              }`}>
                                {s.change >= 0 ? "+" : ""}{s.change.toFixed(2)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Comparação do setor */}
                  <section className="py-4 border-t border-border">
                    <h3 className="text-lg font-semibold text-foreground mb-1">Comparação do setor</h3>
                    <p className="text-sm text-muted-foreground mb-4">5 dias</p>
                    
                    <div className="flex gap-2 mb-4">
                      {["5d", "1m", "1y", "ytd"].map((period) => (
                        <button
                          key={period}
                          onClick={() => setChartPeriod(period as any)}
                          className={`px-4 py-2 rounded-full text-sm font-medium ${
                            chartPeriod === period 
                              ? "bg-muted text-foreground" 
                              : "text-muted-foreground"
                          }`}
                        >
                          {period === "5d" ? "5 DIAS" : period === "1m" ? "1 MÊS" : period === "1y" ? "1 ANO" : "YTD"}
                        </button>
                      ))}
                    </div>

                    <div className="bg-muted/30 rounded-xl p-4 h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <Line type="monotone" dataKey="value" stroke="#22d3ee" strokeWidth={2} dot={false} />
                          <Line type="monotone" dataKey="value" stroke="#ec4899" strokeWidth={2} dot={false} 
                            data={chartData.map((d) => ({ ...d, value: d.value * 0.95 }))} 
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </section>

                  {/* Notícias relacionadas */}
                  <section className="py-4 border-t border-border">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Notícias relacionadas</h3>
                    
                    <div className="bg-muted/30 rounded-xl p-8 flex flex-col items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-3">
                        <FileText className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground text-center">
                        Nenhuma notícia relacionada<br/>encontrada
                      </p>
                    </div>
                  </section>

                  {/* Histórico de proventos */}
                  <section className="py-4 border-t border-border">
                    <h3 className="text-lg font-semibold text-foreground mb-1">Histórico de proventos</h3>
                    <p className="text-sm text-muted-foreground mb-4">Últimos 12 meses</p>
                    
                    <div className="bg-card border border-border rounded-xl p-4 h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dividendData}>
                          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                          <Bar dataKey="value" fill="#818cf8" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </section>

                  {/* Resultado */}
                  <section className="py-4 border-t border-border">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-lg font-semibold text-foreground">Resultado</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setResultsPeriod("5")}
                          className={`px-4 py-2 rounded-full text-sm font-medium ${
                            resultsPeriod === "5" ? "bg-muted text-foreground" : "text-muted-foreground"
                          }`}
                        >
                          5 ANOS
                        </button>
                        <button
                          onClick={() => setResultsPeriod("10")}
                          className={`px-4 py-2 rounded-full text-sm font-medium ${
                            resultsPeriod === "10" ? "bg-muted text-foreground" : "text-muted-foreground"
                          }`}
                        >
                          10 ANOS
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">Últimos {resultsPeriod} anos</p>
                    
                    <div className="bg-card border border-border rounded-xl p-4 h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={resultsData}>
                          <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'white', 
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              fontSize: '12px'
                            }}
                            formatter={(value: number, name: string) => [
                              `R$ ${value.toFixed(2)}B`,
                              name === 'receita' ? 'Receita líquida' : name === 'custos' ? 'Custos' : 'Lucro líquido'
                            ]}
                          />
                          <Bar dataKey="receita" fill="#818cf8" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="custos" fill="#fb923c" radius={[4, 4, 0, 0]} />
                          <Line type="monotone" dataKey="lucro" stroke="#ec4899" strokeWidth={2} dot={{ fill: '#ec4899', r: 4 }} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
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
