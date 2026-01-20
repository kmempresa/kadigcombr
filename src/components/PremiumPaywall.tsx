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
    title: "Bianca IA",
    subtitle: "Sua Consultora Financeira Pessoal",
    description: "Análises personalizadas com inteligência artificial",
    accentColor: "from-emerald-500 to-teal-400",
    glowColor: "shadow-emerald-500/30",
    features: [
      { icon: Bot, title: "Consultora 24/7", description: "Sempre disponível" },
      { icon: Target, title: "Recomendações", description: "Baseadas no seu perfil" },
      { icon: MessageSquare, title: "Chat Ilimitado", description: "Tire suas dúvidas" },
      { icon: Zap, title: "Análises em Tempo Real", description: "Insights da carteira" },
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
    accentColor: "from-violet-500 to-purple-400",
    glowColor: "shadow-violet-500/30",
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
    <div className="flex-1 flex flex-col bg-background overflow-y-auto pb-24 relative">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient Orbs */}
        <div className={`absolute top-20 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-gradient-to-br ${config.accentColor} opacity-10 dark:opacity-15 rounded-full blur-[120px]`} />
        <div className="absolute bottom-40 right-0 w-80 h-80 bg-kadig-cyan/5 dark:bg-kadig-cyan/10 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-kadig-blue/5 dark:bg-kadig-blue/10 rounded-full blur-[80px]" />
        
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--foreground) / 0.1) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground) / 0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 px-5 pt-10">
        {/* Premium Badge */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center mb-8"
        >
          <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 backdrop-blur-xl border border-yellow-500/30 rounded-full px-5 py-2.5 shadow-lg shadow-yellow-500/10">
            <Crown className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
            <span className="text-sm font-bold text-yellow-600 dark:text-yellow-400 tracking-wide">RECURSO PREMIUM</span>
          </div>
        </motion.div>

        {/* Icon/Avatar with Glow Effect */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          className="flex justify-center mb-8"
        >
          <div className="relative">
            {/* Glow Ring */}
            <div className={`absolute -inset-3 bg-gradient-to-br ${config.accentColor} rounded-[2rem] opacity-30 dark:opacity-40 blur-xl`} />
            
            {type === "bianca" ? (
              <div className="relative w-32 h-32 rounded-[1.5rem] overflow-hidden ring-2 ring-foreground/10 shadow-2xl">
                <img src={biancaConsultora} alt="Bianca" className="w-full h-full object-cover" />
                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </div>
            ) : (
              <div className={`relative w-32 h-32 rounded-[1.5rem] bg-gradient-to-br ${config.accentColor} flex items-center justify-center shadow-2xl ring-2 ring-foreground/10`}>
                {Icon && <Icon className="w-16 h-16 text-white" />}
              </div>
            )}
            
            {/* Sparkle Badge */}
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className={`absolute -bottom-2 -right-2 w-12 h-12 bg-gradient-to-br ${config.accentColor} rounded-xl flex items-center justify-center shadow-xl ring-2 ring-background`}
            >
              <Sparkles className="w-6 h-6 text-white" />
            </motion.div>
          </div>
        </motion.div>

        {/* Title & Description */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-10"
        >
          <h1 className="text-4xl font-bold text-foreground mb-3">{config.title}</h1>
          <p className={`text-lg font-semibold bg-gradient-to-r ${config.accentColor} bg-clip-text text-transparent mb-3`}>
            {config.subtitle}
          </p>
          <p className="text-muted-foreground max-w-sm mx-auto">{config.description}</p>
        </motion.div>

        {/* Features Grid */}
        <div className="mb-10">
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-5"
          >
            O que você desbloqueia
          </motion.p>

          <div className="grid grid-cols-2 gap-3">
            {config.features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + index * 0.08 }}
                className="bg-card/50 backdrop-blur-xl border border-border rounded-2xl p-4 hover:bg-card/80 transition-all hover:border-border/80"
              >
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${config.accentColor} flex items-center justify-center mb-3 shadow-lg ${config.glowColor}`}>
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                <h4 className="font-bold text-foreground text-sm mb-1">{feature.title}</h4>
                <p className="text-xs text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Price Card with Glassmorphism */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="relative mb-8"
        >
          {/* Card Glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-kadig-blue to-kadig-cyan rounded-3xl opacity-15 dark:opacity-20 blur-lg" />
          
          <div className="relative bg-card/80 backdrop-blur-xl border border-border rounded-3xl p-6 overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-kadig-blue/10 dark:from-kadig-blue/20 to-transparent rounded-full blur-2xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-kadig-cyan/10 dark:from-kadig-cyan/20 to-transparent rounded-full blur-2xl" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Star className="w-4 h-4 text-yellow-500 dark:text-yellow-400 fill-yellow-500 dark:fill-yellow-400" />
                <span className="text-xs font-bold text-yellow-600 dark:text-yellow-400 uppercase tracking-wide">Oferta Especial</span>
                <Star className="w-4 h-4 text-yellow-500 dark:text-yellow-400 fill-yellow-500 dark:fill-yellow-400" />
              </div>
              
              <p className="text-center text-sm text-muted-foreground mb-2">Acesso completo por apenas</p>
              
              <div className="flex items-baseline justify-center gap-1 mb-5">
                <span className="text-5xl font-black text-foreground">R$ 39</span>
                <span className="text-3xl font-black text-foreground">,90</span>
                <span className="text-muted-foreground text-lg">/mês</span>
              </div>
              
              <div className="flex justify-center gap-6 mb-6">
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <svg className="w-3 h-3 text-emerald-500 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  Cancele quando quiser
                </span>
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <svg className="w-3 h-3 text-emerald-500 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
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
                className="w-full bg-gradient-to-r from-kadig-blue to-kadig-cyan text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-kadig-blue/30 hover:shadow-kadig-blue/50 transition-all"
              >
                <Lock className="w-5 h-5" />
                Desbloquear Agora
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Other Premium Features */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-card/30 backdrop-blur-xl border border-border rounded-2xl p-5 mb-8"
        >
          <h4 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
            Também incluído no Premium
          </h4>
          <div className="space-y-3">
            {type !== "bianca" && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-foreground font-semibold text-sm">Bianca IA</p>
                  <p className="text-muted-foreground text-xs">Consultora Pessoal</p>
                </div>
              </div>
            )}
            {type !== "trade" && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-kadig-blue to-kadig-cyan flex items-center justify-center shadow-lg shadow-kadig-blue/20">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-foreground font-semibold text-sm">Trade</p>
                  <p className="text-muted-foreground text-xs">Gestão de Ativos</p>
                </div>
              </div>
            )}
            {type !== "mercado" && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-400 flex items-center justify-center shadow-lg shadow-violet-500/20">
                  <Store className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-foreground font-semibold text-sm">Mercado</p>
                  <p className="text-muted-foreground text-xs">Cotações em Tempo Real</p>
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
