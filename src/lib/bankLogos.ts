// Brazilian bank logos utility
// Uses reliable external sources for bank logos instead of Pluggy's buggy images

// Map connector names to COMPE codes (Banco Central codes)
const bankNameToCode: Record<string, string> = {
  // Major Banks
  'Itaú': '341',
  'Itaú Unibanco': '341',
  'Itau': '341',
  'Bradesco': '237',
  'Banco Bradesco': '237',
  'Santander': '033',
  'Banco Santander': '033',
  'Banco do Brasil': '001',
  'BB': '001',
  'Caixa': '104',
  'Caixa Econômica': '104',
  'Caixa Econômica Federal': '104',
  'Nubank': '260',
  'Nu Pagamentos': '260',
  'Inter': '077',
  'Banco Inter': '077',
  'BTG': '208',
  'BTG Pactual': '208',
  'Banco BTG Pactual': '208',
  'XP': '102',
  'XP Investimentos': '102',
  'C6': '336',
  'C6 Bank': '336',
  'Banco C6': '336',
  'Original': '212',
  'Banco Original': '212',
  'Safra': '422',
  'Banco Safra': '422',
  'Sicredi': '748',
  'Sicoob': '756',
  'Banrisul': '041',
  'Banco Banrisul': '041',
  'PagBank': '290',
  'PagSeguro': '290',
  'Mercado Pago': '323',
  'Next': '237', // Same as Bradesco
  'Neon': '735',
  'Banco Neon': '735',
  'Modal': '746',
  'Banco Modal': '746',
  'Modalmais': '746',
  'Rico': '102', // Same as XP
  'Clear': '102', // Same as XP
  'Ágora': '237', // Bradesco group
  'Agora': '237',
  'Genial': '125',
  'Genial Investimentos': '125',
  'Banco Genial': '125',
  'Daycoval': '707',
  'Banco Daycoval': '707',
  'BMG': '318',
  'Banco BMG': '318',
  'Pan': '623',
  'Banco Pan': '623',
  'Votorantim': '655',
  'ABC Brasil': '246',
  'Banco ABC Brasil': '246',
  'Pine': '643',
  'Banco Pine': '643',
  'Fibra': '224',
  'Banco Fibra': '224',
  'Rendimento': '633',
  'Banco Rendimento': '633',
  'Sofisa': '637',
  'Banco Sofisa': '637',
  'Agibank': '121',
  'Banco Agibank': '121',
  'Bari': '330',
  'Banco Bari': '330',
  'BS2': '218',
  'Banco BS2': '218',
  'BV': '413',
  'Banco BV': '413',
  'Banco Votorantim': '413',
  'Will Bank': '280',
  'Willbank': '280',
  'Picpay': '380',
  'PicPay': '380',
  'Stone': '197',
  'Banco Stone': '197',
  'Iti': '341', // Itaú
  'iti': '341',
  'Digio': '335',
  'Banco Digio': '335',
  'Pernambucanas': '174',
  'Midway': '358',
  'Voiter': '653',
  'Trigg': '180',
  'BMG Card': '318',
  'Toro': '352',
  'Toro Investimentos': '352',
  'Guide': '177',
  'Guide Investimentos': '177',
  'Warren': '371',
  'Warren Investimentos': '371',
};

// CDN sources for bank logos (in order of preference)
const CDN_SOURCES = [
  // GitHub raw content - most reliable
  (code: string) => `https://raw.githubusercontent.com/Tgentil/Bancos-em-SVG/master/bancos/${code}.svg`,
  // JSDelivr CDN backup
  (code: string) => `https://cdn.jsdelivr.net/gh/Tgentil/Bancos-em-SVG@master/bancos/${code}.svg`,
];

// Fallback colors for banks when logo isn't available
const bankColors: Record<string, string> = {
  '341': '#FF6600', // Itaú
  '237': '#CC092F', // Bradesco
  '033': '#EC0000', // Santander
  '001': '#FEDD00', // BB
  '104': '#005CA9', // Caixa
  '260': '#820AD1', // Nubank
  '077': '#FF7A00', // Inter
  '208': '#0D1F3C', // BTG
  '102': '#000000', // XP
  '336': '#1A1A1A', // C6
  '212': '#00A651', // Original
  '422': '#002E6D', // Safra
};

/**
 * Get the COMPE code for a bank by its name
 */
export function getBankCode(connectorName: string): string | null {
  if (!connectorName) return null;
  
  // Direct match
  if (bankNameToCode[connectorName]) {
    return bankNameToCode[connectorName];
  }
  
  // Partial match (case-insensitive)
  const normalizedName = connectorName.toLowerCase().trim();
  for (const [name, code] of Object.entries(bankNameToCode)) {
    if (normalizedName.includes(name.toLowerCase()) || 
        name.toLowerCase().includes(normalizedName)) {
      return code;
    }
  }
  
  return null;
}

/**
 * Get the best logo URL for a bank
 */
export function getBankLogoUrl(connectorName: string): string | null {
  const code = getBankCode(connectorName);
  if (!code) return null;
  
  // Return the primary CDN source
  return CDN_SOURCES[0](code);
}

/**
 * Get fallback logo URL (backup CDN)
 */
export function getBankLogoFallbackUrl(connectorName: string): string | null {
  const code = getBankCode(connectorName);
  if (!code) return null;
  
  return CDN_SOURCES[1](code);
}

/**
 * Get bank brand color
 */
export function getBankColor(connectorName: string): string | null {
  const code = getBankCode(connectorName);
  if (!code) return null;
  
  return bankColors[code] || null;
}

/**
 * Enhanced bank image component props
 */
export interface BankLogoInfo {
  logoUrl: string | null;
  fallbackUrl: string | null;
  brandColor: string | null;
  bankCode: string | null;
}

/**
 * Get all logo information for a bank
 */
export function getBankLogoInfo(connectorName: string): BankLogoInfo {
  const code = getBankCode(connectorName);
  
  return {
    logoUrl: code ? CDN_SOURCES[0](code) : null,
    fallbackUrl: code ? CDN_SOURCES[1](code) : null,
    brandColor: code ? bankColors[code] || null : null,
    bankCode: code,
  };
}
