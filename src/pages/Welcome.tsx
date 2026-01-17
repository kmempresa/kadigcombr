import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import kadigLogo from "@/assets/kadig-logo.png";

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900 via-purple-800/90 to-slate-900" />
      
      {/* Animated geometric shapes */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Large floating rectangles */}
        <motion.div
          className="absolute -top-20 -left-10 w-40 h-80 bg-gradient-to-b from-purple-400/30 to-cyan-400/20 rounded-3xl rotate-12"
          animate={{
            y: [0, 20, 0],
            rotate: [12, 15, 12],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-10 left-20 w-32 h-64 bg-gradient-to-b from-purple-300/25 to-pink-400/15 rounded-3xl rotate-6"
          animate={{
            y: [0, -15, 0],
            rotate: [6, 3, 6],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        />
        <motion.div
          className="absolute -top-10 right-10 w-36 h-72 bg-gradient-to-b from-pink-300/20 to-purple-400/15 rounded-3xl -rotate-6"
          animate={{
            y: [0, 25, 0],
            rotate: [-6, -10, -6],
          }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        <motion.div
          className="absolute top-32 right-32 w-28 h-56 bg-gradient-to-b from-purple-200/20 to-cyan-300/10 rounded-3xl rotate-3"
          animate={{
            y: [0, -20, 0],
            rotate: [3, 8, 3],
          }}
          transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
        />
        
        {/* Logo icon floating */}
        <motion.div
          className="absolute top-80 left-8 w-20 h-20 bg-gradient-to-br from-cyan-400/40 to-cyan-600/30 rounded-2xl flex items-center justify-center"
          animate={{
            y: [0, -10, 0],
            rotate: [0, 5, 0],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <motion.img
            src={kadigLogo}
            alt=""
            className="w-10 h-10 object-contain opacity-80"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />
        </motion.div>
      </div>

      {/* Sunset silhouette gradient overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-2/3">
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-purple-900/80 to-transparent" />
        {/* Mountain silhouette effect */}
        <svg
          className="absolute bottom-32 w-full h-48 opacity-30"
          viewBox="0 0 1200 200"
          preserveAspectRatio="none"
        >
          <path
            d="M0,200 L0,120 Q150,80 300,100 T600,90 T900,110 T1200,80 L1200,200 Z"
            fill="currentColor"
            className="text-slate-800"
          />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col justify-end pb-12 px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="space-y-6 mb-8"
        >
          <motion.p
            className="text-cyan-400 text-lg font-medium"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            Olá! Que bom te ver aqui.
          </motion.p>
          
          <motion.h1
            className="text-white text-3xl md:text-4xl font-bold leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            Sua jornada como investidor fica mais inteligente com a Kadig.
          </motion.h1>
          
          <motion.p
            className="text-white/70 text-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
          >
            Vamos começar?
          </motion.p>
        </motion.div>

        {/* Buttons */}
        <motion.div
          className="flex gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.1 }}
        >
          <button
            onClick={() => navigate("/onboarding")}
            className="flex-1 py-4 px-6 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 transition-all duration-300"
          >
            Fazer login
          </button>
          <button
            onClick={() => navigate("/onboarding")}
            className="flex-1 py-4 px-6 bg-gradient-to-r from-cyan-500 to-cyan-400 text-slate-900 font-semibold rounded-xl hover:from-cyan-400 hover:to-cyan-300 transition-all duration-300 shadow-lg shadow-cyan-500/30"
          >
            Criar conta
          </button>
        </motion.div>

        {/* Bottom safe area for mobile */}
        <div className="h-4" />
      </div>
    </div>
  );
};

export default Welcome;
