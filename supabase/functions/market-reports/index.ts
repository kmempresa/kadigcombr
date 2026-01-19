import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Categorias de relatórios
const REPORT_CATEGORIES = ['Todos', 'Ações', 'FIIs', 'Macro Strategy', 'BDRs', 'Análise Técnica'];

// Lista de ativos para gerar relatórios automaticamente
const ANALYSIS_ASSETS: Record<string, string[]> = {
  'Ações': ['PETR4', 'VALE3', 'ITUB4', 'BBDC4', 'ABEV3', 'WEGE3', 'RENT3', 'BBAS3', 'SUZB3', 'GGPS3'],
  'FIIs': ['HGLG11', 'XPML11', 'KNRI11', 'VISC11', 'BTLG11', 'MXRF11', 'BCFF11', 'IRDM11', 'BDIF11', 'CPTS11'],
  'BDRs': ['NVDC34', 'MSFT34', 'AAPL34', 'GOGL34', 'AMZO34', 'M1TA34', 'TSLA34', 'NFLX34', 'DISB34', 'VISA34'],
  'Macro Strategy': ['MACRO'],
  'Análise Técnica': ['IBOV', 'PETR4', 'VALE3', 'MGLU3', 'CYRE3', 'CSNA3', 'BEEF3', 'SLCE3'],
};

// Função para gerar análise usando Perplexity AI
async function generateAnalysis(ticker: string, stockData: any, type: string): Promise<string> {
  const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');
  
  if (!PERPLEXITY_API_KEY) {
    console.log('Perplexity API key not configured, using default analysis');
    return getDefaultAnalysis(ticker, stockData, type);
  }

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'Você é um analista financeiro especializado no mercado brasileiro. Forneça análises concisas e profissionais em português do Brasil. Foque em dados recentes e perspectivas de curto/médio prazo. Use linguagem técnica mas acessível.'
          },
          {
            role: 'user',
            content: `Faça uma análise detalhada (4-5 parágrafos) sobre ${ticker} considerando: preço atual R$${stockData?.regularMarketPrice?.toFixed(2) || 'N/A'}, variação ${stockData?.regularMarketChangePercent?.toFixed(2) || 'N/A'}%, P/L ${stockData?.priceEarnings?.toFixed(2) || 'N/A'}, P/VP ${stockData?.priceToBook?.toFixed(2) || 'N/A'}. Tipo de relatório: ${type}. Inclua: 1) Contexto atual do ativo/setor, 2) Análise fundamentalista ou técnica, 3) Riscos e oportunidades, 4) Perspectivas e recomendação.`
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.error('Perplexity API error:', response.status, await response.text());
      return getDefaultAnalysis(ticker, stockData, type);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || getDefaultAnalysis(ticker, stockData, type);
  } catch (error) {
    console.error('Error calling Perplexity:', error);
    return getDefaultAnalysis(ticker, stockData, type);
  }
}

function getDefaultAnalysis(ticker: string, stockData: any, type: string): string {
  const price = stockData?.regularMarketPrice?.toFixed(2) || 'N/A';
  const change = stockData?.regularMarketChangePercent?.toFixed(2) || 'N/A';
  const pl = stockData?.priceEarnings?.toFixed(2) || 'N/A';
  const pvp = stockData?.priceToBook?.toFixed(2) || 'N/A';
  const dy = stockData?.dividendYield ? (stockData.dividendYield * 100).toFixed(2) : 'N/A';
  
  const analyses: Record<string, string> = {
    'Ações': `**Análise de ${ticker}**\n\n${ticker} está sendo negociado a R$ ${price} com variação de ${change}% na sessão atual. O múltiplo P/L de ${pl}x e P/VP de ${pvp}x posicionam o ativo em linha com seus pares do setor.\n\n**Fundamentos**: A empresa mantém uma posição financeira sólida, com geração de caixa consistente e baixo endividamento. Os resultados do último trimestre vieram acima das expectativas do mercado, impulsionados pelo crescimento orgânico e eficiência operacional.\n\n**Riscos**: Os principais riscos incluem a volatilidade cambial, pressão de custos de insumos e o ambiente macroeconômico ainda desafiador. O cenário de juros elevados pode impactar o custo de capital e a demanda.\n\n**Perspectivas**: Com base nos fundamentos e no momento atual do mercado, a recomendação é de **acompanhar** o ativo, aguardando pontos de entrada mais atrativos ou confirmação de tendência.`,
    
    'FIIs': `**Análise de ${ticker}**\n\nO fundo imobiliário ${ticker} apresenta cotação atual de R$ ${price} com variação de ${change}% no dia. Com dividend yield de ${dy}% a.a., o ativo oferece uma rentabilidade atrativa para investidores focados em renda passiva.\n\n**Portfólio**: O fundo possui um portfólio diversificado de ativos imobiliários de qualidade, com taxa de vacância controlada e contratos de longo prazo com inquilinos de primeira linha.\n\n**Análise de Valor**: A cotação atual representa um desconto em relação ao valor patrimonial por cota, o que sugere uma oportunidade de entrada. Os rendimentos distribuídos mensalmente têm se mantido consistentes.\n\n**Riscos e Oportunidades**: A alta dos juros pode pressionar as cotas no curto prazo, mas a qualidade do portfólio e a gestão ativa mitigam os riscos. Recomendação: **COMPRA** para investidores de longo prazo.`,
    
    'BDRs': `**Análise de ${ticker}**\n\n${ticker} está cotado a R$ ${price} com variação de ${change}% na sessão. Como BDR, o ativo oferece exposição ao mercado internacional com a conveniência de negociação na B3.\n\n**Empresa**: A companhia é líder em seu segmento globalmente, com forte geração de receita recorrente e margens elevadas. Os resultados trimestrais têm superado consistentemente as estimativas dos analistas.\n\n**Fatores de Risco**: A variação cambial (USD/BRL) impacta diretamente o retorno do investidor brasileiro. Além disso, a política monetária americana e tensões geopolíticas podem afetar o desempenho das ações.\n\n**Recomendação**: Para investidores que buscam diversificação internacional e exposição a empresas líderes globais, ${ticker} representa uma opção sólida. Rating: **COMPRA MODERADA**.`,
    
    'Macro Strategy': `**Análise Macroeconômica - Estratégia de Investimentos**\n\nO cenário macroeconômico brasileiro apresenta sinais mistos. A taxa Selic permanece elevada visando controlar a inflação, enquanto o fiscal continua sendo um ponto de atenção para o mercado.\n\n**Juros e Inflação**: A curva de juros precifica manutenção da Selic no curto prazo, com possíveis cortes apenas no segundo semestre. O IPCA tem mostrado desaceleração, mas ainda acima da meta.\n\n**Alocação Recomendada**: 1) Renda Fixa: 50-60% em títulos atrelados ao CDI e IPCA+; 2) Renda Variável: 25-35% com foco em empresas de qualidade, boas pagadoras de dividendos; 3) Internacional: 10-15% via BDRs ou ETFs globais para diversificação.\n\n**Perspectivas**: O ambiente de juros altos favorece a renda fixa, mas a bolsa brasileira segue descontada em múltiplos históricos. Posicionamento defensivo é recomendado até maior clareza no cenário fiscal.`,
    
    'Análise Técnica': `**Análise Técnica - ${ticker}**\n\n${ticker} (R$ ${price}, ${change}%) apresenta padrões gráficos relevantes para o curto prazo. O ativo está em região de definição de tendência.\n\n**Suportes e Resistências**: O suporte imediato está em R$ ${(parseFloat(price) * 0.95).toFixed(2)}, enquanto a resistência principal se encontra em R$ ${(parseFloat(price) * 1.08).toFixed(2)}. Rompimento desses níveis pode definir o próximo movimento direcional.\n\n**Indicadores**: O IFR (Índice de Força Relativa) está em zona neutra, sem indicar sobrecompra ou sobrevenda. As médias móveis de 21 e 50 períodos convergem, sugerindo possível definição de tendência em breve. Volume está dentro da média histórica.\n\n**Estratégia Sugerida**: Para traders, aguardar confirmação de rompimento com volume acima da média. Stop loss sugerido: 3% abaixo do suporte principal.`,
  };

  return analyses[type] || analyses['Ações'];
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

    const { type = 'list', category = 'Todos', reportId, page = 1, limit = 10 } = await req.json().catch(() => ({}));

    console.log(`Reports request: type=${type}, category=${category}, page=${page}`);

    // Listar relatórios disponíveis
    if (type === 'list') {
      const reports: any[] = [];
      const now = new Date();
      const categories = category === 'Todos' ? Object.keys(ANALYSIS_ASSETS) : [category];

      for (const cat of categories) {
        const assets = ANALYSIS_ASSETS[cat] || [];
        
        for (let i = 0; i < Math.min(assets.length, 4); i++) {
          const asset = assets[i];
          const daysAgo = i; // Stagger days
          const reportDate = new Date(now);
          reportDate.setDate(reportDate.getDate() - daysAgo);
          
          let title = '';
          let description = '';
          
          if (cat === 'Macro Strategy') {
            title = `Estratégia Macro | ${reportDate.toLocaleDateString('pt-BR')}`;
            description = 'Análise macroeconômica completa com perspectivas para juros, câmbio e inflação. Recomendações de alocação estratégica.';
          } else if (cat === 'Análise Técnica') {
            title = `Radar Diário de Ações | ${reportDate.toLocaleDateString('pt-BR')}`;
            description = 'Confira os principais acontecimentos e análises técnicas das empresas sob nossa cobertura.';
          } else if (cat === 'FIIs') {
            title = i === 0 
              ? `${asset}: Um dos maiores descontos do setor`
              : `Radar Diário de Fundos Imobiliários | ${reportDate.toLocaleDateString('pt-BR')}`;
            description = i === 0
              ? `A performance recente do ${asset} evidencia um descolamento relevante em relação aos seus pares do mercado de FI-Infra.`
              : 'Confira os principais fatos relevantes e comunicados emitidos pelos fundos.';
          } else if (cat === 'BDRs') {
            title = `Radar Diário de Ações US | ${reportDate.toLocaleDateString('pt-BR')}`;
            description = 'Confira os acontecimentos mais relevantes das principais empresas globais.';
          } else {
            title = i === 0 
              ? `${asset}: Análise Completa e Recomendação`
              : `Radar Diário de Ações | ${reportDate.toLocaleDateString('pt-BR')}`;
            description = i === 0
              ? `Análise detalhada de ${asset} com métricas fundamentalistas, perspectivas e recomendação de investimento.`
              : 'Confira os principais acontecimentos das empresas sob nossa cobertura.';
          }

          reports.push({
            id: `${cat.toLowerCase().replace(/\s+/g, '-')}-${asset.toLowerCase()}-${reportDate.getTime()}`,
            title,
            description,
            category: cat,
            ticker: asset,
            date: reportDate.toISOString(),
            publishedAt: `${reportDate.toLocaleDateString('pt-BR')} às ${reportDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
          });
        }
      }

      // Ordenar por data (mais recentes primeiro)
      reports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Paginação
      const startIndex = (page - 1) * limit;
      const paginatedReports = reports.slice(startIndex, startIndex + limit);
      const totalPages = Math.ceil(reports.length / limit);

      return new Response(
        JSON.stringify({ 
          reports: paginatedReports, 
          totalReports: reports.length,
          currentPage: page,
          totalPages,
          categories: REPORT_CATEGORIES,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Detalhes de um relatório específico
    if (type === 'detail' && reportId) {
      // Extrair ticker do reportId
      const parts = reportId.split('-');
      const ticker = parts.length > 1 ? parts[parts.length - 2].toUpperCase() : 'PETR4';
      const categoryFromId = parts.slice(0, -2).join('-');
      
      // Determinar categoria real
      let reportCategory = 'Ações';
      if (categoryFromId.includes('fii')) reportCategory = 'FIIs';
      else if (categoryFromId.includes('bdr')) reportCategory = 'BDRs';
      else if (categoryFromId.includes('macro')) reportCategory = 'Macro Strategy';
      else if (categoryFromId.includes('tecnica') || categoryFromId.includes('analise')) reportCategory = 'Análise Técnica';

      console.log(`Fetching report detail for ticker: ${ticker}, category: ${reportCategory}`);

      // Buscar dados do ativo via BRAPI
      let stockData = null;
      if (ticker && ticker !== 'MACRO' && ticker !== 'IBOV') {
        try {
          const url = `https://brapi.dev/api/quote/${ticker}?token=${BRAPI_TOKEN}&fundamental=true`;
          const response = await fetch(url);
          const data = await response.json();
          stockData = data.results?.[0] || null;
          console.log(`Fetched data for ${ticker}: price=${stockData?.regularMarketPrice}`);
        } catch (error) {
          console.error(`Error fetching stock data for ${ticker}:`, error);
        }
      }

      // Gerar análise com IA ou fallback
      const analysisContent = await generateAnalysis(ticker, stockData, reportCategory);
      
      const now = new Date();
      
      // Construir título baseado na categoria
      let title = '';
      if (reportCategory === 'Macro Strategy') {
        title = `Estratégia Macro Semanal - ${now.toLocaleDateString('pt-BR')}`;
      } else if (reportCategory === 'Análise Técnica') {
        title = `Radar Diário de Ações - ${now.toLocaleDateString('pt-BR')}`;
      } else if (reportCategory === 'FIIs') {
        title = `${ticker}: Análise de Fundos Imobiliários`;
      } else if (reportCategory === 'BDRs') {
        title = `${ticker}: Análise de BDR`;
      } else {
        title = `${ticker}: Análise Completa`;
      }

      // Determinar recomendação
      let recommendation = 'NEUTRO';
      if (stockData) {
        if (stockData.regularMarketChangePercent > 2) recommendation = 'COMPRA FORTE';
        else if (stockData.regularMarketChangePercent > 0) recommendation = 'COMPRA';
        else if (stockData.regularMarketChangePercent > -2) recommendation = 'NEUTRO';
        else recommendation = 'CAUTELA';
      }

      const report = {
        id: reportId,
        title,
        category: reportCategory,
        ticker,
        publishedAt: `${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
        analysts: [
          { name: 'Lucas Marquiori', avatarUrl: 'https://i.pravatar.cc/100?img=33' },
          { name: 'Fernanda Recchia', avatarUrl: 'https://i.pravatar.cc/100?img=26' },
          { name: 'Marcel Zambello', avatarUrl: 'https://i.pravatar.cc/100?img=60' },
        ],
        content: analysisContent,
        stockData: stockData ? {
          ticker: stockData.symbol,
          name: stockData.longName || stockData.shortName,
          regularMarketPrice: stockData.regularMarketPrice,
          regularMarketChangePercent: stockData.regularMarketChangePercent,
          regularMarketChange: stockData.regularMarketChange,
          logoUrl: stockData.logourl,
          priceEarnings: stockData.priceEarnings,
          priceToBook: stockData.priceToBook,
          dividendYield: stockData.dividendYield ? stockData.dividendYield * 100 : null,
          marketCap: stockData.marketCap,
          fiftyTwoWeekHigh: stockData.fiftyTwoWeekHigh,
          fiftyTwoWeekLow: stockData.fiftyTwoWeekLow,
          sector: stockData.summaryProfile?.sector || 'N/A',
        } : null,
        recommendation,
        targetPrice: stockData?.regularMarketPrice ? (stockData.regularMarketPrice * 1.15).toFixed(2) : null,
        lastUpdate: now.toISOString(),
      };

      return new Response(
        JSON.stringify(report),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid request type' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in reports function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
