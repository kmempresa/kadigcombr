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

// Function to search for real-time market information
async function searchMarketInfo(query: string): Promise<{ content: string; citations: string[] }> {
  const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
  
  if (!PERPLEXITY_API_KEY) {
    console.log("Perplexity API key not configured, skipping market search");
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
        model: "sonar",
        messages: [
          { 
            role: "system", 
            content: "Você é um especialista em mercado financeiro brasileiro. Forneça informações atualizadas, precisas e concisas sobre investimentos, ações, fundos, taxas de juros, CDI, IPCA, Tesouro Direto e mercado financeiro em geral. Responda em português brasileiro." 
          },
          { role: "user", content: query }
        ],
        search_recency_filter: "week",
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      console.error("Perplexity API error:", response.status);
      return { content: "", citations: [] };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const citations = data.citations || [];
    
    console.log("Market search completed, got", citations.length, "citations");
    
    return { content, citations };
  } catch (error) {
    console.error("Error searching market info:", error);
    return { content: "", citations: [] };
  }
}

// Function to determine if a query needs real-time market data
function needsMarketData(message: string): boolean {
  const marketKeywords = [
    // General market terms
    "mercado", "bolsa", "b3", "ibovespa", "índice", "indice",
    // Rates and indicators
    "selic", "cdi", "ipca", "inflação", "inflacao", "juros", "taxa",
    // Assets
    "ação", "acao", "ações", "acoes", "fii", "fiis", "fundo", "fundos",
    "etf", "etfs", "bdr", "bdrs", "crypto", "bitcoin", "criptomoeda",
    "tesouro", "cdb", "lci", "lca", "debênture", "debenture",
    // Actions
    "cotação", "cotacao", "preço", "preco", "valor", "rendimento",
    "dividendo", "provento", "yield", "rentabilidade",
    // Questions about market
    "como está", "como esta", "quanto", "qual o valor", "subiu", "caiu",
    "alta", "baixa", "tendência", "tendencia", "previsão", "previsao",
    "investir agora", "melhor momento", "oportunidade",
    // Specific assets (common tickers)
    "petr", "vale", "itub", "bbdc", "bbas", "mglu", "wege", "rent", "abev",
    // News
    "notícia", "noticia", "news", "novidade", "acontecendo", "atual",
  ];
  
  const lowerMessage = message.toLowerCase();
  return marketKeywords.some(keyword => lowerMessage.includes(keyword));
}

// Function to extract search query from user message
function extractSearchQuery(message: string): string {
  // Clean and optimize the query for market search
  const queries = [
    message,
    `Informações atuais sobre ${message} no mercado brasileiro`,
  ];
  
  // If asking about specific topics, make the query more specific
  if (message.toLowerCase().includes("selic") || message.toLowerCase().includes("juros")) {
    return "Taxa Selic atual hoje Brasil Banco Central decisão Copom";
  }
  if (message.toLowerCase().includes("cdi")) {
    return "Taxa CDI hoje rendimento Brasil";
  }
  if (message.toLowerCase().includes("ipca") || message.toLowerCase().includes("inflação")) {
    return "IPCA inflação Brasil atual acumulado 12 meses";
  }
  if (message.toLowerCase().includes("ibovespa") || message.toLowerCase().includes("bolsa")) {
    return "Ibovespa hoje cotação B3 bolsa brasileira";
  }
  if (message.toLowerCase().includes("tesouro")) {
    return "Tesouro Direto taxas hoje Tesouro IPCA Selic Prefixado rendimento";
  }
  if (message.toLowerCase().includes("bitcoin") || message.toLowerCase().includes("crypto")) {
    return "Bitcoin preço hoje criptomoedas mercado";
  }
  
  return message;
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
      console.error("User auth error:", userError);
      return new Response(JSON.stringify({ error: "Usuário não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("User authenticated:", user.id, user.email);

    // Get the last user message
    const lastUserMessage = messages[messages.length - 1]?.content || "";
    
    // ========== SEARCH REAL-TIME MARKET DATA IF NEEDED ==========
    
    let marketContext = "";
    let citations: string[] = [];
    
    if (needsMarketData(lastUserMessage)) {
      console.log("Message needs market data, searching...");
      const searchQuery = extractSearchQuery(lastUserMessage);
      const marketData = await searchMarketInfo(searchQuery);
      
      if (marketData.content) {
        marketContext = `
---

## 🌐 INFORMAÇÕES DE MERCADO EM TEMPO REAL

*Dados atualizados da web:*

${marketData.content}

${marketData.citations.length > 0 ? `
**Fontes:**
${marketData.citations.slice(0, 5).map((c, i) => `${i + 1}. ${c}`).join("\n")}
` : ""}

---

`;
        citations = marketData.citations;
      }
    }

    // ========== FETCH ALL USER DATA ==========

    // 1. User auth data
    const authData = {
      id: user.id,
      email: user.email,
      phone: user.phone,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
    };

    // 2. User profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    // 3. All portfolios
    const { data: portfolios } = await supabase
      .from("portfolios")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // 4. All investments
    const { data: investments } = await supabase
      .from("investments")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // 5. Recent chat history
    const { data: recentConversations } = await supabase
      .from("chat_conversations")
      .select("id, title, created_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(5);

    let chatHistory: any[] = [];
    if (recentConversations && recentConversations.length > 0) {
      const conversationIds = recentConversations.map(c => c.id);
      const { data: recentMessages } = await supabase
        .from("chat_messages")
        .select("role, content, created_at, conversation_id")
        .in("conversation_id", conversationIds)
        .order("created_at", { ascending: false })
        .limit(30);
      chatHistory = recentMessages || [];
    }

    // ========== BUILD COMPREHENSIVE CONTEXT ==========

    const now = new Date();
    const brazilTime = now.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
    const brazilDate = now.toLocaleDateString("pt-BR", { 
      timeZone: "America/Sao_Paulo",
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });

    let userContext = `
# 📊 DADOS COMPLETOS DO USUÁRIO

**Data atual:** ${brazilDate}
**Hora (Brasília):** ${brazilTime}

${marketContext}

---

## 🔐 Dados da Conta

- **ID:** ${authData.id}
- **Email:** ${authData.email || "Não informado"}
- **Telefone:** ${authData.phone || "Não informado"}
- **Membro desde:** ${authData.created_at ? new Date(authData.created_at).toLocaleDateString("pt-BR") : "N/A"}
- **Último acesso:** ${authData.last_sign_in_at ? new Date(authData.last_sign_in_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "N/A"}

---

## 👤 Perfil do Investidor

`;

    if (profile) {
      userContext += `- **Nome:** ${profile.full_name || "Não informado"}
- **Data de nascimento:** ${profile.birth_date ? new Date(profile.birth_date).toLocaleDateString("pt-BR") : "Não informada"}
- **Perfil de investidor:** ${profile.investor_profile || "Não definido"}
- **Renda mensal:** ${profile.monthly_income ? `R$ ${Number(profile.monthly_income).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "Não informada"}
- **Objetivo:** ${profile.investment_goal || "Não definido"}
- **Tolerância ao risco:** ${profile.risk_tolerance || "Não definida"}
`;
    } else {
      userContext += `⚠️ **Perfil não preenchido** - Incentive o usuário a completar seu perfil!
`;
    }

    // Portfolios
    userContext += `
---

## 💼 Carteiras

`;

    if (portfolios && portfolios.length > 0) {
      let totalPatrimonio = 0;
      let totalGanhos = 0;

      portfolios.forEach((p: any, index: number) => {
        const valor = Number(p.total_value) || 0;
        const ganho = Number(p.total_gain) || 0;
        totalPatrimonio += valor;
        totalGanhos += ganho;

        userContext += `### ${p.name}
- Valor: R$ ${valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
- Ganho: R$ ${ganho.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} (${ganho >= 0 ? "+" : ""}${valor > 0 ? ((ganho / (valor - ganho)) * 100).toFixed(2) : 0}%)
- vs CDI: ${p.cdi_percent || 0}%
`;
      });

      userContext += `
### 📈 PATRIMÔNIO TOTAL: R$ ${totalPatrimonio.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
**Ganhos totais:** R$ ${totalGanhos.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
`;
    } else {
      userContext += `⚠️ **Sem carteiras cadastradas**
`;
    }

    // Investments
    userContext += `
---

## 📊 Investimentos

`;

    if (investments && investments.length > 0) {
      const typeLabels: { [key: string]: string } = {
        acao: "Ações", fii: "FIIs", renda_fixa: "Renda Fixa", tesouro: "Tesouro",
        cdb: "CDB", lci: "LCI", lca: "LCA", crypto: "Crypto", etf: "ETFs", outro: "Outros",
      };

      const byType: { [key: string]: any[] } = {};
      let totalInvestido = 0;
      let valorAtual = 0;

      investments.forEach((inv: any) => {
        const type = inv.asset_type || "outro";
        if (!byType[type]) byType[type] = [];
        byType[type].push(inv);
        totalInvestido += Number(inv.total_invested) || 0;
        valorAtual += Number(inv.current_value) || 0;
      });

      const rentabilidade = totalInvestido > 0 ? ((valorAtual - totalInvestido) / totalInvestido) * 100 : 0;

      userContext += `### Resumo
- **Total investido:** R$ ${totalInvestido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
- **Valor atual:** R$ ${valorAtual.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
- **Rentabilidade:** ${rentabilidade >= 0 ? "+" : ""}${rentabilidade.toFixed(2)}%
- **Lucro/Prejuízo:** R$ ${(valorAtual - totalInvestido).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}

### Alocação
`;
      Object.entries(byType).forEach(([type, invs]) => {
        const typeValue = invs.reduce((sum: number, inv: any) => sum + (Number(inv.current_value) || 0), 0);
        const percentage = valorAtual > 0 ? ((typeValue / valorAtual) * 100).toFixed(1) : 0;
        userContext += `- **${typeLabels[type] || type}:** R$ ${typeValue.toLocaleString("pt-BR")} (${percentage}%)\n`;
      });

      userContext += `
### Detalhes por Ativo
`;
      Object.entries(byType).forEach(([type, invs]) => {
        userContext += `\n**${typeLabels[type] || type}:**\n`;
        (invs as any[]).forEach((inv) => {
          const invested = Number(inv.total_invested) || 0;
          const current = Number(inv.current_value) || 0;
          const rent = invested > 0 ? ((current - invested) / invested) * 100 : 0;
          userContext += `- ${inv.asset_name}${inv.ticker ? ` (${inv.ticker})` : ""}: R$ ${current.toLocaleString("pt-BR")} (${rent >= 0 ? "+" : ""}${rent.toFixed(2)}%)\n`;
        });
      });

      // Upcoming maturities
      const withMaturity = investments.filter((inv: any) => inv.maturity_date);
      if (withMaturity.length > 0) {
        userContext += `
### 📅 Vencimentos
`;
        withMaturity
          .sort((a: any, b: any) => new Date(a.maturity_date).getTime() - new Date(b.maturity_date).getTime())
          .slice(0, 5)
          .forEach((inv: any) => {
            const maturityDate = new Date(inv.maturity_date);
            const daysUntil = Math.ceil((maturityDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            userContext += `- **${inv.asset_name}:** ${maturityDate.toLocaleDateString("pt-BR")} (${daysUntil > 0 ? `${daysUntil} dias` : "VENCIDO"})\n`;
          });
      }
    } else {
      userContext += `⚠️ **Sem investimentos cadastrados**
`;
    }

    // Chat history summary
    if (chatHistory && chatHistory.length > 0) {
      userContext += `
---

## 💬 Conversas Anteriores (${chatHistory.length} mensagens recentes)
`;
      chatHistory.slice(0, 5).reverse().forEach((msg: any) => {
        userContext += `- **${msg.role === "user" ? "Usuário" : "Kadig"}:** ${msg.content.substring(0, 100)}${msg.content.length > 100 ? "..." : ""}\n`;
      });
    }

    // ========== SYSTEM PROMPT ==========

    const systemPrompt = `Você é o **Kadig AI** 🤖 — o consultor financeiro pessoal mais avançado do Brasil.

# 🎯 SUA MISSÃO
Proporcionar uma experiência ÚNICA e PERSONALIZADA para cada usuário, combinando:
1. Conhecimento profundo dos dados pessoais do usuário
2. Informações em tempo real do mercado financeiro
3. Análises inteligentes e recomendações personalizadas

# 🧠 SUAS CAPACIDADES

## Conhecimento do Usuário
- Você tem acesso COMPLETO a todos os dados da conta
- Use SEMPRE os dados reais nas respostas
- Cite valores, percentuais e ativos específicos do usuário
- Lembre-se do histórico de conversas

## Conhecimento de Mercado
- Você tem acesso a informações ATUALIZADAS da web
- Taxas: Selic, CDI, IPCA, câmbio
- Cotações: Ações, FIIs, ETFs, criptomoedas
- Notícias e análises do mercado
- Tendências e oportunidades

## Análises Personalizadas
- Compare a carteira do usuário com benchmarks
- Identifique riscos e oportunidades
- Sugira rebalanceamento quando necessário
- Alerte sobre vencimentos e dividendos

# 💡 COMO SE COMPORTAR

1. **Seja proativo** - Não espere perguntas, ofereça insights relevantes
2. **Seja específico** - Use números e dados concretos do usuário
3. **Seja educativo** - Explique conceitos de forma simples
4. **Seja amigável** - Use emojis com moderação, seja acolhedor
5. **Seja honesto** - Se não souber algo, diga claramente

# ⚠️ REGRAS IMPORTANTES

- NUNCA invente dados do usuário
- SEMPRE use formato brasileiro (R$, DD/MM/AAAA)
- Cite fontes quando usar dados de mercado
- Se o perfil estiver incompleto, incentive o preenchimento
- Mantenha respostas concisas mas completas

# 📊 DADOS DO USUÁRIO ATUAL

${userContext}

---

Use TODOS esses dados para personalizar suas respostas. O usuário deve sentir que você realmente o conhece!`;

    console.log("System prompt built with user data and market context");

    // Call Lovable AI Gateway
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurado");
    }

    const aiMessages: Message[] = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: aiMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Aguarde um momento." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Limite de uso atingido." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "Erro ao processar mensagem" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("AI response streaming...");

    return new Response(response.body, {
      headers: { 
        ...corsHeaders, 
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
