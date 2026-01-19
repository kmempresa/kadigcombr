import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mapeamento de setores em português
const sectorMapping: Record<string, string> = {
  'Financial Services': 'SERVIÇOS FINANCEIROS',
  'Utilities': 'UTILIDADES',
  'Technology': 'TECNOLOGIA',
  'Consumer Cyclical': 'CONSUMO CÍCLICO',
  'Consumer Defensive': 'CONSUMO NÃO CÍCLICO',
  'Healthcare': 'SAÚDE',
  'Industrials': 'INDUSTRIAL',
  'Basic Materials': 'MATERIAIS BÁSICOS',
  'Energy': 'ENERGIA',
  'Real Estate': 'IMÓVEIS',
  'Communication Services': 'COMUNICAÇÃO',
};

// Carteiras recomendadas (dados estáticos - podem ser movidos para banco de dados depois)
const recommendedPortfolios = [
  {
    id: "dividendos",
    name: "Dividendos - Janeiro/26",
    description: "A carteira tem como objetivo a seleção das melhores empresas sob a ótica de geração total de valor ao acionista com foco na distribuição de proventos. Dessa forma, realizamos uma análise focada em ativos com histórico consistente de pagamento de dividendos.",
    createdAt: "15 jan 2026",
    validUntil: "13 fev 2026",
    rentabilidadeAnterior: -1.60,
    rentabilidadeAcumulada: 126.60,
    benchmark: "IDIV",
    benchmarkRentAnterior: 1.50,
    benchmarkRentAcumulada: 87.60,
    analysts: [
      { name: "Renata Faber", avatarUrl: "https://i.pravatar.cc/100?img=1" },
      { name: "Carlos Sequeira, CFA", avatarUrl: "https://i.pravatar.cc/100?img=3" },
      { name: "Rafaella Dortas", avatarUrl: "https://i.pravatar.cc/100?img=5" },
    ],
    tickers: ["ELET3", "CPLE3", "CYRE3", "EQTL3", "ITUB4", "RENT3", "RADL3", "RDOR3", "SAPR11", "BBAS3"],
    newTickers: ["RADL3", "SAPR11"],
    removedTickers: ["DIRR3", "SMFT3"],
  },
  {
    id: "bdr",
    name: "BDR Janeiro/26",
    description: "A carteira de ações internacionais oferece oportunidades de investimento no exterior e é composta por BDRs. O processo de seleção dos BDRs é realizado pelo time de analistas e estrategistas com foco em empresas globais de alto crescimento.",
    createdAt: "15 jan 2026",
    validUntil: "13 fev 2026",
    rentabilidadeAnterior: 4.40,
    rentabilidadeAcumulada: 104.80,
    benchmark: "BDRX",
    benchmarkRentAnterior: 3.30,
    benchmarkRentAcumulada: 95.80,
    analysts: [
      { name: "Renata Faber", avatarUrl: "https://i.pravatar.cc/100?img=1" },
      { name: "Carlos Sequeira, CFA", avatarUrl: "https://i.pravatar.cc/100?img=3" },
    ],
    tickers: ["NVDC34", "MSFT34", "AAPL34", "GOGL34", "AMZO34", "M1TA34", "TSLA34", "VISA34", "JPMC34", "UNHH34"],
    newTickers: [],
    removedTickers: [],
  },
  {
    id: "fii",
    name: "FII - Janeiro/26",
    description: "Destinada aos investidores que gostariam de ter renda e ganho de capital, a Carteira Recomendada de Fundos Imobiliários tem como objetivo capturar as melhores oportunidades do mercado de FIIs após uma análise criteriosa.",
    createdAt: "15 jan 2026",
    validUntil: "13 fev 2026",
    rentabilidadeAnterior: 2.74,
    rentabilidadeAcumulada: 63.54,
    benchmark: "IFIX",
    benchmarkRentAnterior: 3.14,
    benchmarkRentAcumulada: 43.76,
    analysts: [
      { name: "Renata Faber", avatarUrl: "https://i.pravatar.cc/100?img=1" },
      { name: "Rafaella Dortas", avatarUrl: "https://i.pravatar.cc/100?img=5" },
    ],
    tickers: ["HGLG11", "XPML11", "KNRI11", "VISC11", "BTLG11", "HFOF11", "IRDM11", "CPTS11", "TGAR11", "BRCO11"],
    newTickers: ["TGAR11"],
    removedTickers: [],
  },
  {
    id: "etf",
    name: "ETF Strategy Janeiro/26",
    description: "O ETF Strategy é uma carteira de investimentos de fundos passivos listados em bolsa de valores (exchange-traded funds, ETF), compostas tanto por ETFs locais quanto BDR de ETFs internacionais.",
    createdAt: "15 jan 2026",
    validUntil: "13 fev 2026",
    rentabilidadeAnterior: 1.17,
    rentabilidadeAcumulada: 13.40,
    benchmark: "CDI",
    benchmarkRentAnterior: 1.16,
    benchmarkRentAcumulada: 16.20,
    analysts: [
      { name: "Carlos Sequeira, CFA", avatarUrl: "https://i.pravatar.cc/100?img=3" },
    ],
    tickers: ["BOVA11", "IVVB11", "SMAL11", "DIVO11", "HASH11", "GOLD11"],
    newTickers: [],
    removedTickers: [],
  },
  {
    id: "esg",
    name: "ESG - Janeiro/2026",
    description: "O investimento responsável está se tornando cada vez mais importante para a comunidade de investidores. Com o objetivo de auxiliar nossos clientes em seu processo de investimento, lançamos um portfólio ESG. Será uma carteira de 10 ações, com revisão mensal.",
    createdAt: "15 jan 2026",
    validUntil: "13 fev 2026",
    rentabilidadeAnterior: -6.50,
    rentabilidadeAcumulada: 8.10,
    benchmark: "S&P/B3",
    benchmarkRentAnterior: 1.60,
    benchmarkRentAcumulada: 8.40,
    analysts: [
      { name: "Renata Faber", avatarUrl: "https://i.pravatar.cc/100?img=1" },
      { name: "Carlos Sequeira, CFA", avatarUrl: "https://i.pravatar.cc/100?img=3" },
      { name: "Rafaella Dortas", avatarUrl: "https://i.pravatar.cc/100?img=5" },
    ],
    tickers: ["ELET3", "CPLE3", "CYRE3", "EQTL3", "ITUB4", "RENT3", "RADL3", "RDOR3", "SAPR11", "SUZB3"],
    newTickers: [],
    removedTickers: [],
  },
  {
    id: "analise-tecnica",
    name: "Análise Técnica (Gráfica)",
    description: "A carteira tem como objetivo capturar as melhores oportunidades e performances do mercado de ações sugerindo uma carteira com até 10 ativos, com nova composição mensal. O processo de seleção utiliza análise gráfica.",
    createdAt: "15 jan 2026",
    validUntil: "13 fev 2026",
    rentabilidadeAnterior: 3.54,
    rentabilidadeAcumulada: 79.42,
    benchmark: "IBOV",
    benchmarkRentAnterior: 2.72,
    benchmarkRentAcumulada: 56.94,
    analysts: [
      { name: "Carlos Sequeira, CFA", avatarUrl: "https://i.pravatar.cc/100?img=3" },
      { name: "Rafaella Dortas", avatarUrl: "https://i.pravatar.cc/100?img=5" },
    ],
    tickers: ["FESA4", "ALUP11", "BEEF3", "CEAB3", "VAMO3", "RADL3", "SLCE3", "CSNA3", "SUZB3", "VALE3"],
    newTickers: ["SLCE3", "CSNA3"],
    removedTickers: ["POMO4"],
  },
];

// Função para obter o setor traduzido
function getSector(stock: any): string {
  // Tentar obter do summaryProfile
  if (stock.summaryProfile?.sector) {
    const englishSector = stock.summaryProfile.sector;
    return sectorMapping[englishSector] || englishSector.toUpperCase();
  }
  
  // Detectar tipo de ativo pelo ticker
  const ticker = stock.symbol || '';
  
  if (ticker.includes('11')) {
    if (ticker.match(/^[A-Z]{4}11$/)) {
      return 'FUNDOS IMOBILIÁRIOS';
    }
    return 'ETF / OUTROS';
  }
  
  if (ticker.includes('34')) {
    return 'BDR';
  }
  
  // Usar setor padrão se disponível na resposta
  if (stock.sector) {
    return sectorMapping[stock.sector] || stock.sector.toUpperCase();
  }
  
  return 'OUTROS';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const BRAPI_TOKEN = Deno.env.get('BRAPI_TOKEN');
    
    if (!BRAPI_TOKEN) {
      throw new Error('BRAPI_TOKEN not configured');
    }

    const { type = 'list', portfolioId } = await req.json().catch(() => ({}));

    console.log(`Recommended portfolios request: type=${type}, portfolioId=${portfolioId}`);

    // Lista básica das carteiras (sem dados de ativos detalhados)
    if (type === 'list') {
      // Para a listagem, buscar apenas logos dos primeiros 10 ativos de cada carteira
      const portfoliosWithLogos = await Promise.all(
        recommendedPortfolios.map(async (portfolio) => {
          const tickersToFetch = portfolio.tickers.slice(0, 10).join(',');
          
          try {
            const url = `https://brapi.dev/api/quote/${tickersToFetch}?token=${BRAPI_TOKEN}`;
            const response = await fetch(url);
            const data = await response.json();
            
            const assetLogos = (data.results || []).map((stock: any) => ({
              ticker: stock.symbol,
              logoUrl: stock.logourl || null,
              shortName: stock.shortName || stock.symbol,
            }));

            return {
              ...portfolio,
              assetLogos,
            };
          } catch (error) {
            console.error(`Error fetching logos for ${portfolio.id}:`, error);
            return {
              ...portfolio,
              assetLogos: portfolio.tickers.map(t => ({ ticker: t, logoUrl: null, shortName: t })),
            };
          }
        })
      );

      return new Response(
        JSON.stringify({ portfolios: portfoliosWithLogos }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Detalhes de uma carteira específica com dados completos dos ativos
    if (type === 'detail' && portfolioId) {
      const portfolio = recommendedPortfolios.find(p => p.id === portfolioId);
      
      if (!portfolio) {
        return new Response(
          JSON.stringify({ error: 'Portfolio not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Buscar dados detalhados de todos os ativos (incluindo removidos)
      const allTickers = [...portfolio.tickers, ...portfolio.removedTickers];
      const tickersString = allTickers.join(',');
      
      console.log(`Fetching detailed data for ${allTickers.length} assets: ${tickersString}`);

      try {
        // Usar fundamental=true para obter dados fundamentalistas completos
        const url = `https://brapi.dev/api/quote/${tickersString}?token=${BRAPI_TOKEN}&fundamental=true`;
        const response = await fetch(url);
        const data = await response.json();
        
        console.log(`BRAPI returned ${data.results?.length || 0} results`);

        const assets = (data.results || []).map((stock: any) => {
          const isNew = portfolio.newTickers.includes(stock.symbol);
          const isRemoved = portfolio.removedTickers.includes(stock.symbol);
          
          // Calcular peso igual para ativos ativos
          const activeAssets = portfolio.tickers.length;
          const weight = isRemoved ? 0 : (100 / activeAssets);

          // Obter setor traduzido
          const sector = getSector(stock);

          // Extrair indicadores fundamentalistas de múltiplas fontes possíveis
          const pl = stock.priceEarnings || stock.trailingPE || stock.forwardPE || null;
          const evEbtida = stock.enterpriseToEbitda || stock.evToEbitda || null;
          const pvp = stock.priceToBook || null;
          
          // Dividend yield em percentual
          let dividendYield = null;
          if (stock.dividendYield !== undefined && stock.dividendYield !== null) {
            // BRAPI retorna como decimal (0.05 = 5%)
            dividendYield = stock.dividendYield > 1 ? stock.dividendYield : stock.dividendYield * 100;
          }

          // ROE e Margem EBIT
          const roe = stock.returnOnEquity ? stock.returnOnEquity * 100 : null;
          const marginEbit = stock.ebitMargin ? stock.ebitMargin * 100 : null;

          return {
            ticker: stock.symbol,
            name: stock.longName || stock.shortName || stock.symbol,
            sector,
            weight: parseFloat(weight.toFixed(2)),
            logoUrl: stock.logourl || null,
            regularMarketPrice: stock.regularMarketPrice || 0,
            regularMarketChangePercent: stock.regularMarketChangePercent || 0,
            // Indicadores fundamentalistas
            pl,
            evEbtida,
            pvp,
            dividendYield,
            roe,
            marginEbit,
            // Status
            isNew,
            isRemoved,
          };
        });

        // Separar ativos ativos e removidos
        const activeAssets = assets.filter((a: any) => !a.isRemoved);
        const removedAssets = assets.filter((a: any) => a.isRemoved);
        const newAssets = assets.filter((a: any) => a.isNew);

        // Calcular distribuição por setor (agregado)
        const sectorDistribution = activeAssets.reduce((acc: any[], asset: any) => {
          const existing = acc.find((s: any) => s.name === asset.sector);
          if (existing) {
            existing.value += asset.weight;
          } else {
            acc.push({ name: asset.sector, value: asset.weight });
          }
          return acc;
        }, []);

        // Ordenar setores por valor
        sectorDistribution.sort((a: any, b: any) => b.value - a.value);

        // Calcular distribuição por ativo
        const assetDistribution = activeAssets.map((asset: any) => ({
          name: asset.ticker,
          value: asset.weight,
        }));

        const result = {
          ...portfolio,
          assets: activeAssets,
          removedAssets,
          newAssets,
          sectorDistribution,
          assetDistribution,
          lastUpdate: new Date().toISOString(),
        };

        console.log(`Returning portfolio ${portfolioId} with ${activeAssets.length} active assets`);

        return new Response(
          JSON.stringify(result),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error(`Error fetching portfolio details:`, error);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch portfolio details', portfolio }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: 'Invalid request type' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in recommended-portfolios function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
