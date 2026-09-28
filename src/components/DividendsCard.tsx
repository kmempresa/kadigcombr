import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Item { ticker: string; label: string; rate: number; quantity: number; total: number; payment_date: string; upcoming: boolean }
const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const COLLAPSED = 3;

export default function DividendsCard({ showValues, refreshKey }: { showValues: boolean; refreshKey?: number }) {
  const [items, setItems] = useState<Item[] | null>(null);
  const [tickers, setTickers] = useState(0);
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    supabase.functions.invoke("kadig-extras", { body: { action: "dividends" } }).then(({ data, error }) => {
      if (error || !data) { setError(true); return; }
      setError(false);
      setTickers(data.tickers || 0);
      setItems(((data.items || []) as Item[]).sort((a, b) => b.payment_date.localeCompare(a.payment_date)));
    });
  }, [refreshKey]);

  if (tickers === 0 && !error) return null;
  const v = (n: number) => (showValues ? brl(n) : "R$ •••••");
  const received = (items || []).filter((i) => !i.upcoming);
  const upcoming = (items || []).filter((i) => i.upcoming).reverse();
  const total12 = received.reduce((s, i) => s + i.total, 0);
  const hidden = expanded ? 0 : Math.max(0, upcoming.length - COLLAPSED) + Math.max(0, received.length - COLLAPSED);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2"><div className="h-5 w-1 rounded-full bg-foreground" /><h2 className="font-semibold text-foreground">Proventos</h2></div>
      <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
        {error ? <p className="text-sm text-muted-foreground">Proventos indisponíveis no momento.</p> : items === null ? <p className="text-sm text-muted-foreground">Carregando proventos</p> : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-xs text-muted-foreground">Recebidos em 12 meses</p><p className="text-lg font-semibold text-foreground">{v(total12)}</p></div>
              <div><p className="text-xs text-muted-foreground">Média mensal</p><p className="text-lg font-semibold text-foreground">{v(total12 / 12)}</p></div>
            </div>
            {upcoming.length > 0 && <div className="space-y-2 border-t border-border pt-3">
              <p className="text-xs font-medium text-primary">A receber</p>
              {(expanded ? upcoming : upcoming.slice(0, COLLAPSED)).map((i, k) => <Row key={`u${k}`} i={i} v={v} />)}
            </div>}
            {received.length > 0 ? <div className="space-y-2 border-t border-border pt-3">
              <p className="text-xs font-medium text-muted-foreground">Últimos pagamentos</p>
              {(expanded ? received : received.slice(0, COLLAPSED)).map((i, k) => <Row key={`r${k}`} i={i} v={v} />)}
            </div> : <p className="text-sm text-muted-foreground">Nenhum provento pago nos últimos 12 meses para as ações da carteira.</p>}
            {(hidden > 0 || expanded) && hidden === 0 && (upcoming.length > COLLAPSED || received.length > COLLAPSED) && (
              <button
                type="button"
                onClick={() => setExpanded((e) => !e)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm font-medium text-primary transition-colors hover:bg-muted"
              >
                {expanded ? "Ver menos" : `Ver mais (${hidden})`}
                <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
              </button>
            )}
            <p className="text-[11px] text-muted-foreground">Calculado com a quantidade atual de cada ação. Dados oficiais da B3.</p>
          </>
        )}
      </div>
    </div>
  );
}

function Row({ i, v }: { i: Item; v: (n: number) => string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <div className="min-w-0"><p className="font-medium text-foreground">{i.ticker} <span className="text-xs font-normal text-muted-foreground">{/jcp/i.test(i.label) ? "JCP" : i.label.charAt(0) + i.label.slice(1).toLowerCase()}</span></p>
        <p className="text-xs text-muted-foreground">{new Date(i.payment_date).toLocaleDateString("pt-BR")}</p></div>
      <p className="shrink-0 font-medium text-success">{v(i.total)}</p>
    </div>
  );
}
