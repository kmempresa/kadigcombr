import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Capacitor } from '@capacitor/core';

// Product ID for Apple/Google In-App Purchase
const PREMIUM_PRODUCT_ID = 'kadig.premium';

interface UsePurchaseResult {
  purchasePremium: () => Promise<boolean>;
  isProcessing: boolean;
  restorePurchases: () => Promise<boolean>;
  isNative: boolean;
}

// Dynamic import type for the plugin
type CapacitorPurchasesType = typeof import('@capgo/capacitor-purchases').CapacitorPurchases;
let CapacitorPurchases: CapacitorPurchasesType | null = null;

const loadPurchasesPlugin = async (): Promise<boolean> => {
  if (Capacitor.isNativePlatform()) {
    try {
      const module = await import('@capgo/capacitor-purchases');
      CapacitorPurchases = module.CapacitorPurchases;
      return true;
    } catch (error) {
      console.warn('Capacitor Purchases plugin not available:', error);
      return false;
    }
  }
  return false;
};

export const useApplePurchase = (): UsePurchaseResult => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [pluginLoaded, setPluginLoaded] = useState(false);

  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    if (isNative) {
      loadPurchasesPlugin().then(setPluginLoaded);
    }
  }, [isNative]);

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
      if (isNative && pluginLoaded && CapacitorPurchases) {
        // Native iOS/Android - use Capacitor Purchases (RevenueCat)
        try {
          // Get available offerings from RevenueCat
          const offeringsResult = await CapacitorPurchases.getOfferings();
          const offerings = offeringsResult?.offerings;
          console.log('Offerings:', offerings);
          
          // Find the current offering
          const currentOffering = offerings?.current;
          
          if (!currentOffering) {
            toast.error("Nenhuma oferta disponível");
            setIsProcessing(false);
            return false;
          }

          // Find the package to purchase (monthly or the first available)
          let packageToPurchase = currentOffering.monthly || 
                                   currentOffering.availablePackages?.[0];

          // Or find by product identifier
          if (!packageToPurchase) {
            packageToPurchase = currentOffering.availablePackages?.find(
              pkg => pkg.product?.identifier === PREMIUM_PRODUCT_ID
            ) || null;
          }

          if (!packageToPurchase) {
            toast.error("Produto não encontrado");
            setIsProcessing(false);
            return false;
          }

          // Make the purchase
          const result = await CapacitorPurchases.purchasePackage({
            identifier: packageToPurchase.identifier,
            offeringIdentifier: currentOffering.identifier,
          });

          console.log('Purchase successful:', result);
          
          // Activate subscription in Supabase
          const activated = await activateSubscription();
          if (activated) {
            toast.success("🎉 Bem-vindo ao Kadig Premium!");
            setIsProcessing(false);
            return true;
          }

          toast.error("Erro ao ativar assinatura");
          setIsProcessing(false);
          return false;
        } catch (purchaseError: any) {
          console.error('Purchase error:', purchaseError);
          
          // Handle common error cases
          const errorMessage = purchaseError?.message || '';
          const errorCode = purchaseError?.code;
          
          if (errorMessage.includes('cancelled') || errorMessage.includes('canceled') || errorCode === 1) {
            toast.info("Compra cancelada");
          } else if (errorMessage.includes('already owned') || errorCode === 6) {
            // User already has the subscription - activate it
            const activated = await activateSubscription();
            if (activated) {
              toast.success("Assinatura ativada!");
              setIsProcessing(false);
              return true;
            }
          } else {
            toast.error(errorMessage || "Erro na compra");
          }
          
          setIsProcessing(false);
          return false;
        }
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
  }, [isNative, pluginLoaded, activateSubscription]);

  const restorePurchases = useCallback(async (): Promise<boolean> => {
    setIsProcessing(true);

    try {
      if (isNative && pluginLoaded && CapacitorPurchases) {
        try {
          const result = await CapacitorPurchases.restorePurchases();
          console.log('Restore result:', result);

          // Check if user has active entitlements
          const customerInfo = result?.customerInfo;
          const activeEntitlements = customerInfo?.entitlements?.active;
          
          if (activeEntitlements && Object.keys(activeEntitlements).length > 0) {
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
        } catch (restoreError: any) {
          console.error('Restore error:', restoreError);
          toast.error(restoreError.message || "Erro ao restaurar");
          setIsProcessing(false);
          return false;
        }
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
  }, [isNative, pluginLoaded, activateSubscription]);

  return {
    purchasePremium,
    isProcessing,
    restorePurchases,
    isNative
  };
};
