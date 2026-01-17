import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Loader2, Check, ArrowRightLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePortfolio } from "@/contexts/PortfolioContext";

interface Investment {
  id: string;
  asset_name: string;
  asset_type: string;
  ticker: string | null;
  current_value: number;
  total_invested: number;
  quantity: number | null;
  purchase_price: number | null;
  current_price: number | null;
  gain_percent: number | null;
  portfolio_id: string;
  maturity_date: string | null;
}

interface Portfolio {
  id: string;
  name: string;
  total_value: number;
}

const TransferirAtivo = () => {
  const navigate = useNavigate();
  const { refreshPortfolios } = usePortfolio();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Data
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  const [targetPortfolio, setTargetPortfolio] = useState<Portfolio | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Transfer options
  const [transferType, setTransferType] = useState<"mover" | "copiar">("mover");

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const [investmentsResult, portfoliosResult] = await Promise.all([
        supabase
          .from("investments")
          .select("*")
          .eq("user_id", session.user.id)
          .order("asset_name"),
        supabase
          .from("portfolios")
          .select("*")
          .eq("user_id", session.user.id)
          .order("name"),
      ]);

      if (investmentsResult.error || portfoliosResult.error) {
        toast.error("Erro ao carregar dados");
        return;
      }

      setInvestments(investmentsResult.data || []);
      setPortfolios(portfoliosResult.data || []);
      setLoading(false);
    };

    fetchData();
  }, [navigate]);

  const filteredInvestments = investments.filter(inv =>
    inv.asset_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (inv.ticker && inv.ticker.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const availablePortfolios = portfolios.filter(p => 
    selectedInvestment ? p.id !== selectedInvestment.portfolio_id : true
  );

  const handleSelectInvestment = (inv: Investment) => {
    setSelectedInvestment(inv);
    setStep(2);
  };

  const handleSelectPortfolio = (portfolio: Portfolio) => {
    setTargetPortfolio(portfolio);
    setStep(3);
  };

  const handleSave = async () => {
    if (!selectedInvestment || !targetPortfolio) return;
    
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const sourcePortfolioName = getSourcePortfolioName();

      if (transferType === "mover") {
        // Update the portfolio_id of the investment
        const { error } = await supabase
          .from("investments")
          .update({
            portfolio_id: targetPortfolio.id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", selectedInvestment.id);

        if (error) throw error;

        // Register exit movement
        await supabase.from("movements").insert({
          user_id: session.user.id,
          portfolio_id: selectedInvestment.portfolio_id,
          investment_id: selectedInvestment.id,
          type: "transferencia_saida",
          asset_name: selectedInvestment.asset_name,
          ticker: selectedInvestment.ticker,
          asset_type: selectedInvestment.asset_type,
          quantity: selectedInvestment.quantity || 0,
          unit_price: selectedInvestment.purchase_price || 0,
          total_value: selectedInvestment.current_value,
          portfolio_name: sourcePortfolioName,
          target_portfolio_name: targetPortfolio.name,
          notes: `Transferido para ${targetPortfolio.name}`,
          movement_date: new Date().toISOString().split("T")[0],
        });

        // Register entry movement
        await supabase.from("movements").insert({
          user_id: session.user.id,
          portfolio_id: targetPortfolio.id,
          investment_id: selectedInvestment.id,
          type: "transferencia_entrada",
          asset_name: selectedInvestment.asset_name,
          ticker: selectedInvestment.ticker,
          asset_type: selectedInvestment.asset_type,
          quantity: selectedInvestment.quantity || 0,
          unit_price: selectedInvestment.purchase_price || 0,
          total_value: selectedInvestment.current_value,
          portfolio_name: targetPortfolio.name,
          target_portfolio_name: sourcePortfolioName,
          notes: `Recebido de ${sourcePortfolioName}`,
          movement_date: new Date().toISOString().split("T")[0],
        });

        toast.success(`Ativo movido para ${targetPortfolio.name}!`);
      } else {
        // Create a copy in the target portfolio
        const { data: newInvestment, error } = await supabase
          .from("investments")
          .insert({
            user_id: session.user.id,
            portfolio_id: targetPortfolio.id,
            asset_name: selectedInvestment.asset_name,
            asset_type: selectedInvestment.asset_type,
            ticker: selectedInvestment.ticker,
            quantity: selectedInvestment.quantity,
            purchase_price: selectedInvestment.purchase_price,
            current_price: selectedInvestment.current_price,
            total_invested: selectedInvestment.total_invested,
            current_value: selectedInvestment.current_value,
            gain_percent: selectedInvestment.gain_percent,
            maturity_date: selectedInvestment.maturity_date,
          })
          .select()
          .single();

        if (error) throw error;

        // Register movement for copy
        await supabase.from("movements").insert({
          user_id: session.user.id,
          portfolio_id: targetPortfolio.id,
          investment_id: newInvestment?.id,
          type: "aplicacao",
          asset_name: selectedInvestment.asset_name,
          ticker: selectedInvestment.ticker,
          asset_type: selectedInvestment.asset_type,
          quantity: selectedInvestment.quantity || 0,
          unit_price: selectedInvestment.purchase_price || 0,
          total_value: selectedInvestment.current_value,
          portfolio_name: targetPortfolio.name,
          notes: `Copiado de ${sourcePortfolioName}`,
          movement_date: new Date().toISOString().split("T")[0],
        });

        toast.success(`Ativo copiado para ${targetPortfolio.name}!`);
      }

      await refreshPortfolios();
      navigate("/app");
    } catch (error) {
      console.error("Error transferring:", error);
      toast.error("Erro ao transferir ativo");
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const getSourcePortfolioName = () => {
    if (!selectedInvestment) return "";
    const portfolio = portfolios.find(p => p.id === selectedInvestment.portfolio_id);
    return portfolio?.name || "Carteira";
  };

  if (loading) {
    return (
      <div className="light-theme min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="light-theme min-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center gap-4 px-4 py-4 border-b border-border">
        <button
          onClick={() => step > 1 ? setStep(step - 1) : navigate("/app")}
          className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="font-semibold text-foreground">Transferir Ativo</h1>
          <p className="text-sm text-muted-foreground">Passo {step} de 3</p>
        </div>
      </header>

      {/* Progress */}
      <div className="h-1 bg-muted">
        <motion.div
          className="h-full bg-cyan-500"
          initial={{ width: 0 }}
          animate={{ width: `${(step / 3) * 100}%` }}
        />
      </div>

      <div className="p-4">
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <h2 className="text-lg font-semibold text-foreground">Selecione o ativo</h2>
            <p className="text-sm text-muted-foreground">
              Escolha o ativo que deseja transferir para outra carteira
            </p>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar ativo..."
                className="w-full pl-12 pr-4 py-3 bg-muted rounded-2xl text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            {/* Investment List */}
            <div className="space-y-3">
              {filteredInvestments.length > 0 ? (
                filteredInvestments.map((inv) => {
                  const portfolioName = portfolios.find(p => p.id === inv.portfolio_id)?.name || "Carteira";
                  return (
                    <button
                      key={inv.id}
                      onClick={() => handleSelectInvestment(inv)}
                      className="w-full bg-card border border-border rounded-2xl p-4 text-left active:scale-[0.98] transition-transform"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">{inv.asset_name}</p>
                          <p className="text-sm text-muted-foreground">{portfolioName}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-foreground">{formatCurrency(inv.current_value)}</p>
                          <ChevronRight className="w-5 h-5 text-muted-foreground ml-auto" />
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Nenhum ativo encontrado</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {step === 2 && selectedInvestment && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <h2 className="text-lg font-semibold text-foreground">Selecione a carteira destino</h2>
            
            {/* Selected Asset Info */}
            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-2xl p-4">
              <p className="font-medium text-foreground">{selectedInvestment.asset_name}</p>
              <p className="text-sm text-muted-foreground">De: {getSourcePortfolioName()}</p>
              <p className="text-sm text-muted-foreground">Valor: {formatCurrency(selectedInvestment.current_value)}</p>
            </div>

            {/* Transfer Type */}
            <div className="flex gap-3">
              <button
                onClick={() => setTransferType("mover")}
                className={`flex-1 p-4 rounded-2xl border text-center transition-all ${
                  transferType === "mover" 
                    ? "bg-cyan-500/10 border-cyan-500" 
                    : "bg-card border-border"
                }`}
              >
                <ArrowRightLeft className="w-5 h-5 mx-auto mb-2 text-foreground" />
                <span className="font-medium text-foreground">Mover</span>
                <p className="text-xs text-muted-foreground mt-1">Remove da carteira atual</p>
              </button>
              <button
                onClick={() => setTransferType("copiar")}
                className={`flex-1 p-4 rounded-2xl border text-center transition-all ${
                  transferType === "copiar" 
                    ? "bg-cyan-500/10 border-cyan-500" 
                    : "bg-card border-border"
                }`}
              >
                <ArrowRightLeft className="w-5 h-5 mx-auto mb-2 text-foreground" />
                <span className="font-medium text-foreground">Copiar</span>
                <p className="text-xs text-muted-foreground mt-1">Mantém em ambas carteiras</p>
              </button>
            </div>

            {/* Portfolio List */}
            <div className="space-y-3">
              {availablePortfolios.length > 0 ? (
                availablePortfolios.map((portfolio) => (
                  <button
                    key={portfolio.id}
                    onClick={() => handleSelectPortfolio(portfolio)}
                    className="w-full bg-card border border-border rounded-2xl p-4 text-left active:scale-[0.98] transition-transform"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">{portfolio.name}</p>
                        <p className="text-sm text-muted-foreground">{formatCurrency(portfolio.total_value)}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Nenhuma outra carteira disponível</p>
                  <button
                    onClick={() => navigate("/adicionar-carteira")}
                    className="mt-3 text-cyan-500 font-medium"
                  >
                    Criar nova carteira
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {step === 3 && selectedInvestment && targetPortfolio && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <h2 className="text-lg font-semibold text-foreground">Confirmar transferência</h2>
            
            {/* Summary */}
            <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 text-center">
                  <p className="text-sm text-muted-foreground">De</p>
                  <p className="font-medium text-foreground">{getSourcePortfolioName()}</p>
                </div>
                <ArrowRightLeft className="w-6 h-6 text-cyan-500" />
                <div className="flex-1 text-center">
                  <p className="text-sm text-muted-foreground">Para</p>
                  <p className="font-medium text-foreground">{targetPortfolio.name}</p>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <p className="font-medium text-foreground">{selectedInvestment.asset_name}</p>
                <p className="text-sm text-muted-foreground">{selectedInvestment.asset_type}</p>
                <p className="text-lg font-semibold text-foreground mt-2">
                  {formatCurrency(selectedInvestment.current_value)}
                </p>
              </div>

              <div className="bg-muted rounded-xl p-3">
                <p className="text-sm text-muted-foreground">
                  {transferType === "mover" 
                    ? "O ativo será removido da carteira de origem e adicionado à carteira destino."
                    : "Uma cópia do ativo será criada na carteira destino. O ativo original permanecerá na carteira de origem."
                  }
                </p>
              </div>
            </div>

            {/* Confirm Button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-cyan-500 text-white rounded-2xl p-4 font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Transferindo...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Confirmar {transferType === "mover" ? "Transferência" : "Cópia"}
                </>
              )}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default TransferirAtivo;
