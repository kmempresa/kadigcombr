import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import kadigLogo from "@/assets/kadig-logo.png";
import { useSecureAuth } from "@/hooks/useSecureAuth";
import { supabase } from "@/integrations/supabase/client";
import { Fingerprint } from "lucide-react";

type SplashPhase = "spinning" | "settling" | "biometric" | "done";

const Splash = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<SplashPhase>("spinning");
  const [showBiometricPrompt, setShowBiometricPrompt] = useState(false);
  const { 
    attemptAutoLogin, 
    completeLoginWithBiometric,
    biometricEnabled,
    loadPreferences
  } = useSecureAuth();

  useEffect(() => {
    let cancelled = false;

    const checkAuthAndNavigate = async () => {
      try {
        // Wait for initial animation
        await new Promise(resolve => setTimeout(resolve, 2000));
        if (cancelled) return;

        setPhase("settling");
        await new Promise(resolve => setTimeout(resolve, 500));
        if (cancelled) return;

        // Load preferences with timeout to prevent hanging on iOS
        const loadPrefsWithTimeout = Promise.race([
          loadPreferences(),
          new Promise(resolve => setTimeout(resolve, 2000)) // 2s timeout
        ]);
        await loadPrefsWithTimeout;

        // Check for existing Supabase session with timeout
        let session = null;
        try {
          const sessionResult = await Promise.race([
            supabase.auth.getSession(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
          ]) as { data: { session: any } };
          session = sessionResult?.data?.session;
        } catch (error) {
          console.log("Session check timeout or error:", error);
        }
        
        if (session) {
          // User is already logged in via Supabase
          setPhase("done");
          await new Promise(resolve => setTimeout(resolve, 500));
          if (cancelled) return;
          
          // Check if user has completed onboarding with timeout
          try {
            const profileResult = await Promise.race([
              supabase
                .from("profiles")
                .select("full_name, investor_profile")
                .eq("user_id", session.user.id)
                .single(),
              new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
            ]) as { data: any };

            if (profileResult?.data?.full_name && profileResult?.data?.investor_profile) {
              navigate("/app");
            } else {
              navigate("/onboarding");
            }
          } catch (error) {
            console.log("Profile check error:", error);
            navigate("/onboarding");
          }
          return;
        }

        // No active session, try to restore from stored tokens with timeout
        let autoLoginResult = { hasSession: false, requiresBiometric: false, success: false };
        try {
          autoLoginResult = await Promise.race([
            attemptAutoLogin(),
            new Promise<typeof autoLoginResult>((resolve) => 
              setTimeout(() => resolve({ hasSession: false, requiresBiometric: false, success: false }), 3000)
            )
          ]);
        } catch (error) {
          console.log("Auto login error:", error);
        }

        if (!autoLoginResult.hasSession) {
          // No stored session, go to welcome
          setPhase("done");
          await new Promise(resolve => setTimeout(resolve, 500));
          if (cancelled) return;
          navigate("/welcome");
          return;
        }

        if (autoLoginResult.requiresBiometric) {
          // Show biometric prompt
          setPhase("biometric");
          setShowBiometricPrompt(true);
          return;
        }

        if (autoLoginResult.success) {
          // Session restored successfully
          setPhase("done");
          await new Promise(resolve => setTimeout(resolve, 500));
          if (cancelled) return;
          navigate("/app");
        } else {
          // Failed to restore session
          setPhase("done");
          await new Promise(resolve => setTimeout(resolve, 500));
          if (cancelled) return;
          navigate("/welcome");
        }
      } catch (error) {
        console.error("Splash navigation error:", error);
        // Fallback: go to welcome on any error
        setPhase("done");
        await new Promise(resolve => setTimeout(resolve, 300));
        if (!cancelled) {
          navigate("/welcome");
        }
      }
    };

    checkAuthAndNavigate();

    return () => {
      cancelled = true;
    };
  }, [navigate, attemptAutoLogin, loadPreferences]);

  const handleBiometricAuth = async () => {
    const success = await completeLoginWithBiometric();
    
    if (success) {
      setPhase("done");
      await new Promise(resolve => setTimeout(resolve, 500));
      navigate("/app");
    } else {
      // Biometric failed, go to login
      setPhase("done");
      await new Promise(resolve => setTimeout(resolve, 500));
      navigate("/auth");
    }
  };

  const handleSkipBiometric = () => {
    setPhase("done");
    setTimeout(() => navigate("/auth"), 500);
  };

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

        {phase === "biometric" && (
          <motion.div
            key="biometric"
            className="relative z-10 flex flex-col items-center gap-8 px-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.3 }}
          >
            <motion.img
              src={kadigLogo}
              alt="Kadig"
              className="w-20 h-20 object-contain drop-shadow-2xl"
            />
            
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold text-foreground">Bem-vindo de volta!</h2>
              <p className="text-muted-foreground text-sm">
                Use sua biometria para entrar
              </p>
            </div>

            <motion.button
              onClick={handleBiometricAuth}
              className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/30"
              whileTap={{ scale: 0.95 }}
              animate={{
                boxShadow: [
                  "0 10px 30px -10px rgba(59, 130, 246, 0.3)",
                  "0 10px 40px -10px rgba(59, 130, 246, 0.5)",
                  "0 10px 30px -10px rgba(59, 130, 246, 0.3)",
                ],
              }}
              transition={{
                boxShadow: { duration: 2, repeat: Infinity },
              }}
            >
              <Fingerprint className="w-10 h-10 text-white" />
            </motion.button>

            <button
              onClick={handleSkipBiometric}
              className="text-muted-foreground text-sm hover:text-foreground transition-colors"
            >
              Entrar com senha
            </button>
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

      {/* Loading indicator - hide during biometric */}
      {phase !== "biometric" && (
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
      )}
    </div>
  );
};

export default Splash;
