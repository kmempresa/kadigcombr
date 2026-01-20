import { useState } from "react";
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
  Sparkles,
  BarChart3,
  Globe,
  Bot,
  Target
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import biancaConsultora from "@/assets/bianca-consultora.png";

interface PremiumSubscriptionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscribe?: () => void;
}

const PremiumSubscriptionDrawer = ({ isOpen, onClose, onSubscribe }: PremiumSubscriptionDrawerProps) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubscribe = async () => {
    setIsProcessing(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Você precisa estar logado para assinar");
        setIsProcessing(false);
        return;
      }

      // For now, create a subscription directly (will integrate with Stripe later)
      const { error } = await supabase
        .from("subscriptions")
        .upsert({
          user_id: session.user.id,
          status: "active",
          plan: "premium",
          price_monthly: 39.90,
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }, {
          onConflict: "user_id",
        });

      if (error) {
        console.error("Error creating subscription:", error);
        toast.error("Erro ao processar assinatura");
        return;
      }

      toast.success("🎉 Bem-vindo ao Kadig Premium!");
      onSubscribe?.();
      onClose();
    } catch (error) {
      console.error("Subscription error:", error);
      toast.error("Erro ao processar assinatura");
    } finally {
      setIsProcessing(false);
    }
  };

  const biancaFeatures = [
    { icon: Bot, title: "Consultora IA 24/7", description: "Análises personalizadas da sua carteira" },
    { icon: Target, title: "Recomendações", description: "Sugestões baseadas no seu perfil" },
    { icon: MessageSquare, title: "Chat Ilimitado", description: "Tire dúvidas a qualquer momento" },
  ];

  const tradeFeatures = [
    { icon: Wallet, title: "Gestão de Ativos", description: "Acompanhe ações, FIIs e cripto" },
    { icon: PieChart, title: "Análise de Carteira", description: "Distribuição e rentabilidade" },
    { icon: LineChart, title: "Histórico Completo", description: "Evolução patrimonial detalhada" },
  ];

  const mercadoFeatures = [
    { icon: TrendingUp, title: "Cotações em Tempo Real", description: "Preços atualizados ao vivo" },
    { icon: BarChart3, title: "Maiores Altas/Baixas", description: "Oportunidades do mercado" },
    { icon: Globe, title: "Índices Globais", description: "Ibovespa, S&P 500, Nasdaq e mais" },
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
            className="fixed inset-0 bg-black/60 z-50"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-b from-background to-card rounded-t-3xl max-h-[95vh] overflow-hidden"
          >
            <div className="relative overflow-y-auto max-h-[95vh]">
              {/* Header with gradient */}
              <div className="sticky top-0 z-10 bg-gradient-to-br from-kadig-blue to-kadig-cyan p-6 pb-24 relative overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />
                
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <Crown className="w-5 h-5 text-yellow-300" />
                    <span className="text-white/90 text-sm font-medium">KADIG PREMIUM</span>
                  </div>
                  
                  <h1 className="text-3xl font-bold text-white mb-2">
                    Desbloqueie Todo o Potencial
                  </h1>
                  <p className="text-white/80 text-base">
                    Acesse recursos exclusivos para investir melhor
                  </p>
                </div>
              </div>

              {/* Price Card - Floating over header */}
              <div className="px-5 -mt-16 relative z-20">
                <div className="bg-white rounded-2xl shadow-xl p-5 border border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-slate-500 text-sm">Assinatura mensal</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-slate-900">R$ 39</span>
                        <span className="text-2xl font-bold text-slate-900">,90</span>
                        <span className="text-slate-500 text-sm">/mês</span>
                      </div>
                    </div>
                    <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium">
                      Mais popular
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Cancele quando quiser</span>
                  </div>

                  <button
                    onClick={handleSubscribe}
                    disabled={isProcessing}
                    className="w-full bg-gradient-to-r from-kadig-blue to-kadig-cyan text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-kadig-blue/30 transition-all disabled:opacity-70"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Assinar Premium
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Features Sections */}
              <div className="px-5 py-6 space-y-8">
                
                {/* Bianca IA Section */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-lg shadow-emerald-200/50">
                      <img src={biancaConsultora} alt="Bianca" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-foreground">Bianca Consultora</h3>
                      <p className="text-muted-foreground text-sm">Sua consultora IA pessoal</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {biancaFeatures.map((feature, index) => (
                      <div key={index} className="flex items-start gap-3 bg-card rounded-xl p-4 border border-border">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                          <feature.icon className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">{feature.title}</h4>
                          <p className="text-sm text-muted-foreground">{feature.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Trade Section */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-200/50">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-foreground">Trade</h3>
                      <p className="text-muted-foreground text-sm">Gestão completa de ativos</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {tradeFeatures.map((feature, index) => (
                      <div key={index} className="flex items-start gap-3 bg-card rounded-xl p-4 border border-border">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <feature.icon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">{feature.title}</h4>
                          <p className="text-sm text-muted-foreground">{feature.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mercado Section */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-lg shadow-violet-200/50">
                      <BarChart3 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-foreground">Mercado</h3>
                      <p className="text-muted-foreground text-sm">Dados do mercado em tempo real</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {mercadoFeatures.map((feature, index) => (
                      <div key={index} className="flex items-start gap-3 bg-card rounded-xl p-4 border border-border">
                        <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                          <feature.icon className="w-5 h-5 text-violet-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">{feature.title}</h4>
                          <p className="text-sm text-muted-foreground">{feature.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Additional Benefits */}
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-5">
                  <h3 className="font-bold text-lg text-foreground mb-4 flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    Benefícios Exclusivos
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-emerald-500" />
                      <span className="text-foreground">Acesso ilimitado à Bianca IA</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-emerald-500" />
                      <span className="text-foreground">Cotações em tempo real</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-emerald-500" />
                      <span className="text-foreground">Análises avançadas de carteira</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-emerald-500" />
                      <span className="text-foreground">Relatórios personalizados</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-emerald-500" />
                      <span className="text-foreground">Suporte prioritário</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-emerald-500" />
                      <span className="text-foreground">Garantia de 7 dias ou seu dinheiro de volta</span>
                    </div>
                  </div>
                </div>

                {/* CTA Bottom */}
                <div className="pb-8">
                  <button
                    onClick={handleSubscribe}
                    disabled={isProcessing}
                    className="w-full bg-gradient-to-r from-kadig-blue to-kadig-cyan text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-kadig-blue/30 transition-all disabled:opacity-70"
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
                  </button>
                  
                  <p className="text-center text-muted-foreground text-sm mt-4">
                    Ao assinar, você concorda com os Termos de Uso
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PremiumSubscriptionDrawer;
