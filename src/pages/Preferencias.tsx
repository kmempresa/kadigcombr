import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Moon, Sun } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/hooks/useTheme";
import { motion } from "framer-motion";

const Preferencias = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  
  // Notification states
  const [notifications, setNotifications] = useState({
    eventosCarteira: true,
    noticias: true,
    educacional: true,
    promocoes: true,
  });

  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className={`${theme === "light" ? "light-theme" : ""} min-h-screen bg-background`}>
      {/* Header */}
      <header className="flex items-center gap-4 p-4 safe-area-inset-top">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-card flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-xl font-semibold text-foreground">Preferências</h1>
      </header>

      <div className="p-4 space-y-8">
        {/* Aparência Section */}
        <section>
          <h2 className="text-center text-lg font-semibold text-foreground mb-6">Aparência</h2>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Modo Claro */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setTheme("light")}
              className={`relative rounded-2xl p-4 transition-all ${
                theme === "light" 
                  ? "bg-muted ring-2 ring-primary" 
                  : "bg-card"
              }`}
            >
              {/* Checkmark */}
              <div className={`absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center ${
                theme === "light" 
                  ? "bg-primary" 
                  : "bg-muted border-2 border-border"
              }`}>
                {theme === "light" && <Check className="w-4 h-4 text-primary-foreground" />}
              </div>
              
              {/* Phone Preview Light */}
              <div className="bg-card rounded-xl p-3 mb-3 border border-border">
                <div className="flex items-center gap-1 mb-2">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground/40" />
                  <div className="flex-1" />
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <div className="w-2 h-2 rounded-full bg-primary" />
                </div>
                <div className="flex items-center justify-center py-4">
                  <div className="relative w-16 h-16">
                    {/* Colorful ring chart */}
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      <circle cx="50" cy="50" r="35" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                      <circle cx="50" cy="50" r="35" fill="none" stroke="hsl(32 95% 44%)" strokeWidth="8" strokeDasharray="70 150" />
                      <circle cx="50" cy="50" r="25" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                      <circle cx="50" cy="50" r="25" fill="none" stroke="hsl(280 70% 50%)" strokeWidth="8" strokeDasharray="50 150" />
                      <circle cx="50" cy="50" r="15" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                      <circle cx="50" cy="50" r="15" fill="none" stroke="hsl(var(--primary))" strokeWidth="8" strokeDasharray="30 150" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sun className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <div className="h-1 flex-1 bg-primary rounded-full" />
                  <div className="h-1 flex-1 bg-muted rounded-full" />
                  <div className="h-1 flex-1 bg-muted rounded-full" />
                </div>
              </div>
              
              <span className="text-sm font-medium text-muted-foreground">Modo claro</span>
            </motion.button>

            {/* Modo Escuro */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setTheme("dark")}
              className={`relative rounded-2xl p-4 transition-all ${
                theme === "dark" 
                  ? "bg-secondary ring-2 ring-primary" 
                  : "bg-card"
              }`}
            >
              {/* Checkmark */}
              <div className={`absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center ${
                theme === "dark" 
                  ? "bg-primary" 
                  : "bg-muted border-2 border-border"
              }`}>
                {theme === "dark" && <Check className="w-4 h-4 text-primary-foreground" />}
              </div>
              
              {/* Phone Preview Dark */}
              <div className="bg-[hsl(220_50%_12%)] rounded-xl p-3 mb-3 border border-[hsl(220_40%_20%)]">
                <div className="flex items-center gap-1 mb-2">
                  <div className="w-2 h-2 rounded-full bg-[hsl(210_20%_70%/0.4)]" />
                  <div className="flex-1" />
                  <div className="w-2 h-2 rounded-full bg-[hsl(210_100%_60%)]" />
                  <div className="w-2 h-2 rounded-full bg-[hsl(210_100%_60%)]" />
                </div>
                <div className="flex items-center justify-center py-4">
                  <div className="relative w-16 h-16">
                    {/* Colorful ring chart */}
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      <circle cx="50" cy="50" r="35" fill="none" stroke="hsl(220 40% 20%)" strokeWidth="8" />
                      <circle cx="50" cy="50" r="35" fill="none" stroke="hsl(32 95% 44%)" strokeWidth="8" strokeDasharray="70 150" />
                      <circle cx="50" cy="50" r="25" fill="none" stroke="hsl(220 40% 20%)" strokeWidth="8" />
                      <circle cx="50" cy="50" r="25" fill="none" stroke="hsl(280 70% 50%)" strokeWidth="8" strokeDasharray="50 150" />
                      <circle cx="50" cy="50" r="15" fill="none" stroke="hsl(220 40% 20%)" strokeWidth="8" />
                      <circle cx="50" cy="50" r="15" fill="none" stroke="hsl(210 100% 60%)" strokeWidth="8" strokeDasharray="30 150" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Moon className="w-5 h-5 text-[hsl(210_20%_70%)]" />
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <div className="h-1 flex-1 bg-[hsl(210_100%_60%)] rounded-full" />
                  <div className="h-1 flex-1 bg-[hsl(220_40%_20%)] rounded-full" />
                  <div className="h-1 flex-1 bg-[hsl(220_40%_20%)] rounded-full" />
                </div>
              </div>
              
              <span className="text-sm font-medium text-muted-foreground">Modo escuro</span>
            </motion.button>
          </div>
        </section>

        {/* Notificações Section */}
        <section>
          <h2 className="text-center text-lg font-semibold text-foreground mb-2">Notificações</h2>
          <p className="text-center text-sm text-muted-foreground mb-6">
            Controle as informações que você deseja receber.
          </p>
          
          <div className="space-y-2">
            {[
              { key: "eventosCarteira", label: "Eventos da Carteira" },
              { key: "noticias", label: "Notícias" },
              { key: "educacional", label: "Educacional" },
              { key: "promocoes", label: "Promoções" },
            ].map((item) => (
              <div 
                key={item.key}
                className="flex items-center justify-between py-4 px-4 bg-card rounded-xl"
              >
                <span className="font-medium text-foreground">{item.label}</span>
                <Switch
                  checked={notifications[item.key as keyof typeof notifications]}
                  onCheckedChange={() => handleNotificationChange(item.key as keyof typeof notifications)}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Preferencias;
