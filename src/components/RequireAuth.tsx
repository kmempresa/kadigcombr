import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type State = "loading" | "out" | "mfa" | "in";

export default function RequireAuth() {
  const location = useLocation();
  const [state, setState] = useState<State>("loading");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const evaluate = async (hasSession: boolean) => {
    if (!hasSession) return "out" as State;
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
    return () => {
      active = false;
      subscription.unsubscribe();
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

  return <Outlet />;
}
