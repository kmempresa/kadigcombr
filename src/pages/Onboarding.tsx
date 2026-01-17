import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, User, TrendingUp, Shield, Zap, ChevronLeft } from "lucide-react";
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
    color: "from-blue-500 to-cyan-500"
  },
  {
    value: "moderate",
    label: "Moderado",
    description: "Busco equilíbrio entre risco e retorno",
    icon: TrendingUp,
    color: "from-primary to-cyan-400"
  },
  {
    value: "aggressive",
    label: "Arrojado",
    description: "Aceito mais risco por retornos maiores",
    icon: Zap,
    color: "from-orange-500 to-red-500"
  }
];

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<UserProfile>({
    name: "",
    experience: "",
    riskTolerance: ""
  });

  const totalSteps = 3;

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      // Save profile to localStorage and navigate to app
      localStorage.setItem("kadig-user-profile", JSON.stringify(profile));
      navigate("/app");
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 p-6">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <img src={kadigLogo} alt="Kadig" className="h-10" />
          <div className="flex gap-2">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === step
                    ? "w-8 bg-primary"
                    : i < step
                    ? "w-2 bg-primary/60"
                    : "w-2 bg-muted"
                }`}
              />
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            {/* Step 0: Name */}
            {step === 0 && (
              <motion.div
                key="name"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 mx-auto bg-primary/20 rounded-full flex items-center justify-center">
                    <User className="w-10 h-10 text-primary" />
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                    Olá! Como podemos te chamar?
                  </h1>
                  <p className="text-muted-foreground text-lg">
                    Queremos personalizar sua experiência ao máximo
                  </p>
                </div>

                <div className="max-w-md mx-auto">
                  <Input
                    type="text"
                    placeholder="Digite seu nome..."
                    value={profile.name}
                    onChange={(e) =>
                      setProfile({ ...profile, name: e.target.value })
                    }
                    className="text-center text-xl h-14 bg-card/50 border-primary/30 focus:border-primary"
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
                className="space-y-8"
              >
                <div className="text-center space-y-4">
                  <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                    Prazer, {profile.name}! 👋
                  </h1>
                  <p className="text-muted-foreground text-lg">
                    Qual é sua experiência com investimentos?
                  </p>
                </div>

                <div className="grid gap-4 max-w-lg mx-auto">
                  {experienceOptions.map((option) => (
                    <motion.button
                      key={option.value}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() =>
                        setProfile({
                          ...profile,
                          experience: option.value as UserProfile["experience"]
                        })
                      }
                      className={`p-5 rounded-xl border-2 text-left transition-all ${
                        profile.experience === option.value
                          ? "border-primary bg-primary/10"
                          : "border-border bg-card/50 hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-3xl">{option.icon}</span>
                        <div>
                          <h3 className="font-semibold text-foreground text-lg">
                            {option.label}
                          </h3>
                          <p className="text-muted-foreground text-sm">
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
                className="space-y-8"
              >
                <div className="text-center space-y-4">
                  <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                    Qual seu perfil de risco?
                  </h1>
                  <p className="text-muted-foreground text-lg">
                    Isso nos ajuda a personalizar as recomendações do Consultor Kadig
                  </p>
                </div>

                <div className="grid gap-4 max-w-lg mx-auto">
                  {riskOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <motion.button
                        key={option.value}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() =>
                          setProfile({
                            ...profile,
                            riskTolerance: option.value as UserProfile["riskTolerance"]
                          })
                        }
                        className={`p-5 rounded-xl border-2 text-left transition-all ${
                          profile.riskTolerance === option.value
                            ? "border-primary bg-primary/10"
                            : "border-border bg-card/50 hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-12 h-12 rounded-full bg-gradient-to-br ${option.color} flex items-center justify-center`}
                          >
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground text-lg">
                              {option.label}
                            </h3>
                            <p className="text-muted-foreground text-sm">
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
      <footer className="relative z-10 p-6">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={step === 0}
            className="text-muted-foreground"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className="bg-gradient-to-r from-primary to-cyan-500 hover:opacity-90 text-white px-8"
          >
            {step === totalSteps - 1 ? "Começar" : "Continuar"}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default Onboarding;
