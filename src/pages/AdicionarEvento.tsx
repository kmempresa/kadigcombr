import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Loader2, Check, Calendar, DollarSign, TrendingUp, Gift, Percent, ArrowUpDown } from "lucide-react";
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
  quantity: number | null;
  portfolio_id: string;
}

type EventType = "dividendo" | "jcp" | "rendimento" | "bonificacao" | "desdobramento" | "grupamento" | "amortizacao";

interface EventOption {
  type: EventType;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const eventOptions: EventOption[] = [
  { type: "dividendo", label: "Dividendos", description: "Distribuição de lucros em dinheiro", icon: <DollarSign className="w-5 h-5" />, color: "text-green-500" },
  { type: "jcp", label: "JCP", description: "Juros sobre Capital Próprio", icon: <Percent className="w-5 h-5" />, color: "text-blue-500" },
  { type: "rendimento", label: "Rendimento", description: "Rendimento de renda fixa ou fundos", icon: <TrendingUp className="w-5 h-5" />, color: "text-cyan-500" },
  { type: "bonificacao", label: "Bonificação", description: "Recebimento de novas ações", icon: <Gift className="w-5 h-5" />, color: "text-purple-500" },
  { type: "desdobramento", label: "Desdobramento", description: "Split de ações", icon: <ArrowUpDown className="w-5 h-5" />, color: "text-orange-500" },
  { type: "grupamento", label: "Grupamento", description: "Agrupamento de ações", icon: <ArrowUpDown className="w-5 h-5 rotate-180" />, color: "text-red-500" },
  { type: "amortizacao", label: "Amortização", description: "Devolução de capital investido", icon: <DollarSign className="w-5 h-5" />, color: "text-yellow-500" },
];

const AdicionarEvento = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { refreshPortfolios } = usePortfolio();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Data
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  const [selectedEventType, setSelectedEventType] = useState<EventType | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Form data
  const [eventValue, setEventValue] = useState("");
  const [eventQuantity, setEventQuantity] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventNotes, setEventNotes] = useState("");
  const [splitRatio, setSplitRatio] = useState("2"); // Para desdobramento/grupamento

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
    setStep(2);
  };

  const handleSelectEventType = (eventType: EventType) => {
    setSelectedEventType(eventType);
    setStep(3);
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const handleSave = async () => {
    if (!selectedInvestment || !selectedEventType) return;
    
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

      const eventVal = parseFloat(eventValue) || 0;
      const eventQty = parseFloat(eventQuantity) || 0;

      // Handle different event types
      if (selectedEventType === "dividendo" || selectedEventType === "jcp" || selectedEventType === "rendimento" || selectedEventType === "amortizacao") {
        // Cash events - register movement
        await supabase.from("movements").insert({
          user_id: session.user.id,
          portfolio_id: selectedInvestment.portfolio_id,
          investment_id: selectedInvestment.id,
          type: selectedEventType,
          asset_name: selectedInvestment.asset_name,
          ticker: selectedInvestment.ticker,
          asset_type: selectedInvestment.asset_type,
          quantity: 0,
          unit_price: eventVal,
          total_value: eventVal,
          portfolio_name: portfolio.data?.name || "Carteira",
          notes: eventNotes || `Evento: ${eventOptions.find(e => e.type === selectedEventType)?.label}`,
          movement_date: eventDate || new Date().toISOString().split("T")[0],
        });

        toast.success(`${eventOptions.find(e => e.type === selectedEventType)?.label} registrado com sucesso!`);
      } else if (selectedEventType === "bonificacao") {
        // Stock bonus - add quantity
        const originalQty = selectedInvestment.quantity || 0;
        const newQuantity = originalQty + eventQty;
        const currentPrice = selectedInvestment.current_value / originalQty;
        const newCurrentValue = newQuantity * currentPrice;

        await supabase
          .from("investments")
          .update({
            quantity: newQuantity,
            current_value: newCurrentValue,
            updated_at: new Date().toISOString(),
          })
          .eq("id", selectedInvestment.id);

        await supabase.from("movements").insert({
          user_id: session.user.id,
          portfolio_id: selectedInvestment.portfolio_id,
          investment_id: selectedInvestment.id,
          type: "bonificacao",
          asset_name: selectedInvestment.asset_name,
          ticker: selectedInvestment.ticker,
          asset_type: selectedInvestment.asset_type,
          quantity: eventQty,
          unit_price: 0,
          total_value: 0,
          portfolio_name: portfolio.data?.name || "Carteira",
          notes: eventNotes || `Bonificação: +${eventQty} ações`,
          movement_date: eventDate || new Date().toISOString().split("T")[0],
        });

        toast.success(`Bonificação de ${eventQty} ações registrada!`);
      } else if (selectedEventType === "desdobramento") {
        // Stock split - multiply quantity
        const ratio = parseFloat(splitRatio) || 2;
        const originalQty = selectedInvestment.quantity || 0;
        const newQuantity = originalQty * ratio;
        const originalPrice = selectedInvestment.current_value / originalQty;
        const newPrice = originalPrice / ratio;

        await supabase
          .from("investments")
          .update({
            quantity: newQuantity,
            current_price: newPrice,
            purchase_price: (selectedInvestment.current_value / originalQty) / ratio,
            updated_at: new Date().toISOString(),
          })
          .eq("id", selectedInvestment.id);

        await supabase.from("movements").insert({
          user_id: session.user.id,
          portfolio_id: selectedInvestment.portfolio_id,
          investment_id: selectedInvestment.id,
          type: "desdobramento",
          asset_name: selectedInvestment.asset_name,
          ticker: selectedInvestment.ticker,
          asset_type: selectedInvestment.asset_type,
          quantity: newQuantity - originalQty,
          unit_price: 0,
          total_value: 0,
          portfolio_name: portfolio.data?.name || "Carteira",
          notes: eventNotes || `Desdobramento ${ratio}:1`,
          movement_date: eventDate || new Date().toISOString().split("T")[0],
        });

        toast.success(`Desdobramento ${ratio}:1 registrado!`);
      } else if (selectedEventType === "grupamento") {
        // Reverse split - divide quantity
        const ratio = parseFloat(splitRatio) || 2;
        const originalQty = selectedInvestment.quantity || 0;
        const newQuantity = Math.floor(originalQty / ratio);
        const originalPrice = selectedInvestment.current_value / originalQty;
        const newPrice = originalPrice * ratio;
        const newCurrentValue = newQuantity * newPrice;

        await supabase
          .from("investments")
          .update({
            quantity: newQuantity,
            current_price: newPrice,
            current_value: newCurrentValue,
            purchase_price: (selectedInvestment.current_value / originalQty) * ratio,
            updated_at: new Date().toISOString(),
          })
          .eq("id", selectedInvestment.id);

        await supabase.from("movements").insert({
          user_id: session.user.id,
          portfolio_id: selectedInvestment.portfolio_id,
          investment_id: selectedInvestment.id,
          type: "grupamento",
          asset_name: selectedInvestment.asset_name,
          ticker: selectedInvestment.ticker,
          asset_type: selectedInvestment.asset_type,
          quantity: originalQty - newQuantity,
          unit_price: 0,
          total_value: 0,
          portfolio_name: portfolio.data?.name || "Carteira",
          notes: eventNotes || `Grupamento 1:${ratio}`,
          movement_date: eventDate || new Date().toISOString().split("T")[0],
        });

        toast.success(`Grupamento 1:${ratio} registrado!`);
      }

      await refreshPortfolios();
      navigate("/app");
    } catch (error) {
      console.error("Error saving event:", error);
      toast.error("Erro ao salvar evento");
    } finally {
      setSaving(false);
    }
  };

  const themeClass = theme === "light" ? "light-theme" : "";
  const totalSteps = 3;

  const goBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigate("/app");
    }
  };

  const getSelectedEventOption = () => eventOptions.find(e => e.type === selectedEventType);

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
          onClick={goBack}
          className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="font-semibold text-foreground">Novo Evento</h1>
          <p className="text-sm text-muted-foreground">Passo {step} de {totalSteps}</p>
        </div>
      </header>

      {/* Progress */}
      <div className="h-1 bg-muted">
        <motion.div
          className="h-full bg-gradient-to-r from-kadig-blue to-kadig-cyan"
          initial={{ width: 0 }}
          animate={{ width: `${(step / totalSteps) * 100}%` }}
        />
      </div>

      <div className="p-4">
        {/* Step 1: Select Asset */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <h2 className="text-lg font-semibold text-foreground">Selecione o ativo</h2>
            <p className="text-sm text-muted-foreground">
              Escolha o ativo para registrar o evento
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
                        <p className="text-sm text-muted-foreground">{inv.ticker || inv.asset_type}</p>
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

        {/* Step 2: Select Event Type */}
        {step === 2 && selectedInvestment && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <h2 className="text-lg font-semibold text-foreground">Tipo de evento</h2>
            
            {/* Selected Asset Info */}
            <div className="bg-gradient-to-r from-kadig-blue/10 to-kadig-cyan/10 border border-primary/20 rounded-2xl p-4">
              <p className="font-medium text-foreground">{selectedInvestment.asset_name}</p>
              <p className="text-sm text-muted-foreground">{selectedInvestment.ticker || selectedInvestment.asset_type}</p>
            </div>

            {/* Event Types Grid */}
            <div className="grid grid-cols-1 gap-3">
              {eventOptions.map((option) => (
                <button
                  key={option.type}
                  onClick={() => handleSelectEventType(option.type)}
                  className="w-full bg-card border border-border rounded-2xl p-4 text-left active:scale-[0.98] transition-all hover:border-primary/50"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-muted flex items-center justify-center ${option.color}`}>
                      {option.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{option.label}</p>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Step 3: Event Details */}
        {step === 3 && selectedInvestment && selectedEventType && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <h2 className="text-lg font-semibold text-foreground">Detalhes do evento</h2>
            
            {/* Selected Info */}
            <div className="bg-gradient-to-r from-kadig-blue/10 to-kadig-cyan/10 border border-primary/20 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-muted flex items-center justify-center ${getSelectedEventOption()?.color}`}>
                  {getSelectedEventOption()?.icon}
                </div>
                <div>
                  <p className="font-medium text-foreground">{getSelectedEventOption()?.label}</p>
                  <p className="text-sm text-muted-foreground">{selectedInvestment.asset_name}</p>
                </div>
              </div>
            </div>

            {/* Form Fields based on event type */}
            <div className="space-y-4">
              {/* Cash Events */}
              {(selectedEventType === "dividendo" || selectedEventType === "jcp" || selectedEventType === "rendimento" || selectedEventType === "amortizacao") && (
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Valor recebido (R$)</label>
                  <input
                    type="number"
                    value={eventValue}
                    onChange={(e) => setEventValue(e.target.value)}
                    placeholder="0,00"
                    className="w-full bg-muted rounded-2xl p-4 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}

              {/* Bonification */}
              {selectedEventType === "bonificacao" && (
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Quantidade de ações recebidas</label>
                  <input
                    type="number"
                    value={eventQuantity}
                    onChange={(e) => setEventQuantity(e.target.value)}
                    placeholder="0"
                    className="w-full bg-muted rounded-2xl p-4 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}

              {/* Split/Reverse Split */}
              {(selectedEventType === "desdobramento" || selectedEventType === "grupamento") && (
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">
                    {selectedEventType === "desdobramento" ? "Proporção (ex: 2 para 2:1)" : "Proporção (ex: 10 para 1:10)"}
                  </label>
                  <input
                    type="number"
                    value={splitRatio}
                    onChange={(e) => setSplitRatio(e.target.value)}
                    placeholder="2"
                    min="2"
                    className="w-full bg-muted rounded-2xl p-4 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    {selectedEventType === "desdobramento" 
                      ? `Suas ${selectedInvestment.quantity} ações se tornarão ${(selectedInvestment.quantity || 0) * (parseFloat(splitRatio) || 2)} ações`
                      : `Suas ${selectedInvestment.quantity} ações se tornarão ${Math.floor((selectedInvestment.quantity || 0) / (parseFloat(splitRatio) || 2))} ações`
                    }
                  </p>
                </div>
              )}

              {/* Date */}
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Data do evento
                </label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full bg-muted rounded-2xl p-4 text-foreground outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Observações (opcional)</label>
                <textarea
                  value={eventNotes}
                  onChange={(e) => setEventNotes(e.target.value)}
                  placeholder="Adicione uma nota..."
                  rows={3}
                  className="w-full bg-muted rounded-2xl p-4 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>
            </div>

            {/* Summary for cash events */}
            {eventValue && (selectedEventType === "dividendo" || selectedEventType === "jcp" || selectedEventType === "rendimento" || selectedEventType === "amortizacao") && (
              <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
                <h3 className="font-medium text-foreground">Resumo</h3>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Valor a registrar:</span>
                  <span className="text-green-500 font-medium">
                    + {formatCurrency(parseFloat(eventValue) || 0)}
                  </span>
                </div>
              </div>
            )}

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving || (
                (selectedEventType === "dividendo" || selectedEventType === "jcp" || selectedEventType === "rendimento" || selectedEventType === "amortizacao") && !eventValue
              ) || (
                selectedEventType === "bonificacao" && !eventQuantity
              )}
              className="w-full bg-gradient-to-r from-kadig-blue to-kadig-cyan text-white rounded-2xl p-4 font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Confirmar Evento
                </>
              )}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AdicionarEvento;
