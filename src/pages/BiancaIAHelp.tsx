import { useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles, MessageSquare, Brain, Shield, Zap, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/hooks/useTheme";
import { useState } from "react";
import biancaAvatar from "@/assets/bianca-consultora.png";

const BiancaIAHelp = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const capabilities = [
    {
      icon: Brain,
      title: "Análise de Carteira",
      description: "Avalia a composição da sua carteira, identifica pontos fortes e oportunidades de melhoria baseado no seu perfil de investidor."
    },
    {
      icon: Zap,
      title: "Recomendações Personalizadas",
      description: "Sugere rebalanceamento e estratégias alinhadas aos seus objetivos financeiros e tolerância a risco."
    },
    {
      icon: MessageSquare,
      title: "Dúvidas sobre Investimentos",
      description: "Responde perguntas sobre ações, fundos, renda fixa, criptomoedas e qualquer tema do mercado financeiro."
    },
    {
      icon: Shield,
      title: "Análise de Risco",
      description: "Identifica exposições excessivas, falta de diversificação e sugere como proteger seu patrimônio."
    }
  ];

  const faqs = [
    {
      question: "Quem é a Bianca?",
      answer: "A Bianca é a consultora financeira virtual do Kadig, desenvolvida para oferecer insights e análises personalizados. Ela é uma inteligencia artificial com tecnologia GPT que tem acesso aos seus dados de investimentos dentro do app, podendo analisar sua carteira real e dar recomendações específicas para você."
    },
    {
      question: "A Bianca conhece minha carteira?",
      answer: "Sim! A Bianca tem acesso aos seus investimentos cadastrados no Kadig. Quando você pede uma análise, ela considera todos os ativos, valores, rentabilidade e distribuição da sua carteira real para dar respostas personalizadas."
    },
    {
      question: "A Bianca pode executar operações por mim?",
      answer: "Não. A Bianca é uma consultora que fornece análises, insights e recomendações. Ela não executa compras, vendas ou qualquer movimentação financeira. Todas as decisões e ações são suas."
    },
    {
      question: "As recomendações da Bianca são confiáveis?",
      answer: "A Bianca oferece análises baseadas em dados e boas práticas de mercado, mas não substitui um consultor financeiro certificado. As recomendações são educacionais e você deve sempre avaliar antes de tomar decisões de investimento."
    },
    {
      question: "A Bianca está disponível 24 horas?",
      answer: "Sim! A Bianca está disponível 24 horas por dia, 7 dias por semana. Você pode conversar com ela a qualquer momento para tirar dúvidas ou pedir análises."
    },
    {
      question: "Como acessar a Bianca?",
      answer: "No dashboard do app, toque no ícone de chat (bolha de conversa) no canto superior ou acesse pelo menu 'Consultor IA'. A Bianca vai cumprimentá-lo e você pode começar a conversar."
    },
    {
      question: "O que posso perguntar para a Bianca?",
      answer: "Você pode perguntar praticamente qualquer coisa sobre investimentos! Exemplos: 'Analise minha carteira', 'Como reduzir meu risco?', 'Minha carteira está diversificada?', 'O que é CDI?', 'Quais são as melhores ações para dividendos?', 'Como investir em renda fixa?'."
    },
    {
      question: "As conversas com a Bianca são salvas?",
      answer: "Sim, o histórico de conversas fica salvo no app para que você possa revisar análises e recomendações anteriores. Seus dados são protegidos e criptografados."
    },
    {
      question: "A Bianca usa informações do mercado em tempo real?",
      answer: "A Bianca utiliza dados de mercado e informações atualizadas para contextualizar suas análises. Ela pode comentar sobre tendências, índices e cenários econômicos atuais."
    },
    {
      question: "Posso confiar nas informações de mercado da Bianca?",
      answer: "A Bianca se esforça para fornecer informações precisas e atualizadas, mas recomendamos sempre verificar dados críticos em fontes oficiais antes de tomar decisões importantes de investimento."
    }
  ];

  const examplePrompts = [
    "Analisar minha carteira",
    "Minha carteira está diversificada?",
    "Como reduzir meu risco?",
    "Quais ativos devo rebalancear?",
    "O que é CDI e como impacta meus investimentos?",
    "Melhores estratégias para meu perfil"
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
        <h1 className="text-xl font-semibold text-foreground">Bianca IA</h1>
      </header>

      <div className="p-4 pb-8 space-y-6">
        {/* Intro with Avatar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-primary/10 to-cyan-500/10 rounded-2xl p-6 border border-primary/20"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="relative">
              <img 
                src={biancaAvatar} 
                alt="Bianca IA" 
                className="w-16 h-16 rounded-full object-cover border-2 border-primary/30"
              />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-background flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Conheça a Bianca</h2>
              <p className="text-sm text-muted-foreground">Sua consultora financeira pessoal</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            A Bianca é uma inteligência artificial integrada ao Kadig que conhece sua carteira de investimentos e está sempre disponível para ajudar com análises personalizadas, recomendações e tirar suas dúvidas sobre o mercado financeiro.
          </p>
        </motion.div>

        {/* Capabilities */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 px-1 uppercase">
            O que a Bianca pode fazer
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {capabilities.map((capability, index) => (
              <motion.div
                key={capability.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-card rounded-xl p-4 border border-border"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                  <capability.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-medium text-foreground text-sm mb-1">{capability.title}</h3>
                <p className="text-xs text-muted-foreground">{capability.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Example Prompts */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 px-1 uppercase">
            Exemplos de perguntas
          </h2>
          <div className="flex flex-wrap gap-2">
            {examplePrompts.map((prompt, index) => (
              <button
                key={index}
                onClick={() => navigate("/consultor-ia")}
                className="px-3 py-2 bg-card rounded-full border border-border text-sm text-foreground hover:bg-muted/50 transition-colors"
              >
                "{prompt}"
              </button>
            ))}
          </div>
        </motion.div>

        {/* FAQs */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 px-1 uppercase">
            Perguntas sobre a Bianca
          </h2>
          <div className="space-y-2">
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <motion.div
                  key={faq.question}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.03 }}
                  className="bg-card rounded-xl border border-border overflow-hidden"
                >
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="w-full p-4 flex items-center justify-between text-left"
                  >
                    <span className="font-medium text-foreground pr-4 text-sm">{faq.question}</span>
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
                    </motion.div>
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="px-4 pb-4 pt-0">
                          <p className="text-sm text-muted-foreground">{faq.answer}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-card rounded-2xl p-4 border border-border"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">Pronto para conversar?</h3>
              <p className="text-xs text-muted-foreground">A Bianca está online e pronta para ajudar</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/consultor-ia")}
            className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
          >
            Conversar com a Bianca
          </button>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-xs text-muted-foreground/60 text-center pt-4"
        >
          © 2026 Kadig. Todos os direitos reservados.
        </motion.p>
      </div>
    </div>
  );
};

export default BiancaIAHelp;
