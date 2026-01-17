import { motion } from "framer-motion";
import { Brain, Sparkles, TrendingUp, MessageCircle, Zap, Target } from "lucide-react";
import { useState, useEffect } from "react";

const predictions = [
  { asset: "PETR4", action: "COMPRAR", confidence: 94, reason: "Alta probabilidade de valorização" },
  { asset: "VALE3", action: "MANTER", confidence: 87, reason: "Tendência de alta sustentada" },
  { asset: "ITUB4", action: "COMPRAR", confidence: 91, reason: "Subvalorizado pelo mercado" },
  { asset: "WEGE3", action: "MANTER", confidence: 89, reason: "Fundamentos sólidos" },
];

const chatMessages = [
  { role: "user", text: "Qual o melhor momento para investir em tech?" },
  { role: "ai", text: "Com base na análise de 147 indicadores, o setor tech está em ponto de entrada. Recomendo aportes graduais nas próximas 2 semanas." },
  { role: "user", text: "E sobre diversificação internacional?" },
  { role: "ai", text: "Seu portfólio está 92% concentrado em Brasil. Sugiro 15% em ETFs internacionais para reduzir volatilidade em 23%." },
];

export const AIAgentSection = () => {
  const [activePrediction, setActivePrediction] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [visibleMessages, setVisibleMessages] = useState<number[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setActivePrediction((prev) => (prev + 1) % predictions.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const showMessages = async () => {
      for (let i = 0; i < chatMessages.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        if (chatMessages[i].role === "ai") {
          setIsTyping(true);
          await new Promise((resolve) => setTimeout(resolve, 1000));
          setIsTyping(false);
        }
        setVisibleMessages((prev) => [...prev, i]);
      }
    };
    showMessages();
  }, []);

  return (
    <section className="py-32 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[150px]" />
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-kadig-cyan/10 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full mb-6">
            <Brain className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-sm text-primary font-medium">Inteligência Artificial Avançada</span>
          </div>

          <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Seu Agente de IA
            <br />
            <span className="text-primary glow-text">Trabalhando 24/7</span>
          </h2>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Um agente inteligente que analisa o mercado em tempo real, prevê tendências 
            e te ajuda a tomar as melhores decisões de investimento.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left - AI Chat Interface */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="glass-strong rounded-3xl p-6 glow-blue">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-kadig-cyan flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Kadig AI</p>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-kadig-cyan animate-pulse" />
                    <span className="text-xs text-kadig-cyan">Online • Analisando mercado</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 min-h-[280px]">
                {chatMessages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={visibleMessages.includes(i) ? { opacity: 1, y: 0, scale: 1 } : {}}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {visibleMessages.includes(i) && (
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "glass rounded-bl-md"
                        }`}
                      >
                        {msg.role === "ai" && (
                          <div className="flex items-center gap-2 mb-1">
                            <Sparkles className="w-3 h-3 text-primary" />
                            <span className="text-xs text-primary font-medium">Análise AI</span>
                          </div>
                        )}
                        <p className={`text-sm ${msg.role === "ai" ? "text-foreground" : ""}`}>
                          {msg.text}
                        </p>
                      </div>
                    )}
                  </motion.div>
                ))}

                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="glass rounded-2xl rounded-bl-md px-4 py-3">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-border">
                <div className="glass rounded-2xl px-4 py-3 flex items-center gap-3">
                  <MessageCircle className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Pergunte sobre seus investimentos...</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right - Real-time Predictions */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            {/* Predictions Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Previsões em Tempo Real</h3>
                  <p className="text-xs text-muted-foreground">Atualizando a cada segundo</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-kadig-cyan opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-kadig-cyan" />
                </span>
                <span className="text-xs text-kadig-cyan font-medium">LIVE</span>
              </div>
            </div>

            {/* Prediction Cards */}
            <div className="space-y-3">
              {predictions.map((pred, i) => (
                <motion.div
                  key={pred.asset}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  animate={activePrediction === i ? { scale: 1.02, x: 8 } : { scale: 1, x: 0 }}
                  className={`glass rounded-2xl p-4 cursor-pointer transition-all ${
                    activePrediction === i ? "glow-blue border border-primary/30" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                        <span className="font-bold text-foreground text-sm">{pred.asset}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                              pred.action === "COMPRAR"
                                ? "bg-kadig-cyan/20 text-kadig-cyan"
                                : "bg-primary/20 text-primary"
                            }`}
                          >
                            {pred.action}
                          </span>
                          <Sparkles className="w-3 h-3 text-primary" />
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{pred.reason}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-foreground">{pred.confidence}%</p>
                      <p className="text-xs text-muted-foreground">confiança</p>
                    </div>
                  </div>

                  {activePrediction === i && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-4 pt-4 border-t border-border"
                    >
                      <div className="flex items-center gap-2 text-xs text-primary">
                        <Zap className="w-3 h-3" />
                        <span>Analisando 847 indicadores em tempo real</span>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* AI Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: <Brain className="w-4 h-4" />, label: "Análises/dia", value: "2.4M" },
                { icon: <Target className="w-4 h-4" />, label: "Precisão", value: "94.7%" },
                { icon: <Zap className="w-4 h-4" />, label: "Latência", value: "<50ms" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="glass rounded-xl p-4 text-center"
                >
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center mx-auto mb-2 text-primary">
                    {stat.icon}
                  </div>
                  <p className="text-lg font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
