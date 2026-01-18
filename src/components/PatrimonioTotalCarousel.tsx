import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Globe, RefreshCw, Loader2 } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { supabase } from "@/integrations/supabase/client";

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

const PatrimonioTotalCarousel = ({
  totalInvestimentos,
  totalGanhosInvestimentos,
  showValues,
}: PatrimonioTotalCarouselProps) => {
  const [globalAssets, setGlobalAssets] = useState<GlobalAsset[]>([]);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [updatingRates, setUpdatingRates] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: "start" });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  const onScroll = useCallback(() => {
    if (!emblaApi) return;
    const progress = emblaApi.scrollProgress();
    setScrollProgress(progress);
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    emblaApi.on("scroll", onScroll);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("scroll", onScroll);
    };
  }, [emblaApi, onSelect, onScroll]);

  // Fetch global assets
  const fetchGlobalAssets = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];

      const { data, error } = await supabase
        .from("global_assets")
        .select("*")
        .eq("user_id", session.user.id)
        .order("value_brl", { ascending: false });

      if (!error && data) {
        setGlobalAssets(data);
        return data;
      }
      return [];
    } catch (error) {
      console.error("Error fetching global assets:", error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Update global assets with new exchange rates
  const updateGlobalAssetsRates = useCallback(async (rates: Record<string, number>, assets: GlobalAsset[]) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || assets.length === 0) return;

    let hasUpdates = false;
    for (const asset of assets) {
      if (asset.currency !== "BRL" && rates[asset.currency]) {
        const newRate = rates[asset.currency];
        const newValueBrl = asset.original_value * newRate;
        
        // Only update if value changed significantly (> 0.01%)
        if (Math.abs(newValueBrl - asset.value_brl) / asset.value_brl > 0.0001) {
          await supabase
            .from("global_assets")
            .update({
              exchange_rate: newRate,
              value_brl: newValueBrl,
              updated_at: new Date().toISOString(),
            })
            .eq("id", asset.id);
          hasUpdates = true;
        }
      }
    }

    if (hasUpdates) {
      await fetchGlobalAssets();
    }
  }, [fetchGlobalAssets]);

  // Fetch exchange rates from API
  const fetchExchangeRates = useCallback(async (assets?: GlobalAsset[]) => {
    setUpdatingRates(true);
    try {
      const response = await fetch("https://api.exchangerate-api.com/v4/latest/BRL");
      if (response.ok) {
        const data = await response.json();
        const rates: Record<string, number> = { BRL: 1 };
        for (const [currency, rate] of Object.entries(data.rates)) {
          // Convert from "how many units of currency per 1 BRL" to "how many BRL per 1 unit of currency"
          rates[currency] = 1 / (rate as number);
        }
        setExchangeRates(rates);
        setLastUpdate(new Date());
        
        // Update assets with new rates
        const assetsToUpdate = assets || globalAssets;
        if (assetsToUpdate.length > 0) {
          await updateGlobalAssetsRates(rates, assetsToUpdate);
        }
      }
    } catch (error) {
      console.error("Error fetching exchange rates:", error);
    } finally {
      setUpdatingRates(false);
    }
  }, [globalAssets, updateGlobalAssetsRates]);

  // Initial load - fetch assets first, then rates
  useEffect(() => {
    const initializeData = async () => {
      const assets = await fetchGlobalAssets();
      if (assets.length > 0) {
        await fetchExchangeRates(assets);
      } else {
        setLoading(false);
      }
    };
    
    initializeData();
  }, []);

  // Auto-refresh rates every 5 minutes
  useEffect(() => {
    if (globalAssets.length === 0) return;
    
    const interval = setInterval(() => {
      fetchExchangeRates(globalAssets);
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [globalAssets]);

  // Calculate totals
  const totalPatrimonioGlobal = globalAssets.reduce((sum, asset) => sum + asset.value_brl, 0);
  const totalPatrimonioCompleto = totalInvestimentos + totalPatrimonioGlobal;

  // Calculate percentages for the donut chart
  const investimentosPercent = totalPatrimonioCompleto > 0 ? (totalInvestimentos / totalPatrimonioCompleto) * 100 : 50;
  const globalPercent = totalPatrimonioCompleto > 0 ? (totalPatrimonioGlobal / totalPatrimonioCompleto) * 100 : 50;

  const formatCurrency = (value: number) => {
    if (!showValues) return "R$ ••••••";
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const formatPercent = (value: number) => {
    if (!showValues) return "••%";
    return `${value.toFixed(0)}%`;
  };

  // Slides data
  const slides = useMemo(() => [
    {
      id: "investimentos",
      title: "INVESTIMENTOS",
      value: totalInvestimentos,
      gain: totalGanhosInvestimentos,
      percent: investimentosPercent,
      color: "hsl(var(--success))",
    },
    {
      id: "total",
      title: "PATRIMÔNIO TOTAL",
      value: totalPatrimonioCompleto,
      subtitle: `${globalAssets.length} bens globais`,
      percent: 100,
      color: "hsl(var(--primary))",
      breakdown: {
        investimentos: totalInvestimentos,
        global: totalPatrimonioGlobal,
      },
    },
  ], [totalInvestimentos, totalGanhosInvestimentos, totalPatrimonioCompleto, globalAssets.length, investimentosPercent, totalPatrimonioGlobal]);

  // Interpolate between slides for smooth animation
  const interpolatedData = useMemo(() => {
    if (slides.length === 0) {
      return {
        value: 0,
        gain: 0,
        title: "INVESTIMENTOS",
        subtitle: undefined,
        showGain: true,
      };
    }

    const floatIndex = scrollProgress * (slides.length - 1);
    const lowerIndex = Math.max(0, Math.min(Math.floor(floatIndex), slides.length - 1));
    const upperIndex = Math.min(lowerIndex + 1, slides.length - 1);
    const t = floatIndex - lowerIndex;

    const lerp = (a: number, b: number) => a + (b - a) * t;

    const lower = slides[lowerIndex];
    const upper = slides[upperIndex];

    if (!lower || !upper) {
      return {
        value: slides[0]?.value ?? 0,
        gain: slides[0]?.gain ?? 0,
        title: slides[0]?.title ?? "INVESTIMENTOS",
        subtitle: undefined,
        showGain: true,
      };
    }

    return {
      value: lerp(lower.value, upper.value),
      gain: lerp(lower.gain ?? 0, upper.gain ?? 0),
      title: selectedIndex === 0 ? slides[0].title : slides[1]?.title ?? slides[0].title,
      subtitle: selectedIndex === 1 ? slides[1]?.subtitle : undefined,
      showGain: selectedIndex === 0,
    };
  }, [scrollProgress, slides, selectedIndex]);

  // Calculate chart segments
  const circumference = 2 * Math.PI * 85;
  const gap = 8;
  
  const investimentosLength = circumference * (investimentosPercent / 100) - gap;
  const globalLength = circumference * (globalPercent / 100) - gap;

  const chartSegments = {
    investimentos: {
      dasharray: `${Math.max(0, investimentosLength)} ${circumference}`,
      offset: circumference * 0.25,
    },
    global: {
      dasharray: `${Math.max(0, globalLength)} ${circumference}`,
      offset: circumference * 0.25 - investimentosLength - gap,
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 bg-foreground rounded-full" />
          <h2 className="font-semibold text-foreground">Patrimônio Total</h2>
        </div>
        <button
          onClick={() => fetchExchangeRates()}
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

      {/* Swipeable Chart Section */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {slides.map((slide, index) => (
            <div key={slide.id} className="flex-[0_0_100%] min-w-0">
              <div className="relative flex items-center justify-center py-4">
                <div className="relative w-72 h-72">
                  {/* SVG Donut Chart */}
                  <svg viewBox="0 0 200 200" className="w-full h-full">
                    {/* Background circle */}
                    <circle cx="100" cy="100" r="85" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />

                    {/* Investimentos segment */}
                    <motion.circle
                      cx="100" cy="100" r="85" fill="none" 
                      stroke="hsl(var(--success))" 
                      strokeWidth="18"
                      strokeDasharray={chartSegments.investimentos.dasharray}
                      strokeDashoffset={chartSegments.investimentos.offset}
                      strokeLinecap="round"
                      style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
                    />

                    {/* Global segment */}
                    <motion.circle
                      cx="100" cy="100" r="85" fill="none" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth="18"
                      strokeDasharray={chartSegments.global.dasharray}
                      strokeDashoffset={chartSegments.global.offset}
                      strokeLinecap="round"
                      style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
                    />
                  </svg>

                  {/* Center content */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex flex-col items-center text-center px-4">
                      <span className="text-[11px] text-muted-foreground bg-muted/50 px-3 py-1 rounded-full mb-2 border border-border">
                        {interpolatedData.title}
                      </span>
                      <span className="text-2xl font-bold text-foreground tabular-nums">
                        {formatCurrency(interpolatedData.value)}
                      </span>
                      {interpolatedData.subtitle && (
                        <span className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          {interpolatedData.subtitle}
                        </span>
                      )}
                      {interpolatedData.showGain && (
                        <div className="mt-3">
                          <span className="text-[10px] text-muted-foreground">GANHO DE CAPITAL</span>
                          <div className="mt-1">
                            <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                              interpolatedData.gain >= 0
                                ? "text-success bg-success/10 border border-success/20"
                                : "text-destructive bg-destructive/10 border border-destructive/20"
                            }`}>
                              {interpolatedData.gain >= 0 ? "+" : ""}{formatCurrency(interpolatedData.gain)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination dots */}
      <div className="flex justify-center gap-3">
        {slides.map((_, index) => (
          <button key={index} onClick={() => emblaApi?.scrollTo(index)} className="p-1 relative">
            <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
            {selectedIndex === index && (
              <motion.div
                layoutId="patrimonioCarouselDot"
                className="absolute inset-1 w-2 h-2 rounded-full bg-primary"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Stats Row */}
      <div className="flex items-center justify-around py-4 border-y border-border">
        <div className="text-center">
          <div className="flex items-center gap-1 justify-center">
            <div className="w-2 h-2 rounded-full bg-success" />
            <span className="text-xs text-muted-foreground uppercase">Investimentos</span>
          </div>
          <p className="text-lg font-bold text-success tabular-nums">
            {formatPercent(investimentosPercent)}
          </p>
        </div>
        <div className="w-px h-10 bg-border" />
        <div className="text-center">
          <div className="flex items-center gap-1 justify-center">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-xs text-muted-foreground uppercase">Global</span>
          </div>
          <p className="text-lg font-bold text-primary tabular-nums">
            {formatPercent(globalPercent)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PatrimonioTotalCarousel;
