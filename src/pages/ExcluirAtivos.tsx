import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Loader2, Trash2, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePortfolio } from "@/contexts/PortfolioContext";
import { useTheme } from "@/hooks/useTheme";
import { notifyInvestmentDeleted } from "@/lib/notifications";
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

interface Investment {
  id: string;
  asset_name: string;
  asset_type: string;
  ticker: string | null;
  current_value: number;
  total_invested: number;
  portfolio_id: string;
}

interface Portfolio {
  id: string;
  name: string;
}

const ExcluirAtivos = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { refreshPortfolios } = usePortfolio();
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  
  // Data
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");

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
          .select("id, name")
          .eq("user_id", session.user.id),
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

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredInvestments.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredInvestments.map(inv => inv.id)));
    }
  };

  const handleDelete = async () => {
    if (selectedIds.size === 0) return;
    
    setDeleting(true);
    try {
      const idsToDelete = Array.from(selectedIds);
      
      const { error } = await supabase
        .from("investments")
        .delete()
        .in("id", idsToDelete);

      if (error) throw error;

      // Create notification
      const deletedNames = investments
        .filter(inv => selectedIds.has(inv.id))
        .map(inv => inv.asset_name)
        .slice(0, 3)
        .join(', ');
      await notifyInvestmentDeleted(deletedNames, idsToDelete.length);

      toast.success(`${idsToDelete.length} ativo(s) excluído(s) com sucesso!`);
      setConfirmDialogOpen(false);
      await refreshPortfolios();
      navigate("/app");
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Erro ao excluir ativos");
    } finally {
      setDeleting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const getPortfolioName = (portfolioId: string) => {
    return portfolios.find(p => p.id === portfolioId)?.name || "Carteira";
  };

  const totalSelectedValue = investments
    .filter(inv => selectedIds.has(inv.id))
    .reduce((sum, inv) => sum + inv.current_value, 0);

  const themeClass = theme === "light" ? "light-theme" : "";

  if (loading) {
    return (
      <div className={`${themeClass} min-h-screen bg-background flex items-center justify-center`}>
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className={`${themeClass} min-h-screen bg-background pb-24`}>
      {/* Header */}
      <header className="flex items-center gap-4 px-4 py-4 border-b border-border safe-area-inset-top">
        <button
          onClick={() => navigate("/app")}
          className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="font-semibold text-foreground">Excluir Ativos</h1>
          <p className="text-sm text-muted-foreground">
            {selectedIds.size > 0 
              ? `${selectedIds.size} selecionado(s)` 
              : "Selecione os ativos para excluir"
            }
          </p>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Search and Select All */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar ativo..."
              className="w-full pl-12 pr-4 py-3 bg-muted rounded-2xl text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <button
            onClick={toggleSelectAll}
            className="px-4 py-3 bg-muted rounded-2xl text-sm font-medium text-foreground"
          >
            {selectedIds.size === filteredInvestments.length ? "Limpar" : "Todos"}
          </button>
        </div>

        {/* Investment List */}
        <div className="space-y-3">
          {filteredInvestments.length > 0 ? (
            filteredInvestments.map((inv) => {
              const isSelected = selectedIds.has(inv.id);
              return (
                <motion.button
                  key={inv.id}
                  onClick={() => toggleSelection(inv.id)}
                  className={`w-full rounded-2xl p-4 text-left transition-all ${
                    isSelected 
                      ? "bg-red-500/10 border-2 border-red-500" 
                      : "bg-card border border-border"
                  }`}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      isSelected 
                        ? "bg-red-500 border-red-500" 
                        : "border-muted-foreground"
                    }`}>
                      {isSelected && <Check className="w-4 h-4 text-white" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{inv.asset_name}</p>
                      <p className="text-sm text-muted-foreground">{getPortfolioName(inv.portfolio_id)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">{formatCurrency(inv.current_value)}</p>
                      <p className="text-sm text-muted-foreground">{inv.asset_type}</p>
                    </div>
                  </div>
                </motion.button>
              );
            })
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhum ativo encontrado</p>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Bottom Action */}
      {selectedIds.size > 0 && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border safe-area-inset-bottom"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-muted-foreground">Total a excluir</p>
              <p className="text-lg font-semibold text-foreground">{formatCurrency(totalSelectedValue)}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              {selectedIds.size} ativo(s)
            </p>
          </div>
          <button
            onClick={() => setConfirmDialogOpen(true)}
            className="w-full bg-red-500 text-white rounded-2xl p-4 font-semibold flex items-center justify-center gap-2"
          >
            <Trash2 className="w-5 h-5" />
            Excluir Selecionados
          </button>
        </motion.div>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent className={themeClass}>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão?</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a excluir {selectedIds.size} ativo(s) com valor total de{" "}
              <strong>{formatCurrency(totalSelectedValue)}</strong>.
              <br /><br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ExcluirAtivos;
