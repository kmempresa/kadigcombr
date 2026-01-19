import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, ArrowRight, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import kadigLogo from "@/assets/kadig-logo.png";

const Auth = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) return;
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("E-mail ou senha incorretos");
        } else if (error.message.includes("Email not confirmed")) {
          toast.error("Por favor, confirme seu e-mail antes de entrar");
        } else {
          toast.error(error.message);
        }
        return;
      }

      if (data.user) {
        // Check if user has completed onboarding (has a profile)
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, investor_profile")
          .eq("user_id", data.user.id)
          .single();

        if (profile?.full_name && profile?.investor_profile) {
          // User has completed onboarding, go to dashboard
          navigate("/app");
        } else {
          // User needs to complete onboarding
          navigate("/onboarding");
        }
      }
    } catch (error) {
      toast.error("Erro ao fazer login. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!email.trim() || !password.trim()) {
      toast.error("Preencha e-mail e senha para criar sua conta");
      return;
    }

    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setIsSigningUp(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/onboarding`,
        },
      });

      if (error) {
        if (error.message.includes("User already registered")) {
          toast.error("Este e-mail já está cadastrado. Tente fazer login.");
        } else {
          toast.error(error.message);
        }
        return;
      }

      if (data.user) {
        toast.success("Conta criada com sucesso!");
        // Go to onboarding to complete profile
        navigate("/onboarding");
      }
    } catch (error) {
      toast.error("Erro ao criar conta. Tente novamente.");
    } finally {
      setIsSigningUp(false);
    }
  };

  return (
    <div className="light-theme min-h-screen bg-background relative overflow-hidden">
      {/* Background curved shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Top right curve */}
        <div className="absolute -top-32 -right-32 w-80 h-80 sm:w-96 sm:h-96">
          <svg viewBox="0 0 400 400" className="w-full h-full">
            <path
              d="M400,0 Q400,200 200,200 Q400,200 400,400 L400,0 Z"
              fill="hsl(var(--muted))"
              opacity="0.6"
            />
          </svg>
        </div>
        
        {/* Bottom right curve */}
        <div className="absolute -bottom-32 -right-20 w-72 h-96 sm:w-96 sm:h-[500px]">
          <svg viewBox="0 0 400 500" className="w-full h-full">
            <path
              d="M400,0 Q200,150 250,300 Q300,450 400,500 L400,0 Z"
              fill="hsl(var(--muted))"
              opacity="0.4"
            />
          </svg>
        </div>

        {/* Subtle gradient accent */}
        <div className="absolute top-1/3 left-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* Content - Centered on desktop */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-5 sm:px-6 safe-area-inset-top safe-area-inset-bottom">
        <div className="w-full max-w-md lg:max-w-lg">
        {/* Header with logo */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="pt-8 sm:pt-12"
        >
          {/* Kadig logo */}
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-kadig-navy to-background flex items-center justify-center shadow-lg">
            <img src={kadigLogo} alt="Kadig" className="h-8 sm:h-10" />
          </div>
        </motion.header>

        {/* Main content */}
        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex-1 flex flex-col pt-6 sm:pt-8"
        >
          {/* Title section */}
          <div className="space-y-2 mb-8 sm:mb-10">
            <p className="text-primary text-base sm:text-lg font-medium">
              Entre na Kadig ou crie uma conta
            </p>
            <h1 className="text-foreground text-2xl sm:text-3xl font-bold leading-tight">
              Informe seu e-mail de cadastro e senha.
            </h1>
          </div>

          {/* Form */}
          <div className="space-y-4">
            {/* Email input */}
            <div className="relative">
              <Input
                type="email"
                placeholder="E-mail:"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-14 sm:h-16 px-5 bg-card border-border rounded-2xl text-base text-foreground placeholder:text-muted-foreground focus:border-primary shadow-sm"
              />
            </div>

            {/* Password input */}
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Senha:"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-14 sm:h-16 px-5 pr-14 bg-card border-border rounded-2xl text-base text-foreground placeholder:text-muted-foreground focus:border-primary shadow-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
              >
                {showPassword ? (
                  <Eye className="w-5 h-5" />
                ) : (
                  <EyeOff className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </motion.main>

        {/* Footer with buttons */}
        <motion.footer
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="pb-8 sm:pb-12 space-y-4"
        >
          {/* Action buttons */}
          <div className="flex gap-3 sm:gap-4">
            {/* Signup button */}
            <button
              onClick={handleSignup}
              disabled={isSigningUp}
              className="flex-1 h-14 sm:h-16 px-4 bg-card border border-border rounded-2xl flex items-center justify-center gap-3 hover:bg-muted/50 active:scale-[0.98] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-secondary flex items-center justify-center">
                <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <span className="text-foreground font-medium text-sm sm:text-base">
                {isSigningUp ? "Criando..." : "Criar conta"}
              </span>
            </button>

            {/* Login button */}
            <button
              onClick={handleLogin}
              disabled={isLoading || !email.trim() || !password.trim()}
              className="flex-1 h-14 sm:h-16 px-4 bg-card border border-border rounded-2xl flex items-center justify-center gap-3 hover:bg-muted/50 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <span className="text-foreground font-medium text-sm sm:text-base">
                {isLoading ? "Entrando..." : "Entrar"}
              </span>
            </button>
          </div>

          {/* Forgot password */}
          <button className="w-full py-3 text-foreground hover:text-primary transition-colors text-sm sm:text-base font-medium">
            Esqueceu a senha?
          </button>
        </motion.footer>
        </div>
      </div>
    </div>
  );
};

export default Auth;
