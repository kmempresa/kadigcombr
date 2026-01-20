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

// Declare global for cordova-plugin-purchase store
declare global {
  interface Window {
    CdvPurchase?: {
      store: any;
      ProductType: { PAID_SUBSCRIPTION: string };
      Platform: { APPLE_APPSTORE: string };
    };
  }
}

export const useApplePurchase = (): UsePurchaseResult => {
  console.log('[useApplePurchase] Hook called');
  const [isProcessing, setIsProcessing] = useState(false);
  const isNative = Capacitor.isNativePlatform();
  console.log('[useApplePurchase] isNative:', isNative);

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
      // Check if running on native iOS with cordova-plugin-purchase
      if (isNative && Capacitor.getPlatform() === 'ios' && window.CdvPurchase?.store) {
        const store = window.CdvPurchase.store;
        const ProductType = window.CdvPurchase.ProductType;
        const Platform = window.CdvPurchase.Platform;

        console.log('[IAP] Registering product:', PREMIUM_PRODUCT_ID);

        // Register the product
        store.register([{
          id: PREMIUM_PRODUCT_ID,
          type: ProductType.PAID_SUBSCRIPTION,
          platform: Platform.APPLE_APPSTORE,
        }]);

        // Set up purchase handlers
        store.when()
          .productUpdated((product: any) => {
            console.log('[IAP] Product updated:', product);
          })
          .approved(async (transaction: any) => {
            console.log('[IAP] Transaction approved:', transaction);
            const activated = await activateSubscription();
            if (activated) {
              transaction.verify();
            }
          })
          .verified((receipt: any) => {
            console.log('[IAP] Receipt verified:', receipt);
            receipt.finish();
          })
          .finished((transaction: any) => {
            console.log('[IAP] Transaction finished:', transaction);
            toast.success("🎉 Bem-vindo ao Kadig Premium!");
            setIsProcessing(false);
          });

        // Handle cancelled state separately using error callback
        store.error((error: any) => {
          console.log('[IAP] Store error:', error);
          if (error.code === 6777001 || error.message?.includes('cancelled')) {
            toast.info("Compra cancelada");
          } else {
            toast.error("Erro na compra: " + (error.message || 'Erro desconhecido'));
          }
          setIsProcessing(false);
        });

        // Initialize store
        await store.initialize([Platform.APPLE_APPSTORE]);
        
        // Refresh products
        await store.update();

        // Get the product
        const product = store.get(PREMIUM_PRODUCT_ID, Platform.APPLE_APPSTORE);
        
        if (!product) {
          console.error('[IAP] Product not found');
          toast.error("Produto não encontrado");
          setIsProcessing(false);
          return false;
        }

        console.log('[IAP] Ordering product:', product);
        
        // Order the product - this opens Apple's payment sheet
        await store.order(product);
        
        return true;
      } else {
        // Web fallback - direct subscription (for testing/web version)
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
      toast.error(error.message || "Erro ao processar compra");
      setIsProcessing(false);
      return false;
    }
  }, [isNative, activateSubscription]);

  const restorePurchases = useCallback(async (): Promise<boolean> => {
    setIsProcessing(true);

    try {
      if (isNative && Capacitor.getPlatform() === 'ios' && window.CdvPurchase?.store) {
        const store = window.CdvPurchase.store;
        const Platform = window.CdvPurchase.Platform;

        console.log('[IAP] Restoring purchases...');

        // Initialize if not already
        await store.initialize([Platform.APPLE_APPSTORE]);
        
        // Restore purchases
        await store.restorePurchases();

        // Check if product is owned
        const product = store.get(PREMIUM_PRODUCT_ID, Platform.APPLE_APPSTORE);
        
        if (product?.owned) {
          const activated = await activateSubscription();
          if (activated) {
            toast.success("Assinatura restaurada com sucesso!");
            setIsProcessing(false);
            return true;
          }
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
  }, [isNative, activateSubscription]);

  return {
    purchasePremium,
    isProcessing,
    restorePurchases,
    isNative
  };
};
