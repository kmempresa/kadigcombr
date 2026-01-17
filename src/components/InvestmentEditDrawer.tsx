import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Trash2, Save, AlertTriangle } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Investment {
  id: string;
  asset_name: string;
  asset_type: string;
  ticker: string | null;
  current_value: number;
  total_invested: number;
  gain_percent: number;
  quantity?: number;
  purchase_price?: number;
  current_price?: number;
  maturity_date?: string;
}

interface InvestmentEditDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investment: Investment | null;
  onSuccess: () => void;
}

const InvestmentEditDrawer = ({
  open,
  onOpenChange,
  investment,
  onSuccess,
}: InvestmentEditDrawerProps) => {
  const [quantity, setQuantity] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [currentPrice, setCurrentPrice] = useState("");
  const [totalInvested, setTotalInvested] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (investment) {
      setQuantity(investment.quantity?.toString() || "1");
      setPurchasePrice(investment.purchase_price?.toString() || investment.total_invested.toString());
      setCurrentPrice(investment.current_price?.toString() || investment.current_value.toString());
      setTotalInvested(investment.total_invested.toString());
    }
  }, [investment]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const recalculatePortfolioTotals = async (userId: string, portfolioId: string) => {
    // Fetch all investments for this portfolio
    const { data: investments } = await supabase
      .from("investments")
      .select("current_value, total_invested, gain_percent")
      .eq("portfolio_id", portfolioId);

    if (!investments) return;

    // Calculate new totals
    let newTotalValue = 0;
    let newTotalInvested = 0;

    investments.forEach((inv) => {
      newTotalValue += Number(inv.current_value) || 0;
      newTotalInvested += Number(inv.total_invested) || 0;
    });

    const newTotalGain = newTotalValue - newTotalInvested;
    const newCdiPercent = newTotalInvested > 0 ? ((newTotalGain / newTotalInvested) * 100) : 0;

    // Update portfolio
    await supabase
      .from("portfolios")
      .update({
        total_value: newTotalValue,
        total_gain: newTotalGain,
        cdi_percent: newCdiPercent,
      })
      .eq("id", portfolioId);
  };

  const handleSave = async () => {
    if (!investment) return;

    setLoading(true);
    try {
      const qty = parseFloat(quantity) || 1;
      const price = parseFloat(purchasePrice) || 0;
      const currPrice = parseFloat(currentPrice) || price;
      const invested = parseFloat(totalInvested) || qty * price;
      const currentVal = qty * currPrice;
      const gainPercent = invested > 0 ? ((currentVal - invested) / invested) * 100 : 0;

      // Get portfolio_id and user_id
      const { data: invData } = await supabase
        .from("investments")
        .select("portfolio_id, user_id")
        .eq("id", investment.id)
        .single();

      if (!invData) throw new Error("Investment not found");

      // Update investment
      const { error } = await supabase
        .from("investments")
        .update({
          quantity: qty,
          purchase_price: price,
          current_price: currPrice,
          total_invested: invested,
          current_value: currentVal,
          gain_percent: gainPercent,
          updated_at: new Date().toISOString(),
        })
        .eq("id", investment.id);

      if (error) throw error;

      // Recalculate portfolio totals
      await recalculatePortfolioTotals(invData.user_id, invData.portfolio_id);

      toast.success("Investimento atualizado com sucesso!");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating investment:", error);
      toast.error("Erro ao atualizar investimento");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!investment) return;

    setLoading(true);
    try {
      // Get portfolio_id and user_id before deleting
      const { data: invData } = await supabase
        .from("investments")
        .select("portfolio_id, user_id")
        .eq("id", investment.id)
        .single();

      if (!invData) throw new Error("Investment not found");

      // Delete investment
      const { error } = await supabase
        .from("investments")
        .delete()
        .eq("id", investment.id);

      if (error) throw error;

      // Recalculate portfolio totals
      await recalculatePortfolioTotals(invData.user_id, invData.portfolio_id);

      toast.success("Investimento excluído com sucesso!");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error deleting investment:", error);
      toast.error("Erro ao excluir investimento");
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!investment) return null;

  // Calculate preview values
  const qty = parseFloat(quantity) || 1;
  const currPrice = parseFloat(currentPrice) || 0;
  const invested = parseFloat(totalInvested) || 0;
  const previewCurrentValue = qty * currPrice;
  const previewGain = previewCurrentValue - invested;
  const previewGainPercent = invested > 0 ? ((previewGain / invested) * 100) : 0;

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="light-theme bg-background max-h-[90vh]">
          <DrawerHeader className="border-b border-border px-4 py-3">
            <div className="flex items-center justify-between">
              <DrawerTitle className="font-semibold text-foreground">
                Editar {investment.asset_name}
              </DrawerTitle>
              <button
                onClick={() => onOpenChange(false)}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Asset Info */}
            <div className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-lg font-bold text-primary">
                    {investment.ticker?.slice(0, 2) || investment.asset_name.slice(0, 2)}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">{investment.asset_name}</p>
                  <p className="text-sm text-muted-foreground">{investment.asset_type}</p>
                  {investment.ticker && (
                    <p className="text-xs text-primary">{investment.ticker}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-3">
              <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
                <span className="text-foreground text-sm">Quantidade:</span>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="bg-transparent text-right text-foreground font-medium text-sm border-none outline-none w-24"
                  step="0.01"
                />
              </div>

              <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
                <span className="text-foreground text-sm">Preço de compra:</span>
                <input
                  type="number"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  className="bg-transparent text-right text-foreground font-medium text-sm border-none outline-none w-32"
                  step="0.01"
                />
              </div>

              <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
                <span className="text-foreground text-sm">Preço atual:</span>
                <input
                  type="number"
                  value={currentPrice}
                  onChange={(e) => setCurrentPrice(e.target.value)}
                  className="bg-transparent text-right text-foreground font-medium text-sm border-none outline-none w-32"
                  step="0.01"
                />
              </div>

              <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
                <span className="text-foreground text-sm">Total investido:</span>
                <input
                  type="number"
                  value={totalInvested}
                  onChange={(e) => setTotalInvested(e.target.value)}
                  className="bg-transparent text-right text-foreground font-medium text-sm border-none outline-none w-32"
                  step="0.01"
                />
              </div>
            </div>

            {/* Preview Card */}
            <div className="bg-muted/50 border border-border rounded-2xl p-4 space-y-3">
              <h4 className="font-semibold text-foreground text-sm">Prévia das alterações</h4>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Valor atual:</span>
                  <span className="font-medium text-foreground">{formatCurrency(previewCurrentValue)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Resultado:</span>
                  <span className={`font-medium ${previewGain >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                    {previewGain >= 0 ? "+" : ""}{formatCurrency(previewGain)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Rentabilidade:</span>
                  <span className={`font-medium ${previewGainPercent >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                    {previewGainPercent >= 0 ? "+" : ""}{previewGainPercent.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Delete Button */}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl p-4 flex items-center justify-center gap-2 hover:bg-red-500/20 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
              <span className="font-medium">Excluir investimento</span>
            </button>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border flex gap-3">
            <button
              onClick={() => onOpenChange(false)}
              className="flex-1 h-12 bg-muted text-foreground rounded-2xl font-medium hover:bg-muted/80 transition-colors"
            >
              Cancelar
            </button>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={loading}
              className="flex-1 h-12 bg-primary text-primary-foreground rounded-2xl font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Salvar
                </>
              )}
            </motion.button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="light-theme">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Confirmar exclusão
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{investment.asset_name}</strong>?
              <br />
              Esta ação não pode ser desfeita e os valores da carteira serão recalculados automaticamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {loading ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default InvestmentEditDrawer;
