import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PLUGGY_API_URL = 'https://api.pluggy.ai';

// Get access token from Pluggy
async function getAccessToken(): Promise<string> {
  const clientId = Deno.env.get('PLUGGY_CLIENT_ID');
  const clientSecret = Deno.env.get('PLUGGY_CLIENT_SECRET');

  if (!clientId || !clientSecret) {
    throw new Error('Pluggy credentials not configured');
  }

  const response = await fetch(`${PLUGGY_API_URL}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId, clientSecret }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to authenticate with Pluggy: ${error}`);
  }

  const data = await response.json();
  return data.apiKey;
}

// Get investments for an item from Pluggy
async function getPluggyInvestments(accessToken: string, itemId: string): Promise<any[]> {
  const response = await fetch(`${PLUGGY_API_URL}/investments?itemId=${itemId}`, {
    method: 'GET',
    headers: { 'X-API-KEY': accessToken },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to get investments:', error);
    return [];
  }

  const data = await response.json();
  return data.results || [];
}

// Map Pluggy investment type to Kadig asset type
function mapInvestmentType(pluggyType: string): string {
  const typeMap: Record<string, string> = {
    'MUTUAL_FUND': 'Fundos',
    'SECURITY': 'Ações',
    'EQUITY': 'Ações',
    'FIXED_INCOME': 'Renda Fixa',
    'ETF': 'ETF',
    'COE': 'COE',
    'PENSION': 'Previdência',
    'CRYPTOCURRENCY': 'Cripto',
    'REAL_ESTATE': 'FIIs',
    'OTHER': 'Outros',
  };
  return typeMap[pluggyType] || 'Outros';
}

// Extract ticker from investment data
function extractTicker(investment: any): string | null {
  if (investment.code) return investment.code;
  if (investment.isin) return investment.isin;
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create Supabase client with user's auth
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { action, connectionId, portfolioId, itemId } = await req.json();
    console.log('Sync action:', action, { connectionId, portfolioId, itemId });

    // Get Pluggy access token
    const accessToken = await getAccessToken();

    if (action === 'sync-connection') {
      // Sync a single connection's investments
      if (!connectionId || !portfolioId) {
        throw new Error('connectionId and portfolioId are required');
      }

      // Get connection details
      const { data: connection, error: connError } = await supabase
        .from('pluggy_connections')
        .select('*')
        .eq('id', connectionId)
        .eq('user_id', user.id)
        .single();

      if (connError || !connection) {
        throw new Error('Connection not found');
      }

      // Fetch investments from Pluggy
      const pluggyInvestments = await getPluggyInvestments(accessToken, connection.item_id);
      console.log(`Found ${pluggyInvestments.length} investments from Pluggy`);

      // Get existing investments from this connection
      const { data: existingInvestments } = await supabase
        .from('investments')
        .select('id, pluggy_investment_id')
        .eq('user_id', user.id)
        .eq('portfolio_id', portfolioId)
        .eq('source', 'pluggy')
        .not('pluggy_investment_id', 'is', null);

      const existingMap = new Map(
        (existingInvestments || []).map(inv => [inv.pluggy_investment_id, inv.id])
      );

      const syncedIds: string[] = [];
      const results = { created: 0, updated: 0, deleted: 0 };

      // Process each Pluggy investment
      for (const inv of pluggyInvestments) {
        const investmentData = {
          user_id: user.id,
          portfolio_id: portfolioId,
          pluggy_investment_id: inv.id,
          source: 'pluggy',
          asset_name: inv.name || 'Investimento',
          asset_type: mapInvestmentType(inv.type),
          ticker: extractTicker(inv),
          quantity: inv.quantity || 1,
          purchase_price: inv.amount || inv.amountOriginal || 0,
          current_price: inv.balance ? (inv.balance / (inv.quantity || 1)) : (inv.amount || 0),
          current_value: inv.balance || inv.amount || 0,
          total_invested: inv.amountOriginal || inv.amount || 0,
          gain_percent: inv.amountProfit ? ((inv.amountProfit / (inv.amountOriginal || 1)) * 100) : 0,
          maturity_date: inv.dueDate ? inv.dueDate.split('T')[0] : null,
        };

        syncedIds.push(inv.id);

        if (existingMap.has(inv.id)) {
          // Update existing investment
          const existingId = existingMap.get(inv.id);
          await supabase
            .from('investments')
            .update({
              asset_name: investmentData.asset_name,
              asset_type: investmentData.asset_type,
              ticker: investmentData.ticker,
              quantity: investmentData.quantity,
              current_price: investmentData.current_price,
              current_value: investmentData.current_value,
              gain_percent: investmentData.gain_percent,
              maturity_date: investmentData.maturity_date,
            })
            .eq('id', existingId);
          results.updated++;
        } else {
          // Create new investment
          await supabase.from('investments').insert(investmentData);
          results.created++;
        }
      }

      // Delete investments that no longer exist in Pluggy
      const idsToDelete = Array.from(existingMap.entries())
        .filter(([pluggyId]) => !syncedIds.includes(pluggyId))
        .map(([, id]) => id);

      if (idsToDelete.length > 0) {
        await supabase
          .from('investments')
          .delete()
          .in('id', idsToDelete);
        results.deleted = idsToDelete.length;
      }

      // Update portfolio totals
      const { data: portfolioInvestments } = await supabase
        .from('investments')
        .select('current_value, total_invested, gain_percent')
        .eq('portfolio_id', portfolioId);

      if (portfolioInvestments) {
        const totalValue = portfolioInvestments.reduce((sum, inv) => sum + Number(inv.current_value || 0), 0);
        const totalInvested = portfolioInvestments.reduce((sum, inv) => sum + Number(inv.total_invested || 0), 0);
        const totalGain = totalValue - totalInvested;

        await supabase
          .from('portfolios')
          .update({
            total_value: totalValue,
            total_gain: totalGain,
          })
          .eq('id', portfolioId);
      }

      // Update connection last_updated_at
      await supabase
        .from('pluggy_connections')
        .update({ last_updated_at: new Date().toISOString() })
        .eq('id', connectionId);

      return new Response(
        JSON.stringify({ 
          success: true, 
          results,
          message: `Sincronizado: ${results.created} criados, ${results.updated} atualizados, ${results.deleted} removidos`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'sync-all') {
      // Sync all connections for the user
      const { data: connections } = await supabase
        .from('pluggy_connections')
        .select('*')
        .eq('user_id', user.id);

      if (!connections || connections.length === 0) {
        return new Response(
          JSON.stringify({ success: true, message: 'Nenhuma conexão encontrada' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get or create default portfolio
      let { data: portfolio } = await supabase
        .from('portfolios')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (!portfolio) {
        const { data: newPortfolio, error: createError } = await supabase
          .from('portfolios')
          .insert({ user_id: user.id, name: 'Open Finance' })
          .select('id')
          .single();

        if (createError) throw createError;
        portfolio = newPortfolio;
      }

      const totalResults = { created: 0, updated: 0, deleted: 0 };

      for (const connection of connections) {
        const pluggyInvestments = await getPluggyInvestments(accessToken, connection.item_id);
        
        // Get existing investments
        const { data: existingInvestments } = await supabase
          .from('investments')
          .select('id, pluggy_investment_id')
          .eq('user_id', user.id)
          .eq('source', 'pluggy')
          .not('pluggy_investment_id', 'is', null);

        const existingMap = new Map(
          (existingInvestments || []).map(inv => [inv.pluggy_investment_id, inv.id])
        );

        const syncedIds: string[] = [];

        for (const inv of pluggyInvestments) {
          const investmentData = {
            user_id: user.id,
            portfolio_id: portfolio.id,
            pluggy_investment_id: inv.id,
            source: 'pluggy',
            asset_name: inv.name || 'Investimento',
            asset_type: mapInvestmentType(inv.type),
            ticker: extractTicker(inv),
            quantity: inv.quantity || 1,
            purchase_price: inv.amount || inv.amountOriginal || 0,
            current_price: inv.balance ? (inv.balance / (inv.quantity || 1)) : (inv.amount || 0),
            current_value: inv.balance || inv.amount || 0,
            total_invested: inv.amountOriginal || inv.amount || 0,
            gain_percent: inv.amountProfit ? ((inv.amountProfit / (inv.amountOriginal || 1)) * 100) : 0,
            maturity_date: inv.dueDate ? inv.dueDate.split('T')[0] : null,
          };

          syncedIds.push(inv.id);

          if (existingMap.has(inv.id)) {
            const existingId = existingMap.get(inv.id);
            await supabase
              .from('investments')
              .update({
                asset_name: investmentData.asset_name,
                asset_type: investmentData.asset_type,
                ticker: investmentData.ticker,
                quantity: investmentData.quantity,
                current_price: investmentData.current_price,
                current_value: investmentData.current_value,
                gain_percent: investmentData.gain_percent,
                maturity_date: investmentData.maturity_date,
              })
              .eq('id', existingId);
            totalResults.updated++;
          } else {
            await supabase.from('investments').insert(investmentData);
            totalResults.created++;
          }
        }

        // Update connection status
        await supabase
          .from('pluggy_connections')
          .update({ 
            status: 'UPDATED',
            last_updated_at: new Date().toISOString() 
          })
          .eq('id', connection.id);
      }

      // Update portfolio totals
      const { data: allInvestments } = await supabase
        .from('investments')
        .select('current_value, total_invested')
        .eq('portfolio_id', portfolio.id);

      if (allInvestments) {
        const totalValue = allInvestments.reduce((sum, inv) => sum + Number(inv.current_value || 0), 0);
        const totalInvested = allInvestments.reduce((sum, inv) => sum + Number(inv.total_invested || 0), 0);

        await supabase
          .from('portfolios')
          .update({
            total_value: totalValue,
            total_gain: totalValue - totalInvested,
          })
          .eq('id', portfolio.id);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          results: totalResults,
          portfolioId: portfolio.id,
          message: `Todas as conexões sincronizadas: ${totalResults.created} criados, ${totalResults.updated} atualizados`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error(`Unknown action: ${action}`);

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Sync error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
