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
  Check,
  ArrowRight
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
    icon: null, // Uses image
    title: "Bianca IA",
    subtitle: "Sua Consultora Financeira Pessoal",
    description: "Análises personalizadas com inteligência artificial que conhece sua carteira",
    gradient: "from-emerald-500 to-teal-500",
    iconBg: "bg-gradient-to-br from-emerald-500 to-teal-500",
    features: [
      { icon: Bot, title: "Consultora 24/7", description: "Disponível sempre que precisar" },
      { icon: Target, title: "Recomendações Personalizadas", description: "Baseadas no seu perfil de investidor" },
      { icon: MessageSquare, title: "Chat Ilimitado", description: "Tire todas as suas dúvidas" },
      { icon: Zap, title: "Análises em Tempo Real", description: "Insights sobre sua carteira" },
    ] as PaywallFeature[],
  },
  trade: {
    icon: TrendingUp,
    title: "Trade",
    subtitle: "Gestão Completa de Ativos",
    description: "Acompanhe e gerencie todos os seus investimentos em um só lugar",
    gradient: "from-kadig-blue to-kadig-cyan",
    iconBg: "bg-gradient-to-br from-kadig-blue to-kadig-cyan",
    features: [
      { icon: Wallet, title: "Gestão de Ativos", description: "Ações, FIIs, Criptos e mais" },
      { icon: PieChart, title: "Análise de Carteira", description: "Distribuição e alocação" },
      { icon: LineChart, title: "Histórico Completo", description: "Evolução patrimonial detalhada" },
      { icon: TrendingUp, title: "Rentabilidade", description: "Compare com CDI e IPCA" },
    ] as PaywallFeature[],
  },
  mercado: {
    icon: Store,
    title: "Mercado",
    subtitle: "Dados em Tempo Real",
    description: "Acompanhe o mercado financeiro com cotações atualizadas ao vivo",
    gradient: "from-violet-500 to-purple-600",
    iconBg: "bg-gradient-to-br from-violet-500 to-purple-600",
    features: [
      { icon: BarChart3, title: "Cotações em Tempo Real", description: "Preços atualizados ao vivo" },
      { icon: TrendingUp, title: "Maiores Altas/Baixas", description: "Oportunidades do mercado" },
      { icon: Globe, title: "Índices Globais", description: "Ibovespa, S&P 500, Nasdaq" },
      { icon: LineChart, title: "Gráficos Históricos", description: "Análise técnica visual" },
    ] as PaywallFeature[],
  },
};

const PremiumPaywall = ({ type, onSubscribe }: PremiumPaywallProps) => {
  const config = paywallConfig[type];
  const Icon = config.icon;

  return (
    <div className="flex-1 flex flex-col overflow-y-auto pb-24">
      {/* Hero Section with Glassmorphism */}
      <div className="relative px-5 pt-8 pb-16">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-br ${config.gradient} opacity-20 rounded-full blur-3xl`} />
          <div className="absolute top-20 right-0 w-64 h-64 bg-kadig-cyan/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          {/* Premium Badge */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center mb-6"
          >
            <div className="flex items-center gap-2 bg-yellow-500/20 backdrop-blur-sm border border-yellow-500/30 rounded-full px-4 py-2">
              <Crown className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-semibold text-yellow-400">RECURSO PREMIUM</span>
            </div>
          </motion.div>

          {/* Icon/Avatar */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="flex justify-center mb-6"
          >
            {type === "bianca" ? (
              <div className="relative">
                <div className="w-28 h-28 rounded-3xl overflow-hidden shadow-2xl ring-4 ring-emerald-500/30">
                  <img src={biancaConsultora} alt="Bianca" className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
              </div>
            ) : (
              <div className={`w-28 h-28 rounded-3xl ${config.iconBg} flex items-center justify-center shadow-2xl`}>
                {Icon && <Icon className="w-14 h-14 text-white" />}
              </div>
            )}
          </motion.div>

          {/* Title & Description */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <h1 className="text-3xl font-bold text-foreground mb-2">{config.title}</h1>
            <p className="text-lg font-medium text-primary mb-3">{config.subtitle}</p>
            <p className="text-muted-foreground max-w-sm mx-auto">{config.description}</p>
          </motion.div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="px-5 space-y-3">
        <motion.h3 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4"
        >
          O que você desbloqueia
        </motion.h3>

        {config.features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 + index * 0.1 }}
            className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-4 flex items-center gap-4"
          >
            <div className={`w-12 h-12 rounded-xl ${config.iconBg} flex items-center justify-center flex-shrink-0`}>
              <feature.icon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-foreground">{feature.title}</h4>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
            <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          </motion.div>
        ))}
      </div>

      {/* Price Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="px-5 mt-8"
      >
        <div className="bg-gradient-to-br from-card to-muted/30 border border-border rounded-2xl p-5 text-center">
          <p className="text-sm text-muted-foreground mb-2">Acesso completo por apenas</p>
          <div className="flex items-baseline justify-center gap-1 mb-4">
            <span className="text-4xl font-bold text-foreground">R$ 39</span>
            <span className="text-2xl font-bold text-foreground">,90</span>
            <span className="text-muted-foreground">/mês</span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-3 mb-5">
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Check className="w-4 h-4 text-emerald-500" />
              Cancele quando quiser
            </span>
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Check className="w-4 h-4 text-emerald-500" />
              7 dias de garantia
            </span>
          </div>

          <button
            onClick={onSubscribe}
            className="w-full bg-gradient-to-r from-kadig-blue to-kadig-cyan text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-kadig-blue/30 transition-all"
          >
            <Sparkles className="w-5 h-5" />
            Desbloquear Agora
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </motion.div>

      {/* All Premium Benefits */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="px-5 mt-6 mb-8"
      >
        <div className="bg-muted/30 rounded-2xl p-5">
          <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-500" />
            Também incluído no Premium
          </h4>
          <div className="grid grid-cols-1 gap-3">
            {type !== "bianca" && (
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <span className="text-foreground">Bianca IA - Consultora Pessoal</span>
              </div>
            )}
            {type !== "trade" && (
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-kadig-blue to-kadig-cyan flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <span className="text-foreground">Trade - Gestão de Ativos</span>
              </div>
            )}
            {type !== "mercado" && (
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <Store className="w-4 h-4 text-white" />
                </div>
                <span className="text-foreground">Mercado - Cotações em Tempo Real</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PremiumPaywall;
