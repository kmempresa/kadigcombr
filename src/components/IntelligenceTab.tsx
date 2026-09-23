import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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

export default function IntelligenceTab({ userName, showValues, initialView = "hoje", initialWhatIf = "" }: Props) {
  const navigate = useNavigate();
  const { loading, userId, investments, connections, globals, ind, result } = useIntelligence();
  const [view, setView] = useState<IntelView>(initialView);
  const [rules, setRules] = useState<AutopilotRules>(DEFAULT_RULES);
  const [whatIfText, setWhatIfText] = useState(initialWhatIf);
  const [whatIfAmount, setWhatIfAmount] = useState(() => parseAmount(initialWhatIf));
  const [ask, setAsk] = useState("");

  useEffect(() => { setView(initialView); }, [initialView]);
  useEffect(() => { if (initialWhatIf) { setWhatIfText(initialWhatIf); setWhatIfAmount(parseAmount(initialWhatIf)); } }, [initialWhatIf]);
  useEffect(() => {
    if (!userId) return;
    const saved = localStorage.getItem(`kadig-autopilot-${userId}`);
    if (saved) try { setRules({ ...DEFAULT_RULES, ...JSON.parse(saved) }); } catch { /* ignore */ }
  }, [userId]);

  const topShare = useMemo(() => {
    const max = investments.reduce((m, i) => Math.max(m, i.current_value), 0);
    return result.netWorth ? (max / result.netWorth) * 100 : 0;
  }, [investments, result.netWorth]);
  useIntelligenceAlerts(userId, topShare);

  const dayGain = result.invested * (Math.pow(1 + ind.cdi12m / 100, 1 / 252) - 1);
  const checks = useMemo(() => checkAutopilot(result, investments, rules, ind), [result, investments, rules, ind]);
  const scenarios = useMemo(
    () => whatIfAmount > 0 ? simulateWhatIf(whatIfAmount, result.netWorth, result.liquid, result.invested, ind, rules.targetNetWorth) : [],
    [whatIfAmount, result, ind, rules.targetNetWorth],
  );
  const attention = result.insights.filter((i) => !(i.id === "stress" && i.severity !== "risk"));

  const v = (n: number, compact = false) => (showValues ? brl(n, compact) : "R$ •••••");
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const firstName = (userName || "").split(" ")[0];
  const health = result.score >= 70 ? "saudável" : result.score >= 40 ? "estável, com pontos a melhorar" : "exposto a riscos importantes";

  const saveRules = (r: AutopilotRules) => {
    setRules(r);
    if (userId) localStorage.setItem(`kadig-autopilot-${userId}`, JSON.stringify(r));
  };

  const openInsight = (i: Insight) => {
    if (i.id === "concentration" || i.id === "crypto" || i.id === "stress") setView("autopilot");
    else if (i.id.startsWith("goal-")) setView("whatif");
    else setView("opps");
  };

  if (loading) {
    return <div className="flex-1 flex items-center justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  const InsightCard = ({ i }: { i: Insight }) => {
    const s = sevStyle[i.severity];
    return (
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className={`w-2 h-2 rounded-full ${s.dot}`} />{i.category}</span>
          {i.annualImpact > 0 && <span className="text-xs font-semibold text-success">+{v(i.annualImpact)}/ano</span>}
        </div>
        <p className="font-semibold text-foreground text-sm">{i.title}</p>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{i.detail}</p>
        <p className="text-xs text-primary mt-2 font-medium">{i.action}</p>
      </div>
    );
  };

  const tabs: { id: IntelView; label: string }[] = [
    { id: "hoje", label: "Hoje" }, { id: "opps", label: "Oportunidades" }, { id: "whatif", label: "E se?" }, { id: "autopilot", label: "Autopilot" },
  ];

  return (
    <div className="flex-1 pb-20">
      <header className="relative overflow-hidden pt-safe">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative px-4 pb-4 pt-2">
          <span className="text-xs text-muted-foreground">{greeting}{firstName ? `, ${firstName}` : ""}</span>
          <p className="font-semibold text-foreground text-base">Intelligence</p>
        </div>
      </header>

      <div className="flex border-b border-border px-4 overflow-x-auto bg-card/50">
        {tabs.map((t) => (
          <motion.button key={t.id} onClick={() => setView(t.id)} whileTap={{ scale: 0.95 }}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-all relative ${view === t.id ? "text-foreground" : "text-muted-foreground"}`}>
            {t.label}
            {view === t.id && <motion.div layoutId="intelTab" className="absolute bottom-0 left-2 right-2 h-[3px] bg-primary rounded-full" />}
          </motion.button>
        ))}
      </div>

      <div className="p-4 space-y-4">
      {view === "hoje" && (
        <>
          <p className="text-sm text-muted-foreground">
            Seu patrimônio está {health}{attention.length ? `, e encontramos ${attention.length} ponto${attention.length > 1 ? "s" : ""} importante${attention.length > 1 ? "s" : ""}.` : "."}
          </p>
          <p className="text-[11px] text-muted-foreground mt-2">
            Analisamos {investments.length} ativo{investments.length !== 1 ? "s" : ""}, {connections} conta{connections !== 1 ? "s" : ""} conectada{connections !== 1 ? "s" : ""} e {globals.length} bem{globals.length !== 1 ? "ns" : ""} do patrimônio global.
          </p>

          <div className="grid grid-cols-5 gap-3 mt-5">
            <div className="col-span-3 bg-card border border-border rounded-xl p-4">
              <p className="text-2xl font-bold text-success">{v(result.totalOpportunity)}/ano</p>
              <p className="text-xs text-muted-foreground mt-1">em oportunidades identificadas</p>
            </div>
            <div className="col-span-2 bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground">Kadig Score</p>
              <p className={`text-2xl font-bold ${result.score >= 70 ? "text-success" : result.score >= 40 ? "text-warning" : "text-destructive"}`}>{result.score}</p>
              <div className="h-1.5 bg-muted rounded-full mt-1.5 overflow-hidden"><div className="h-full bg-primary" style={{ width: `${result.score}%` }} /></div>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">Patrimônio líquido {v(result.netWorth)} · <span className="text-success">+{v(dayGain)} estimado hoje</span></p>

          <div className="space-y-2.5 mt-5">
            {attention.length === 0 && (
              <p className="text-sm text-muted-foreground">Adicione investimentos ou conecte um banco para a Kadig analisar seu patrimônio.</p>
            )}
            {attention.slice(0, 3).map((i) => {
              const s = sevStyle[i.severity];
              return (
                <button key={i.id} onClick={() => openInsight(i)} className="w-full text-left bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                    <span className="text-xs text-muted-foreground">{s.label}</span>
                  </div>
                  <p className="text-sm font-semibold text-foreground mt-1.5">{i.title}</p>
                  {i.annualImpact > 0 && <p className="text-xs text-success mt-0.5">Potencial estimado: +{v(i.annualImpact)}/ano</p>}
                  <p className="text-xs font-medium text-primary mt-2 flex items-center gap-0.5">{ctaFor(i)} <ChevronRight className="w-3 h-3" /></p>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4">
            <button onClick={() => setView("whatif")} className="bg-card border border-border rounded-xl p-3 text-left">
              <Calculator className="w-4 h-4 text-primary" /><p className="text-xs font-semibold text-foreground mt-1.5">E se?</p>
            </button>
            <button onClick={() => setView("autopilot")} className="bg-card border border-border rounded-xl p-3 text-left">
              <Bot className="w-4 h-4 text-primary" /><p className="text-xs font-semibold text-foreground mt-1.5">Autopilot</p>
            </button>
            <button onClick={() => navigate("/consultor-ia")} className="bg-card border border-border rounded-xl p-3 text-left">
              <MessageCircle className="w-4 h-4 text-primary" /><p className="text-xs font-semibold text-foreground mt-1.5">Pergunte à Kadig</p>
            </button>
          </div>

          <form className="flex gap-2 mt-4" onSubmit={(e) => { e.preventDefault(); if (ask.trim()) navigate("/consultor-ia", { state: { prefill: ask.trim() } }); }}>
            <Input value={ask} onChange={(e) => setAsk(e.target.value)} placeholder="Pergunte qualquer coisa sobre seu patrimônio..." />
            <Button type="submit" size="icon" aria-label="Perguntar"><Send className="w-4 h-4" /></Button>
          </form>
        </>
      )}

      {view === "opps" && (
        <>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground">Encontramos no seu patrimônio</p>
            <p className="text-2xl font-bold text-success">{v(result.totalOpportunity)}/ano</p>
            <p className="text-xs text-muted-foreground mt-1">em oportunidades, priorizadas por impacto.</p>
          </div>
          <div className="space-y-3 mt-4">{result.insights.map((i) => <InsightCard key={i.id} i={i} />)}</div>
        </>
      )}

      {view === "whatif" && (
        <>
          <p className="text-sm text-muted-foreground">Descreva uma compra ou decisão. Ex: "Quero comprar uma Porsche de R$ 600 mil".</p>
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
                <div key={s.key} className="bg-card border border-border rounded-xl p-4">
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
          <p className="text-sm text-muted-foreground">Defina sua estratégia. A Kadig monitora sua carteira e sugere ajustes quando algo sai da regra.</p>
          <div className="bg-card border border-border rounded-xl p-4 mt-4 space-y-3">
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
    </div>
  );
}
