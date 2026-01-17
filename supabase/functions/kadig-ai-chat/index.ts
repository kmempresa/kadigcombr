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

    // ========== FETCH ALL USER DATA ==========

    // 1. User auth data (from Supabase Auth)
    const authData = {
      id: user.id,
      email: user.email,
      phone: user.phone,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      email_confirmed: user.email_confirmed_at ? true : false,
      phone_confirmed: user.phone_confirmed_at ? true : false,
    };

    // 2. User profile (all fields)
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    // 3. All portfolios with all details
    const { data: portfolios } = await supabase
      .from("portfolios")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // 4. All investments with all details
    const { data: investments } = await supabase
      .from("investments")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // 5. Recent chat history (last 50 messages for context)
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
        .limit(50);
      chatHistory = recentMessages || [];
    }

    // ========== BUILD COMPREHENSIVE CONTEXT ==========

    const now = new Date();
    const brazilTime = now.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

    let userContext = `
# 📊 DADOS COMPLETOS DO USUÁRIO

**Data/Hora atual (Brasília):** ${brazilTime}

---

## 🔐 Dados da Conta

- **ID do Usuário:** ${authData.id}
- **Email:** ${authData.email || "Não informado"}
- **Telefone:** ${authData.phone || "Não informado"}
- **Conta criada em:** ${authData.created_at ? new Date(authData.created_at).toLocaleDateString("pt-BR") : "N/A"}
- **Último login:** ${authData.last_sign_in_at ? new Date(authData.last_sign_in_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "N/A"}
- **Email verificado:** ${authData.email_confirmed ? "Sim" : "Não"}
- **Telefone verificado:** ${authData.phone_confirmed ? "Sim" : "Não"}

---

## 👤 Perfil do Investidor

`;

    if (profile) {
      userContext += `- **Nome completo:** ${profile.full_name || "Não informado"}
- **Email de contato:** ${profile.email || authData.email || "Não informado"}
- **Telefone:** ${profile.phone || authData.phone || "Não informado"}
- **Data de nascimento:** ${profile.birth_date ? new Date(profile.birth_date).toLocaleDateString("pt-BR") : "Não informada"}
- **Perfil de investidor:** ${profile.investor_profile || "Não definido"} (conservador/moderado/arrojado)
- **Renda mensal:** ${profile.monthly_income ? `R$ ${Number(profile.monthly_income).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "Não informada"}
- **Objetivo de investimento:** ${profile.investment_goal || "Não definido"}
- **Tolerância ao risco:** ${profile.risk_tolerance || "Não definida"} (baixo/médio/alto)
- **Perfil criado em:** ${profile.created_at ? new Date(profile.created_at).toLocaleDateString("pt-BR") : "N/A"}
- **Última atualização:** ${profile.updated_at ? new Date(profile.updated_at).toLocaleDateString("pt-BR") : "N/A"}
`;
    } else {
      userContext += `⚠️ **O usuário ainda NÃO preencheu seu perfil de investidor.**
Incentive-o a completar o perfil para recomendações mais personalizadas.
`;
    }

    // Portfolios
    userContext += `
---

## 💼 Carteiras de Investimento

`;

    if (portfolios && portfolios.length > 0) {
      let totalPatrimonio = 0;
      let totalGanhos = 0;

      portfolios.forEach((p: any, index: number) => {
        const valor = Number(p.total_value) || 0;
        const ganho = Number(p.total_gain) || 0;
        totalPatrimonio += valor;
        totalGanhos += ganho;

        userContext += `
### Carteira ${index + 1}: ${p.name}
- **ID:** ${p.id}
- **Valor total:** R$ ${valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
- **Ganho total:** R$ ${ganho.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} (${ganho >= 0 ? "+" : ""}${valor > 0 ? ((ganho / (valor - ganho)) * 100).toFixed(2) : 0}%)
- **Rendimento vs CDI:** ${p.cdi_percent || 0}%
- **Criada em:** ${p.created_at ? new Date(p.created_at).toLocaleDateString("pt-BR") : "N/A"}
- **Atualizada em:** ${p.updated_at ? new Date(p.updated_at).toLocaleDateString("pt-BR") : "N/A"}
`;
      });

      userContext += `
### 📈 Resumo do Patrimônio
- **Patrimônio total:** R$ ${totalPatrimonio.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
- **Ganhos totais:** R$ ${totalGanhos.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
- **Número de carteiras:** ${portfolios.length}
`;
    } else {
      userContext += `⚠️ **O usuário ainda NÃO possui carteiras cadastradas.**
Ajude-o a criar sua primeira carteira de investimentos.
`;
    }

    // Investments
    userContext += `
---

## 📊 Investimentos Detalhados

`;

    if (investments && investments.length > 0) {
      // Group by type
      const typeLabels: { [key: string]: string } = {
        acao: "Ações",
        fii: "Fundos Imobiliários (FIIs)",
        renda_fixa: "Renda Fixa",
        tesouro: "Tesouro Direto",
        cdb: "CDB",
        lci: "LCI",
        lca: "LCA",
        crypto: "Criptomoedas",
        etf: "ETFs",
        fundo: "Fundos de Investimento",
        outro: "Outros",
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

      userContext += `### Resumo Geral
- **Total investido:** R$ ${totalInvestido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
- **Valor atual:** R$ ${valorAtual.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
- **Rentabilidade total:** ${totalInvestido > 0 ? (((valorAtual - totalInvestido) / totalInvestido) * 100).toFixed(2) : 0}%
- **Lucro/Prejuízo:** R$ ${(valorAtual - totalInvestido).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
- **Número de ativos:** ${investments.length}

`;

      // Allocation by type
      userContext += `### Alocação por Tipo de Ativo
`;
      Object.entries(byType).forEach(([type, invs]) => {
        const typeValue = invs.reduce((sum: number, inv: any) => sum + (Number(inv.current_value) || 0), 0);
        const percentage = valorAtual > 0 ? ((typeValue / valorAtual) * 100).toFixed(1) : 0;
        userContext += `- **${typeLabels[type] || type}:** R$ ${typeValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} (${percentage}%)\n`;
      });

      // Detailed list
      Object.entries(byType).forEach(([type, invs]) => {
        userContext += `
### ${typeLabels[type] || type} (${invs.length} ativos)

| Ativo | Ticker | Qtd | Preço Médio | Preço Atual | Investido | Valor Atual | Rent. |
|-------|--------|-----|-------------|-------------|-----------|-------------|-------|
`;
        (invs as any[]).forEach((inv) => {
          const invested = Number(inv.total_invested) || 0;
          const current = Number(inv.current_value) || 0;
          const rent = invested > 0 ? (((current - invested) / invested) * 100).toFixed(2) : "0.00";
          userContext += `| ${inv.asset_name} | ${inv.ticker || "-"} | ${Number(inv.quantity).toLocaleString("pt-BR")} | R$ ${Number(inv.purchase_price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} | R$ ${Number(inv.current_price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} | R$ ${invested.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} | R$ ${current.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} | ${rent}% |
`;
        });
      });

      // Upcoming maturities
      const withMaturity = investments.filter((inv: any) => inv.maturity_date);
      if (withMaturity.length > 0) {
        userContext += `
### 📅 Vencimentos Próximos
`;
        withMaturity
          .sort((a: any, b: any) => new Date(a.maturity_date).getTime() - new Date(b.maturity_date).getTime())
          .slice(0, 10)
          .forEach((inv: any) => {
            const maturityDate = new Date(inv.maturity_date);
            const daysUntil = Math.ceil((maturityDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            userContext += `- **${inv.asset_name}:** Vence em ${maturityDate.toLocaleDateString("pt-BR")} (${daysUntil > 0 ? `faltam ${daysUntil} dias` : "VENCIDO"})\n`;
          });
      }

    } else {
      userContext += `⚠️ **O usuário ainda NÃO possui investimentos cadastrados.**
Ajude-o a começar a investir com base no seu perfil.
`;
    }

    // Chat history
    userContext += `
---

## 💬 Histórico de Conversas Recentes

`;

    if (chatHistory && chatHistory.length > 0) {
      userContext += `O usuário já conversou ${chatHistory.length} vezes recentemente. Últimas interações:

`;
      // Show last 10 messages as context
      chatHistory.slice(0, 10).reverse().forEach((msg: any) => {
        const time = new Date(msg.created_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
        userContext += `**[${time}] ${msg.role === "user" ? "Usuário" : "Kadig AI"}:** ${msg.content.substring(0, 200)}${msg.content.length > 200 ? "..." : ""}\n\n`;
      });
    } else {
      userContext += `Esta é a primeira conversa do usuário com o Kadig AI.
`;
    }

    // ========== SYSTEM PROMPT ==========

    const systemPrompt = `Você é o **Kadig AI**, o consultor financeiro pessoal mais inteligente e completo do Brasil. 

# Sua Identidade
- Você é um especialista em investimentos com profundo conhecimento do mercado brasileiro
- Você conhece TODOS os dados do usuário e usa isso para dar recomendações PERSONALIZADAS
- Você é amigável, didático e fala de forma clara e acessível
- Você usa emojis com moderação para tornar a conversa agradável

# Suas Capacidades
1. **Análise de Carteira** - Você analisa a alocação, diversificação, riscos e oportunidades
2. **Recomendações Personalizadas** - Baseadas no perfil de risco e objetivos do usuário
3. **Educação Financeira** - Explica conceitos de investimento de forma simples
4. **Alertas** - Identifica problemas como falta de diversificação, vencimentos próximos, etc
5. **Planejamento** - Ajuda a definir metas e estratégias de investimento

# Regras Importantes
- SEMPRE use os dados reais do usuário quando disponíveis
- Se dados estiverem faltando, incentive o usuário a completar o cadastro
- Nunca invente dados ou valores que não estão no contexto
- Mantenha respostas concisas mas completas
- Use formato brasileiro para valores (R$) e datas (DD/MM/AAAA)
- Cite números específicos da carteira do usuário quando relevante

# Conhecimento Atual do Usuário

${userContext}

---

**IMPORTANTE:** Você tem acesso COMPLETO a todos os dados acima. Use-os ativamente nas suas respostas para mostrar que você realmente conhece o usuário e seus investimentos!`;

    console.log("System prompt built with full user data");

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
        return new Response(JSON.stringify({ error: "Muitas requisições. Por favor, aguarde um momento." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Limite de uso atingido. Entre em contato com o suporte." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "Erro ao processar sua mensagem" }), {
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
