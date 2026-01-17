import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Portfolio {
  id: string;
  name: string;
  total_value: number;
  total_gain: number;
  cdi_percent: number;
}

interface PortfolioContextType {
  portfolios: Portfolio[];
  selectedPortfolioId: string | null;
  setSelectedPortfolioId: (id: string | null) => void;
  activePortfolio: Portfolio | null;
  loading: boolean;
  refreshPortfolios: () => Promise<void>;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export const PortfolioProvider = ({ children }: { children: ReactNode }) => {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPortfolios = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("portfolios")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedPortfolios = (data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        total_value: Number(p.total_value) || 0,
        total_gain: Number(p.total_gain) || 0,
        cdi_percent: Number(p.cdi_percent) || 0,
      }));

      setPortfolios(formattedPortfolios);

      // Set first portfolio as default if none selected
      if (!selectedPortfolioId && formattedPortfolios.length > 0) {
        setSelectedPortfolioId(formattedPortfolios[0].id);
      }
    } catch (error) {
      console.error("Error fetching portfolios:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolios();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        fetchPortfolios();
      } else if (event === "SIGNED_OUT") {
        setPortfolios([]);
        setSelectedPortfolioId(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const activePortfolio = portfolios.find(p => p.id === selectedPortfolioId) || null;

  return (
    <PortfolioContext.Provider
      value={{
        portfolios,
        selectedPortfolioId,
        setSelectedPortfolioId,
        activePortfolio,
        loading,
        refreshPortfolios: fetchPortfolios,
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
};

export const usePortfolio = () => {
  const context = useContext(PortfolioContext);
  if (context === undefined) {
    throw new Error("usePortfolio must be used within a PortfolioProvider");
  }
  return context;
};
