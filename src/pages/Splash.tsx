import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import kadigLogo from "@/assets/kadig-logo.png";

const Splash = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<"spinning" | "settling" | "done">("spinning");

  useEffect(() => {
    const spinTimer = setTimeout(() => setPhase("settling"), 2000);
    const settleTimer = setTimeout(() => setPhase("done"), 3000);
    const navTimer = setTimeout(() => navigate("/welcome"), 3500);

    return () => {
      clearTimeout(spinTimer);
      clearTimeout(settleTimer);
      clearTimeout(navTimer);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center overflow-hidden fixed inset-0">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-primary/30 rounded-full"
            initial={{
              x: `${Math.random() * 100}%`,
              y: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [`${Math.random() * 100}%`, `${Math.random() * 100 - 50}%`],
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
        className="absolute w-48 h-48 sm:w-64 sm:h-64 bg-primary/20 rounded-full blur-3xl"
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
              className="w-24 h-24 sm:w-32 sm:h-32 object-contain drop-shadow-2xl"
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
              className="w-24 h-24 sm:w-32 sm:h-32 object-contain drop-shadow-2xl"
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
              className="w-24 h-24 sm:w-32 sm:h-32 object-contain drop-shadow-2xl"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading indicator */}
      <motion.div
        className="absolute bottom-16 sm:bottom-20 flex flex-col items-center gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-primary rounded-full"
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
          className="text-muted-foreground text-sm"
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
