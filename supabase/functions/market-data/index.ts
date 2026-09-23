import { fetch } from "../_shared/brapiCache.ts";
import { serve } from "../_shared/cors.ts";
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

    const { type = 'all', symbol, category } = await req.json().catch(() => ({}));

    // Buscar indicadores econômicos reais (CDI, IPCA, SELIC) do Banco Central
    if (type === 'economic-indicators') {
      console.log('Fetching real economic indicators from BCB');
      
      try {
        // CDI - Série 4389 do BCB (Taxa CDI anualizada base 252)
        // IPCA - Série 433 do BCB (Variação mensal)
        // SELIC - Série 432 do BCB (Taxa SELIC meta)
        
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
        
        // Buscar CDI, IPCA e SELIC em paralelo
        const [cdiResponse, ipcaResponse, selicResponse] = await Promise.all([
          // CDI diário (série 12)
          fetch(`https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados?formato=json&dataInicial=${startDate}&dataFinal=${endDate}`),
          // IPCA mensal (série 433)
          fetch(`https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados?formato=json&dataInicial=${startDate}&dataFinal=${endDate}`),
          // SELIC meta (série 432)
          fetch(`https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados?formato=json&dataInicial=${startDate}&dataFinal=${endDate}`),
        ]);
        
        const cdiData = await cdiResponse.json();
        const ipcaData = await ipcaResponse.json();
        const selicData = await selicResponse.json();
        
        console.log(`CDI data points: ${cdiData.length}, IPCA: ${ipcaData.length}, SELIC: ${selicData.length}`);
        
        // Pegar os valores mais recentes
        const latestCdi = cdiData.length > 0 ? parseFloat(cdiData[cdiData.length - 1].valor) : 0;
        const latestIpca = ipcaData.length > 0 ? parseFloat(ipcaData[ipcaData.length - 1].valor) : 0;
        const latestSelic = selicData.length > 0 ? parseFloat(selicData[selicData.length - 1].valor) : 0;
        
        // Calcular CDI e IPCA acumulado dos últimos 12 meses
        let cdiAcumulado12m = 0;
        if (cdiData.length > 0) {
          // CDI é taxa diária, precisa acumular
          const last252Days = cdiData.slice(-252); // ~252 dias úteis = 1 ano
          cdiAcumulado12m = last252Days.reduce((acc: number, item: any) => {
            return acc * (1 + parseFloat(item.valor) / 100);
          }, 1);
          cdiAcumulado12m = (cdiAcumulado12m - 1) * 100;
        }
        
        let ipcaAcumulado12m = 0;
        if (ipcaData.length > 0) {
          // IPCA é mensal, pegar últimos 12 meses
          const last12Months = ipcaData.slice(-12);
          ipcaAcumulado12m = last12Months.reduce((acc: number, item: any) => {
            return acc * (1 + parseFloat(item.valor) / 100);
          }, 1);
          ipcaAcumulado12m = (ipcaAcumulado12m - 1) * 100;
        }
        
        // Preparar dados mensais para o gráfico
        const monthlyData: any[] = [];
        const monthNames = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
        
        // Agrupar CDI por mês
        const cdiByMonth: { [key: string]: number[] } = {};
        cdiData.forEach((item: any) => {
          const [day, month, year] = item.data.split('/');
          const key = `${year}-${month}`;
          if (!cdiByMonth[key]) cdiByMonth[key] = [];
          cdiByMonth[key].push(parseFloat(item.valor));
        });
        
        // Calcular CDI mensal (acumulado do mês)
        Object.entries(cdiByMonth).forEach(([key, values]) => {
          const [year, month] = key.split('-');
          const monthlyAccumulated = values.reduce((acc, val) => acc * (1 + val / 100), 1);
          const monthlyRate = (monthlyAccumulated - 1) * 100;
          
          // Encontrar IPCA do mesmo mês
          const ipcaItem = ipcaData.find((item: any) => {
            const [, m, y] = item.data.split('/');
            return m === month && y === year;
          });
          
          monthlyData.push({
            month: `${monthNames[parseInt(month) - 1]} ${year}`,
            monthKey: key,
            cdi: monthlyRate,
            ipca: ipcaItem ? parseFloat(ipcaItem.valor) : 0,
          });
        });
        
        // Ordenar por data
        monthlyData.sort((a, b) => a.monthKey.localeCompare(b.monthKey));
        
        const result = {
          current: {
            cdi: latestCdi, // Taxa CDI diária mais recente
            ipca: latestIpca, // IPCA mensal mais recente
            selic: latestSelic, // SELIC meta atual
          },
          accumulated12m: {
            cdi: cdiAcumulado12m,
            ipca: ipcaAcumulado12m,
          },
          monthly: monthlyData.slice(-12), // Últimos 12 meses
          lastUpdate: new Date().toISOString(),
        };
        
        console.log(`Returning economic indicators: CDI=${latestCdi}%, IPCA=${latestIpca}%, SELIC=${latestSelic}%`);
        
        return new Response(
          JSON.stringify(result),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('Error fetching economic indicators:', error);
        // Sem números inventados: retorna zerado com flag de erro
        return new Response(
          JSON.stringify({ 
            error: 'Failed to fetch economic indicators',
            current: { cdi: 0, ipca: 0, selic: 0 },
            accumulated12m: { cdi: 0, ipca: 0 },
            monthly: [],
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Buscar cotações de criptoativos
    if (type === 'crypto-prices') {
      console.log('Fetching crypto prices');
      
      try {
        // Usar CoinGecko API (gratuita)
        const cryptoIds = 'bitcoin,litecoin,bitcoin-cash,ripple,ethereum,solana,cardano,polkadot,dogecoin,shiba-inu,binancecoin,avalanche-2,tron,chainlink,uniswap';
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoIds}&vs_currencies=brl&include_24hr_change=true`;
        
        console.log('Requesting CoinGecko API');
        
        const response = await fetch(url);
        const data = await response.json();
        
        console.log('CoinGecko response:', JSON.stringify(data).slice(0, 200));
        
        // Mapear para nomes amigáveis
        const cryptoNameMap: { [key: string]: string } = {
          'bitcoin': 'BITCOIN',
          'litecoin': 'LITECOIN',
          'bitcoin-cash': 'BCASH',
          'ripple': 'XRP (RIPPLE)',
          'ethereum': 'ETHEREUM',
          'solana': 'SOLANA',
          'cardano': 'CARDANO',
          'polkadot': 'POLKADOT',
          'dogecoin': 'DOGECOIN',
          'shiba-inu': 'SHIBA INU',
          'binancecoin': 'BNB',
          'avalanche-2': 'AVALANCHE',
          'tron': 'TRON',
          'chainlink': 'CHAINLINK',
          'uniswap': 'UNISWAP',
        };
        
        const prices: { [key: string]: { price: number; change24h: number } } = {};
        
        Object.entries(data).forEach(([id, values]: [string, any]) => {
          const name = cryptoNameMap[id];
          if (name) {
            prices[name] = {
              price: values.brl || 0,
              change24h: values.brl_24h_change || 0,
            };
          }
        });
        
        return new Response(
          JSON.stringify({ prices, lastUpdate: new Date().toISOString() }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('Error fetching crypto prices:', error);
        return new Response(
          JSON.stringify({ prices: {}, error: 'Failed to fetch crypto prices' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Buscar cotações de moedas
    if (type === 'currency-prices') {
      console.log('Fetching currency prices');
      
      try {
        // Usar API do Banco Central ou AwesomeAPI para cotações
        const currencies = 'USD-BRL,EUR-BRL,GBP-BRL,JPY-BRL,CHF-BRL,CAD-BRL,AUD-BRL,ARS-BRL,CNY-BRL,MXN-BRL';
        const url = `https://economia.awesomeapi.com.br/json/last/${currencies}`;
        
        console.log('Requesting AwesomeAPI for currencies');
        
        let data: any = {};
        try {
          const response = await fetch(url);
          data = await response.json();
        } catch (_) { data = {}; }

        const currencyNameMap: { [key: string]: string } = {
          'USDBRL': 'DÓLAR AMERICANO (USD)',
          'EURBRL': 'EURO (EUR)',
          'GBPBRL': 'LIBRA ESTERLINA (GBP)',
          'JPYBRL': 'IENE JAPONÊS (JPY)',
          'CHFBRL': 'FRANCO SUÍÇO (CHF)',
          'CADBRL': 'DÓLAR CANADENSE (CAD)',
          'AUDBRL': 'DÓLAR AUSTRALIANO (AUD)',
          'ARSBRL': 'PESO ARGENTINO (ARS)',
          'CNYBRL': 'YUAN CHINÊS (CNY)',
          'MXNBRL': 'PESO MEXICANO (MXN)',
        };

        const prices: { [key: string]: { price: number; change24h: number } } = {};

        if (data && data.USDBRL) {
          Object.entries(data).forEach(([key, values]: [string, any]) => {
            const name = currencyNameMap[key];
            if (name) {
              prices[name] = {
                price: parseFloat(values.bid) || 0,
                change24h: parseFloat(values.pctChange) || 0,
              };
            }
          });
        } else {
          // Fallback real: BRAPI (cotações reais de câmbio)
          console.log('AwesomeAPI unavailable, using BRAPI for currencies');
          try {
            const token = Deno.env.get('BRAPI_TOKEN') ?? '';
            const bRes = await fetch(`https://brapi.dev/api/v2/currency?currency=${currencies}&token=${token}`);
            const bData = await bRes.json();
            for (const c of bData?.currency ?? []) {
              const key = `${c.fromCurrency}${c.toCurrency}`;
              const name = currencyNameMap[key];
              const price = parseFloat(c.bidPrice);
              if (name && price > 0) {
                prices[name] = { price, change24h: parseFloat(c.percentageChange) || 0 };
              }
            }
          } catch (e) {
            console.error('BRAPI currency error');
          }
        }

        if (Object.keys(prices).length === 0) {
          return new Response(
            JSON.stringify({ prices: {}, error: 'Currency prices unavailable' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        return new Response(
          JSON.stringify({ prices, lastUpdate: new Date().toISOString() }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('Error fetching currency prices:', error);
        return new Response(
          JSON.stringify({ prices: {}, error: 'Currency prices unavailable' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    // Buscar notícias do mercado usando Stock News API
    if (type === 'market-news') {
      console.log('Fetching market news from Stock News API');
      
      if (!STOCK_NEWS_API_KEY) {
        console.log('STOCK_NEWS_API_KEY not configured, using fallback');
        return new Response(
          JSON.stringify({ news: [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      try {
        // Stock News API - buscar notícias gerais do mercado (3 items que funciona)
        const newsUrl = `https://stocknewsapi.com/api/v1/category?section=general&items=3&token=${STOCK_NEWS_API_KEY}`;

        console.log(`Requesting Stock News API: ${newsUrl.replace(STOCK_NEWS_API_KEY, '***')}`);

        const newsResponse = await fetch(newsUrl);
        const rawText = await newsResponse.text();
        let newsData: any = {};
        try {
          newsData = JSON.parse(rawText);
        } catch {
          newsData = { parse_error: true, raw: rawText?.slice?.(0, 300) };
        }

        console.log(`Stock News status: ${newsResponse.status}`);
        if (newsData?.error) console.log(`Stock News error: ${newsData.error}`);
        console.log(`Stock News response: total items = ${newsData.data?.length || 0}`);

        let news = (newsData.data || []).map((item: any) => ({
          title: item.title,
          text: item.text,
          source_name: item.source_name,
          date: item.date,
          news_url: item.news_url,
          image_url: item.image_url,
          sentiment: item.sentiment,
        }));

        // SEMPRE buscar também do Google News RSS para ter mais notícias
        console.log('Also fetching from Google News RSS for more news');

        const query = 'mercado financeiro brasil ibovespa selic dolar ações';
        const googleNewsUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
        console.log(`Requesting Google News RSS: ${googleNewsUrl}`);

        const feeds = [googleNewsUrl, 'https://www.moneytimes.com.br/feed/', 'https://br.investing.com/rss/news.rss'];
        const xmlParts = await Promise.all(feeds.map(async (u) => {
          try {
            const r = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; KadigBot/1.0)' }, signal: AbortSignal.timeout(8000) });
            return r.ok ? await r.text() : '';
          } catch { return ''; }
        }));
        const xmlText = xmlParts.join('\n');

        const googleItems: any[] = [];
        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        const titleRegex = /<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/;
        const linkRegex = /<link>(.*?)<\/link>/;
        const pubDateRegex = /<pubDate>(.*?)<\/pubDate>/;
        const sourceRegex = /<source.*?>(.*?)<\/source>/;

        let match;
        let count = 0;
        while ((match = itemRegex.exec(xmlText)) !== null && count < 40) {
          const itemContent = match[1];
          const titleMatch = itemContent.match(titleRegex);
          const linkMatch = itemContent.match(linkRegex);
          const pubDateMatch = itemContent.match(pubDateRegex);
          const sourceMatch = itemContent.match(sourceRegex);

          if (titleMatch && linkMatch) {
            const title = titleMatch[1] || titleMatch[2] || '';
            googleItems.push({
              title,
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

        console.log(`Google News items: ${googleItems.length}`);

        // Combinar: Stock News (com fotos) primeiro, depois Google News
        const allNews = [...news, ...googleItems];
        
        // Ordenar por data (mais recentes primeiro) e filtrar apenas 2025+
        const sortedNews = allNews
          .filter(item => {
            const itemDate = new Date(item.date);
            return itemDate.getFullYear() >= 2025;
          })
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        console.log(`Total combined news (2025+, sorted): ${sortedNews.length}`);

        const newsCount = sortedNews.length;
        const totalPages = Math.max(1, Math.ceil(newsCount / 5)); // 5 news per page

        return new Response(
          JSON.stringify({ news: sortedNews, totalPages }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (newsError) {
        console.error('Error fetching market news:', newsError);
        return new Response(
          JSON.stringify({ news: [], totalPages: 1 }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Buscar agenda do mercado (eventos econômicos, reuniões COPOM, IPOs, etc)
    if (type === 'market-agenda') {
      console.log('Fetching market agenda events');
      
      try {
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth();
        
        const monthNames = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
        const fullMonthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        
        // 1. Buscar calendário do COPOM do Banco Central
        console.log('Fetching COPOM calendar from BCB');
        
        // Reuniões do COPOM para 2025/2026 (dados oficiais BCB)
        // Fonte: https://www.bcb.gov.br/controleinflacao/agendareunioescopom
        const copomMeetings: any[] = [
          { date: '2025-01-28', type: 'copom' },
          { date: '2025-01-29', type: 'copom' },
          { date: '2025-03-18', type: 'copom' },
          { date: '2025-03-19', type: 'copom' },
          { date: '2025-05-06', type: 'copom' },
          { date: '2025-05-07', type: 'copom' },
          { date: '2025-06-17', type: 'copom' },
          { date: '2025-06-18', type: 'copom' },
          { date: '2025-07-29', type: 'copom' },
          { date: '2025-07-30', type: 'copom' },
          { date: '2025-09-16', type: 'copom' },
          { date: '2025-09-17', type: 'copom' },
          { date: '2025-11-04', type: 'copom' },
          { date: '2025-11-05', type: 'copom' },
          { date: '2025-12-09', type: 'copom' },
          { date: '2025-12-10', type: 'copom' },
          { date: '2026-01-27', type: 'copom' },
          { date: '2026-01-28', type: 'copom' },
          { date: '2026-03-17', type: 'copom' },
          { date: '2026-03-18', type: 'copom' },
          { date: '2026-05-05', type: 'copom' },
          { date: '2026-05-06', type: 'copom' },
          { date: '2026-06-16', type: 'copom' },
          { date: '2026-06-17', type: 'copom' },
          { date: '2026-08-04', type: 'copom' },
          { date: '2026-08-05', type: 'copom' },
        ];
        
        // 2. Buscar calendário FOMC do Fed (reuniões do Fed)
        const fomcMeetings: any[] = [
          { date: '2025-01-28', type: 'fomc' },
          { date: '2025-01-29', type: 'fomc' },
          { date: '2025-03-18', type: 'fomc' },
          { date: '2025-03-19', type: 'fomc' },
          { date: '2025-05-06', type: 'fomc' },
          { date: '2025-05-07', type: 'fomc' },
          { date: '2025-06-17', type: 'fomc' },
          { date: '2025-06-18', type: 'fomc' },
          { date: '2025-07-29', type: 'fomc' },
          { date: '2025-07-30', type: 'fomc' },
          { date: '2025-09-16', type: 'fomc' },
          { date: '2025-09-17', type: 'fomc' },
          { date: '2025-11-04', type: 'fomc' },
          { date: '2025-11-05', type: 'fomc' },
          { date: '2025-12-16', type: 'fomc' },
          { date: '2025-12-17', type: 'fomc' },
          { date: '2026-01-27', type: 'fomc' },
          { date: '2026-01-28', type: 'fomc' },
          { date: '2026-03-17', type: 'fomc' },
          { date: '2026-03-18', type: 'fomc' },
        ];
        
        // Datas de IPCA só devem ser exibidas quando vierem de calendário oficial.
        const ipcaDates: any[] = [];
        
        // 4. PIB Brasil (divulgação trimestral IBGE)
        const pibDates: any[] = [
          { date: '2025-03-07', type: 'pib', period: '4T24' },
          { date: '2025-06-04', type: 'pib', period: '1T25' },
          { date: '2025-09-03', type: 'pib', period: '2T25' },
          { date: '2025-12-03', type: 'pib', period: '3T25' },
          { date: '2026-03-04', type: 'pib', period: '4T25' },
          { date: '2026-06-03', type: 'pib', period: '1T26' },
        ];
        
        // 5. Payroll EUA (1ª sexta de cada mês)
        const payrollDates: any[] = [];
        for (let m = 0; m < 12; m++) {
          let firstFriday = new Date(currentYear, m, 1);
          while (firstFriday.getDay() !== 5) {
            firstFriday.setDate(firstFriday.getDate() + 1);
          }
          if (firstFriday >= today) {
            payrollDates.push({ date: firstFriday.toISOString().split('T')[0], type: 'payroll' });
          }
          let nextYearFriday = new Date(currentYear + 1, m, 1);
          while (nextYearFriday.getDay() !== 5) {
            nextYearFriday.setDate(nextYearFriday.getDate() + 1);
          }
          payrollDates.push({ date: nextYearFriday.toISOString().split('T')[0], type: 'payroll' });
        }
        
        // 6. Buscar calendário de resultados de empresas da B3 (temporada de balanços)
        // Geralmente Jan-Mar (4T), Abr-Mai (1T), Jul-Ago (2T), Out-Nov (3T)
        const earningsSeason: any[] = [
          // 4T24 - Janeiro/Fevereiro 2025
          { date: '2025-02-06', type: 'earnings', ticker: 'ITUB4', company: 'Itaú Unibanco' },
          { date: '2025-02-13', type: 'earnings', ticker: 'BBDC4', company: 'Bradesco' },
          { date: '2025-02-20', type: 'earnings', ticker: 'VALE3', company: 'Vale' },
          { date: '2025-02-21', type: 'earnings', ticker: 'PETR4', company: 'Petrobras' },
          { date: '2025-02-27', type: 'earnings', ticker: 'BBAS3', company: 'Banco do Brasil' },
          // 1T25 - Abril/Maio 2025
          { date: '2025-05-05', type: 'earnings', ticker: 'ITUB4', company: 'Itaú Unibanco' },
          { date: '2025-05-08', type: 'earnings', ticker: 'BBDC4', company: 'Bradesco' },
          { date: '2025-05-15', type: 'earnings', ticker: 'VALE3', company: 'Vale' },
          { date: '2025-05-16', type: 'earnings', ticker: 'PETR4', company: 'Petrobras' },
          // 2T25 - Julho/Agosto 2025
          { date: '2025-08-04', type: 'earnings', ticker: 'ITUB4', company: 'Itaú Unibanco' },
          { date: '2025-08-07', type: 'earnings', ticker: 'BBDC4', company: 'Bradesco' },
          { date: '2025-08-14', type: 'earnings', ticker: 'VALE3', company: 'Vale' },
          // 2026
          { date: '2026-02-05', type: 'earnings', ticker: 'ITUB4', company: 'Itaú Unibanco' },
          { date: '2026-02-12', type: 'earnings', ticker: 'BBDC4', company: 'Bradesco' },
          { date: '2026-02-19', type: 'earnings', ticker: 'VALE3', company: 'Vale' },
          { date: '2026-02-20', type: 'earnings', ticker: 'PETR4', company: 'Petrobras' },
        ];
        
        // 7. Feriados do mercado (B3)
        const marketHolidays: any[] = [
          { date: '2025-01-01', type: 'holiday', name: 'Confraternização Universal' },
          { date: '2025-03-03', type: 'holiday', name: 'Carnaval' },
          { date: '2025-03-04', type: 'holiday', name: 'Carnaval' },
          { date: '2025-04-18', type: 'holiday', name: 'Sexta-feira Santa' },
          { date: '2025-04-21', type: 'holiday', name: 'Tiradentes' },
          { date: '2025-05-01', type: 'holiday', name: 'Dia do Trabalho' },
          { date: '2025-06-19', type: 'holiday', name: 'Corpus Christi' },
          { date: '2025-09-07', type: 'holiday', name: 'Independência do Brasil' },
          { date: '2025-10-12', type: 'holiday', name: 'Nossa Senhora Aparecida' },
          { date: '2025-11-02', type: 'holiday', name: 'Finados' },
          { date: '2025-11-15', type: 'holiday', name: 'Proclamação da República' },
          { date: '2025-11-20', type: 'holiday', name: 'Consciência Negra' },
          { date: '2025-12-24', type: 'holiday', name: 'Véspera de Natal' },
          { date: '2025-12-25', type: 'holiday', name: 'Natal' },
          { date: '2025-12-31', type: 'holiday', name: 'Véspera de Ano Novo' },
          { date: '2026-01-01', type: 'holiday', name: 'Confraternização Universal' },
          { date: '2026-02-16', type: 'holiday', name: 'Carnaval' },
          { date: '2026-02-17', type: 'holiday', name: 'Carnaval' },
          { date: '2026-04-03', type: 'holiday', name: 'Sexta-feira Santa' },
          { date: '2026-04-21', type: 'holiday', name: 'Tiradentes' },
          { date: '2026-05-01', type: 'holiday', name: 'Dia do Trabalho' },
        ];
        
        // Combinar todos os eventos
        const allEvents: any[] = [];
        
        // Processar COPOM
        copomMeetings.forEach(m => {
          const date = new Date(m.date);
          if (date >= today) {
            allEvents.push({
              id: `copom-${m.date}`,
              date: m.date,
              day: date.getDate(),
              month: monthNames[date.getMonth()],
              fullMonth: fullMonthNames[date.getMonth()],
              year: date.getFullYear(),
              type: 'copom',
              category: 'monetary',
              title: 'Reunião COPOM',
              description: 'Decisão da taxa Selic pelo Comitê de Política Monetária do Banco Central',
              importance: 'alta',
              icon: '🏦',
            });
          }
        });
        
        // Processar FOMC
        fomcMeetings.forEach(m => {
          const date = new Date(m.date);
          if (date >= today) {
            allEvents.push({
              id: `fomc-${m.date}`,
              date: m.date,
              day: date.getDate(),
              month: monthNames[date.getMonth()],
              fullMonth: fullMonthNames[date.getMonth()],
              year: date.getFullYear(),
              type: 'fomc',
              category: 'monetary',
              title: 'Reunião FOMC',
              description: 'Decisão de juros do Federal Reserve (EUA)',
              importance: 'alta',
              icon: '🇺🇸',
            });
          }
        });
        
        // Processar IPCA
        ipcaDates.slice(0, 6).forEach(m => {
          const date = new Date(m.date);
          allEvents.push({
            id: `ipca-${m.date}`,
            date: m.date,
            day: date.getDate(),
            month: monthNames[date.getMonth()],
            fullMonth: fullMonthNames[date.getMonth()],
            year: date.getFullYear(),
            type: 'ipca',
            category: 'economic',
            title: 'Divulgação IPCA',
            description: 'Índice de Preços ao Consumidor Amplo (inflação oficial)',
            importance: 'alta',
            icon: '📊',
          });
        });
        
        // Processar PIB
        pibDates.forEach(m => {
          const date = new Date(m.date);
          if (date >= today) {
            allEvents.push({
              id: `pib-${m.date}`,
              date: m.date,
              day: date.getDate(),
              month: monthNames[date.getMonth()],
              fullMonth: fullMonthNames[date.getMonth()],
              year: date.getFullYear(),
              type: 'pib',
              category: 'economic',
              title: `PIB Brasil ${m.period}`,
              description: 'Divulgação do Produto Interno Bruto pelo IBGE',
              importance: 'alta',
              icon: '📈',
            });
          }
        });
        
        // Processar Payroll
        payrollDates.slice(0, 6).forEach(m => {
          const date = new Date(m.date);
          allEvents.push({
            id: `payroll-${m.date}`,
            date: m.date,
            day: date.getDate(),
            month: monthNames[date.getMonth()],
            fullMonth: fullMonthNames[date.getMonth()],
            year: date.getFullYear(),
            type: 'payroll',
            category: 'economic',
            title: 'Payroll EUA',
            description: 'Relatório de emprego dos Estados Unidos',
            importance: 'média',
            icon: '🇺🇸',
          });
        });
        
        // Processar Resultados
        earningsSeason.forEach(m => {
          const date = new Date(m.date);
          if (date >= today) {
            allEvents.push({
              id: `earnings-${m.ticker}-${m.date}`,
              date: m.date,
              day: date.getDate(),
              month: monthNames[date.getMonth()],
              fullMonth: fullMonthNames[date.getMonth()],
              year: date.getFullYear(),
              type: 'earnings',
              category: 'corporate',
              title: `Resultado ${m.ticker}`,
              description: `Divulgação de resultados trimestrais de ${m.company}`,
              ticker: m.ticker,
              company: m.company,
              importance: 'média',
              icon: '📋',
            });
          }
        });
        
        // Processar Feriados
        marketHolidays.forEach(m => {
          const date = new Date(m.date);
          if (date >= today) {
            allEvents.push({
              id: `holiday-${m.date}`,
              date: m.date,
              day: date.getDate(),
              month: monthNames[date.getMonth()],
              fullMonth: fullMonthNames[date.getMonth()],
              year: date.getFullYear(),
              type: 'holiday',
              category: 'market',
              title: m.name,
              description: 'Bolsa fechada - Feriado',
              importance: 'baixa',
              icon: '🏖️',
            });
          }
        });
        
        // Ordenar por data
        allEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        // Agrupar por mês para facilitar visualização
        const eventsByMonth: { [key: string]: any[] } = {};
        allEvents.forEach(event => {
          const key = `${event.year}-${event.month}`;
          if (!eventsByMonth[key]) {
            eventsByMonth[key] = [];
          }
          eventsByMonth[key].push(event);
        });
        
        console.log(`Total market agenda events: ${allEvents.length}`);
        
        return new Response(
          JSON.stringify({ 
            events: allEvents.slice(0, 50), // Próximos 50 eventos
            eventsByMonth,
            categories: ['monetary', 'economic', 'corporate', 'market'],
            lastUpdate: new Date().toISOString()
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('Error fetching market agenda:', error);
        return new Response(
          JSON.stringify({ events: [], error: 'Failed to fetch market agenda' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }


    // Buscar dividendos reais da BRAPI
    if (type === 'dividends') {
      console.log('Fetching real dividends from BRAPI');
      
      try {
        // Tickers expandidos de ações e FIIs que costumam pagar dividendos
        const dividendTickers = [
          // Ações com bons dividendos
          'PETR4', 'VALE3', 'BBAS3', 'ITUB4', 'BBDC4', 'TAEE11', 'CPLE6', 'ELET6',
          'CMIG4', 'SANB11', 'BPAC11', 'BBSE3', 'TRPL4', 'VIVT3', 'ENBR3',
          'CPFE3', 'ENGI11', 'CSMG3', 'SAPR11', 'AURE3', 'CXSE3', 'CMIN3',
          // FIIs com dividendos mensais
          'XPLG11', 'HGLG11', 'MXRF11', 'XPML11', 'VISC11', 'BCFF11', 'HGBS11',
          'KNRI11', 'KNCR11', 'VRTA11', 'HGRE11', 'GGRC11', 'PVBI11', 'BTLG11',
          'HSML11', 'VILG11', 'RBRR11', 'CPTS11', 'RBRF11', 'VGIP11'
        ];
        
        const dividends: any[] = [];
        const batchSize = 10;
        
        for (let i = 0; i < dividendTickers.length; i += batchSize) {
          const batch = dividendTickers.slice(i, i + batchSize);
          const url = `https://brapi.dev/api/quote/${batch.join(',')}?token=${BRAPI_TOKEN}&dividends=true`;
          
          try {
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.results) {
              for (const stock of data.results) {
                if (stock.dividendsData?.cashDividends && stock.dividendsData.cashDividends.length > 0) {
                  // Pegar os dividendos mais recentes (próximos a pagar)
                  const recentDividends = stock.dividendsData.cashDividends
                    .filter((div: any) => {
                      const paymentDate = new Date(div.paymentDate);
                      const now = new Date();
                      // Dividendos com pagamento nos próximos 60 dias ou últimos 30 dias
                      const diffDays = (paymentDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
                      return diffDays >= -30 && diffDays <= 60;
                    })
                    .slice(0, 2); // Máximo 2 por ativo
                  
                  for (const div of recentDividends) {
                    const paymentDate = new Date(div.paymentDate);
                    const exDate = new Date(div.approvedOn || div.paymentDate);
                    const monthNames = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
                    
                    dividends.push({
                      ticker: stock.symbol,
                      companyName: stock.longName || stock.shortName || stock.symbol,
                      dataCom: exDate.toLocaleDateString('pt-BR'),
                      value: parseFloat(div.rate) || 0,
                      paymentDay: paymentDate.getDate(),
                      paymentMonth: monthNames[paymentDate.getMonth()],
                      paymentDate: div.paymentDate,
                      type: div.label || 'DIVIDENDO',
                    });
                  }
                }
              }
            }
          } catch (batchError) {
            console.error(`Error fetching dividend batch: ${batchError}`);
          }
        }
        
        // Ordenar por data de pagamento (mais próximos primeiro)
        dividends.sort((a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime());
        
        console.log(`Found ${dividends.length} real dividends`);
        
        return new Response(
          JSON.stringify({ 
            dividends: dividends.slice(0, 20), // Máximo 20 dividendos
            lastUpdate: new Date().toISOString() 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('Error fetching dividends:', error);
        return new Response(
          JSON.stringify({ dividends: [], error: 'Failed to fetch dividends' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

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

    // Top dividend banks - ranked only with current BRAPI data
    if (type === 'top-dividend-banks') {
      try {
        const bankTickers = ['BBAS3', 'ITUB4', 'BBDC4', 'SANB11', 'ITSA4', 'BRSR6', 'BPAC11', 'ABCB4', 'BMGB4'];
        const response = await fetch(
          `https://brapi.dev/api/quote/${bankTickers.join(',')}?token=${BRAPI_TOKEN}&fundamental=true`
        );
        if (!response.ok) throw new Error(`BRAPI error: ${response.status}`);
        const data = await response.json();
        const banks = (data.results || [])
          .filter((stock: any) => Number(stock.dividendYield) > 0)
          .map((stock: any) => ({
            name: stock.longName || stock.shortName || stock.symbol,
            ticker: stock.symbol,
            dividendYield: Number(stock.dividendYield),
            price: Number(stock.regularMarketPrice) || 0,
            sector: 'Bancos',
          }))
          .sort((a: any, b: any) => b.dividendYield - a.dividendYield)
          .slice(0, 3);
        return new Response(
          JSON.stringify({ banks, lastUpdate: new Date().toISOString(), source: 'brapi' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('Error fetching top dividend banks:', error);
        return new Response(
          JSON.stringify({ banks: [], error: 'Dividend data unavailable' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (type !== 'all') {
      return new Response(
        JSON.stringify({ error: `Unknown request type: ${type}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
        const text = await response.text();
        let data: any = {};
        try { data = JSON.parse(text); } catch { /* non json */ }

        if (!response.ok || !data.results) {
          console.error(`BRAPI batch status=${response.status} body=${text.slice(0, 300)}`);
        }

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

    // Índices do mercado (nacionais e internacionais)
    let indices: any[] = [];
    try {
      // Índices brasileiros
      const brIndicesUrl = `https://brapi.dev/api/quote/%5EBVSP,%5EIFIX?token=${BRAPI_TOKEN}`;
      const brIndicesResponse = await fetch(brIndicesUrl);
      const brIndicesData = await brIndicesResponse.json();
      
      if (brIndicesData.results) {
        indices = brIndicesData.results.map((idx: any) => ({
          name: idx.symbol === '^BVSP' ? 'IBOV' : idx.symbol === '^IFIX' ? 'IFIX' : idx.symbol,
          value: idx.regularMarketPrice || 0,
          changePercent: idx.regularMarketChangePercent || 0,
          type: 'br'
        }));
      }
      
    } catch (indicesError) {
      console.error('Error fetching indices:', indicesError);
    }

    const commodities: any[] = [];

    return new Response(
      JSON.stringify({
        stocks,
        maioresAltas,
        maioresBaixas,
        indices,
        commodities,
        lastUpdate: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
