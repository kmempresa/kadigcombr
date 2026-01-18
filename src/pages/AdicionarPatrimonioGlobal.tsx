import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Check, 
  ChevronDown, 
  Globe, 
  Loader2,
  Building2,
  Car,
  Briefcase,
  Gem,
  Palette,
  Bitcoin,
  Wallet,
  Package,
  CheckCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Categorias de patrimônio
const categorias = [
  { id: "imoveis", nome: "Imóveis", icon: Building2, cor: "#3b82f6", descricao: "Casas, apartamentos, terrenos" },
  { id: "veiculos", nome: "Veículos", icon: Car, cor: "#10b981", descricao: "Carros, motos, barcos" },
  { id: "empresas", nome: "Empresas", icon: Briefcase, cor: "#8b5cf6", descricao: "Negócios e participações" },
  { id: "joias", nome: "Joias", icon: Gem, cor: "#f59e0b", descricao: "Joias e metais preciosos" },
  { id: "arte", nome: "Arte", icon: Palette, cor: "#ec4899", descricao: "Arte e colecionáveis" },
  { id: "cripto", nome: "Cripto", icon: Bitcoin, cor: "#f97316", descricao: "Criptomoedas e tokens" },
  { id: "poupanca", nome: "Poupança", icon: Wallet, cor: "#06b6d4", descricao: "Poupança e conta corrente" },
  { id: "outros", nome: "Outros", icon: Package, cor: "#64748b", descricao: "Outros bens e ativos" },
];

// Moedas disponíveis
const moedas = [
  { code: "BRL", name: "Real Brasileiro", symbol: "R$", flag: "🇧🇷" },
  { code: "USD", name: "Dólar Americano", symbol: "$", flag: "🇺🇸" },
  { code: "EUR", name: "Euro", symbol: "€", flag: "🇪🇺" },
  { code: "GBP", name: "Libra Esterlina", symbol: "£", flag: "🇬🇧" },
  { code: "CHF", name: "Franco Suíço", symbol: "CHF", flag: "🇨🇭" },
  { code: "JPY", name: "Iene Japonês", symbol: "¥", flag: "🇯🇵" },
  { code: "CAD", name: "Dólar Canadense", symbol: "C$", flag: "🇨🇦" },
  { code: "AUD", name: "Dólar Australiano", symbol: "A$", flag: "🇦🇺" },
  { code: "CNY", name: "Yuan Chinês", symbol: "¥", flag: "🇨🇳" },
  { code: "ARS", name: "Peso Argentino", symbol: "$", flag: "🇦🇷" },
];

const AdicionarPatrimonioGlobal = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [userId, setUserId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Step 1 - Categoria
  const [selectedCategoria, setSelectedCategoria] = useState<string | null>(null);
  
  // Step 2 - Nome e descrição
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  
  // Step 3 - Moeda e valor
  const [selectedMoeda, setSelectedMoeda] = useState("BRL");
  const [valor, setValor] = useState("");
  const [showMoedaSelect, setShowMoedaSelect] = useState(false);
  
  // Cotações
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [loadingRates, setLoadingRates] = useState(false);

  const totalSteps = 4;

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUserId(session.user.id);
    };
    checkAuth();
  }, [navigate]);

  // Fetch exchange rates
  useEffect(() => {
    const fetchExchangeRates = async () => {
      setLoadingRates(true);
      try {
        const response = await fetch(
          "https://api.exchangerate-api.com/v4/latest/BRL"
        );
        if (response.ok) {
          const data = await response.json();
          const rates: Record<string, number> = { BRL: 1 };
          for (const [currency, rate] of Object.entries(data.rates)) {
            rates[currency] = 1 / (rate as number);
          }
          setExchangeRates(rates);
        }
      } catch (error) {
        console.error("Error fetching exchange rates:", error);
        setExchangeRates({
          BRL: 1,
          USD: 5.0,
          EUR: 5.5,
          GBP: 6.3,
          CHF: 5.7,
          JPY: 0.033,
          CAD: 3.7,
          AUD: 3.3,
          CNY: 0.69,
          ARS: 0.005,
        });
      } finally {
        setLoadingRates(false);
      }
    };
    fetchExchangeRates();
  }, []);

  const canAdvance = () => {
    if (step === 1) return selectedCategoria !== null;
    if (step === 2) return nome.trim() !== "";
    if (step === 3) return valor !== "" && parseFloat(valor.replace(/[^\d.,]/g, "").replace(",", ".")) > 0;
    return true;
  };

  const handleNext = () => {
    if (canAdvance() && step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigate("/app");
    }
  };

  const getValorNumerico = () => {
    return parseFloat(valor.replace(/[^\d.,]/g, "").replace(",", ".")) || 0;
  };

  const getValorBRL = () => {
    const valorNum = getValorNumerico();
    const rate = exchangeRates[selectedMoeda] || 1;
    return valorNum * rate;
  };

  const getMoedaInfo = (code: string) => {
    return moedas.find(m => m.code === code) || moedas[0];
  };

  const getCategoriaInfo = (id: string) => {
    return categorias.find(c => c.id === id);
  };

  const handleSave = async () => {
    if (!userId || !selectedCategoria) {
      toast.error("Dados incompletos");
      return;
    }

    setIsSaving(true);
    try {
      const valorNum = getValorNumerico();
      const rate = exchangeRates[selectedMoeda] || 1;
      const valorBRL = valorNum * rate;

      const { error } = await supabase.from("global_assets").insert([{
        user_id: userId,
        name: nome.trim(),
        category: selectedCategoria,
        currency: selectedMoeda,
        original_value: valorNum,
        value_brl: valorBRL,
        exchange_rate: rate,
        notes: descricao.trim() || null,
      }]);

      if (error) throw error;

      toast.success("Patrimônio adicionado com sucesso!");
      navigate("/app");
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Erro ao adicionar patrimônio");
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (value: number, currency = "BRL") => {
    const moeda = getMoedaInfo(currency);
    return `${moeda.symbol} ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Render steps
  const renderStep1 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-foreground">Tipo de Patrimônio</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Selecione a categoria do seu patrimônio
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {categorias.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategoria === cat.id;
          return (
            <motion.button
              key={cat.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedCategoria(cat.id)}
              className={`p-4 rounded-2xl border-2 transition-all text-left ${
                isSelected
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:border-primary/50"
              }`}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                style={{ backgroundColor: `${cat.cor}20` }}
              >
                <Icon className="w-6 h-6" style={{ color: cat.cor }} />
              </div>
              <h3 className="font-semibold text-foreground">{cat.nome}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{cat.descricao}</p>
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <Check className="w-5 h-5 text-primary" />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-foreground">Identificação</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Dê um nome para identificar este patrimônio
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Nome do patrimônio *
          </label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: Apartamento Centro, Tesla Model 3..."
            className="w-full bg-muted rounded-xl p-4 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary text-lg"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Descrição (opcional)
          </label>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Detalhes adicionais, localização, etc..."
            rows={3}
            className="w-full bg-muted rounded-xl p-4 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </div>
      </div>

      {/* Selected category preview */}
      {selectedCategoria && (
        <div className="bg-muted rounded-xl p-4 flex items-center gap-3">
          {(() => {
            const cat = getCategoriaInfo(selectedCategoria);
            if (!cat) return null;
            const Icon = cat.icon;
            return (
              <>
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${cat.cor}20` }}
                >
                  <Icon className="w-5 h-5" style={{ color: cat.cor }} />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{cat.nome}</p>
                  <p className="text-xs text-muted-foreground">{cat.descricao}</p>
                </div>
              </>
            );
          })()}
        </div>
      )}
    </motion.div>
  );

  const renderStep3 = () => {
    const moedaAtual = getMoedaInfo(selectedMoeda);
    
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-6"
      >
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-foreground">Valor do Patrimônio</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Informe o valor e a moeda
          </p>
        </div>

        {/* Moeda selector */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Moeda
          </label>
          <button
            onClick={() => setShowMoedaSelect(true)}
            className="w-full bg-muted rounded-xl p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{moedaAtual.flag}</span>
              <div className="text-left">
                <p className="font-medium text-foreground">{moedaAtual.code}</p>
                <p className="text-xs text-muted-foreground">{moedaAtual.name}</p>
              </div>
            </div>
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          </button>
          
          {selectedMoeda !== "BRL" && exchangeRates[selectedMoeda] && (
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              {loadingRates ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <>
                  Cotação: 1 {selectedMoeda} = R$ {exchangeRates[selectedMoeda]?.toFixed(2)}
                </>
              )}
            </p>
          )}
        </div>

        {/* Valor input */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Valor *
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
              {moedaAtual.symbol}
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="0,00"
              className="w-full bg-muted rounded-xl p-4 pl-12 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary text-2xl font-bold"
            />
          </div>
          
          {valor && selectedMoeda !== "BRL" && (
            <div className="mt-3 bg-primary/10 rounded-xl p-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Valor em Reais:</span>
              <span className="text-lg font-bold text-primary">
                R$ {getValorBRL().toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>

        {/* Moeda Select Modal */}
        <AnimatePresence>
          {showMoedaSelect && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-end"
              onClick={() => setShowMoedaSelect(false)}
            >
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full bg-card rounded-t-3xl max-h-[70vh] overflow-hidden"
              >
                <div className="p-4 border-b border-border">
                  <h3 className="text-lg font-semibold text-center text-foreground">
                    Selecionar Moeda
                  </h3>
                </div>
                <div className="overflow-y-auto max-h-[50vh] p-4 space-y-2">
                  {moedas.map((moeda) => (
                    <button
                      key={moeda.code}
                      onClick={() => {
                        setSelectedMoeda(moeda.code);
                        setShowMoedaSelect(false);
                      }}
                      className={`w-full p-4 rounded-xl flex items-center gap-3 transition-all ${
                        selectedMoeda === moeda.code
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted hover:bg-muted/80"
                      }`}
                    >
                      <span className="text-2xl">{moeda.flag}</span>
                      <div className="flex-1 text-left">
                        <p className="font-medium">{moeda.code}</p>
                        <p className={`text-xs ${selectedMoeda === moeda.code ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                          {moeda.name}
                        </p>
                      </div>
                      {selectedMoeda === moeda.code && (
                        <Check className="w-5 h-5" />
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  const renderStep4 = () => {
    const cat = getCategoriaInfo(selectedCategoria || "");
    const moeda = getMoedaInfo(selectedMoeda);
    
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-6"
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-success" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Confirmar Patrimônio</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Revise os dados antes de salvar
          </p>
        </div>

        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          {/* Header with category */}
          <div className="p-4 border-b border-border flex items-center gap-3">
            {cat && (
              <>
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${cat.cor}20` }}
                >
                  {(() => {
                    const Icon = cat.icon;
                    return <Icon className="w-6 h-6" style={{ color: cat.cor }} />;
                  })()}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{nome}</p>
                  <p className="text-sm text-muted-foreground">{cat.nome}</p>
                </div>
              </>
            )}
          </div>

          {/* Details */}
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Valor original</span>
              <span className="font-semibold text-foreground">
                {moeda.flag} {formatCurrency(getValorNumerico(), selectedMoeda)}
              </span>
            </div>
            
            {selectedMoeda !== "BRL" && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Cotação</span>
                  <span className="text-foreground">
                    1 {selectedMoeda} = R$ {exchangeRates[selectedMoeda]?.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="text-muted-foreground">Valor em Reais</span>
                  <span className="font-bold text-lg text-primary">
                    R$ {getValorBRL().toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </>
            )}

            {selectedMoeda === "BRL" && (
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-muted-foreground">Valor total</span>
                <span className="font-bold text-lg text-primary">
                  R$ {getValorNumerico().toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}

            {descricao && (
              <div className="pt-2 border-t border-border">
                <span className="text-sm text-muted-foreground block mb-1">Observações</span>
                <p className="text-foreground">{descricao}</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4 safe-area-inset-top">
        <button
          onClick={handleBack}
          className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-primary" />
          <h1 className="font-semibold text-foreground">Patrimônio Global</h1>
        </div>

        <div className="w-10" />
      </header>

      {/* Progress bar */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Passo {step} de {totalSteps}</span>
          <span className="text-sm font-medium text-primary">{Math.round((step / totalSteps) * 100)}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-accent"
            initial={{ width: 0 }}
            animate={{ width: `${(step / totalSteps) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 pb-32 overflow-y-auto">
        <AnimatePresence mode="wait">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </AnimatePresence>
      </div>

      {/* Bottom action */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent pt-8 safe-area-inset-bottom">
        {step < totalSteps ? (
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleNext}
            disabled={!canAdvance()}
            className="w-full bg-primary text-primary-foreground rounded-2xl p-4 font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            Continuar
          </motion.button>
        ) : (
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-2xl p-4 font-semibold text-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Adicionar Patrimônio
              </>
            )}
          </motion.button>
        )}
      </div>
    </div>
  );
};

export default AdicionarPatrimonioGlobal;
