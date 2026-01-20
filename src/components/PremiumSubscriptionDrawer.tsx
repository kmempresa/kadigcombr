import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Crown, 
  Check, 
  TrendingUp, 
  MessageSquare, 
  LineChart, 
  PieChart,
  Wallet,
  Shield,
  Zap,
  Star,
  ArrowRight,
  BarChart3,
  Globe,
  Target,
  FileText,
  Briefcase,
  Newspaper,
  Clock,
  Brain,
  Lock,
  Calculator,
  Award,
  DollarSign,
  Scale,
  Umbrella,
  Coins,
  RotateCcw
} from "lucide-react";
import biancaConsultora from "@/assets/bianca-consultora.png";
import { useApplePurchase } from "@/hooks/useApplePurchase";

interface PremiumSubscriptionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscribe?: () => void;
}

const PremiumSubscriptionDrawer = ({ isOpen, onClose, onSubscribe }: PremiumSubscriptionDrawerProps) => {
  const { purchasePremium, isProcessing, restorePurchases } = useApplePurchase();

  const handleSubscribe = async () => {
    const success = await purchasePremium();
    if (success) {
      onSubscribe?.();
      onClose();
    }
  };

  const handleRestore = async () => {
    const success = await restorePurchases();
    if (success) {
      onSubscribe?.();
      onClose();
    }
  };

  const biancaFeatures = [
    { icon: Target, title: "Tomada de Decisão", description: "Estratégias assertivas para seus investimentos" },
    { icon: TrendingUp, title: "Análise de Mercado", description: "Visão completa do cenário financeiro" },
    { icon: LineChart, title: "Ações Futuras", description: "Projeções e tendências do mercado" },
    { icon: MessageSquare, title: "Consultoria 24/7", description: "Sempre disponível para suas dúvidas" },
  ];

  const tradeFeatures = [
    { icon: Wallet, title: "Gestão de Ativos", description: "Ações, FIIs, Criptos e Renda Fixa" },
    { icon: PieChart, title: "Análise de Carteira", description: "Distribuição e alocação detalhada" },
    { icon: LineChart, title: "Evolução Patrimonial", description: "Histórico completo de rentabilidade" },
    { icon: TrendingUp, title: "Rentabilidade vs CDI", description: "Compare seu desempenho com benchmarks" },
  ];

  const mercadoFeatures = [
    { icon: BarChart3, title: "Cotações em Tempo Real", description: "Preços atualizados ao vivo" },
    { icon: TrendingUp, title: "Maiores Altas/Baixas", description: "Identifique oportunidades" },
    { icon: Globe, title: "Índices Globais", description: "Ibovespa, S&P 500, Nasdaq e mais" },
    { icon: Newspaper, title: "Notícias Globais", description: "Fique por dentro do mercado mundial" },
  ];

  const exclusiveFeatures = [
    { icon: Calculator, title: "Simulador de Investimentos", description: "Projeções com juros compostos" },
    { icon: Scale, title: "Comparador de Ativos", description: "Análise comparativa de papéis" },
    { icon: Award, title: "Índice Kadig", description: "Score exclusivo de performance" },
    { icon: Briefcase, title: "Carteiras Recomendadas", description: "Portfólios de especialistas" },
    { icon: FileText, title: "Relatórios em PDF", description: "Exporte análises detalhadas" },
    { icon: Brain, title: "Análises Fundamentalistas", description: "P/L, DY, ROE, P/VP e mais" },
    { icon: Coins, title: "Proventos e Dividendos", description: "Acompanhe seus recebimentos" },
    { icon: DollarSign, title: "Ganho de Capital", description: "Imposto de renda simplificado" },
    { icon: Umbrella, title: "Cobertura FGC", description: "Proteção dos seus investimentos" },
    { icon: Clock, title: "Risco x Retorno", description: "Análise de volatilidade" },
    { icon: Shield, title: "Segurança Total", description: "Dados criptografados" },
    { icon: Zap, title: "Suporte Prioritário", description: "Atendimento exclusivo Premium" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl max-h-[95vh] overflow-hidden"
          >
            <div className="relative overflow-y-auto max-h-[95vh]">
              {/* Background Effects */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-gradient-to-br from-kadig-blue to-kadig-cyan opacity-10 dark:opacity-15 rounded-full blur-[120px]" />
                <div className="absolute bottom-40 right-0 w-80 h-80 bg-primary/5 dark:bg-primary/10 rounded-full blur-[100px]" />
              </div>

              {/* Header */}
              <div className="sticky top-0 z-20 px-5 pt-4 pb-2 bg-gradient-to-b from-background via-background to-transparent">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center shadow-lg shadow-yellow-500/20">
                      <Crown className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="font-bold text-foreground">Kadig Premium</h2>
                      <p className="text-xs text-muted-foreground">Desbloqueie todo o potencial</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:bg-muted transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Price Card */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="relative"
                >
                  <div className="absolute -inset-1 bg-gradient-to-r from-kadig-blue to-kadig-cyan rounded-3xl opacity-20 blur-lg" />
                  
                  <div className="relative bg-card/80 backdrop-blur-xl border border-border rounded-2xl p-5 overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-2xl" />
                    
                    <div className="relative z-10">
                      <div className="flex items-center justify-center gap-2 mb-3">
                        <Star className="w-4 h-4 text-yellow-500 dark:text-yellow-400 fill-yellow-500 dark:fill-yellow-400" />
                        <span className="text-xs font-bold text-yellow-600 dark:text-yellow-400 uppercase tracking-wide">Oferta Especial</span>
                        <Star className="w-4 h-4 text-yellow-500 dark:text-yellow-400 fill-yellow-500 dark:fill-yellow-400" />
                      </div>
                      
                      <div className="flex items-baseline justify-center gap-1 mb-4">
                        <span className="text-4xl font-black text-foreground">R$ 39</span>
                        <span className="text-2xl font-black text-foreground">,90</span>
                        <span className="text-muted-foreground text-lg">/mês</span>
                      </div>
                      
                      <div className="flex justify-center gap-4 mb-4 text-sm">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <div className="w-4 h-4 rounded-full bg-success/20 flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-success" />
                          </div>
                          Cancele quando quiser
                        </span>
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <div className="w-4 h-4 rounded-full bg-success/20 flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-success" />
                          </div>
                          7 dias de garantia
                        </span>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSubscribe}
                        disabled={isProcessing}
                        className="w-full bg-gradient-to-r from-kadig-blue to-kadig-cyan text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-xl shadow-primary/30 hover:shadow-primary/50 transition-all disabled:opacity-70"
                      >
                        {isProcessing ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Processando...
                          </>
                        ) : (
                          <>
                            <Lock className="w-5 h-5" />
                            Desbloquear Premium
                            <ArrowRight className="w-5 h-5" />
                          </>
                        )}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Features Content */}
              <div className="relative z-10 px-5 py-6 space-y-8">
                
                {/* Bianca Consultora Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-lg shadow-primary/20">
                      <img src={biancaConsultora} alt="Bianca Consultora" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-foreground">Bianca Consultora</h3>
                      <p className="text-muted-foreground text-sm">Sua consultora financeira pessoal</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {biancaFeatures.map((feature, index) => (
                      <div key={index} className="bg-card/50 backdrop-blur-xl border border-border rounded-xl p-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-kadig-blue to-kadig-cyan flex items-center justify-center mb-2 shadow-md shadow-primary/20">
                          <feature.icon className="w-4 h-4 text-white" />
                        </div>
                        <h4 className="font-semibold text-foreground text-sm">{feature.title}</h4>
                        <p className="text-xs text-muted-foreground">{feature.description}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Trade Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-kadig-blue to-kadig-cyan flex items-center justify-center shadow-lg shadow-primary/20">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-foreground">Trade</h3>
                      <p className="text-muted-foreground text-sm">Gestão completa de ativos</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {tradeFeatures.map((feature, index) => (
                      <div key={index} className="bg-card/50 backdrop-blur-xl border border-border rounded-xl p-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-kadig-blue to-kadig-cyan flex items-center justify-center mb-2 shadow-md shadow-primary/20">
                          <feature.icon className="w-4 h-4 text-white" />
                        </div>
                        <h4 className="font-semibold text-foreground text-sm">{feature.title}</h4>
                        <p className="text-xs text-muted-foreground">{feature.description}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Mercado Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-kadig-blue to-kadig-cyan flex items-center justify-center shadow-lg shadow-primary/20">
                      <BarChart3 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-foreground">Mercado</h3>
                      <p className="text-muted-foreground text-sm">Dados do mercado em tempo real</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {mercadoFeatures.map((feature, index) => (
                      <div key={index} className="bg-card/50 backdrop-blur-xl border border-border rounded-xl p-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-kadig-blue to-kadig-cyan flex items-center justify-center mb-2 shadow-md shadow-primary/20">
                          <feature.icon className="w-4 h-4 text-white" />
                        </div>
                        <h4 className="font-semibold text-foreground text-sm">{feature.title}</h4>
                        <p className="text-xs text-muted-foreground">{feature.description}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Exclusive Benefits */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-card/30 backdrop-blur-xl border border-border rounded-2xl p-5"
                >
                  <h3 className="font-bold text-lg text-foreground mb-4 flex items-center gap-2">
                    <Crown className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
                    Benefícios Exclusivos
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {exclusiveFeatures.map((feature, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
                          <feature.icon className="w-4 h-4 text-success" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground text-sm">{feature.title}</h4>
                          <p className="text-xs text-muted-foreground">{feature.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* CTA Bottom */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="pb-8"
                >
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSubscribe}
                    disabled={isProcessing}
                    className="w-full bg-gradient-to-r from-kadig-blue to-kadig-cyan text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-xl shadow-primary/30 hover:shadow-primary/50 transition-all disabled:opacity-70"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <Crown className="w-5 h-5" />
                        Começar Agora por R$ 39,90/mês
                      </>
                    )}
                  </motion.button>
                  
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleRestore}
                    disabled={isProcessing}
                    className="w-full mt-3 py-3 text-muted-foreground font-medium flex items-center justify-center gap-2 hover:text-foreground transition-all disabled:opacity-70"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Restaurar compra anterior
                  </motion.button>
                  
                  <p className="text-center text-muted-foreground text-sm mt-4">
                    Ao assinar, você concorda com os Termos de Uso
                  </p>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PremiumSubscriptionDrawer;
