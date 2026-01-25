import { useState, useEffect } from "react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { 
  ArrowLeft, 
  ChevronRight, 
  Smartphone, 
  Trash2, 
  AlertTriangle,
  Wallet,
  TrendingUp,
  Link2,
  MessageSquare,
  Loader2
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/hooks/useTheme";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

interface SecurityDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type View = "main" | "change-password" | "devices" | "delete-account";

const SecurityDrawerComponent = ({ open, onOpenChange }: SecurityDrawerProps) => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [view, setView] = useState<View>("main");
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  
  // Change password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Delete account state
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

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

  // Handle delete account
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "EXCLUIR") {
      toast.error("Digite EXCLUIR para confirmar");
      return;
    }

    setDeletingAccount(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não encontrado");

      // Delete user data from all tables
      await supabase.from('investments').delete().eq('user_id', user.id);
      await supabase.from('movements').delete().eq('user_id', user.id);
      await supabase.from('portfolio_history').delete().eq('user_id', user.id);
      await supabase.from('portfolios').delete().eq('user_id', user.id);
      await supabase.from('goals').delete().eq('user_id', user.id);
      await supabase.from('global_assets').delete().eq('user_id', user.id);
      await supabase.from('pluggy_connections').delete().eq('user_id', user.id);
      await supabase.from('chat_messages').delete().eq('user_id', user.id);
      await supabase.from('chat_conversations').delete().eq('user_id', user.id);
      await supabase.from('profiles').delete().eq('user_id', user.id);

      // Sign out user
      await supabase.auth.signOut();
      
      toast.success("Conta excluída com sucesso");
      onOpenChange(false);
      navigate("/welcome");
    } catch (error: any) {
      console.error("Error deleting account:", error);
      toast.error(error.message || "Erro ao excluir conta");
    } finally {
      setDeletingAccount(false);
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
      setDeleteConfirmText("");
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

      case "delete-account":
        return (
          <div className="flex-1 p-4 space-y-5">
            {/* Icon Header */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center text-center pt-2"
            >
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500/20 to-red-600/10 flex items-center justify-center shadow-lg shadow-red-500/10">
                  <Trash2 className="w-10 h-10 text-red-500" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center border-2 border-background">
                  <AlertTriangle className="w-3 h-3 text-white" />
                </div>
              </div>
              <h3 className="mt-4 text-lg font-bold text-foreground">Excluir conta</h3>
              <p className="mt-1 text-sm text-muted-foreground">Esta ação não pode ser desfeita</p>
            </motion.div>

            {/* Warning Card - Kadig Style */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="relative overflow-hidden p-4 bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl"
            >
              {/* Glow effect */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              
              <div className="relative">
                <p className="text-sm text-muted-foreground mb-3">
                  Ao excluir sua conta, você perderá permanentemente:
                </p>
                <div className="space-y-2">
                  {[
                    { icon: Wallet, text: "Carteiras e investimentos" },
                    { icon: TrendingUp, text: "Histórico de rentabilidade" },
                    { icon: Link2, text: "Conexões Open Finance" },
                    { icon: MessageSquare, text: "Conversas com a Bianca IA" },
                  ].map((item, index) => (
                    <motion.div
                      key={item.text}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 + index * 0.05 }}
                      className="flex items-center gap-3 p-2 bg-muted/30 rounded-xl"
                    >
                      <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                        <item.icon className="w-4 h-4 text-red-400" />
                      </div>
                      <span className="text-sm text-foreground">{item.text}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Confirmation Input - Kadig Style */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-3"
            >
              <label className="text-sm font-medium text-foreground">
                Digite <span className="text-red-500 font-bold">EXCLUIR</span> para confirmar
              </label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="EXCLUIR"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                  className={`bg-card/50 backdrop-blur-sm border-2 text-center text-lg font-mono tracking-[0.3em] py-6 transition-all duration-300 ${
                    deleteConfirmText === "EXCLUIR" 
                      ? "border-emerald-500/50 shadow-lg shadow-emerald-500/10" 
                      : deleteConfirmText 
                        ? "border-red-500/30" 
                        : "border-border/50"
                  }`}
                  maxLength={7}
                />
                {deleteConfirmText === "EXCLUIR" && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* Action Buttons - Kadig Style */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="space-y-3 pt-2"
            >
              <motion.button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== "EXCLUIR" || deletingAccount}
                whileTap={{ scale: deleteConfirmText === "EXCLUIR" ? 0.98 : 1 }}
                className={`w-full py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 ${
                  deleteConfirmText === "EXCLUIR"
                    ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
              >
                {deletingAccount ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" />
                    Excluir minha conta
                  </>
                )}
              </motion.button>

              <motion.button
                onClick={() => {
                  setView("main");
                  setDeleteConfirmText("");
                }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 text-foreground font-medium hover:bg-muted/50 transition-colors"
              >
                Cancelar
              </motion.button>
            </motion.div>
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
                  <span className="inline-block mt-1 text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">
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

              {/* Excluir conta */}
              <button
                onClick={() => setView("delete-account")}
                className="w-full flex items-center justify-between px-4 py-4 border-b border-border group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center group-hover:bg-destructive/20 transition-colors">
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </div>
                  <span className="font-medium text-destructive">Excluir conta</span>
                </div>
                <ChevronRight className="w-5 h-5 text-destructive/50" />
              </button>
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
      case "delete-account":
        return "Excluir conta";
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
      case "delete-account":
        return "Exclua permanentemente sua conta e todos os dados";
      default:
        return "Confira na lista seus recursos de segurança que estão ativos e aumente ainda mais sua proteção.";
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        className={`h-[95vh] ${theme === "light" ? "light-theme" : ""} bg-background`}
      >
        {/* Header with primary background */}
        <div className={`${view === "delete-account" ? "bg-destructive" : "bg-primary"} text-primary-foreground p-4 pt-6 transition-colors`}>
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
};

export { SecurityDrawerComponent as SecurityDrawer };
