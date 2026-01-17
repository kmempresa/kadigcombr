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

// Search for real-time market information
async function searchMarketInfo(query: string): Promise<{ content: string; citations: string[] }> {
  const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
  
  if (!PERPLEXITY_API_KEY) {
    console.log("Perplexity API key not configured");
    return { content: "", citations: [] };
  }

  try {
    console.log("Searching market info for:", query);
    
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar-pro",
        messages: [
          { 
            role: "system", 
            content: `Você é um analista financeiro especializado no mercado brasileiro. 
Forneça informações ATUALIZADAS e PRECISAS sobre:
- Taxas: Selic, CDI, IPCA, TR, câmbio
- Ações brasileiras e americanas
- Fundos imobiliários (FIIs)
- Tesouro Direto (taxas atuais)
- CDBs, LCIs, LCAs
- Criptomoedas
- ETFs e fundos de investimento
- Análises de mercado e tendências
- Notícias econômicas relevantes

Seja objetivo e forneça números concretos. Responda em português brasileiro.` 
          },
          { role: "user", content: query }
        ],
        search_recency_filter: "day",
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      console.error("Perplexity API error:", response.status);
      return { content: "", citations: [] };
    }

    const data = await response.json();
    return { 
      content: data.choices?.[0]?.message?.content || "", 
      citations: data.citations || [] 
    };
  } catch (error) {
    console.error("Error searching market info:", error);
    return { content: "", citations: [] };
  }
}

// Determine if query needs market data
function needsMarketData(message: string): boolean {
  const keywords = [
    "mercado", "bolsa", "b3", "ibovespa", "selic", "cdi", "ipca", "juros", "taxa",
    "ação", "acao", "ações", "acoes", "fii", "fiis", "fundo", "etf", "tesouro",
    "cdb", "lci", "lca", "crypto", "bitcoin", "cotação", "cotacao", "preço", "preco",
    "dividendo", "yield", "investir", "melhor", "recomenda", "vale a pena", 
    "devo", "qual", "como", "onde", "quando", "quanto", "renda fixa", "renda variável",
    "carteira", "alocar", "diversificar", "risco", "retorno", "rentabilidade",
    "comparar", "análise", "analise", "oportunidade", "tendência", "previsão",
    "dólar", "dolar", "euro", "inflação", "economia", "copom", "banco central"
  ];
  
  const lower = message.toLowerCase();
  return keywords.some(k => lower.includes(k));
}

// Build search query
function buildSearchQuery(message: string): string {
  const lower = message.toLowerCase();
  
  if (lower.includes("selic") || lower.includes("juros")) {
    return "Taxa Selic atual hoje Brasil Copom próxima reunião expectativas";
  }
  if (lower.includes("cdi")) {
    return "Taxa CDI hoje rendimento anual mensal Brasil";
  }
  if (lower.includes("ipca") || lower.includes("inflação")) {
    return "IPCA inflação Brasil atual acumulado 12 meses expectativa";
  }
  if (lower.includes("tesouro")) {
    return "Tesouro Direto taxas hoje IPCA+ Selic Prefixado rentabilidade";
  }
  if (lower.includes("fii") || lower.includes("fundo imobiliário")) {
    return "Melhores FIIs fundos imobiliários 2024 2025 dividendos yield";
  }
  if (lower.includes("ação") || lower.includes("acao") || lower.includes("bolsa")) {
    return "Melhores ações brasileiras 2024 2025 B3 Ibovespa recomendações análise";
  }
  if (lower.includes("cdb") || lower.includes("renda fixa")) {
    return "Melhores CDBs renda fixa hoje rentabilidade CDI bancos";
  }
  if (lower.includes("crypto") || lower.includes("bitcoin")) {
    return "Bitcoin criptomoedas preço hoje tendência análise";
  }
  if (lower.includes("dólar") || lower.includes("dolar") || lower.includes("câmbio")) {
    return "Dólar hoje cotação real tendência previsão";
  }
  if (lower.includes("onde investir") || lower.includes("melhor investimento")) {
    return "Melhores investimentos 2024 2025 Brasil renda fixa variável recomendações especialistas";
  }
  
  return `${message} investimentos Brasil mercado financeiro atual`;
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
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Usuário não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("User:", user.id);

    const lastUserMessage = messages[messages.length - 1]?.content || "";
    
    // Search market data if needed
    let marketContext = "";
    if (needsMarketData(lastUserMessage)) {
      console.log("Searching market data...");
      const query = buildSearchQuery(lastUserMessage);
      const { content, citations } = await searchMarketInfo(query);
      
      if (content) {
        marketContext = `
## 🌐 DADOS DE MERCADO EM TEMPO REAL

${content}

${citations.length > 0 ? `**Fontes:** ${citations.slice(0, 3).join(", ")}` : ""}
`;
      }
    }

    // Fetch all user data
    const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
    const { data: portfolios } = await supabase.from("portfolios").select("*").eq("user_id", user.id);
    const { data: investments } = await supabase.from("investments").select("*").eq("user_id", user.id);

    // Calculate financial metrics
    let totalPatrimonio = 0;
    let totalInvestido = 0;
    let totalGanhos = 0;
    let rendaDisponivel = 0;

    if (portfolios) {
      portfolios.forEach((p: any) => {
        totalPatrimonio += Number(p.total_value) || 0;
        totalGanhos += Number(p.total_gain) || 0;
      });
    }

    if (investments) {
      investments.forEach((inv: any) => {
        totalInvestido += Number(inv.total_invested) || 0;
      });
    }

    if (profile?.monthly_income) {
      rendaDisponivel = Number(profile.monthly_income) * 0.3; // Assume 30% can be invested
    }

    const rentabilidade = totalInvestido > 0 ? ((totalPatrimonio - totalInvestido) / totalInvestido) * 100 : 0;

    // Build user context
    const now = new Date();
    const brazilDate = now.toLocaleDateString("pt-BR", { 
      timeZone: "America/Sao_Paulo", weekday: "long", year: "numeric", month: "long", day: "numeric"
    });

    let userContext = `
# 📊 PERFIL FINANCEIRO DO USUÁRIO

**Data:** ${brazilDate}

${marketContext}

---

## 👤 Dados Pessoais
- **Nome:** ${profile?.full_name || user.email || "Não informado"}
- **Perfil de Investidor:** ${profile?.investor_profile || "NÃO DEFINIDO"}
- **Tolerância ao Risco:** ${profile?.risk_tolerance || "NÃO DEFINIDA"}
- **Objetivo:** ${profile?.investment_goal || "NÃO DEFINIDO"}
- **Renda Mensal:** ${profile?.monthly_income ? `R$ ${Number(profile.monthly_income).toLocaleString("pt-BR")}` : "NÃO INFORMADA"}
- **Capacidade de Aporte Mensal (estimada):** ${rendaDisponivel > 0 ? `R$ ${rendaDisponivel.toLocaleString("pt-BR")}` : "Não calculada"}

---

## 💰 Situação Patrimonial
- **Patrimônio Total:** R$ ${totalPatrimonio.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
- **Total Investido:** R$ ${totalInvestido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
- **Ganhos Acumulados:** R$ ${totalGanhos.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
- **Rentabilidade Total:** ${rentabilidade >= 0 ? "+" : ""}${rentabilidade.toFixed(2)}%

---

## 📈 Carteiras (${portfolios?.length || 0})
`;

    if (portfolios && portfolios.length > 0) {
      portfolios.forEach((p: any) => {
        userContext += `- **${p.name}:** R$ ${Number(p.total_value).toLocaleString("pt-BR")} (${p.cdi_percent || 0}% do CDI)\n`;
      });
    } else {
      userContext += `⚠️ Sem carteiras cadastradas\n`;
    }

    userContext += `\n## 📊 Investimentos (${investments?.length || 0})\n`;

    if (investments && investments.length > 0) {
      // Group by type
      const byType: { [key: string]: any[] } = {};
      investments.forEach((inv: any) => {
        const type = inv.asset_type || "outro";
        if (!byType[type]) byType[type] = [];
        byType[type].push(inv);
      });

      const labels: { [key: string]: string } = {
        acao: "Ações", fii: "FIIs", renda_fixa: "Renda Fixa", tesouro: "Tesouro",
        cdb: "CDB", lci: "LCI", lca: "LCA", crypto: "Crypto", etf: "ETFs"
      };

      // Show allocation percentages
      userContext += `\n**Alocação atual:**\n`;
      Object.entries(byType).forEach(([type, invs]) => {
        const typeValue = invs.reduce((s: number, i: any) => s + (Number(i.current_value) || 0), 0);
        const pct = totalPatrimonio > 0 ? (typeValue / totalPatrimonio * 100).toFixed(1) : 0;
        userContext += `- ${labels[type] || type}: ${pct}% (R$ ${typeValue.toLocaleString("pt-BR")})\n`;
      });

      userContext += `\n**Detalhes:**\n`;
      investments.slice(0, 15).forEach((inv: any) => {
        const rent = Number(inv.gain_percent) || 0;
        userContext += `- ${inv.asset_name}${inv.ticker ? ` (${inv.ticker})` : ""}: R$ ${Number(inv.current_value).toLocaleString("pt-BR")} (${rent >= 0 ? "+" : ""}${rent.toFixed(1)}%)\n`;
      });
      if (investments.length > 15) {
        userContext += `... e mais ${investments.length - 15} ativos\n`;
      }
    } else {
      userContext += `⚠️ Sem investimentos cadastrados\n`;
    }

    // System prompt - The actual advisor
    const systemPrompt = `# 🧠 KADIG AI — SEU CONSULTOR FINANCEIRO PESSOAL

Você é o **Kadig AI**, um consultor financeiro inteligente que combina conhecimento profundo do mercado com análise personalizada do perfil do usuário.

## 🎯 SUA MISSÃO

Ser um VERDADEIRO AUXILIAR de investimentos que:

### 1. ORIENTA DECISÕES DE INVESTIMENTO
- Analise se o usuário DEVE ou NÃO investir em algo
- Avalie se é o MOMENTO CERTO para investir
- Calcule RISCOS e PROBABILIDADES de sucesso
- Sugira os MELHORES CAMINHOS baseado no perfil

### 2. RECOMENDA INVESTIMENTOS ESPECÍFICOS
- Indique os melhores investimentos para CADA PERFIL
- Compare opções: "Investimento A vs B, qual melhor pra você?"
- Sugira ALOCAÇÃO IDEAL baseada em objetivos
- Alerte sobre ARMADILHAS e investimentos ruins

### 3. ANALISA CENÁRIOS
- "Se você investir R$ X em Y, em Z meses terá..."
- "Com a Selic atual, seu dinheiro na poupança perde X% para inflação"
- "Para atingir sua meta de R$ X, você precisa investir R$ Y por mês"

### 4. EDUCA DE FORMA PRÁTICA
- Explique conceitos de forma SIMPLES
- Use EXEMPLOS com os números do próprio usuário
- Mostre COMPARAÇÕES reais (poupança vs Tesouro vs CDB)

## 📋 FRAMEWORK DE RECOMENDAÇÃO

Sempre que recomendar algo, siga esta estrutura:

### Para "Devo investir em X?"
1. **Análise do perfil:** O investimento combina com seu perfil [conservador/moderado/arrojado]?
2. **Análise do momento:** É um bom momento para esse investimento? Por quê?
3. **Risco x Retorno:** Qual o risco? Qual o retorno esperado?
4. **Quanto investir:** Considerando seu patrimônio, quanto faz sentido alocar?
5. **Veredicto:** ✅ Recomendo / ⚠️ Com ressalvas / ❌ Não recomendo

### Para "Qual o melhor investimento?"
1. **Entenda o objetivo:** Curto prazo? Renda? Crescimento?
2. **Considere o perfil:** Conservador? Moderado? Arrojado?
3. **Compare 3 opções:** Apresente prós e contras
4. **Recomendação final:** Qual é melhor PARA ESTE USUÁRIO e por quê

### Para "Onde investir R$ X?"
1. **Sugira alocação:** Divida em categorias (ex: 60% renda fixa, 40% variável)
2. **Indique ativos específicos:** Nomes de investimentos reais
3. **Explique a lógica:** Por que essa distribuição?
4. **Próximos passos:** Como executar na prática

## 🔢 USE NÚMEROS CONCRETOS

- "Com a Selic a X%, um CDB de 100% CDI rende Y% ao ano"
- "Seu patrimônio de R$ X, investido em Tesouro IPCA+, em 5 anos valeria R$ Y"
- "Para sua renda de R$ X, sugiro aportes de R$ Y (30%) por mês"
- "Sua carteira está X% em ações, ideal seria Y% para seu perfil"

## ⚠️ ALERTAS PROATIVOS

Sempre alerte quando identificar:
- 🔴 Falta de reserva de emergência
- 🔴 Concentração excessiva em um ativo
- 🔴 Investimentos inadequados ao perfil
- 🔴 Dinheiro parado perdendo para inflação
- 🟡 Oportunidades de rebalanceamento
- 🟡 Vencimentos próximos
- 🟢 Boas oportunidades de mercado

## 💡 ESTILO DE COMUNICAÇÃO

- Seja DIRETO e OBJETIVO
- Use EMOJIS com moderação para organizar
- Formate com **negrito** e listas para clareza
- Personalize SEMPRE com dados do usuário
- Seja HONESTO sobre riscos
- NUNCA prometa retornos garantidos
- Sempre mencione que são sugestões, não ordens

## ⚖️ DISCLAIMER

Sempre lembre ao usuário que:
- Investimentos têm riscos
- Rentabilidade passada não garante futura
- Consulte um profissional certificado para decisões importantes
- Você é um assistente de IA, não um consultor registrado

---

# DADOS DO USUÁRIO ATUAL

${userContext}

---

Use TODOS os dados acima para personalizar suas recomendações. Seja o consultor que todo investidor gostaria de ter!`;

    console.log("Prompt built, calling AI...");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Aguarde um momento" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Limite atingido" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ error: "Erro ao processar" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
    });

  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erro" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
