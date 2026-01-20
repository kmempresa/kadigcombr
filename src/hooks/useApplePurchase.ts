import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

declare global {
  interface Window {
    webkit?: {
      messageHandlers?: {
        kadigPurchase?: {
          postMessage: (message: { action: string; productId: string }) => void;
        };
      };
    };
  }
}

// Product ID for Apple In-App Purchase
const PREMIUM_PRODUCT_ID = 'kadig.premium';

interface UsePurchaseResult {
  purchasePremium: () => Promise<boolean>;
  isProcessing: boolean;
  restorePurchases: () => Promise<boolean>;
}

export const useApplePurchase = (): UsePurchaseResult => {
  const [isProcessing, setIsProcessing] = useState(false);

  const isNativeApp = useCallback(() => {
    // Check if running in Capacitor iOS native app
    return !!(window.webkit?.messageHandlers?.kadigPurchase);
  }, []);

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

    try {
      if (isNativeApp()) {
        // Native iOS - trigger Apple In-App Purchase
        return new Promise((resolve) => {
          // Set up listener for purchase result
          const handlePurchaseResult = (event: CustomEvent) => {
            window.removeEventListener('kadigPurchaseResult', handlePurchaseResult as EventListener);
            
            if (event.detail?.success) {
              activateSubscription().then((activated) => {
                if (activated) {
                  toast.success("🎉 Bem-vindo ao Kadig Premium!");
                  resolve(true);
                } else {
                  toast.error("Erro ao ativar assinatura. Contate o suporte.");
                  resolve(false);
                }
              });
            } else {
              const errorMessage = event.detail?.error || "Compra cancelada ou falhou";
              toast.error(errorMessage);
              resolve(false);
            }
            
            setIsProcessing(false);
          };

          window.addEventListener('kadigPurchaseResult', handlePurchaseResult as EventListener);

          // Trigger native purchase
          window.webkit?.messageHandlers?.kadigPurchase?.postMessage({
            action: 'purchase',
            productId: PREMIUM_PRODUCT_ID
          });

          // Timeout after 2 minutes
          setTimeout(() => {
            window.removeEventListener('kadigPurchaseResult', handlePurchaseResult as EventListener);
            setIsProcessing(false);
            resolve(false);
          }, 120000);
        });
      } else {
        // Web fallback - direct subscription (for testing/web version)
        const activated = await activateSubscription();
        if (activated) {
          toast.success("🎉 Bem-vindo ao Kadig Premium!");
        } else {
          toast.error("Erro ao processar assinatura");
        }
        setIsProcessing(false);
        return activated;
      }
    } catch (error) {
      console.error("Purchase error:", error);
      toast.error("Erro ao processar compra");
      setIsProcessing(false);
      return false;
    }
  }, [isNativeApp, activateSubscription]);

  const restorePurchases = useCallback(async (): Promise<boolean> => {
    setIsProcessing(true);

    try {
      if (isNativeApp()) {
        return new Promise((resolve) => {
          const handleRestoreResult = (event: CustomEvent) => {
            window.removeEventListener('kadigRestoreResult', handleRestoreResult as EventListener);
            
            if (event.detail?.success) {
              activateSubscription().then((activated) => {
                if (activated) {
                  toast.success("Assinatura restaurada com sucesso!");
                  resolve(true);
                } else {
                  resolve(false);
                }
              });
            } else {
              toast.info("Nenhuma compra anterior encontrada");
              resolve(false);
            }
            
            setIsProcessing(false);
          };

          window.addEventListener('kadigRestoreResult', handleRestoreResult as EventListener);

          window.webkit?.messageHandlers?.kadigPurchase?.postMessage({
            action: 'restore',
            productId: PREMIUM_PRODUCT_ID
          });

          setTimeout(() => {
            window.removeEventListener('kadigRestoreResult', handleRestoreResult as EventListener);
            setIsProcessing(false);
            resolve(false);
          }, 60000);
        });
      } else {
        toast.info("Restauração disponível apenas no app nativo");
        setIsProcessing(false);
        return false;
      }
    } catch (error) {
      console.error("Restore error:", error);
      toast.error("Erro ao restaurar compras");
      setIsProcessing(false);
      return false;
    }
  }, [isNativeApp, activateSubscription]);

  return {
    purchasePremium,
    isProcessing,
    restorePurchases
  };
};
