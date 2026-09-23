import { useEffect, useState } from "react";
import { ShieldCheck, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/** Two-step verification (authenticator app) management. */
export default function TwoFactorSection() {
  const [factorId, setFactorId] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState<{ id: string; qr: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await supabase.auth.mfa.listFactors();
    setFactorId(data?.totp?.find((f) => f.status === "verified")?.id ?? null);
  };
  useEffect(() => { load(); }, []);

  const start = async () => {
    setBusy(true);
    const { data: existing } = await supabase.auth.mfa.listFactors();
    for (const f of existing?.all ?? []) if (f.status !== "verified") await supabase.auth.mfa.unenroll({ factorId: f.id });
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: `Kadig ${Date.now()}` });
    setBusy(false);
    if (error || !data) return toast.error("Não foi possível iniciar a verificação em duas etapas.");
    setEnrolling({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
  };

  const confirm = async () => {
    if (!enrolling) return;
    setBusy(true);
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: enrolling.id, code: code.trim() });
    setBusy(false);
    if (error) return toast.error("Código inválido. Tente novamente.");
    toast.success("Verificação em duas etapas ativada.");
    setEnrolling(null); setCode(""); load();
  };

  const disable = async () => {
    if (!factorId) return;
    setBusy(true);
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    setBusy(false);
    if (error) return toast.error("Para desativar, entre novamente com o código do autenticador.");
    toast.success("Verificação em duas etapas desativada.");
    load();
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-3">
        <ShieldCheck className="w-5 h-5 text-primary" />
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">Verificação em duas etapas</p>
          <p className="text-xs text-muted-foreground">{factorId ? "Ativada com app autenticador" : "Proteja o acesso com um código do app autenticador"}</p>
        </div>
      </div>

      {enrolling ? (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Escaneie o código no Google Authenticator, 1Password ou similar e digite os 6 números.</p>
          <img src={enrolling.qr} alt="Código para o app autenticador" className="w-40 h-40 mx-auto rounded-lg bg-background p-2" />
          <p className="text-[11px] text-center text-muted-foreground break-all">{enrolling.secret}</p>
          <Input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric" autoComplete="one-time-code" placeholder="000000"
            className="bg-background text-foreground text-center tracking-widest" />
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => { setEnrolling(null); setCode(""); }}>Cancelar</Button>
            <Button className="flex-1" disabled={busy || code.length !== 6} onClick={confirm}>
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ativar"}
            </Button>
          </div>
        </div>
      ) : (
        <Button variant={factorId ? "outline" : "default"} className="w-full" disabled={busy} onClick={factorId ? disable : start}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : factorId ? "Desativar" : "Ativar"}
        </Button>
      )}
    </div>
  );
}
