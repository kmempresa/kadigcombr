import { motion } from "framer-motion";
import { AnimatedCounter } from "./AnimatedCounter";
import { TrendingUp, Shield, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const HeroSection = () => {
  return (
    <section className="min-h-screen pt-24 pb-16 bg-gradient-hero relative overflow-hidden">
      {/* Subtle grid background */}
      <div className="absolute inset-0 opacity-30">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--kadig-slate) / 0.15) 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-kadig-success-light text-kadig-success text-sm font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-kadig-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-kadig-success"></span>
              </span>
              Patrimônio atualizado em tempo real
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground tracking-tight mb-6"
          >
            Gestão patrimonial
            <br />
            <span className="text-kadig-navy">inteligente</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto"
          >
            Centralize, monitore e otimize todo seu patrimônio em uma única
            plataforma com visibilidade total e insights em tempo real.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-20"
          >
            <Button
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-kadig-navy-light shadow-lg hover:shadow-glow transition-all px-8"
            >
              Começar Agora
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-border hover:bg-secondary transition-all"
            >
              Ver Demo
            </Button>
          </motion.div>

          {/* Live Stats */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <StatCard
              icon={<TrendingUp className="w-5 h-5" />}
              label="Patrimônio Total"
              value={2847650}
              prefix="R$ "
              trend="+12.4%"
              delay={0.6}
            />
            <StatCard
              icon={<BarChart3 className="w-5 h-5" />}
              label="Ativos Monitorados"
              value={156}
              trend="+8"
              delay={0.7}
            />
            <StatCard
              icon={<Shield className="w-5 h-5" />}
              label="Rentabilidade Anual"
              value={18.7}
              suffix="%"
              trend="+2.3%"
              delay={0.8}
              isPercentage
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  trend: string;
  delay: number;
  isPercentage?: boolean;
}

const StatCard = ({
  icon,
  label,
  value,
  prefix = "",
  suffix = "",
  trend,
  delay,
  isPercentage = false,
}: StatCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="bg-card rounded-2xl p-6 shadow-lg border border-border hover:shadow-glow transition-all duration-300"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-secondary text-foreground">{icon}</div>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-end justify-between">
        <div className="text-2xl md:text-3xl font-bold text-foreground">
          {isPercentage ? (
            <span>
              {prefix}
              {value.toFixed(1)}
              {suffix}
            </span>
          ) : (
            <AnimatedCounter value={value} prefix={prefix} suffix={suffix} />
          )}
        </div>
        <span className="text-sm font-medium text-kadig-success flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          {trend}
        </span>
      </div>
    </motion.div>
  );
};
