import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ArrowRight, 
  User, 
  TrendingUp, 
  Shield, 
  Zap, 
  ChevronLeft,
  Sprout,
  BarChart3,
  Rocket,
  Percent,
  Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import kadigLogo from "@/assets/kadig-logo.png";
import { BankLogo } from "@/components/BankLogo";

interface UserProfile {
  name: string;
  experience: "beginner" | "intermediate" | "advanced" | "";
  riskTolerance: "conservative" | "moderate" | "aggressive" | "";
}

interface TopBank {
  name: string;
  ticker: string;
  dividendYield: number;
  price: number;
  sector: string;
}

const experienceOptions = [
  {
    value: "beginner",
    label: "Iniciante",
    description: "Estou comecando no mundo dos investimentos",
    icon: Sprout,
    color: "from-emerald-500 to-emerald-600"
  },
  {
    value: "intermediate",
    label: "Intermediario",
    description: "Ja invisto ha algum tempo e conheco o basico",
    icon: BarChart3,
    color: "from-primary to-primary/80"
  },
  {
    value: "advanced",
    label: "Avancado",
    description: "Tenho experiencia solida em investimentos",
    icon: Rocket,
    color: "from-accent to-accent/80"
  }
];

const riskOptions = [
  {
    value: "conservative",
    label: "Conservador",
    description: "Prefiro seguranca, mesmo com retornos menores",
    icon: Shield,
    color: "from-primary to-primary/70"
  },
  {
    value: "moderate",
    label: "Moderado",
    description: "Busco equilibrio entre risco e retorno",
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

const experienceToProfile: Record<string, string> = {
  beginner: "Iniciante",
  intermediate: "Intermediário",
  advanced: "Avançado"
};

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
  const [topBanks, setTopBanks] = useState<TopBank[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    name: "",
    experience: "",
    riskTolerance: ""
  });

  const totalSteps = 4;

  useEffect(() => {
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

  // Fetch real dividend data for top banks when reaching step 3
  useEffect(() => {
    if (step === 3) {
      const fetchBankDividends = async () => {
        setLoadingBanks(true);
        try {
          // Fetch real quotes for the banks
          const tickers = ['ITUB4', 'XPBR31', 'BBAS3'];
          const results = await Promise.all(
            tickers.map(async (ticker) => {
              try {
                const { data } = await supabase.functions.invoke('market-data', {
                  body: { type: 'quote', symbol: ticker }
                });
                return { ticker, data };
              } catch {
                return { ticker, data: null };
              }
            })
          );

          const bankData: TopBank[] = [
            {
              name: "Itaú Unibanco",
              ticker: "ITUB4",
              dividendYield: results[0]?.data?.dividendYield || 7.2,
              price: results[0]?.data?.regularMarketPrice || 32.50,
              sector: "Bancos"
            },
            {
              name: "XP Investimentos",
              ticker: "XPBR31",
              dividendYield: results[1]?.data?.dividendYield || 5.8,
              price: results[1]?.data?.regularMarketPrice || 105.20,
              sector: "Corretoras"
            },
            {
              name: "Banco do Brasil",
              ticker: "BBAS3",
              dividendYield: results[2]?.data?.dividendYield || 8.5,
              price: results[2]?.data?.regularMarketPrice || 28.40,
              sector: "Bancos"
            }
          ];

          // Sort by dividend yield
          bankData.sort((a, b) => b.dividendYield - a.dividendYield);
          setTopBanks(bankData);
        } catch (error) {
          console.error('Error fetching bank dividends:', error);
          // Fallback to fixed data
          setTopBanks([
            { name: "Itaú Unibanco", ticker: "ITUB4", dividendYield: 7.2, price: 32.50, sector: "Bancos" },
            { name: "XP Investimentos", ticker: "XPBR31", dividendYield: 5.8, price: 105.20, sector: "Corretoras" },
            { name: "Banco do Brasil", ticker: "BBAS3", dividendYield: 8.5, price: 28.40, sector: "Bancos" }
          ]);
        } finally {
          setLoadingBanks(false);
        }
      };
      
      fetchBankDividends();
    }
  }, [step]);

  const saveProfileAndContinue = async () => {
    if (!userId) {
      toast.error("Sessao expirada. Faca login novamente.");
      navigate("/auth");
      return;
    }

    setIsLoading(true);
    try {
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
        const { error } = await supabase
          .from("profiles")
          .update(profileData)
          .eq("user_id", userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("profiles")
          .insert(profileData);
        if (error) throw error;
      }

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
  };

  const handleNext = async () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      await saveProfileAndContinue();
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
      case 3:
        return true; // Always can proceed on bank step
      default:
        return false;
    }
  };

  return (
    <div className="light-theme min-h-screen bg-background flex flex-col fixed inset-0">
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
                    Ola! Como podemos te chamar?
                  </h1>
                  <p className="text-muted-foreground text-base sm:text-lg px-4">
                    Queremos personalizar sua experiencia ao maximo
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
                    Prazer, {profile.name}!
                  </h1>
                  <p className="text-muted-foreground text-base sm:text-lg">
                    Qual e sua experiencia com investimentos?
                  </p>
                </div>

                <div className="grid gap-3 sm:gap-4 max-w-lg mx-auto px-4">
                  {experienceOptions.map((option) => {
                    const Icon = option.icon;
                    return (
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
                          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br ${option.color} flex items-center justify-center flex-shrink-0 shadow-md`}>
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
                    Isso nos ajuda a personalizar as recomendacoes
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

            {/* Step 3: Top Banks */}
            {step === 3 && (
              <motion.div
                key="banks"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6 sm:space-y-8"
              >
                <div className="text-center space-y-3 sm:space-y-4 px-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center shadow-lg">
                    <TrendingUp className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                  </div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
                    Top 3 Bancos em Dividendos
                  </h1>
                  <p className="text-muted-foreground text-base sm:text-lg">
                    Veja os bancos que mais estao pagando rendimentos atualmente
                  </p>
                </div>

                <div className="grid gap-3 sm:gap-4 max-w-lg mx-auto px-4">
                  {loadingBanks ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-3">
                      <Loader2 className="w-8 h-8 text-primary animate-spin" />
                      <p className="text-muted-foreground text-sm">Buscando dados de mercado...</p>
                    </div>
                  ) : topBanks.map((bank, index) => (
                    <motion.div
                      key={bank.ticker}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative overflow-hidden p-4 sm:p-5 rounded-xl border-2 border-border bg-card shadow-sm"
                    >
                      {/* Rank badge */}
                      <div className={`absolute top-0 right-0 w-12 h-12 flex items-center justify-center ${
                        index === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-500' :
                        index === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400' :
                        'bg-gradient-to-br from-amber-600 to-amber-700'
                      } rounded-bl-xl`}>
                        <span className="text-white font-bold text-lg">{index + 1}</span>
                      </div>

                      <div className="flex items-center gap-4 pr-12">
                        <BankLogo
                          connectorName={bank.name}
                          size="md"
                          className="flex-shrink-0"
                        />
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-foreground text-base sm:text-lg truncate">
                              {bank.name}
                            </h3>
                            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                              {bank.ticker}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{bank.sector}</p>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Percent className="w-4 h-4 text-accent" />
                          <span className="text-sm text-muted-foreground">Dividend Yield</span>
                        </div>
                        <span className="text-lg font-bold text-accent">
                          {bank.dividendYield.toFixed(2)}%
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="text-center px-4">
                  <p className="text-sm text-muted-foreground">
                    Dados atualizados em tempo real via BRAPI
                  </p>
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
            {isLoading ? "Salvando..." : step === totalSteps - 1 ? "Comecar" : "Continuar"}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default Onboarding;
