import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight, Smartphone, Key, Fingerprint, Shield, Loader2, X, Eye, EyeOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/hooks/useTheme";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface DeviceSession {
  id: string;
  device: string;
  location: string;
  lastActive: string;
  current: boolean;
}

const Seguranca = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const themeClass = theme === "light" ? "light-theme" : "";
  
  // States
  const [biometricsEnabled, setBiometricsEnabled] = useState(() => {
    return localStorage.getItem("kadig-biometrics") === "true";
  });
  const [showPasswordDrawer, setShowPasswordDrawer] = useState(false);
  const [showDevicesDrawer, setShowDevicesDrawer] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Password change states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Mock devices (in a real app, this would come from session management)
  const [devices, setDevices] = useState<DeviceSession[]>([
    {
      id: "current",
      device: "Este dispositivo",
      location: "Brasil",
      lastActive: "Agora",
      current: true,
    },
  ]);

  // Handle biometrics toggle
  const handleBiometricsToggle = (enabled: boolean) => {
    setBiometricsEnabled(enabled);
    localStorage.setItem("kadig-biometrics", enabled.toString());
    toast.success(enabled ? "Biometria ativada" : "Biometria desativada");
  };

  // Handle password change
  const handlePasswordChange = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error("Preencha todos os campos");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("A nova senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast.success("Senha alterada com sucesso!");
      setShowPasswordDrawer(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("Error changing password:", error);
      toast.error(error.message || "Erro ao alterar senha");
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle sign out all devices
  const handleSignOutAllDevices = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) throw error;
      toast.success("Todas as sessões foram encerradas");
      navigate("/auth");
    } catch (error: any) {
      toast.error("Erro ao encerrar sessões");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${themeClass} min-h-screen bg-background`}>
      {/* Header with gradient */}
      <div className="bg-gradient-to-br from-primary via-primary to-accent">
        <header className="flex items-center gap-4 p-4 pt-6 safe-area-inset-top">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
        </header>
        
        <div className="px-4 pb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Central de segurança</h1>
          <p className="text-white/80 text-sm">
            Confira na lista seus recursos de segurança que estão ativos e aumente ainda mais sua proteção.
          </p>
        </div>
      </div>

      {/* Security Options */}
      <div className="p-4 space-y-0">
        {/* Device Manager */}
        <button 
          onClick={() => setShowDevicesDrawer(true)}
          className="w-full flex items-center justify-between py-4 border-b border-border"
        >
          <div className="flex flex-col items-start gap-1">
            <span className="font-medium text-foreground">Gerenciador de dispositivos</span>
            <span className="text-xs px-2 py-0.5 bg-accent/20 text-accent rounded-full">Novidade</span>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Change Password */}
        <button 
          onClick={() => setShowPasswordDrawer(true)}
          className="w-full flex items-center justify-between py-4 border-b border-border"
        >
          <span className="font-medium text-foreground">Alterar senha</span>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Biometrics Toggle */}
        <div className="flex items-center justify-between py-4 border-b border-border">
          <span className="font-medium text-foreground">Biometria para entrar no app</span>
          <Switch
            checked={biometricsEnabled}
            onCheckedChange={handleBiometricsToggle}
            className="data-[state=checked]:bg-primary"
          />
        </div>
      </div>

      {/* Password Change Drawer */}
      <AnimatePresence>
        {showPasswordDrawer && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPasswordDrawer(false)}
              className="fixed inset-0 bg-black/50 z-50"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className={`fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl max-h-[90vh] overflow-hidden ${themeClass}`}
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Key className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground">Alterar senha</h2>
                </div>
                <button 
                  onClick={() => setShowPasswordDrawer(false)}
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-foreground" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                {/* Current Password */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Senha atual</label>
                  <div className="relative">
                    <Input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Digite sua senha atual"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Nova senha</label>
                  <div className="relative">
                    <Input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Digite sua nova senha"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">Mínimo de 6 caracteres</p>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Confirmar nova senha</label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirme sua nova senha"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  onClick={handlePasswordChange}
                  disabled={passwordLoading || !newPassword || !confirmPassword}
                  className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {passwordLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Shield className="w-5 h-5" />
                      Alterar senha
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Devices Drawer */}
      <AnimatePresence>
        {showDevicesDrawer && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDevicesDrawer(false)}
              className="fixed inset-0 bg-black/50 z-50"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className={`fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl max-h-[90vh] overflow-hidden ${themeClass}`}
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground">Dispositivos conectados</h2>
                </div>
                <button 
                  onClick={() => setShowDevicesDrawer(false)}
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-foreground" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Gerencie os dispositivos que têm acesso à sua conta. Você pode encerrar sessões remotamente.
                </p>

                {/* Device List */}
                <div className="space-y-3">
                  {devices.map((device) => (
                    <div 
                      key={device.id}
                      className="flex items-center justify-between p-4 bg-card rounded-xl border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Smartphone className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{device.device}</p>
                          <p className="text-xs text-muted-foreground">
                            {device.location} • {device.lastActive}
                          </p>
                        </div>
                      </div>
                      {device.current && (
                        <span className="text-xs px-2 py-1 bg-success/20 text-success rounded-full">
                          Ativo
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleSignOutAllDevices}
                  disabled={loading}
                  className="w-full py-4 rounded-xl bg-destructive/10 text-destructive font-semibold flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Encerrar todas as sessões"
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Seguranca;
