import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronRight, Smartphone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Seguranca = () => {
  const navigate = useNavigate();
  const [biometriaEnabled, setBiometriaEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load biometria preference from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("kadig-biometria");
    if (stored === "true") {
      setBiometriaEnabled(true);
    }
  }, []);

  const handleBiometriaToggle = (checked: boolean) => {
    setBiometriaEnabled(checked);
    localStorage.setItem("kadig-biometria", String(checked));
    toast.success(checked ? "Biometria ativada" : "Biometria desativada");
  };

  const handleAlterarSenha = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
          redirectTo: `${window.location.origin}/auth`,
        });
        if (error) throw error;
        toast.success("Email de redefinição enviado! Verifique sua caixa de entrada.");
      }
    } catch (error: any) {
      toast.error("Erro ao enviar email de redefinição");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Purple Header */}
      <div className="bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground">
        {/* Back button */}
        <header className="flex items-center gap-4 px-4 py-4 safe-area-inset-top">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full flex items-center justify-center text-primary-foreground/80 hover:bg-primary-foreground/10 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        </header>

        {/* Title section */}
        <div className="px-6 pb-8">
          <h1 className="text-2xl font-bold mb-2">Central de segurança</h1>
          <p className="text-primary-foreground/80 text-sm leading-relaxed">
            Confira na lista seus recursos de segurança que estão ativos e aumente ainda mais sua proteção.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 bg-background">
        <div className="divide-y divide-border">
          {/* Gerenciador de dispositivos */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => toast.info("Em breve: Gerenciador de dispositivos")}
            className="w-full flex items-center justify-between px-6 py-5 hover:bg-muted/50 transition-colors"
          >
            <div className="flex flex-col items-start gap-2">
              <span className="font-medium text-foreground">Gerenciador de dispositivos</span>
              <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">
                Novidade
              </span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </motion.button>

          {/* Alterar senha */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleAlterarSenha}
            disabled={loading}
            className="w-full flex items-center justify-between px-6 py-5 hover:bg-muted/50 transition-colors disabled:opacity-50"
          >
            <span className="font-medium text-foreground">Alterar senha</span>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </motion.button>

          {/* Biometria */}
          <div className="flex items-center justify-between px-6 py-5">
            <span className="font-medium text-foreground">Biometria para entrar no app</span>
            <Switch
              checked={biometriaEnabled}
              onCheckedChange={handleBiometriaToggle}
              className="data-[state=checked]:bg-primary"
            />
          </div>
        </div>

        {/* Device list section (optional, for future implementation) */}
        {biometriaEnabled && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-6 py-4"
          >
            <div className="bg-muted/50 rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Este dispositivo</p>
                <p className="text-xs text-muted-foreground">Biometria ativa</p>
              </div>
              <div className="w-2 h-2 rounded-full bg-success" />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Seguranca;
