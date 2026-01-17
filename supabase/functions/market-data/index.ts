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
    const STOCK_NEWS_API_KEY = Deno.env.get('STOCK_NEWS_API_KEY');
    
    if (!BRAPI_TOKEN) {
      throw new Error('BRAPI_TOKEN not configured');
    }

    const { type = 'all', symbol } = await req.json().catch(() => ({}));

    // Buscar notícias de uma ação específica usando Google News RSS
    if (type === 'news' && symbol) {
      console.log(`Fetching news for ${symbol}`);
      
      try {
        // Remover número do ticker para buscar o nome da empresa
        const companyName = symbol.replace(/[0-9]/g, '');
        
        // Usar Google News RSS para buscar notícias
        const googleNewsUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(symbol + ' OR ' + companyName + ' ação bolsa')}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
        
        console.log(`Requesting Google News: ${googleNewsUrl}`);
        
        const newsResponse = await fetch(googleNewsUrl);
        const xmlText = await newsResponse.text();
        
        console.log(`Google News response length: ${xmlText.length}`);
        
        // Parse simple XML to extract news items
        const news: any[] = [];
        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        const titleRegex = /<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/;
        const linkRegex = /<link>(.*?)<\/link>/;
        const pubDateRegex = /<pubDate>(.*?)<\/pubDate>/;
        const sourceRegex = /<source.*?>(.*?)<\/source>/;
        
        let match;
        let count = 0;
        
        while ((match = itemRegex.exec(xmlText)) !== null && count < 5) {
          const itemContent = match[1];
          
          const titleMatch = itemContent.match(titleRegex);
          const linkMatch = itemContent.match(linkRegex);
          const pubDateMatch = itemContent.match(pubDateRegex);
          const sourceMatch = itemContent.match(sourceRegex);
          
          if (titleMatch && linkMatch) {
            const title = titleMatch[1] || titleMatch[2] || '';
            
            // Skip se não parecer relacionado ao mercado financeiro
            const isRelevant = title.toLowerCase().includes(symbol.toLowerCase()) || 
                               title.toLowerCase().includes(companyName.toLowerCase()) ||
                               title.toLowerCase().includes('ação') ||
                               title.toLowerCase().includes('bolsa') ||
                               title.toLowerCase().includes('ibovespa') ||
                               title.toLowerCase().includes('mercado');
            
            if (isRelevant || count < 3) {
              news.push({
                title: title,
                text: '',
                source_name: sourceMatch ? sourceMatch[1] : 'Google News',
                date: pubDateMatch ? pubDateMatch[1] : new Date().toISOString(),
                news_url: linkMatch[1],
                image_url: null,
                sentiment: null,
              });
              count++;
            }
          }
        }
        
        console.log(`Found ${news.length} news items`);
        
        return new Response(
          JSON.stringify({ news }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (newsError) {
        console.error('Error fetching news:', newsError);
        return new Response(
          JSON.stringify({ news: [], error: 'Failed to fetch news' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Se for buscar detalhes de uma ação específica
    if (type === 'detail' && symbol) {
      console.log(`Fetching all details for ${symbol}`);
      
      // Buscar dados com fundamental=true, dividends=true, modules e range
      const url = `https://brapi.dev/api/quote/${symbol}?token=${BRAPI_TOKEN}&fundamental=true&dividends=true&range=1y&interval=1d&modules=summaryProfile,defaultKeyStatistics,financialData,balanceSheetHistory,incomeStatementHistory`;
      
      console.log(`Requesting: ${url.replace(BRAPI_TOKEN, '***')}`);
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log(`Response keys: ${Object.keys(data).join(', ')}`);
      
      if (data.results && data.results.length > 0) {
        const stock = data.results[0];
        
        console.log(`Stock data keys: ${Object.keys(stock).join(', ')}`);
        
        // Extrair dados do summaryProfile
        const summaryProfile = stock.summaryProfile || {};
        
        // Extrair dados do defaultKeyStatistics
        const keyStats = stock.defaultKeyStatistics || {};
        
        // Extrair dados financeiros
        const financialData = stock.financialData || {};
        
        // Extrair balanço patrimonial
        const balanceSheet = stock.balanceSheetHistory?.balanceSheetStatements?.[0] || {};
        
        // Extrair demonstração de resultados
        const incomeStatement = stock.incomeStatementHistory?.incomeStatementHistory?.[0] || {};
        
        // Processar dados históricos para gráfico
        const historicalData = (stock.historicalDataPrice || []).map((item: any) => ({
          date: item.date,
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close,
          volume: item.volume,
        }));
        
        // Processar dividendos
        const dividendsData = (stock.dividendsData?.cashDividends || []).map((div: any) => ({
          paymentDate: div.paymentDate,
          rate: div.rate,
          type: div.type,
          relatedTo: div.relatedTo,
        }));
        
        const result = {
          // Dados básicos
          symbol: stock.symbol,
          shortName: stock.shortName || stock.longName || stock.symbol,
          longName: stock.longName || stock.shortName || stock.symbol,
          currency: stock.currency || 'BRL',
          logoUrl: stock.logourl || null,
          
          // Preços em tempo real
          regularMarketPrice: stock.regularMarketPrice || 0,
          regularMarketChange: stock.regularMarketChange || 0,
          regularMarketChangePercent: stock.regularMarketChangePercent || 0,
          regularMarketOpen: stock.regularMarketOpen || null,
          regularMarketDayHigh: stock.regularMarketDayHigh || null,
          regularMarketDayLow: stock.regularMarketDayLow || null,
          regularMarketPreviousClose: stock.regularMarketPreviousClose || null,
          regularMarketVolume: stock.regularMarketVolume || null,
          regularMarketTime: stock.regularMarketTime || null,
          
          // Dados de 52 semanas
          fiftyTwoWeekHigh: stock.fiftyTwoWeekHigh || null,
          fiftyTwoWeekLow: stock.fiftyTwoWeekLow || null,
          fiftyTwoWeekHighChange: stock.fiftyTwoWeekHighChange || null,
          fiftyTwoWeekHighChangePercent: stock.fiftyTwoWeekHighChangePercent || null,
          fiftyTwoWeekLowChange: stock.fiftyTwoWeekLowChange || null,
          fiftyTwoWeekLowChangePercent: stock.fiftyTwoWeekLowChangePercent || null,
          
          // Volume médio
          averageDailyVolume10Day: stock.averageDailyVolume10Day || null,
          averageDailyVolume3Month: stock.averageDailyVolume3Month || null,
          
          // Indicadores fundamentalistas básicos
          marketCap: stock.marketCap || null,
          priceEarnings: stock.priceEarnings || keyStats.trailingPE || null,
          earningsPerShare: stock.earningsPerShare || keyStats.trailingEps || null,
          bookValuePerShare: stock.bookValuePerShare || keyStats.bookValue || null,
          priceToBook: stock.priceToBook || keyStats.priceToBook || null,
          
          // Dividendos
          dividendYield: keyStats.dividendYield || stock.dividendYield || null,
          dividendRate: keyStats.dividendRate || null,
          payoutRatio: keyStats.payoutRatio || null,
          exDividendDate: keyStats.exDividendDate || null,
          lastDividendValue: keyStats.lastDividendValue || null,
          lastDividendDate: keyStats.lastDividendDate || null,
          
          // Indicadores de valor
          enterpriseValue: keyStats.enterpriseValue || null,
          forwardPE: keyStats.forwardPE || null,
          pegRatio: keyStats.pegRatio || null,
          enterpriseToRevenue: keyStats.enterpriseToRevenue || null,
          enterpriseToEbitda: keyStats.enterpriseToEbitda || null,
          
          // Indicadores de rentabilidade
          profitMargins: keyStats.profitMargins || financialData.profitMargins || null,
          returnOnAssets: financialData.returnOnAssets || null,
          returnOnEquity: financialData.returnOnEquity || null,
          
          // Indicadores financeiros
          totalCash: financialData.totalCash || null,
          totalCashPerShare: financialData.totalCashPerShare || null,
          totalDebt: financialData.totalDebt || null,
          debtToEquity: financialData.debtToEquity || null,
          currentRatio: financialData.currentRatio || null,
          quickRatio: financialData.quickRatio || null,
          
          // Receita e lucro
          totalRevenue: financialData.totalRevenue || null,
          revenuePerShare: financialData.revenuePerShare || null,
          revenueGrowth: financialData.revenueGrowth || null,
          grossMargins: financialData.grossMargins || null,
          ebitdaMargins: financialData.ebitdaMargins || null,
          operatingMargins: financialData.operatingMargins || null,
          ebitda: financialData.ebitda || null,
          operatingCashflow: financialData.operatingCashflow || null,
          freeCashflow: financialData.freeCashflow || null,
          
          // Dados da empresa (summaryProfile)
          sector: summaryProfile.sector || null,
          industry: summaryProfile.industry || null,
          website: summaryProfile.website || null,
          longBusinessSummary: summaryProfile.longBusinessSummary || null,
          fullTimeEmployees: summaryProfile.fullTimeEmployees || null,
          city: summaryProfile.city || null,
          state: summaryProfile.state || null,
          country: summaryProfile.country || null,
          
          // Balanço patrimonial (último)
          totalAssets: balanceSheet.totalAssets || null,
          totalLiabilities: balanceSheet.totalLiab || null,
          totalStockholderEquity: balanceSheet.totalStockholderEquity || null,
          
          // Demonstração de resultados (último)
          grossProfit: incomeStatement.grossProfit || null,
          netIncome: incomeStatement.netIncome || null,
          operatingIncome: incomeStatement.operatingIncome || null,
          
          // Beta e volatilidade
          beta: keyStats.beta || null,
          
          // Shares
          sharesOutstanding: keyStats.sharesOutstanding || null,
          floatShares: keyStats.floatShares || null,
          
          // Dados históricos (para gráfico)
          historicalData: historicalData.slice(-30), // Últimos 30 dias
          
          // Dividendos históricos
          dividendsHistory: dividendsData.slice(0, 12), // Últimos 12 pagamentos
          
          // Timestamp
          lastUpdate: new Date().toISOString(),
        };
        
        console.log(`Returning ${Object.keys(result).length} fields`);
        
        return new Response(
          JSON.stringify(result),
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

    // Buscar em lotes para evitar timeout
    const batchSize = 20;
    const results: any[] = [];
    
    for (let i = 0; i < Math.min(allStocks.length, 60); i += batchSize) {
      const batch = allStocks.slice(i, i + batchSize);
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
