import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { PluggyConnect } from "react-pluggy-connect";
import { ArrowRight, Check, ChevronLeft, Loader2, Lock, TrendingUp, Wallet, Shield, LayoutGrid, Compass, Landmark, Bitcoin, Home, Building2, Car, CreditCard, LineChart, FileUp, PenLine } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePortfolio } from "@/contexts/PortfolioContext";
import { notifyConnectionAdded } from "@/lib/notifications";
import {
  runEngine, subScores, brl, parseAmount, monthsToTarget,
  type EngineResult, type EngineInvestment, type SubScores,
} from "@/lib/opportunityEngine";
import { useTheme } from "@/hooks/useTheme";
import { Sun, Moon } from "lucide-react";
import kadigLogo from "@/assets/kadig-logo.png";

type Step = "name" | "goal" | "range" | "owns" | "connect" | "analyzing" | "reveal" | "discovery" | "ask" | "goalCreated" | "theme";
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
  const { theme, setTheme } = useTheme();
  const [exitState, setExitState] = useState<Record<string, string>>({ returnToTab: "intelligence" });
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

  const finish = () => { setExitState({ returnToTab: "intelligence" }); setStep("theme"); };
  const enterApp = () => navigate("/app", { state: exitState });

  const handleAsk = async () => {
    const text = ask.trim();
    if (!text) return finish();
    localStorage.setItem(`kadig-onboarding-ask-${userId}`, text);
    const amount = parseAmount(text);
    const isPurchase = /compr|carro|casa|apartamento|viagem/i.test(text);
    if (isPurchase && amount > 0) {
      setExitState({ returnToTab: "intelligence", whatIf: text }); return setStep("theme");
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

  const GOAL_ICONS: Record<string, any> = {
    "Aumentar patrimônio": TrendingUp, "Gerar renda": Wallet, "Preservar patrimônio": Shield,
    "Organizar minha vida financeira": LayoutGrid, "Ainda não sei": Compass,
  };
  const OWN_ICONS: Record<string, any> = {
    Investimentos: LineChart, "Conta bancária": Landmark, Cripto: Bitcoin, Imóveis: Home,
    Empresas: Building2, "Veículos": Car, "Dívidas ou financiamentos": CreditCard,
  };

  const pickAndGo = (set: (v: string) => void, v: string, next: Step) => {
    set(v);
    if (navigator.vibrate) navigator.vibrate(8);
    setTimeout(() => setStep(next), 320);
  };

  const Tile = ({ label, icon: Icon, selected, onClick, multi }: { label: string; icon?: any; selected: boolean; onClick: () => void; multi?: boolean }) => (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={`relative w-full flex flex-col items-start gap-3 p-4 rounded-2xl border text-left backdrop-blur-xl transition-colors overflow-hidden ${
        selected ? "border-kadig-cyan/70 bg-kadig-cyan/10" : "border-border/60 bg-card/40"
      }`}
    >
      {selected && <motion.span layoutId={multi ? undefined : "tileGlow"} className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-kadig-cyan/20 blur-2xl pointer-events-none" />}
      <div className="flex w-full items-center justify-between">
        {Icon && (
          <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${selected ? "bg-kadig-cyan/20 text-kadig-cyan" : "bg-muted/60 text-muted-foreground"}`}>
            <Icon className="w-[18px] h-[18px]" />
          </span>
        )}
        <span className={`w-5 h-5 ${multi ? "rounded-md" : "rounded-full"} border flex items-center justify-center transition-colors ${selected ? "bg-kadig-cyan border-kadig-cyan" : "border-border"}`}>
          {selected && <Check className="w-3.5 h-3.5 text-kadig-deep" />}
        </span>
      </div>
      <span className="text-sm font-semibold text-foreground leading-snug">{label}</span>
    </motion.button>
  );

  const Title = ({ kicker, title, sub }: { kicker?: string; title: string; sub?: string }) => (
    <div className="space-y-2 mb-6">
      {kicker && <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-kadig-cyan">{kicker}</p>}
      <h1 className="text-[24px] font-bold text-foreground leading-tight tracking-tight">{title}</h1>
      {sub && <p className="text-sm text-muted-foreground">{sub}</p>}
    </div>
  );

  const anim = { initial: { opacity: 0, x: 24 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -24 }, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } };
  const stagger = (i: number) => ({ initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.05 + i * 0.05, duration: 0.3 } });

  const footerButton = (() => {
    switch (step) {
      case "name": return { label: "Continuar", disabled: name.trim().length < 2, onClick: () => setStep("goal") };
      case "goal": return null;
      case "range": return null;
      case "owns": return { label: owns.length ? `Continuar · ${owns.length}` : "Selecione ao menos um", disabled: owns.length === 0, onClick: () => setStep("connect") };
      case "connect": return null;
      case "analyzing": return analysisDone ? { label: "Ver meu resultado", disabled: false, onClick: () => setStep("reveal") }
        : noData ? { label: "Continuar", disabled: false, onClick: () => setStep("ask") } : null;
      case "reveal": return { label: "Ver a maior oportunidade", disabled: false, onClick: () => setStep("discovery") };
      case "discovery": return { label: "Continuar", disabled: false, onClick: () => setStep("ask") };
      case "ask": return { label: ask.trim() ? "Criar minha meta" : "Pular", disabled: saving, onClick: handleAsk };
      case "goalCreated": return { label: "Acompanhar meta", disabled: false, onClick: finish };
      case "theme": return { label: "Entrar na Kadig", disabled: false, onClick: enterApp };
    }
  })();

  const rangeLevel = (i: number) => ((i + 1) / RANGES.length) * 100;

  return (
    <div className="fixed inset-0 bg-kadig-deep text-foreground flex flex-col overflow-hidden" style={{ height: "100dvh" }}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div className="absolute -top-[15%] -left-[25%] w-[85%] h-[45%] bg-kadig-cyan/15 blur-[120px] rounded-full"
          animate={{ x: [0, 30, 0], y: [0, 20, 0] }} transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="absolute -bottom-[15%] -right-[25%] w-[85%] h-[45%] bg-kadig-blue/15 blur-[120px] rounded-full"
          animate={{ x: [0, -30, 0], y: [0, -20, 0] }} transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="absolute inset-0 [background:radial-gradient(ellipse_70%_45%_at_50%_-5%,hsl(var(--kadig-light)/0.16),transparent_70%)]"
          animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} />
      </div>

      <header className="relative z-10 shrink-0 px-4 pb-2" style={{ paddingTop: "max(env(safe-area-inset-top, 0px) + 4px, 16px)" }}>
        <div className="flex items-center gap-3 max-w-md mx-auto h-10">
          {qIndex >= 0 ? (
            <button onClick={back} aria-label="Voltar" className="w-10 h-10 -ml-2 flex items-center justify-center text-foreground rounded-full active:bg-card/50">
              <ChevronLeft className="w-5 h-5" />
            </button>
          ) : <img src={kadigLogo} alt="Kadig" className="h-7 w-auto object-contain" />}
          {qIndex >= 0 && (
            <>
              <div className="flex-1 flex gap-1.5">
                {QUESTION_STEPS.map((_, i) => (
                  <div key={i} className="flex-1 h-1 rounded-full bg-muted/50 overflow-hidden">
                    <motion.div className="h-full bg-gradient-to-r from-kadig-cyan to-primary"
                      initial={false} animate={{ width: i <= qIndex ? "100%" : "0%" }} transition={{ duration: 0.4 }} />
                  </div>
                ))}
              </div>
              <span className="text-[11px] font-mono text-muted-foreground tabular-nums w-10 text-right">{String(qIndex + 1).padStart(2, "0")}/{String(QUESTION_STEPS.length).padStart(2, "0")}</span>
            </>
          )}
        </div>
      </header>

      <main className="relative z-10 flex-1 min-h-0 overflow-y-auto overscroll-contain px-5">
        <div className="max-w-md mx-auto py-4">
          <AnimatePresence mode="wait">
            {step === "name" && (
              <motion.div key="name" {...anim}>
                <Title kicker="Vamos começar" title="Como podemos te chamar?" />
                <div className="relative">
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" type="text" autoComplete="given-name"
                    enterKeyHint="next" onKeyDown={(e) => e.key === "Enter" && name.trim().length >= 2 && setStep("goal")}
                    className="w-full bg-transparent text-3xl font-bold text-foreground placeholder:text-muted-foreground/40 caret-kadig-cyan outline-none pb-3" />
                  <div className="h-px bg-border" />
                  <motion.div className="h-0.5 -mt-px bg-gradient-to-r from-kadig-cyan to-primary" animate={{ width: `${Math.min(100, name.length * 12)}%` }} />
                </div>
                <AnimatePresence>
                  {name.trim().length >= 2 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="mt-8 rounded-2xl border border-border/60 bg-card/40 backdrop-blur-xl p-4">
                      <p className="text-sm text-muted-foreground">Prazer, <span className="text-foreground font-semibold">{name.trim().split(" ")[0]}</span>.</p>
                      <p className="text-sm text-muted-foreground mt-1">Em menos de 1 minuto a Kadig monta seu diagnóstico.</p>
                    </motion.div>
                  )}
                  {step === "theme" && (
              <motion.div key="theme" {...anim}>
                <Title kicker="Último passo" title="Como você prefere ver a Kadig?" />
                <div className="grid grid-cols-2 gap-3">
                  {([["light", "Claro", Sun], ["dark", "Escuro", Moon]] as const).map(([v, label, Icon], i) => {
                    const on = theme === v;
                    return (
                      <motion.button key={v} {...stagger(i)} whileTap={{ scale: 0.96 }}
                        onClick={() => { setTheme(v); navigator.vibrate?.(10); }}
                        className={`rounded-3xl border p-3 text-left backdrop-blur-xl transition-colors ${on ? "border-kadig-cyan bg-kadig-cyan/10" : "border-border/60 bg-card/40"}`}>
                        <div className={`${v === "light" ? "light-theme" : ""} rounded-2xl border border-border bg-background p-3 space-y-2 aspect-[3/4] flex flex-col`}>
                          <div className="h-2 w-10 rounded-full bg-muted-foreground/40" />
                          <div className="rounded-xl bg-card border border-border p-2 space-y-1.5">
                            <div className="h-1.5 w-8 rounded-full bg-muted-foreground/40" />
                            <div className="h-3 w-14 rounded bg-foreground/80" />
                          </div>
                          <div className="flex-1 rounded-xl bg-gradient-to-t from-primary/30 to-transparent" />
                          <div className="flex justify-around">{[0,1,2,3].map(k => <div key={k} className={`h-1.5 w-1.5 rounded-full ${k===0?"bg-primary":"bg-muted-foreground/40"}`} />)}</div>
                        </div>
                        <div className="flex items-center justify-between mt-3 px-1">
                          <span className="flex items-center gap-2 text-sm font-semibold text-foreground"><Icon className="w-4 h-4" />{label}</span>
                          <span className={`w-5 h-5 rounded-full border flex items-center justify-center ${on ? "bg-kadig-cyan border-kadig-cyan" : "border-border"}`}>{on && <Check className="w-3 h-3 text-primary-foreground" />}</span>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-4 text-center">Você pode trocar quando quiser em Conta.</p>
              </motion.div>
            )}
          </AnimatePresence>
              </motion.div>
            )}

            {step === "goal" && (
              <motion.div key="goal" {...anim}>
                <Title kicker="Objetivo" title="O que você quer do seu dinheiro?" sub="Toque em uma opção." />
                <div className="grid grid-cols-2 gap-2.5">
                  {GOALS.map((g, i) => (
                    <motion.div key={g} {...stagger(i)} className={i === GOALS.length - 1 ? "col-span-2" : ""}>
                      <Tile label={g} icon={GOAL_ICONS[g]} selected={goal === g} onClick={() => pickAndGo(setGoal, g, "range")} />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {step === "range" && (
              <motion.div key="range" {...anim}>
                <Title kicker="Patrimônio" title="Quanto você tem, mais ou menos?" sub="Não precisa ser exato." />
                <div className="space-y-2.5">
                  {RANGES.map((g, i) => {
                    const sel = range === g;
                    return (
                      <motion.button key={g} {...stagger(i)} whileTap={{ scale: 0.98 }} onClick={() => pickAndGo(setRange, g, "owns")}
                        className={`relative w-full flex items-center gap-4 px-4 py-4 rounded-2xl border backdrop-blur-xl text-left overflow-hidden ${sel ? "border-kadig-cyan/70 bg-kadig-cyan/10" : "border-border/60 bg-card/40"}`}>
                        <div className="flex items-end gap-0.5 h-6 w-8 shrink-0">
                          {RANGES.map((_, j) => (
                            <span key={j} className={`flex-1 rounded-sm ${j <= i ? (sel ? "bg-kadig-cyan" : "bg-primary/70") : "bg-muted/60"}`} style={{ height: `${20 + j * 20}%` }} />
                          ))}
                        </div>
                        <span className="flex-1 font-semibold text-foreground text-sm">{g}</span>
                        <motion.span className="absolute left-0 bottom-0 h-0.5 bg-gradient-to-r from-kadig-cyan to-primary" initial={{ width: 0 }} animate={{ width: sel ? `${rangeLevel(i)}%` : 0 }} />
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {step === "owns" && (
              <motion.div key="owns" {...anim}>
                <Title kicker="Seu mapa" title="O que faz parte da sua vida financeira?" sub="Selecione tudo que se aplica." />
                <div className="grid grid-cols-2 gap-2.5">
                  {OWNS.map((g, i) => (
                    <motion.div key={g} {...stagger(i)} className={i === OWNS.length - 1 ? "col-span-2" : ""}>
                      <Tile multi label={g} icon={OWN_ICONS[g]} selected={owns.includes(g)}
                        onClick={() => { navigator.vibrate?.(6); setOwns((o) => (o.includes(g) ? o.filter((x) => x !== g) : [...o, g])); }} />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {step === "connect" && (
              <motion.div key="connect" {...anim}>
                <Title kicker="Último passo" title="Conecte seu patrimônio." sub="Quanto mais a Kadig vê, mais oportunidades encontra." />
                <motion.button whileTap={{ scale: 0.98 }} onClick={handleConnect} disabled={connecting || saving}
                  className="relative w-full rounded-3xl border border-kadig-cyan/50 bg-card/40 backdrop-blur-xl p-5 text-left overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-kadig-cyan/20 blur-3xl" />
                  <div className="relative flex items-center justify-center h-28 mb-4">
                    <motion.div className="absolute w-28 h-28 rounded-full border border-kadig-cyan/30" animate={{ rotate: 360 }} transition={{ duration: 12, repeat: Infinity, ease: "linear" }}>
                      <span className="absolute -top-1 left-1/2 w-2 h-2 rounded-full bg-kadig-cyan" />
                    </motion.div>
                    <motion.div className="absolute w-20 h-20 rounded-full border border-primary/40" animate={{ rotate: -360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }}>
                      <span className="absolute -bottom-1 left-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
                    </motion.div>
                    <span className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-kadig-cyan to-primary flex items-center justify-center">
                      <Landmark className="w-6 h-6 text-primary-foreground" />
                    </span>
                  </div>
                  <div className="relative flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">Conectar instituições</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Open Finance · bancos e corretoras</p>
                    </div>
                    <span className="w-10 h-10 rounded-full bg-kadig-cyan text-kadig-deep flex items-center justify-center shrink-0">
                      {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                    </span>
                  </div>
                </motion.button>

                <div className="grid grid-cols-2 gap-2.5 mt-2.5">
                  <button onClick={handleManual} disabled={saving} className="p-4 rounded-2xl border border-border/60 bg-card/40 backdrop-blur-xl text-left active:scale-[0.98] transition-transform">
                    <PenLine className="w-4 h-4 text-muted-foreground mb-3" />
                    <p className="text-sm font-semibold text-foreground">Manual</p>
                    <p className="text-[11px] text-muted-foreground">Ativo por ativo</p>
                  </button>
                  <div className="p-4 rounded-2xl border border-border/40 bg-card/20 text-left opacity-60">
                    <FileUp className="w-4 h-4 text-muted-foreground mb-3" />
                    <p className="text-sm font-semibold text-foreground">Importar</p>
                    <p className="text-[11px] text-muted-foreground">Em breve</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-5 text-xs text-muted-foreground">
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                  Conexão criptografada. Você controla o que compartilha.
                </div>
                <button onClick={handleLater} disabled={saving} className="w-full mt-4 py-2 text-sm text-muted-foreground">
                  Fazer depois
                </button>
              </motion.div>
            )}

            {step === "analyzing" && (
              <motion.div key="analyzing" {...anim} className="pt-2">
                <div className="relative mx-auto w-44 h-44 mb-8">
                  <div className="absolute inset-0 rounded-full border border-border/60" />
                  <div className="absolute inset-6 rounded-full border border-border/40" />
                  <div className="absolute inset-12 rounded-full border border-kadig-cyan/30" />
                  {!analysisDone && !noData && (
                    <motion.div className="absolute inset-0 rounded-full"
                      style={{ background: "conic-gradient(from 0deg, transparent 0deg, hsl(var(--kadig-cyan) / 0.35) 60deg, transparent 61deg)" }}
                      animate={{ rotate: 360 }} transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }} />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    {analysisDone ? (
                      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-14 h-14 rounded-full bg-kadig-cyan flex items-center justify-center">
                        <Check className="w-7 h-7 text-kadig-deep" />
                      </motion.span>
                    ) : (
                      <span className="text-2xl font-bold tabular-nums text-foreground">{Math.round((visibleLines / 7) * 100)}%</span>
                    )}
                  </div>
                </div>
                <h1 className="text-[22px] font-bold text-foreground text-center mb-6">
                  {analysisDone ? "Diagnóstico pronto." : noData ? "Seus dados ainda estão chegando." : "Analisando seu patrimônio"}
                </h1>
                {noData ? (
                  <p className="text-sm text-muted-foreground text-center">A instituição ainda está enviando as informações. Assim que chegarem, a análise aparece automaticamente na Intelligence.</p>
                ) : (
                  <div className="space-y-3">
                    {!snap && <div className="flex items-center gap-3 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Recebendo dados da instituição</div>}
                    {lines.slice(0, visibleLines).map((l) => (
                      <motion.div key={l} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 text-sm font-mono">
                        <span className="w-4 h-4 rounded-full bg-kadig-cyan/20 flex items-center justify-center"><Check className="w-2.5 h-2.5 text-kadig-cyan" /></span>
                        <span className="text-foreground">{l}</span>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {step === "reveal" && r && (
              <motion.div key="reveal" {...anim} className="text-center pt-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-kadig-cyan">Análise concluída</p>
                <motion.p initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}
                  className="text-4xl font-bold text-foreground tabular-nums mt-3 tracking-tight">
                  {brl(r.totalOpportunity)}<span className="text-base font-medium text-muted-foreground">/ano</span>
                </motion.p>
                <p className="text-sm text-muted-foreground mt-1">em oportunidades potenciais</p>
                <p className="text-xs text-muted-foreground mt-1">{r.insights.length} pontos em {brl(r.netWorth)} analisados</p>

                <div className="mt-6 rounded-3xl border border-border/60 bg-card/40 backdrop-blur-xl p-5 flex items-center gap-5 text-left">
                  <div className="relative w-20 h-20 shrink-0">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                      <circle cx="18" cy="18" r="15.5" fill="none" className="stroke-muted" strokeWidth="3" />
                      <motion.circle cx="18" cy="18" r="15.5" fill="none" className="stroke-kadig-cyan" strokeWidth="3" strokeLinecap="round"
                        strokeDasharray="97.4" initial={{ strokeDashoffset: 97.4 }} animate={{ strokeDashoffset: 97.4 * (1 - r.score / 100) }} transition={{ duration: 1.1, ease: "easeOut" }} />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-xl font-bold tabular-nums">{r.score}</span>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Kadig Score</p>
                    <p className="font-semibold text-foreground">{scoreLabel(r.score)}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">Indicador da saúde do seu patrimônio</p>
                  </div>
                </div>

                {snap?.subs && (
                  <div className="mt-3 rounded-3xl border border-border/60 bg-card/40 backdrop-blur-xl p-5 space-y-3 text-left">
                    {([["Rentabilidade", snap.subs.rentabilidade], ["Risco", snap.subs.risco], ["Diversificação", snap.subs.diversificacao], ["Liquidez", snap.subs.liquidez], ["Eficiência", snap.subs.eficiencia]] as const).map(([k, v], i) => (
                      <div key={k}>
                        <div className="flex justify-between text-xs"><span className="text-muted-foreground">{k}</span><span className="font-semibold text-foreground tabular-nums">{v}</span></div>
                        <div className="h-1 bg-muted/60 rounded-full mt-1.5 overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${v}%` }} transition={{ duration: 0.8, delay: 0.3 + i * 0.1 }} className="h-full bg-gradient-to-r from-kadig-cyan to-primary rounded-full" /></div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {step === "discovery" && (
              <motion.div key="discovery" {...anim}>
                <Title kicker="Maior oportunidade" title={topOpp ? topOpp.title : "Tudo em ordem por agora"} />
                {topOpp ? (
                  <div className="relative rounded-3xl border border-kadig-cyan/40 bg-card/40 backdrop-blur-xl p-5 overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-kadig-cyan/15 blur-3xl" />
                    <p className="relative text-sm text-muted-foreground">{topOpp.detail}</p>
                    {topOpp.annualImpact > 0 && (
                      <div className="relative mt-5">
                        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Impacto estimado</p>
                        <p className="text-3xl font-bold text-kadig-cyan tabular-nums mt-1">+{brl(topOpp.annualImpact)}<span className="text-sm text-muted-foreground font-medium">/ano</span></p>
                      </div>
                    )}
                    <div className="relative mt-5 pt-4 border-t border-border/60 flex gap-3">
                      <ArrowRight className="w-4 h-4 text-kadig-cyan shrink-0 mt-0.5" />
                      <p className="text-sm text-foreground">{topOpp.action}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhuma oportunidade relevante agora. A Kadig continua monitorando seu patrimônio.</p>
                )}
              </motion.div>
            )}

            {step === "ask" && (
              <motion.div key="ask" {...anim}>
                <Title kicker="Sua meta" title="Se a Kadig pudesse resolver uma coisa hoje, qual seria?" />
                <input value={ask} onChange={(e) => setAsk(e.target.value)} type="text" inputMode="text" enterKeyHint="done"
                  placeholder="Ex.: Quero chegar em R$ 1 milhão"
                  className="w-full h-14 px-4 rounded-2xl border border-border/60 bg-card/40 backdrop-blur-xl text-foreground placeholder:text-muted-foreground/60 caret-kadig-cyan outline-none focus:border-kadig-cyan/70"
                  onKeyDown={(e) => e.key === "Enter" && handleAsk()} />
                <div className="flex flex-wrap gap-2 mt-4">
                  {["Quero chegar em R$ 1 milhão", "Quero chegar em R$ 10 milhões", "Quero comprar um carro de R$ 500 mil"].map((s, i) => (
                    <motion.button key={s} {...stagger(i)} whileTap={{ scale: 0.95 }} onClick={() => setAsk(s)}
                      className={`px-3.5 py-2 rounded-full border text-xs ${ask === s ? "border-kadig-cyan/70 bg-kadig-cyan/10 text-foreground" : "border-border/60 bg-card/40 text-muted-foreground"}`}>{s}</motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === "goalCreated" && createdGoal && (
              <motion.div key="goalCreated" {...anim} className="pt-2">
                <Title kicker="Meta criada" title={brl(createdGoal.target)} />
                <div className="rounded-3xl border border-border/60 bg-card/40 backdrop-blur-xl divide-y divide-border/60">
                  <div className="flex justify-between p-4 text-sm"><span className="text-muted-foreground">Ritmo atual</span><span className="font-semibold text-foreground">{createdGoal.current}</span></div>
                  {createdGoal.optimized && (
                    <div className="flex justify-between p-4 text-sm"><span className="text-muted-foreground">Com otimizações</span><span className="font-semibold text-kadig-cyan">{createdGoal.optimized}</span></div>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-3">Projeção com o CDI dos últimos 12 meses, sem novos aportes. Não é garantia de rentabilidade.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {footerButton && (
        <footer className="relative z-10 shrink-0 px-5 pt-3" style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px) + 8px, 20px)" }}>
          <motion.button whileTap={{ scale: 0.98 }} onClick={footerButton.onClick} disabled={footerButton.disabled}
            className="w-full h-[54px] max-w-md mx-auto flex items-center justify-center rounded-2xl text-base font-semibold text-primary-foreground bg-gradient-to-r from-kadig-cyan to-primary disabled:opacity-40 transition-opacity">
            {(saving || connecting) && step !== "analyzing" ? <Loader2 className="w-5 h-5 animate-spin" /> : <>{footerButton.label}<ArrowRight className="w-4 h-4 ml-2" /></>}
          </motion.button>
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
