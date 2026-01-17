import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, ArrowRight, UserPlus } from "lucide-react";
import kadigLogo from "@/assets/kadig-logo.png";

const Auth = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) return;
    setIsLoading(true);
    // Simulated login - will integrate with Supabase later
    setTimeout(() => {
      setIsLoading(false);
      navigate("/onboarding");
    }, 1000);
  };

  const handleSignup = () => {
    navigate("/onboarding");
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden fixed inset-0">
      {/* Background curved shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Top right curve */}
        <div className="absolute -top-32 -right-32 w-80 h-80 sm:w-96 sm:h-96">
          <svg viewBox="0 0 400 400" className="w-full h-full">
            <path
              d="M400,0 Q400,200 200,200 Q400,200 400,400 L400,0 Z"
              fill="hsl(var(--kadig-navy))"
              opacity="0.3"
            />
          </svg>
        </div>
        
        {/* Bottom right curve */}
        <div className="absolute -bottom-32 -right-20 w-72 h-96 sm:w-96 sm:h-[500px]">
          <svg viewBox="0 0 400 500" className="w-full h-full">
            <path
              d="M400,0 Q200,150 250,300 Q300,450 400,500 L400,0 Z"
              fill="hsl(var(--kadig-navy))"
              opacity="0.2"
            />
          </svg>
        </div>

        {/* Subtle glow */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col px-5 sm:px-6 safe-area-inset-top safe-area-inset-bottom">
        {/* Header with logo */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="pt-8 sm:pt-12"
        >
          <img src={kadigLogo} alt="Kadig" className="h-12 sm:h-14" />
        </motion.header>

        {/* Main content */}
        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex-1 flex flex-col pt-8 sm:pt-12"
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
          <div className="space-y-4 max-w-md">
            {/* Email input */}
            <div className="relative">
              <Input
                type="email"
                placeholder="E-mail:"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-14 sm:h-16 px-5 bg-card/80 border-border rounded-2xl text-base placeholder:text-muted-foreground focus:border-primary"
              />
            </div>

            {/* Password input */}
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Senha:"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-14 sm:h-16 px-5 pr-14 bg-card/80 border-border rounded-2xl text-base placeholder:text-muted-foreground focus:border-primary"
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
              className="flex-1 h-14 sm:h-16 px-4 bg-secondary/50 backdrop-blur-sm border border-border rounded-2xl flex items-center justify-center gap-3 hover:bg-secondary/70 active:scale-[0.98] transition-all"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <span className="text-foreground font-medium text-sm sm:text-base">Criar conta</span>
            </button>

            {/* Login button */}
            <button
              onClick={handleLogin}
              disabled={isLoading || !email.trim() || !password.trim()}
              className="flex-1 h-14 sm:h-16 px-4 bg-secondary/50 backdrop-blur-sm border border-border rounded-2xl flex items-center justify-center gap-3 hover:bg-secondary/70 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-primary to-kadig-cyan flex items-center justify-center">
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <span className="text-foreground font-medium text-sm sm:text-base">
                {isLoading ? "Entrando..." : "Entrar"}
              </span>
            </button>
          </div>

          {/* Forgot password */}
          <button className="w-full py-3 text-muted-foreground hover:text-foreground transition-colors text-sm sm:text-base">
            Esqueceu a senha?
          </button>
        </motion.footer>
      </div>
    </div>
  );
};

export default Auth;
