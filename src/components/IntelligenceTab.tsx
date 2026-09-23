import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldAlert, Gauge, Lightbulb, Loader2, Calculator, Bot, Check, X, ChevronRight, MessageCircle, Sparkles, Send } from "lucide-react";
import { toast } from "sonner";
import {
  simulateWhatIf, parseAmount, checkAutopilot, brl, formatMonths,
  type AutopilotRules, type Insight,
} from "@/lib/opportunityEngine";
import { useIntelligence, useIntelligenceAlerts } from "@/hooks/useIntelligence";

const DEFAULT_RULES: AutopilotRules = { minLiquidity: 50000, maxDrawdownPct: 8, beatCdiPlus: 2, targetNetWorth: 10000000 };

const sevStyle: Record<Insight["severity"], { label: string; cls: string; dot: string; icon: any }> = {
  risk: { label: "Risco alto", cls: "text-destructive bg-destructive/10 border-destructive/30", dot: "bg-destructive", icon: ShieldAlert },
  efficiency: { label: "Atenção", cls: "text-warning bg-warning/10 border-warning/30", dot: "bg-warning", icon: Gauge },
  opportunity: { label: "Oportunidade", cls: "text-success bg-success/10 border-success/30", dot: "bg-success", icon: Lightbulb },
};

const ctaFor = (i: Insight) => i.severity === "risk" ? "Entender" : i.category === "Vencimentos" || i.category === "Objetivos" ? "Planejar" : "Analisar";

export type IntelView = "hoje" | "opps" | "whatif" | "autopilot";

interface Props { userName: string; showValues: boolean; initialView?: IntelView; initialWhatIf?: string }

export default function IntelligenceTab({ userName, showValues }: Props) {
  const [view, setView] = useState<"home" | "opps" | "whatif" | "autopilot">("home");
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [investments, setInvestments] = useState<EngineInvestment[]>([]);
  const [globals, setGlobals] = useState<EngineGlobalAsset[]>([]);
  const [goals, setGoals] = useState<EngineGoal[]>([]);
  const [ind, setInd] = useState<EngineIndicators>({ cdi12m: 14.4, ipca12m: 4.1, selic: 15 });
  const [rules, setRules] = useState<AutopilotRules>(DEFAULT_RULES);
  const [whatIfText, setWhatIfText] = useState("");
  const [whatIfAmount, setWhatIfAmount] = useState(0);

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLoading(false); return; }
    const uid = session.user.id;
    setUserId(uid);
    const saved = localStorage.getItem(`kadig-autopilot-${uid}`);
    if (saved) try { setRules({ ...DEFAULT_RULES, ...JSON.parse(saved) }); } catch { /* ignore */ }

    const [inv, ga, gl, econ] = await Promise.all([
      supabase.from("investments").select("*").eq("user_id", uid),
      supabase.from("global_assets").select("*").eq("user_id", uid),
      supabase.from("goals").select("*").eq("user_id", uid),
      supabase.functions.invoke("market-data", { body: { type: "economic-indicators" } }),
    ]);
    setInvestments((inv.data || []).map((i) => ({
      id: i.id, asset_name: i.asset_name, asset_type: i.asset_type, ticker: i.ticker,
      current_value: Number(i.current_value) || 0, total_invested: Number(i.total_invested) || 0, maturity_date: i.maturity_date,
    })));
    setGlobals((ga.data || []).map((a) => ({ id: a.id, name: a.name, category: a.category, value_brl: Number(a.value_brl) || 0 })));
    setGoals((gl.data || []).map((g) => ({ id: g.id, type: g.type, target_value: Number(g.target_value) || 0, target_date: g.target_date })));
    const e = econ.data as any;
    if (e?.accumulated12m) {
      setInd({ cdi12m: Number(e.accumulated12m.cdi) || 14.4, ipca12m: Number(e.accumulated12m.ipca) || 4.1, selic: Number(e.current?.selic) || 15 });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const ch = supabase.channel("intelligence-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "investments" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "global_assets" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  const result = useMemo(() => runEngine(investments, globals, goals, ind), [investments, globals, goals, ind]);
  const dayGain = useMemo(() => result.invested * (Math.pow(1 + ind.cdi12m / 100, 1 / 252) - 1), [result.invested, ind]);
  const checks = useMemo(() => checkAutopilot(result, investments, rules, ind), [result, investments, rules, ind]);
  const scenarios = useMemo(
    () => whatIfAmount > 0 ? simulateWhatIf(whatIfAmount, result.netWorth, result.liquid, result.invested, ind, rules.targetNetWorth) : [],
    [whatIfAmount, result, ind, rules.targetNetWorth],
  );

  const v = (n: number, compact = false) => (showValues ? brl(n, compact) : "R$ •••••");
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const firstName = (userName || "").split(" ")[0];

  const saveRules = (r: AutopilotRules) => {
    setRules(r);
    if (userId) localStorage.setItem(`kadig-autopilot-${userId}`, JSON.stringify(r));
  };

  if (loading) {
    return <div className="flex-1 flex items-center justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  const Header = ({ title }: { title: string }) => (
    <button onClick={() => setView("home")} className="text-sm text-muted-foreground mb-4 flex items-center gap-1">
      <ChevronRight className="w-4 h-4 rotate-180" /> {title}
    </button>
  );

  const InsightCard = ({ i }: { i: Insight }) => {
    const s = sevStyle[i.severity];
    return (
      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${s.cls}`}>{s.label} · {i.category}</span>
          {i.annualImpact > 0 && <span className="text-xs font-semibold text-success">+{v(i.annualImpact)}/ano</span>}
        </div>
        <p className="font-semibold text-foreground text-sm">{i.title}</p>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{i.detail}</p>
        <p className="text-xs text-primary mt-2 font-medium">{i.action}</p>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto pb-28 px-4 pt-6 max-w-2xl mx-auto w-full">
      {view === "home" && (
        <>
          <p className="text-sm text-muted-foreground">{greeting}{firstName ? `, ${firstName}` : ""}.</p>
          <h1 className="text-2xl font-bold text-foreground mt-1 flex items-center gap-2"><Brain className="w-6 h-6 text-primary" /> Kadig Intelligence</h1>

          <div className="grid grid-cols-2 gap-3 mt-5">
            <div className="bg-card border border-border rounded-2xl p-4 col-span-2">
              <p className="text-xs text-muted-foreground">Patrimônio líquido</p>
              <p className="text-3xl font-bold text-foreground mt-1">{v(result.netWorth)}</p>
              <p className="text-xs text-success mt-1">+{v(dayGain)} estimado hoje</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-4">
              <p className="text-xs text-muted-foreground">Kadig Score</p>
              <p className={`text-3xl font-bold mt-1 ${result.score >= 70 ? "text-success" : result.score >= 40 ? "text-warning" : "text-destructive"}`}>{result.score}</p>
              <div className="h-1.5 bg-muted rounded-full mt-2 overflow-hidden"><div className="h-full bg-primary" style={{ width: `${result.score}%` }} /></div>
            </div>
            <div className="bg-card border border-border rounded-2xl p-4">
              <p className="text-xs text-muted-foreground">Oportunidades/ano</p>
              <p className="text-2xl font-bold text-success mt-1">{v(result.totalOpportunity, true)}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{result.insights.length} pontos analisados</p>
            </div>
          </div>

          <h2 className="text-sm font-semibold text-foreground mt-6 mb-3">Precisa da sua atenção</h2>
          {result.insights.length === 0 ? (
            <p className="text-sm text-muted-foreground">Adicione investimentos ou conecte um banco para a Kadig analisar seu patrimônio.</p>
          ) : (
            <div className="space-y-2">
              {result.insights.slice(0, 3).map((i) => {
                const s = sevStyle[i.severity];
                return (
                  <div key={i.id} className="flex items-center gap-3 bg-card border border-border rounded-xl p-3">
                    <div className={`w-9 h-9 rounded-lg border flex items-center justify-center ${s.cls}`}><s.icon className="w-4 h-4" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{s.label}</p>
                      <p className="text-sm font-medium text-foreground truncate">{i.title}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <Button className="w-full mt-4" onClick={() => setView("opps")}>Analisar oportunidades</Button>

          <div className="grid grid-cols-2 gap-3 mt-3">
            <button onClick={() => setView("whatif")} className="bg-card border border-border rounded-2xl p-4 text-left">
              <Calculator className="w-5 h-5 text-primary" />
              <p className="text-sm font-semibold text-foreground mt-2">E se?</p>
              <p className="text-xs text-muted-foreground">Simule uma grande decisão</p>
            </button>
            <button onClick={() => setView("autopilot")} className="bg-card border border-border rounded-2xl p-4 text-left">
              <Bot className="w-5 h-5 text-primary" />
              <p className="text-sm font-semibold text-foreground mt-2">Autopilot</p>
              <p className="text-xs text-muted-foreground">{checks.filter((c) => !c.ok).length} regra(s) fora da estratégia</p>
            </button>
          </div>
        </>
      )}

      {view === "opps" && (
        <>
          <Header title="Kadig Intelligence" />
          <h1 className="text-xl font-bold text-foreground">Motor de Oportunidades</h1>
          <div className="bg-success/10 border border-success/30 rounded-2xl p-4 mt-4">
            <p className="text-xs text-muted-foreground">Encontramos no seu patrimônio</p>
            <p className="text-2xl font-bold text-success">{v(result.totalOpportunity)}/ano</p>
            <p className="text-xs text-muted-foreground mt-1">em oportunidades mensuráveis, além de riscos a revisar.</p>
          </div>
          <div className="space-y-3 mt-4">{result.insights.map((i) => <InsightCard key={i.id} i={i} />)}</div>
        </>
      )}

      {view === "whatif" && (
        <>
          <Header title="Kadig Intelligence" />
          <h1 className="text-xl font-bold text-foreground">E se?</h1>
          <p className="text-sm text-muted-foreground mt-1">Descreva uma compra ou decisão. Ex: "Quero comprar uma Porsche de R$ 600 mil".</p>
          <form className="flex gap-2 mt-4" onSubmit={(e) => {
            e.preventDefault();
            const a = parseAmount(whatIfText);
            if (!a) { toast.error("Informe um valor, por exemplo R$ 600 mil"); return; }
            setWhatIfAmount(a);
          }}>
            <Input value={whatIfText} onChange={(e) => setWhatIfText(e.target.value)} placeholder="Quero comprar um apartamento de R$ 1,2 milhão" />
            <Button type="submit">Simular</Button>
          </form>

          {scenarios.length > 0 && (
            <div className="space-y-3 mt-5">
              <p className="text-xs text-muted-foreground">Valor considerado: <span className="text-foreground font-semibold">{brl(whatIfAmount)}</span></p>
              {scenarios.map((s) => (
                <div key={s.key} className="bg-card border border-border rounded-2xl p-4">
                  <p className="font-semibold text-foreground">{s.label}</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-3 text-xs">
                    <div><p className="text-muted-foreground">Patrimônio</p><p className="text-foreground font-medium">{v(s.netWorth, true)}</p></div>
                    <div><p className="text-muted-foreground">Liquidez</p><p className={`font-medium ${s.liquid < 0 ? "text-destructive" : "text-foreground"}`}>{v(s.liquid, true)}</p></div>
                    <div><p className="text-muted-foreground">Renda passiva/mês</p><p className="text-foreground font-medium">{v(s.passiveMonthly)}</p></div>
                    <div><p className="text-muted-foreground">Custo total</p><p className="text-foreground font-medium">{v(s.totalCost, true)}</p></div>
                    <div className="col-span-2"><p className="text-muted-foreground">Meta de {brl(rules.targetNetWorth, true)}</p><p className="text-foreground font-medium">{formatMonths(s.goalMonths)}</p></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3 leading-relaxed">{s.note}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {view === "autopilot" && (
        <>
          <Header title="Kadig Intelligence" />
          <h1 className="text-xl font-bold text-foreground">Kadig Autopilot</h1>
          <p className="text-sm text-muted-foreground mt-1">Defina sua estratégia. A Kadig monitora sua carteira e sugere ajustes quando algo sai da regra.</p>

          <div className="bg-card border border-border rounded-2xl p-4 mt-4 space-y-3">
            {([
              ["minLiquidity", "Liquidez mínima (R$)"],
              ["maxDrawdownPct", "Perda máxima em crise (%)"],
              ["beatCdiPlus", "Superar CDI + (%)"],
              ["targetNetWorth", "Meta de patrimônio (R$)"],
            ] as [keyof AutopilotRules, string][]).map(([k, label]) => (
              <div key={k} className="flex items-center justify-between gap-3">
                <label className="text-xs text-muted-foreground">{label}</label>
                <Input type="number" className="w-36 h-9 text-right" value={rules[k]}
                  onChange={(e) => saveRules({ ...rules, [k]: Number(e.target.value) || 0 })} />
              </div>
            ))}
          </div>

          <h2 className="text-sm font-semibold text-foreground mt-5 mb-3">Situação atual</h2>
          <div className="space-y-2">
            {checks.map((c) => (
              <div key={c.id} className="bg-card border border-border rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${c.ok ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                    {c.ok ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  </div>
                  <p className="text-sm font-medium text-foreground flex-1">{c.label}</p>
                  <p className="text-xs text-muted-foreground">{showValues ? c.current : "•••"} / {c.target}</p>
                </div>
                {!c.ok && <p className="text-xs text-primary mt-2 pl-8">{c.suggestion}</p>}
              </div>
            ))}
          </div>

          {checks.some((c) => !c.ok) && (
            <Button className="w-full mt-4" onClick={() => toast.success("Alterações aprovadas. Você receberá o passo a passo para executá-las na sua corretora.")}>
              Aprovar alterações
            </Button>
          )}
        </>
      )}
    </div>
  );
}
