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

// Search real-time market data
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

// Keywords that trigger market search
function needsMarketData(msg: string): boolean {
  const keywords = [
    "selic", "cdi", "ipca", "juros", "taxa", "inflação", "inflacao",
    "ação", "acao", "ações", "acoes", "fii", "fiis", "fundo", "etf", "tesouro",
    "cdb", "lci", "lca", "crypto", "bitcoin", "cotação", "cotacao",
    "investir", "melhor", "recomenda", "vale a pena", "devo", "qual", "onde",
    "carteira", "alocar", "diversificar", "risco", "retorno", "rentabilidade",
    "dólar", "dolar", "euro", "copom", "economia", "mercado", "bolsa", "ibovespa",
    "dividendo", "yield", "proventos", "pagamento", "data-com", "ex-dividendo"
  ];
  return keywords.some(k => msg.toLowerCase().includes(k));
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
  return `${msg} investimentos Brasil mercado financeiro análise`;
}

// Calculate financial health score
function calculateFinancialHealth(profile: any, patrimonio: number, renda: number): { score: number; status: string; issues: string[] } {
  const issues: string[] = [];
  let score = 50;

  // Profile completeness
  if (!profile?.investor_profile) { score -= 10; issues.push("Perfil de investidor não definido"); }
  if (!profile?.investment_goal) { score -= 5; issues.push("Objetivo de investimento não definido"); }
  if (!profile?.risk_tolerance) { score -= 5; issues.push("Tolerância ao risco não definida"); }
  if (!renda) { score -= 10; issues.push("Renda mensal não informada"); }

  // Emergency fund check (should have 6-12 months of expenses)
  const emergencyTarget = renda * 6;
  if (patrimonio < emergencyTarget && renda > 0) {
    score -= 15;
    issues.push(`Patrimônio abaixo da reserva de emergência ideal (R$ ${emergencyTarget.toLocaleString("pt-BR")})`);
  }

  // Has investments
  if (patrimonio > 0) score += 20;
  if (patrimonio > renda * 12) score += 10;
  if (patrimonio > renda * 24) score += 10;

  // Determine status
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
  // Moderado (default)
  return { "Renda Fixa": 55, "Renda Variável": 35, "Alternativos": 10 };
}

// Analyze portfolio diversification
function analyzeDiversification(investments: any[], patrimonio: number): { score: number; analysis: string[] } {
  if (!investments || investments.length === 0) {
    return { score: 0, analysis: ["Sem investimentos para analisar"] };
  }

  const analysis: string[] = [];
  let score = 50;

  // Group by type
  const byType: { [key: string]: number } = {};
  investments.forEach((inv: any) => {
    const type = inv.asset_type || "outro";
    byType[type] = (byType[type] || 0) + (Number(inv.current_value) || 0);
  });

  const types = Object.keys(byType);
  
  // Check number of asset types
  if (types.length === 1) {
    score -= 20;
    analysis.push("⚠️ Carteira concentrada em apenas 1 tipo de ativo");
  } else if (types.length >= 3) {
    score += 15;
    analysis.push("✅ Boa diversificação por tipo de ativo");
  }

  // Check concentration
  const maxConcentration = Math.max(...Object.values(byType)) / patrimonio * 100;
  if (maxConcentration > 70) {
    score -= 15;
    analysis.push(`⚠️ Alta concentração (${maxConcentration.toFixed(0)}% em um único tipo)`);
  }

  // Check individual positions
  const largestPosition = investments.reduce((max: any, inv: any) => 
    (Number(inv.current_value) || 0) > (Number(max?.current_value) || 0) ? inv : max, investments[0]);
  
  const positionPct = patrimonio > 0 ? (Number(largestPosition?.current_value) || 0) / patrimonio * 100 : 0;
  if (positionPct > 30) {
    analysis.push(`⚠️ Posição muito grande: ${largestPosition?.asset_name} (${positionPct.toFixed(0)}%)`);
  }

  // Has renda fixa?
  const hasRendaFixa = types.some(t => ["renda_fixa", "tesouro", "cdb", "lci", "lca"].includes(t));
  if (!hasRendaFixa) {
    analysis.push("💡 Considere adicionar renda fixa para estabilidade");
  }

  // Has renda variável?
  const hasRendaVariavel = types.some(t => ["acao", "fii", "etf"].includes(t));
  if (!hasRendaVariavel && patrimonio > 10000) {
    analysis.push("💡 Com reserva formada, considere renda variável para crescimento");
  }

  return { score: Math.max(0, Math.min(100, score)), analysis };
}

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
    
    // Parallel data fetching
    const [marketResult, profileResult, portfoliosResult, investmentsResult, conversationsResult] = await Promise.all([
      needsMarketData(lastMsg) ? searchMarket(buildQuery(lastMsg)) : Promise.resolve({ content: "", citations: [] }),
      supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("portfolios").select("*").eq("user_id", user.id),
      supabase.from("investments").select("*").eq("user_id", user.id).order("current_value", { ascending: false }),
      supabase.from("chat_conversations").select("id").eq("user_id", user.id),
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
    
    // Financial health analysis
    const health = calculateFinancialHealth(profile, totalPatrimonio, renda);
    const diversification = analyzeDiversification(investments, totalPatrimonio);
    const idealAllocation = getIdealAllocation(profile?.investor_profile, profile?.risk_tolerance);

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

${marketResult.content ? `
---
## 🌐 DADOS DE MERCADO EM TEMPO REAL

${marketResult.content}

${marketResult.citations.length > 0 ? `*Fontes: ${marketResult.citations.slice(0, 3).join(", ")}*` : ""}
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

    // MEGA System Prompt
    const systemPrompt = `# 🤖 KADIG AI — CONSULTOR FINANCEIRO PESSOAL DEFINITIVO

Você é o Kadig AI, o consultor financeiro mais avançado e completo do Brasil. Você combina:
- 🧠 Inteligência artificial de ponta
- 📊 Dados em tempo real do mercado
- 👤 Conhecimento profundo do usuário
- 📈 Análises e simulações personalizadas

## 🎯 SUAS MISSÕES

### 1. CONSULTOR DE INVESTIMENTOS
- Analise se o usuário DEVE ou NÃO investir em algo específico
- Avalie TIMING de mercado e oportunidades
- Calcule RISCO vs RETORNO para cada situação
- Sugira os MELHORES investimentos para o perfil

### 2. PLANEJADOR FINANCEIRO
- Ajude a definir e atingir METAS financeiras
- Calcule quanto investir para atingir objetivos
- Monte estratégias de APOSENTADORIA
- Planeje compra de imóveis, carros, viagens

### 3. ANALISTA DE CARTEIRA
- Analise a DIVERSIFICAÇÃO atual
- Identifique RISCOS e concentrações
- Sugira REBALANCEAMENTO quando necessário
- Compare rentabilidade com benchmarks (CDI, Ibovespa)

### 4. EDUCADOR FINANCEIRO
- Explique conceitos de forma SIMPLES e PRÁTICA
- Use EXEMPLOS com os números do próprio usuário
- Ensine sobre diferentes tipos de investimentos
- Desmistifique o mercado financeiro

### 5. SIMULADOR FINANCEIRO
Quando relevante, faça SIMULAÇÕES:
- "Se você investir R$ X por mês durante Y anos a Z% ao ano, terá R$ W"
- "Para ter R$ X em Y anos, precisa investir R$ Z por mês"
- "Sua carteira rendendo X% vs CDI de Y%, você ganha/perde R$ Z"

### 6. MONITOR DE OPORTUNIDADES
- Alerte sobre boas oportunidades de mercado
- Informe sobre dividendos e proventos
- Avise sobre vencimentos próximos
- Sugira ações baseadas em eventos

## 📋 FRAMEWORK DE RESPOSTA

### Para qualquer pergunta sobre investimentos:

1. **CONTEXTO PESSOAL**
   - Como isso se aplica ao perfil do usuário?
   - Combina com seus objetivos e tolerância a risco?

2. **ANÁLISE TÉCNICA**
   - Dados de mercado relevantes
   - Riscos e oportunidades
   - Comparação com alternativas

3. **RECOMENDAÇÃO CLARA**
   - ✅ Recomendo / ⚠️ Com ressalvas / ❌ Não recomendo
   - Justificativa baseada em dados

4. **PRÓXIMOS PASSOS**
   - Ações concretas que o usuário pode tomar
   - Quanto investir, onde, como

## 🔢 FÓRMULAS E CÁLCULOS

Use estas fórmulas quando relevante:

**Juros Compostos:** VF = VP × (1 + i)^n
**Aporte Mensal:** VF = PMT × [(1 + i)^n - 1] / i
**Rentabilidade Real:** (1 + nominal) / (1 + inflação) - 1
**Tempo para Dobrar (Regra 72):** Anos ≈ 72 / taxa anual

## 💡 INSIGHTS PROATIVOS

Sempre que identificar, mencione:
- 🔴 **Alertas:** Problemas urgentes na carteira
- 🟡 **Atenção:** Pontos que precisam ajuste
- 🟢 **Oportunidades:** Ações que podem beneficiar o usuário
- 💡 **Dicas:** Sugestões de melhoria

## ⚖️ ÉTICA E TRANSPARÊNCIA

- SEMPRE mencione riscos de investimentos
- NUNCA prometa retornos garantidos
- Seja HONESTO sobre limitações
- Incentive buscar profissionais certificados para decisões grandes
- Deixe claro que você é uma IA assistente

## 🎨 ESTILO

- Use **negrito** para destacar informações importantes
- Use emojis com moderação para organizar
- Seja DIRETO e OBJETIVO
- Personalize CADA resposta com dados do usuário
- Mantenha tom amigável mas profissional

---

# DADOS ATUAIS DO USUÁRIO

${ctx}

---

Você tem TODOS os dados acima. Use-os ativamente para personalizar cada resposta!
Seja o consultor financeiro que todo brasileiro merece ter.`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("API key não configurada");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      const s = response.status;
      if (s === 429) return new Response(JSON.stringify({ error: "Aguarde um momento" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (s === 402) return new Response(JSON.stringify({ error: "Limite atingido" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ error: "Erro" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(response.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });

  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: String(error) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
