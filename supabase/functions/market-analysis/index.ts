import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AssetAnalysis {
  ticker: string;
  assetType: string;
  currentPrice: number;
  change24h: number;
  change7d?: number;
  change30d?: number;
  change1y?: number;
  volatility: number; // Estimated monthly volatility %
  expectedReturn: number; // Expected monthly return %
  recommendation?: string;
  targetPrice?: number;
  analystRating?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const BRAPI_TOKEN = Deno.env.get('BRAPI_TOKEN');
    const { assets, assetType } = await req.json();
    
    console.log(`Fetching market analysis for ${assets?.length || 0} assets of type ${assetType}`);
    
    const analyses: AssetAnalysis[] = [];

    // ============= STOCKS / FIIS / BDRS =============
    if (assetType === 'stocks' && assets?.length > 0 && BRAPI_TOKEN) {
      const tickers = assets.slice(0, 20).join(','); // Limit to 20 at a time
      
      try {
        const url = `https://brapi.dev/api/quote/${tickers}?token=${BRAPI_TOKEN}&range=1mo&interval=1d`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.results) {
          for (const stock of data.results) {
            // Calculate volatility from historical data if available
            let volatility = 5; // Default 5% monthly volatility
            let change30d = 0;
            
            if (stock.historicalDataPrice && stock.historicalDataPrice.length > 5) {
              const prices = stock.historicalDataPrice.map((d: any) => d.close);
              const returns: number[] = [];
              for (let i = 1; i < prices.length; i++) {
                returns.push((prices[i] - prices[i-1]) / prices[i-1] * 100);
              }
              
              // Standard deviation of daily returns * sqrt(21) for monthly
              const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
              const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
              volatility = Math.sqrt(variance) * Math.sqrt(21);
              
              // Calculate 30-day change
              if (prices.length >= 21) {
                change30d = ((prices[prices.length - 1] - prices[0]) / prices[0]) * 100;
              }
            }
            
            // Use actual market change percent for expected return estimate
            const dailyChange = stock.regularMarketChangePercent || 0;
            
            // Project monthly return based on recent momentum + mean reversion
            // If positive momentum, expect ~70% continuation, if negative ~50%
            let expectedReturn: number;
            if (dailyChange > 0) {
              expectedReturn = dailyChange * 0.7 * 5; // ~5 days of continuation
            } else {
              expectedReturn = dailyChange * 0.5 * 5; // Mean reversion
            }
            
            // Adjust based on 30-day trend
            if (change30d !== 0) {
              expectedReturn = change30d * 0.3; // 30% of last month's trend continues
            }

            analyses.push({
              ticker: stock.symbol,
              assetType: 'stock',
              currentPrice: stock.regularMarketPrice || 0,
              change24h: dailyChange,
              change30d,
              volatility: Math.max(2, Math.min(30, volatility)), // Clamp between 2-30%
              expectedReturn: Math.max(-15, Math.min(15, expectedReturn)), // Clamp between -15% and 15%
              targetPrice: stock.regularMarketPrice * (1 + expectedReturn / 100),
            });
          }
        }
      } catch (e) {
        console.error('Error fetching stock analysis:', e);
      }
    }

    // ============= CRYPTOCURRENCIES =============
    if (assetType === 'crypto' && assets?.length > 0) {
      const cryptoMap: { [key: string]: string } = {
        'BITCOIN': 'bitcoin',
        'ETHEREUM': 'ethereum',
        'SOLANA': 'solana',
        'CARDANO': 'cardano',
        'POLKADOT': 'polkadot',
        'DOGECOIN': 'dogecoin',
        'SHIBA INU': 'shiba-inu',
        'BNB': 'binancecoin',
        'AVALANCHE': 'avalanche-2',
        'TRON': 'tron',
        'CHAINLINK': 'chainlink',
        'UNISWAP': 'uniswap',
        'LITECOIN': 'litecoin',
        'XRP': 'ripple',
        'RIPPLE': 'ripple',
      };

      try {
        // Get detailed crypto data with 24h and 7d changes
        const cryptoIds = assets.map((a: string) => cryptoMap[a.toUpperCase()]).filter(Boolean).join(',');
        if (cryptoIds) {
          const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=brl&ids=${cryptoIds}&order=market_cap_desc&per_page=100&page=1&sparkline=true&price_change_percentage=24h,7d,30d`;
          const response = await fetch(url);
          const data = await response.json();
          
          for (const coin of data) {
            const change24h = coin.price_change_percentage_24h || 0;
            const change7d = coin.price_change_percentage_7d_in_currency || 0;
            const change30d = coin.price_change_percentage_30d_in_currency || 0;
            
            // Calculate volatility from sparkline if available
            let volatility = 15; // Default high volatility for crypto
            if (coin.sparkline_in_7d?.price?.length > 10) {
              const prices = coin.sparkline_in_7d.price;
              const returns: number[] = [];
              for (let i = 1; i < prices.length; i++) {
                returns.push((prices[i] - prices[i-1]) / prices[i-1] * 100);
              }
              const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
              const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
              // Hourly data -> scale to monthly (assuming 168 hours/week * 4 weeks)
              volatility = Math.sqrt(variance) * Math.sqrt(168 * 4);
            }
            
            // Calculate expected monthly return based on momentum
            let expectedReturn = 0;
            if (change30d !== 0) {
              expectedReturn = change30d * 0.4; // 40% momentum continuation for crypto
            } else if (change7d !== 0) {
              expectedReturn = change7d * 0.3 * 4; // Scale weekly to monthly
            }

            // Find original asset name
            const assetName = Object.entries(cryptoMap).find(([_, v]) => v === coin.id)?.[0] || coin.symbol.toUpperCase();

            analyses.push({
              ticker: assetName,
              assetType: 'crypto',
              currentPrice: coin.current_price || 0,
              change24h,
              change7d,
              change30d,
              volatility: Math.max(5, Math.min(50, volatility)), // Crypto can be very volatile
              expectedReturn: Math.max(-30, Math.min(30, expectedReturn)),
            });
          }
        }
      } catch (e) {
        console.error('Error fetching crypto analysis:', e);
      }
    }

    // ============= CURRENCIES =============
    if (assetType === 'currency') {
      try {
        const currencies = 'USD-BRL,EUR-BRL,GBP-BRL,JPY-BRL,CHF-BRL,CAD-BRL,AUD-BRL,CNY-BRL';
        const url = `https://economia.awesomeapi.com.br/json/daily/${currencies}/30`;
        const response = await fetch(url);
        const data = await response.json();
        
        // Group by currency pair
        const currencyData: { [key: string]: any[] } = {};
        if (Array.isArray(data)) {
          for (const item of data) {
            const code = item.code + item.codein;
            if (!currencyData[code]) currencyData[code] = [];
            currencyData[code].push(item);
          }
        }
        
        for (const [code, history] of Object.entries(currencyData)) {
          if (history.length < 2) continue;
          
          const latest = history[0];
          const oldest = history[history.length - 1];
          const currentPrice = parseFloat(latest.bid);
          const change30d = ((currentPrice - parseFloat(oldest.bid)) / parseFloat(oldest.bid)) * 100;
          
          // Calculate volatility
          const prices = history.map(h => parseFloat(h.bid));
          const returns: number[] = [];
          for (let i = 1; i < prices.length; i++) {
            returns.push((prices[i] - prices[i-1]) / prices[i-1] * 100);
          }
          const mean = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
          const variance = returns.length > 0 ? returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length : 0;
          const volatility = Math.sqrt(variance) * Math.sqrt(21);
          
          analyses.push({
            ticker: code,
            assetType: 'currency',
            currentPrice,
            change24h: parseFloat(latest.pctChange) || 0,
            change30d,
            volatility: Math.max(1, Math.min(15, volatility)),
            expectedReturn: change30d * 0.2, // Lower momentum for currencies
          });
        }
      } catch (e) {
        console.error('Error fetching currency analysis:', e);
      }
    }

    // ============= ECONOMIC INDICATORS FOR FIXED INCOME =============
    if (assetType === 'fixed_income') {
      try {
        const today = new Date();
        const oneYearAgo = new Date(today);
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        
        const formatDate = (date: Date) => {
          const dd = String(date.getDate()).padStart(2, '0');
          const mm = String(date.getMonth() + 1).padStart(2, '0');
          const yyyy = date.getFullYear();
          return `${dd}/${mm}/${yyyy}`;
        };
        
        const startDate = formatDate(oneYearAgo);
        const endDate = formatDate(today);
        
        const [cdiResponse, selicResponse] = await Promise.all([
          fetch(`https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados?formato=json&dataInicial=${startDate}&dataFinal=${endDate}`),
          fetch(`https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados?formato=json&dataInicial=${startDate}&dataFinal=${endDate}`),
        ]);
        
        const cdiData = await cdiResponse.json();
        const selicData = await selicResponse.json();
        
        // Calculate monthly CDI
        let cdiMonthly = 0;
        if (cdiData.length > 21) {
          const last21Days = cdiData.slice(-21);
          cdiMonthly = last21Days.reduce((acc: number, item: any) => {
            return acc * (1 + parseFloat(item.valor) / 100);
          }, 1);
          cdiMonthly = (cdiMonthly - 1) * 100;
        }
        
        const currentSelic = selicData.length > 0 ? parseFloat(selicData[selicData.length - 1].valor) : 13.75;
        
        analyses.push({
          ticker: 'CDI',
          assetType: 'fixed_income',
          currentPrice: cdiMonthly,
          change24h: 0,
          volatility: 0.5, // Very low volatility
          expectedReturn: cdiMonthly, // Expected return = CDI rate
          analystRating: `SELIC: ${currentSelic}%`,
        });
        
        analyses.push({
          ticker: 'SELIC',
          assetType: 'fixed_income',
          currentPrice: currentSelic,
          change24h: 0,
          volatility: 0.3,
          expectedReturn: currentSelic / 12, // Monthly SELIC
        });
      } catch (e) {
        console.error('Error fetching fixed income analysis:', e);
      }
    }

    console.log(`Returning ${analyses.length} asset analyses`);

    return new Response(
      JSON.stringify({ 
        analyses,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Market analysis error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
