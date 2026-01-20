import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Subscription {
  id: string;
  user_id: string;
  status: string;
  plan: string;
  price_monthly: number;
  current_period_start: string | null;
  current_period_end: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
}

export const useSubscription = () => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  const fetchSubscription = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setSubscription(null);
        setIsPremium(false);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching subscription:", error);
        setSubscription(null);
        setIsPremium(false);
      } else {
        setSubscription(data);
        
        // Check if subscription is active and not expired
        const isActive = data?.status === "active";
        const notExpired = !data?.current_period_end || 
          new Date(data.current_period_end) > new Date();
        
        setIsPremium(isActive && notExpired);
      }
    } catch (error) {
      console.error("Error in fetchSubscription:", error);
      setSubscription(null);
      setIsPremium(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscription();

    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(() => {
      fetchSubscription();
    });

    return () => {
      authSubscription.unsubscribe();
    };
  }, [fetchSubscription]);

  return {
    subscription,
    isPremium,
    isLoading,
    refetch: fetchSubscription,
  };
};
