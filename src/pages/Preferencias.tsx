import { useEffect, useState } from "react";
import { Check, Loader2, Moon, Sun } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/hooks/useTheme";
import { motion } from "framer-motion";
import AccountPageShell from "@/components/AccountPageShell";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Preferencias = () => {
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  
  // Notification states
  const [notifications, setNotifications] = useState({
    eventosCarteira: true,
    noticias: true,
    educacional: true,
    promocoes: true,
  });

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { setLoading(false); return; }
      const { data: saved } = await supabase.from("user_preferences").select("eventos_carteira, noticias, educacional, promocoes").eq("user_id", data.user.id).maybeSingle();
      if (saved) setNotifications({ eventosCarteira: saved.eventos_carteira, noticias: saved.noticias, educacional: saved.educacional, promocoes: saved.promocoes });
      setLoading(false);
    });
  }, []);

  const handleNotificationChange = async (key: keyof typeof notifications) => {
    const next = { ...notifications, [key]: !notifications[key] };
    setNotifications(next);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("user_preferences").upsert({ user_id: user.id, eventos_carteira: next.eventosCarteira, noticias: next.noticias, educacional: next.educacional, promocoes: next.promocoes, updated_at: new Date().toISOString() });
    if (error) { setNotifications(notifications); toast.error("Não foi possível salvar a preferência."); }
  };

  return (
    <AccountPageShell title="Preferências" subtitle="Ajuste a Kadig ao seu jeito">
      <div className="space-y-8">
        {/* Aparência Section */}
        <section>
           <h2 className="text-sm font-semibold text-foreground mb-4">Aparência</h2>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Modo Claro */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setTheme("light")}
              className={`relative rounded-xl border p-4 transition-all ${
                theme === "light" 
                  ? "border-primary bg-primary/5 ring-1 ring-primary" 
                  : "border-border bg-card"
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
              <div className="bg-background rounded-lg p-3 mb-3 border border-border">
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
                      <circle cx="50" cy="50" r="35" fill="none" stroke="hsl(var(--primary))" strokeWidth="8" strokeDasharray="70 150" />
                      <circle cx="50" cy="50" r="25" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                      <circle cx="50" cy="50" r="25" fill="none" stroke="hsl(var(--accent))" strokeWidth="8" strokeDasharray="50 150" />
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
              className={`relative rounded-xl border p-4 transition-all ${
                theme === "dark" 
                  ? "border-primary bg-primary/5 ring-1 ring-primary" 
                  : "border-border bg-card"
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
              <div className="bg-secondary rounded-lg p-3 mb-3 border border-border">
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
                      <circle cx="50" cy="50" r="35" fill="none" stroke="hsl(var(--primary))" strokeWidth="8" strokeDasharray="70 150" />
                      <circle cx="50" cy="50" r="25" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                      <circle cx="50" cy="50" r="25" fill="none" stroke="hsl(var(--accent))" strokeWidth="8" strokeDasharray="50 150" />
                      <circle cx="50" cy="50" r="15" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                      <circle cx="50" cy="50" r="15" fill="none" stroke="hsl(var(--primary))" strokeWidth="8" strokeDasharray="30 150" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Moon className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <div className="h-1 flex-1 bg-primary rounded-full" />
                  <div className="h-1 flex-1 bg-muted rounded-full" />
                  <div className="h-1 flex-1 bg-muted rounded-full" />
                </div>
              </div>
              
              <span className="text-sm font-medium text-muted-foreground">Modo escuro</span>
            </motion.button>
          </div>
        </section>

        {/* Notificações Section */}
        <section>
           <h2 className="text-sm font-semibold text-foreground mb-2">Notificações</h2>
           <p className="text-sm text-muted-foreground mb-4">
            Controle as informações que você deseja receber.
          </p>
          
           {loading ? <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div> : <div className="overflow-hidden rounded-xl border border-border bg-card">
            {[
              { key: "eventosCarteira", label: "Eventos da Carteira" },
              { key: "noticias", label: "Notícias" },
              { key: "educacional", label: "Educacional" },
              { key: "promocoes", label: "Promoções" },
            ].map((item) => (
              <div 
                key={item.key}
                 className="flex items-center justify-between py-4 px-4 border-b border-border last:border-b-0"
              >
                <span className="font-medium text-foreground">{item.label}</span>
                <Switch
                  checked={notifications[item.key as keyof typeof notifications]}
                  onCheckedChange={() => handleNotificationChange(item.key as keyof typeof notifications)}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            ))}
          </div>}
        </section>
      </div>
    </AccountPageShell>
  );
};

export default Preferencias;
