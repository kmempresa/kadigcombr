import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import {
  simulateWhatIf, parseAmount, checkAutopilot, recommendWhatIf, brl, formatMonths, BUCKETS,
  type AutopilotRules, type Insight,
} from "@/lib/opportunityEngine";
import { useIntelligence, useIntelligenceAlerts } from "@/hooks/useIntelligence";

const DEFAULT_RULES: AutopilotRules = {
  minLiquidity: 300000, maxRisk: 6, beatCdiPlus: 2, maxConcentrationPct: 20, targetNetWorth: 10000000, targetYear: 2030,
};

const sev: Record<Insight["severity"], { label: string; dot: string }> = {
  risk: { label: "Risco alto", dot: "bg-destructive" },
  efficiency: { label: "Atenção", dot: "bg-warning" },
  opportunity: { label: "Oportunidade", dot: "bg-success" },
};

export type IntelView = "hoje" | "opps" | "whatif" | "autopilot";

interface Props { userName: string; showValues: boolean; initialView?: IntelView; initialWhatIf?: string }

export default function IntelligenceTab({ userName, showValues, initialView = "hoje", initialWhatIf = "" }: Props) {
  const navigate = useNavigate();
  const { loading, dataWarning, userId, investments, connections, globals, goals, ind, result, analyzedAt, reload } = useIntelligence();
  const [view, setView] = useState<IntelView>(initialView);
  const [rules, setRules] = useState<AutopilotRules>(DEFAULT_RULES);
  const [whatIfText, setWhatIfText] = useState(initialWhatIf);
  const [whatIfAmount, setWhatIfAmount] = useState(() => parseAmount(initialWhatIf));
  const [, tick] = useState(0);

  useEffect(() => { setView(initialView); }, [initialView]);
  useEffect(() => { if (initialWhatIf) { setWhatIfText(initialWhatIf); setWhatIfAmount(parseAmount(initialWhatIf)); } }, [initialWhatIf]);
  useEffect(() => { const t = setInterval(() => tick((n) => n + 1), 30000); return () => clearInterval(t); }, []);
  useEffect(() => {
    if (!userId) return;
    // Defaults derived from the user's real data (goals + current portfolio)
    const g = goals.filter((x) => x.target_value > 0).sort((a, b) => b.target_value - a.target_value)[0];
    const base: AutopilotRules = {
      ...DEFAULT_RULES,
      minLiquidity: Math.round(Math.max(result.invested * 0.1, 0) / 1000) * 1000 || DEFAULT_RULES.minLiquidity,
      targetNetWorth: g?.target_value || (result.netWorth > 0 ? Math.round(result.netWorth * 2 / 10000) * 10000 : DEFAULT_RULES.targetNetWorth),
      targetYear: g?.target_date ? new Date(g.target_date).getFullYear() : new Date().getFullYear() + 5,
    };
    const saved = localStorage.getItem(`kadig-autopilot-v3-${userId}`);
    let r = base;
    if (saved) try { r = { ...base, ...JSON.parse(saved) }; } catch { /* ignore */ }
    setRules(r);
  }, [userId, goals, result.invested, result.netWorth]);

  const topShare = useMemo(() => {
    const max = investments.reduce((m, i) => Math.max(m, i.current_value), 0);
    return result.invested ? (max / result.invested) * 100 : 0;
  }, [investments, result.invested]);
  useIntelligenceAlerts(userId, topShare);

  const checks = useMemo(() => checkAutopilot(result, investments, rules, ind), [result, investments, rules, ind]);
  const scenarios = useMemo(
    () => whatIfAmount > 0 ? simulateWhatIf(whatIfAmount, result.netWorth, result.liquid, result.invested, ind, rules.targetNetWorth) : [],
    [whatIfAmount, result, ind, rules.targetNetWorth],
  );
  const feed = result.insights.filter((i) => !(i.id === "stress" && i.severity !== "risk"));
  const found = result.insights.filter((i) => i.annualImpact > 0);
  const buckets = BUCKETS.map((b) => ({ b, v: found.filter((i) => i.bucket === b).reduce((s, i) => s + i.annualImpact, 0) }));

  const v = (n: number, compact = false) => (showValues ? brl(n, compact) : "R$ •••••");
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const firstName = (userName || "").split(" ")[0];
  const ago = (() => {
    if (!analyzedAt) return "agora";
    const m = Math.floor((Date.now() - analyzedAt.getTime()) / 60000);
    return m < 1 ? "agora" : m < 60 ? `há ${m} min` : `há ${Math.floor(m / 60)}h`;
  })();

  const saveRules = (r: AutopilotRules) => {
    setRules(r);
    if (userId) localStorage.setItem(`kadig-autopilot-v3-${userId}`, JSON.stringify(r));
  };

  const openInsight = (i: Insight) => {
    if (["concentration", "crypto", "stress"].includes(i.id)) setView("autopilot");
    else if (i.id.startsWith("goal-")) setView("whatif");
    else setView("opps");
  };

  if (loading) {
    return <div className="flex-1 flex items-center justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  const tabs: { id: IntelView; label: string }[] = [
    { id: "hoje", label: "Hoje" }, { id: "opps", label: "Oportunidades" }, { id: "whatif", label: "E se?" }, { id: "autopilot", label: "Autopilot" },
  ];
  const rec = scenarios.length ? recommendWhatIf(scenarios, whatIfAmount) : null;
  const cols = scenarios.filter((s) => s.key !== "consorcio");
  const broken = checks.filter((c) => c.ok === false).length;

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
            <div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-foreground">Análise do seu patrimônio {ago}</p>
                <button className="text-xs text-primary" onClick={() => reload()}>Atualizar</button>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {investments.length} ativo{investments.length !== 1 ? "s" : ""} · {connections} conta{connections !== 1 ? "s" : ""} · {globals.length} be{globals.length !== 1 ? "ns" : "m"} · {v(result.netWorth, true)} analisados
              </p>
            </div>

            {dataWarning && <p className="text-xs text-destructive">{dataWarning} Tente atualizar novamente.</p>}


            <button onClick={() => setView("opps")} className="w-full text-left bg-card border border-border rounded-xl p-5">
              {result.totalOpportunity > 0 ? (
                <>
                  <p className="text-3xl font-bold text-foreground">{v(result.totalOpportunity)}</p>
                  <p className="text-sm text-muted-foreground mt-1">potencial identificado nos próximos 12 meses</p>
                  <p className="text-xs text-primary font-medium mt-3 flex items-center gap-0.5">
                    {found.length} oportunidade{found.length !== 1 ? "s" : ""} encontrada{found.length !== 1 ? "s" : ""} <ChevronRight className="w-3 h-3" />
                  </p>
                </>
              ) : (
                <>
                  <p className="text-base font-semibold text-foreground">Nenhum ganho financeiro direto encontrado hoje</p>
                  <p className="text-sm text-muted-foreground mt-1">A Kadig segue monitorando e avisa quando surgir algo.</p>
                </>
              )}
              <div className="flex items-center justify-between border-t border-border mt-4 pt-3 text-xs text-muted-foreground">
                <span>Kadig Score <span className="text-foreground font-semibold">{result.score}</span>/100</span>
                <span>Patrimônio {v(result.netWorth, true)}</span>
              </div>
            </button>

            {feed.length === 0 && (
              <p className="text-sm text-muted-foreground">Adicione investimentos ou conecte um banco para a Kadig analisar seu patrimônio.</p>
            )}
            {feed.slice(0, 5).map((i) => (
              <button key={i.id} onClick={() => openInsight(i)} className="w-full text-left bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className={`w-2 h-2 rounded-full ${sev[i.severity].dot}`} />
                  {sev[i.severity].label}
                  {i.annualImpact > 0 && <span className="text-success font-medium">· +{v(i.annualImpact)}/ano</span>}
                </div>
                <p className="text-sm font-semibold text-foreground mt-1.5">{i.title}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">{i.detail}</p>
                <p className="text-xs font-medium text-primary mt-2 flex items-center gap-0.5">{i.cta || "Ver detalhes"} <ChevronRight className="w-3 h-3" /></p>
              </button>
            ))}

            <div className="bg-card border border-border rounded-xl divide-y divide-border">
              {[
                { label: "Simular uma decisão", hint: "E se?", on: () => setView("whatif") },
                { label: "Minhas regras", hint: "Autopilot", on: () => setView("autopilot") },
                { label: "Falar com a Kadig", hint: "Consultor", on: () => navigate("/consultor-ia") },
              ].map((b) => (
                <button key={b.label} onClick={b.on} className="w-full flex items-center justify-between px-4 py-3 text-left">
                  <span className="text-sm text-foreground">{b.label}</span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">{b.hint}<ChevronRight className="w-3.5 h-3.5" /></span>
                </button>
              ))}
            </div>

          </>
        )}

        {view === "opps" && (
          <>
            <div className="bg-card border border-border rounded-xl p-5">
              <p className="text-xs text-muted-foreground">Potencial identificado</p>
              <p className="text-3xl font-bold text-success mt-1">+{v(result.totalOpportunity)}<span className="text-base text-muted-foreground font-medium">/ano</span></p>
              <div className="mt-4 space-y-2">
                {buckets.map(({ b, v: val }) => (
                  <div key={b} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{b}</span>
                    <span className={val > 0 ? "text-success font-medium" : "text-muted-foreground"}>{val > 0 ? `+${v(val)}/ano` : "—"}</span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground mt-3">Juros e taxas passam a ser analisados quando você conecta cartões, empréstimos e fundos.</p>
            </div>

            {found.map((i) => (
              <div key={i.id} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{i.bucket}</span>
                  <span className="text-sm font-semibold text-success">+{v(i.annualImpact)}/ano</span>
                </div>
                <p className="text-sm font-semibold text-foreground mt-1">{i.title}</p>
                <div className="mt-3 space-y-2 text-xs">
                  {[["Situação atual", i.current], ["Sugestão", i.suggestion], ["Impacto estimado", `+${v(i.annualImpact)} por ano`], ["Risco", i.risk]].map(([k, val]) => (
                    <div key={k} className="flex gap-3"><span className="w-28 shrink-0 text-muted-foreground">{k}</span><span className="text-foreground">{val}</span></div>
                  ))}
                </div>
                <div className="mt-3 border-t border-border pt-3">
                  <p className="text-xs text-muted-foreground">Ação sugerida</p>
                  <p className="text-sm text-foreground mt-0.5">{i.action}</p>
                </div>
              </div>
            ))}

            {result.insights.filter((i) => i.annualImpact === 0).length > 0 && (
              <>
                <p className="text-sm font-semibold text-foreground pt-2">Outros pontos analisados</p>
                {result.insights.filter((i) => i.annualImpact === 0).map((i) => (
                  <div key={i.id} className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground"><span className={`w-2 h-2 rounded-full ${sev[i.severity].dot}`} />{i.category}</div>
                    <p className="text-sm font-semibold text-foreground mt-1">{i.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{i.detail}</p>
                  </div>
                ))}
              </>
            )}
          </>
        )}

        {view === "whatif" && (
          <>
            <p className="text-base font-semibold text-foreground">O que você está pensando em fazer?</p>
            <form className="flex gap-2" onSubmit={(e) => {
              e.preventDefault();
              const a = parseAmount(whatIfText);
              if (!a) { toast.error("Informe um valor, por exemplo R$ 600 mil"); return; }
              setWhatIfAmount(a);
            }}>
              <Input value={whatIfText} onChange={(e) => setWhatIfText(e.target.value)} placeholder="Comprar um carro de R$ 600 mil" />
              <Button type="submit">Simular</Button>
            </form>
            <div className="flex gap-2 flex-wrap">
              {["Comprar um carro de R$ 600 mil", "Comprar um apartamento de R$ 1,5 milhão", "Viagem de R$ 80 mil"].map((ex) => (
                <button key={ex} onClick={() => { setWhatIfText(ex); setWhatIfAmount(parseAmount(ex)); }}
                  className="text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground">{ex}</button>
              ))}
            </div>

            {cols.length > 0 && (
              <>
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="grid grid-cols-4 text-xs">
                    <div className="p-3" />
                    {cols.map((c) => (
                      <div key={c.key} className={`p-3 text-center font-semibold ${rec?.key === c.key ? "text-primary" : "text-foreground"}`}>
                        {c.key === "financiamento" ? "Financiar" : c.label}
                      </div>
                    ))}
                    {[
                      ["Liquidez depois", (c: typeof cols[0]) => v(c.liquid, true)],
                      ["Custo 5 anos", (c: typeof cols[0]) => (c.totalCost ? v(c.totalCost, true) : "—")],
                      ["Renda passiva/ano", (c: typeof cols[0]) => v(c.passiveMonthly * 12, true)],
                      [`Meta ${brl(rules.targetNetWorth, true)}`, (c: typeof cols[0]) => (isFinite(c.goalMonths) ? `${(c.goalMonths / 12).toFixed(1).replace(".", ",")} anos` : "—")],
                    ].map(([label, fn]) => (
                      <div key={label as string} className="contents">
                        <div className="p-3 border-t border-border text-muted-foreground">{label as string}</div>
                        {cols.map((c) => (
                          <div key={c.key} className={`p-3 border-t border-border text-center ${rec?.key === c.key ? "text-primary font-semibold" : "text-foreground"}`}>
                             {c.key === "financiamento" && c.monthlyPayment === 0 ? "Indisponível" : (fn as (c: typeof cols[0]) => string)(c)}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
                {rec && (
                  <div className="bg-card border border-border rounded-xl p-4">
                    <p className="text-xs text-muted-foreground">Kadig Intelligence recomenda</p>
                    <p className="text-sm font-semibold text-foreground mt-1">
                      {rec.key === "avista" ? "À vista" : rec.key === "financiamento" ? "Financiar" : "Não comprar agora"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{rec.reason}</p>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {view === "autopilot" && (
          <>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-base font-semibold text-foreground">
                {broken === 0 ? "Todas as regras dentro do limite" : `${broken} regra${broken > 1 ? "s" : ""} saíram do limite`}
              </p>
              <p className="text-xs text-muted-foreground mt-1">A Kadig monitora sua carteira e recomenda ajustes. Nenhuma operação é feita sem você.</p>
            </div>

            <div className="space-y-2">
              {checks.map((c) => (
                <div key={c.id} className="bg-card border border-border rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${c.ok === null ? "bg-muted-foreground" : c.ok ? "bg-success" : "bg-destructive"}`} />
                    <p className="text-sm font-medium text-foreground flex-1">{c.label}</p>
                    <p className="text-xs text-muted-foreground text-right">{c.target}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 pl-4">Atual: {showValues ? c.current : "•••"}</p>
                   {c.ok !== true && <p className="text-xs text-primary mt-1 pl-4">{c.suggestion}</p>}

                </div>
              ))}
            </div>

            <p className="text-sm font-semibold text-foreground pt-2">Suas regras</p>
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              {([
                ["minLiquidity", "Reserva mínima (R$)"],
                ["maxRisk", "Risco máximo (0–10)"],
                ["beatCdiPlus", "Meta de retorno: CDI + (%)"],
                ["maxConcentrationPct", "Concentração máxima por ativo (%)"],
                ["targetNetWorth", "Meta patrimonial (R$)"],
                ["targetYear", "Até o ano"],
              ] as [keyof AutopilotRules, string][]).map(([k, label]) => (
                <div key={k} className="flex items-center justify-between gap-3">
                  <label className="text-xs text-muted-foreground">{label}</label>
                  <Input type="number" className="w-32 h-9 text-right" value={rules[k]}
                    min={k === "targetYear" ? new Date().getFullYear() : 0}
                    max={k === "maxRisk" ? 10 : k === "maxConcentrationPct" ? 100 : undefined}
                    onChange={(e) => saveRules({ ...rules, [k]: Number(e.target.value) || 0 })} />
                </div>
              ))}
            </div>

            {broken > 0 && (
              <Button className="w-full" onClick={() => toast.success("Recomendações salvas. Você recebe o passo a passo para executar na sua corretora.")}>
                Ver o que alterar
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
