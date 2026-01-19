import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { ArrowUpRight, Activity, PieChart, TrendingUp } from "lucide-react";

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
      <div className="container mx-auto px-4 sm:px-6 pt-28 sm:pt-32 pb-16 sm:pb-20">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Left - Content */}
          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              {/* Live indicator */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 glass rounded-full mb-6 sm:mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-kadig-cyan opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-kadig-cyan"></span>
                </span>
                <span className="text-[10px] sm:text-xs text-kadig-cyan font-medium tracking-wide">
                  COTAÇÕES EM TEMPO REAL
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold leading-[1.1] mb-4 sm:mb-6">
                <span className="text-foreground">Todo seu</span>
                <br />
                <span className="text-primary glow-text">Patrimônio</span>
                <br />
                <span className="text-foreground">em um só lugar</span>
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground max-w-md mb-8 sm:mb-10 leading-relaxed">
                Ações, FIIs, Renda Fixa, Tesouro, Criptos e mais. 
                Consolide tudo, analise sua rentabilidade e tome decisões com a Bianca, sua consultora com IA.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="group px-6 sm:px-8 py-3 sm:py-4 bg-primary text-primary-foreground rounded-2xl font-medium flex items-center justify-center gap-2 glow-blue"
                >
                  Baixar Grátis
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 sm:px-8 py-3 sm:py-4 glass rounded-2xl font-medium text-foreground hover:bg-secondary/50 transition-colors"
                >
                  Ver Funcionalidades
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

              <div className="relative glass-strong rounded-3xl p-6 sm:p-8 glow-blue">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-kadig-cyan pulse-ring relative" />
                    <span className="text-xs sm:text-sm text-muted-foreground">Patrimônio Total</span>
                  </div>
                  <Activity className="w-4 sm:w-5 h-4 sm:h-5 text-primary animate-pulse" />
                </div>

                <motion.div
                  key={value}
                  initial={{ opacity: 0.7, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-3xl sm:text-5xl md:text-6xl font-bold text-foreground tracking-tight mb-2"
                >
                  R$ {value.toLocaleString("pt-BR")}
                </motion.div>

                <div className="flex items-center gap-2 text-kadig-cyan">
                  <ArrowUpRight className="w-4 h-4" />
                  <span className="text-xs sm:text-sm font-medium">+127% do CDI este mês</span>
                </div>

                {/* Mini chart visualization */}
                <div className="mt-6 sm:mt-8 flex items-end gap-1 h-12 sm:h-16">
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
                className="absolute -top-2 sm:-top-4 -right-2 sm:-right-4 glass rounded-xl sm:rounded-2xl p-2 sm:p-4"
              >
                <div className="flex items-center gap-1 sm:gap-2 mb-1">
                  <PieChart className="w-3 sm:w-4 h-3 sm:h-4 text-primary" />
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Carteiras</p>
                </div>
                <p className="text-sm sm:text-lg font-bold text-foreground">5 ativas</p>
              </motion.div>

              <motion.div
                animate={{ y: [5, -5, 5] }}
                transition={{ duration: 5, repeat: Infinity }}
                className="absolute -bottom-2 sm:-bottom-4 -left-2 sm:-left-4 glass rounded-xl sm:rounded-2xl p-2 sm:p-4"
              >
                <div className="flex items-center gap-1 sm:gap-2 mb-1">
                  <TrendingUp className="w-3 sm:w-4 h-3 sm:h-4 text-kadig-cyan" />
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Ativos</p>
                </div>
                <p className="text-sm sm:text-lg font-bold text-kadig-cyan">47 ativos</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
