import { useState, useEffect, forwardRef } from "react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { ArrowLeft, ChevronRight, Smartphone } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/hooks/useTheme";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SecurityDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type View = "main" | "change-password" | "devices";

export const SecurityDrawer = forwardRef<HTMLDivElement, SecurityDrawerProps>(
  function SecurityDrawer({ open, onOpenChange }, ref) {
  const { theme } = useTheme();
  const [view, setView] = useState<View>("main");
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  
  // Change password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Load biometric preference from localStorage
  useEffect(() => {
    const savedBiometric = localStorage.getItem("kadig-biometric-enabled");
    if (savedBiometric) {
      setBiometricEnabled(JSON.parse(savedBiometric));
    }
  }, []);

  // Save biometric preference
  const handleBiometricToggle = (checked: boolean) => {
    setBiometricEnabled(checked);
    localStorage.setItem("kadig-biometric-enabled", JSON.stringify(checked));
    toast.success(checked ? "Biometria ativada" : "Biometria desativada");
  };

  // Handle password change
  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("A nova senha deve ter pelo menos 6 caracteres");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast.success("Senha alterada com sucesso!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setView("main");
    } catch (error: any) {
      console.error("Error changing password:", error);
      toast.error(error.message || "Erro ao alterar senha");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (view === "main") {
      onOpenChange(false);
    } else {
      setView("main");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const renderContent = () => {
    switch (view) {
      case "change-password":
        return (
          <div className="flex-1 p-4 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Nova senha
                </label>
                <Input
                  type="password"
                  placeholder="Digite a nova senha"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-background border-border"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Confirmar nova senha
                </label>
                <Input
                  type="password"
                  placeholder="Confirme a nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-background border-border"
                />
              </div>
            </div>

            <Button
              onClick={handleChangePassword}
              disabled={loading || !newPassword || !confirmPassword}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {loading ? "Alterando..." : "Alterar senha"}
            </Button>
          </div>
        );

      case "devices":
        return (
          <div className="flex-1 p-4">
            <div className="bg-card border border-border rounded-xl p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Smartphone className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">
                Dispositivo atual
              </h3>
              <p className="text-sm text-muted-foreground">
                Você está conectado neste dispositivo
              </p>
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-sm text-foreground font-medium">
                  {navigator.userAgent.includes("Mobile") ? "Dispositivo móvel" : "Desktop"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Último acesso: Agora
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex-1">
            {/* Menu Items */}
            <div className="bg-background">
              {/* Gerenciador de dispositivos */}
              <button
                onClick={() => setView("devices")}
                className="w-full flex items-center justify-between px-4 py-4 border-b border-border"
              >
                <div className="flex-1 text-left">
                  <span className="font-medium text-foreground block">
                    Gerenciador de dispositivos
                  </span>
                  <span className="inline-block mt-1 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">
                    Novidade
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>

              {/* Alterar senha */}
              <button
                onClick={() => setView("change-password")}
                className="w-full flex items-center justify-between px-4 py-4 border-b border-border"
              >
                <span className="font-medium text-foreground">Alterar senha</span>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>

              {/* Biometria */}
              <div className="w-full flex items-center justify-between px-4 py-4 border-b border-border">
                <span className="font-medium text-foreground">
                  Biometria para entrar no app
                </span>
                <Switch
                  checked={biometricEnabled}
                  onCheckedChange={handleBiometricToggle}
                />
              </div>
            </div>
          </div>
        );
    }
  };

  const getTitle = () => {
    switch (view) {
      case "change-password":
        return "Alterar senha";
      case "devices":
        return "Gerenciador de dispositivos";
      default:
        return "Central de segurança";
    }
  };

  const getSubtitle = () => {
    switch (view) {
      case "change-password":
        return "Crie uma nova senha segura para sua conta";
      case "devices":
        return "Gerencie os dispositivos conectados à sua conta";
      default:
        return "Confira na lista seus recursos de segurança que estão ativos e aumente ainda mais sua proteção.";
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        ref={ref}
        className={`h-[95vh] ${theme === "light" ? "light-theme" : ""} bg-background`}
      >
        {/* Header with purple background */}
        <div className="bg-primary text-primary-foreground p-4 pt-6">
          <button
            onClick={handleBack}
            className="mb-4 p-1 -ml-1 hover:bg-primary-foreground/10 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold mb-2">{getTitle()}</h1>
          <p className="text-primary-foreground/80 text-sm">
            {getSubtitle()}
          </p>
        </div>

        {renderContent()}
      </DrawerContent>
    </Drawer>
  );
});
