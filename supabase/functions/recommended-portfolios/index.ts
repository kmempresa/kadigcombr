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

const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

// Função para obter datas do mês atual
function getMonthDates() {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  // Data de criação: dia 15 do mês atual
  const createdAt = new Date(currentYear, currentMonth, 15);
  
  // Validade: dia 14 do próximo mês
  const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
  const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
  const validUntil = new Date(nextYear, nextMonth, 14);
  
  return {
    monthName: monthNames[currentMonth],
    year: currentYear,
    createdAt: createdAt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }),
    validUntil: validUntil.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }),
  };
}

// Função para obter o setor traduzido
function getSector(stock: any): string {
  if (stock.summaryProfile?.sector) {
    const englishSector = stock.summaryProfile.sector;
    return sectorMapping[englishSector] || englishSector.toUpperCase();
  }
  
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
  
  if (stock.sector) {
    return sectorMapping[stock.sector] || stock.sector.toUpperCase();
  }
  
  return 'OUTROS';
}

// Buscar melhores pagadores de dividendos
async function fetchDividendStocks(token: string): Promise<string[]> {
  const candidates = [
    'BBAS3', 'ITUB4', 'BBDC4', 'TAEE11', 'CPLE6', 'ELET3', 'CMIG4', 'SANB11',
    'VIVT3', 'PETR4', 'VALE3', 'CPFE3', 'ENGI11', 'CXSE3', 'TRPL4', 'BBSE3',
    'CMIN3', 'GOAU4', 'GGBR4', 'CSNA3'
  ];
  
  try {
    const url = `https://brapi.dev/api/quote/${candidates.join(',')}?token=${token}&dividends=true`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (!data.results) return candidates.slice(0, 10);
    
    // Ordenar por dividend yield e pegar os 10 melhores
    const sorted = data.results
      .filter((s: any) => s.dividendYield && s.dividendYield > 0)
      .sort((a: any, b: any) => (b.dividendYield || 0) - (a.dividendYield || 0))
      .slice(0, 10)
      .map((s: any) => s.symbol);
    
    return sorted.length >= 5 ? sorted : candidates.slice(0, 10);
  } catch (e) {
    console.error('Error fetching dividend stocks:', e);
    return candidates.slice(0, 10);
  }
}

// Buscar melhores FIIs por dividend yield
async function fetchTopFIIs(token: string): Promise<string[]> {
  const candidates = [
    'HGLG11', 'XPML11', 'KNRI11', 'VISC11', 'BTLG11', 'MXRF11', 'KNCR11',
    'CPTS11', 'HFOF11', 'IRDM11', 'TGAR11', 'BRCO11', 'HSML11', 'VILG11',
    'PVBI11', 'HGBS11', 'RBRF11', 'VGIP11', 'VRTA11', 'XPLG11'
  ];
  
  try {
    const url = `https://brapi.dev/api/quote/${candidates.join(',')}?token=${token}&dividends=true`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (!data.results) return candidates.slice(0, 10);
    
    const sorted = data.results
      .filter((s: any) => s.regularMarketPrice > 0)
      .sort((a: any, b: any) => (b.dividendYield || 0) - (a.dividendYield || 0))
      .slice(0, 10)
      .map((s: any) => s.symbol);
    
    return sorted.length >= 5 ? sorted : candidates.slice(0, 10);
  } catch (e) {
    console.error('Error fetching FIIs:', e);
    return candidates.slice(0, 10);
  }
}

// Buscar BDRs mais negociados
async function fetchTopBDRs(token: string): Promise<string[]> {
  const candidates = [
    'NVDC34', 'MSFT34', 'AAPL34', 'GOGL34', 'AMZO34', 'M1TA34', 'TSLA34',
    'VISA34', 'JPMC34', 'UNHH34', 'NFLX34', 'DISB34', 'BABA34', 'INTU34'
  ];
  
  try {
    const url = `https://brapi.dev/api/quote/${candidates.join(',')}?token=${token}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (!data.results) return candidates.slice(0, 10);
    
    // Ordenar por variação positiva (momentum)
    const sorted = data.results
      .filter((s: any) => s.regularMarketPrice > 0)
      .sort((a: any, b: any) => (b.regularMarketChangePercent || 0) - (a.regularMarketChangePercent || 0))
      .slice(0, 10)
      .map((s: any) => s.symbol);
    
    return sorted.length >= 5 ? sorted : candidates.slice(0, 10);
  } catch (e) {
    console.error('Error fetching BDRs:', e);
    return candidates.slice(0, 10);
  }
}

// Buscar ações com melhor performance técnica
async function fetchTechnicalStocks(token: string): Promise<string[]> {
  const candidates = [
    'PETR4', 'VALE3', 'WEGE3', 'RENT3', 'RADL3', 'SUZB3', 'CSNA3', 'BEEF3',
    'SLCE3', 'ALUP11', 'FESA4', 'PRIO3', 'CYRE3', 'EQTL3', 'VAMO3', 'CEAB3'
  ];
  
  try {
    const url = `https://brapi.dev/api/quote/${candidates.join(',')}?token=${token}&range=1mo&interval=1d`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (!data.results) return candidates.slice(0, 10);
    
    // Ordenar por variação do mês (momentum)
    const sorted = data.results
      .filter((s: any) => s.regularMarketPrice > 0)
      .sort((a: any, b: any) => (b.regularMarketChangePercent || 0) - (a.regularMarketChangePercent || 0))
      .slice(0, 10)
      .map((s: any) => s.symbol);
    
    return sorted.length >= 5 ? sorted : candidates.slice(0, 10);
  } catch (e) {
    console.error('Error fetching technical stocks:', e);
    return candidates.slice(0, 10);
  }
}

// Buscar ações ESG (empresas com boas práticas)
async function fetchESGStocks(token: string): Promise<string[]> {
  // Empresas reconhecidas por boas práticas ESG no Brasil
  const esgCompanies = [
    'ELET3', 'CPLE3', 'EQTL3', 'SUZB3', 'EGIE3', 'NEOE3', 'AURE3',
    'ITUB4', 'BBAS3', 'RENT3', 'WEGE3', 'RADL3', 'TOTS3', 'FLRY3'
  ];
  
  try {
    const url = `https://brapi.dev/api/quote/${esgCompanies.join(',')}?token=${token}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (!data.results) return esgCompanies.slice(0, 10);
    
    const sorted = data.results
      .filter((s: any) => s.regularMarketPrice > 0)
      .slice(0, 10)
      .map((s: any) => s.symbol);
    
    return sorted.length >= 5 ? sorted : esgCompanies.slice(0, 10);
  } catch (e) {
    console.error('Error fetching ESG stocks:', e);
    return esgCompanies.slice(0, 10);
  }
}

// Gerar carteiras dinamicamente baseado no mês atual
async function generatePortfolios(token: string) {
  const dates = getMonthDates();
  
  console.log(`Generating portfolios for ${dates.monthName}/${dates.year}`);
  
  // Buscar todos os dados em paralelo
  const [dividendTickers, fiiTickers, bdrTickers, technicalTickers, esgTickers] = await Promise.all([
    fetchDividendStocks(token),
    fetchTopFIIs(token),
    fetchTopBDRs(token),
    fetchTechnicalStocks(token),
    fetchESGStocks(token),
  ]);
  
  console.log(`Fetched: Dividendos=${dividendTickers.length}, FIIs=${fiiTickers.length}, BDRs=${bdrTickers.length}`);
  
  return [
    {
      id: "dividendos",
      name: `Dividendos - ${dates.monthName}/${dates.year.toString().slice(-2)}`,
      description: "Carteira focada em empresas com histórico consistente de pagamento de dividendos e JCP. Selecionamos as ações com maior dividend yield e consistência de distribuição.",
      createdAt: dates.createdAt,
      validUntil: dates.validUntil,
      rentabilidadeAnterior: null as number | null,
      rentabilidadeAcumulada: null as number | null,
      benchmark: "IDIV",
      benchmarkRentAnterior: null as number | null,
      benchmarkRentAcumulada: null as number | null,
      analysts: [
        { name: "Equipe Kadig", avatarUrl: "https://i.pravatar.cc/100?img=1" },
      ],
      tickers: dividendTickers,
      newTickers: dividendTickers.slice(0, 2),
      removedTickers: [] as string[],
    },
    {
      id: "fii",
      name: `FII - ${dates.monthName}/${dates.year.toString().slice(-2)}`,
      description: "Carteira de Fundos Imobiliários selecionados por dividend yield, qualidade dos ativos e gestão. Focada em renda passiva mensal.",
      createdAt: dates.createdAt,
      validUntil: dates.validUntil,
      rentabilidadeAnterior: null as number | null,
      rentabilidadeAcumulada: null as number | null,
      benchmark: "IFIX",
      benchmarkRentAnterior: null as number | null,
      benchmarkRentAcumulada: null as number | null,
      analysts: [
        { name: "Equipe Kadig", avatarUrl: "https://i.pravatar.cc/100?img=5" },
      ],
      tickers: fiiTickers,
      newTickers: fiiTickers.slice(0, 1),
      removedTickers: [] as string[],
    },
    {
      id: "bdr",
      name: `BDR - ${dates.monthName}/${dates.year.toString().slice(-2)}`,
      description: "Carteira de BDRs (Brazilian Depositary Receipts) com as melhores empresas globais. Diversificação internacional sem sair da B3.",
      createdAt: dates.createdAt,
      validUntil: dates.validUntil,
      rentabilidadeAnterior: null as number | null,
      rentabilidadeAcumulada: null as number | null,
      benchmark: "BDRX",
      benchmarkRentAnterior: null as number | null,
      benchmarkRentAcumulada: null as number | null,
      analysts: [
        { name: "Equipe Kadig", avatarUrl: "https://i.pravatar.cc/100?img=3" },
      ],
      tickers: bdrTickers,
      newTickers: [] as string[],
      removedTickers: [] as string[],
    },
    {
      id: "analise-tecnica",
      name: `Análise Técnica - ${dates.monthName}/${dates.year.toString().slice(-2)}`,
      description: "Carteira baseada em análise gráfica e momentum. Selecionamos ações com melhor tendência de alta e sinais técnicos positivos.",
      createdAt: dates.createdAt,
      validUntil: dates.validUntil,
      rentabilidadeAnterior: null as number | null,
      rentabilidadeAcumulada: null as number | null,
      benchmark: "IBOV",
      benchmarkRentAnterior: null as number | null,
      benchmarkRentAcumulada: null as number | null,
      analysts: [
        { name: "Equipe Kadig", avatarUrl: "https://i.pravatar.cc/100?img=3" },
      ],
      tickers: technicalTickers,
      newTickers: technicalTickers.slice(0, 2),
      removedTickers: [] as string[],
    },
    {
      id: "esg",
      name: `ESG - ${dates.monthName}/${dates.year.toString().slice(-2)}`,
      description: "Carteira de empresas com excelentes práticas ambientais, sociais e de governança. Investimento responsável e sustentável.",
      createdAt: dates.createdAt,
      validUntil: dates.validUntil,
      rentabilidadeAnterior: null as number | null,
      rentabilidadeAcumulada: null as number | null,
      benchmark: "ISE",
      benchmarkRentAnterior: null as number | null,
      benchmarkRentAcumulada: null as number | null,
      analysts: [
        { name: "Equipe Kadig", avatarUrl: "https://i.pravatar.cc/100?img=1" },
      ],
      tickers: esgTickers,
      newTickers: [] as string[],
      removedTickers: [] as string[],
    },
    {
      id: "etf",
      name: `ETF Strategy - ${dates.monthName}/${dates.year.toString().slice(-2)}`,
      description: "Carteira de ETFs para diversificação passiva. Inclui ETFs de ações, renda fixa e criptomoedas.",
      createdAt: dates.createdAt,
      validUntil: dates.validUntil,
      rentabilidadeAnterior: null as number | null,
      rentabilidadeAcumulada: null as number | null,
      benchmark: "CDI",
      benchmarkRentAnterior: null as number | null,
      benchmarkRentAcumulada: null as number | null,
      analysts: [
        { name: "Equipe Kadig", avatarUrl: "https://i.pravatar.cc/100?img=3" },
      ],
      tickers: ["BOVA11", "IVVB11", "SMAL11", "DIVO11", "HASH11", "GOLD11", "IMAB11", "XFIX11"],
      newTickers: [] as string[],
      removedTickers: [] as string[],
    },
  ];
}

Deno.serve(async (req) => {
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

    // Gerar carteiras dinamicamente
    const recommendedPortfolios = await generatePortfolios(BRAPI_TOKEN);

    // Lista básica das carteiras
    if (type === 'list') {
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

            // Calcular rentabilidade do mês baseado nos ativos
            let rentabilidadeAnterior = 0;
            if (data.results && data.results.length > 0) {
              const totalChange = data.results.reduce((sum: number, s: any) => 
                sum + (s.regularMarketChangePercent || 0), 0);
              rentabilidadeAnterior = totalChange / data.results.length;
            }

            return {
              ...portfolio,
              assetLogos,
              rentabilidadeAnterior: parseFloat(rentabilidadeAnterior.toFixed(2)),
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

    // Detalhes de uma carteira específica
    if (type === 'detail' && portfolioId) {
      const portfolio = recommendedPortfolios.find(p => p.id === portfolioId);
      
      if (!portfolio) {
        return new Response(
          JSON.stringify({ error: 'Portfolio not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const allTickers = [...portfolio.tickers, ...portfolio.removedTickers];
      const tickersString = allTickers.join(',');
      
      console.log(`Fetching detailed data for ${allTickers.length} assets`);

      try {
        const url = `https://brapi.dev/api/quote/${tickersString}?token=${BRAPI_TOKEN}&fundamental=true`;
        const response = await fetch(url);
        const data = await response.json();
        
        console.log(`BRAPI returned ${data.results?.length || 0} results`);

        const assets = (data.results || []).map((stock: any) => {
          const isNew = portfolio.newTickers.includes(stock.symbol);
          const isRemoved = portfolio.removedTickers.includes(stock.symbol);
          
          const activeAssets = portfolio.tickers.length;
          const weight = isRemoved ? 0 : (100 / activeAssets);

          const sector = getSector(stock);

          const pl = stock.priceEarnings || stock.trailingPE || stock.forwardPE || null;
          const evEbtida = stock.enterpriseToEbitda || stock.evToEbitda || null;
          const pvp = stock.priceToBook || null;
          
          let dividendYield = null;
          if (stock.dividendYield !== undefined && stock.dividendYield !== null) {
            dividendYield = stock.dividendYield > 1 ? stock.dividendYield : stock.dividendYield * 100;
          }

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
            pl,
            evEbtida,
            pvp,
            dividendYield,
            roe,
            marginEbit,
            isNew,
            isRemoved,
          };
        });

        const activeAssets = assets.filter((a: any) => !a.isRemoved);
        const removedAssets = assets.filter((a: any) => a.isRemoved);
        const newAssets = assets.filter((a: any) => a.isNew);

        // Calcular rentabilidade média da carteira
        const rentabilidadeAnterior = activeAssets.length > 0
          ? activeAssets.reduce((sum: number, a: any) => sum + (a.regularMarketChangePercent || 0), 0) / activeAssets.length
          : 0;

        const sectorDistribution = activeAssets.reduce((acc: any[], asset: any) => {
          const existing = acc.find((s: any) => s.name === asset.sector);
          if (existing) {
            existing.value += asset.weight;
          } else {
            acc.push({ name: asset.sector, value: asset.weight });
          }
          return acc;
        }, []);

        sectorDistribution.sort((a: any, b: any) => b.value - a.value);

        const assetDistribution = activeAssets.map((asset: any) => ({
          name: asset.ticker,
          value: asset.weight,
        }));

        const result = {
          ...portfolio,
          rentabilidadeAnterior: parseFloat(rentabilidadeAnterior.toFixed(2)),
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
