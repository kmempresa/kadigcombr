import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Loader2, Check, Plus } from "lucide-react";
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

const AdicionarAplicacao = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { selectedPortfolioId, refreshPortfolios } = usePortfolio();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Data
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Form data
  const [applicationValue, setApplicationValue] = useState("");
  const [applicationQuantity, setApplicationQuantity] = useState("");
  const [applicationPrice, setApplicationPrice] = useState("");
  const [applicationDate, setApplicationDate] = useState("");

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
    // Pre-fill price if available
    if (inv.purchase_price) {
      setApplicationPrice(inv.purchase_price.toString());
    }
    setStep(2);
  };

  const handleSave = async () => {
    if (!selectedInvestment) return;
    
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const appQty = parseFloat(applicationQuantity) || 0;
      const appVal = parseFloat(applicationValue) || 0;
      const appPrice = parseFloat(applicationPrice) || selectedInvestment.purchase_price || 0;
      
      const originalQty = selectedInvestment.quantity || 0;
      const originalTotalInvested = selectedInvestment.total_invested || 0;
      const originalCurrentValue = selectedInvestment.current_value || 0;
      
      const newQuantity = originalQty + appQty;
      const newTotalInvested = originalTotalInvested + appVal;
      
      // Add value to current value (proportionally)
      const newCurrentValue = originalCurrentValue + (appQty * appPrice);
      const gainPercent = newTotalInvested > 0 ? ((newCurrentValue - newTotalInvested) / newTotalInvested) * 100 : 0;

      // Update investment with new current_price as weighted average
      const newCurrentPrice = newQuantity > 0 ? newCurrentValue / newQuantity : appPrice;
      
      const { error: updateError } = await supabase
        .from("investments")
        .update({
          quantity: newQuantity,
          total_invested: newTotalInvested,
          current_value: newCurrentValue,
          current_price: newCurrentPrice,
          gain_percent: gainPercent,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedInvestment.id);

      if (updateError) throw updateError;

      // Get portfolio name for movement record
      const portfolio = await supabase
        .from("portfolios")
        .select("name")
        .eq("id", selectedInvestment.portfolio_id)
        .maybeSingle();

      // Register movement
      const { error: movementError } = await supabase
        .from("movements")
        .insert({
          user_id: session.user.id,
          portfolio_id: selectedInvestment.portfolio_id,
          investment_id: selectedInvestment.id,
          type: "aplicacao",
          asset_name: selectedInvestment.asset_name,
          ticker: selectedInvestment.ticker,
          asset_type: selectedInvestment.asset_type,
          quantity: parseFloat(applicationQuantity) || 0,
          unit_price: parseFloat(applicationPrice) || 0,
          total_value: parseFloat(applicationValue) || 0,
          portfolio_name: portfolio.data?.name || "Carteira",
          movement_date: applicationDate || new Date().toISOString().split("T")[0],
        });

      if (movementError) console.error("Error saving movement:", movementError);

      toast.success("Aplicação adicionada com sucesso!");
      await refreshPortfolios();
      navigate("/app");
    } catch (error) {
      console.error("Error saving application:", error);
      toast.error("Erro ao salvar aplicação");
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
          <h1 className="font-semibold text-foreground">Nova Aplicação</h1>
          <p className="text-sm text-muted-foreground">Passo {step} de 2</p>
        </div>
      </header>

      {/* Progress */}
      <div className="h-1 bg-muted">
        <motion.div
          className="h-full bg-primary"
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
              Escolha o ativo em que deseja adicionar uma nova aplicação
            </p>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar ativo..."
                className="w-full pl-12 pr-4 py-3 bg-muted rounded-2xl text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary"
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
            <h2 className="text-lg font-semibold text-foreground">Dados da aplicação</h2>
            
            {/* Selected Asset Info */}
            <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4">
              <p className="font-medium text-foreground">{selectedInvestment.asset_name}</p>
              <p className="text-sm text-muted-foreground">Saldo atual: {formatCurrency(selectedInvestment.current_value)}</p>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Valor da aplicação (R$)</label>
                <input
                  type="number"
                  value={applicationValue}
                  onChange={(e) => setApplicationValue(e.target.value)}
                  placeholder="0,00"
                  className="w-full bg-muted rounded-2xl p-4 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Quantidade</label>
                <input
                  type="number"
                  value={applicationQuantity}
                  onChange={(e) => setApplicationQuantity(e.target.value)}
                  placeholder="0"
                  className="w-full bg-muted rounded-2xl p-4 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Preço unitário (R$)</label>
                <input
                  type="number"
                  value={applicationPrice}
                  onChange={(e) => setApplicationPrice(e.target.value)}
                  placeholder="0,00"
                  className="w-full bg-muted rounded-2xl p-4 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Data da aplicação</label>
                <input
                  type="date"
                  value={applicationDate}
                  onChange={(e) => setApplicationDate(e.target.value)}
                  className="w-full bg-muted rounded-2xl p-4 text-foreground outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Summary */}
            {applicationValue && (
              <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
                <h3 className="font-medium text-foreground">Resumo</h3>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Novo total investido:</span>
                  <span className="text-foreground font-medium">
                    {formatCurrency((selectedInvestment.total_invested || 0) + parseFloat(applicationValue || "0"))}
                  </span>
                </div>
              </div>
            )}

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving || !applicationValue}
              className="w-full bg-primary text-primary-foreground rounded-2xl p-4 font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Confirmar Aplicação
                </>
              )}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AdicionarAplicacao;
