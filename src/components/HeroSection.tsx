import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { ArrowUpRight, Activity } from "lucide-react";

export const HeroSection = () => {
  const [value, setValue] = useState(2847650);

  useEffect(() => {
    const interval = setInterval(() => {
      setValue((prev) => prev + Math.floor((Math.random() - 0.45) * 150));
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="min-h-screen relative flex items-center">
      <div className="container mx-auto px-6 pt-32 pb-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left - Content */}
          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              {/* Live AI indicator */}
              <div className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-kadig-cyan opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-kadig-cyan"></span>
                </span>
                <span className="text-xs text-kadig-cyan font-medium tracking-wide">
                  AGENTE IA ATIVO • ANALISANDO MERCADO
                </span>
              </div>

              <h1 className="text-5xl md:text-7xl font-bold leading-[1.1] mb-6">
                <span className="text-foreground">IA que</span>
                <br />
                <span className="text-primary glow-text">Prevê</span>
                <span className="text-foreground"> seus</span>
                <br />
                <span className="text-foreground">Investimentos</span>
              </h1>

              <p className="text-lg text-muted-foreground max-w-md mb-10 leading-relaxed">
                Um agente de inteligência artificial que analisa o mercado em tempo real 
                e te ajuda a fazer as melhores escolhas de investimento.
              </p>

              <div className="flex flex-wrap gap-4">
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="group px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-medium flex items-center gap-2 glow-blue"
                >
                  Começar Agora
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-8 py-4 glass rounded-2xl font-medium text-foreground hover:bg-secondary/50 transition-colors"
                >
                  Ver Demo
                </motion.button>
              </div>
            </motion.div>
          </div>

          {/* Right - Interactive Display */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="relative"
          >
            {/* Main value display */}
            <div className="relative">
              {/* Glow behind */}
              <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full" />

              <div className="relative glass-strong rounded-3xl p-8 glow-blue">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-kadig-cyan pulse-ring relative" />
                    <span className="text-sm text-muted-foreground">Patrimônio Total</span>
                  </div>
                  <Activity className="w-5 h-5 text-primary animate-pulse" />
                </div>

                <motion.div
                  key={value}
                  initial={{ opacity: 0.7, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-5xl md:text-6xl font-bold text-foreground tracking-tight mb-2"
                >
                  R$ {value.toLocaleString("pt-BR")}
                </motion.div>

                <div className="flex items-center gap-2 text-kadig-cyan">
                  <ArrowUpRight className="w-4 h-4" />
                  <span className="text-sm font-medium">+12.4% este mês</span>
                </div>

                {/* Mini chart visualization */}
                <div className="mt-8 flex items-end gap-1 h-16">
                  {[40, 55, 45, 60, 50, 70, 65, 80, 75, 85, 78, 90].map((h, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      transition={{ delay: 0.5 + i * 0.05, duration: 0.5 }}
                      className="flex-1 rounded-full bg-gradient-to-t from-primary/30 to-primary"
                    />
                  ))}
                </div>
              </div>

              {/* Floating stat cards */}
              <motion.div
                animate={{ y: [-5, 5, -5] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -top-4 -right-4 glass rounded-2xl p-4"
              >
                <p className="text-xs text-muted-foreground mb-1">Investimentos</p>
                <p className="text-lg font-bold text-foreground">R$ 1.8M</p>
              </motion.div>

              <motion.div
                animate={{ y: [5, -5, 5] }}
                transition={{ duration: 5, repeat: Infinity }}
                className="absolute -bottom-4 -left-4 glass rounded-2xl p-4"
              >
                <p className="text-xs text-muted-foreground mb-1">Ativos</p>
                <p className="text-lg font-bold text-kadig-cyan">156</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
