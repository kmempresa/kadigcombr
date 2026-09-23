// Kadig Opportunity Engine — deterministic analysis of the user's real financial data.

export interface EngineInvestment {
  id: string;
  asset_name: string;
  asset_type: string;
  ticker: string | null;
  current_value: number;
  total_invested: number;
  maturity_date: string | null;
}

export interface EngineGlobalAsset {
  id: string;
  name: string;
  category: string;
  value_brl: number;
}

export interface EngineGoal {
  id: string;
  type: string;
  target_value: number;
  target_date: string | null;
}

export interface EngineIndicators {
  cdi12m: number; // % a.a.
  ipca12m: number; // % a.a.
  selic: number; // % a.a.
  financing?: number; // % a.a. taxa média BCB (série 20749)
}

export interface AutopilotRules {
  minLiquidity: number;
  maxRisk: number; // 0-10
  beatCdiPlus: number;
  maxConcentrationPct: number;
  targetNetWorth: number;
  targetYear: number;
}

export const riskScore = (stress: number, invested: number) => invested ? Math.min(10, ((stress / invested) * 100) / 2) : 0;

export type InsightSeverity = "risk" | "efficiency" | "opportunity";

export interface Insight {
  id: string;
  severity: InsightSeverity;
  category: string;
  title: string;
  detail: string;
  annualImpact: number; // R$/ano estimated (0 when not monetary)
  action: string;
  exposure?: number; // R$ at risk (for risk items)
  bucket?: OpportunityBucket;
  current?: string;
  suggestion?: string;
  risk?: string;
  cta?: string;
}

export type OpportunityBucket = "Rentabilidade" | "Juros/dívidas" | "Impostos" | "Taxas" | "Caixa parado";
export const BUCKETS: OpportunityBucket[] = ["Rentabilidade", "Juros/dívidas", "Impostos", "Taxas", "Caixa parado"];

export type AssetClass = "cash" | "fixed" | "equity" | "crypto" | "fund" | "realestate" | "other";

export function classify(type: string): AssetClass {
  const t = (type || "").toLowerCase();
  if (t.includes("conta") || t.includes("poupan") || t.includes("saldo")) return "cash";
  if (t.includes("cripto") || t.includes("crypto") || t.includes("bitcoin")) return "crypto";
  if (t.includes("fii") || t.includes("imobili")) return "realestate";
  if (t.includes("fundo")) return "fund";
  if (t.includes("renda fixa") || t.includes("cdb") || t.includes("lci") || t.includes("lca") || t.includes("tesouro") || t.includes("deb") || t.includes("cri") || t.includes("cra")) return "fixed";
  if (t.includes("ação") || t.includes("acao") || t.includes("ações") || t.includes("bdr") || t.includes("etf") || t.includes("stock")) return "equity";
  return "other";
}

// Estimated drop per class in a 20% Ibovespa crash scenario
const STRESS: Record<AssetClass, number> = {
  cash: 0, fixed: 0.02, equity: 0.2, crypto: 0.4, fund: 0.08, realestate: 0.12, other: 0.1,
};

export function stressLoss(investments: EngineInvestment[]) {
  return investments.reduce((s, i) => s + i.current_value * STRESS[classify(i.asset_type)], 0);
}

export function liquidity(investments: EngineInvestment[]) {
  return investments
    // Fixed income may have lockups; only balances explicitly classified as cash are certainly liquid.
    .filter((i) => classify(i.asset_type) === "cash")
    .reduce((s, i) => s + i.current_value, 0);
}

export function monthsToTarget(current: number, target: number, annualRate: number, monthlyContribution = 0) {
  if (current >= target) return 0;
  const r = Math.pow(1 + annualRate / 100, 1 / 12) - 1;
  let v = current;
  for (let m = 1; m <= 1200; m++) {
    v = v * (1 + r) + monthlyContribution;
    if (v >= target) return m;
  }
  return Infinity;
}

export function formatMonths(m: number) {
  if (!isFinite(m)) return "mais de 100 anos";
  if (m === 0) return "já atingida";
  const y = Math.floor(m / 12);
  const mo = m % 12;
  return [y ? `${y} ano${y > 1 ? "s" : ""}` : "", mo ? `${mo} ${mo > 1 ? "meses" : "mês"}` : ""].filter(Boolean).join(" e ");
}

export const brl = (v: number, compact = false) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: compact && Math.abs(v) >= 1000 ? 1 : 0,
    notation: compact && Math.abs(v) >= 100000 ? "compact" : "standard",
  }).format(v);

export interface EngineResult {
  netWorth: number;
  invested: number;
  globalTotal: number;
  liquid: number;
  stress: number;
  score: number;
  insights: Insight[];
  totalOpportunity: number;
  allocation: { cls: AssetClass; value: number; pct: number }[];
}

export function runEngine(
  investments: EngineInvestment[],
  globalAssets: EngineGlobalAsset[],
  goals: EngineGoal[],
  ind: EngineIndicators,
): EngineResult {
  const invested = investments.reduce((s, i) => s + i.current_value, 0);
  const globalTotal = globalAssets.reduce((s, a) => s + a.value_brl, 0);
  const netWorth = invested + globalTotal;
  const liquid = liquidity(investments);
  const stress = stressLoss(investments);
  const insights: Insight[] = [];
  let penalty = 0;

  const byClass = new Map<AssetClass, number>();
  investments.forEach((i) => {
    const c = classify(i.asset_type);
    byClass.set(c, (byClass.get(c) || 0) + i.current_value);
  });
  const allocation = Array.from(byClass.entries())
    .map(([cls, value]) => ({ cls, value, pct: invested ? (value / invested) * 100 : 0 }))
    .sort((a, b) => b.value - a.value);

  if (invested <= 0) {
    return { netWorth, invested, globalTotal, liquid, stress, score: 0, insights, totalOpportunity: 0, allocation };
  }

  // 1. Idle cash (checking account earns ~0%)
  const cash = byClass.get("cash") || 0;
  const reserve = Math.max(invested * 0.05, 5000);
  const idle = cash - reserve;
  if (idle > 1000 && ind.cdi12m > 0) {
    const impact = idle * (ind.cdi12m / 100) * 0.85; // net of IR estimate
    insights.push({
      id: "idle-cash",
      severity: "efficiency",
      category: "Caixa parado",
      title: `${brl(idle)} parados sem rendimento`,
      detail: `Esse valor está em conta corrente, acima de uma reserva de ${brl(reserve)}. Aplicado a 100% do CDI (${ind.cdi12m.toFixed(2)}% a.a.), renderia cerca de ${brl(impact)} por ano.`,
      annualImpact: impact,
      action: "Mover para um CDB de liquidez diária ou Tesouro Selic",
      bucket: "Caixa parado",
      current: `${brl(idle)} em conta corrente rendendo 0%`,
      suggestion: "CDB com liquidez diária a 100% do CDI",
      risk: "Baixo · coberto pelo FGC até R$ 250 mil por banco",
      cta: "Ver oportunidade",
    });
    penalty += Math.min(15, (idle / invested) * 60);
  }

  // 2. Concentration
  const sorted = [...investments].sort((a, b) => b.current_value - a.current_value);
  const top = sorted[0];
  const topPct = (top.current_value / invested) * 100;
  const top3Pct = (sorted.slice(0, 3).reduce((s, i) => s + i.current_value, 0) / invested) * 100;
  if (topPct > 25 && sorted.length > 1) {
    insights.push({
      id: "concentration",
      severity: "risk",
      category: "Concentração",
      title: `${topPct.toFixed(0)}% da carteira em um único ativo`,
      detail: `${top.asset_name} representa ${brl(top.current_value)}. Os 3 maiores ativos somam ${top3Pct.toFixed(0)}% do total. Um problema nesse ativo afetaria boa parte do seu patrimônio.`,
      annualImpact: 0,
      action: "Reduzir a posição para até 20–25% e diversificar",
      exposure: top.current_value * STRESS[classify(top.asset_type)] || top.current_value * 0.2,
      cta: "Simular redução",
    });
    const last = insights[insights.length - 1];
    last.detail = `Em um cenário de -20% no mercado, impacto estimado: -${brl(last.exposure!)}. ` + last.detail;
    penalty += Math.min(25, (topPct - 25) * 0.5);
  }

  // 3. Crypto exposure
  const cryptoPct = ((byClass.get("crypto") || 0) / invested) * 100;
  if (cryptoPct > 15) {
    insights.push({
      id: "crypto",
      severity: "risk",
      category: "Volatilidade",
      title: `Exposição a cripto em ${cryptoPct.toFixed(0)}%`,
      detail: `Criptoativos podem cair 40% ou mais em poucas semanas. A faixa usual para perfis moderados é de 2% a 10% do patrimônio investido.`,
      annualImpact: 0,
      action: "Rebalancear parte da posição para renda fixa",
      exposure: (byClass.get("crypto") || 0) * 0.4,
      cta: "Simular redução",
    });
    penalty += Math.min(20, (cryptoPct - 15) * 0.4);
  }

  // 4. Stress scenario
  const stressPct = (stress / invested) * 100;
  insights.push({
    id: "stress",
    severity: stressPct > 15 ? "risk" : "opportunity",
    category: "Proteção",
    title: `Queda de 20% no Ibovespa: impacto de ${brl(stress)}`,
    detail: `Estimativa de perda de ${stressPct.toFixed(1)}% da carteira em um cenário de crise, considerando a sensibilidade de cada classe de ativo.`,
    annualImpact: 0,
    action: stressPct > 15 ? "Aumentar a parcela em renda fixa pós-fixada" : "Sua carteira está bem protegida",
    exposure: stressPct > 15 ? stress * 0.5 : 0,
    cta: "Ver proteção",
  });

  // 5. Maturities in next 30 days
  const now = Date.now();
  const maturing = investments.filter((i) => {
    if (!i.maturity_date) return false;
    const d = new Date(i.maturity_date).getTime() - now;
    return d >= 0 && d <= 30 * 86400000;
  });
  if (maturing.length) {
    const total = maturing.reduce((s, i) => s + i.current_value, 0);
    insights.push({
      id: "maturity",
      severity: "opportunity",
      category: "Vencimentos",
      title: `${brl(total)} possuem vencimento nos próximos ${Math.max(1, Math.ceil(Math.max(...maturing.map((m) => new Date(m.maturity_date!).getTime() - now)) / 86400000))} dias`,
      exposure: total * 0.05,
      cta: "Planejar reinvestimento",
      detail: `${maturing.map((m) => m.asset_name).join(", ")}. Planeje o reinvestimento para não deixar o dinheiro parado.`,
      annualImpact: 0,
      action: "Definir onde reinvestir antes do vencimento",
    });
  }

  // 6. Low diversification
  if (allocation.length <= 2) {
    penalty += 10;
    insights.push({
      id: "diversification",
      severity: "efficiency",
      category: "Diversificação",
      title: `Carteira em apenas ${allocation.length} classe${allocation.length > 1 ? "s" : ""} de ativos`,
      detail: `Distribuir entre renda fixa, ações, fundos imobiliários e exterior reduz o risco sem necessariamente reduzir o retorno.`,
      annualImpact: 0,
      action: "Adicionar novas classes de ativos",
    });
  }

  // 7. Goals. Only calculate when both official benchmark values are available.
  goals.forEach((g) => {
    if (!g.target_value || ind.cdi12m <= 0 || ind.ipca12m <= 0) return;
    const m = monthsToTarget(netWorth, g.target_value, ind.cdi12m - ind.ipca12m);
    insights.push({
      id: `goal-${g.id}`,
      severity: "opportunity",
      category: "Objetivos",
      title: `Meta de ${brl(g.target_value, true)}: ${formatMonths(m)}`,
      detail: `No ritmo atual, sem novos aportes e com rendimento real de ${(ind.cdi12m - ind.ipca12m).toFixed(1)}% a.a., esse é o prazo estimado.`,
      annualImpact: 0,
      action: "Simular aportes mensais para acelerar",
    });
  });

  // Liquidity score
  if (liquid / invested < 0.1) penalty += 10;

  const weight = (i: Insight) => i.annualImpact + (i.exposure || 0) * 0.1;
  insights.sort((a, b) => weight(b) - weight(a));

  return {
    netWorth,
    invested,
    globalTotal,
    liquid,
    stress,
    score: Math.max(0, Math.min(100, Math.round(100 - penalty))),
    insights,
    totalOpportunity: insights.reduce((s, i) => s + i.annualImpact, 0),
    allocation,
  };
}

// ----- What If -----

export function parseAmount(text: string): number {
  const t = text.toLowerCase().replace(/r\$\s?/g, "");
  const m = t.match(/(\d+(?:[.,]\d+)*)\s*(mil|k|milh(?:ão|ao|ões|oes)|mi|m\b)?/);
  if (!m) return 0;
  let raw = m[1];
  const unit = m[2];
  if (unit) {
    raw = raw.replace(/\./g, "").replace(",", ".");
  } else {
    raw = raw.replace(/\./g, "").replace(",", ".");
  }
  let n = parseFloat(raw);
  if (!unit) return n;
  if (unit === "mil" || unit === "k") n *= 1_000;
  else n *= 1_000_000;
  return n;
}

export interface WhatIfScenario {
  key: "avista" | "financiamento" | "consorcio" | "nao";
  label: string;
  netWorth: number;
  liquid: number;
  passiveMonthly: number;
  totalCost: number;
  monthlyPayment: number;
  goalMonths: number;
  note: string;
}

export function simulateWhatIf(
  amount: number,
  netWorth: number,
  liquid: number,
  invested: number,
  ind: EngineIndicators,
  goal: number,
): WhatIfScenario[] {
  const netRate = (ind.cdi12m / 100) * 0.85;
  const passive = (v: number) => (Math.max(0, v) * netRate) / 12;
  const realRate = ind.cdi12m - ind.ipca12m;

  // Financing: 20% down, 60x at real BCB average rate
  const down = amount * 0.2;
  const fin = amount - down;
  const annualFin = ind.financing && ind.financing > 0 ? ind.financing : 0;
  const i = annualFin > 0 ? Math.pow(1 + annualFin / 100, 1 / 12) - 1 : 0, n = 60;
  const pmt = i > 0 ? (fin * i) / (1 - Math.pow(1 + i, -n)) : 0;
  const finTotal = down + pmt * n;

  // Consortium: 80 months, 16% admin fee
  const consTotal = amount * 1.16;
  const consPmt = consTotal / 80;

  const mk = (key: WhatIfScenario["key"], label: string, nw: number, liq: number, inv: number, cost: number, pay: number, note: string): WhatIfScenario => ({
    key, label, netWorth: nw, liquid: liq, passiveMonthly: passive(inv), totalCost: cost, monthlyPayment: pay,
    goalMonths: monthsToTarget(nw, goal, realRate, -pay), note,
  });

  return [
    mk("avista", "À vista", netWorth - amount, liquid - amount, invested - amount, amount, 0,
      liquid < amount ? "Sua liquidez atual não cobre a compra sem vender outros ativos." : "Menor custo total, mas reduz sua liquidez imediatamente."),
    mk("financiamento", "Financiamento", annualFin > 0 ? netWorth - down - (finTotal - amount) * 0.2 : netWorth, annualFin > 0 ? liquid - down : liquid, annualFin > 0 ? invested - down : invested, finTotal, pmt,
      annualFin > 0 ? `Entrada de ${brl(down)} + 60x de ${brl(pmt)} (${(i * 100).toFixed(2).replace(".", ",")}% a.m., taxa média do Banco Central). Juros totais de ${brl(finTotal - amount)}.` : "Taxa média de financiamento indisponível no Banco Central."),
    mk("consorcio", "Consórcio", netWorth - consTotal * 0.1, liquid, invested, consTotal, consPmt,
      `80x de ${brl(consPmt)} com taxa de administração de 16%. Sem garantia de data de contemplação.`),
    mk("nao", "Não comprar", netWorth, liquid, invested, 0, 0,
      `Mantendo o valor investido, ele renderia cerca de ${brl(amount * netRate)} no próximo ano.`),
  ];
}

// ----- Autopilot -----

export interface RuleCheck {
  id: string;
  label: string;
  ok: boolean;
  current: string;
  target: string;
  suggestion: string;
}

export function checkAutopilot(r: EngineResult, investments: EngineInvestment[], rules: AutopilotRules, ind: EngineIndicators): RuleCheck[] {
  const risk = riskScore(r.stress, r.invested);
  const totalCost = investments.reduce((s, i) => s + i.total_invested, 0);
  const ret = totalCost ? ((r.invested - totalCost) / totalCost) * 100 : 0;
  const bench = ind.cdi12m + rules.beatCdiPlus;
  const top = investments.reduce((m, i) => (i.current_value > (m?.current_value || 0) ? i : m), null as EngineInvestment | null);
  const topPct = top && r.invested ? (top.current_value / r.invested) * 100 : 0;
  const months = monthsToTarget(r.netWorth, rules.targetNetWorth, ind.cdi12m - ind.ipca12m);
  const monthsLeft = Math.max(0, (rules.targetYear - new Date().getFullYear()) * 12 + (11 - new Date().getMonth()));
  const ok = (b: boolean, s: string) => (b ? "Dentro da regra" : s);

  return [
    { id: "liq", label: "Reserva mínima", ok: r.liquid >= rules.minLiquidity, current: brl(r.liquid), target: brl(rules.minLiquidity),
      suggestion: ok(r.liquid >= rules.minLiquidity, `Mover ${brl(rules.minLiquidity - r.liquid)} para renda fixa com liquidez diária`) },
    { id: "risk", label: "Risco máximo", ok: risk <= rules.maxRisk, current: `${risk.toFixed(1)}/10`, target: `${rules.maxRisk}/10`,
      suggestion: ok(risk <= rules.maxRisk, `Realocar cerca de ${brl(((risk - rules.maxRisk) * 2 / 100) * r.invested * 2.5)} de ativos voláteis para renda fixa`) },
    { id: "conc", label: "Concentração máxima", ok: topPct <= rules.maxConcentrationPct, current: `${topPct.toFixed(0)}%${top ? ` em ${top.asset_name}` : ""}`, target: `${rules.maxConcentrationPct}% por ativo`,
      suggestion: ok(topPct <= rules.maxConcentrationPct, `Reduzir ${top?.asset_name} em ${brl(((topPct - rules.maxConcentrationPct) / 100) * r.invested)}`) },
    { id: "ret", label: "Meta de retorno", ok: ret >= bench, current: `${ret.toFixed(1)}%`, target: `CDI + ${rules.beatCdiPlus}% (${bench.toFixed(1)}%)`,
      suggestion: ok(ret >= bench, "Revisar ativos com retorno abaixo do benchmark") },
    { id: "goal", label: "Meta patrimonial", ok: months <= monthsLeft, current: `${formatMonths(months)} no ritmo atual`, target: `${brl(rules.targetNetWorth, true)} até ${rules.targetYear}`,
      suggestion: ok(months <= monthsLeft, "Aumentar aportes mensais ou revisar o prazo da meta") },
  ];
}

export function recommendWhatIf(sc: WhatIfScenario[], amount: number): { key: WhatIfScenario["key"]; reason: string } {
  const av = sc.find((s) => s.key === "avista")!;
  const fin = sc.find((s) => s.key === "financiamento");
  const nao = sc.find((s) => s.key === "nao");
  if (!av || !fin || !nao) return { key: "nao", reason: "Dados insuficientes para comparar os cenários." };
  if (av.liquid < 0 && fin.liquid < 0) return { key: "nao", reason: "Nenhuma forma de compra é viável sem vender ativos e zerar sua reserva." };
  if (amount > nao.netWorth * 0.3) return { key: "nao", reason: `A compra representa ${((amount / nao.netWorth) * 100).toFixed(0)}% do seu patrimônio e atrasaria sua meta de ${formatMonths(nao.goalMonths)} para ${formatMonths(av.goalMonths)}.` };
  if (av.liquid >= 0 && fin.totalCost > amount) return { key: "avista", reason: `Você tem liquidez para pagar à vista e evita ${brl(fin.totalCost - amount)} em juros do financiamento.` };
  if (fin.totalCost <= amount) return { key: "nao", reason: "A taxa oficial de financiamento está indisponível; não é seguro recomendar crédito agora." };
  return { key: "financiamento", reason: "Preserva sua liquidez, já que pagar à vista consumiria toda a reserva." };
}
