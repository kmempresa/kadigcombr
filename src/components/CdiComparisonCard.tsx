import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const fmt = (d: Date) => `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;

interface State { invested: number; current: number; cdi: number; since: Date }

/** Real comparison: each investment's invested amount compounded by the daily CDI (BCB series 12) since it was added. */
export default function CdiComparisonCard({ showValues }: { showValues: boolean }) {
  const [s, setS] = useState<State | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: inv } = await supabase.from("investments").select("total_invested,current_value,created_at");
      const rows = (inv || []).filter((i) => Number(i.total_invested) > 0 && Number(i.current_value) > 0);
      if (!rows.length) { if (alive) setS(null); return; }
      const since = new Date(Math.min(...rows.map((r) => new Date(r.created_at).getTime())));
      try {
        const r = await fetch(`https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados?formato=json&dataInicial=${fmt(since)}&dataFinal=${fmt(new Date())}`);
        const series: { data: string; valor: string }[] = await r.json();
        if (!Array.isArray(series)) throw new Error("bcb");
        // cumulative factor from each date to today
        const days = series.map((p) => { const [d, m, y] = p.data.split("/").map(Number); return { t: new Date(y, m - 1, d).getTime(), f: 1 + Number(p.valor) / 100 }; });
        const suffix: number[] = new Array(days.length + 1).fill(1);
        for (let i = days.length - 1; i >= 0; i--) suffix[i] = suffix[i + 1] * days[i].f;
        let invested = 0, current = 0, cdi = 0;
        for (const row of rows) {
          const t = new Date(row.created_at).getTime();
          const idx = days.findIndex((d) => d.t >= t);
          const factor = idx === -1 ? 1 : suffix[idx];
          invested += Number(row.total_invested); current += Number(row.current_value); cdi += Number(row.total_invested) * factor;
        }
        if (alive) { setS({ invested, current, cdi, since }); setError(false); }
      } catch { if (alive) setError(true); }
    })();
    return () => { alive = false; };
  }, []);

  if (error) return <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">Comparação com o CDI indisponível no momento.</div>;
  if (!s) return null;
  const diff = s.current - s.cdi;
  const beat = diff >= 0;
  const v = (n: number) => (showValues ? brl(n) : "R$ •••••");
  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2"><div className="h-4 w-1 rounded-full bg-primary" /><p className="text-sm font-semibold text-foreground">Sua carteira contra o CDI</p></div>
      <div className="grid grid-cols-2 gap-3">
        <div><p className="text-xs text-muted-foreground">Sua carteira hoje</p><p className="text-lg font-semibold text-foreground">{v(s.current)}</p></div>
        <div><p className="text-xs text-muted-foreground">Se estivesse no CDI</p><p className="text-lg font-semibold text-foreground">{v(s.cdi)}</p></div>
      </div>
      <p className={`text-sm font-medium ${beat ? "text-success" : "text-destructive"}`}>
        {beat ? "Ganhando do CDI por " : "Perdendo para o CDI por "}{v(Math.abs(diff))}
      </p>
      <p className="text-[11px] text-muted-foreground">Valor investido de {v(s.invested)} corrigido pelo CDI diário do Banco Central desde que cada ativo foi adicionado (desde {s.since.toLocaleDateString("pt-BR")}).</p>
    </div>
  );
}
