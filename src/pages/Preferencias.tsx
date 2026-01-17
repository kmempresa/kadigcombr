import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/contexts/ThemeContext";

interface NotificationSetting {
  id: string;
  label: string;
  enabled: boolean;
}

const Preferencias = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  
  const [notifications, setNotifications] = useState<NotificationSetting[]>([
    { id: "eventos", label: "Eventos da Carteira", enabled: true },
    { id: "noticias", label: "Notícias", enabled: true },
    { id: "educacional", label: "Educacional", enabled: true },
    { id: "promocoes", label: "Promoções", enabled: true },
  ]);

  const toggleNotification = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, enabled: !n.enabled } : n)
    );
  };

  // Phone mockup SVG component
  const PhoneMockup = ({ isDark }: { isDark: boolean }) => (
    <div className={`relative w-24 h-40 rounded-2xl ${isDark ? 'bg-[#1a2332]' : 'bg-white'} shadow-lg border ${isDark ? 'border-slate-600' : 'border-slate-200'} overflow-hidden`}>
      {/* Status bar dots */}
      <div className="flex items-center justify-between px-3 pt-2">
        <div className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-slate-500' : 'bg-slate-300'}`} />
        <div className="flex gap-1">
          <div className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-cyan-400' : 'bg-cyan-500'}`} />
          <div className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-cyan-400' : 'bg-cyan-500'}`} />
        </div>
      </div>
      
      {/* Circular chart mockup */}
      <div className="flex justify-center mt-3">
        <div className="relative w-12 h-12">
          <svg viewBox="0 0 48 48" className="w-full h-full">
            {/* Background circle */}
            <circle
              cx="24"
              cy="24"
              r="18"
              fill="none"
              stroke={isDark ? "#374151" : "#e5e7eb"}
              strokeWidth="4"
            />
            {/* Colored segments */}
            <circle
              cx="24"
              cy="24"
              r="18"
              fill="none"
              stroke="#f97316"
              strokeWidth="4"
              strokeDasharray="28 85"
              strokeDashoffset="0"
              transform="rotate(-90 24 24)"
            />
            <circle
              cx="24"
              cy="24"
              r="18"
              fill="none"
              stroke="#22d3ee"
              strokeWidth="4"
              strokeDasharray="35 78"
              strokeDashoffset="-28"
              transform="rotate(-90 24 24)"
            />
            <circle
              cx="24"
              cy="24"
              r="18"
              fill="none"
              stroke="#a855f7"
              strokeWidth="4"
              strokeDasharray="20 93"
              strokeDashoffset="-63"
              transform="rotate(-90 24 24)"
            />
          </svg>
          {/* Kadig logo in center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`w-5 h-5 rounded-full ${isDark ? 'bg-slate-700' : 'bg-slate-100'} flex items-center justify-center`}>
              <span className="text-[8px] font-bold text-cyan-500">K</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Chart lines */}
      <div className="flex justify-center gap-1 mt-2 px-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col gap-0.5">
            <div className={`w-4 h-0.5 rounded-full ${isDark ? 'bg-slate-600' : 'bg-slate-200'}`} />
            <div className={`w-3 h-0.5 rounded-full ${isDark ? 'bg-cyan-400' : 'bg-cyan-500'}`} />
          </div>
        ))}
      </div>
      
      {/* Bottom bar */}
      <div className={`absolute bottom-2 left-3 right-3 h-5 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
        <div className="flex items-center gap-1 px-1.5 pt-1">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`flex-1 h-2 rounded-sm ${i === 2 ? 'bg-orange-400' : isDark ? 'bg-slate-600' : 'bg-slate-200'}`} />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-4 px-4 py-4 safe-area-inset-top">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full flex items-center justify-center text-foreground hover:bg-muted/50 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-semibold text-foreground">Preferências</h1>
      </header>

      <div className="flex-1 px-4 pb-8">
        {/* Aparência Section */}
        <section className="mb-8">
          <h2 className="text-center text-lg font-semibold text-foreground mb-6">Aparência</h2>
          
          <div className="flex gap-4 justify-center">
            {/* Modo Claro */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setTheme("light")}
              className={`relative flex-1 max-w-[160px] rounded-2xl p-4 transition-all ${
                theme === "light" 
                  ? "bg-muted ring-2 ring-primary" 
                  : "bg-muted/50"
              }`}
            >
              {/* Selection indicator */}
              <div className={`absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center ${
                theme === "light" 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted border-2 border-border"
              }`}>
                {theme === "light" && <Check className="w-4 h-4" />}
              </div>
              
              <div className="flex flex-col items-center">
                <PhoneMockup isDark={false} />
                <span className="mt-3 text-sm font-medium text-foreground">Modo claro</span>
              </div>
            </motion.button>

            {/* Modo Escuro */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setTheme("dark")}
              className={`relative flex-1 max-w-[160px] rounded-2xl p-4 transition-all ${
                theme === "dark" 
                  ? "bg-muted ring-2 ring-primary" 
                  : "bg-muted/50"
              }`}
            >
              {/* Selection indicator */}
              <div className={`absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center ${
                theme === "dark" 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted border-2 border-border"
              }`}>
                {theme === "dark" && <Check className="w-4 h-4" />}
              </div>
              
              <div className="flex flex-col items-center">
                <PhoneMockup isDark={true} />
                <span className="mt-3 text-sm font-medium text-foreground">Modo escuro</span>
              </div>
            </motion.button>
          </div>
        </section>

        {/* Notificações Section */}
        <section>
          <div className="text-center mb-6">
            <h2 className="text-lg font-semibold text-foreground">Notificações</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Controle as informações que você deseja receber.
            </p>
          </div>

          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="flex items-center justify-between bg-muted/50 rounded-2xl px-5 py-4"
              >
                <span className="font-medium text-foreground">{notification.label}</span>
                <Switch
                  checked={notification.enabled}
                  onCheckedChange={() => toggleNotification(notification.id)}
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
