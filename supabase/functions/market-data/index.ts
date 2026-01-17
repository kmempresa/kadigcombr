import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const BRAPI_TOKEN = Deno.env.get('BRAPI_TOKEN');
    
    if (!BRAPI_TOKEN) {
      throw new Error('BRAPI_TOKEN not configured');
    }

    const { type = 'all', symbol } = await req.json().catch(() => ({}));

    // Se for buscar detalhes de uma ação específica
    if (type === 'detail' && symbol) {
      console.log(`Fetching details for ${symbol}`);
      
      const url = `https://brapi.dev/api/quote/${symbol}?token=${BRAPI_TOKEN}&fundamental=true`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const stock = data.results[0];
        
        return new Response(
          JSON.stringify({
            symbol: stock.symbol,
            shortName: stock.shortName || stock.longName || stock.symbol,
            longName: stock.longName || stock.shortName || stock.symbol,
            regularMarketPrice: stock.regularMarketPrice || 0,
            regularMarketChange: stock.regularMarketChange || 0,
            regularMarketChangePercent: stock.regularMarketChangePercent || 0,
            logoUrl: stock.logourl || null,
            currency: stock.currency || 'BRL',
            // Indicadores fundamentalistas
            priceEarnings: stock.priceEarnings || null,
            earningsPerShare: stock.earningsPerShare || null,
            bookValuePerShare: stock.bookValuePerShare || null,
            priceToBook: stock.priceToBook || null,
            dividendYield: stock.dividendYield || null,
            // Dados históricos
            historicalDataPrice: stock.historicalDataPrice || [],
            // Dados adicionais
            marketCap: stock.marketCap || null,
            averageDailyVolume10Day: stock.averageDailyVolume10Day || null,
            averageDailyVolume3Month: stock.averageDailyVolume3Month || null,
            fiftyTwoWeekHigh: stock.fiftyTwoWeekHigh || null,
            fiftyTwoWeekLow: stock.fiftyTwoWeekLow || null,
            fiftyTwoWeekHighChange: stock.fiftyTwoWeekHighChange || null,
            fiftyTwoWeekLowChange: stock.fiftyTwoWeekLowChange || null,
            // Dados de volatilidade
            regularMarketDayHigh: stock.regularMarketDayHigh || null,
            regularMarketDayLow: stock.regularMarketDayLow || null,
            regularMarketOpen: stock.regularMarketOpen || null,
            regularMarketPreviousClose: stock.regularMarketPreviousClose || null,
            regularMarketVolume: stock.regularMarketVolume || null,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Stock not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Lista ampla de ações populares brasileiras
    const allStocks = [
      // Maiores da B3
      "PETR4", "VALE3", "ITUB4", "BBDC4", "ABEV3", "WEGE3", "BBAS3", "B3SA3",
      // Varejo
      "MGLU3", "LREN3", "VIIA3", "AMER3", "PETZ3",
      // Energia
      "ELET3", "ELET6", "CMIG4", "CPLE6", "ENGI11", "TAEE11", "CPFE3", "ENBR3",
      // Financeiro
      "SANB11", "BPAC11", "BBSE3", "CIEL3", "IRBR3",
      // Construção
      "CYRE3", "MRVE3", "EZTC3", "EVEN3", "DIRR3",
      // Alimentos
      "JBSS3", "BRFS3", "MRFG3", "BEEF3", "MDIA3",
      // Saúde
      "HAPV3", "RDOR3", "FLRY3", "QUAL3", "HYPE3", "RADL3",
      // Mineração e Siderurgia
      "CSNA3", "GGBR4", "USIM5", "GOAU4", "BRKM5",
      // Papel e Celulose
      "SUZB3", "KLBN11",
      // Transporte e Logística
      "RAIL3", "CCRO3", "RENT3", "EMBR3", "GOLL4", "AZUL4", "STBP3", "ECOR3", "VAMO3",
      // Tecnologia
      "TOTS3", "LWSA3", "CASH3", "POSI3", "INTB3",
      // Telecomunicações
      "VIVT3", "TIMS3",
      // Petróleo e Gás
      "PETR3", "PRIO3", "RRRP3", "CSAN3", "UGPA3", "BRAV3", "RAIZ4",
      // Shoppings
      "MULT3", "IGTI11", "ALSO3", "BRML3",
      // Seguros
      "SULA11", "PSSA3",
      // Educação
      "YDUQ3", "COGN3",
      // Outros
      "ASAI3", "CRFB3", "PCAR3", "SMTO3", "SBSP3", "SAPR11"
    ];

    let stocksToFetch = allStocks;
    
    // Buscar em lotes para evitar timeout
    const batchSize = 20;
    const results: any[] = [];
    
    for (let i = 0; i < Math.min(stocksToFetch.length, 60); i += batchSize) {
      const batch = stocksToFetch.slice(i, i + batchSize);
      const url = `https://brapi.dev/api/quote/${batch.join(",")}?token=${BRAPI_TOKEN}`;
      
      try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.results) {
          results.push(...data.results);
        }
      } catch (batchError) {
        console.error(`Error fetching batch: ${batchError}`);
      }
    }

    // Ordenar por variação para maiores altas e baixas
    const stocks = results.map((stock: any) => ({
      symbol: stock.symbol,
      shortName: stock.shortName || stock.longName || stock.symbol,
      regularMarketPrice: stock.regularMarketPrice || 0,
      regularMarketChange: stock.regularMarketChange || 0,
      regularMarketChangePercent: stock.regularMarketChangePercent || 0,
      logoUrl: stock.logourl || null,
    }));

    const sortedByGain = [...stocks].sort((a, b) => b.regularMarketChangePercent - a.regularMarketChangePercent);
    const maioresAltas = sortedByGain.filter(s => s.regularMarketChangePercent > 0).slice(0, 10);
    const maioresBaixas = sortedByGain.filter(s => s.regularMarketChangePercent < 0).slice(-10).reverse();

    // Índices do mercado
    let indices: any[] = [];
    try {
      const indicesUrl = `https://brapi.dev/api/quote/%5EBVSP,%5EIFIX?token=${BRAPI_TOKEN}`;
      const indicesResponse = await fetch(indicesUrl);
      const indicesData = await indicesResponse.json();
      
      if (indicesData.results) {
        indices = indicesData.results.map((idx: any) => ({
          name: idx.symbol === '^BVSP' ? 'IBOV' : idx.symbol === '^IFIX' ? 'IFIX' : idx.symbol,
          value: idx.regularMarketPrice || 0,
          changePercent: idx.regularMarketChangePercent || 0,
        }));
      }
    } catch (indicesError) {
      console.error('Error fetching indices:', indicesError);
    }

    return new Response(
      JSON.stringify({
        stocks,
        maioresAltas,
        maioresBaixas,
        indices,
        lastUpdate: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
