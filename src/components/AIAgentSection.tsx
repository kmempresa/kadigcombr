import { motion } from "framer-motion";
import { Brain, Zap, TrendingUp, Clock, Target, Shield } from "lucide-react";

export const AIAgentSection = () => {
  const features = [
    {
      icon: Brain,
      title: "Análise Preditiva",
      description: "IA analisa milhares de dados de mercado para prever tendências"
    },
    {
      icon: Zap,
      title: "Decisões Instantâneas",
      description: "Receba alertas e sugestões em milissegundos"
    },
    {
      icon: TrendingUp,
      title: "Otimização Contínua",
      description: "Aprende com o mercado e melhora suas recomendações"
    },
    {
      icon: Shield,
      title: "Gestão de Riscos",
      description: "Protege seu patrimônio identificando riscos antes que aconteçam"
    }
  ];

  return (
    <section className="py-24 px-6 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-primary/20 border border-primary/30 rounded-full px-4 py-2 mb-6">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-primary text-sm font-medium">Consultor Kadig Ativo 24/7</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            Seu Consultor Kadig{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-cyan-400 to-primary">
              em Tempo Real
            </span>
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Um agente inteligente que monitora o mercado 24 horas por dia, 
            prevê movimentos e te ajuda a tomar as melhores decisões de investimento instantaneamente.
          </p>
        </motion.div>

        {/* Main showcase */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          {/* Left side - AI visualization */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="relative bg-card/50 backdrop-blur-xl border border-primary/20 rounded-3xl p-8 overflow-hidden">
              {/* Animated background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-cyan-500/10" />
              
              {/* AI Brain visualization */}
              <div className="relative flex flex-col items-center">
                <motion.div
                  animate={{ 
                    scale: [1, 1.05, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="relative mb-8"
                >
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-cyan-400 flex items-center justify-center shadow-[0_0_60px_rgba(99,102,241,0.5)]">
                    <Brain className="w-16 h-16 text-white" />
                  </div>
                  
                  {/* Orbiting elements */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0"
                  >
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 bg-green-400 rounded-full shadow-[0_0_20px_rgba(74,222,128,0.8)]" />
                  </motion.div>
                  
                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0"
                  >
                    <div className="absolute top-1/2 -right-3 -translate-y-1/2 w-3 h-3 bg-cyan-400 rounded-full shadow-[0_0_15px_rgba(34,211,238,0.8)]" />
                  </motion.div>
                </motion.div>

                {/* Live status */}
                <div className="bg-background/80 backdrop-blur border border-border/50 rounded-2xl p-6 w-full">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-primary" />
                      <span className="text-sm text-muted-foreground">Última análise</span>
                    </div>
                    <span className="text-sm text-green-400 font-medium">Agora mesmo</span>
                  </div>
                  
                  <div className="space-y-3">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: "85%" }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.3 }}
                      className="h-2 bg-gradient-to-r from-primary to-cyan-400 rounded-full"
                    />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Confiança da previsão</span>
                      <span className="text-primary font-semibold">85%</span>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-green-400 font-medium">
                        Oportunidade detectada: PETR4
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right side - Features */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group flex gap-4 p-4 rounded-2xl bg-card/30 backdrop-blur border border-border/30 hover:border-primary/40 hover:bg-card/50 transition-all duration-300"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 bg-card/50 backdrop-blur border border-primary/20 rounded-2xl p-6">
            <div className="text-left">
              <p className="text-foreground font-semibold">
                Mais de 10.000 análises por segundo
              </p>
              <p className="text-sm text-muted-foreground">
                Processando dados do mercado global em tempo real
              </p>
            </div>
            <div className="flex items-center gap-2 bg-primary/20 px-4 py-2 rounded-full">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-primary text-sm font-medium">Online</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
