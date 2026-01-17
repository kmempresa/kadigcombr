import { motion } from "framer-motion";
import { X, Plus, ChevronRight, ChevronDown, Check, Lock } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";

interface Portfolio {
  id: string;
  name: string;
  total_value: number;
  total_gain: number;
  cdi_percent: number;
  updated_at?: string;
  is_primary?: boolean;
  is_selected?: boolean;
}

interface PatrimonioDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  portfolios: Portfolio[];
  totalPatrimonio: number;
  totalInvestido: number;
  totalGanhos: number;
  showValues: boolean;
  selectedPortfolioId?: string | null;
  onAddPortfolio: () => void;
  onSelectPortfolio: (id: string) => void;
}

const PatrimonioDrawer = ({
  open,
  onOpenChange,
  userName,
  portfolios,
  totalPatrimonio,
  totalInvestido,
  totalGanhos,
  showValues,
  selectedPortfolioId,
  onAddPortfolio,
  onSelectPortfolio,
}: PatrimonioDrawerProps) => {
  const formatCurrency = (value: number) => {
    if (!showValues) return "R$ ••••••";
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const formatPercent = (value: number) => {
    if (!showValues) return "••%";
    return `${value.toFixed(2)}%`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  // Calculate rentabilidade
  const rentabilidade = totalInvestido > 0 
    ? ((totalPatrimonio - totalInvestido) / totalInvestido) * 100 
    : 0;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="light-theme bg-slate-50 max-h-[90vh]">
        <DrawerHeader className="border-b border-border bg-white px-4 py-3">
          <div className="flex items-center gap-2">
            <ChevronDown className="w-5 h-5 text-foreground" />
            <DrawerTitle className="font-semibold text-foreground">
              Patrimônio {userName}
            </DrawerTitle>
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Add Portfolio Button */}
          <button
            onClick={onAddPortfolio}
            className="w-full bg-white rounded-2xl p-4 flex items-center gap-4 border border-border shadow-sm active:scale-[0.98] transition-transform"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-500 flex items-center justify-center">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <span className="flex-1 text-left font-medium text-foreground">
              Adicionar nova carteira
            </span>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* Patrimônio Summary Card */}
          <div className="bg-white rounded-2xl p-4 border border-border shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 bg-foreground rounded-full" />
              <h3 className="font-semibold text-foreground">Patrimônio</h3>
            </div>

            {/* Progress Bar */}
            <div className="h-2 bg-slate-100 rounded-full mb-4 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Saldo bruto atual:</span>
                <span className="font-semibold text-foreground">{formatCurrency(totalPatrimonio)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Valor aplicado total:</span>
                <span className="font-semibold text-foreground">{formatCurrency(totalInvestido)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Resultado:</span>
                <span className={`font-semibold ${totalGanhos >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                  {formatCurrency(totalGanhos)}
                </span>
              </div>
            </div>
          </div>

          {/* Minhas Carteiras */}
          <h3 className="text-center font-semibold text-foreground pt-2">
            Minhas carteiras
          </h3>

          {/* Portfolio Cards */}
          <div className="space-y-3">
            {portfolios.length > 0 ? (
              portfolios.map((portfolio, index) => {
                const portfolioPercent = totalPatrimonio > 0 
                  ? (portfolio.total_value / totalPatrimonio) * 100 
                  : 0;
                const portfolioRentabilidade = portfolio.total_gain > 0 && portfolio.total_value > 0
                  ? (portfolio.total_gain / (portfolio.total_value - portfolio.total_gain)) * 100
                  : 0;
                const isPrimary = index === 0 || portfolio.is_primary;
                const isSelected = portfolio.id === selectedPortfolioId || portfolio.is_selected;

                return (
                  <button
                    key={portfolio.id}
                    onClick={() => {
                      onSelectPortfolio(portfolio.id);
                      onOpenChange(false); // Close drawer after selecting
                    }}
                    className={`w-full bg-white rounded-2xl p-4 border shadow-sm text-left active:scale-[0.98] transition-transform ${
                      isSelected ? 'border-cyan-400 ring-2 ring-cyan-400/30' : 'border-border'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isSelected 
                          ? "bg-gradient-to-br from-cyan-400 to-cyan-500" 
                          : isPrimary 
                            ? "bg-gradient-to-br from-cyan-400 to-cyan-500" 
                            : "bg-slate-200"
                      }`}>
                        <Check className={`w-5 h-5 ${isSelected || isPrimary ? "text-white" : "text-slate-400"}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">{portfolio.name}</span>
                          {isSelected && (
                            <span className="text-[10px] bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded font-medium">
                              ATIVA
                            </span>
                          )}
                          {isPrimary && !isSelected && (
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                              PRINCIPAL
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          Atualizada: {formatDate(portfolio.updated_at)}
                        </span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>

                    {/* Progress Bar */}
                    <div className="h-1.5 bg-slate-100 rounded-full mb-4 overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${
                          isPrimary 
                            ? "bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500" 
                            : "bg-primary"
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(portfolioPercent, 100)}%` }}
                        transition={{ duration: 0.6, delay: index * 0.1 }}
                      />
                    </div>

                    {/* Stats */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Saldo bruto atual</span>
                        <span className="font-semibold text-foreground">{formatCurrency(portfolio.total_value)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Rentabilidade</span>
                        <span className={`font-semibold ${portfolioRentabilidade >= 0 ? "text-foreground" : "text-red-500"}`}>
                          {formatPercent(portfolioRentabilidade)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">% do patrimônio</span>
                        <span className="font-semibold text-foreground">{formatPercent(portfolioPercent)}</span>
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="bg-white rounded-2xl p-6 border border-dashed border-border text-center">
                <p className="text-muted-foreground text-sm">
                  Nenhuma carteira cadastrada
                </p>
                <button
                  onClick={onAddPortfolio}
                  className="mt-3 text-primary font-medium text-sm"
                >
                  Criar primeira carteira
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Close Button */}
        <div className="p-4 flex justify-center border-t border-border bg-slate-50">
          <DrawerClose asChild>
            <button className="w-12 h-12 rounded-full bg-slate-300 flex items-center justify-center">
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </DrawerClose>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default PatrimonioDrawer;
