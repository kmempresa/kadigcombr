import { motion } from "framer-motion";
import {
  Crown,
  Sparkles,
  TrendingUp,
  Store,
  Bot,
  Wallet,
  PieChart,
  LineChart,
  BarChart3,
  Globe,
  Target,
  MessageSquare,
  Zap,
  Lock,
  ArrowRight,
  Star
} from "lucide-react";
import biancaConsultora from "@/assets/bianca-consultora.png";

interface PaywallFeature {
  icon: React.ElementType;
  title: string;
  description: string;
}

interface PremiumPaywallProps {
  type: "bianca" | "trade" | "mercado";
  onSubscribe: () => void;
}

const paywallConfig = {
  bianca: {
    icon: null,
    title: "Bianca Consultora",
    subtitle: "Sua Consultora Financeira Pessoal",
    description: "Análises personalizadas e tomada de decisão estratégica",
    accentColor: "from-kadig-blue to-kadig-cyan",
    glowColor: "shadow-kadig-blue/30",
    features: [
      { icon: Target, title: "Tomada de Decisão", description: "Estratégias assertivas" },
      { icon: TrendingUp, title: "Análise de Mercado", description: "Visão completa do cenário" },
      { icon: LineChart, title: "Ações Futuras", description: "Projeções e tendências" },
      { icon: MessageSquare, title: "Consultoria 24/7", description: "Sempre disponível" },
    ] as PaywallFeature[],
  },
  trade: {
    icon: TrendingUp,
    title: "Trade",
    subtitle: "Gestão Completa de Ativos",
    description: "Gerencie todos os seus investimentos",
    accentColor: "from-kadig-blue to-kadig-cyan",
    glowColor: "shadow-kadig-blue/30",
    features: [
      { icon: Wallet, title: "Gestão de Ativos", description: "Ações, FIIs, Criptos" },
      { icon: PieChart, title: "Análise de Carteira", description: "Distribuição detalhada" },
      { icon: LineChart, title: "Histórico Completo", description: "Evolução patrimonial" },
      { icon: TrendingUp, title: "Rentabilidade", description: "Compare com CDI" },
    ] as PaywallFeature[],
  },
  mercado: {
    icon: Store,
    title: "Mercado",
    subtitle: "Dados em Tempo Real",
    description: "Acompanhe o mercado financeiro ao vivo",
    accentColor: "from-kadig-blue to-kadig-cyan",
    glowColor: "shadow-kadig-blue/30",
    features: [
      { icon: BarChart3, title: "Cotações em Tempo Real", description: "Preços ao vivo" },
      { icon: TrendingUp, title: "Maiores Altas/Baixas", description: "Oportunidades" },
      { icon: Globe, title: "Índices Globais", description: "Ibovespa, S&P 500" },
      { icon: LineChart, title: "Gráficos Históricos", description: "Análise técnica" },
    ] as PaywallFeature[],
  },
};

const PremiumPaywall = ({ type, onSubscribe }: PremiumPaywallProps) => {
  const config = paywallConfig[type];
  const Icon = config.icon;

  return (
    <div className="flex-1 overflow-y-auto pb-40 safe-area-inset-bottom relative bg-background">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.015] dark:opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--foreground) / 0.1) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground) / 0.1) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      {/* Content - more compact */}
      <div className="relative z-10 px-4 pt-6">
        {/* Premium Badge */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center mb-5"
        >
          <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 backdrop-blur-xl border border-yellow-500/30 rounded-full px-4 py-2 shadow-lg shadow-yellow-500/10">
            <Crown className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />
            <span className="text-xs font-bold text-yellow-600 dark:text-yellow-400 tracking-wide">RECURSO PREMIUM</span>
          </div>
        </motion.div>

        {/* Icon/Avatar with Glow Effect - Smaller */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          className="flex justify-center mb-5"
        >
          <div className="relative">
            <div className={`absolute -inset-2 bg-gradient-to-br ${config.accentColor} rounded-2xl opacity-25 dark:opacity-35 blur-lg`} />

            {type === "bianca" ? (
              <div className="relative w-20 h-20 rounded-2xl overflow-hidden ring-2 ring-foreground/10 shadow-xl">
                <img src={biancaConsultora} alt="Bianca Consultora" className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
            ) : (
              <div className={`relative w-20 h-20 rounded-2xl bg-gradient-to-br ${config.accentColor} flex items-center justify-center shadow-xl ring-2 ring-foreground/10`}>
                {Icon && <Icon className="w-10 h-10 text-white" />}
              </div>
            )}
            
            {/* Sparkle Badge */}
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className={`absolute -bottom-1 -right-1 w-8 h-8 bg-gradient-to-br ${config.accentColor} rounded-lg flex items-center justify-center shadow-lg ring-2 ring-background`}
            >
              <Sparkles className="w-4 h-4 text-white" />
            </motion.div>
          </div>
        </motion.div>

        {/* Title & Description - Compact */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-6"
        >
          <h1 className="text-2xl font-bold text-foreground mb-1">{config.title}</h1>
          <p className={`text-sm font-semibold bg-gradient-to-r ${config.accentColor} bg-clip-text text-transparent mb-2`}>
            {config.subtitle}
          </p>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">{config.description}</p>
        </motion.div>

        {/* Features Grid - Compact */}
        <div className="mb-6">
          <motion.p 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3"
          >
            O que você desbloqueia
          </motion.p>

          <div className="grid grid-cols-2 gap-2">
            {config.features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                className="bg-card/50 backdrop-blur-xl border border-border rounded-xl p-3"
              >
                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${config.accentColor} flex items-center justify-center mb-2 shadow-md ${config.glowColor}`}>
                  <feature.icon className="w-4 h-4 text-white" />
                </div>
                <h4 className="font-bold text-foreground text-xs mb-0.5">{feature.title}</h4>
                <p className="text-[10px] text-muted-foreground leading-tight">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Price Card - Compact */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="relative mb-6"
        >
          {/* Card Glow */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-kadig-blue to-kadig-cyan rounded-2xl opacity-15 dark:opacity-20 blur-md" />
          
          <div className="relative bg-card/80 backdrop-blur-xl border border-border rounded-2xl p-4 overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-xl" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-center gap-1.5 mb-3">
                <Star className="w-3 h-3 text-yellow-500 dark:text-yellow-400 fill-yellow-500 dark:fill-yellow-400" />
                <span className="text-[10px] font-bold text-yellow-600 dark:text-yellow-400 uppercase tracking-wide">Oferta Especial</span>
                <Star className="w-3 h-3 text-yellow-500 dark:text-yellow-400 fill-yellow-500 dark:fill-yellow-400" />
              </div>
              
              <div className="flex items-baseline justify-center gap-0.5 mb-3">
                <span className="text-3xl font-black text-foreground">R$ 39</span>
                <span className="text-xl font-black text-foreground">,90</span>
                <span className="text-muted-foreground text-sm">/mês</span>
              </div>
              
              <div className="flex justify-center gap-4 mb-4 text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <div className="w-4 h-4 rounded-full bg-success/20 flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  Cancele quando quiser
                </span>
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <div className="w-4 h-4 rounded-full bg-success/20 flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  7 dias de garantia
                </span>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onSubscribe}
                className="w-full bg-gradient-to-r from-kadig-blue to-kadig-cyan text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all"
              >
                <Lock className="w-4 h-4" />
                Desbloquear Agora
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Other Premium Features - Compact */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-card/30 backdrop-blur-xl border border-border rounded-xl p-4"
        >
          <h4 className="font-bold text-foreground text-sm mb-3 flex items-center gap-1.5">
            <Crown className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />
            Também incluído no Premium
          </h4>
          <div className="flex flex-wrap gap-2">
            {type !== "bianca" && (
              <div className="flex items-center gap-2 bg-card/50 rounded-lg px-3 py-2">
                <div className="w-7 h-7 rounded-lg overflow-hidden shadow-md">
                  <img src={biancaConsultora} alt="Bianca" className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="text-foreground font-semibold text-xs">Bianca Consultora</p>
                </div>
              </div>
            )}
            {type !== "trade" && (
              <div className="flex items-center gap-2 bg-card/50 rounded-lg px-3 py-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-kadig-blue to-kadig-cyan flex items-center justify-center shadow-md">
                  <TrendingUp className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <p className="text-foreground font-semibold text-xs">Trade</p>
                </div>
              </div>
            )}
            {type !== "mercado" && (
              <div className="flex items-center gap-2 bg-card/50 rounded-lg px-3 py-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-kadig-blue to-kadig-cyan flex items-center justify-center shadow-md">
                  <Store className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <p className="text-foreground font-semibold text-xs">Mercado</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PremiumPaywall;
