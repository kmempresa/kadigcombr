// Brazilian bank logos utility
// Logos oficiais hospedados localmente em src/assets/banks (sem depender de CDN externo)

import pagbank from "@/assets/banks/pagbank.svg";
import bmg from "@/assets/banks/bmg.svg";
import sofisa from "@/assets/banks/sofisa.svg";
import c6 from "@/assets/banks/c6.svg";
import daycoval from "@/assets/banks/daycoval.svg";
import picpay from "@/assets/banks/picpay.svg";
import itau from "@/assets/banks/itau.svg";
import bradesco from "@/assets/banks/bradesco.svg";
import santander from "@/assets/banks/santander.svg";
import bb from "@/assets/banks/bb.svg";
import caixa from "@/assets/banks/caixa.svg";
import nubank from "@/assets/banks/nubank.svg";
import inter from "@/assets/banks/inter.svg";
import btg from "@/assets/banks/btg.svg";
import xp from "@/assets/banks/xp.svg";
import original from "@/assets/banks/original.svg";
import safra from "@/assets/banks/safra.svg";
import sicoob from "@/assets/banks/sicoob.svg";
import sicredi from "@/assets/banks/sicredi.svg";
import neon from "@/assets/banks/neon.svg";
import mercadopago from "@/assets/banks/mercadopago.svg";
import banrisul from "@/assets/banks/banrisul.svg";
import pan from "@/assets/banks/pan.svg";

// Map bank names to their local logo (matches the names used across the app)
const bankLogos: Record<string, string> = {
  // Major Banks
  'Itaú': itau,
  'Itaú Unibanco': itau,
  'Itau': itau,
  'Bradesco': bradesco,
  'Banco Bradesco': bradesco,
  'Santander': santander,
  'Banco Santander': santander,
  'Banco do Brasil': bb,
  'BB': bb,
  'Caixa': caixa,
  'Caixa Econômica': caixa,
  'Caixa Econômica Federal': caixa,
  'Nubank': nubank,
  'Nu Pagamentos': nubank,
  'Inter': inter,
  'Banco Inter': inter,
  'BTG': btg,
  'BTG Pactual': btg,
  'Banco BTG Pactual': btg,
  'XP': xp,
  'XP Investimentos': xp,
  'C6': c6,
  'C6 Bank': c6,
  'Banco C6': c6,
  'Original': original,
  'Banco Original': original,
  'Safra': safra,
  'Banco Safra': safra,
  'Sicredi': sicredi,
  'Sicoob': sicoob,
  'Banrisul': banrisul,
  'Banco Banrisul': banrisul,
  'PagBank': pagbank,
  'PagSeguro': pagbank,
  'Mercado Pago': mercadopago,
  'Next': bradesco,
  'Neon': neon,
  'Banco Neon': neon,
  'Rico': xp,
  'Clear': xp,
  'Ágora': bradesco,
  'Agora': bradesco,
  'Daycoval': daycoval,
  'Banco Daycoval': daycoval,
  'BMG': bmg,
  'Banco BMG': bmg,
  'Pan': pan,
  'Banco Pan': pan,
  'Sofisa': sofisa,
  'Banco Sofisa': sofisa,
  'Sofisa Direto': sofisa,
  'Picpay': picpay,
  'PicPay': picpay,
  'Iti': itau,
  'iti': itau,
  'BMG Card': bmg,
};

/**
 * Get the local logo URL for a bank by its name (direct or partial match)
 */
export function getBankLogoUrl(connectorName: string): string | null {
  if (!connectorName) return null;

  if (bankLogos[connectorName]) {
    return bankLogos[connectorName];
  }

  const normalizedName = connectorName.toLowerCase().trim();
  for (const [name, logo] of Object.entries(bankLogos)) {
    if (normalizedName.includes(name.toLowerCase()) ||
        name.toLowerCase().includes(normalizedName)) {
      return logo;
    }
  }

  return null;
}

/**
 * Kept for compatibility — local logos have no separate fallback URL
 */
export function getBankLogoFallbackUrl(connectorName: string): string | null {
  return getBankLogoUrl(connectorName);
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
  const logoUrl = getBankLogoUrl(connectorName);

  return {
    logoUrl,
    fallbackUrl: logoUrl,
    brandColor: null,
    bankCode: null,
  };
}
