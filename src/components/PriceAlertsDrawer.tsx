import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, BellRing, Loader2, Trash2, TrendingDown, TrendingUp } from "lucide-react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/hooks/useTheme";
import { toast } from "sonner";

const CRYPTOS = [
  { id: "bitcoin", label: "Bitcoin" }, { id: "ethereum", label: "Ethereum" }, { id: "solana", label: "Solana" },
  { id: "ripple", label: "XRP" }, { id: "cardano", label: "Cardano" }, { id: "binancecoin", label: "BNB" },
];

interface Alert {
  id: string; asset_kind: string; symbol: string; label: string; direction: string;
  target_price: number; active: boolean; last_price: number | null; triggered_at: string | null;
}
const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function PriceAlertsDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { theme } = useTheme();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [kind, setKind] = useState<"stock" | "crypto">("stock");
  const [ticker, setTicker] = useState("");
  const [crypto, setCrypto] = useState("bitcoin");
  const [direction, setDirection] = useState<"above" | "below">("below");
  const [price, setPrice] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from("price_alerts").select("*").order("created_at", { ascending: false });
    setAlerts((data as Alert[]) || []);
  }, []);
  useEffect(() => { if (open) load(); }, [open, load]);

  const save = async () => {
    const target = Number(price.replace(/\./g, "").replace(",", "."));
    const symbol = kind === "stock" ? ticker.trim().toUpperCase() : crypto;
    if (kind === "stock" && !/^[A-Z]{4}\d{1,2}$/.test(symbol)) return toast.error("Digite um código de ação válido, como PETR4.");
    if (!(target > 0)) return toast.error("Digite um preço válido.");
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setBusy(true);
    const label = kind === "stock" ? symbol : CRYPTOS.find((c) => c.id === crypto)?.label || crypto;
    const { error } = await supabase.from("price_alerts").insert({
      user_id: session.user.id, asset_kind: kind, symbol, label, direction, target_price: target,
    });
    setBusy(false);
    if (error) return toast.error("Não foi possível criar o alerta.");
    setTicker(""); setPrice("");
    toast.success("Alerta criado. Você será avisado quando o preço bater.");
    load();
    supabase.functions.invoke("kadig-extras", { body: { action: "check" } }).then(load);
  };

  const remove = async (id: string) => {
    await supabase.from("price_alerts").delete().eq("id", id);
    setAlerts((a) => a.filter((x) => x.id !== id));
  };

  const chip = (active: boolean) => `flex-1 rounded-xl border py-3 text-sm font-medium ${active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className={`${theme === "light" ? "light-theme" : ""} h-[92dvh] overflow-hidden bg-background text-foreground`}>
        <header className="shrink-0 border-b border-border px-4 pb-4">
          <div className="flex items-center gap-3 pt-2">
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => onOpenChange(false)} aria-label="Voltar"><ArrowLeft /></Button>
            <div><h1 className="text-xl font-semibold">Alertas de preço</h1><p className="text-xs text-muted-foreground">Avisamos quando a cotação real atingir o valor</p></div>
          </div>
        </header>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4 pb-10">
          <section className="space-y-4 rounded-xl border border-border bg-card p-4">
            <div className="flex gap-2">
              <button className={chip(kind === "stock")} onClick={() => setKind("stock")}>Ação</button>
              <button className={chip(kind === "crypto")} onClick={() => setKind("crypto")}>Cripto</button>
            </div>
            {kind === "stock" ? (
              <label className="block text-sm font-medium">Código da ação
                <Input value={ticker} onChange={(e) => setTicker(e.target.value.toUpperCase())} placeholder="PETR4" maxLength={6} className="mt-2 h-12 bg-background" />
              </label>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {CRYPTOS.map((c) => <button key={c.id} className={chip(crypto === c.id)} onClick={() => setCrypto(c.id)}>{c.label}</button>)}
              </div>
            )}
            <div className="flex gap-2">
              <button className={chip(direction === "below")} onClick={() => setDirection("below")}>Cair abaixo de</button>
              <button className={chip(direction === "above")} onClick={() => setDirection("above")}>Subir acima de</button>
            </div>
            <label className="block text-sm font-medium">Preço em reais
              <Input inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value.replace(/[^\d.,]/g, ""))} placeholder="0,00" className="mt-2 h-12 bg-background" />
            </label>
            <Button className="h-12 w-full rounded-xl" disabled={busy} onClick={save}>{busy ? <Loader2 className="animate-spin" /> : "Criar alerta"}</Button>
          </section>

          <div className="flex items-center gap-2"><div className="h-5 w-1 rounded-full bg-primary" /><h2 className="font-semibold">Seus alertas</h2></div>
          {alerts.length === 0 && <p className="text-sm text-muted-foreground">Nenhum alerta criado ainda.</p>}
          {alerts.map((a) => (
            <div key={a.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10">
                {a.direction === "above" ? <TrendingUp className="h-5 w-5 text-primary" /> : <TrendingDown className="h-5 w-5 text-primary" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{a.label} {a.direction === "above" ? "acima de" : "abaixo de"} {brl(Number(a.target_price))}</p>
                <p className="text-xs text-muted-foreground">
                  {a.active ? (a.last_price ? `Agora: ${brl(Number(a.last_price))}` : "Aguardando cotação") : `Atingido em ${new Date(a.triggered_at!).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}`}
                </p>
              </div>
              {!a.active && <BellRing className="h-4 w-4 text-success" />}
              <Button variant="ghost" size="icon" onClick={() => remove(a.id)} aria-label="Excluir alerta"><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
