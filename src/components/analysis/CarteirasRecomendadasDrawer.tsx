import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ChevronRight,
  ChevronLeft,
  Search,
  Sun,
  Moon,
  Loader2,
} from "lucide-react";
import {
  Drawer,
  DrawerContent,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/hooks/useTheme";
import { supabase } from "@/integrations/supabase/client";
import CarteiraDetailDrawer from "./CarteiraDetailDrawer";

interface Analyst {
  name: string;
  role?: string;
  avatarUrl: string;
}

interface AssetLogo {
  ticker: string;
  logoUrl: string | null;
  shortName: string;
}

export interface RecommendedPortfolio {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  validUntil: string;
  rentabilidadeAnterior: number;
  rentabilidadeAcumulada: number;
  benchmark: string;
  benchmarkRentAnterior: number;
  benchmarkRentAcumulada: number;
  analysts: Analyst[];
  assetLogos: AssetLogo[];
  tickers: string[];
}

interface CarteirasRecomendadasDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CarteirasRecomendadasDrawer = ({ open, onOpenChange }: CarteirasRecomendadasDrawerProps) => {
  const { theme, toggleTheme } = useTheme();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [portfolios, setPortfolios] = useState<RecommendedPortfolio[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPortfolios = async () => {
    setLoading(true);
    try {
      console.log("Fetching recommended portfolios...");
      const { data, error } = await supabase.functions.invoke('recommended-portfolios', {
        body: { type: 'list' }
      });

      if (error) throw error;

      if (data?.portfolios) {
        console.log(`Loaded ${data.portfolios.length} portfolios`);
        setPortfolios(data.portfolios);
      }
    } catch (error) {
      console.error("Error fetching portfolios:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchPortfolios();
    }
  }, [open]);

  const filteredPortfolios = portfolios.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenDetail = (portfolioId: string) => {
    setSelectedPortfolioId(portfolioId);
    setDetailOpen(true);
  };

  const formatPercent = (value: number) => {
    const formatted = Math.abs(value).toFixed(2).replace(".", ",");
    return value >= 0 ? `${formatted}%` : `-${formatted}%`;
  };

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[95vh] bg-background">
          {/* Header */}
          <header className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2 text-foreground">
              <button onClick={() => onOpenChange(false)}>
                <span className="font-medium">Mercado</span>
              </button>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
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
            {/* Hero Banner - Kadig Style */}
            <div className="relative h-72 bg-gradient-to-br from-[hsl(var(--kadig-deep))] via-[hsl(var(--kadig-navy))] to-primary/20 overflow-hidden">
              {/* Decorative glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
              
              {/* Decorative lines */}
              <div className="absolute inset-0 opacity-30">
                <div className="absolute top-1/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
                <div className="absolute top-3/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
              </div>
              
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 relative z-10">
                <h1 className="text-4xl font-bold text-primary glow-text mb-2">Carteiras</h1>
                <h2 className="text-3xl font-bold text-foreground mb-4">recomendadas</h2>
                <p className="text-muted-foreground text-sm max-w-xs">
                  Descubra Carteiras Recomendadas e Ativos que entraram e saíram do Radar
                </p>
              </div>
            </div>

            {/* Search */}
            <div className="px-4 -mt-6 relative z-10">
              <div className="relative glass rounded-xl">
                <Input
                  placeholder="Buscar ativos, índices, fundos de investim..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-14 bg-transparent border-0 text-foreground placeholder:text-muted-foreground pr-12"
                />
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              </div>
            </div>

            {/* Últimas carteiras */}
            <section className="p-4 mt-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-primary rounded-full" />
                <h2 className="text-lg font-semibold text-foreground">Últimas carteiras</h2>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
                  <p className="text-sm text-muted-foreground">Carregando carteiras...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredPortfolios.map((portfolio, index) => (
                    <motion.div
                      key={portfolio.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="glass rounded-2xl overflow-hidden"
                    >
                      {/* Card Header with gradient - Kadig style */}
                      <div className="relative h-28 bg-gradient-to-br from-[hsl(var(--kadig-deep))] via-[hsl(var(--kadig-navy))] to-primary/30 p-4 flex items-end overflow-hidden">
                        {/* Decorative glow */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-2xl" />
                        
                        {/* Decorative lines */}
                        <div className="absolute inset-0 opacity-20">
                          <div className="absolute top-1/3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                          <div className="absolute top-2/3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground relative z-10">{portfolio.name}</h3>
                      </div>

                      {/* Card Body */}
                      <div className="p-4">
                        <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                          {portfolio.description}
                        </p>

                        {/* Asset logos - Real data from API */}
                        <div className="flex items-center gap-1 mb-4 overflow-x-auto scrollbar-hide">
                          <div className="flex -space-x-1">
                            {portfolio.assetLogos?.slice(0, 10).map((asset, i) => (
                              <div
                                key={i}
                                className="w-8 h-8 rounded-full bg-white border-2 border-background flex items-center justify-center overflow-hidden flex-shrink-0"
                              >
                                {asset.logoUrl ? (
                                  <img 
                                    src={asset.logoUrl} 
                                    alt={asset.ticker}
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                      (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                    }}
                                  />
                                ) : null}
                                <span className={`text-[8px] font-bold text-gray-700 ${asset.logoUrl ? 'hidden' : ''}`}>
                                  {asset.ticker.slice(0, 4)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Rentabilidade */}
                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-1 h-4 bg-primary rounded-full" />
                            <span className="text-foreground font-medium">Rentabilidade</span>
                          </div>
                          <div className="space-y-1 pl-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-1 h-3 bg-primary/60 rounded-full" />
                                <span className="text-muted-foreground text-sm">Rentabilidade Anterior</span>
                              </div>
                              <span className={`font-medium ${portfolio.rentabilidadeAnterior >= 0 ? "text-success" : "text-destructive"}`}>
                                {formatPercent(portfolio.rentabilidadeAnterior)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-1 h-3 bg-accent rounded-full" />
                                <span className="text-muted-foreground text-sm">Rentabilidade Acumulada</span>
                              </div>
                              <span className={`font-medium ${portfolio.rentabilidadeAcumulada >= 0 ? "text-success" : "text-destructive"}`}>
                                {formatPercent(portfolio.rentabilidadeAcumulada)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Benchmark */}
                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-1 h-4 bg-primary rounded-full" />
                            <span className="text-foreground font-medium">Benchmark</span>
                            <span className="text-muted-foreground text-sm ml-auto">{portfolio.benchmark}</span>
                          </div>
                          <div className="space-y-1 pl-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-1 h-3 bg-primary/60 rounded-full" />
                                <span className="text-muted-foreground text-sm">Rentabilidade Anterior</span>
                              </div>
                              <span className={`font-medium ${portfolio.benchmarkRentAnterior >= 0 ? "text-success" : "text-destructive"}`}>
                                {formatPercent(portfolio.benchmarkRentAnterior)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-1 h-3 bg-accent rounded-full" />
                                <span className="text-muted-foreground text-sm">Rentabilidade Acumulada</span>
                              </div>
                              <span className={`font-medium ${portfolio.benchmarkRentAcumulada >= 0 ? "text-success" : "text-destructive"}`}>
                                {formatPercent(portfolio.benchmarkRentAcumulada)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Ver Carteira Button - Kadig accent */}
                        <button
                          onClick={() => handleOpenDetail(portfolio.id)}
                          className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-medium py-3 rounded-xl flex items-center justify-between px-4 transition-colors"
                        >
                          <span>Ver Carteira</span>
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Detail Drawer */}
      <CarteiraDetailDrawer
        open={detailOpen}
        onOpenChange={setDetailOpen}
        portfolioId={selectedPortfolioId}
      />
    </>
  );
};

export default CarteirasRecomendadasDrawer;
