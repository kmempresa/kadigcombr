import { useEffect, useState } from "react";
import { ShieldCheck, Loader2, Copy, Check } from "lucide-react";
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
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const load = async () => {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) return toast.error("Não foi possível verificar a proteção da conta.");
    setFactorId(data?.totp?.find((f) => f.status === "verified")?.id ?? null);
  };
  useEffect(() => { load(); }, []);

  const start = async () => {
    setBusy(true); setError("");
    try {
      const { data: existing, error: listError } = await supabase.auth.mfa.listFactors();
      if (listError) throw listError;
      for (const f of existing?.all ?? []) {
        if (f.status !== "verified") await supabase.auth.mfa.unenroll({ factorId: f.id });
      }
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "Kadig" });
      if (enrollError || !data) throw enrollError ?? new Error("Falha ao iniciar");
      setEnrolling({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
    } catch {
      toast.error("Não foi possível iniciar a verificação em duas etapas.");
    } finally { setBusy(false); }
  };

  const confirm = async () => {
    if (!enrolling) return;
    setBusy(true); setError("");
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: enrolling.id, code: code.trim() });
    setBusy(false);
    if (error) { setError("Código inválido. Confira o autenticador e tente novamente."); return; }
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

  const cancel = async () => {
    if (enrolling) await supabase.auth.mfa.unenroll({ factorId: enrolling.id });
    setEnrolling(null); setCode(""); setError("");
  };

  const copySecret = async () => {
    if (!enrolling) return;
    await navigator.clipboard.writeText(enrolling.secret);
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };

  return (
    <section className="rounded-xl border border-border bg-card p-4 space-y-4">
      <div className="flex items-center gap-3">
        <ShieldCheck className="w-5 h-5 text-primary" />
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">Verificação em duas etapas</p>
          <p className="text-xs text-muted-foreground">{factorId ? "Ativada com aplicativo autenticador" : "Adicione uma confirmação ao entrar na sua conta"}</p>
        </div>
      </div>

      {enrolling ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Escaneie o código no seu aplicativo autenticador e informe os 6 números.</p>
          <img src={enrolling.qr} alt="Código QR para o aplicativo autenticador" className="w-44 h-44 mx-auto rounded-lg bg-foreground p-2" />
          <Button variant="outline" className="w-full justify-between font-mono text-xs" onClick={copySecret}>
            <span className="truncate">{enrolling.secret}</span>{copied ? <Check /> : <Copy />}
          </Button>
          <Input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric" autoComplete="one-time-code" placeholder="000000"
            className="bg-background text-foreground text-center tracking-widest" />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={cancel}>Cancelar</Button>
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
    </section>
  );
}
