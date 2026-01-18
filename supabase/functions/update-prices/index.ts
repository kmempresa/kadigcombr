import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cache para evitar chamadas duplicadas
const priceCache: { [key: string]: { price: number; change: number; timestamp: number } } = {};
const CACHE_TTL = 60000; // 1 minuto

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const BRAPI_TOKEN = Deno.env.get('BRAPI_TOKEN');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { userId, forceUpdate = false } = await req.json().catch(() => ({}));
    
    console.log(`Starting price update for user: ${userId || 'all'}`);

    // Buscar todos os investimentos (do usuário ou todos)
    let investmentsQuery = supabase.from('investments').select('*');
    if (userId) {
      investmentsQuery = investmentsQuery.eq('user_id', userId);
    }
    
    const { data: investments, error: invError } = await investmentsQuery;
    
    if (invError) throw invError;
    if (!investments || investments.length === 0) {
      return new Response(
        JSON.stringify({ success: true, updated: 0, message: 'No investments to update' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${investments.length} investments to update`);

    // Agrupar investimentos por tipo
    const cryptoInvestments = investments.filter(inv => inv.asset_type === 'Criptoativos');
    const currencyInvestments = investments.filter(inv => inv.asset_type === 'Moedas');
    const stockInvestments = investments.filter(inv => 
      ['Ações, Stocks e ETF', 'BDRs', 'FIIs e REITs', 'Fundos'].includes(inv.asset_type) && inv.ticker
    );

    let updatedCount = 0;
    const errors: string[] = [];
    const now = Date.now();

    // ============= CRYPTO PRICES (CoinGecko) =============
    if (cryptoInvestments.length > 0) {
      console.log(`Updating ${cryptoInvestments.length} crypto investments`);
      
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
        'BCASH': 'bitcoin-cash',
        'XRP (RIPPLE)': 'ripple',
        'XRP': 'ripple',
        'RIPPLE': 'ripple',
      };

      try {
        const cryptoIds = 'bitcoin,litecoin,bitcoin-cash,ripple,ethereum,solana,cardano,polkadot,dogecoin,shiba-inu,binancecoin,avalanche-2,tron,chainlink,uniswap';
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoIds}&vs_currencies=brl&include_24hr_change=true`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        for (const inv of cryptoInvestments) {
          const cryptoId = cryptoMap[inv.asset_name.toUpperCase()];
          if (cryptoId && data[cryptoId]) {
            const newPrice = data[cryptoId].brl;
            const newValue = (inv.quantity || 1) * newPrice;
            const gainPercent = inv.total_invested > 0 
              ? ((newValue - inv.total_invested) / inv.total_invested) * 100 
              : 0;
            
            await supabase.from('investments').update({
              current_price: newPrice,
              current_value: newValue,
              gain_percent: gainPercent,
              updated_at: new Date().toISOString(),
            }).eq('id', inv.id);
            
            updatedCount++;
          }
        }
      } catch (e) {
        errors.push(`Crypto error: ${e}`);
      }
    }

    // ============= CURRENCY PRICES (AwesomeAPI) =============
    if (currencyInvestments.length > 0) {
      console.log(`Updating ${currencyInvestments.length} currency investments`);
      
      try {
        const currencies = 'USD-BRL,EUR-BRL,GBP-BRL,JPY-BRL,CHF-BRL,CAD-BRL,AUD-BRL,ARS-BRL,CNY-BRL,MXN-BRL';
        const url = `https://economia.awesomeapi.com.br/json/last/${currencies}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        const currencyPrices: { [key: string]: { price: number; change: number } } = {};
        Object.entries(data).forEach(([key, values]: [string, any]) => {
          currencyPrices[key] = {
            price: parseFloat(values.bid) || 0,
            change: parseFloat(values.pctChange) || 0,
          };
        });

        for (const inv of currencyInvestments) {
          // Tentar encontrar o par de moedas correto
          let currencyKey = '';
          if (inv.asset_name.includes('USD') || inv.asset_name.includes('DÓLAR')) currencyKey = 'USDBRL';
          else if (inv.asset_name.includes('EUR') || inv.asset_name.includes('EURO')) currencyKey = 'EURBRL';
          else if (inv.asset_name.includes('GBP') || inv.asset_name.includes('LIBRA')) currencyKey = 'GBPBRL';
          else if (inv.asset_name.includes('JPY') || inv.asset_name.includes('IENE')) currencyKey = 'JPYBRL';
          else if (inv.asset_name.includes('CHF') || inv.asset_name.includes('FRANCO')) currencyKey = 'CHFBRL';
          else if (inv.asset_name.includes('CAD')) currencyKey = 'CADBRL';
          else if (inv.asset_name.includes('AUD')) currencyKey = 'AUDBRL';
          else if (inv.asset_name.includes('ARS') || inv.asset_name.includes('PESO ARG')) currencyKey = 'ARSBRL';
          else if (inv.asset_name.includes('CNY') || inv.asset_name.includes('YUAN')) currencyKey = 'CNYBRL';
          
          if (currencyKey && currencyPrices[currencyKey]) {
            const newPrice = currencyPrices[currencyKey].price;
            const newValue = (inv.quantity || 1) * newPrice;
            const gainPercent = inv.total_invested > 0 
              ? ((newValue - inv.total_invested) / inv.total_invested) * 100 
              : 0;
            
            await supabase.from('investments').update({
              current_price: newPrice,
              current_value: newValue,
              gain_percent: gainPercent,
              updated_at: new Date().toISOString(),
            }).eq('id', inv.id);
            
            updatedCount++;
          }
        }
      } catch (e) {
        errors.push(`Currency error: ${e}`);
      }
    }

    // ============= STOCK PRICES (BRAPI) =============
    if (stockInvestments.length > 0 && BRAPI_TOKEN) {
      console.log(`Updating ${stockInvestments.length} stock investments`);
      
      // Extrair tickers únicos
      const uniqueTickers = [...new Set(stockInvestments.map(inv => inv.ticker).filter(Boolean))];
      
      // Dividir em lotes de 20 para não sobrecarregar a API
      const batchSize = 20;
      const batches = [];
      for (let i = 0; i < uniqueTickers.length; i += batchSize) {
        batches.push(uniqueTickers.slice(i, i + batchSize));
      }

      const stockPrices: { [key: string]: { price: number; change: number } } = {};

      for (const batch of batches) {
        try {
          const tickers = batch.join(',');
          const url = `https://brapi.dev/api/quote/${tickers}?token=${BRAPI_TOKEN}`;
          
          const response = await fetch(url);
          const data = await response.json();
          
          if (data.results) {
            data.results.forEach((stock: any) => {
              if (stock.regularMarketPrice > 0) {
                stockPrices[stock.symbol] = {
                  price: stock.regularMarketPrice,
                  change: stock.regularMarketChangePercent || 0,
                };
              }
            });
          }
        } catch (e) {
          errors.push(`Stock batch error: ${e}`);
        }
      }

      // Atualizar investimentos com os preços obtidos
      for (const inv of stockInvestments) {
        if (inv.ticker && stockPrices[inv.ticker]) {
          const newPrice = stockPrices[inv.ticker].price;
          const newValue = (inv.quantity || 1) * newPrice;
          const gainPercent = inv.total_invested > 0 
            ? ((newValue - inv.total_invested) / inv.total_invested) * 100 
            : 0;
          
          await supabase.from('investments').update({
            current_price: newPrice,
            current_value: newValue,
            gain_percent: gainPercent,
            updated_at: new Date().toISOString(),
          }).eq('id', inv.id);
          
          updatedCount++;
        }
      }
    }

    // ============= ATUALIZAR TOTAIS DAS CARTEIRAS =============
    console.log('Updating portfolio totals...');
    
    // Buscar investimentos atualizados agrupados por portfolio
    const { data: updatedInvestments } = await supabase
      .from('investments')
      .select('portfolio_id, current_value, total_invested, user_id');
    
    if (updatedInvestments) {
      const portfolioTotals: { [key: string]: { value: number; invested: number; userId: string } } = {};
      
      updatedInvestments.forEach(inv => {
        if (!portfolioTotals[inv.portfolio_id]) {
          portfolioTotals[inv.portfolio_id] = { value: 0, invested: 0, userId: inv.user_id };
        }
        portfolioTotals[inv.portfolio_id].value += Number(inv.current_value) || 0;
        portfolioTotals[inv.portfolio_id].invested += Number(inv.total_invested) || 0;
      });

      for (const [portfolioId, totals] of Object.entries(portfolioTotals)) {
        const gain = totals.value - totals.invested;
        const cdiPercent = totals.invested > 0 ? (gain / totals.invested) * 100 : 0;
        
        await supabase.from('portfolios').update({
          total_value: totals.value,
          total_gain: gain,
          cdi_percent: cdiPercent,
          updated_at: new Date().toISOString(),
        }).eq('id', portfolioId);
      }
    }

    console.log(`Price update complete: ${updatedCount} investments updated`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        updated: updatedCount,
        total: investments.length,
        errors: errors.length > 0 ? errors : undefined,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Update prices error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
