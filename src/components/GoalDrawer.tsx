import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, HelpCircle, ChevronUp, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GoalDrawerProps {
  open: boolean;
  onClose: () => void;
  type: "patrimonio" | "renda_passiva";
  portfolioId: string;
  currentValue?: number;
  onGoalSaved?: () => void;
}

const GoalDrawer = ({ 
  open, 
  onClose, 
  type, 
  portfolioId, 
  currentValue = 0,
  onGoalSaved 
}: GoalDrawerProps) => {
  const [targetDate, setTargetDate] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [existingGoalId, setExistingGoalId] = useState<string | null>(null);
  const [infoExpanded, setInfoExpanded] = useState(false);

  // Format currency input
  const formatCurrencyInput = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    const amount = parseInt(numbers) / 100;
    if (isNaN(amount)) return "";
    return amount.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const parseCurrency = (value: string): number => {
    const numbers = value.replace(/\D/g, "");
    return parseInt(numbers) / 100 || 0;
  };

  // Load existing goal
  useEffect(() => {
    if (open && portfolioId) {
      loadExistingGoal();
    }
  }, [open, portfolioId, type]);

  const loadExistingGoal = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("portfolio_id", portfolioId)
        .eq("type", type)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setExistingGoalId(data.id);
        setTargetValue(formatCurrencyInput((data.target_value * 100).toString()));
        if (data.target_date) {
          const date = new Date(data.target_date);
          setTargetDate(`${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`);
        }
      } else {
        setExistingGoalId(null);
        setTargetValue("");
        setTargetDate("");
      }
    } catch (error) {
      console.error("Error loading goal:", error);
    }
  };

  const handleSave = async () => {
    if (!targetValue || parseCurrency(targetValue) === 0) {
      toast.error("Por favor, defina um objetivo válido");
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Você precisa estar logado");
        return;
      }

      // Parse target date
      let parsedDate: string | null = null;
      if (targetDate) {
        const [month, year] = targetDate.split(".");
        if (month && year && year.length === 4) {
          parsedDate = `${year}-${month.padStart(2, '0')}-01`;
        }
      }

      const goalData = {
        user_id: session.user.id,
        portfolio_id: portfolioId,
        type,
        target_value: parseCurrency(targetValue),
        target_date: parsedDate,
        current_value: currentValue,
      };

      if (existingGoalId) {
        // Update existing goal
        const { error } = await supabase
          .from("goals")
          .update({
            target_value: goalData.target_value,
            target_date: goalData.target_date,
            current_value: goalData.current_value,
          })
          .eq("id", existingGoalId);

        if (error) throw error;
        toast.success("Meta atualizada com sucesso!");
      } else {
        // Create new goal
        const { error } = await supabase
          .from("goals")
          .insert(goalData);

        if (error) throw error;
        toast.success("Meta definida com sucesso!");
      }

      onGoalSaved?.();
      onClose();
    } catch (error: any) {
      console.error("Error saving goal:", error);
      toast.error("Erro ao salvar meta");
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (value: string) => {
    // Only allow digits and dots
    const cleaned = value.replace(/[^\d.]/g, "");
    
    // Format as MM.YYYY
    if (cleaned.length <= 2) {
      setTargetDate(cleaned);
    } else if (cleaned.length <= 7) {
      const month = cleaned.slice(0, 2);
      const year = cleaned.slice(3, 7);
      setTargetDate(`${month}.${year}`);
    }
  };

  const handleValueChange = (value: string) => {
    setTargetValue(formatCurrencyInput(value));
  };

  const isRendaPassiva = type === "renda_passiva";
  const title = isRendaPassiva ? "Definir meta de Renda Passiva" : "Definir meta de Patrimônio";
  const description = isRendaPassiva 
    ? "A meta de renda passiva é feita olhando para a média mensal dos proventos dos últimos 12 meses."
    : "O tempo é o principal aliado da sua meta. Por conta disso, procure investir em ativos de menor liquidez e prazos mais esticados.";

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl max-h-[90vh] overflow-hidden flex flex-col light-theme"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-foreground flex items-center justify-center">
                  <svg className="w-4 h-4 text-background" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="font-medium text-foreground">Criar nova meta</span>
              </div>
              <button onClick={onClose} className="p-2 text-muted-foreground">
                <HelpCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Info section for Renda Passiva */}
              {isRendaPassiva && (
                <>
                  <button 
                    onClick={() => setInfoExpanded(!infoExpanded)}
                    className="w-full flex items-center justify-between py-3 border-b border-border"
                  >
                    <div className="flex items-start gap-2">
                      <div className="w-1 h-5 bg-foreground rounded-full mt-0.5" />
                      <div className="text-left">
                        <p className="font-semibold text-foreground">
                          Média de proventos: {currentValue > 0 ? `R$ ${currentValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "-"}
                        </p>
                        <p className="text-sm text-muted-foreground">Últimos 12 meses</p>
                      </div>
                    </div>
                    {infoExpanded ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </button>

                  <AnimatePresence>
                    {infoExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4 overflow-hidden"
                      >
                        {/* Foco na renda passiva recente */}
                        <div className="border-b border-border pb-4">
                          <div className="flex items-start gap-2 mb-2">
                            <div className="w-1 h-4 bg-foreground rounded-full mt-0.5" />
                            <h4 className="font-semibold text-foreground text-sm">Foco na renda passiva recente</h4>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed pl-3">
                            Ao considerar os últimos 12 meses, estamos focando na sua renda passiva mais recente. 
                            Para fins de aposentadoria, mesmo com o acúmulo ao longo de muitos anos, o que realmente 
                            importa é a renda gerada recentemente. A média histórica completa perde relevância, pois 
                            os ativos mudam de configuração ao longo da jornada, fazendo com que a origem da renda 
                            passiva também seja dinâmica.
                          </p>
                        </div>

                        {/* Diluição no efeito de calendário */}
                        <div className="border-b border-border pb-4">
                          <div className="flex items-start gap-2 mb-2">
                            <div className="w-1 h-4 bg-foreground rounded-full mt-0.5" />
                            <h4 className="font-semibold text-foreground text-sm">Diluição no efeito de calendário</h4>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed pl-3">
                            Ao utilizar a média de renda passiva e não apenas o último mês como referência, estamos 
                            diluindo o efeito de calendário das ações que compõem a carteira. Sabemos que as empresas 
                            têm políticas de distribuição de dividendos diferentes: valores e datas nem sempre são previsíveis.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}

              {/* Title section */}
              <div className="flex items-start gap-2">
                <div className="w-1 h-5 bg-foreground rounded-full mt-0.5" />
                <div>
                  <h3 className="font-semibold text-foreground">{title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{description}</p>
                </div>
              </div>

              {/* Date Input */}
              <div className="bg-muted rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-foreground font-medium">Data fim:</span>
                  <input
                    type="text"
                    value={targetDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                    placeholder="MM.AAAA (opcional)"
                    className="text-right text-muted-foreground bg-transparent border-none focus:outline-none placeholder:text-muted-foreground/50"
                    maxLength={7}
                  />
                </div>
              </div>

              {/* Target Value Input */}
              <div className="bg-muted rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-foreground font-medium">Objetivo:</span>
                  <div className="flex items-center gap-1 text-right">
                    <span className="text-muted-foreground">R$</span>
                    <input
                      type="text"
                      value={targetValue}
                      onChange={(e) => handleValueChange(e.target.value)}
                      placeholder="00,00"
                      className="text-right text-foreground bg-transparent border-none focus:outline-none w-32 placeholder:text-muted-foreground/50"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-4 flex gap-3 border-t border-border safe-area-inset-bottom">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-4 rounded-2xl border border-border text-foreground font-medium active:scale-[0.98] transition-transform"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 py-4 rounded-2xl bg-primary text-primary-foreground font-medium active:scale-[0.98] transition-transform disabled:opacity-50"
              >
                {loading ? "Salvando..." : "Confirmar"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default GoalDrawer;
