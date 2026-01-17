import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, ChevronRight, ChevronDown, Check, Edit, Trash2, ArrowRightLeft } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import kadigLogo from "@/assets/kadig-logo.png";

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
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [selectedPortfolioForAction, setSelectedPortfolioForAction] = useState<Portfolio | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePortfolioClick = (portfolio: Portfolio) => {
    setSelectedPortfolioForAction(portfolio);
    setPreferencesOpen(true);
  };

  const handleGoToPortfolio = async () => {
    if (!selectedPortfolioForAction) return;
    
    setPreferencesOpen(false);
    setIsLoading(true);
    
    // Wait 3 seconds before changing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    onSelectPortfolio(selectedPortfolioForAction.id);
    setIsLoading(false);
    onOpenChange(false);
    setSelectedPortfolioForAction(null);
  };

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
      <DrawerContent className="light-theme bg-muted max-h-[90vh]">
        <DrawerHeader className="border-b border-border bg-card px-4 py-3">
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
            className="w-full bg-card rounded-2xl p-4 flex items-center gap-4 border border-border shadow-sm active:scale-[0.98] transition-transform"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Plus className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="flex-1 text-left font-medium text-foreground">
              Adicionar nova carteira
            </span>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* Patrimônio Summary Card */}
          <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 bg-foreground rounded-full" />
              <h3 className="font-semibold text-foreground">Patrimônio</h3>
            </div>

            {/* Progress Bar */}
            <div className="h-2 bg-muted rounded-full mb-4 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary via-accent to-primary rounded-full"
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
                <span className={`font-semibold ${totalGanhos >= 0 ? "text-success" : "text-destructive"}`}>
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
                    onClick={() => handlePortfolioClick(portfolio)}
                    className={`w-full bg-card rounded-2xl p-4 border shadow-sm text-left active:scale-[0.98] transition-transform ${
                      isSelected ? 'border-primary ring-2 ring-primary/30' : 'border-border'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isSelected 
                          ? "bg-gradient-to-br from-primary to-accent" 
                          : isPrimary 
                            ? "bg-gradient-to-br from-primary to-accent" 
                            : "bg-muted"
                      }`}>
                        <Check className={`w-5 h-5 ${isSelected || isPrimary ? "text-primary-foreground" : "text-muted-foreground"}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">{portfolio.name}</span>
                          {isSelected && (
                            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-medium">
                              ATIVA
                            </span>
                          )}
                          {isPrimary && !isSelected && (
                            <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded font-medium">
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
                    <div className="h-1.5 bg-muted rounded-full mb-4 overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${
                          isPrimary 
                            ? "bg-gradient-to-r from-primary via-accent to-primary" 
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
              <div className="bg-card rounded-2xl p-6 border border-dashed border-border text-center">
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
        <div className="p-4 flex justify-center border-t border-border bg-muted">
          <DrawerClose asChild>
            <button className="w-12 h-12 rounded-full bg-muted-foreground/30 flex items-center justify-center">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </DrawerClose>
        </div>

        {/* Preferences Bottom Sheet */}
        <AnimatePresence>
          {preferencesOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/30 z-50"
              onClick={() => setPreferencesOpen(false)}
            >
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl"
              >
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-center text-foreground mb-6">
                    Preferência da carteira
                  </h3>

                  <div className="space-y-3 mb-4">
                    <button className="w-full bg-muted rounded-2xl p-4 flex items-center gap-4 active:scale-[0.98] transition-transform">
                      <div className="w-12 h-12 rounded-full bg-muted-foreground/20 flex items-center justify-center">
                        <Edit className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <span className="flex-1 text-left font-medium text-foreground">
                        Editar carteira
                      </span>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </button>

                    <button className="w-full bg-muted rounded-2xl p-4 flex items-center gap-4 active:scale-[0.98] transition-transform">
                      <div className="w-12 h-12 rounded-full bg-muted-foreground/20 flex items-center justify-center">
                        <Trash2 className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <span className="flex-1 text-left font-medium text-foreground">
                        Excluir carteira
                      </span>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </button>
                  </div>

                  <button 
                    onClick={handleGoToPortfolio}
                    className="w-full bg-background rounded-2xl p-4 flex items-center gap-4 border border-border active:scale-[0.98] transition-transform"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <ArrowRightLeft className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <span className="flex-1 text-left font-medium text-foreground">
                      Ir para esta carteira
                    </span>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>

                <div className="p-4 flex justify-center">
                  <button 
                    onClick={() => setPreferencesOpen(false)}
                    className="w-12 h-12 rounded-full bg-muted-foreground/30 flex items-center justify-center"
                  >
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading Overlay */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gradient-to-b from-background to-card z-[100] flex flex-col items-center justify-center"
            >
              <motion.img
                src={kadigLogo}
                alt="Kadig"
                className="w-24 h-24 mb-6"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-2"
              >
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-4 text-muted-foreground text-sm"
              >
                Carregando carteira...
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </DrawerContent>
    </Drawer>
  );
};

export default PatrimonioDrawer;
