import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ChevronRight,
  ChevronLeft,
  Sun,
  Moon,
  Download,
  ArrowUp,
  ArrowDown,
  Loader2,
} from "lucide-react";
import {
  Drawer,
  DrawerContent,
} from "@/components/ui/drawer";
import { useTheme } from "@/hooks/useTheme";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";

interface CarteiraDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  portfolioId: string | null;
}

interface Asset {
  ticker: string;
  name: string;
  sector: string;
  weight: number;
  logoUrl: string | null;
  regularMarketPrice: number;
  regularMarketChangePercent: number;
  pl: number | null;
  evEbtida: number | null;
  pvp: number | null;
  dividendYield: number | null;
  isNew: boolean;
  isRemoved: boolean;
}

interface PortfolioDetail {
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
  analysts: { name: string; avatarUrl: string }[];
  assets: Asset[];
  removedAssets: Asset[];
  newAssets: Asset[];
  sectorDistribution: { name: string; value: number }[];
  assetDistribution: { name: string; value: number }[];
}

// Kadig color palette for charts
const COLORS = [
  "hsl(210, 100%, 60%)", // primary blue
  "hsl(210, 100%, 75%)", // light blue
  "hsl(185, 80%, 55%)",  // cyan/accent
  "hsl(220, 65%, 25%)",  // navy
  "hsl(220, 55%, 35%)",  // lighter navy
  "hsl(210, 100%, 50%)", // darker blue
  "hsl(185, 80%, 45%)",  // darker cyan
  "hsl(220, 50%, 45%)",  // muted blue
  "hsl(210, 80%, 65%)",  // soft blue
  "hsl(185, 60%, 60%)",  // soft cyan
];

const CarteiraDetailDrawer = ({ open, onOpenChange, portfolioId }: CarteiraDetailDrawerProps) => {
  const { theme, toggleTheme } = useTheme();
  const [portfolio, setPortfolio] = useState<PortfolioDetail | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchPortfolioDetail = async () => {
    if (!portfolioId) return;
    
    setLoading(true);
    try {
      console.log(`Fetching portfolio detail for ${portfolioId}...`);
      const { data, error } = await supabase.functions.invoke('recommended-portfolios', {
        body: { type: 'detail', portfolioId }
      });

      if (error) throw error;

      if (data) {
        console.log(`Loaded portfolio with ${data.assets?.length || 0} assets`);
        setPortfolio(data);
      }
    } catch (error) {
      console.error("Error fetching portfolio detail:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && portfolioId) {
      fetchPortfolioDetail();
    }
  }, [open, portfolioId]);

  const formatPercent = (value: number) => {
    const formatted = Math.abs(value).toFixed(2).replace(".", ",");
    return value >= 0 ? `${formatted}%` : `-${formatted}%`;
  };

  const formatNumber = (value: number | null) => {
    if (value === null || value === undefined) return "-";
    return value.toFixed(2).replace(".", ",");
  };

  if (!portfolioId) return null;

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

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
            <p className="text-sm text-muted-foreground">Carregando carteira...</p>
          </div>
        ) : portfolio ? (
          <div className="flex-1 overflow-y-auto">
            {/* Hero Section - Kadig Style */}
            <div className="relative bg-gradient-to-br from-[hsl(var(--kadig-deep))] via-[hsl(var(--kadig-navy))] to-primary/20 p-6 overflow-hidden">
              {/* Decorative glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
              
              {/* Decorative lines */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-1/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
                <div className="absolute top-3/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
              </div>

              <div className="relative z-10">
                <button 
                  onClick={() => onOpenChange(false)}
                  className="text-muted-foreground text-sm mb-6 underline hover:text-foreground transition-colors"
                >
                  Voltar
                </button>

                <h1 className="text-2xl font-bold text-foreground mb-2">
                  Essa é a carteira recomendada de
                </h1>
                <h2 className="text-3xl font-bold text-accent glow-text mb-4">
                  {portfolio.name}
                </h2>
                <p className="text-muted-foreground text-sm mb-4">
                  Criada em: {portfolio.createdAt} • Válida até: {portfolio.validUntil}
                </p>
                <p className="text-muted-foreground text-sm mb-6">
                  {portfolio.description}
                </p>

                {/* Analysts */}
                <div className="flex flex-wrap gap-4 mb-6">
                  {portfolio.analysts?.map((analyst, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <img
                        src={analyst.avatarUrl}
                        alt={analyst.name}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/30"
                      />
                      <span className="text-foreground text-sm">{analyst.name}</span>
                    </div>
                  ))}
                </div>

                {/* Download Button */}
                <button className="glass hover:bg-card/80 text-foreground font-medium py-3 px-6 rounded-xl flex items-center gap-2 transition-colors">
                  <Download className="w-5 h-5" />
                  <span>Baixar Carteira</span>
                </button>
              </div>
            </div>

            {/* Rentabilidade teórica */}
            <section className="p-4">
              <div className="glass rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-5 bg-primary rounded-full" />
                  <h3 className="text-foreground font-semibold">Rentabilidade teórica</h3>
                </div>
                <div className="h-px bg-border mb-4" />
                
                <div className="space-y-2">
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
            </section>

            {/* Benchmark */}
            <section className="px-4 pb-4">
              <div className="glass rounded-2xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-5 bg-primary rounded-full" />
                    <h3 className="text-foreground font-semibold">Benchmark</h3>
                  </div>
                  <span className="text-muted-foreground">{portfolio.benchmark}</span>
                </div>
                <div className="h-px bg-border mb-4" />
                
                <div className="space-y-2">
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
            </section>

            {/* Distribuição por ativo */}
            {portfolio.assetDistribution && portfolio.assetDistribution.length > 0 && (
              <section className="px-4 pb-4">
                <div className="glass rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-5 bg-primary rounded-full" />
                    <h3 className="text-foreground font-semibold">Distribuição por ativo</h3>
                  </div>

                  <div className="h-64 mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={portfolio.assetDistribution}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          dataKey="value"
                          stroke="hsl(var(--background))"
                          strokeWidth={2}
                        >
                          {portfolio.assetDistribution.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {portfolio.assetDistribution.map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div 
                          className="w-1 h-4 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-muted-foreground text-xs">
                          {item.value.toFixed(0)}% - {item.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Distribuição por setor */}
            {portfolio.sectorDistribution && portfolio.sectorDistribution.length > 0 && (
              <section className="px-4 pb-4">
                <div className="glass rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-5 bg-primary rounded-full" />
                    <h3 className="text-foreground font-semibold">Distribuição por setor</h3>
                  </div>

                  <div className="h-64 mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={portfolio.sectorDistribution}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          dataKey="value"
                          stroke="hsl(var(--background))"
                          strokeWidth={2}
                        >
                          {portfolio.sectorDistribution.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-2">
                    {portfolio.sectorDistribution.map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div 
                          className="w-1 h-4 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-muted-foreground text-sm truncate">
                          {item.value.toFixed(0)}% - {item.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Composição da carteira */}
            {portfolio.assets && portfolio.assets.length > 0 && (
              <section className="px-4 pb-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-5 bg-primary rounded-full" />
                  <h3 className="text-foreground font-semibold">Composição da carteira</h3>
                </div>

                <div className="space-y-3">
                  {portfolio.assets.map((asset, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="glass rounded-xl p-4"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center overflow-hidden flex-shrink-0 ring-1 ring-border">
                          {asset.logoUrl ? (
                            <img 
                              src={asset.logoUrl} 
                              alt={asset.ticker}
                              className="w-full h-full object-contain p-1"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).parentElement!.innerHTML = 
                                  `<span class="text-xs font-bold text-gray-700">${asset.ticker}</span>`;
                              }}
                            />
                          ) : (
                            <span className="text-xs font-bold text-gray-700">{asset.ticker}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-foreground font-medium text-sm truncate pr-2">{asset.name}</p>
                            {asset.isNew && (
                              <ArrowDown className="w-5 h-5 text-success flex-shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded-md">
                              {asset.ticker}
                            </span>
                            <span className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded-md truncate max-w-[180px]">
                              {asset.sector}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Peso:</span>
                          <span className="text-foreground font-medium">{asset.weight.toFixed(2).replace(".", ",")}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">P/L (12M)</span>
                          <span className="text-foreground">{formatNumber(asset.pl)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">EV/EBTIDA (12M)</span>
                          <span className="text-foreground">{formatNumber(asset.evEbtida)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">P/VP (12M)</span>
                          <span className="text-foreground">{formatNumber(asset.pvp)}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* Ativos que saíram da carteira */}
            {portfolio.removedAssets && portfolio.removedAssets.length > 0 && (
              <section className="px-4 pb-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-5 bg-destructive rounded-full" />
                  <h3 className="text-foreground font-semibold">Ativos que saíram da carteira</h3>
                </div>

                <div className="space-y-3">
                  {portfolio.removedAssets.map((asset, index) => (
                    <div key={index} className="glass rounded-xl p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center overflow-hidden flex-shrink-0 ring-1 ring-border">
                          {asset.logoUrl ? (
                            <img 
                              src={asset.logoUrl} 
                              alt={asset.ticker}
                              className="w-full h-full object-contain p-1"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).parentElement!.innerHTML = 
                                  `<span class="text-xs font-bold text-gray-700">${asset.ticker}</span>`;
                              }}
                            />
                          ) : (
                            <span className="text-xs font-bold text-gray-700">{asset.ticker}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-foreground font-medium text-sm truncate pr-2">{asset.name}</p>
                            <ArrowUp className="w-5 h-5 text-destructive flex-shrink-0" />
                          </div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded-md">
                              {asset.ticker}
                            </span>
                            <span className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded-md truncate max-w-[180px]">
                              {asset.sector}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">P/L (12M)</span>
                          <span className="text-foreground">{formatNumber(asset.pl)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">EV/EBTIDA (12M)</span>
                          <span className="text-foreground">{formatNumber(asset.evEbtida)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">P/VP (12M)</span>
                          <span className="text-foreground">{formatNumber(asset.pvp)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Ativos que entraram na carteira */}
            {portfolio.newAssets && portfolio.newAssets.length > 0 && (
              <section className="px-4 pb-20">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-5 bg-success rounded-full" />
                  <h3 className="text-foreground font-semibold">Ativos que entraram na carteira</h3>
                </div>

                <div className="space-y-3">
                  {portfolio.newAssets.map((asset, index) => (
                    <div key={index} className="glass rounded-xl p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center overflow-hidden flex-shrink-0 ring-1 ring-border">
                          {asset.logoUrl ? (
                            <img 
                              src={asset.logoUrl} 
                              alt={asset.ticker}
                              className="w-full h-full object-contain p-1"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).parentElement!.innerHTML = 
                                  `<span class="text-xs font-bold text-gray-700">${asset.ticker}</span>`;
                              }}
                            />
                          ) : (
                            <span className="text-xs font-bold text-gray-700">{asset.ticker}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-foreground font-medium text-sm truncate pr-2">{asset.name}</p>
                            <ArrowDown className="w-5 h-5 text-success flex-shrink-0" />
                          </div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded-md">
                              {asset.ticker}
                            </span>
                            <span className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded-md truncate max-w-[180px]">
                              {asset.sector}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">P/L (12M)</span>
                          <span className="text-foreground">{formatNumber(asset.pl)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">EV/EBTIDA (12M)</span>
                          <span className="text-foreground">{formatNumber(asset.evEbtida)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">P/VP (12M)</span>
                          <span className="text-foreground">{formatNumber(asset.pvp)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : null}
      </DrawerContent>
    </Drawer>
  );
};

export default CarteiraDetailDrawer;
