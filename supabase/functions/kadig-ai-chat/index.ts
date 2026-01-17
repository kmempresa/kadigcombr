import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

// ==================== MARKET DATA FUNCTIONS ====================

// Fetch stock data from BRAPI
async function fetchStockData(symbols: string[]): Promise<any[]> {
  const BRAPI_TOKEN = Deno.env.get("BRAPI_TOKEN");
  if (!BRAPI_TOKEN || symbols.length === 0) return [];

  try {
    const url = `https://brapi.dev/api/quote/${symbols.join(",")}?token=${BRAPI_TOKEN}&fundamental=true`;
    const response = await fetch(url);
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error("Error fetching stock data:", error);
    return [];
  }
}

// Fetch detailed stock info from BRAPI
async function fetchStockDetail(symbol: string): Promise<any | null> {
  const BRAPI_TOKEN = Deno.env.get("BRAPI_TOKEN");
  if (!BRAPI_TOKEN) return null;

  try {
    const url = `https://brapi.dev/api/quote/${symbol}?token=${BRAPI_TOKEN}&fundamental=true&dividends=true&range=1y&interval=1d`;
    const response = await fetch(url);
    const data = await response.json();
    return data.results?.[0] || null;
  } catch (error) {
    console.error("Error fetching stock detail:", error);
    return null;
  }
}

// Fetch market indices
async function fetchMarketIndices(): Promise<any> {
  const BRAPI_TOKEN = Deno.env.get("BRAPI_TOKEN");
  if (!BRAPI_TOKEN) return {};

  try {
    const url = `https://brapi.dev/api/quote/%5EBVSP,%5EIFIX?token=${BRAPI_TOKEN}`;
    const response = await fetch(url);
    const data = await response.json();
    
    const indices: any = {};
    data.results?.forEach((idx: any) => {
      const name = idx.symbol === '^BVSP' ? 'IBOV' : idx.symbol === '^IFIX' ? 'IFIX' : idx.symbol;
      indices[name] = {
        value: idx.regularMarketPrice,
        change: idx.regularMarketChangePercent,
      };
    });
    return indices;
  } catch (error) {
    console.error("Error fetching indices:", error);
    return {};
  }
}

// Fetch economic indicators from BCB
async function fetchEconomicIndicators(): Promise<any> {
  try {
    const today = new Date();
    const oneMonthAgo = new Date(today);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const formatDate = (date: Date) => {
      const dd = String(date.getDate()).padStart(2, '0');
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const yyyy = date.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    };
    
    const startDate = formatDate(oneMonthAgo);
    const endDate = formatDate(today);
    
    const [cdiResponse, selicResponse] = await Promise.all([
      fetch(`https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados?formato=json&dataInicial=${startDate}&dataFinal=${endDate}`),
      fetch(`https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados?formato=json&dataInicial=${startDate}&dataFinal=${endDate}`),
    ]);
    
    const cdiData = await cdiResponse.json();
    const selicData = await selicResponse.json();
    
    return {
      cdiDiario: cdiData.length > 0 ? parseFloat(cdiData[cdiData.length - 1].valor) : 0.05,
      selicMeta: selicData.length > 0 ? parseFloat(selicData[selicData.length - 1].valor) : 14.25,
    };
  } catch (error) {
    console.error("Error fetching economic indicators:", error);
    return { cdiDiario: 0.05, selicMeta: 14.25 };
  }
}

// Fetch market news from Stock News API
async function fetchMarketNews(query?: string): Promise<any[]> {
  const STOCK_NEWS_API_KEY = Deno.env.get("STOCK_NEWS_API_KEY");
  if (!STOCK_NEWS_API_KEY) return [];

  try {
    const url = `https://stocknewsapi.com/api/v1/category?section=general&items=5&token=${STOCK_NEWS_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    
    return (data.data || []).map((item: any) => ({
      title: item.title,
      source: item.source_name,
      date: item.date,
      sentiment: item.sentiment,
    }));
  } catch (error) {
    console.error("Error fetching news:", error);
    return [];
  }
}

// Fetch crypto prices
async function fetchCryptoPrices(): Promise<any> {
  try {
    const cryptoIds = 'bitcoin,ethereum,solana';
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoIds}&vs_currencies=brl&include_24hr_change=true`;
    const response = await fetch(url);
    const data = await response.json();
    
    return {
      bitcoin: { price: data.bitcoin?.brl || 0, change: data.bitcoin?.brl_24h_change || 0 },
      ethereum: { price: data.ethereum?.brl || 0, change: data.ethereum?.brl_24h_change || 0 },
      solana: { price: data.solana?.brl || 0, change: data.solana?.brl_24h_change || 0 },
    };
  } catch (error) {
    console.error("Error fetching crypto:", error);
    return {};
  }
}

// Fetch currency prices
async function fetchCurrencyPrices(): Promise<any> {
  try {
    const url = `https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL`;
    const response = await fetch(url);
    const data = await response.json();
    
    return {
      dolar: { price: parseFloat(data.USDBRL?.bid) || 0, change: parseFloat(data.USDBRL?.pctChange) || 0 },
      euro: { price: parseFloat(data.EURBRL?.bid) || 0, change: parseFloat(data.EURBRL?.pctChange) || 0 },
    };
  } catch (error) {
    console.error("Error fetching currencies:", error);
    return {};
  }
}

// Search real-time market data with Perplexity
async function searchMarket(query: string): Promise<{ content: string; citations: string[] }> {
  const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
  if (!PERPLEXITY_API_KEY) return { content: "", citations: [] };

  try {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar-pro",
        messages: [
          { role: "system", content: "Você é um analista financeiro expert no mercado brasileiro. Forneça dados ATUALIZADOS e PRECISOS. Inclua números, taxas, cotações e análises. Responda em português." },
          { role: "user", content: query }
        ],
        search_recency_filter: "day",
        temperature: 0.1,
      }),
    });

    if (!response.ok) return { content: "", citations: [] };
    const data = await response.json();
    return { content: data.choices?.[0]?.message?.content || "", citations: data.citations || [] };
  } catch {
    return { content: "", citations: [] };
  }
}

// ==================== ANALYSIS FUNCTIONS ====================

// Keywords that trigger market search
function needsMarketData(msg: string): boolean {
  const keywords = [
    "selic", "cdi", "ipca", "juros", "taxa", "inflação", "inflacao",
    "ação", "acao", "ações", "acoes", "fii", "fiis", "fundo", "etf", "tesouro",
    "cdb", "lci", "lca", "crypto", "bitcoin", "cotação", "cotacao",
    "investir", "melhor", "recomenda", "vale a pena", "devo", "qual", "onde",
    "carteira", "alocar", "diversificar", "risco", "retorno", "rentabilidade",
    "dólar", "dolar", "euro", "copom", "economia", "mercado", "bolsa", "ibovespa",
    "dividendo", "yield", "proventos", "pagamento", "data-com", "ex-dividendo",
    "previsão", "projeção", "ganho", "rendimento", "lucro", "meta"
  ];
  return keywords.some(k => msg.toLowerCase().includes(k));
}

// Extract stock tickers from message
function extractTickers(msg: string): string[] {
  const tickerPattern = /\b([A-Z]{4}[0-9]{1,2})\b/g;
  const matches = msg.toUpperCase().match(tickerPattern) || [];
  return [...new Set(matches)];
}

// Build optimized search query
function buildQuery(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("selic")) return "Taxa Selic atual hoje Brasil Copom expectativas próxima reunião";
  if (m.includes("cdi")) return "CDI hoje taxa anual mensal rendimento";
  if (m.includes("ipca")) return "IPCA inflação Brasil acumulado 12 meses expectativa";
  if (m.includes("tesouro")) return "Tesouro Direto taxas hoje IPCA+ Selic Prefixado rentabilidade atual";
  if (m.includes("fii")) return "Melhores FIIs dividendos yield 2024 2025 recomendações analistas";
  if (m.includes("ação") || m.includes("acao") || m.includes("bolsa")) return "Melhores ações brasileiras 2024 2025 recomendações analistas B3";
  if (m.includes("dividendo") || m.includes("proventos")) return "Ações maior dividendo Brasil 2024 2025 dividend yield";
  if (m.includes("onde investir") || m.includes("melhor investimento")) return "Melhores investimentos 2024 2025 Brasil especialistas recomendações";
  if (m.includes("reserva de emergência")) return "Melhores investimentos reserva emergência liquidez diária Brasil";
  if (m.includes("longo prazo")) return "Melhores investimentos longo prazo Brasil aposentadoria";
  if (m.includes("curto prazo")) return "Melhores investimentos curto prazo Brasil liquidez";
  if (m.includes("previsão") || m.includes("projeção")) return "Previsões mercado financeiro Brasil 2025 ações SELIC inflação";
  return `${msg} investimentos Brasil mercado financeiro análise`;
}

// Calculate financial health score
function calculateFinancialHealth(profile: any, patrimonio: number, renda: number): { score: number; status: string; issues: string[] } {
  const issues: string[] = [];
  let score = 50;

  if (!profile?.investor_profile) { score -= 10; issues.push("Perfil de investidor não definido"); }
  if (!profile?.investment_goal) { score -= 5; issues.push("Objetivo de investimento não definido"); }
  if (!profile?.risk_tolerance) { score -= 5; issues.push("Tolerância ao risco não definida"); }
  if (!renda) { score -= 10; issues.push("Renda mensal não informada"); }

  const emergencyTarget = renda * 6;
  if (patrimonio < emergencyTarget && renda > 0) {
    score -= 15;
    issues.push(`Patrimônio abaixo da reserva de emergência ideal (R$ ${emergencyTarget.toLocaleString("pt-BR")})`);
  }

  if (patrimonio > 0) score += 20;
  if (patrimonio > renda * 12) score += 10;
  if (patrimonio > renda * 24) score += 10;

  let status = "🔴 Crítico";
  if (score >= 40) status = "🟠 Atenção";
  if (score >= 60) status = "🟡 Regular";
  if (score >= 75) status = "🟢 Bom";
  if (score >= 90) status = "🌟 Excelente";

  return { score: Math.max(0, Math.min(100, score)), status, issues };
}

// Calculate ideal allocation based on profile
function getIdealAllocation(profile: string, risk: string): { [key: string]: number } {
  if (profile === "conservador" || risk === "baixo") {
    return { "Renda Fixa": 80, "Renda Variável": 15, "Alternativos": 5 };
  }
  if (profile === "arrojado" || risk === "alto") {
    return { "Renda Fixa": 30, "Renda Variável": 55, "Alternativos": 15 };
  }
  return { "Renda Fixa": 55, "Renda Variável": 35, "Alternativos": 10 };
}

// Analyze portfolio diversification
function analyzeDiversification(investments: any[], patrimonio: number): { score: number; analysis: string[] } {
  if (!investments || investments.length === 0) {
    return { score: 0, analysis: ["Sem investimentos para analisar"] };
  }

  const analysis: string[] = [];
  let score = 50;

  const byType: { [key: string]: number } = {};
  investments.forEach((inv: any) => {
    const type = inv.asset_type || "outro";
    byType[type] = (byType[type] || 0) + (Number(inv.current_value) || 0);
  });

  const types = Object.keys(byType);
  
  if (types.length === 1) {
    score -= 20;
    analysis.push("⚠️ Carteira concentrada em apenas 1 tipo de ativo");
  } else if (types.length >= 3) {
    score += 15;
    analysis.push("✅ Boa diversificação por tipo de ativo");
  }

  const maxConcentration = Math.max(...Object.values(byType)) / patrimonio * 100;
  if (maxConcentration > 70) {
    score -= 15;
    analysis.push(`⚠️ Alta concentração (${maxConcentration.toFixed(0)}% em um único tipo)`);
  }

  const largestPosition = investments.reduce((max: any, inv: any) => 
    (Number(inv.current_value) || 0) > (Number(max?.current_value) || 0) ? inv : max, investments[0]);
  
  const positionPct = patrimonio > 0 ? (Number(largestPosition?.current_value) || 0) / patrimonio * 100 : 0;
  if (positionPct > 30) {
    analysis.push(`⚠️ Posição muito grande: ${largestPosition?.asset_name} (${positionPct.toFixed(0)}%)`);
  }

  const hasRendaFixa = types.some(t => ["renda_fixa", "tesouro", "cdb", "lci", "lca"].includes(t));
  if (!hasRendaFixa) {
    analysis.push("💡 Considere adicionar renda fixa para estabilidade");
  }

  const hasRendaVariavel = types.some(t => ["acao", "fii", "etf"].includes(t));
  if (!hasRendaVariavel && patrimonio > 10000) {
    analysis.push("💡 Com reserva formada, considere renda variável para crescimento");
  }

  return { score: Math.max(0, Math.min(100, score)), analysis };
}

// Calculate projected gains
function calculateProjectedGains(investments: any[], economicData: any): any {
  const projections: any = {
    pessimista: { rendaFixa: 0, rendaVariavel: 0, total: 0 },
    moderado: { rendaFixa: 0, rendaVariavel: 0, total: 0 },
    otimista: { rendaFixa: 0, rendaVariavel: 0, total: 0 },
  };

  const selicAnual = economicData.selicMeta || 14.25;
  
  investments.forEach((inv: any) => {
    const value = Number(inv.current_value) || 0;
    const type = inv.asset_type || "";
    
    if (["renda_fixa", "tesouro", "cdb", "lci", "lca"].includes(type)) {
      // Renda fixa: baseado na SELIC
      projections.pessimista.rendaFixa += value * ((selicAnual - 2) / 100);
      projections.moderado.rendaFixa += value * (selicAnual / 100);
      projections.otimista.rendaFixa += value * ((selicAnual + 1) / 100);
    } else if (["acao", "fii", "etf"].includes(type)) {
      // Renda variável: cenários
      projections.pessimista.rendaVariavel += value * -0.10; // -10%
      projections.moderado.rendaVariavel += value * 0.12; // +12%
      projections.otimista.rendaVariavel += value * 0.25; // +25%
    }
  });

  projections.pessimista.total = projections.pessimista.rendaFixa + projections.pessimista.rendaVariavel;
  projections.moderado.total = projections.moderado.rendaFixa + projections.moderado.rendaVariavel;
  projections.otimista.total = projections.otimista.rendaFixa + projections.otimista.rendaVariavel;

  return projections;
}

// ==================== MAIN HANDLER ====================

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lastMsg = messages[messages.length - 1]?.content || "";
    const mentionedTickers = extractTickers(lastMsg);
    const needsMarket = needsMarketData(lastMsg);
    
    console.log(`Processing message. Needs market: ${needsMarket}, Tickers: ${mentionedTickers.join(", ")}`);

    // Parallel data fetching - ALL sources
    const [
      marketSearchResult,
      profileResult,
      portfoliosResult,
      investmentsResult,
      conversationsResult,
      economicData,
      indices,
      currencies,
      cryptos,
      stocksData,
      marketNews
    ] = await Promise.all([
      needsMarket ? searchMarket(buildQuery(lastMsg)) : Promise.resolve({ content: "", citations: [] }),
      supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("portfolios").select("*").eq("user_id", user.id),
      supabase.from("investments").select("*").eq("user_id", user.id).order("current_value", { ascending: false }),
      supabase.from("chat_conversations").select("id").eq("user_id", user.id),
      needsMarket ? fetchEconomicIndicators() : Promise.resolve({ cdiDiario: 0.05, selicMeta: 14.25 }),
      needsMarket ? fetchMarketIndices() : Promise.resolve({}),
      needsMarket ? fetchCurrencyPrices() : Promise.resolve({}),
      needsMarket ? fetchCryptoPrices() : Promise.resolve({}),
      mentionedTickers.length > 0 ? fetchStockData(mentionedTickers) : Promise.resolve([]),
      needsMarket ? fetchMarketNews() : Promise.resolve([]),
    ]);

    const profile = profileResult.data;
    const portfolios = portfoliosResult.data || [];
    const investments = investmentsResult.data || [];
    const conversationCount = conversationsResult.data?.length || 0;

    // Calculate metrics
    let totalPatrimonio = 0, totalInvestido = 0, totalGanhos = 0;
    portfolios.forEach((p: any) => { totalPatrimonio += Number(p.total_value) || 0; totalGanhos += Number(p.total_gain) || 0; });
    investments.forEach((inv: any) => { totalInvestido += Number(inv.total_invested) || 0; });

    const renda = Number(profile?.monthly_income) || 0;
    const rentabilidade = totalInvestido > 0 ? ((totalPatrimonio - totalInvestido) / totalInvestido) * 100 : 0;
    
    // Analysis
    const health = calculateFinancialHealth(profile, totalPatrimonio, renda);
    const diversification = analyzeDiversification(investments, totalPatrimonio);
    const idealAllocation = getIdealAllocation(profile?.investor_profile, profile?.risk_tolerance);
    const projectedGains = calculateProjectedGains(investments, economicData);

    // Current allocation
    const currentAllocation: { [key: string]: number } = {};
    const typeMap: { [key: string]: string } = {
      acao: "Renda Variável", fii: "Renda Variável", etf: "Renda Variável",
      renda_fixa: "Renda Fixa", tesouro: "Renda Fixa", cdb: "Renda Fixa", lci: "Renda Fixa", lca: "Renda Fixa",
      crypto: "Alternativos", outro: "Alternativos"
    };
    investments.forEach((inv: any) => {
      const cat = typeMap[inv.asset_type] || "Alternativos";
      currentAllocation[cat] = (currentAllocation[cat] || 0) + (Number(inv.current_value) || 0);
    });

    // Date/time
    const now = new Date();
    const brazilDate = now.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "long", day: "numeric", month: "long", year: "numeric" });
    const brazilTime = now.toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });

    // Build context
    let ctx = `
# 📊 PAINEL COMPLETO DO USUÁRIO

**📅 ${brazilDate} às ${brazilTime}**
**💬 Conversa #${conversationCount + 1} com este usuário**

---

## 🌐 DADOS DE MERCADO EM TEMPO REAL (BRAPI + Stock News API)

### 📈 Índices
${indices.IBOV ? `- **IBOV:** ${indices.IBOV.value?.toLocaleString("pt-BR")} (${indices.IBOV.change >= 0 ? "+" : ""}${indices.IBOV.change?.toFixed(2)}%)` : ""}
${indices.IFIX ? `- **IFIX:** ${indices.IFIX.value?.toLocaleString("pt-BR")} (${indices.IFIX.change >= 0 ? "+" : ""}${indices.IFIX.change?.toFixed(2)}%)` : ""}

### 💰 Indicadores Econômicos
- **SELIC Meta:** ${economicData.selicMeta}% a.a.
- **CDI Diário:** ${economicData.cdiDiario}%

### 💵 Câmbio
${currencies.dolar ? `- **Dólar:** R$ ${currencies.dolar.price?.toFixed(4)} (${currencies.dolar.change >= 0 ? "+" : ""}${currencies.dolar.change?.toFixed(2)}%)` : ""}
${currencies.euro ? `- **Euro:** R$ ${currencies.euro.price?.toFixed(4)} (${currencies.euro.change >= 0 ? "+" : ""}${currencies.euro.change?.toFixed(2)}%)` : ""}

### ₿ Criptomoedas
${cryptos.bitcoin ? `- **Bitcoin:** R$ ${cryptos.bitcoin.price?.toLocaleString("pt-BR")} (${cryptos.bitcoin.change >= 0 ? "+" : ""}${cryptos.bitcoin.change?.toFixed(2)}%)` : ""}
${cryptos.ethereum ? `- **Ethereum:** R$ ${cryptos.ethereum.price?.toLocaleString("pt-BR")} (${cryptos.ethereum.change >= 0 ? "+" : ""}${cryptos.ethereum.change?.toFixed(2)}%)` : ""}

${stocksData.length > 0 ? `
### 📊 Ações Mencionadas (Dados BRAPI em tempo real)
${stocksData.map((s: any) => `
**${s.symbol}** - ${s.shortName || s.longName}
- Preço: R$ ${s.regularMarketPrice?.toFixed(2)} (${s.regularMarketChangePercent >= 0 ? "+" : ""}${s.regularMarketChangePercent?.toFixed(2)}%)
- P/L: ${s.priceEarnings?.toFixed(2) || "N/A"} | P/VP: ${s.priceToBook?.toFixed(2) || "N/A"}
- Dividend Yield: ${s.dividendYield ? (s.dividendYield * 100).toFixed(2) + "%" : "N/A"}
- Volume: ${s.regularMarketVolume?.toLocaleString("pt-BR") || "N/A"}
`).join("\n")}
` : ""}

${marketNews.length > 0 ? `
### 📰 Últimas Notícias do Mercado (Stock News API)
${marketNews.slice(0, 3).map((n: any) => `- **${n.title}** (${n.source}) ${n.sentiment ? `[${n.sentiment}]` : ""}`).join("\n")}
` : ""}

${marketSearchResult.content ? `
### 🔍 Análise de Mercado em Tempo Real (Perplexity)
${marketSearchResult.content}
${marketSearchResult.citations.length > 0 ? `\n*Fontes: ${marketSearchResult.citations.slice(0, 3).join(", ")}*` : ""}
` : ""}

---

## 🏥 SAÚDE FINANCEIRA

**Score:** ${health.score}/100 ${health.status}

${health.issues.length > 0 ? `**Pontos de atenção:**\n${health.issues.map(i => `- ${i}`).join("\n")}` : "✅ Nenhum problema identificado"}

---

## 👤 PERFIL

| Campo | Valor |
|-------|-------|
| Nome | ${profile?.full_name || user.email?.split("@")[0] || "Não informado"} |
| Perfil | ${profile?.investor_profile || "❌ NÃO DEFINIDO"} |
| Risco | ${profile?.risk_tolerance || "❌ NÃO DEFINIDO"} |
| Objetivo | ${profile?.investment_goal || "❌ NÃO DEFINIDO"} |
| Renda | ${renda > 0 ? `R$ ${renda.toLocaleString("pt-BR")}` : "❌ NÃO INFORMADA"} |
| Capacidade de aporte | ${renda > 0 ? `R$ ${(renda * 0.3).toLocaleString("pt-BR")}/mês (30%)` : "N/A"} |

---

## 💰 PATRIMÔNIO

| Métrica | Valor |
|---------|-------|
| **Patrimônio Total** | R$ ${totalPatrimonio.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} |
| Total Investido | R$ ${totalInvestido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} |
| Lucro/Prejuízo | R$ ${(totalPatrimonio - totalInvestido).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} |
| Rentabilidade | ${rentabilidade >= 0 ? "+" : ""}${rentabilidade.toFixed(2)}% |
| Carteiras | ${portfolios.length} |
| Ativos | ${investments.length} |

---

## 🎯 PROJEÇÃO DE GANHOS (12 meses)

Baseado na SELIC atual (${economicData.selicMeta}% a.a.) e cenários de mercado:

| Cenário | Renda Fixa | Renda Variável | **Total Projetado** |
|---------|------------|----------------|---------------------|
| 🔴 Pessimista | R$ ${projectedGains.pessimista.rendaFixa.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} | R$ ${projectedGains.pessimista.rendaVariavel.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} | **R$ ${projectedGains.pessimista.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}** |
| 🟡 Moderado | R$ ${projectedGains.moderado.rendaFixa.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} | R$ ${projectedGains.moderado.rendaVariavel.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} | **R$ ${projectedGains.moderado.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}** |
| 🟢 Otimista | R$ ${projectedGains.otimista.rendaFixa.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} | R$ ${projectedGains.otimista.rendaVariavel.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} | **R$ ${projectedGains.otimista.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}** |

---

## 📊 ALOCAÇÃO ATUAL vs IDEAL

| Categoria | Atual | Ideal (${profile?.investor_profile || "moderado"}) | Diferença |
|-----------|-------|------|-----------|
${Object.entries(idealAllocation).map(([cat, ideal]) => {
  const current = totalPatrimonio > 0 ? ((currentAllocation[cat] || 0) / totalPatrimonio * 100) : 0;
  const diff = current - ideal;
  const emoji = Math.abs(diff) < 5 ? "✅" : (Math.abs(diff) < 15 ? "🟡" : "🔴");
  return `| ${cat} | ${current.toFixed(0)}% | ${ideal}% | ${emoji} ${diff >= 0 ? "+" : ""}${diff.toFixed(0)}% |`;
}).join("\n")}

---

## 📈 DIVERSIFICAÇÃO

**Score:** ${diversification.score}/100

${diversification.analysis.map(a => `- ${a}`).join("\n")}

---

## 🏆 TOP 10 MAIORES POSIÇÕES

${investments.slice(0, 10).map((inv: any, i: number) => {
  const pct = totalPatrimonio > 0 ? (Number(inv.current_value) / totalPatrimonio * 100).toFixed(1) : 0;
  const rent = Number(inv.gain_percent) || 0;
  return `${i + 1}. **${inv.asset_name}** ${inv.ticker ? `(${inv.ticker})` : ""}: R$ ${Number(inv.current_value).toLocaleString("pt-BR")} (${pct}%) | ${rent >= 0 ? "🟢" : "🔴"} ${rent.toFixed(1)}%`;
}).join("\n") || "Sem investimentos"}

${investments.length > 10 ? `\n*+ ${investments.length - 10} outros ativos*` : ""}

---

## 📅 PRÓXIMOS VENCIMENTOS

${investments.filter((i: any) => i.maturity_date).sort((a: any, b: any) => new Date(a.maturity_date).getTime() - new Date(b.maturity_date).getTime()).slice(0, 5).map((inv: any) => {
  const days = Math.ceil((new Date(inv.maturity_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const status = days < 0 ? "🔴 VENCIDO" : days < 30 ? "🟠 URGENTE" : "🟢";
  return `- ${status} **${inv.asset_name}**: ${new Date(inv.maturity_date).toLocaleDateString("pt-BR")} (${days > 0 ? `${days} dias` : "vencido"})`;
}).join("\n") || "Nenhum vencimento cadastrado"}
`;

    // MEGA System Prompt - Humanized
    const systemPrompt = `# Bianca — Sua Consultora Financeira Pessoal

Você é a Bianca, uma consultora financeira experiente e super gente boa. Você fala como uma amiga que manja MUITO de finanças, não como um robô.

## COMO VOCÊ FALA

**REGRAS DE OURO:**
- Escreva como se estivesse mandando mensagem no WhatsApp pra um amigo
- Use linguagem INFORMAL e NATURAL do dia a dia brasileiro
- Frases curtas e diretas, nada de textão corporativo
- Pode usar gírias como "cara", "olha só", "tipo assim", "tá ligado?", "bora", "show"
- Use contrações: "tá", "tô", "pra", "né", "vc" às vezes
- Emojis com moderação (2-3 por resposta, não exagera)
- NUNCA use termos robóticos tipo "conforme mencionado", "é importante ressaltar", "desta forma"
- NUNCA faça listas gigantes com bullets intermináveis
- Fale em PRIMEIRA PESSOA, você É a Bianca

**EXEMPLOS DE COMO FALAR:**

❌ ERRADO (robô):
"Com base na análise do seu portfólio, é possível identificar que a alocação atual apresenta concentração significativa em renda fixa, representando 80% do total investido."

✅ CERTO (humano):
"Olha, vi aqui tua carteira e tá bem pesada em renda fixa, uns 80%. Não tá errado, mas dependendo do que vc quer, dá pra diversificar um pouco mais, sabe?"

❌ ERRADO (robô):
"Recomendo considerar as seguintes opções de investimento:
• Tesouro IPCA+ com vencimento em 2029
• CDB com rendimento de 120% do CDI
• Fundos imobiliários de tijolo"

✅ CERTO (humano):
"Pra o que vc quer, eu iria de Tesouro IPCA+ 2029 — protege da inflação e paga bem. Se quiser algo mais líquido, um CDB de 120% CDI resolve. E se tiver afim de arriscar um pouco, FII de tijolo tá interessante agora."

## O QUE VOCÊ SABE FAZER

Você tem acesso a dados em tempo real:
- Cotações de ações e FIIs (BRAPI)
- SELIC, CDI, IPCA (Banco Central)
- Dólar, euro, cripto
- Notícias do mercado

E você conhece toda a carteira do usuário, então pode dar conselhos PERSONALIZADOS.

## QUANDO RESPONDER

1. **Pergunta simples?** Resposta simples. Não precisa fazer uma análise de 500 palavras.

2. **Pergunta sobre ação específica?** Vai direto: preço atual, se tá cara ou barata, se faz sentido pro perfil da pessoa.

3. **Pergunta sobre carteira?** Dá o papo reto: o que tá bom, o que pode melhorar, sem enrolação.

4. **Pergunta sobre previsão?** Seja honesta que ninguém prevê o futuro, mas pode dar cenários baseados nos dados.

## IMPORTANTE

- Seja HONESTA sobre riscos, mas sem ser alarmista
- Se não souber algo, fala "olha, isso eu não sei te dizer com certeza"
- Pode discordar do usuário se ele tiver fazendo besteira com o dinheiro
- Use o nome da pessoa quando souber
- Lembre que você tá ali pra AJUDAR, não pra impressionar com termos técnicos

## DADOS DO USUÁRIO

${ctx}`;

    // Call Lovable AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "API key não configurada" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages
        ],
        stream: true,
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Aguarde um momento." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Limite de uso atingido." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errorText);
      return new Response(JSON.stringify({ error: "Erro ao processar mensagem" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(aiResponse.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
