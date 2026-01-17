import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Shield, Zap, Eye, Lock } from "lucide-react";

const features = [
  {
    icon: <Eye className="w-8 h-8" />,
    title: "Visibilidade Total",
    description: "Veja todos os seus ativos em um único lugar, atualizados automaticamente.",
  },
  {
    icon: <Zap className="w-8 h-8" />,
    title: "Decisões Rápidas",
    description: "Insights inteligentes para agir no momento certo.",
  },
  {
    icon: <Shield className="w-8 h-8" />,
    title: "Proteção Ativa",
    description: "Alertas e estratégias para preservar seu patrimônio.",
  },
  {
    icon: <Lock className="w-8 h-8" />,
    title: "Segurança Máxima",
    description: "Seus dados criptografados com padrão bancário.",
  },
];

export const FeaturesSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);

  return (
    <section ref={containerRef} className="py-32 relative overflow-hidden">
      {/* Parallax background element */}
      <motion.div
        style={{ y }}
        className="absolute right-0 top-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,hsl(210_100%_60%_/_0.08)_0%,transparent_70%)]"
      />

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          {/* Left - Text */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
              Construído para
              <br />
              <span className="text-primary">quem pensa grande</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Cada funcionalidade foi desenhada para dar a você controle absoluto
              sobre seu futuro financeiro.
            </p>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Ativos Suportados", value: "500+" },
                { label: "Uptime", value: "99.9%" },
                { label: "Clientes", value: "10K+" },
                { label: "Processado", value: "R$50B+" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="glass rounded-2xl p-4"
                >
                  <p className="text-2xl font-bold text-primary mb-1">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right - Feature cards */}
          <div className="space-y-4">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                whileHover={{ x: 8 }}
                className="glass rounded-2xl p-6 flex items-start gap-5 group cursor-pointer"
              >
                <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
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
