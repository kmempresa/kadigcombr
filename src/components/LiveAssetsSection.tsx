import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, RefreshCw, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Stock {
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
}

export const LiveAssetsSection = () => {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchStocks = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('kadig-index', {
        body: { type: 'list', page: 1, limit: 12 }
      });

      if (error) throw error;
      
      if (data?.stocks) {
        setStocks(data.stocks);
        setLastUpdate(new Date());
      }
    } catch (err) {
      console.error('Error fetching stocks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocks();
    const interval = setInterval(fetchStocks, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-emerald-500";
    if (score >= 50) return "text-amber-500";
    return "text-red-500";
  };

  const getScoreBg = (score: number) => {
    if (score >= 70) return "bg-emerald-500/20 border-emerald-500/30";
    if (score >= 50) return "bg-amber-500/20 border-amber-500/30";
    return "bg-red-500/20 border-red-500/30";
  };

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
      
      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 rounded-full px-4 py-2 mb-6">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-emerald-400 text-sm font-medium">Cotações em Tempo Real</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Acompanhe o{" "}
            <span className="text-primary">Índice Kadig</span>
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
            Nosso algoritmo proprietário analisa fundamentos, dividendos e valuation 
            para calcular um score único de cada ativo.
          </p>

          {lastUpdate && (
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}</span>
            </div>
          )}
        </motion.div>

        {/* Stocks Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="glass rounded-2xl p-4 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-muted" />
                  <div className="flex-1">
                    <div className="h-4 w-16 bg-muted rounded mb-1" />
                    <div className="h-3 w-24 bg-muted rounded" />
                  </div>
                </div>
                <div className="h-6 w-20 bg-muted rounded mb-2" />
                <div className="h-4 w-16 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {stocks.map((stock, index) => (
              <motion.div
                key={stock.ticker}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -4, scale: 1.02 }}
                className="glass rounded-2xl p-4 cursor-pointer group hover:border-primary/30 transition-all"
              >
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-muted overflow-hidden flex items-center justify-center shrink-0">
                    {stock.logoUrl ? (
                      <img 
                        src={stock.logoUrl} 
                        alt={stock.ticker}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <span className="text-xs font-bold text-muted-foreground">
                        {stock.ticker.slice(0, 2)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-foreground text-sm">{stock.ticker}</p>
                    <p className="text-xs text-muted-foreground truncate">{stock.name}</p>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-3">
                  <p className="text-xl font-bold text-foreground">
                    R$ {stock.regularMarketPrice.toFixed(2)}
                  </p>
                  <div className={`flex items-center gap-1 ${
                    stock.regularMarketChangePercent >= 0 ? 'text-emerald-500' : 'text-red-500'
                  }`}>
                    {stock.regularMarketChangePercent >= 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    <span className="text-sm font-medium">
                      {stock.regularMarketChangePercent >= 0 ? '+' : ''}
                      {stock.regularMarketChangePercent.toFixed(2)}%
                    </span>
                  </div>
                </div>

                {/* Kadig Score */}
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${getScoreBg(stock.scores.kadig)}`}>
                  <Zap className={`w-3 h-3 ${getScoreColor(stock.scores.kadig)}`} />
                  <span className={`text-xs font-bold ${getScoreColor(stock.scores.kadig)}`}>
                    Score {stock.scores.kadig}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <p className="text-muted-foreground mb-4">
            Acesse análises completas de mais de 35 ações no app
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-medium inline-flex items-center gap-2"
          >
            Ver Índice Completo no App
            <TrendingUp className="w-4 h-4" />
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};
