import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Wallet, Link2, User, BarChart3, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "@/hooks/useTheme";

const PrimeirosPassos = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  const steps = [
    {
      icon: User,
      title: "1. Crie sua conta",
      description: "Cadastre-se com seu e-mail e defina uma senha segura. Você será guiado pelo nosso onboarding para definir seu perfil de investidor.",
      details: [
        "Informe seu nome completo",
        "Responda o questionário de perfil de investidor",
        "Seu perfil (Conservador, Moderado ou Arrojado) será definido automaticamente"
      ]
    },
    {
      icon: Wallet,
      title: "2. Crie sua primeira carteira",
      description: "Organize seus investimentos em carteiras separadas para melhor controle e visualização.",
      details: [
        "Acesse a aba Carteira no menu inferior",
        "Toque em 'Criar Carteira' ou no botão +",
        "Dê um nome para sua carteira (ex: 'Reserva de Emergência', 'Aposentadoria')"
      ]
    },
    {
      icon: BarChart3,
      title: "3. Adicione seus investimentos",
      description: "Cadastre seus ativos manualmente escolhendo entre diversos tipos disponíveis.",
      details: [
        "Ações, ETFs e Stocks - com cotação em tempo real",
        "FIIs e REITs - fundos imobiliários",
        "Renda Fixa - CDBs, LCIs, LCAs, Tesouro Direto",
        "Criptomoedas - Bitcoin, Ethereum e outras",
        "Moedas estrangeiras - Dólar, Euro, etc.",
        "Fundos de investimento"
      ]
    },
    {
      icon: Link2,
      title: "4. Conecte suas instituições (opcional)",
      description: "Use o Open Finance para sincronizar automaticamente seus investimentos de bancos e corretoras.",
      details: [
        "Acesse a aba Conexões",
        "Toque em 'Conectar Instituição'",
        "Selecione seu banco ou corretora",
        "Autorize o compartilhamento de dados via Open Finance",
        "Seus investimentos serão importados automaticamente"
      ]
    },
    {
      icon: Sparkles,
      title: "5. Converse com a Bianca",
      description: "Nossa consultora de IA está disponível 24/7 para analisar sua carteira e tirar suas dúvidas.",
      details: [
        "Acesse o ícone de chat no dashboard",
        "Peça análises personalizadas da sua carteira",
        "Tire dúvidas sobre investimentos e mercado",
        "Receba recomendações baseadas no seu perfil"
      ]
    }
  ];

  return (
    <div className={`min-h-screen bg-background ${theme === "light" ? "light-theme" : ""}`}>
      {/* Header */}
      <header className="flex items-center gap-4 p-4 safe-area-inset-top border-b border-border">
        <button 
          onClick={() => navigate("/central-ajuda")}
          className="w-10 h-10 rounded-full bg-card flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-xl font-semibold text-foreground">Primeiros Passos</h1>
      </header>

      <div className="p-4 pb-8 space-y-6">
        {/* Intro */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary/5 rounded-2xl p-4 border border-primary/20"
        >
          <CheckCircle2 className="w-8 h-8 text-primary mx-auto mb-2" />
          <h2 className="text-lg font-semibold text-foreground text-center mb-1">
            Bem-vindo ao Kadig!
          </h2>
          <p className="text-sm text-muted-foreground text-center">
            Siga este guia para configurar sua conta e começar a acompanhar seus investimentos de forma inteligente.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-card rounded-xl p-4 border border-border"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <step.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{step.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                </div>
              </div>
              <div className="ml-13 space-y-2">
                {step.details.map((detail, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    <p className="text-sm text-muted-foreground">{detail}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-primary/10 to-cyan-500/10 rounded-2xl p-4 border border-primary/20"
        >
          <h3 className="font-semibold text-foreground mb-2">Pronto para começar?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Acesse o app e comece a organizar seus investimentos agora mesmo.
          </p>
          <button
            onClick={() => navigate("/app")}
            className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
          >
            Ir para o Dashboard
          </button>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-xs text-muted-foreground/60 text-center pt-4"
        >
          © 2026 Kadig. Todos os direitos reservados.
        </motion.p>
      </div>
    </div>
  );
};

export default PrimeirosPassos;
