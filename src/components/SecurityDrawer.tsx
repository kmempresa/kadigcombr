import { useEffect, useState } from "react";
import { ArrowLeft, ChevronRight, KeyRound, Loader2, LogOut, Shield, Smartphone, Trash2 } from "lucide-react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTheme } from "@/hooks/useTheme";
import { useNavigate } from "react-router-dom";
import TwoFactorSection from "@/components/TwoFactorSection";

interface SecurityDrawerProps { open: boolean; onOpenChange: (open: boolean) => void }
type View = "main" | "password" | "sessions" | "delete";

const titles: Record<View, [string, string]> = {
  main: ["Segurança", "Proteja o acesso e os dados da sua conta"],
  password: ["Alterar senha", "Confirme sua senha atual antes de criar outra"],
  sessions: ["Sessões", "Controle onde sua conta permanece conectada"],
  delete: ["Excluir conta", "Apague permanentemente sua conta e seus dados"],
};

const SecurityDrawerComponent = ({ open, onOpenChange }: SecurityDrawerProps) => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [view, setView] = useState<View>("main");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deleteText, setDeleteText] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (open) supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? "")); }, [open]);
  const back = () => view === "main" ? onOpenChange(false) : setView("main");

  const changePassword = async () => {
    if (!email || !currentPassword) return toast.error("Digite sua senha atual.");
    if (newPassword.length < 8) return toast.error("Use pelo menos 8 caracteres na nova senha.");
    if (newPassword !== confirmPassword) return toast.error("As novas senhas não coincidem.");
    setBusy(true);
    const { error: verifyError } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
    if (verifyError) { setBusy(false); return toast.error("A senha atual está incorreta."); }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setBusy(false);
    if (error) return toast.error("Não foi possível alterar a senha.");
    setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); setView("main");
    toast.success("Senha alterada com sucesso.");
  };

  const signOutOthers = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signOut({ scope: "others" });
    setBusy(false);
    if (error) return toast.error("Não foi possível encerrar as outras sessões.");
    toast.success("Outras sessões encerradas.");
  };

  const deleteAccount = async () => {
    if (deleteText !== "EXCLUIR") return;
    setBusy(true);
    const { error } = await supabase.functions.invoke("delete-account", { body: { confirmation: deleteText } });
    if (error) { setBusy(false); return toast.error("Não foi possível excluir a conta."); }
    await supabase.auth.signOut();
    onOpenChange(false); navigate("/welcome", { replace: true });
  };

  return (
    <Drawer open={open} onOpenChange={(next) => { onOpenChange(next); if (!next) setView("main"); }}>
      <DrawerContent className={`${theme === "light" ? "light-theme" : ""} h-[96dvh] overflow-hidden bg-background`}>
        <header className="shrink-0 border-b border-border px-4 pb-4 safe-area-inset-top">
          <div className="flex items-center gap-3 pt-2">
            <Button variant="ghost" size="icon" className="rounded-full" onClick={back} aria-label="Voltar"><ArrowLeft /></Button>
            <div><h1 className="text-xl font-semibold text-foreground">{titles[view][0]}</h1><p className="text-xs text-muted-foreground">{titles[view][1]}</p></div>
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 pb-8 safe-area-inset-bottom">
          {view === "main" && <div className="space-y-4">
            <TwoFactorSection />
            <section className="overflow-hidden rounded-xl border border-border bg-card">
              <Button variant="ghost" onClick={() => setView("password")} className="h-auto w-full justify-between rounded-none border-b border-border p-4"><span className="flex items-center gap-3"><KeyRound className="text-primary" />Alterar senha</span><ChevronRight /></Button>
              <Button variant="ghost" onClick={() => setView("sessions")} className="h-auto w-full justify-between rounded-none border-b border-border p-4"><span className="flex items-center gap-3"><Smartphone className="text-primary" />Sessões conectadas</span><ChevronRight /></Button>
              <Button variant="ghost" onClick={() => setView("delete")} className="h-auto w-full justify-between rounded-none p-4 text-destructive hover:text-destructive"><span className="flex items-center gap-3"><Trash2 />Excluir conta</span><ChevronRight /></Button>
            </section>
            <p className="px-1 text-xs leading-relaxed text-muted-foreground">A Kadig nunca pede sua senha ou código do autenticador por mensagem.</p>
          </div>}
          {view === "password" && <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-4 space-y-4">
              <label className="block text-sm font-medium">Senha atual<Input type="password" autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="mt-2 h-12 bg-background" /></label>
              <label className="block text-sm font-medium">Nova senha<Input type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-2 h-12 bg-background" /></label>
              <label className="block text-sm font-medium">Confirmar nova senha<Input type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-2 h-12 bg-background" /></label>
            </div>
            <Button className="h-12 w-full rounded-xl" disabled={busy || !currentPassword || !newPassword || !confirmPassword} onClick={changePassword}>{busy ? <Loader2 className="animate-spin" /> : "Salvar nova senha"}</Button>
          </div>}
          {view === "sessions" && <div className="space-y-4">
            <section className="rounded-xl border border-border bg-card p-4"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10"><Smartphone className="text-primary" /></span><div><p className="font-medium">Este dispositivo</p><p className="text-xs text-muted-foreground">Sessão atual protegida</p></div></div></section>
            <Button variant="outline" className="h-12 w-full rounded-xl" disabled={busy} onClick={signOutOthers}>{busy ? <Loader2 className="animate-spin" /> : <><LogOut />Encerrar sessões em outros dispositivos</>}</Button>
          </div>}
          {view === "delete" && <div className="space-y-4">
            <section className="rounded-xl border border-destructive/30 bg-destructive/5 p-4"><div className="flex gap-3"><Shield className="shrink-0 text-destructive" /><p className="text-sm leading-relaxed text-muted-foreground">Carteiras, investimentos, metas, conexões e histórico serão apagados definitivamente.</p></div></section>
            <label className="block text-sm font-medium">Digite EXCLUIR para confirmar<Input value={deleteText} onChange={(e) => setDeleteText(e.target.value.toUpperCase())} maxLength={7} className="mt-2 h-12 bg-card text-center font-mono" /></label>
            <Button variant="destructive" className="h-12 w-full rounded-xl" disabled={busy || deleteText !== "EXCLUIR"} onClick={deleteAccount}>{busy ? <Loader2 className="animate-spin" /> : <><Trash2 />Excluir minha conta</>}</Button>
          </div>}
        </div>
      </DrawerContent>
    </Drawer>
  );
};
export { SecurityDrawerComponent as SecurityDrawer };
