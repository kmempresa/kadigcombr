import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";
import MandatorySecurityNotice from "@/components/MandatorySecurityNotice";

type State = "loading" | "out" | "mfa" | "in" | "suspended" | "banned";

export default function RequireAuth() {
  const location = useLocation();
  const [state, setState] = useState<State>("loading");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [restrictionReason, setRestrictionReason] = useState("");

  const evaluate = async (hasSession: boolean) => {
    if (!hasSession) return "out" as State;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return "out" as State;
    const { data: control } = await supabase.from("account_security_controls").select("status, public_reason").eq("user_id", user.id).maybeSingle();
    if (control?.status === "suspended" || control?.status === "banned") {
      setRestrictionReason(control.public_reason ?? "Entre em contato com o suporte da Kadig.");
      return control.status as State;
    }
    const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    return data && data.nextLevel === "aal2" && data.currentLevel !== "aal2" ? "mfa" : "in";
  };

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      const s = await evaluate(Boolean(data.session));
      if (active) setState(s);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setTimeout(async () => {
        const s = await evaluate(Boolean(session));
        if (active) setState(s);
      }, 0);
    });
    const securityChannel = supabase.channel(`account-security-${crypto.randomUUID()}`).on("postgres_changes", { event: "*", schema: "public", table: "account_security_controls" }, () => {
      void supabase.auth.getSession().then(async ({ data }) => active && setState(await evaluate(Boolean(data.session))));
    }).subscribe();
    return () => {
      active = false;
      subscription.unsubscribe();
      void supabase.removeChannel(securityChannel);
    };
  }, []);

  const verify = async () => {
    setBusy(true); setError("");
    const { data } = await supabase.auth.mfa.listFactors();
    const factor = data?.totp?.find((f) => f.status === "verified");
    if (!factor) { setBusy(false); setState("in"); return; }
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code: code.trim() });
    setBusy(false);
    if (error) setError("Código inválido. Tente novamente.");
    else setState("in");
  };

  if (state === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" aria-label="Verificando acesso" />
      </div>
    );
  }

  if (state === "out") return <Navigate to="/auth" replace state={{ from: location.pathname }} />;

  if (state === "suspended" || state === "banned") {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background p-6 safe-area-inset-top safe-area-inset-bottom">
        <div className="w-full max-w-sm space-y-5 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive"><ShieldAlert className="h-7 w-7" /></span>
          <div className="space-y-2">
            <h1 className="text-xl font-semibold text-foreground">Conta {state === "banned" ? "bloqueada" : "suspensa"}</h1>
            <p className="text-sm leading-relaxed text-muted-foreground">{restrictionReason}</p>
          </div>
          <Button variant="outline" className="h-12 w-full" onClick={() => supabase.auth.signOut()}>Sair</Button>
        </div>
      </div>
    );
  }

  if (state === "mfa") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-4">
          <h1 className="text-xl font-semibold text-foreground">Verificação em duas etapas</h1>
          <p className="text-sm text-muted-foreground">Digite o código de 6 números do seu app autenticador.</p>
          <Input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric" autoComplete="one-time-code" placeholder="000000"
            className="bg-background text-foreground text-center tracking-widest h-12" />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button className="w-full h-12" disabled={busy || code.length !== 6} onClick={verify}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Entrar"}
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => supabase.auth.signOut()}>Sair</Button>
        </div>
      </div>
    );
  }

  return <><MandatorySecurityNotice /><Outlet /></>;
}
