import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, User, TrendingUp, Shield, Zap, ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import kadigLogo from "@/assets/kadig-logo.png";

interface UserProfile {
  name: string;
  experience: "beginner" | "intermediate" | "advanced" | "";
  riskTolerance: "conservative" | "moderate" | "aggressive" | "";
}

const experienceOptions = [
  {
    value: "beginner",
    label: "Iniciante",
    description: "Estou começando no mundo dos investimentos",
    icon: "🌱"
  },
  {
    value: "intermediate",
    label: "Intermediário",
    description: "Já invisto há algum tempo e conheço o básico",
    icon: "📈"
  },
  {
    value: "advanced",
    label: "Avançado",
    description: "Tenho experiência sólida em investimentos",
    icon: "🚀"
  }
];

const riskOptions = [
  {
    value: "conservative",
    label: "Conservador",
    description: "Prefiro segurança, mesmo com retornos menores",
    icon: Shield,
    color: "from-primary to-primary/70"
  },
  {
    value: "moderate",
    label: "Moderado",
    description: "Busco equilíbrio entre risco e retorno",
    icon: TrendingUp,
    color: "from-primary to-accent"
  },
  {
    value: "aggressive",
    label: "Arrojado",
    description: "Aceito mais risco por retornos maiores",
    icon: Zap,
    color: "from-accent to-emerald-500"
  }
];

// Map experience to investor profile
const experienceToProfile: Record<string, string> = {
  beginner: "Iniciante",
  intermediate: "Intermediário",
  advanced: "Avançado"
};

// Map risk tolerance
const riskToleranceMap: Record<string, string> = {
  conservative: "Conservador",
  moderate: "Moderado",
  aggressive: "Arrojado"
};

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile>({
    name: "",
    experience: "",
    riskTolerance: ""
  });

  const totalSteps = 3;

  useEffect(() => {
    // Check if user is authenticated
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate("/auth");
        return;
      }
      setUserId(session.user.id);
    };
    checkUser();
  }, [navigate]);

  const handleNext = async () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      // Save profile to Supabase
      if (!userId) {
        toast.error("Sessão expirada. Faça login novamente.");
        navigate("/auth");
        return;
      }

      setIsLoading(true);
      try {
        // Check if profile exists
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", userId)
          .single();

        const profileData = {
          user_id: userId,
          full_name: profile.name.trim(),
          investor_profile: experienceToProfile[profile.experience],
          risk_tolerance: riskToleranceMap[profile.riskTolerance],
          updated_at: new Date().toISOString()
        };

        if (existingProfile) {
          // Update existing profile
          const { error } = await supabase
            .from("profiles")
            .update(profileData)
            .eq("user_id", userId);

          if (error) throw error;
        } else {
          // Insert new profile
          const { error } = await supabase
            .from("profiles")
            .insert(profileData);

          if (error) throw error;
        }

        // Also create a default portfolio for the user
        const { data: existingPortfolio } = await supabase
          .from("portfolios")
          .select("id")
          .eq("user_id", userId)
          .single();

        if (!existingPortfolio) {
          await supabase
            .from("portfolios")
            .insert({
              user_id: userId,
              name: "Principal",
              total_value: 0,
              total_gain: 0,
              cdi_percent: 0
            });
        }

        toast.success("Perfil criado com sucesso!");
        navigate("/app");
      } catch (error: any) {
        console.error("Error saving profile:", error);
        toast.error("Erro ao salvar perfil. Tente novamente.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    } else {
      navigate("/auth");
    }
  };

  const canProceed = () => {
    switch (step) {
      case 0:
        return profile.name.trim().length >= 2;
      case 1:
        return profile.experience !== "";
      case 2:
        return profile.riskTolerance !== "";
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col fixed inset-0">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 sm:w-96 sm:h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 p-4 sm:p-6 safe-area-inset-top">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center shadow-md">
            <img src={kadigLogo} alt="Kadig" className="h-5 sm:h-6" />
          </div>
          <div className="flex gap-1.5 sm:gap-2">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                  i === step
                    ? "w-6 sm:w-8 bg-primary"
                    : i < step
                    ? "w-1.5 sm:w-2 bg-primary/60"
                    : "w-1.5 sm:w-2 bg-muted"
                }`}
              />
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 relative z-10 overflow-y-auto">
        <div className="w-full max-w-md sm:max-w-2xl">
          <AnimatePresence mode="wait">
            {/* Step 0: Name */}
            {step === 0 && (
              <motion.div
                key="name"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6 sm:space-y-8"
              >
                <div className="text-center space-y-3 sm:space-y-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                  </div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
                    Olá! Como podemos te chamar?
                  </h1>
                  <p className="text-muted-foreground text-base sm:text-lg px-4">
                    Queremos personalizar sua experiência ao máximo
                  </p>
                </div>

                <div className="max-w-sm mx-auto px-4">
                  <Input
                    type="text"
                    placeholder="Digite seu nome..."
                    value={profile.name}
                    onChange={(e) =>
                      setProfile({ ...profile, name: e.target.value })
                    }
                    className="text-center text-lg sm:text-xl h-12 sm:h-14 bg-card border-border text-foreground focus:border-primary shadow-sm"
                    autoFocus
                  />
                </div>
              </motion.div>
            )}

            {/* Step 1: Experience */}
            {step === 1 && (
              <motion.div
                key="experience"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6 sm:space-y-8"
              >
                <div className="text-center space-y-3 sm:space-y-4 px-4">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
                    Prazer, {profile.name}! 👋
                  </h1>
                  <p className="text-muted-foreground text-base sm:text-lg">
                    Qual é sua experiência com investimentos?
                  </p>
                </div>

                <div className="grid gap-3 sm:gap-4 max-w-lg mx-auto px-4">
                  {experienceOptions.map((option) => (
                    <motion.button
                      key={option.value}
                      whileTap={{ scale: 0.98 }}
                      onClick={() =>
                        setProfile({
                          ...profile,
                          experience: option.value as UserProfile["experience"]
                        })
                      }
                      className={`p-4 sm:p-5 rounded-xl border-2 text-left transition-all shadow-sm ${
                        profile.experience === option.value
                          ? "border-primary bg-primary/5"
                          : "border-border bg-card active:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center gap-3 sm:gap-4">
                        <span className="text-2xl sm:text-3xl">{option.icon}</span>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground text-base sm:text-lg">
                            {option.label}
                          </h3>
                          <p className="text-muted-foreground text-sm line-clamp-2">
                            {option.description}
                          </p>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2: Risk Tolerance */}
            {step === 2 && (
              <motion.div
                key="risk"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6 sm:space-y-8"
              >
                <div className="text-center space-y-3 sm:space-y-4 px-4">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
                    Qual seu perfil de risco?
                  </h1>
                  <p className="text-muted-foreground text-base sm:text-lg">
                    Isso nos ajuda a personalizar as recomendações
                  </p>
                </div>

                <div className="grid gap-3 sm:gap-4 max-w-lg mx-auto px-4">
                  {riskOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <motion.button
                        key={option.value}
                        whileTap={{ scale: 0.98 }}
                        onClick={() =>
                          setProfile({
                            ...profile,
                            riskTolerance: option.value as UserProfile["riskTolerance"]
                          })
                        }
                        className={`p-4 sm:p-5 rounded-xl border-2 text-left transition-all shadow-sm ${
                          profile.riskTolerance === option.value
                            ? "border-primary bg-primary/5"
                            : "border-border bg-card active:border-primary/50"
                        }`}
                      >
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div
                            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br ${option.color} flex items-center justify-center flex-shrink-0 shadow-md`}
                          >
                            <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground text-base sm:text-lg">
                              {option.label}
                            </h3>
                            <p className="text-muted-foreground text-sm line-clamp-2">
                              {option.description}
                            </p>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer with navigation */}
      <footer className="relative z-10 p-4 sm:p-6 safe-area-inset-bottom">
        <div className="max-w-2xl mx-auto flex justify-between items-center gap-4">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="text-muted-foreground hover:text-foreground px-3 sm:px-4"
          >
            <ChevronLeft className="w-4 h-4 mr-1 sm:mr-2" />
            Voltar
          </Button>

          <Button
            onClick={handleNext}
            disabled={!canProceed() || isLoading}
            className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white px-6 sm:px-8 flex-1 max-w-[200px] shadow-md"
          >
            {isLoading ? "Salvando..." : step === totalSteps - 1 ? "Começar" : "Continuar"}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default Onboarding;
