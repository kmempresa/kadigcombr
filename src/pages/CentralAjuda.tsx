import { useNavigate } from "react-router-dom";
import { ArrowLeft, HelpCircle, MessageSquare, BookOpen, Mail, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "@/hooks/useTheme";

const CentralAjuda = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  const categories = [
    {
      icon: BookOpen,
      title: "Primeiros Passos",
      description: "Aprenda a configurar sua conta e adicionar investimentos",
      articles: 5,
      path: "/primeiros-passos"
    },
    {
      icon: HelpCircle,
      title: "Perguntas Frequentes",
      description: "Respostas para as dúvidas mais comuns",
      articles: 24,
      path: "/perguntas-frequentes"
    },
    {
      icon: MessageSquare,
      title: "Bianca IA",
      description: "Como usar a consultora virtual",
      articles: 10,
      path: "/bianca-ia-help"
    }
  ];

  const faqs = [
    {
      question: "Como adicionar um investimento?",
      answer: "Acesse a aba Carteira, toque no botão + e selecione 'Adicionar Investimento'. Preencha os dados do ativo e confirme."
    },
    {
      question: "Como conectar minha conta bancária?",
      answer: "Vá até a aba Conexões e toque em 'Conectar Instituição'. Selecione seu banco e siga as instruções do Open Finance."
    },
    {
      question: "Meus dados estão seguros?",
      answer: "Sim! Utilizamos criptografia de ponta a ponta e estamos em conformidade com a LGPD. Seus dados nunca são compartilhados."
    }
  ];

  return (
    <div className={`min-h-screen bg-background ${theme === "light" ? "light-theme" : ""}`}>
      {/* Header */}
      <header className="flex items-center gap-4 p-4 safe-area-inset-top border-b border-border">
        <button 
          onClick={() => navigate("/sobre")}
          className="w-10 h-10 rounded-full bg-card flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-xl font-semibold text-foreground">Central de Ajuda</h1>
      </header>

      <div className="p-4 pb-8 space-y-6">
        {/* Search hint */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary/5 rounded-2xl p-4 border border-primary/20 text-center"
        >
          <HelpCircle className="w-8 h-8 text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Como podemos ajudar você hoje?
          </p>
        </motion.div>

        {/* Categories */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 px-1">CATEGORIAS</h2>
          <div className="space-y-2">
            {categories.map((category, index) => (
              <motion.button
                key={category.title}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => navigate(category.path)}
                className="w-full bg-card rounded-xl p-4 border border-border flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <category.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground">{category.title}</h3>
                  <p className="text-xs text-muted-foreground">{category.description}</p>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <span className="text-xs">{category.articles}</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 px-1">PERGUNTAS POPULARES</h2>
          <div className="space-y-2">
            {faqs.map((faq, index) => (
              <motion.div
                key={faq.question}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.05 }}
                className="bg-card rounded-xl p-4 border border-border"
              >
                <h3 className="font-medium text-foreground mb-2">{faq.question}</h3>
                <p className="text-sm text-muted-foreground">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Contact */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-2xl p-4 border border-border"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">Ainda precisa de ajuda?</h3>
              <p className="text-xs text-muted-foreground">Nossa equipe está pronta para ajudar</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/suporte")}
            className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
          >
            Abrir Chamado
          </button>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-xs text-muted-foreground/60 text-center pt-4"
        >
          © 2026 Kadig. Todos os direitos reservados.
        </motion.p>
      </div>
    </div>
  );
};

export default CentralAjuda;
