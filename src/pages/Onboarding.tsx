import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { PluggyConnect } from "react-pluggy-connect";
import { ArrowRight, Check, ChevronLeft, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePortfolio } from "@/contexts/PortfolioContext";
import { notifyConnectionAdded } from "@/lib/notifications";
import {
  runEngine, subScores, brl, parseAmount, monthsToTarget,
  type EngineResult, type EngineInvestment, type SubScores,
} from "@/lib/opportunityEngine";
import kadigLogo from "@/assets/kadig-logo.png";

type Step = "name" | "goal" | "range" | "owns" | "connect" | "analyzing" | "reveal" | "discovery" | "ask" | "goalCreated";
const QUESTION_STEPS: Step[] = ["name", "goal", "range", "owns", "connect"];

const GOALS = ["Aumentar patrimônio", "Gerar renda", "Preservar patrimônio", "Organizar minha vida financeira", "Ainda não sei"];
const RANGES = ["Até R$ 50 mil", "R$ 50 mil a 250 mil", "R$ 250 mil a 1 milhão", "R$ 1 milhão a 5 milhões", "Mais de R$ 5 milhões"];
const OWNS = ["Investimentos", "Conta bancária", "Cripto", "Imóveis", "Empresas", "Veículos", "Dívidas ou financiamentos"];

interface Snapshot { result: EngineResult; subs: SubScores | null; count: number; connections: number; cdi12m: number }

const monthLabel = (months: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toLocaleDateString("pt-BR", { month: "short", year: "numeric" }).replace(". de ", "/").replace(" de ", "/").replace(".", "");
};

const scoreLabel = (s: number) => (s >= 80 ? "Muito bom" : s >= 65 ? "Bom" : s >= 45 ? "Regular" : "Precisa de atenção");

const Onboarding = () => {
  const navigate = useNavigate();
  const { refreshPortfolios } = usePortfolio();
  const [step, setStep] = useState<Step>("name");
  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [range, setRange] = useState("");
  const [owns, setOwns] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [connectToken, setConnectToken] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [visibleLines, setVisibleLines] = useState(0);
  const [analysisDone, setAnalysisDone] = useState(false);
  const [noData, setNoData] = useState(false);
  const [ask, setAsk] = useState("");
  const [createdGoal, setCreatedGoal] = useState<{ target: number; current: string; optimized: string | null } | null>(null);
  const cancelled = useRef(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) return navigate("/auth");
      setUserId(session.user.id);
      const metaName = (session.user.user_metadata?.full_name || session.user.user_metadata?.name || "") as string;
      if (metaName) setName(metaName.split(" ")[0]);
    });
    return () => { cancelled.current = true; };
  }, [navigate]);

  const saveProfile = useCallback(async () => {
    if (!userId) return false;
    setSaving(true);
    try {
      const data = { user_id: userId, full_name: name.trim(), investment_goal: goal, updated_at: new Date().toISOString() };
      const { data: existing } = await supabase.from("profiles").select("id").eq("user_id", userId).maybeSingle();
      const { error } = existing
        ? await supabase.from("profiles").update(data).eq("user_id", userId)
        : await supabase.from("profiles").insert(data);
      if (error) throw error;
      const { data: pf } = await supabase.from("portfolios").select("id").eq("user_id", userId).limit(1).maybeSingle();
      if (!pf) await supabase.from("portfolios").insert({ user_id: userId, name: "Principal", total_value: 0, total_gain: 0 });
      localStorage.setItem(`kadig-onboarding-${userId}`, JSON.stringify({ goal, range, owns }));
      return true;
    } catch {
      toast.error("Não foi possível salvar. Tente novamente.");
      return false;
    } finally {
      setSaving(false);
    }
  }, [userId, name, goal, range, owns]);

  const loadSnapshot = useCallback(async (): Promise<Snapshot | null> => {
    if (!userId) return null;
    const [inv, ga, cn, econ] = await Promise.all([
      supabase.from("investments").select("*").eq("user_id", userId),
      supabase.from("global_assets").select("*").eq("user_id", userId),
      supabase.from("pluggy_connections").select("id", { count: "exact", head: true }).eq("user_id", userId),
      supabase.functions.invoke("market-data", { body: { type: "economic-indicators" } }),
    ]);
    const investments: EngineInvestment[] = (inv.data || []).map((i) => ({
      id: i.id, asset_name: i.asset_name, asset_type: i.asset_type, ticker: i.ticker,
      current_value: Number(i.current_value) || 0, total_invested: Number(i.total_invested) || 0, maturity_date: i.maturity_date,
    }));
    const globals = (ga.data || []).map((a) => ({ id: a.id, name: a.name, category: a.category, value_brl: Number(a.value_brl) || 0 }));
    const e = econ.data as any;
    const ind = { cdi12m: Number(e?.accumulated12m?.cdi) || 0, ipca12m: Number(e?.accumulated12m?.ipca) || 0, selic: Number(e?.current?.selic) || 0 };
    const result = runEngine(investments, globals, [], ind);
    return { result, subs: subScores(investments, result), count: investments.length, connections: cn.count || 0, cdi12m: ind.cdi12m };
  }, [userId]);

  const startAnalysis = useCallback(async () => {
    setStep("analyzing");
    setVisibleLines(0);
    setAnalysisDone(false);
    setNoData(false);
    // Wait for real data from the institution (sync can take a few seconds)
    let s: Snapshot | null = null;
    for (let i = 0; i < 15 && !cancelled.current; i++) {
      s = await loadSnapshot();
      if (s && s.count > 0) break;
      await new Promise((r) => setTimeout(r, 3000));
    }
    if (!s || s.count === 0) { setNoData(true); return; }
    setSnap(s);
    for (let i = 1; i <= 7; i++) {
      await new Promise((r) => setTimeout(r, 650));
      setVisibleLines(i);
    }
    setAnalysisDone(true);
  }, [loadSnapshot]);

  const handleConnect = async () => {
    if (!(await saveProfile())) return;
    try {
      setConnecting(true);
      const { data, error } = await supabase.functions.invoke("pluggy", { body: { action: "create-connect-token" } });
      if (error) throw error;
      setConnectToken(data.accessToken);
    } catch {
      toast.error("Não foi possível iniciar a conexão");
    } finally {
      setConnecting(false);
    }
  };

  const handleConnectionSuccess = async (itemData: any) => {
    setConnectToken(null);
    try {
      const item = itemData.item;
      const connector = item?.connector;
      const { data: existing } = await supabase.from("pluggy_connections").select("id").eq("item_id", item.id).maybeSingle();
      if (!existing) {
        await supabase.from("pluggy_connections").insert({
          user_id: userId!, item_id: item.id, connector_id: connector?.id, connector_name: connector?.name,
          connector_image_url: connector?.imageUrl, connector_primary_color: connector?.primaryColor,
          status: item.status || "PENDING", last_updated_at: item.lastUpdatedAt || item.updatedAt,
        });
      }
      await notifyConnectionAdded(connector?.name || "Instituição");
      const analysis = startAnalysis();
      supabase.functions.invoke("sync-pluggy-investments", { body: { action: "sync-all" } }).then(() => refreshPortfolios());
      await analysis;
    } catch {
      toast.error("Erro ao salvar conexão");
    }
  };

  const handleManual = async () => {
    if (await saveProfile()) navigate("/adicionar-investimento");
  };

  const handleLater = async () => {
    if (await saveProfile()) setStep("ask");
  };

  const finish = () => navigate("/app", { state: { returnToTab: "intelligence" } });

  const handleAsk = async () => {
    const text = ask.trim();
    if (!text) return finish();
    localStorage.setItem(`kadig-onboarding-ask-${userId}`, text);
    const amount = parseAmount(text);
    const isPurchase = /compr|carro|casa|apartamento|viagem/i.test(text);
    if (isPurchase && amount > 0) {
      return navigate("/app", { state: { returnToTab: "intelligence", whatIf: text } });
    }
    if (amount <= 0 || !userId) return finish();
    setSaving(true);
    const s = snap || (await loadSnapshot());
    const { error } = await supabase.from("goals").insert({ user_id: userId, type: "patrimonio", target_value: amount });
    setSaving(false);
    if (error) { toast.error("Não foi possível criar a meta"); return finish(); }
    const current = s?.result.netWorth || 0;
    const rate = s?.cdi12m || 0;
    let currentLabel = "Conecte seu patrimônio para calcular";
    let optimized: string | null = null;
    if (current > 0 && rate > 0) {
      const m = monthsToTarget(current, amount, rate);
      currentLabel = isFinite(m) ? monthLabel(m) : "mais de 100 anos";
      const extra = (s?.result.totalOpportunity || 0) / 12;
      if (extra > 0) {
        const m2 = monthsToTarget(current, amount, rate, extra);
        if (isFinite(m2) && m2 < m) optimized = monthLabel(m2);
      }
    }
    setCreatedGoal({ target: amount, current: currentLabel, optimized });
    setStep("goalCreated");
  };

  const qIndex = QUESTION_STEPS.indexOf(step);
  const back = () => {
    if (qIndex > 0) setStep(QUESTION_STEPS[qIndex - 1]);
    else navigate("/welcome");
  };

  const r = snap?.result;
  const topOpp = r?.insights.find((i) => i.annualImpact > 0) || r?.insights[0];
  const lines = r && snap ? [
    `${brl(r.netWorth)} identificados`,
    `${snap.count} investimento${snap.count === 1 ? "" : "s"} analisado${snap.count === 1 ? "" : "s"}`,
    `${snap.connections} instituiç${snap.connections === 1 ? "ão encontrada" : "ões encontradas"}`,
    "Risco calculado",
    "Liquidez analisada",
    "Rentabilidade comparada ao CDI",
    `${r.insights.length} ponto${r.insights.length === 1 ? "" : "s"} encontrado${r.insights.length === 1 ? "" : "s"}`,
  ] : [];

  const Option = ({ label, selected, onClick, multi }: { label: string; selected: boolean; onClick: () => void; multi?: boolean }) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all active:scale-[0.99] ${
        selected ? "border-primary bg-primary/5" : "border-border bg-card"
      }`}
    >
      <span className="font-medium text-foreground">{label}</span>
      <span className={`w-5 h-5 ${multi ? "rounded-md" : "rounded-full"} border flex items-center justify-center ${selected ? "bg-primary border-primary" : "border-border"}`}>
        {selected && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
      </span>
    </button>
  );

  const Title = ({ title, sub }: { title: string; sub?: string }) => (
    <div className="space-y-2 mb-6">
      <h1 className="text-2xl font-bold text-foreground leading-tight">{title}</h1>
      {sub && <p className="text-muted-foreground">{sub}</p>}
    </div>
  );

  const anim = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -12 }, transition: { duration: 0.25 } };

  const footerButton = (() => {
    switch (step) {
      case "name": return { label: "Continuar", disabled: name.trim().length < 2, onClick: () => setStep("goal") };
      case "goal": return { label: "Continuar", disabled: !goal, onClick: () => setStep("range") };
      case "range": return { label: "Continuar", disabled: !range, onClick: () => setStep("owns") };
      case "owns": return { label: "Continuar", disabled: owns.length === 0, onClick: () => setStep("connect") };
      case "connect": return { label: "Conectar minha primeira instituição", disabled: connecting || saving, onClick: handleConnect };
      case "analyzing": return analysisDone ? { label: "Ver meu resultado", disabled: false, onClick: () => setStep("reveal") }
        : noData ? { label: "Continuar", disabled: false, onClick: () => setStep("ask") } : null;
      case "reveal": return { label: "Ver o que a Kadig encontrou", disabled: false, onClick: () => setStep("discovery") };
      case "discovery": return { label: "Continuar", disabled: false, onClick: () => setStep("ask") };
      case "ask": return { label: ask.trim() ? "Enviar" : "Pular", disabled: saving, onClick: handleAsk };
      case "goalCreated": return { label: "Acompanhar meta", disabled: false, onClick: finish };
    }
  })();

  return (
    <div className="light-theme fixed inset-0 bg-background flex flex-col">
      <header className="p-4 safe-area-inset-top">
        <div className="flex items-center justify-between max-w-md mx-auto h-10">
          {qIndex >= 0 ? (
            <button onClick={back} aria-label="Voltar" className="w-10 h-10 -ml-2 flex items-center justify-center text-foreground">
              <ChevronLeft className="w-5 h-5" />
            </button>
          ) : <img src={kadigLogo} alt="Kadig" className="h-6 invert dark:invert-0" />}
          {qIndex >= 0 && (
            <div className="flex gap-1.5">
              {QUESTION_STEPS.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all ${i === qIndex ? "w-6 bg-primary" : i < qIndex ? "w-1.5 bg-primary/60" : "w-1.5 bg-muted"}`} />
              ))}
            </div>
          )}
          <div className="w-10" />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-5">
        <div className="max-w-md mx-auto py-4">
          <AnimatePresence mode="wait">
            {step === "name" && (
              <motion.div key="name" {...anim}>
                <Title title="Como podemos te chamar?" />
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" type="text" autoComplete="given-name"
                  className="h-14 text-lg bg-card text-foreground" />
              </motion.div>
            )}
            {step === "goal" && (
              <motion.div key="goal" {...anim}>
                <Title title="Qual é seu principal objetivo?" />
                <div className="space-y-2.5">{GOALS.map((g) => <Option key={g} label={g} selected={goal === g} onClick={() => setGoal(g)} />)}</div>
              </motion.div>
            )}
            {step === "range" && (
              <motion.div key="range" {...anim}>
                <Title title="Quanto você tem aproximadamente em patrimônio?" sub="Não precisa ser exato." />
                <div className="space-y-2.5">{RANGES.map((g) => <Option key={g} label={g} selected={range === g} onClick={() => setRange(g)} />)}</div>
              </motion.div>
            )}
            {step === "owns" && (
              <motion.div key="owns" {...anim}>
                <Title title="O que você possui?" sub="Selecione tudo que se aplica." />
                <div className="space-y-2.5">
                  {OWNS.map((g) => (
                    <Option key={g} multi label={g} selected={owns.includes(g)}
                      onClick={() => setOwns((o) => (o.includes(g) ? o.filter((x) => x !== g) : [...o, g]))} />
                  ))}
                </div>
              </motion.div>
            )}
            {step === "connect" && (
              <motion.div key="connect" {...anim}>
                <Title title="Agora vamos montar seu patrimônio." sub="Quanto mais a Kadig conhece, melhores são as análises." />
                <div className="space-y-2.5">
                  <button onClick={handleConnect} disabled={connecting || saving} className="w-full p-4 rounded-xl border border-primary bg-primary/5 text-left">
                    <p className="font-semibold text-foreground">Conectar instituições</p>
                    <p className="text-sm text-muted-foreground">Via Open Finance, com bancos e corretoras</p>
                  </button>
                  <div className="w-full p-4 rounded-xl border border-border bg-card text-left opacity-60">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-foreground">Importar carteira</p>
                      <span className="text-xs text-muted-foreground">Em breve</span>
                    </div>
                    <p className="text-sm text-muted-foreground">PDF, Excel ou nota de corretagem</p>
                  </div>
                  <button onClick={handleManual} disabled={saving} className="w-full p-4 rounded-xl border border-border bg-card text-left">
                    <p className="font-semibold text-foreground">Adicionar manualmente</p>
                    <p className="text-sm text-muted-foreground">Cadastre seus ativos um a um</p>
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-5 text-sm text-muted-foreground">
                  <Lock className="w-4 h-4 shrink-0" />
                  Seus dados são protegidos e você controla suas conexões.
                </div>
                <button onClick={handleLater} disabled={saving} className="w-full mt-4 py-2 text-sm text-muted-foreground underline-offset-4 hover:underline">
                  Fazer depois
                </button>
              </motion.div>
            )}
            {step === "analyzing" && (
              <motion.div key="analyzing" {...anim} className="pt-8">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Kadig</p>
                <h1 className="text-2xl font-bold text-foreground mb-8">
                  {analysisDone ? "Seu diagnóstico está pronto." : noData ? "Seus dados ainda estão chegando." : "Estamos analisando sua vida financeira"}
                </h1>
                {noData ? (
                  <p className="text-muted-foreground">A instituição ainda está enviando as informações. Assim que chegarem, a análise aparece automaticamente na Intelligence.</p>
                ) : (
                  <div className="space-y-4">
                    {!snap && <div className="flex items-center gap-3 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Recebendo dados da instituição</div>}
                    {lines.slice(0, visibleLines).map((l) => (
                      <motion.div key={l} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center"><Check className="w-3 h-3 text-primary-foreground" /></span>
                        <span className="text-foreground">{l}</span>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
            {step === "reveal" && r && (
              <motion.div key="reveal" {...anim} className="text-center pt-4">
                <p className="text-sm text-muted-foreground">Seu Kadig Score</p>
                <motion.p initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}
                  className="text-7xl font-bold text-foreground tabular-nums mt-2">{r.score}</motion.p>
                <p className="text-primary font-semibold">{scoreLabel(r.score)}</p>
                <p className="text-sm text-muted-foreground mt-3">Analisamos {brl(r.netWorth)} do seu patrimônio.</p>
                <div className="mt-6 rounded-2xl border border-border bg-card p-5">
                  <p className="text-3xl font-bold text-foreground tabular-nums">{brl(r.totalOpportunity)}<span className="text-base font-medium text-muted-foreground">/ano</span></p>
                  <p className="text-sm text-muted-foreground mt-1">em oportunidades potenciais identificadas</p>
                  <p className="text-sm text-foreground mt-2">{r.insights.length} pontos encontrados</p>
                </div>
                {snap?.subs && (
                  <div className="mt-4 rounded-2xl border border-border bg-card p-5 space-y-3 text-left">
                    {([["Rentabilidade", snap.subs.rentabilidade], ["Risco", snap.subs.risco], ["Diversificação", snap.subs.diversificacao], ["Liquidez", snap.subs.liquidez], ["Eficiência", snap.subs.eficiencia]] as const).map(([k, v]) => (
                      <div key={k}>
                        <div className="flex justify-between text-sm"><span className="text-muted-foreground">{k}</span><span className="font-semibold text-foreground tabular-nums">{v}/100</span></div>
                        <div className="h-1.5 bg-muted rounded-full mt-1 overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${v}%` }} transition={{ duration: 0.8 }} className="h-full bg-primary rounded-full" /></div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
            {step === "discovery" && (
              <motion.div key="discovery" {...anim}>
                <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Maior oportunidade encontrada</p>
                {topOpp ? (
                  <div className="rounded-2xl border border-border bg-card p-5">
                    <h2 className="text-xl font-bold text-foreground">{topOpp.title}</h2>
                    <p className="text-sm text-muted-foreground mt-2">{topOpp.detail}</p>
                    {topOpp.annualImpact > 0 && (
                      <div className="mt-4">
                        <p className="text-xs text-muted-foreground">Impacto potencial estimado</p>
                        <p className="text-2xl font-bold text-primary tabular-nums">+{brl(topOpp.annualImpact)}/ano</p>
                      </div>
                    )}
                    <p className="text-sm text-foreground mt-4 border-t border-border pt-3">{topOpp.action}</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Nenhuma oportunidade relevante encontrada agora. A Kadig continua monitorando seu patrimônio.</p>
                )}
              </motion.div>
            )}
            {step === "ask" && (
              <motion.div key="ask" {...anim}>
                <Title title="Se a Kadig pudesse resolver uma coisa para você hoje, qual seria?" />
                <Input value={ask} onChange={(e) => setAsk(e.target.value)} type="text" inputMode="text" enterKeyHint="done"
                  placeholder="Ex.: Quero chegar em R$ 10 milhões" className="h-14 bg-card text-foreground"
                  onKeyDown={(e) => e.key === "Enter" && handleAsk()} />
                <div className="flex flex-wrap gap-2 mt-4">
                  {["Quero chegar em R$ 10 milhões", "Quero comprar um carro de R$ 500 mil", "Quero chegar em R$ 1 milhão"].map((s) => (
                    <button key={s} onClick={() => setAsk(s)} className="px-3 py-2 rounded-full border border-border bg-card text-sm text-foreground">{s}</button>
                  ))}
                </div>
              </motion.div>
            )}
            {step === "goalCreated" && createdGoal && (
              <motion.div key="goalCreated" {...anim} className="pt-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Meta criada</p>
                <p className="text-4xl font-bold text-foreground tabular-nums">{brl(createdGoal.target)}</p>
                <div className="mt-6 rounded-2xl border border-border bg-card divide-y divide-border">
                  <div className="flex justify-between p-4"><span className="text-muted-foreground">Ritmo atual</span><span className="font-semibold text-foreground">{createdGoal.current}</span></div>
                  {createdGoal.optimized && (
                    <div className="flex justify-between p-4"><span className="text-muted-foreground">Com otimizações identificadas</span><span className="font-semibold text-primary">{createdGoal.optimized}</span></div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-3">Projeção com o CDI dos últimos 12 meses, sem novos aportes. Não é garantia de rentabilidade.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {footerButton && (
        <footer className="p-5 safe-area-inset-bottom">
          <Button onClick={footerButton.onClick} disabled={footerButton.disabled} className="w-full h-14 text-base font-semibold max-w-md mx-auto flex">
            {(saving || connecting) && step !== "analyzing" ? <Loader2 className="w-5 h-5 animate-spin" /> : <>{footerButton.label}<ArrowRight className="w-4 h-4 ml-2" /></>}
          </Button>
        </footer>
      )}

      {connectToken && (
        <PluggyConnect
          connectToken={connectToken}
          includeSandbox={false}
          onSuccess={handleConnectionSuccess}
          onError={(err) => { toast.error(err?.message || "Erro ao conectar instituição"); }}
          onClose={() => setConnectToken(null)}
        />
      )}
    </div>
  );
};

export default Onboarding;
