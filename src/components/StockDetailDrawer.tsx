import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Bell, 
  Star, 
  TrendingUp, 
  TrendingDown,
  FileText,
  Loader2
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
  ComposedChart
} from "recharts";

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

// Mock data for financial indicators
const getMockFinancialData = (symbol: string) => ({
  precoLucro: (Math.random() * 20 + 5).toFixed(2),
  pvp: (Math.random() * 3 + 0.5).toFixed(2),
  roe: (Math.random() * 30 + 5).toFixed(2),
  dividendYield: (Math.random() * 8 + 1).toFixed(2),
  payout: (Math.random() * 50 + 10).toFixed(2),
  lucroPorAcao: (Math.random() * 5 + 0.5).toFixed(2),
  volatilidade: (Math.random() * 40 + 10).toFixed(2),
  beta: (Math.random() * 2 + 0.5).toFixed(2),
  dividaBruta: (Math.random() * 50 + 10).toFixed(2),
  dividaLiquida: (Math.random() * 40 + 5).toFixed(2),
  passivoAtivos: (Math.random() * 1 + 0.3).toFixed(2),
  liquidezCorrente: (Math.random() * 2 + 0.5).toFixed(2),
  giroAtivo: (Math.random() * 1 + 0.1).toFixed(2),
  pEbitda: (Math.random() * 10 + 2).toFixed(2),
  margemBruta: (Math.random() * 50 + 20).toFixed(2),
  margemLiquida: (Math.random() * 30 + 5).toFixed(2),
});

// Mock chart data
const generateChartData = () => {
  const data = [];
  let value = 100;
  for (let i = 0; i < 30; i++) {
    value += (Math.random() - 0.5) * 5;
    data.push({ day: i, value: Math.max(value, 50) });
  }
  return data;
};

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

// Sector stocks mock data
const getSectorStocks = () => [
  { symbol: "RAIL3", name: "Rumo S.a.", price: 13.60, change: -0.95 },
  { symbol: "MRSA5B", name: "Mrs Logistica S.a.", price: 24.50, change: 0.00 },
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
  
  if (!stock) return null;

  const financials = getMockFinancialData(stock.symbol);
  const chartData = generateChartData();
  const dividendData = generateDividendData();
  const resultsData = generateResultsData();
  const sectorStocks = getSectorStocks();
  const isPositive = stock.regularMarketChangePercent >= 0;

  const formatPrice = (price: number) => {
    if (!showValues) return "R$ ••••••";
    return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
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
            {/* Header with gradient */}
            <div className="bg-gradient-to-b from-muted to-background pt-8 pb-6 px-4">
              {/* Company Logo */}
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 bg-card rounded-2xl shadow-lg flex items-center justify-center">
                  <span className="text-xl font-bold text-foreground">
                    {stock.symbol.slice(0, 3)}
                  </span>
                </div>
              </div>

              {/* Stock Info */}
              <div className="text-center mb-4">
                <h2 className="text-xl font-bold text-foreground">{stock.symbol}</h2>
                <p className="text-sm text-muted-foreground uppercase">
                  {stock.shortName}
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
                    {formatPrice(stock.regularMarketPrice)}
                  </span>
                  <span className={`px-4 py-2 rounded-full font-semibold text-white ${
                    isPositive ? "bg-emerald-500" : "bg-red-500"
                  }`}>
                    {isPositive ? "+" : ""}{stock.regularMarketChangePercent.toFixed(2)}%
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
              {/* Informações */}
              <section className="py-4">
                <h3 className="text-lg font-semibold text-foreground mb-4">Informações</h3>
                <div className="border-t border-border pt-4">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Preço/lucro</p>
                      <p className="font-semibold text-foreground">{financials.precoLucro}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">P/VP</p>
                      <p className="font-semibold text-foreground">{financials.pvp}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">ROE</p>
                      <p className="font-semibold text-foreground">{financials.roe}%</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Dividend Yield</p>
                      <p className="font-semibold text-foreground">{financials.dividendYield}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Payout</p>
                      <p className="font-semibold text-foreground">{financials.payout}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Lucro por ação</p>
                      <p className="font-semibold text-foreground">R$ {financials.lucroPorAcao}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Volatilidade</p>
                      <p className="font-semibold text-foreground">{financials.volatilidade}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Beta</p>
                      <p className="font-semibold text-foreground">{financials.beta}</p>
                    </div>
                    <div />
                  </div>
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
                        data={chartData.map((d, i) => ({ ...d, value: d.value - 10 + Math.random() * 5 }))} 
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

              {/* Outros múltiplos */}
              <section className="py-4 border-t border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4">Outros múltiplos</h3>
                
                <div className="border-t border-primary pt-4">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Dívida Bruta</p>
                      <p className="font-semibold text-foreground">R$ {financials.dividaBruta}B</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Dívida Líquida</p>
                      <p className="font-semibold text-foreground">R$ {financials.dividaLiquida}B</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Passivo / Ativos</p>
                      <p className="font-semibold text-foreground">{financials.passivoAtivos}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Liqui. Corrente</p>
                      <p className="font-semibold text-foreground">{financials.liquidezCorrente}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Giro do Ativo</p>
                      <p className="font-semibold text-foreground">{financials.giroAtivo}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">P / EBITDA</p>
                      <p className="font-semibold text-foreground">{financials.pEbitda}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Margem Bruta</p>
                      <p className="font-semibold text-foreground">{financials.margemBruta}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Marg. Líquida</p>
                      <p className="font-semibold text-foreground">{financials.margemLiquida}%</p>
                    </div>
                    <div />
                  </div>
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
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default StockDetailDrawer;
