import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { 
  PieChart, 
  TrendingUp, 
  Wallet,
  Calculator,
} from "lucide-react";

const features = [
  {
    icon: <Wallet className="w-6 sm:w-8 h-6 sm:h-8" />,
    title: "Múltiplas Carteiras",
    description: "Organize seus investimentos em carteiras separadas.",
  },
  {
    icon: <PieChart className="w-6 sm:w-8 h-6 sm:h-8" />,
    title: "Distribuição Visual",
    description: "Veja a composição da sua carteira com gráficos interativos.",
  },
  {
    icon: <TrendingUp className="w-6 sm:w-8 h-6 sm:h-8" />,
    title: "Rentabilidade vs CDI",
    description: "Compare sua performance com CDI e IPCA.",
  },
  {
    icon: <Calculator className="w-6 sm:w-8 h-6 sm:h-8" />,
    title: "Projeção 12 Meses",
    description: "Simule o futuro do seu patrimônio.",
  },
];

const analysisTools = [
  { name: "Distribuição", color: "from-orange-400 to-amber-500" },
  { name: "Evolução", color: "from-rose-400 to-pink-500" },
  { name: "Rentabilidade Real", color: "from-emerald-400 to-green-500" },
  { name: "Proventos", color: "from-violet-400 to-purple-500" },
  { name: "Ganho de Capital", color: "from-cyan-400 to-teal-500" },
  { name: "Cobertura FGC", color: "from-blue-400 to-indigo-500" },
  { name: "Risco x Retorno", color: "from-amber-400 to-orange-500" },
  { name: "Comparador", color: "from-pink-400 to-rose-500" },
];

export const FeaturesSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);

  return (
    <section ref={containerRef} className="py-16 sm:py-32 relative overflow-hidden">
      {/* Parallax background element */}
      <motion.div
        style={{ y }}
        className="absolute right-0 top-1/2 -translate-y-1/2 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] rounded-full bg-[radial-gradient(circle,hsl(210_100%_60%_/_0.08)_0%,transparent_70%)]"
      />

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-20 items-center">
          {/* Left - Text */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4 sm:mb-6 leading-tight">
              Mais de 10 análises
              <br />
              <span className="text-primary">na palma da mão</span>
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8 leading-relaxed">
              Distribuição, rentabilidade real, proventos, 
              risco x retorno e muito mais. Tudo automático.
            </p>

            {/* Analysis tools grid */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-6 sm:mb-8">
              {analysisTools.map((tool, i) => (
                <motion.div
                  key={tool.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-2 sm:gap-3 glass rounded-lg sm:rounded-xl p-2 sm:p-3"
                >
                  <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${tool.color} shrink-0`} />
                  <p className="text-xs sm:text-sm text-foreground font-medium truncate">{tool.name}</p>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              {[
                { label: "Tipos de Ativos", value: "15+" },
                { label: "Cotações", value: "Tempo Real" },
                { label: "Análises", value: "10+" },
                { label: "Criptografia", value: "256-bit" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="glass rounded-xl sm:rounded-2xl p-3 sm:p-4"
                >
                  <p className="text-xl sm:text-2xl font-bold text-primary mb-0.5 sm:mb-1">{stat.value}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right - Feature cards */}
          <div className="space-y-3 sm:space-y-4">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                whileHover={{ x: 8 }}
                className="glass rounded-xl sm:rounded-2xl p-4 sm:p-6 flex items-start gap-3 sm:gap-5 group cursor-pointer"
              >
                <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-secondary flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                  {feature.icon}
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-foreground mb-0.5 sm:mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
