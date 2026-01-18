import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  Globe, 
  Wallet, 
  TrendingUp, 
  Building2, 
  Car, 
  Briefcase, 
  RefreshCw,
  Loader2,
  ChevronRight
} from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface GlobalAsset {
  id: string;
  name: string;
  category: string;
  currency: string;
  original_value: number;
  value_brl: number;
  exchange_rate: number;
}

interface PatrimonioTotalCarouselProps {
  totalInvestimentos: number;
  totalGanhosInvestimentos: number;
  showValues: boolean;
  userName: string;
}

const CATEGORY_ICONS: Record<string, any> = {
  imoveis: Building2,
  veiculos: Car,
  empresas: Briefcase,
  default: Globe,
};

const CATEGORY_COLORS: Record<string, string> = {
  imoveis: "#3b82f6",
  veiculos: "#10b981",
  empresas: "#8b5cf6",
  joias: "#f59e0b",
  arte: "#ec4899",
  cripto: "#f97316",
  poupanca: "#06b6d4",
  outros: "#64748b",
};

const PatrimonioTotalCarousel = ({
  totalInvestimentos,
  totalGanhosInvestimentos,
  showValues,
  userName,
}: PatrimonioTotalCarouselProps) => {
  const navigate = useNavigate();
  const [globalAssets, setGlobalAssets] = useState<GlobalAsset[]>([]);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [updatingRates, setUpdatingRates] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "center" });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  // Fetch exchange rates from API
  const fetchExchangeRates = async () => {
    setUpdatingRates(true);
    try {
      const response = await fetch("https://api.exchangerate-api.com/v4/latest/BRL");
      if (response.ok) {
        const data = await response.json();
        const rates: Record<string, number> = { BRL: 1 };
        for (const [currency, rate] of Object.entries(data.rates)) {
          rates[currency] = 1 / (rate as number);
        }
        setExchangeRates(rates);
        setLastUpdate(new Date());
        
        // Update global assets with new rates
        await updateGlobalAssetsRates(rates);
      }
    } catch (error) {
      console.error("Error fetching exchange rates:", error);
    } finally {
      setUpdatingRates(false);
    }
  };

  // Update global assets in database with new exchange rates
  const updateGlobalAssetsRates = async (rates: Record<string, number>) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Update each non-BRL asset
    for (const asset of globalAssets) {
      if (asset.currency !== "BRL" && rates[asset.currency]) {
        const newRate = rates[asset.currency];
        const newValueBrl = asset.original_value * newRate;
        
        await supabase
          .from("global_assets")
          .update({
            exchange_rate: newRate,
            value_brl: newValueBrl,
          })
          .eq("id", asset.id);
      }
    }

    // Refetch assets
    fetchGlobalAssets();
  };

  // Fetch global assets
  const fetchGlobalAssets = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from("global_assets")
        .select("*")
        .order("value_brl", { ascending: false });

      if (!error && data) {
        setGlobalAssets(data);
      }
    } catch (error) {
      console.error("Error fetching global assets:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobalAssets();
    fetchExchangeRates();

    // Update rates every 5 minutes
    const interval = setInterval(fetchExchangeRates, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Calculate totals
  const totalPatrimonioGlobal = globalAssets.reduce((sum, asset) => sum + asset.value_brl, 0);
  const totalPatrimonioCompleto = totalInvestimentos + totalPatrimonioGlobal;

  // Group assets by category
  const assetsByCategory = globalAssets.reduce((acc, asset) => {
    if (!acc[asset.category]) acc[asset.category] = [];
    acc[asset.category].push(asset);
    return acc;
  }, {} as Record<string, GlobalAsset[]>);

  const categoryTotals = Object.entries(assetsByCategory).map(([category, assets]) => ({
    category,
    total: assets.reduce((sum, a) => sum + a.value_brl, 0),
    count: assets.length,
  }));

  const formatCurrency = (value: number) => {
    if (!showValues) return "R$ ••••••";
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const formatPercent = (value: number) => {
    if (!showValues) return "••%";
    return `${value.toFixed(1)}%`;
  };

  // Build carousel slides
  const slides = [
    // Slide 1: Patrimônio Total
    {
      id: "total",
      title: "Patrimônio Total",
      subtitle: userName,
      value: totalPatrimonioCompleto,
      icon: Wallet,
      color: "from-primary to-accent",
      details: [
        { label: "Investimentos", value: totalInvestimentos },
        { label: "Patrimônio Global", value: totalPatrimonioGlobal },
      ],
    },
    // Slide 2: Investimentos
    {
      id: "investimentos",
      title: "Investimentos",
      subtitle: "Carteiras",
      value: totalInvestimentos,
      gain: totalGanhosInvestimentos,
      icon: TrendingUp,
      color: "from-emerald-500 to-teal-500",
      percent: totalPatrimonioCompleto > 0 ? (totalInvestimentos / totalPatrimonioCompleto) * 100 : 0,
    },
    // Slide 3: Patrimônio Global
    {
      id: "global",
      title: "Patrimônio Global",
      subtitle: `${globalAssets.length} bens`,
      value: totalPatrimonioGlobal,
      icon: Globe,
      color: "from-violet-500 to-purple-500",
      percent: totalPatrimonioCompleto > 0 ? (totalPatrimonioGlobal / totalPatrimonioCompleto) * 100 : 0,
      categories: categoryTotals,
    },
  ];

  if (loading) {
    return (
      <div className="bg-card rounded-2xl p-6 border border-border flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with refresh */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 bg-foreground rounded-full" />
          <h2 className="font-semibold text-foreground">Patrimônio Total</h2>
        </div>
        <button
          onClick={fetchExchangeRates}
          disabled={updatingRates}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {updatingRates ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <RefreshCw className="w-3 h-3" />
          )}
          {lastUpdate && (
            <span>
              {lastUpdate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </button>
      </div>

      {/* Carousel */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {slides.map((slide, index) => {
            const Icon = slide.icon;
            return (
              <div key={slide.id} className="flex-[0_0_90%] min-w-0 pl-2 first:pl-0">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`bg-gradient-to-br ${slide.color} rounded-2xl p-5 text-white relative overflow-hidden`}
                >
                  {/* Background pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/20" />
                    <div className="absolute -left-10 -bottom-10 w-32 h-32 rounded-full bg-white/10" />
                  </div>

                  <div className="relative z-10">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-white/70 text-sm">{slide.subtitle}</p>
                        <h3 className="text-lg font-semibold">{slide.title}</h3>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>

                    {/* Value */}
                    <p className="text-3xl font-bold mb-2 tabular-nums">
                      {formatCurrency(slide.value)}
                    </p>

                    {/* Gain if exists */}
                    {slide.gain !== undefined && (
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`text-sm px-2 py-0.5 rounded-full ${slide.gain >= 0 ? "bg-white/20" : "bg-red-500/30"}`}>
                          {slide.gain >= 0 ? "+" : ""}{formatCurrency(slide.gain)}
                        </span>
                      </div>
                    )}

                    {/* Percent of total if exists */}
                    {slide.percent !== undefined && (
                      <div className="mb-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-white/70">% do patrimônio</span>
                          <span>{formatPercent(slide.percent)}</span>
                        </div>
                        <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-white rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${slide.percent}%` }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Details for total slide */}
                    {slide.details && (
                      <div className="space-y-2 pt-2 border-t border-white/20">
                        {slide.details.map((detail, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-white/70">{detail.label}</span>
                            <span className="font-medium">{formatCurrency(detail.value)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Categories for global slide */}
                    {slide.categories && slide.categories.length > 0 && (
                      <div className="space-y-1 pt-2 border-t border-white/20">
                        {slide.categories.slice(0, 3).map((cat, i) => {
                          const catColor = CATEGORY_COLORS[cat.category] || "#64748b";
                          return (
                            <div key={i} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-2 h-2 rounded-full" 
                                  style={{ backgroundColor: catColor }}
                                />
                                <span className="text-white/70 capitalize">{cat.category}</span>
                              </div>
                              <span className="font-medium">{formatCurrency(cat.total)}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* CTA for global slide */}
                    {slide.id === "global" && (
                      <button
                        onClick={() => navigate("/adicionar-patrimonio-global")}
                        className="mt-3 w-full bg-white/20 hover:bg-white/30 rounded-xl py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                      >
                        Gerenciar Patrimônio Global
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pagination dots */}
      <div className="flex justify-center gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => emblaApi?.scrollTo(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              selectedIndex === index ? "bg-primary w-4" : "bg-muted-foreground/30"
            }`}
          />
        ))}
      </div>

      {/* Currency rates info */}
      {Object.keys(exchangeRates).length > 0 && globalAssets.some(a => a.currency !== "BRL") && (
        <div className="bg-muted/50 rounded-xl p-3">
          <p className="text-xs text-muted-foreground text-center">
            💱 Cotações atualizadas automaticamente a cada 5 minutos
          </p>
        </div>
      )}
    </div>
  );
};

export default PatrimonioTotalCarousel;
