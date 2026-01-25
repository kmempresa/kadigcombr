import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Loader2, Check, Minus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePortfolio } from "@/contexts/PortfolioContext";
import { useTheme } from "@/hooks/useTheme";

interface Investment {
  id: string;
  asset_name: string;
  asset_type: string;
  ticker: string | null;
  current_value: number;
  total_invested: number;
  quantity: number | null;
  purchase_price: number | null;
  portfolio_id: string;
}

const AdicionarResgate = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { refreshPortfolios } = usePortfolio();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Data
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Form data
  const [redeemValue, setRedeemValue] = useState("");
  const [redeemQuantity, setRedeemQuantity] = useState("");
  const [redeemPrice, setRedeemPrice] = useState("");
  const [redeemDate, setRedeemDate] = useState("");
  const [redeemType, setRedeemType] = useState<"parcial" | "total">("parcial");

  useEffect(() => {
    const fetchInvestments = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("investments")
        .select("*")
        .eq("user_id", session.user.id)
        .order("asset_name");

      if (error) {
        toast.error("Erro ao carregar investimentos");
        return;
      }

      setInvestments(data || []);
      setLoading(false);
    };

    fetchInvestments();
  }, [navigate]);

  const filteredInvestments = investments.filter(inv =>
    inv.asset_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (inv.ticker && inv.ticker.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSelectInvestment = (inv: Investment) => {
    setSelectedInvestment(inv);
    if (inv.purchase_price) {
      setRedeemPrice(inv.purchase_price.toString());
    }
    setStep(2);
  };

  const handleTotalRedeem = () => {
    if (!selectedInvestment) return;
    setRedeemType("total");
    setRedeemQuantity(selectedInvestment.quantity?.toString() || "0");
    setRedeemValue(selectedInvestment.current_value.toString());
  };

  const handleSave = async () => {
    if (!selectedInvestment) return;
    
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Get portfolio name
      const portfolio = await supabase
        .from("portfolios")
        .select("name")
        .eq("id", selectedInvestment.portfolio_id)
        .maybeSingle();

      const redeemQty = parseFloat(redeemQuantity) || selectedInvestment.quantity || 0;
      const redeemVal = parseFloat(redeemValue) || selectedInvestment.current_value;
      const actualUnitPrice = redeemQty > 0 ? redeemVal / redeemQty : parseFloat(redeemPrice) || 0;

      if (redeemType === "total") {
        // Delete the investment completely
        const { error } = await supabase
          .from("investments")
          .delete()
          .eq("id", selectedInvestment.id);

        if (error) throw error;

        // Register movement
        await supabase.from("movements").insert({
          user_id: session.user.id,
          portfolio_id: selectedInvestment.portfolio_id,
          investment_id: null,
          type: "resgate",
          asset_name: selectedInvestment.asset_name,
          ticker: selectedInvestment.ticker,
          asset_type: selectedInvestment.asset_type,
          quantity: selectedInvestment.quantity || 0,
          unit_price: selectedInvestment.quantity > 0 
            ? selectedInvestment.current_value / selectedInvestment.quantity 
            : parseFloat(redeemPrice) || 0,
          total_value: selectedInvestment.current_value,
          portfolio_name: portfolio.data?.name || "Carteira",
          notes: "Resgate total",
          movement_date: redeemDate || new Date().toISOString().split("T")[0],
        });

        toast.success("Resgate total realizado! Ativo removido da carteira.");
      } else {
        // Partial redeem - calculate proportionally
        const originalQuantity = selectedInvestment.quantity || 1;
        const originalTotalInvested = selectedInvestment.total_invested || 0;
        const originalCurrentValue = selectedInvestment.current_value || 0;
        const currentPrice = selectedInvestment.current_value / originalQuantity;
        
        const newQuantity = Math.max(0, originalQuantity - redeemQty);
        
        // Calculate proportional reduction
        const redeemRatio = redeemQty / originalQuantity;
        const newTotalInvested = Math.max(0, originalTotalInvested * (1 - redeemRatio));
        const newCurrentValue = Math.max(0, originalCurrentValue - redeemVal);
        
        // Recalculate gain percent based on actual values
        const gainPercent = newTotalInvested > 0 ? ((newCurrentValue - newTotalInvested) / newTotalInvested) * 100 : 0;

        if (newQuantity <= 0 || newCurrentValue <= 0) {
          // If nothing left, delete
          const { error } = await supabase
            .from("investments")
            .delete()
            .eq("id", selectedInvestment.id);

          if (error) throw error;

          await supabase.from("movements").insert({
            user_id: session.user.id,
            portfolio_id: selectedInvestment.portfolio_id,
            investment_id: null,
            type: "resgate",
            asset_name: selectedInvestment.asset_name,
            ticker: selectedInvestment.ticker,
            asset_type: selectedInvestment.asset_type,
            quantity: redeemQty,
            unit_price: actualUnitPrice,
            total_value: redeemVal,
            portfolio_name: portfolio.data?.name || "Carteira",
            notes: "Resgate completo",
            movement_date: redeemDate || new Date().toISOString().split("T")[0],
          });

          toast.success("Resgate completo! Ativo removido da carteira.");
        } else {
          const { error } = await supabase
            .from("investments")
            .update({
              quantity: newQuantity,
              total_invested: newTotalInvested,
              current_value: newCurrentValue,
              current_price: newQuantity > 0 ? newCurrentValue / newQuantity : currentPrice,
              gain_percent: gainPercent,
              updated_at: new Date().toISOString(),
            })
            .eq("id", selectedInvestment.id);

          if (error) throw error;

          await supabase.from("movements").insert({
            user_id: session.user.id,
            portfolio_id: selectedInvestment.portfolio_id,
            investment_id: selectedInvestment.id,
            type: "resgate",
            asset_name: selectedInvestment.asset_name,
            ticker: selectedInvestment.ticker,
            asset_type: selectedInvestment.asset_type,
            quantity: redeemQty,
            unit_price: actualUnitPrice,
            total_value: redeemVal,
            portfolio_name: portfolio.data?.name || "Carteira",
            notes: "Resgate parcial",
            movement_date: redeemDate || new Date().toISOString().split("T")[0],
          });

          toast.success("Resgate parcial realizado com sucesso!");
        }
      }

      await refreshPortfolios();
      navigate("/app");
    } catch (error) {
      console.error("Error saving redemption:", error);
      toast.error("Erro ao salvar resgate");
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const themeClass = theme === "light" ? "light-theme" : "";

  if (loading) {
    return (
      <div className={`${themeClass} min-h-screen bg-background flex items-center justify-center`}>
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className={`${themeClass} min-h-screen bg-background`}>
      {/* Header */}
      <header className="flex items-center gap-4 px-4 py-4 border-b border-border safe-area-inset-top">
        <button
          onClick={() => step > 1 ? setStep(step - 1) : navigate("/app")}
          className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="font-semibold text-foreground">Novo Resgate</h1>
          <p className="text-sm text-muted-foreground">Passo {step} de 2</p>
        </div>
      </header>

      {/* Progress */}
      <div className="h-1 bg-muted">
        <motion.div
          className="h-full bg-orange-500"
          initial={{ width: 0 }}
          animate={{ width: `${(step / 2) * 100}%` }}
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
              Escolha o ativo do qual deseja resgatar
            </p>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar ativo..."
                className="w-full pl-12 pr-4 py-3 bg-muted rounded-2xl text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Investment List */}
            <div className="space-y-3">
              {filteredInvestments.length > 0 ? (
                filteredInvestments.map((inv) => (
                  <button
                    key={inv.id}
                    onClick={() => handleSelectInvestment(inv)}
                    className="w-full bg-card border border-border rounded-2xl p-4 text-left active:scale-[0.98] transition-transform"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">{inv.asset_name}</p>
                        <p className="text-sm text-muted-foreground">{inv.asset_type}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">{formatCurrency(inv.current_value)}</p>
                        <p className="text-sm text-muted-foreground">
                          {inv.quantity} unidades
                        </p>
                      </div>
                    </div>
                  </button>
                ))
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
            <h2 className="text-lg font-semibold text-foreground">Dados do resgate</h2>
            
            {/* Selected Asset Info */}
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4">
              <p className="font-medium text-foreground">{selectedInvestment.asset_name}</p>
              <p className="text-sm text-muted-foreground">Saldo atual: {formatCurrency(selectedInvestment.current_value)}</p>
              <p className="text-sm text-muted-foreground">Quantidade: {selectedInvestment.quantity} unidades</p>
            </div>

            {/* Redeem Type */}
            <div className="flex gap-3">
              <button
                onClick={() => setRedeemType("parcial")}
                className={`flex-1 p-4 rounded-2xl border text-center transition-all ${
                  redeemType === "parcial" 
                    ? "bg-orange-500/10 border-orange-500" 
                    : "bg-card border-border"
                }`}
              >
                <span className="font-medium text-foreground">Resgate Parcial</span>
              </button>
              <button
                onClick={handleTotalRedeem}
                className={`flex-1 p-4 rounded-2xl border text-center transition-all ${
                  redeemType === "total" 
                    ? "bg-orange-500/10 border-orange-500" 
                    : "bg-card border-border"
                }`}
              >
                <span className="font-medium text-foreground">Resgate Total</span>
              </button>
            </div>

            {/* Form */}
            {redeemType === "parcial" && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Valor do resgate (R$)</label>
                  <input
                    type="number"
                    value={redeemValue}
                    onChange={(e) => setRedeemValue(e.target.value)}
                    placeholder="0,00"
                    className="w-full bg-muted rounded-2xl p-4 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Quantidade</label>
                  <input
                    type="number"
                    value={redeemQuantity}
                    onChange={(e) => setRedeemQuantity(e.target.value)}
                    placeholder="0"
                    max={selectedInvestment.quantity || 0}
                    className="w-full bg-muted rounded-2xl p-4 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Preço de venda (R$)</label>
                  <input
                    type="number"
                    value={redeemPrice}
                    onChange={(e) => setRedeemPrice(e.target.value)}
                    placeholder="0,00"
                    className="w-full bg-muted rounded-2xl p-4 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Data do resgate</label>
                  <input
                    type="date"
                    value={redeemDate}
                    onChange={(e) => setRedeemDate(e.target.value)}
                    className="w-full bg-muted rounded-2xl p-4 text-foreground outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            )}

            {redeemType === "total" && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
                <p className="text-sm text-red-600">
                  ⚠️ Ao confirmar o resgate total, este ativo será removido da sua carteira.
                </p>
              </div>
            )}

            {/* Summary */}
            {redeemValue && redeemType === "parcial" && (
              <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
                <h3 className="font-medium text-foreground">Resumo</h3>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Saldo restante:</span>
                  <span className="text-foreground font-medium">
                    {formatCurrency(Math.max(0, (selectedInvestment.current_value || 0) - parseFloat(redeemValue || "0")))}
                  </span>
                </div>
              </div>
            )}

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving || (redeemType === "parcial" && !redeemValue)}
              className="w-full bg-orange-500 text-white rounded-2xl p-4 font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Confirmar Resgate
                </>
              )}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AdicionarResgate;
