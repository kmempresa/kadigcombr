import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import kadigLogo from "@/assets/kadig-logo.png";

const Splash = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<"spinning" | "settling" | "done">("spinning");

  useEffect(() => {
    // Phase 1: Spinning for 2 seconds
    const spinTimer = setTimeout(() => {
      setPhase("settling");
    }, 2000);

    // Phase 2: Settle animation for 1 second, then navigate
    const settleTimer = setTimeout(() => {
      setPhase("done");
    }, 3000);

    // Navigate to welcome after animation completes
    const navTimer = setTimeout(() => {
      navigate("/welcome");
    }, 3500);

    return () => {
      clearTimeout(spinTimer);
      clearTimeout(settleTimer);
      clearTimeout(navTimer);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-cyan-400/30 rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              y: [null, Math.random() * -200 - 100],
              opacity: [0.3, 0],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Glow effect behind logo */}
      <motion.div
        className="absolute w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <AnimatePresence mode="wait">
        {phase === "spinning" && (
          <motion.div
            key="spinning"
            className="relative z-10"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.img
              src={kadigLogo}
              alt="Kadig"
              className="w-32 h-32 object-contain drop-shadow-2xl"
              animate={{ rotate: 360 }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          </motion.div>
        )}

        {phase === "settling" && (
          <motion.div
            key="settling"
            className="relative z-10"
            initial={{ rotate: 0 }}
            animate={{ rotate: [0, -10, 5, -3, 0] }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.img
              src={kadigLogo}
              alt="Kadig"
              className="w-32 h-32 object-contain drop-shadow-2xl"
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5 }}
            />
          </motion.div>
        )}

        {phase === "done" && (
          <motion.div
            key="done"
            className="relative z-10"
            initial={{ scale: 1, opacity: 1 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <img
              src={kadigLogo}
              alt="Kadig"
              className="w-32 h-32 object-contain drop-shadow-2xl"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading indicator */}
      <motion.div
        className="absolute bottom-20 flex flex-col items-center gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-cyan-400 rounded-full"
              animate={{
                y: [-5, 5, -5],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
        <motion.p
          className="text-white/60 text-sm"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Carregando...
        </motion.p>
      </motion.div>
    </div>
  );
};

export default Splash;
