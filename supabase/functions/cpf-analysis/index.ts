import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function validateCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleaned)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cleaned[i]) * (10 - i);
  let check = 11 - (sum % 11);
  if (check >= 10) check = 0;
  if (parseInt(cleaned[9]) !== check) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cleaned[i]) * (11 - i);
  check = 11 - (sum % 11);
  if (check >= 10) check = 0;
  if (parseInt(cleaned[10]) !== check) return false;

  return true;
}

function maskCPF(cpf: string): string {
  const c = cpf.replace(/\D/g, '');
  return `${c.slice(0, 3)}.${c.slice(3, 6)}.${c.slice(6, 9)}-${c.slice(9)}`;
}

async function fetchCNPJ(cnpj: string) {
  const cleaned = cnpj.replace(/\D/g, '');
  try {
    const res = await fetch(`https://brasilapi.com.br/api/v1/cnpj/v1/${cleaned}`);
    if (!res.ok) {
      // Try v2
      const res2 = await fetch(`https://brasilapi.com.br/api/v1/cnpj/v1/${cleaned}`);
      if (!res2.ok) return null;
      return await res2.json();
    }
    return await res.json();
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cpf, cnpjs } = await req.json();

    if (!cpf) {
      return new Response(JSON.stringify({ error: 'CPF é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cleanedCPF = cpf.replace(/\D/g, '');
    const isValid = validateCPF(cleanedCPF);
    const masked = maskCPF(cleanedCPF);

    // CPF analysis result
    const cpfResult = {
      cpf: masked,
      valid: isValid,
      status: isValid ? 'regular' : 'invalido',
      statusLabel: isValid ? 'Regular' : 'CPF Inválido',
      pendencias: isValid ? [] : ['CPF com formato inválido'],
      consultedAt: new Date().toISOString(),
    };

    // CNPJ lookups if provided
    const cnpjResults = [];
    if (cnpjs && Array.isArray(cnpjs)) {
      for (const cnpj of cnpjs) {
        const cleaned = cnpj.replace(/\D/g, '');
        if (cleaned.length === 14) {
          const data = await fetchCNPJ(cleaned);
          if (data) {
            cnpjResults.push({
              cnpj: cleaned.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5'),
              razao_social: data.razao_social || data.nome_fantasia || 'N/A',
              nome_fantasia: data.nome_fantasia || null,
              situacao: data.descricao_situacao_cadastral || data.situacao_cadastral || 'N/A',
              data_abertura: data.data_inicio_atividade || null,
              natureza_juridica: data.natureza_juridica || null,
              porte: data.porte || data.descricao_porte || null,
              atividade_principal: data.cnae_fiscal_descricao || 
                (data.cnaes_secundarios?.[0]?.descricao) || null,
            });
          } else {
            cnpjResults.push({
              cnpj: cleaned.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5'),
              razao_social: 'Não encontrado',
              situacao: 'Não encontrado na base',
              error: true,
            });
          }
        }
      }
    }

    return new Response(JSON.stringify({ cpf: cpfResult, cnpjs: cnpjResults }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('cpf-analysis error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Erro desconhecido' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
