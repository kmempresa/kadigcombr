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

interface UserProfile {
  full_name: string | null;
  investor_profile: string | null;
  monthly_income: number | null;
  investment_goal: string | null;
  risk_tolerance: string | null;
}

interface Portfolio {
  name: string;
  total_value: number;
  total_gain: number;
  cdi_percent: number;
}

interface Investment {
  asset_name: string;
  asset_type: string;
  ticker: string | null;
  quantity: number;
  total_invested: number;
  current_value: number;
  gain_percent: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, conversationId } = await req.json();
    
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error("User auth error:", userError);
      return new Response(JSON.stringify({ error: "Usuário não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("User authenticated:", user.id);

    // Fetch user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, investor_profile, monthly_income, investment_goal, risk_tolerance")
      .eq("user_id", user.id)
      .maybeSingle();

    // Fetch user portfolios
    const { data: portfolios } = await supabase
      .from("portfolios")
      .select("name, total_value, total_gain, cdi_percent")
      .eq("user_id", user.id);

    // Fetch user investments
    const { data: investments } = await supabase
      .from("investments")
      .select("asset_name, asset_type, ticker, quantity, total_invested, current_value, gain_percent")
      .eq("user_id", user.id);

    // Build context about the user
    let userContext = `
## Informações do Usuário

`;
    
    if (profile) {
      userContext += `- **Nome**: ${profile.full_name || "Não informado"}
- **Perfil de Investidor**: ${profile.investor_profile || "Não definido"}
- **Renda Mensal**: ${profile.monthly_income ? `R$ ${profile.monthly_income.toLocaleString("pt-BR")}` : "Não informada"}
- **Objetivo de Investimento**: ${profile.investment_goal || "Não definido"}
- **Tolerância ao Risco**: ${profile.risk_tolerance || "Não definida"}
`;
    } else {
      userContext += "O usuário ainda não preencheu seu perfil de investidor.\n";
    }

    if (portfolios && portfolios.length > 0) {
      userContext += `\n## Carteiras do Usuário\n`;
      portfolios.forEach((p: Portfolio, index: number) => {
        userContext += `
### ${p.name}
- Valor Total: R$ ${p.total_value?.toLocaleString("pt-BR") || "0"}
- Ganho Total: R$ ${p.total_gain?.toLocaleString("pt-BR") || "0"}
- Rendimento vs CDI: ${p.cdi_percent || 0}%
`;
      });
    } else {
      userContext += "\nO usuário ainda não tem carteiras cadastradas.\n";
    }

    if (investments && investments.length > 0) {
      userContext += `\n## Investimentos Atuais\n`;
      
      // Group by type
      const byType: { [key: string]: Investment[] } = {};
      investments.forEach((inv: Investment) => {
        const type = inv.asset_type || "outro";
        if (!byType[type]) byType[type] = [];
        byType[type].push(inv);
      });

      const typeLabels: { [key: string]: string } = {
        acao: "Ações",
        fii: "Fundos Imobiliários",
        renda_fixa: "Renda Fixa",
        tesouro: "Tesouro Direto",
        cdb: "CDB",
        lci: "LCI",
        lca: "LCA",
        crypto: "Criptomoedas",
        outro: "Outros",
      };

      Object.entries(byType).forEach(([type, invs]) => {
        userContext += `\n### ${typeLabels[type] || type}\n`;
        (invs as Investment[]).forEach((inv) => {
          userContext += `- **${inv.asset_name}** ${inv.ticker ? `(${inv.ticker})` : ""}: R$ ${inv.current_value?.toLocaleString("pt-BR") || "0"} (${inv.gain_percent > 0 ? "+" : ""}${inv.gain_percent?.toFixed(2) || 0}%)\n`;
        });
      });
    } else {
      userContext += "\nO usuário ainda não tem investimentos cadastrados.\n";
    }

    // Build system prompt
    const systemPrompt = `Você é o Kadig AI, um consultor financeiro pessoal inteligente e amigável. 

Seu papel é:
1. Conhecer profundamente o usuário e suas finanças
2. Analisar a carteira de investimentos e dar recomendações personalizadas
3. Responder dúvidas sobre investimentos de forma clara e didática
4. Sugerir estratégias baseadas no perfil de risco do usuário
5. Alertar sobre oportunidades e riscos no mercado

**IMPORTANTE**: 
- Sempre seja empático e use linguagem acessível
- Base suas respostas nos dados reais do usuário quando disponíveis
- Se o usuário não tiver dados cadastrados, incentive-o a preencher seu perfil
- Use emojis com moderação para tornar a conversa mais amigável
- Mantenha respostas concisas mas informativas
- Quando mencionar valores, use o formato brasileiro (R$)

${userContext}

Lembre-se: você tem acesso aos dados acima do usuário. Use-os para personalizar suas respostas!`;

    console.log("System prompt built, calling AI...");

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

    console.log("AI response received, streaming...");

    // Stream the response
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
