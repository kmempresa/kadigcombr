import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STALE_MS = 12 * 60 * 60 * 1000; // 12h

interface Offer {
  bank_name: string;
  product: string;
  rate_label: string;
  rate_cdi_pct: number | null;
  min_investment: number | null;
  term: string | null;
  source_url: string | null;
}

async function fetchOffersFromWeb(apiKey: string): Promise<Offer[]> {
  const prompt = `Pesquise na web as taxas ATUAIS de renda fixa oferecidas pelos principais bancos e corretoras do Brasil (ex.: Banco Inter, Nubank, C6, PicPay, PagBank, XP, BTG Pactual, Sofisa, Daycoval, BMG, Itaú, Bradesco). Foque em CDB, LCI e LCA de liquidez diária ou prazos curtos (até 2 anos).

Retorne APENAS um JSON válido no formato:
{"offers":[{"bank_name":"Banco Inter","product":"CDB Liquidez Diária","rate_label":"100% do CDI","rate_cdi_pct":100,"min_investment":100,"term":"Liquidez diária","source_url":"https://..."}]}

Regras:
- Inclua de 8 a 15 ofertas reais encontradas na pesquisa.
- rate_cdi_pct: número (ex.: 110 para "110% do CDI"). Se a taxa for prefixada em % ao ano, use null em rate_cdi_pct e coloque a taxa em rate_label (ex.: "12,5% ao ano").
- min_investment em reais (número) ou null se não encontrado.
- NÃO invente taxas. Só inclua ofertas que apareceram nos resultados da pesquisa.`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
    },
    body: JSON.stringify({
      model: "openai/gpt-6-astra",
      input: prompt,
      stream: true,
      reasoning: { effort: "low", summary: "auto" },
      tools: [{ type: "web_search" }],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`AI gateway error ${res.status}: ${body.slice(0, 300)}`);
  }

  // Read SSE stream, accumulate output_text deltas
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const evt = JSON.parse(payload);
        if (evt.type === "response.output_text.delta" && typeof evt.delta === "string") {
          text += evt.delta;
        } else if (evt.type === "response.completed" && evt.response?.output_text) {
          text = evt.response.output_text;
        }
      } catch { /* ignore partial lines */ }
    }
  }

  const match = text.match(/\{[\s\S]*"offers"[\s\S]*\}/);
  if (!match) throw new Error("No JSON in AI response");
  const parsed = JSON.parse(match[0]);
  const offers: Offer[] = (parsed.offers ?? [])
    .filter((o: any) => o && typeof o.bank_name === "string" && typeof o.rate_label === "string")
    .slice(0, 15)
    .map((o: any) => ({
      bank_name: String(o.bank_name).slice(0, 80),
      product: String(o.product ?? "CDB").slice(0, 80),
      rate_label: String(o.rate_label).slice(0, 60),
      rate_cdi_pct: typeof o.rate_cdi_pct === "number" ? o.rate_cdi_pct : null,
      min_investment: typeof o.min_investment === "number" ? o.min_investment : null,
      term: o.term ? String(o.term).slice(0, 60) : null,
      source_url: o.source_url ? String(o.source_url).slice(0, 300) : null,
    }));
  if (offers.length === 0) throw new Error("AI returned no offers");
  return offers;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: rows, error } = await supabase
      .from("bank_offers")
      .select("*")
      .order("rate_cdi_pct", { ascending: false, nullsFirst: false });
    if (error) throw error;

    const latest = rows?.length ? new Date(rows[0].updated_at).getTime() : 0;
    const stale = Date.now() - latest > STALE_MS;

    let refreshed = false;
    let refreshError: string | null = null;

    if (stale) {
      const apiKey = Deno.env.get("LOVABLE_API_KEY");
      if (apiKey) {
        try {
          const offers = await fetchOffersFromWeb(apiKey);
          await supabase.from("bank_offers").delete().neq("id", "00000000-0000-0000-0000-000000000000");
          const { error: insErr } = await supabase.from("bank_offers").insert(offers);
          if (insErr) throw insErr;
          refreshed = true;
        } catch (e) {
          refreshError = e instanceof Error ? e.message : String(e);
          console.error("Refresh failed:", refreshError);
        }
      }
    }

    const { data: finalRows } = await supabase
      .from("bank_offers")
      .select("*")
      .order("rate_cdi_pct", { ascending: false, nullsFirst: false });

    return new Response(
      JSON.stringify({
        offers: finalRows ?? [],
        refreshed,
        updated_at: finalRows?.[0]?.updated_at ?? null,
        ...(refreshError && !finalRows?.length ? { warning: "Ofertas temporariamente indisponíveis" } : {}),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error(e);
    return new Response(
      JSON.stringify({ offers: [], error: "Ofertas temporariamente indisponíveis" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
