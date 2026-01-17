import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import kadigLogo from "@/assets/kadig-logo.png";

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative overflow-hidden fixed inset-0">
      {/* Gradient background - Kadig colors */}
      <div className="absolute inset-0 bg-gradient-to-b from-kadig-navy via-background to-kadig-deep" />
      
      {/* Animated geometric shapes - Kadig blue/cyan theme */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Large floating rectangles */}
        <motion.div
          className="absolute -top-16 -left-8 w-32 h-64 sm:w-40 sm:h-80 bg-gradient-to-b from-primary/25 to-kadig-cyan/15 rounded-3xl rotate-12"
          animate={{
            y: [0, 20, 0],
            rotate: [12, 15, 12],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-8 left-16 w-24 h-48 sm:w-32 sm:h-64 bg-gradient-to-b from-kadig-light/20 to-primary/10 rounded-3xl rotate-6"
          animate={{
            y: [0, -15, 0],
            rotate: [6, 3, 6],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        />
        <motion.div
          className="absolute -top-8 right-4 w-28 h-56 sm:w-36 sm:h-72 bg-gradient-to-b from-kadig-cyan/15 to-primary/10 rounded-3xl -rotate-6"
          animate={{
            y: [0, 25, 0],
            rotate: [-6, -10, -6],
          }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        <motion.div
          className="absolute top-24 right-20 w-20 h-40 sm:w-28 sm:h-56 bg-gradient-to-b from-primary/15 to-kadig-light/10 rounded-3xl rotate-3"
          animate={{
            y: [0, -20, 0],
            rotate: [3, 8, 3],
          }}
          transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
        />
        
        {/* Logo icon floating */}
        <motion.div
          className="absolute top-60 sm:top-80 left-4 sm:left-8 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary/30 to-kadig-cyan/25 rounded-2xl flex items-center justify-center backdrop-blur-sm"
          animate={{
            y: [0, -10, 0],
            rotate: [0, 5, 0],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <motion.img
            src={kadigLogo}
            alt=""
            className="w-8 h-8 sm:w-10 sm:h-10 object-contain opacity-80"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />
        </motion.div>
      </div>

      {/* Bottom gradient overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-2/3">
        <div className="absolute inset-0 bg-gradient-to-t from-kadig-deep via-background/80 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col justify-end pb-8 sm:pb-12 px-5 sm:px-6 safe-area-inset-bottom">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="space-y-4 sm:space-y-6 mb-6 sm:mb-8"
        >
          <motion.p
            className="text-primary text-base sm:text-lg font-medium"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            Olá! Que bom te ver aqui.
          </motion.p>
          
          <motion.h1
            className="text-foreground text-2xl sm:text-3xl md:text-4xl font-bold leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            Sua jornada como investidor fica mais inteligente com a Kadig.
          </motion.h1>
          
          <motion.p
            className="text-muted-foreground text-base sm:text-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
          >
            Vamos começar?
          </motion.p>
        </motion.div>

        {/* Buttons */}
        <motion.div
          className="flex gap-3 sm:gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.1 }}
        >
          <button
            onClick={() => navigate("/onboarding")}
            className="flex-1 py-3.5 sm:py-4 px-4 sm:px-6 bg-secondary/50 backdrop-blur-sm border border-border text-foreground font-semibold rounded-xl hover:bg-secondary/70 active:scale-[0.98] transition-all duration-200"
          >
            Fazer login
          </button>
          <button
            onClick={() => navigate("/onboarding")}
            className="flex-1 py-3.5 sm:py-4 px-4 sm:px-6 bg-gradient-to-r from-primary to-kadig-cyan text-primary-foreground font-semibold rounded-xl hover:opacity-90 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-primary/30"
          >
            Criar conta
          </button>
        </motion.div>

        {/* Bottom safe area for mobile */}
        <div className="h-6 sm:h-4" />
      </div>
    </div>
  );
};

export default Welcome;
