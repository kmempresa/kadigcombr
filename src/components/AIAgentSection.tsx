import { motion } from "framer-motion";
import { TrendingUp, Target, MessageSquare, Sparkles, BarChart3 } from "lucide-react";
import biancaConsultora from "@/assets/bianca-consultora.png";

export const AIAgentSection = () => {
  const features = [
    {
      icon: MessageSquare,
      title: "Converse Naturalmente",
      description: "Pergunte como se fosse com um consultor real"
    },
    {
      icon: BarChart3,
      title: "Análise de Carteira",
      description: "Bianca analisa e sugere melhorias"
    },
    {
      icon: TrendingUp,
      title: "Insights de Mercado",
      description: "Análises sobre ações, FIIs e oportunidades"
    },
    {
      icon: Target,
      title: "Metas Personalizadas",
      description: "Acompanhe seu progresso com IA"
    }
  ];

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[800px] h-[400px] sm:h-[800px] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-primary/20 border border-primary/30 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 mb-4 sm:mb-6">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-primary text-xs sm:text-sm font-medium">Bianca está Online</span>
          </div>
          
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 sm:mb-6">
            Conheça a{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-cyan-400 to-primary">
              Bianca
            </span>
          </h2>
          
          <p className="text-base sm:text-xl text-muted-foreground max-w-3xl mx-auto px-2">
            Sua consultora financeira com IA. 
            Tire dúvidas e receba recomendações 24h por dia.
          </p>
        </motion.div>

        {/* Main showcase */}
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center mb-10 sm:mb-16">
          {/* Left side - Bianca visualization */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="relative bg-card/50 backdrop-blur-xl border border-primary/20 rounded-2xl sm:rounded-3xl p-5 sm:p-8 overflow-hidden">
              {/* Animated background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-cyan-500/10" />
              
              {/* Bianca Avatar */}
              <div className="relative flex flex-col items-center">
                <motion.div
                  animate={{ 
                    scale: [1, 1.02, 1],
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="relative mb-4 sm:mb-6"
                >
                  <div className="w-20 h-20 sm:w-32 sm:h-32 rounded-full overflow-hidden shadow-[0_0_60px_rgba(99,102,241,0.4)] border-4 border-primary/30">
                    <img 
                      src={biancaConsultora} 
                      alt="Bianca - Consultora IA" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Online indicator */}
                  <div className="absolute bottom-1 sm:bottom-2 right-1 sm:right-2 w-4 sm:w-5 h-4 sm:h-5 bg-green-500 rounded-full border-2 border-background shadow-[0_0_10px_rgba(74,222,128,0.8)]" />
                </motion.div>

                {/* Chat preview */}
                <div className="bg-background/80 backdrop-blur border border-border/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 w-full space-y-3 sm:space-y-4">
                  {/* User message */}
                  <div className="flex justify-end">
                    <div className="bg-primary text-primary-foreground rounded-xl sm:rounded-2xl rounded-br-md px-3 sm:px-4 py-2 max-w-[85%]">
                      <p className="text-xs sm:text-sm">Como está minha carteira esse mês?</p>
                    </div>
                  </div>
                  
                  {/* Bianca response */}
                  <div className="flex gap-2 sm:gap-3">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden shrink-0">
                      <img src={biancaConsultora} alt="Bianca" className="w-full h-full object-cover" />
                    </div>
                    <div className="bg-muted rounded-xl sm:rounded-2xl rounded-bl-md px-3 sm:px-4 py-2 sm:py-3 max-w-[85%]">
                      <p className="text-xs sm:text-sm text-foreground">
                        Sua carteira rendeu <span className="text-primary font-semibold">+2.3%</span> este mês, 
                        superando o CDI em <span className="text-green-500 font-semibold">127%</span>! 🚀
                      </p>
                    </div>
                  </div>

                  {/* Typing indicator */}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Sparkles className="w-3 sm:w-4 h-3 sm:h-4 text-primary animate-pulse" />
                    <span className="text-[10px] sm:text-xs">Bianca pode te ajudar com mais...</span>
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
            className="space-y-3 sm:space-y-6"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-card/30 backdrop-blur border border-border/30 hover:border-primary/40 hover:bg-card/50 transition-all duration-300"
              >
                <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                  <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-lg font-semibold text-foreground mb-0.5 sm:mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
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
          <div className="inline-flex flex-col sm:flex-row items-center gap-3 sm:gap-4 bg-card/50 backdrop-blur border border-primary/20 rounded-xl sm:rounded-2xl p-4 sm:p-6">
            <div className="text-center sm:text-left">
              <p className="text-sm sm:text-base text-foreground font-semibold">
                Tecnologia GPT integrada
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                IA avançada para suas necessidades
              </p>
            </div>
            <div className="flex items-center gap-2 bg-primary/20 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-primary text-xs sm:text-sm font-medium">24/7</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
