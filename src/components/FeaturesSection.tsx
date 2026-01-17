import { motion } from "framer-motion";
import {
  LineChart,
  Shield,
  Zap,
  Globe,
  Lock,
  BarChart2,
} from "lucide-react";

const features = [
  {
    icon: <LineChart className="w-6 h-6" />,
    title: "Análises em Tempo Real",
    description:
      "Acompanhe a evolução do seu patrimônio com atualizações instantâneas e alertas personalizados.",
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: "Proteção Patrimonial",
    description:
      "Estratégias avançadas para proteger e preservar seu patrimônio ao longo das gerações.",
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Automação Inteligente",
    description:
      "Rebalanceamento automático e otimização fiscal com inteligência artificial.",
  },
  {
    icon: <Globe className="w-6 h-6" />,
    title: "Visão Global",
    description:
      "Consolide ativos nacionais e internacionais em uma única visão integrada.",
  },
  {
    icon: <Lock className="w-6 h-6" />,
    title: "Segurança Máxima",
    description:
      "Criptografia de ponta e autenticação multi-fator para proteger seus dados.",
  },
  {
    icon: <BarChart2 className="w-6 h-6" />,
    title: "Relatórios Avançados",
    description:
      "Relatórios personalizados para tomada de decisão e planejamento tributário.",
  },
];

export const FeaturesSection = () => {
  return (
    <section className="py-24 bg-secondary/50" id="sobre">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Tudo que você precisa
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Ferramentas poderosas para uma gestão patrimonial completa
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -4 }}
              className="bg-card rounded-2xl p-6 shadow-sm border border-border hover:shadow-md hover:border-kadig-slate/30 transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors mb-4">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
