import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import kadigLogo from "@/assets/kadig-logo.png";

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="h-[100dvh] relative overflow-hidden bg-kadig-deep text-foreground">
      {/* Ambient glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[20%] w-[80%] h-[40%] bg-kadig-cyan/15 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[20%] w-[80%] h-[40%] bg-primary/15 blur-[120px] rounded-full" />
      </div>

      <div
        className="relative z-10 flex flex-col h-full px-6 sm:px-8"
        style={{
          paddingTop: "max(3rem, env(safe-area-inset-top))",
          paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
        }}
      >
        {/* Logo */}
        <motion.div
          className="flex justify-center shrink-0"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <img src={kadigLogo} alt="Kadig" className="h-16 w-auto object-contain" />
        </motion.div>

        {/* Centerpiece: score rings + glass card */}
        <div className="flex-1 min-h-0 flex items-center justify-center overflow-hidden">
          <div className="relative aspect-square w-[min(240px,60vw)] max-h-full">
            <motion.div
              className="absolute inset-0 border border-border/40 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            />
            <div className="absolute inset-4 border border-border/60 rounded-full" />
            <motion.div
              className="absolute inset-8 border border-kadig-cyan/25 rounded-full"
              animate={{ scale: [1, 1.04, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <motion.div
                className="w-48 bg-card/40 backdrop-blur-xl border border-border rounded-2xl shadow-2xl flex flex-col p-4 gap-3"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <div className="flex justify-between items-center gap-2">
                  <div className="w-7 h-4 bg-muted rounded-sm shrink-0" />
                  <div className="text-[8px] font-semibold text-kadig-cyan tracking-wide whitespace-nowrap">KADIG INTELLIGENCE</div>
                </div>
                <div>
                  <div className="text-xl font-bold tracking-tight">R$ ?</div>
                  <div className="text-[9px] text-muted-foreground uppercase tracking-widest leading-snug">Potencial do seu patrimônio</div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Content */}
        <motion.div
          className="mt-auto shrink-0 space-y-5"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
        >
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold leading-tight tracking-tight">
              Seu dinheiro pode{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-kadig-cyan to-primary">
                trabalhar melhor.
              </span>
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-[300px] mx-auto">
              A Kadig analisa seu patrimônio, encontra oportunidades e riscos e ajuda você a tomar decisões melhores.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate("/auth")}
              className="w-full py-4 px-6 bg-gradient-to-r from-kadig-cyan to-primary text-primary-foreground font-semibold text-sm rounded-2xl shadow-xl shadow-primary/25 hover:opacity-90 active:scale-[0.98] transition-all"
            >
              Analisar meu patrimônio
            </button>
            <button
              onClick={() => navigate("/auth")}
              className="w-full py-2 text-sm font-medium text-muted-foreground hover:text-foreground active:scale-[0.98] transition-all"
            >
              Já tenho conta
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Welcome;
