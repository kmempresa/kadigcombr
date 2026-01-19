import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Lista de tickers para o índice Kadig
const KADIG_TICKERS = [
  'CURY3', 'LPSB3', 'RSUL4', 'CXSE3', 'CAMB3', 'ALLD3', 'DEXP3', 'INTB3', 'BRAP4',
  'PETR4', 'VALE3', 'ITUB4', 'BBDC4', 'BBAS3', 'WEGE3', 'RENT3', 'SUZB3', 'ELET3',
  'ABEV3', 'MGLU3', 'LREN3', 'RADL3', 'EQTL3', 'CPLE3', 'ENGI11', 'TAEE11', 'VIVT3',
  'GGBR4', 'CSNA3', 'USIM5', 'GOAU4', 'BEEF3', 'MRFG3', 'JBSS3', 'BRFS3', 'SMTO3',
];

// Função para calcular score financeiro baseado em indicadores
function calculateFinancialScore(stock: any): number {
  let score = 50; // Base score
  
  // ROE (Return on Equity) - quanto maior melhor
  const roe = stock.returnOnEquity;
  if (roe !== undefined && roe !== null) {
    if (roe > 0.20) score += 15;
    else if (roe > 0.15) score += 10;
    else if (roe > 0.10) score += 5;
    else if (roe < 0) score -= 10;
  }
  
  // Margem líquida - quanto maior melhor
  const netMargin = stock.profitMargins || stock.netIncomeToRevenue;
  if (netMargin !== undefined && netMargin !== null) {
    if (netMargin > 0.20) score += 15;
    else if (netMargin > 0.10) score += 10;
    else if (netMargin > 0.05) score += 5;
    else if (netMargin < 0) score -= 10;
  }
  
  // Dívida/Patrimônio - quanto menor melhor
  const debtToEquity = stock.debtToEquity;
  if (debtToEquity !== undefined && debtToEquity !== null) {
    if (debtToEquity < 0.5) score += 10;
    else if (debtToEquity < 1) score += 5;
    else if (debtToEquity > 2) score -= 10;
  }
  
  // Crescimento de receita
  const revenueGrowth = stock.revenueGrowth;
  if (revenueGrowth !== undefined && revenueGrowth !== null) {
    if (revenueGrowth > 0.15) score += 10;
    else if (revenueGrowth > 0.05) score += 5;
    else if (revenueGrowth < 0) score -= 5;
  }
  
  return Math.max(0, Math.min(100, score));
}

// Função para calcular score de dividendos
function calculateDividendScore(stock: any): number {
  let score = 50;
  
  const dividendYield = stock.dividendYield;
  if (dividendYield !== undefined && dividendYield !== null) {
    const dyPercent = dividendYield > 1 ? dividendYield : dividendYield * 100;
    if (dyPercent > 8) score += 30;
    else if (dyPercent > 6) score += 25;
    else if (dyPercent > 4) score += 20;
    else if (dyPercent > 2) score += 10;
    else if (dyPercent === 0) score -= 20;
  } else {
    score -= 20;
  }
  
  // Payout ratio - ideal entre 30-70%
  const payoutRatio = stock.payoutRatio;
  if (payoutRatio !== undefined && payoutRatio !== null) {
    if (payoutRatio >= 0.3 && payoutRatio <= 0.7) score += 10;
    else if (payoutRatio > 0.9) score -= 5;
  }
  
  return Math.max(0, Math.min(100, score));
}

// Função para calcular score de recomendação baseado em valuation
function calculateRecommendationScore(stock: any): number {
  let score = 50;
  
  // P/L - idealmente entre 5 e 15
  const pl = stock.priceEarnings || stock.trailingPE;
  if (pl !== undefined && pl !== null) {
    if (pl > 0 && pl < 8) score += 20;
    else if (pl >= 8 && pl < 15) score += 15;
    else if (pl >= 15 && pl < 25) score += 5;
    else if (pl >= 25 || pl < 0) score -= 10;
  }
  
  // P/VP - idealmente menor que 2
  const pvp = stock.priceToBook;
  if (pvp !== undefined && pvp !== null) {
    if (pvp > 0 && pvp < 1) score += 15;
    else if (pvp >= 1 && pvp < 2) score += 10;
    else if (pvp >= 2 && pvp < 3) score += 5;
    else if (pvp >= 4) score -= 10;
  }
  
  // Variação recente positiva
  const changePercent = stock.regularMarketChangePercent;
  if (changePercent !== undefined) {
    if (changePercent > 3) score += 10;
    else if (changePercent > 0) score += 5;
    else if (changePercent < -3) score -= 5;
  }
  
  return Math.max(0, Math.min(100, score));
}

// Função para calcular score geral do Índice Kadig
function calculateKadigIndex(financialScore: number, dividendScore: number, recommendationScore: number): number {
  // Pesos: Financeiro 40%, Dividendos 30%, Recomendação 30%
  return Math.round(financialScore * 0.4 + dividendScore * 0.3 + recommendationScore * 0.3);
}

// Mapeamento de setores
const sectorMapping: Record<string, string> = {
  'Financial Services': 'Serviços Financeiros',
  'Utilities': 'Utilidades',
  'Technology': 'Tecnologia',
  'Consumer Cyclical': 'Consumo Cíclico',
  'Consumer Defensive': 'Consumo Não Cíclico',
  'Healthcare': 'Saúde',
  'Industrials': 'Industrial',
  'Basic Materials': 'Materiais Básicos',
  'Energy': 'Energia',
  'Real Estate': 'Imóveis',
  'Communication Services': 'Comunicação',
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

    const { type = 'list', ticker, page = 1, limit = 10, sortBy = 'kadig' } = await req.json().catch(() => ({}));

    console.log(`Kadig Index request: type=${type}, page=${page}, sortBy=${sortBy}`);

    // Listar todos os ativos com scores
    if (type === 'list') {
      const tickersToFetch = KADIG_TICKERS.slice(0, 30).join(',');
      
      console.log(`Fetching data for ${KADIG_TICKERS.length} tickers...`);
      
      const url = `https://brapi.dev/api/quote/${tickersToFetch}?token=${BRAPI_TOKEN}&fundamental=true`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (!data.results) {
        throw new Error('No results from BRAPI');
      }
      
      console.log(`BRAPI returned ${data.results.length} stocks`);
      
      const stocks = data.results.map((stock: any) => {
        const financialScore = calculateFinancialScore(stock);
        const dividendScore = calculateDividendScore(stock);
        const recommendationScore = calculateRecommendationScore(stock);
        const kadigIndex = calculateKadigIndex(financialScore, dividendScore, recommendationScore);
        
        // Determinar setor
        let sector = 'Outros';
        if (stock.summaryProfile?.sector) {
          sector = sectorMapping[stock.summaryProfile.sector] || stock.summaryProfile.sector;
        } else if (stock.symbol?.includes('11')) {
          sector = 'Fundos Imobiliários';
        }
        
        return {
          ticker: stock.symbol,
          name: stock.longName || stock.shortName || stock.symbol,
          sector,
          logoUrl: stock.logourl || null,
          regularMarketPrice: stock.regularMarketPrice || 0,
          regularMarketChangePercent: stock.regularMarketChangePercent || 0,
          scores: {
            financeiro: financialScore,
            dividendos: dividendScore,
            recomendacao: recommendationScore,
            kadig: kadigIndex,
          },
          fundamentals: {
            pl: stock.priceEarnings || stock.trailingPE || null,
            pvp: stock.priceToBook || null,
            roe: stock.returnOnEquity ? (stock.returnOnEquity * 100) : null,
            dividendYield: stock.dividendYield ? (stock.dividendYield > 1 ? stock.dividendYield : stock.dividendYield * 100) : null,
            netMargin: stock.profitMargins ? (stock.profitMargins * 100) : null,
          },
        };
      });
      
      // Ordenar por score selecionado
      stocks.sort((a: any, b: any) => b.scores[sortBy] - a.scores[sortBy]);
      
      // Top performers
      const topPerformers = stocks.slice(0, 4);
      
      // Paginação
      const startIndex = (page - 1) * limit;
      const paginatedStocks = stocks.slice(startIndex, startIndex + limit);
      const totalPages = Math.ceil(stocks.length / limit);
      
      return new Response(
        JSON.stringify({
          stocks: paginatedStocks,
          topPerformers,
          totalStocks: stocks.length,
          currentPage: page,
          totalPages,
          lastUpdate: new Date().toISOString(),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Detalhes de um ticker específico
    if (type === 'detail' && ticker) {
      console.log(`Fetching detail for ${ticker}...`);
      
      const url = `https://brapi.dev/api/quote/${ticker}?token=${BRAPI_TOKEN}&fundamental=true`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (!data.results?.[0]) {
        return new Response(
          JSON.stringify({ error: 'Stock not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const stock = data.results[0];
      const financialScore = calculateFinancialScore(stock);
      const dividendScore = calculateDividendScore(stock);
      const recommendationScore = calculateRecommendationScore(stock);
      const kadigIndex = calculateKadigIndex(financialScore, dividendScore, recommendationScore);
      
      let sector = 'Outros';
      if (stock.summaryProfile?.sector) {
        sector = sectorMapping[stock.summaryProfile.sector] || stock.summaryProfile.sector;
      }
      
      const result = {
        ticker: stock.symbol,
        name: stock.longName || stock.shortName,
        sector,
        logoUrl: stock.logourl,
        regularMarketPrice: stock.regularMarketPrice,
        regularMarketChange: stock.regularMarketChange,
        regularMarketChangePercent: stock.regularMarketChangePercent,
        fiftyTwoWeekHigh: stock.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: stock.fiftyTwoWeekLow,
        marketCap: stock.marketCap,
        scores: {
          financeiro: financialScore,
          dividendos: dividendScore,
          recomendacao: recommendationScore,
          kadig: kadigIndex,
        },
        fundamentals: {
          pl: stock.priceEarnings || stock.trailingPE,
          pvp: stock.priceToBook,
          roe: stock.returnOnEquity ? (stock.returnOnEquity * 100) : null,
          roic: stock.returnOnAssets ? (stock.returnOnAssets * 100) : null,
          dividendYield: stock.dividendYield ? (stock.dividendYield > 1 ? stock.dividendYield : stock.dividendYield * 100) : null,
          netMargin: stock.profitMargins ? (stock.profitMargins * 100) : null,
          ebitMargin: stock.ebitMargins ? (stock.ebitMargins * 100) : null,
          debtToEquity: stock.debtToEquity,
          currentRatio: stock.currentRatio,
          eps: stock.trailingEps,
        },
        lastUpdate: new Date().toISOString(),
      };
      
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid request type' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in kadig-index function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
