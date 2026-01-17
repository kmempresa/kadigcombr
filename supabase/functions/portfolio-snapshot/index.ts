import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Use service role to access all users' data
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting portfolio snapshot job...');

    // Fetch economic indicators for CDI/IPCA
    let cdiAccumulated = 0;
    let ipcaAccumulated = 0;
    
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
      
      const [cdiResponse, ipcaResponse] = await Promise.all([
        fetch(`https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados?formato=json&dataInicial=${startDate}&dataFinal=${endDate}`),
        fetch(`https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados?formato=json&dataInicial=${startDate}&dataFinal=${endDate}`),
      ]);
      
      const cdiData = await cdiResponse.json();
      const ipcaData = await ipcaResponse.json();
      
      // Calculate accumulated CDI (last 252 trading days ≈ 1 year)
      if (cdiData.length > 0) {
        const last252Days = cdiData.slice(-252);
        cdiAccumulated = last252Days.reduce((acc: number, item: any) => {
          return acc * (1 + parseFloat(item.valor) / 100);
        }, 1);
        cdiAccumulated = (cdiAccumulated - 1) * 100;
      }
      
      // Calculate accumulated IPCA (last 12 months)
      if (ipcaData.length > 0) {
        const last12Months = ipcaData.slice(-12);
        ipcaAccumulated = last12Months.reduce((acc: number, item: any) => {
          return acc * (1 + parseFloat(item.valor) / 100);
        }, 1);
        ipcaAccumulated = (ipcaAccumulated - 1) * 100;
      }
      
      console.log(`Economic indicators: CDI=${cdiAccumulated.toFixed(2)}%, IPCA=${ipcaAccumulated.toFixed(2)}%`);
    } catch (error) {
      console.error('Error fetching economic indicators:', error);
    }

    // Get all portfolios with their investments
    const { data: portfolios, error: portfoliosError } = await supabase
      .from('portfolios')
      .select('id, user_id, total_value, total_gain');

    if (portfoliosError) {
      throw portfoliosError;
    }

    console.log(`Found ${portfolios?.length || 0} portfolios to snapshot`);

    const today = new Date().toISOString().split('T')[0];
    let successCount = 0;
    let errorCount = 0;

    for (const portfolio of portfolios || []) {
      try {
        // Get investments for this portfolio
        const { data: investments } = await supabase
          .from('investments')
          .select('current_value, total_invested')
          .eq('portfolio_id', portfolio.id);

        const totalValue = investments?.reduce((sum, inv) => sum + (Number(inv.current_value) || 0), 0) || 0;
        const totalInvested = investments?.reduce((sum, inv) => sum + (Number(inv.total_invested) || 0), 0) || 0;
        const totalGain = totalValue - totalInvested;
        const gainPercent = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

        // Upsert snapshot (update if exists for today, insert if not)
        const { error: upsertError } = await supabase
          .from('portfolio_history')
          .upsert({
            user_id: portfolio.user_id,
            portfolio_id: portfolio.id,
            snapshot_date: today,
            total_value: totalValue,
            total_invested: totalInvested,
            total_gain: totalGain,
            gain_percent: gainPercent,
            cdi_accumulated: cdiAccumulated,
            ipca_accumulated: ipcaAccumulated,
          }, {
            onConflict: 'portfolio_id,snapshot_date'
          });

        if (upsertError) {
          console.error(`Error upserting snapshot for portfolio ${portfolio.id}:`, upsertError);
          errorCount++;
        } else {
          successCount++;
        }

        // Also update the portfolio totals
        await supabase
          .from('portfolios')
          .update({
            total_value: totalValue,
            total_gain: totalGain,
            updated_at: new Date().toISOString(),
          })
          .eq('id', portfolio.id);

      } catch (error) {
        console.error(`Error processing portfolio ${portfolio.id}:`, error);
        errorCount++;
      }
    }

    console.log(`Snapshot complete: ${successCount} success, ${errorCount} errors`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        date: today,
        portfoliosProcessed: successCount,
        errors: errorCount,
        cdiAccumulated,
        ipcaAccumulated,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Portfolio snapshot error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
