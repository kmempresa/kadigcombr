import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ChevronRight,
  ChevronLeft,
  Search,
  Sun,
  Moon,
  Loader2,
  Filter,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";
import {
  Drawer,
  DrawerContent,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/hooks/useTheme";
import { supabase } from "@/integrations/supabase/client";

interface StockScore {
  ticker: string;
  name: string;
  sector: string;
  logoUrl: string | null;
  regularMarketPrice: number;
  regularMarketChangePercent: number;
  scores: {
    financeiro: number;
    dividendos: number;
    recomendacao: number;
    kadig: number;
  };
  fundamentals: {
    pl: number | null;
    pvp: number | null;
    roe: number | null;
    dividendYield: number | null;
    netMargin: number | null;
  };
}

interface IndiceKadigDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Gauge component for displaying scores
const GaugeChart = ({ value, label, colorType }: { value: number; label: string; colorType: 'financeiro' | 'dividendos' | 'recomendacao' | 'kadig' }) => {
  const rotation = (value / 100) * 180 - 90;
  
  const getGradientColors = () => {
    switch (colorType) {
      case 'financeiro':
        return 'from-red-500 via-yellow-400 to-green-500';
      case 'dividendos':
        return 'from-red-500 via-yellow-400 to-green-500';
      case 'recomendacao':
        return 'from-gray-400 via-gray-300 to-gray-200';
      case 'kadig':
        return 'from-purple-600 via-purple-400 to-purple-300';
      default:
        return 'from-gray-400 to-gray-200';
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-16 h-9 overflow-hidden">
        {/* Gauge background */}
        <div className={`absolute bottom-0 left-0 right-0 h-16 rounded-t-full bg-gradient-to-r ${getGradientColors()}`} />
        {/* White center overlay */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-5 bg-card rounded-t-full" />
        {/* Needle */}
        <div 
          className="absolute bottom-0 left-1/2 w-0.5 h-7 bg-foreground origin-bottom transition-transform duration-500"
          style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
        />
        {/* Center dot */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-foreground rounded-full" />
      </div>
      <span className="text-muted-foreground text-[10px] mt-1 text-center">{label}</span>
    </div>
  );
};

const IndiceKadigDrawer = ({ open, onOpenChange }: IndiceKadigDrawerProps) => {
  const { theme, toggleTheme } = useTheme();
  const [searchTerm, setSearchTerm] = useState("");
  const [stocks, setStocks] = useState<StockScore[]>([]);
  const [topPerformers, setTopPerformers] = useState<StockScore[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState<'kadig' | 'financeiro' | 'dividendos' | 'recomendacao'>('kadig');
  const [showFilters, setShowFilters] = useState(false);

  const fetchKadigIndex = async () => {
    setLoading(true);
    try {
      console.log(`Fetching Kadig Index: page=${currentPage}, sortBy=${sortBy}`);
      const { data, error } = await supabase.functions.invoke('kadig-index', {
        body: { 
          type: 'list', 
          page: currentPage,
          limit: 10,
          sortBy,
        }
      });

      if (error) throw error;

      if (data) {
        console.log(`Loaded ${data.stocks?.length || 0} stocks`);
        setStocks(data.stocks || []);
        setTopPerformers(data.topPerformers || []);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error("Error fetching Kadig Index:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchKadigIndex();
    }
  }, [open, currentPage, sortBy]);

  const filteredStocks = stocks.filter(s =>
    s.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-success';
    if (score >= 50) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[95vh] bg-background">
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2 text-foreground">
            <button onClick={() => onOpenChange(false)}>
              <span className="font-medium">Mercado</span>
            </button>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Índice Kadig</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button onClick={() => onOpenChange(false)} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {/* Hero Banner - Purple/Magenta Kadig Style */}
          <div className="relative min-h-[420px] bg-gradient-to-br from-[hsl(var(--kadig-deep))] via-[hsl(280,50%,15%)] to-[hsl(300,60%,20%)] overflow-hidden">
            {/* Decorative glows */}
            <div className="absolute top-20 left-10 w-48 h-48 bg-purple-500/30 rounded-full blur-3xl" />
            <div className="absolute top-40 right-10 w-32 h-32 bg-fuchsia-500/20 rounded-full blur-2xl" />
            <div className="absolute bottom-20 left-1/3 w-24 h-24 bg-purple-400/20 rounded-full blur-xl" />
            
            {/* Decorative lines */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-1/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent" />
              <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-fuchsia-400/50 to-transparent" />
              <div className="absolute top-3/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent" />
            </div>
            
            <div className="relative z-10 p-6 pt-8">
              <h1 className="text-4xl font-bold text-purple-400 mb-1" style={{ textShadow: '0 0 30px rgba(168, 85, 247, 0.5)' }}>
                Índice
              </h1>
              <h2 className="text-3xl font-bold text-foreground mb-4">Kadig</h2>
              <p className="text-muted-foreground text-sm max-w-xs mb-6">
                Acompanhe como anda a saúde de cada ativo segundo o nosso índice
              </p>

              {/* Search */}
              <div className="relative glass rounded-xl mb-6">
                <Input
                  placeholder="Buscar ativos, índices, fundos de investim..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-14 bg-transparent border-0 text-foreground placeholder:text-muted-foreground pr-12"
                />
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              </div>

              {/* Top Performers Section */}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-primary rounded-full" />
                <h3 className="text-lg font-semibold text-foreground">Melhores ativos no Índice Kadig</h3>
              </div>

              {/* Top Performer Cards */}
              <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-4">
                {topPerformers.slice(0, 2).map((stock, index) => (
                  <motion.div
                    key={stock.ticker}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex-shrink-0 w-44 glass rounded-2xl p-4"
                  >
                    <p className="text-foreground font-bold text-lg mb-1">{stock.ticker}</p>
                    <p className="text-muted-foreground text-xs line-clamp-2 mb-4 h-8">
                      {stock.name}
                    </p>
                    
                    {/* Gauge visualization */}
                    <div className="relative h-20 flex items-end justify-center mb-2">
                      <div className="relative w-28 h-14 overflow-hidden">
                        <div className="absolute bottom-0 left-0 right-0 h-28 rounded-t-full bg-gradient-to-r from-red-500 via-yellow-400 to-green-500" />
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-10 bg-card rounded-t-full" />
                        <div 
                          className="absolute bottom-0 left-1/2 w-1 h-12 bg-foreground origin-bottom transition-transform duration-500"
                          style={{ transform: `translateX(-50%) rotate(${(stock.scores.kadig / 100) * 180 - 90}deg)` }}
                        />
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-foreground rounded-full" />
                      </div>
                    </div>
                    
                    <p className={`text-center text-2xl font-bold ${getScoreColor(stock.scores.kadig)}`}>
                      {stock.scores.kadig.toFixed(2).replace('.', ',')}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Promotional Banner */}
          <div className="p-4">
            <div className="relative bg-gradient-to-br from-purple-600 via-purple-500 to-fuchsia-500 rounded-2xl p-6 overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-1/4 w-16 h-16 bg-white/10 rounded-full translate-y-1/2" />
              
              <h3 className="text-2xl font-bold text-white mb-3">Descubra o Índice Kadig.</h3>
              <p className="text-white/90 text-sm mb-4">
                Uma ferramenta que avalia a saúde financeira, dividendos e recomendações de empresas. Saiba como tomar decisões financeiras mais informadas e explore o potencial de investimentos.
              </p>
              <button className="bg-accent hover:bg-accent/90 text-accent-foreground font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition-colors">
                <span>Saiba mais</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Destaques do Índice Kadig */}
          <section className="px-4 pb-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1 h-6 bg-primary rounded-full" />
              <h2 className="text-lg font-semibold text-foreground">Destaques do Índice Kadig</h2>
            </div>
            <p className="text-muted-foreground text-sm mb-4">Todos os ativos avaliados pelo Kadig</p>

            {/* Search and Filter */}
            <div className="glass rounded-2xl p-4 mb-4">
              <div className="flex gap-3 mb-4">
                <div className="relative flex-1">
                  <Input
                    placeholder="Pesquise ações"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-12 bg-secondary border-0 text-foreground placeholder:text-muted-foreground pr-10"
                  />
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                </div>
                <button className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center text-muted-foreground">
                  <SlidersHorizontal className="w-5 h-5" />
                </button>
              </div>

              {/* Filter dropdown */}
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className="w-full flex items-center justify-between bg-secondary rounded-lg px-4 py-3 text-muted-foreground"
              >
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  <span>Filtrar por</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>

              {showFilters && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {(['kadig', 'financeiro', 'dividendos', 'recomendacao'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => { setSortBy(filter); setCurrentPage(1); }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        sortBy === filter
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {filter === 'kadig' ? 'Índice Kadig' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Stocks List */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
                <p className="text-sm text-muted-foreground">Calculando índices...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredStocks.map((stock, index) => (
                  <motion.div
                    key={stock.ticker}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="glass rounded-2xl p-4"
                  >
                    {/* Stock Header */}
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
                        {stock.logoUrl ? (
                          <img 
                            src={stock.logoUrl} 
                            alt={stock.ticker}
                            className="w-full h-full object-contain p-1"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).parentElement!.innerHTML = 
                                `<span class="text-xs font-bold text-gray-700">${stock.ticker}</span>`;
                            }}
                          />
                        ) : (
                          <span className="text-xs font-bold text-gray-700">{stock.ticker}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="bg-secondary text-secondary-foreground text-xs px-2 py-0.5 rounded">
                            {stock.ticker}
                          </span>
                          <p className="text-foreground font-medium text-sm truncate">
                            {stock.name}
                          </p>
                        </div>
                        <p className="text-muted-foreground text-xs truncate">{stock.sector}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-muted-foreground text-xs">RESULTADO</p>
                        <p className={`text-xl font-bold ${getScoreColor(stock.scores.kadig)}`}>
                          {stock.scores.kadig.toFixed(2).replace('.', ',')}
                        </p>
                      </div>
                    </div>

                    {/* Gauges */}
                    <div className="flex justify-between items-end">
                      <GaugeChart value={stock.scores.financeiro} label="Financeiro" colorType="financeiro" />
                      <GaugeChart value={stock.scores.dividendos} label="Dividendos" colorType="dividendos" />
                      <GaugeChart value={stock.scores.recomendacao} label="Recomendação" colorType="recomendacao" />
                      <GaugeChart value={stock.scores.kadig} label="Índice Kadig" colorType="kadig" />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6 flex-wrap">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground disabled:opacity-50"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                {Array.from({ length: Math.min(3, totalPages) }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${
                      currentPage === pageNum
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}

                {totalPages > 3 && (
                  <>
                    <span className="text-muted-foreground">...</span>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium ${
                        currentPage === totalPages
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground'
                      }`}
                    >
                      {totalPages}
                    </button>
                  </>
                )}

                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground disabled:opacity-50"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </section>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default IndiceKadigDrawer;
