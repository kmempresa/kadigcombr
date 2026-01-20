import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Capacitor } from '@capacitor/core';

// Product ID for Apple StoreKit
const PREMIUM_PRODUCT_ID = 'kadig.premium';

interface UsePurchaseResult {
  purchasePremium: () => Promise<boolean>;
  isProcessing: boolean;
  restorePurchases: () => Promise<boolean>;
  isNative: boolean;
}

export const useApplePurchase = (): UsePurchaseResult => {
  const [isProcessing, setIsProcessing] = useState(false);
  const isNative = Capacitor.isNativePlatform();
  const isIOS = isNative && Capacitor.getPlatform() === 'ios';

  const activateSubscription = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Você precisa estar logado para assinar");
        return false;
      }

      const { error } = await supabase
        .from("subscriptions")
        .upsert({
          user_id: session.user.id,
          status: "active",
          plan: "premium",
          price_monthly: 39.90,
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }, {
          onConflict: "user_id",
        });

      if (error) {
        console.error("Error activating subscription:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Subscription activation error:", error);
      return false;
    }
  }, []);

  const purchasePremium = useCallback(async (): Promise<boolean> => {
    setIsProcessing(true);
    console.log('[IAP] Purchase initiated - isIOS:', isIOS);

    try {
      if (isIOS) {
        // Import dynamically to avoid issues on web
        const { NativePurchases } = await import('@capgo/native-purchases');
        
        console.log('[IAP] Calling NativePurchases.purchaseProduct with ID:', PREMIUM_PRODUCT_ID);
        
        // Simple one-line call to open StoreKit
        const result = await NativePurchases.purchaseProduct({
          productIdentifier: PREMIUM_PRODUCT_ID
        });
        
        console.log('[IAP] Purchase result:', result);
        
        // Activate subscription in database
        const activated = await activateSubscription();
        if (activated) {
          toast.success("🎉 Bem-vindo ao Kadig Premium!");
        }
        
        setIsProcessing(false);
        return activated;
      } else {
        // Web fallback for testing
        console.log('[IAP] Web fallback - activating subscription directly');
        const activated = await activateSubscription();
        if (activated) {
          toast.success("🎉 Bem-vindo ao Kadig Premium!");
        } else {
          toast.error("Erro ao processar assinatura");
        }
        setIsProcessing(false);
        return activated;
      }
    } catch (error: any) {
      console.error("[IAP] Purchase error:", error);
      
      // Check if user cancelled
      if (error.message?.includes('cancel') || error.code === 'E_USER_CANCELLED') {
        toast.info("Compra cancelada");
      } else {
        toast.error(error.message || "Erro ao processar compra");
      }
      
      setIsProcessing(false);
      return false;
    }
  }, [isIOS, activateSubscription]);

  const restorePurchases = useCallback(async (): Promise<boolean> => {
    setIsProcessing(true);
    console.log('[IAP] Restore initiated - isIOS:', isIOS);

    try {
      if (isIOS) {
        const { NativePurchases } = await import('@capgo/native-purchases');
        
        console.log('[IAP] Calling NativePurchases.restorePurchases');
        await NativePurchases.restorePurchases();
        
        console.log('[IAP] Restore completed');
        
        // Activate subscription after restore
        const activated = await activateSubscription();
        if (activated) {
          toast.success("Assinatura restaurada com sucesso!");
          setIsProcessing(false);
          return true;
        } else {
          toast.info("Nenhuma compra anterior encontrada");
        }
        
        setIsProcessing(false);
        return false;
      } else {
        toast.info("Restauração disponível apenas no app iOS");
        setIsProcessing(false);
        return false;
      }
    } catch (error: any) {
      console.error("[IAP] Restore error:", error);
      toast.error(error.message || "Erro ao restaurar compras");
      setIsProcessing(false);
      return false;
    }
  }, [isIOS, activateSubscription]);

  return {
    purchasePremium,
    isProcessing,
    restorePurchases,
    isNative
  };
};
